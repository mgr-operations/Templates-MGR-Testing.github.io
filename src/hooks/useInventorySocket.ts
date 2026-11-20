import { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_PRODUCTS } from '../data/catalog';
import {
  InventoryEvent,
  OrderConfirmation,
  OrderRequest,
  Product,
  ServerMessage,
  StockShortage,
} from '../types/store';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting';

export interface OrderSubmitResult {
  ok: boolean;
  confirmation?: OrderConfirmation;
  error?: string;
  shortages?: StockShortage[];
}

export function useInventorySocket() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [events, setEvents] = useState<InventoryEvent[]>([]);
  const [activeShoppers, setActiveShoppers] = useState<number>(1);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [lastUpdatedSku, setLastUpdatedSku] = useState<string | null>(null);
  const [latestEvent, setLatestEvent] = useState<InventoryEvent | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  const unmountedRef = useRef<boolean>(false);

  const highlightSku = useCallback((sku: string, event: InventoryEvent) => {
    setLastUpdatedSku(sku);
    setLatestEvent(event);
    if (flashTimerRef.current) {
      window.clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = window.setTimeout(() => {
      setLastUpdatedSku(null);
    }, 2200);
  }, []);

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog');
      if (!res.ok) return;
      const data = (await res.json()) as {
        products: Product[];
        events: InventoryEvent[];
        activeShoppers: number;
      };
      if (!unmountedRef.current) {
        setProducts(data.products);
        setEvents(data.events);
        setActiveShoppers(data.activeShoppers);
      }
    } catch {
      // Initial fallback stays active until WS connects
    }
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    void fetchSnapshot();

    function connect() {
      if (unmountedRef.current) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (unmountedRef.current) return;
        retryCountRef.current = 0;
        setConnectionStatus('connected');
      };

      socket.onmessage = (msgEvent) => {
        if (unmountedRef.current) return;
        try {
          const payload = JSON.parse(msgEvent.data) as ServerMessage;
          if (payload.type === 'inventory:init') {
            setProducts(payload.products);
            setEvents(payload.events);
            setActiveShoppers(payload.activeShoppers);
          } else if (payload.type === 'inventory:update') {
            setProducts(payload.products);
            setActiveShoppers(payload.activeShoppers);
            setEvents((prev) => {
              if (prev.some((e) => e.id === payload.event.id)) {
                return prev;
              }
              return [payload.event, ...prev].slice(0, 25);
            });
            highlightSku(payload.event.sku, payload.event);
          } else if (payload.type === 'presence:update') {
            setActiveShoppers(payload.activeShoppers);
          }
        } catch {
          // Ignore malformed frame
        }
      };

      socket.onclose = () => {
        if (unmountedRef.current) return;
        setConnectionStatus('reconnecting');
        const delay = Math.min(8000, 1000 * Math.pow(1.6, retryCountRef.current));
        retryCountRef.current += 1;
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      socket.onerror = () => {
        socket.close();
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (flashTimerRef.current) {
        window.clearTimeout(flashTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, [fetchSnapshot, highlightSku]);

  const placeOrder = useCallback(async (order: OrderRequest): Promise<OrderSubmitResult> => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.products) {
          setProducts(data.products as Product[]);
        }
        return {
          ok: false,
          error: data.error || 'Unable to complete order.',
          shortages: data.shortages as StockShortage[] | undefined,
        };
      }

      return {
        ok: true,
        confirmation: data as OrderConfirmation,
      };
    } catch {
      return {
        ok: false,
        error: 'Network error while submitting your order. Please try again.',
      };
    }
  }, []);

  const adjustInventory = useCallback(
    async (productId: string, variantId: string, delta: number, reason?: string) => {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, variantId, delta, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Inventory update failed');
      }
      return data as { products: Product[]; event: InventoryEvent };
    },
    []
  );

  return {
    products,
    events,
    activeShoppers,
    connectionStatus,
    lastUpdatedSku,
    latestEvent,
    placeOrder,
    adjustInventory,
  };
}
