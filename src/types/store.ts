export type ProductCategory = 'All' | 'Operations' | 'Sales' | 'Delivery' | 'Automation';

export type CoverTone = 'operations' | 'sales' | 'delivery';

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  swatchHex: string;
  stock: number;
  priceDelta?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: Exclude<ProductCategory, 'All'>;
  price: number;
  shortDescription: string;
  description: string;
  includes: string;
  platform: string;
  leadTime: string;
  coverEyebrow: string;
  coverTitle: string;
  coverTone: CoverTone;
  variants: ProductVariant[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface InventoryEvent {
  id: string;
  timestamp: string;
  type: 'order' | 'restock' | 'adjustment';
  productName: string;
  variantName: string;
  sku: string;
  delta: number;
  remaining: number;
  message: string;
}

export type DeliveryTier = 'instant' | 'guided';
export type PaymentMethod = 'card' | 'invoice';

export interface CheckoutBuyerDetails {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  teamSize: string;
  country: string;
  notes?: string;
}

export interface CheckoutPaymentDetails {
  method: PaymentMethod;
  cardLast4?: string;
  cardholderName?: string;
}

export interface OrderRequest {
  items: CartItem[];
  shipping: CheckoutBuyerDetails;
  shippingMethod: DeliveryTier;
  payment: CheckoutPaymentDetails;
}

export interface OrderLineSummary {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  licenseKey: string;
  accessUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderConfirmation {
  orderNumber: string;
  placedAt: string;
  status: string;
  items: OrderLineSummary[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shipping: CheckoutBuyerDetails;
  shippingMethod: DeliveryTier;
  payment: CheckoutPaymentDetails;
}

export interface StockShortage {
  productId: string;
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  requested: number;
  available: number;
}

export type ServerMessage =
  | {
      type: 'inventory:init';
      products: Product[];
      events: InventoryEvent[];
      activeShoppers: number;
    }
  | {
      type: 'inventory:update';
      products: Product[];
      event: InventoryEvent;
      activeShoppers: number;
    }
  | {
      type: 'presence:update';
      activeShoppers: number;
    };
