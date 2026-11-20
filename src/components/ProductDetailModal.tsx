import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Minus,
  Plus,
  Zap,
  X,
  XCircle,
} from 'lucide-react';
import { CartItem, Product } from '../types/store';
import { TemplateCover } from './TemplateCover';

interface ProductDetailModalProps {
  product: Product | null;
  initialVariantId?: string;
  cartItems: CartItem[];
  onClose: () => void;
  onAddToCart: (productId: string, variantId: string, quantity: number) => void;
  onBuyNow: (productId: string, variantId: string, quantity: number) => void;
}

export function ProductDetailModal({
  product,
  initialVariantId,
  cartItems,
  onClose,
  onAddToCart,
  onBuyNow,
}: ProductDetailModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (!product) return;
    const fallback = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
    setSelectedVariantId(initialVariantId || fallback.id);
    setQuantity(1);
  }, [product, initialVariantId]);

  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, onClose]);

  if (!product) return null;

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  const displayPrice = product.price + (selectedVariant.priceDelta ?? 0);

  const inCartQty =
    cartItems.find(
      (item) =>
        item.productId === product.id && item.variantId === selectedVariant.id
    )?.quantity ?? 0;

  const maxAddable = Math.max(0, selectedVariant.stock - inCartQty);
  const clampedQty = maxAddable === 0 ? 0 : Math.min(quantity, maxAddable);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-[14px] border border-[#e8e0cc] shadow-2xl grid grid-cols-1 md:grid-cols-12"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close template details"
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-md bg-white border border-[#e8e0cc] text-[#14110a] hover:bg-[#faf7f0] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="md:col-span-5 flex">
          <TemplateCover
            eyebrow={product.coverEyebrow}
            title={product.coverTitle}
            tone={product.coverTone}
            className="w-full min-h-[240px] md:min-h-[460px]"
          />
        </div>

        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#6b6455] mb-2">
              <span className="uppercase tracking-[0.14em] font-bold text-[#9c7a2e]">
                {product.category}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{selectedVariant.sku}</span>
            </div>

            <div className="flex items-baseline justify-between gap-4 mb-3">
              <h2
                id="pdp-modal-title"
                className="font-display text-3xl sm:text-4xl font-semibold text-[#14110a]"
              >
                {product.name}
              </h2>
              <span className="font-display text-3xl font-bold tabular-nums text-[#14110a] shrink-0">
                ${displayPrice}
              </span>
            </div>

            <p className="text-sm text-[#6b6455] leading-relaxed mb-6">
              {product.description}
            </p>

            <div className="mb-6">
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-semibold uppercase tracking-wider text-[#14110a]">
                  Select License Edition
                </span>
                <span className="text-[#6b6455]">{selectedVariant.name}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.variants.map((variant) => {
                  const isSelected = variant.id === selectedVariant.id;
                  const variantPrice = product.price + (variant.priceDelta ?? 0);
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setQuantity(1);
                      }}
                      className={`flex items-center justify-between gap-2 px-3.5 py-2.5 min-h-[44px] rounded-md border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] ${
                        isSelected
                          ? 'border-[#9c7a2e] bg-[#faf7f0]'
                          : 'border-[#e8e0cc] bg-white hover:border-[#c9a24b]'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-[#14110a] truncate">
                          {variant.name}
                        </span>
                        <span className="block text-[11px] font-mono tabular-nums text-[#9c7a2e]">
                          ${variantPrice} · {variant.stock === 0 ? 'Sold out' : `${variant.stock} left`}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5 py-4 border-y border-[#eee7d8] text-xs text-[#4a4436]">
              <div className="flex justify-between gap-4">
                <span className="text-[#6b6455]">Included</span>
                <span className="text-right font-medium text-[#14110a]">{product.includes}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#6b6455]">Platform</span>
                <span className="text-right font-medium text-[#14110a]">{product.platform}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#6b6455]">Delivery</span>
                <span className="text-right font-medium text-[#14110a] inline-flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#9c7a2e]" aria-hidden="true" />
                  {product.leadTime}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              {selectedVariant.stock === 0 ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-[#9b3b2d]">
                  <XCircle className="w-4 h-4" aria-hidden="true" />
                  Sold out for this release wave
                </span>
              ) : selectedVariant.stock <= 3 ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-[#9c7a2e] tabular-nums">
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  Low availability — {selectedVariant.stock} licenses remaining
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-medium text-[#176b42] tabular-nums">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  Available — {selectedVariant.stock} licenses ready for instant issue
                </span>
              )}

              {inCartQty > 0 && (
                <span className="font-mono tabular-nums text-[#6b6455]">
                  {inCartQty} currently in bag
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="flex items-center justify-between border border-[#cfc4aa] rounded-md px-2 min-h-[44px] sm:w-32 shrink-0">
                <button
                  type="button"
                  disabled={clampedQty <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease license quantity"
                  className="w-9 h-9 flex items-center justify-center text-[#14110a] disabled:text-[#b8b09c] cursor-pointer disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-sm font-medium tabular-nums text-[#14110a]">
                  {clampedQty}
                </span>
                <button
                  type="button"
                  disabled={clampedQty >= maxAddable}
                  onClick={() => setQuantity((q) => Math.min(maxAddable, q + 1))}
                  aria-label="Increase license quantity"
                  className="w-9 h-9 flex items-center justify-center text-[#14110a] disabled:text-[#b8b09c] cursor-pointer disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                disabled={maxAddable <= 0}
                onClick={() => {
                  if (clampedQty > 0) {
                    onAddToCart(product.id, selectedVariant.id, clampedQty);
                    onClose();
                  }
                }}
                className="flex-1 px-5 py-3 min-h-[44px] mgr-gold-bg text-[#0a0a0a] text-xs font-bold tracking-[0.08em] uppercase rounded-md hover:opacity-90 disabled:bg-[#f1ebdc] disabled:bg-none disabled:text-[#8c8473] transition-opacity whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
              >
                {maxAddable <= 0
                  ? selectedVariant.stock === 0
                    ? 'Out of Stock'
                    : 'Max Stock in Bag'
                  : `Add to Bag · $${(displayPrice * clampedQty).toLocaleString()}`}
              </button>

              {maxAddable > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (clampedQty > 0) {
                      onBuyNow(product.id, selectedVariant.id, clampedQty);
                    }
                  }}
                  className="px-4 py-3 min-h-[44px] border border-[#9c7a2e] text-[#9c7a2e] text-xs font-bold tracking-[0.08em] uppercase rounded-md hover:bg-[#faf7f0] transition-colors whitespace-nowrap cursor-pointer"
                >
                  Checkout
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
