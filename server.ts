import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { INITIAL_PRODUCTS } from './src/data/catalog';
import {
  InventoryEvent,
  OrderConfirmation,
  OrderLineSummary,
  OrderRequest,
  Product,
  ServerMessage,
  StockShortage,
} from './src/types/store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Authoritative server-side release license inventory
const products: Product[] = structuredClone(INITIAL_PRODUCTS);
const recentEvents: InventoryEvent[] = [
  {
    id: 'evt-boot-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    type: 'order',
    productName: 'Client Delivery',
    variantName: 'Agency + Portal Customization',
    sku: 'MGR-DLV-GD',
    delta: -1,
    remaining: 1,
    message: 'Order #MGR-1040 claimed 1 agency slot · 1 left',
  },
  {
    id: 'evt-boot-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    type: 'restock',
    productName: 'Operations HQ',
    variantName: 'Team License (Up to 15 seats)',
    sku: 'MGR-OPS-TM',
    delta: 5,
    remaining: 9,
    message: 'Release Wave 2 opened +5 team licenses · 9 available',
  },
];

let nextOrderNumber = 1042;

function pushEvent(event: InventoryEvent) {
  recentEvents.unshift(event);
  if (recentEvents.length > 25) {
    recentEvents.length = 25;
  }
}

function generateLicenseKey(sku: string, orderNumber: string): string {
  const randomSeg = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${sku}-${orderNumber.replace('MGR-', '')}-${randomSeg}`;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  function getActiveShoppers() {
    let count = 0;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        count += 1;
      }
    });
    return Math.max(1, count);
  }

  function broadcast(payload: ServerMessage, exclude?: WebSocket) {
    const serialized = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    });
  }

  wss.on('connection', (ws) => {
    const activeShoppers = getActiveShoppers();
    const initPayload: ServerMessage = {
      type: 'inventory:init',
      products,
      events: recentEvents,
      activeShoppers,
    };
    ws.send(JSON.stringify(initPayload));

    broadcast(
      {
        type: 'presence:update',
        activeShoppers,
      },
      ws
    );

    ws.on('close', () => {
      broadcast({
        type: 'presence:update',
        activeShoppers: getActiveShoppers(),
      });
    });
  });

  // Compatibility route referenced in templates.html + full catalog route
  app.get('/api/templates', (_req, res) => {
    res.json({
      templates: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.name,
        description: p.shortDescription,
        category: p.category,
        price: p.price,
        variants: p.variants,
      })),
    });
  });

  app.get('/api/catalog', (_req, res) => {
    res.json({
      products,
      events: recentEvents,
      activeShoppers: getActiveShoppers(),
    });
  });

  // Atomic checkout & license inventory deduction
  app.post('/api/orders', (req, res) => {
    const body = req.body as OrderRequest;

    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: 'Your bag is empty.' });
    }

    if (
      !body.shipping?.fullName?.trim() ||
      !body.shipping?.email?.trim() ||
      !body.shipping?.phone?.trim() ||
      !body.shipping?.companyName?.trim()
    ) {
      return res.status(400).json({ error: 'Please complete all required buyer and company fields.' });
    }

    const shortages: StockShortage[] = [];
    const resolvedLines: Array<{
      product: Product;
      variantIndex: number;
      quantity: number;
      unitPrice: number;
    }> = [];

    for (const item of body.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ error: 'Invalid license quantity requested.' });
      }
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return res.status(404).json({ error: `Template ${item.productId} not found.` });
      }
      const variantIndex = product.variants.findIndex((v) => v.id === item.variantId);
      if (variantIndex === -1) {
        return res.status(404).json({ error: `License tier ${item.variantId} not found.` });
      }
      const variant = product.variants[variantIndex];
      if (variant.stock < item.quantity) {
        shortages.push({
          productId: product.id,
          variantId: variant.id,
          sku: variant.sku,
          productName: product.name,
          variantName: variant.name,
          requested: item.quantity,
          available: variant.stock,
        });
      } else {
        resolvedLines.push({
          product,
          variantIndex,
          quantity: item.quantity,
          unitPrice: product.price + (variant.priceDelta ?? 0),
        });
      }
    }

    if (shortages.length > 0) {
      return res.status(409).json({
        error: 'Release license inventory updated while checking out. Please review adjusted quantities.',
        shortages,
        products,
      });
    }

    const orderNumber = `MGR-${nextOrderNumber++}`;
    const orderItems: OrderLineSummary[] = [];
    let subtotal = 0;

    for (const line of resolvedLines) {
      const variant = line.product.variants[line.variantIndex];
      variant.stock -= line.quantity;

      const lineTotal = line.unitPrice * line.quantity;
      subtotal += lineTotal;

      orderItems.push({
        productId: line.product.id,
        variantId: variant.id,
        productName: line.product.name,
        variantName: variant.name,
        sku: variant.sku,
        licenseKey: generateLicenseKey(variant.sku, orderNumber),
        accessUrl: `https://mgropsolutions.com/access/${line.product.slug}?license=${orderNumber}`,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal,
      });

      const evt: InventoryEvent = {
        id: `evt-${Date.now()}-${variant.sku}`,
        timestamp: new Date().toISOString(),
        type: 'order',
        productName: line.product.name,
        variantName: variant.name,
        sku: variant.sku,
        delta: -line.quantity,
        remaining: variant.stock,
        message: `Order #${orderNumber} (${line.quantity}×) · ${
          variant.stock === 0 ? 'Batch sold out' : `${variant.stock} left`
        }`,
      };
      pushEvent(evt);

      broadcast({
        type: 'inventory:update',
        products,
        event: evt,
        activeShoppers: getActiveShoppers(),
      });
    }

    const shippingCost = body.shippingMethod === 'guided' ? 95 : 0;
    const tax = 0;
    const total = subtotal + shippingCost + tax;

    const confirmation: OrderConfirmation = {
      orderNumber,
      placedAt: new Date().toISOString(),
      status:
        body.payment.method === 'invoice'
          ? 'Confirmed (Net-7 Invoice) — Access Issued'
          : 'Confirmed — Instant Template Access Ready',
      items: orderItems,
      subtotal,
      shippingCost,
      tax,
      total,
      shipping: body.shipping,
      shippingMethod: body.shippingMethod,
      payment: body.payment,
    };

    return res.status(201).json(confirmation);
  });

  // Real-time release capacity adjustment
  app.post('/api/inventory/adjust', (req, res) => {
    const { productId, variantId, delta, reason } = req.body as {
      productId: string;
      variantId: string;
      delta: number;
      reason?: string;
    };

    if (!Number.isInteger(delta) || delta === 0) {
      return res.status(400).json({ error: 'Delta must be a non-zero integer.' });
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      return res.status(404).json({ error: 'License tier not found.' });
    }

    if (variant.stock + delta < 0) {
      return res.status(409).json({
        error: `Cannot reduce ${variant.sku} below 0 (current stock: ${variant.stock}).`,
      });
    }

    variant.stock += delta;
    const eventType: InventoryEvent['type'] = delta > 0 ? 'restock' : 'adjustment';
    const evt: InventoryEvent = {
      id: `evt-${Date.now()}-${variant.sku}`,
      timestamp: new Date().toISOString(),
      type: eventType,
      productName: product.name,
      variantName: variant.name,
      sku: variant.sku,
      delta,
      remaining: variant.stock,
      message:
        reason?.trim() ||
        (delta > 0
          ? `MGR Studio released +${delta} licenses · ${variant.stock} available`
          : `Remote team claimed ${Math.abs(delta)} license · ${
              variant.stock === 0 ? 'Batch sold out' : `${variant.stock} left`
            }`),
    };

    pushEvent(evt);

    broadcast({
      type: 'inventory:update',
      products,
      event: evt,
      activeShoppers: getActiveShoppers(),
    });

    return res.json({ products, event: evt });
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`MGR Solutions server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
