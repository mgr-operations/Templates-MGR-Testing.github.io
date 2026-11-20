import { useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { BUNDLE_DISCOUNT_THRESHOLD } from '../data/catalog';
import { CartItem, Product } from '../types/store';
import { TemplateCover } from './TemplateCover';

interface CartDrawerProps {
  isOpen: boolean;
  cartItems: CartItem[];
  products: Product[];
  onClose: () => void;
  onUpdateQuantity: (productId: string, variantId: string, quantity: number) => void;
  onRemoveItem: (productId: string, variantId: string) => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  cartItems,
  products,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resolvedLines = cartItems
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      if (!product || !variant) return null;
      const unitPrice = product.price + (variant.priceDelta ?? 0);
      const hasStockConflict = item.quantity > variant.stock;
      return {
        item,
        product,
        variant,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        hasStockConflict,
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  const subtotal = resolvedLines.reduce((acc, line) => acc + line.lineTotal, 0);
  const remainingForPriority = Math.max(0, BUNDLE_DISCOUNT_THRESHOLD - subtotal);
  const progress = Math.min(100, Math.round((subtotal / BUNDLE_DISCOUNT_THRESHOLD) * 100));
  const hasAnyConflict = resolvedLines.some((line) => line.hasStockConflict);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="Template bag"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-md h-full bg-white border-l border-[#e8e0cc] flex flex-col justify-between shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 bg-[#0a0a0a] text-white border-b border-[#c9a24b]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-[#c9a24b]" aria-hidden="true" />
            <h2 className="font-display text-2xl font-semibold text-white">
              Selected Templates
            </h2>
            <span className="font-mono text-xs text-[#e8d08a] tabular-nums">
              ({resolvedLines.reduce((sum, l) => sum + l.item.quantity, 0)})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag"
            className="w-10 h-10 flex items-center justify-center rounded-md text-[#b8b09c] hover:bg-[#1c1c1c] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-3.5 bg-[#faf7f0] border-b border-[#e8e0cc]">
          <div className="flex items-center justify-between text-xs text-[#4a4436] mb-2">
            {remainingForPriority === 0 && subtotal > 0 ? (
              <span className="font-semibold text-[#176b42]">
                Priority setup Q&amp;A review included with your order
              </span>
            ) : (
              <span>
                Add <strong className="tabular-nums text-[#14110a]">${remainingForPriority}</strong> for complimentary MGR setup review
              </span>
            )}
            <span className="font-mono tabular-nums text-[#6b6455]">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#e8e0cc] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c9a24b] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#eee7d8]">
          {resolvedLines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-8 h-8 text-[#b8b09c] mb-3 stroke-[1.5]" aria-hidden="true" />
              <p className="font-display text-2xl font-semibold text-[#14110a] mb-1">
                Your bag is empty
              </p>
              <p className="text-sm text-[#6b6455] max-w-[30ch] mb-6">
                Choose a ClickUp or operations template to reserve licenses and proceed to instant checkout.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 min-h-[44px] border border-[#9c7a2e] text-xs font-bold tracking-[0.08em] uppercase text-[#9c7a2e] rounded-md hover:bg-[#faf7f0] transition-colors cursor-pointer"
              >
                Explore Library
              </button>
            </div>
          ) : (
            resolvedLines.map(({ item, product, variant, unitPrice, lineTotal, hasStockConflict }) => (
              <div key={`${item.productId}-${item.variantId}`} className="py-4 flex gap-4">
                <TemplateCover
                  eyebrow={product.coverEyebrow}
                  title={product.coverTitle}
                  tone={product.coverTone}
                  compact
                  className="w-20 h-20 rounded-lg shrink-0 border border-[#c9a24b]/40"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-xl font-semibold text-[#14110a] truncate">
                        {product.name}
                      </h3>
                      <span className="font-display text-lg font-bold tabular-nums text-[#14110a] shrink-0">
                        ${lineTotal.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#6b6455] mt-0.5 truncate">
                      {variant.name} · <span className="font-mono">{variant.sku}</span>
                    </p>
                    <p className="text-xs text-[#6b6455] tabular-nums mt-0.5">
                      ${unitPrice} per license · {variant.stock} available
                    </p>
                  </div>

                  {hasStockConflict && (
                    <div className="mt-2 p-2 rounded-md bg-[#fdf0ee] border border-[#f0c9c2] text-xs text-[#9b3b2d] flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          {variant.stock === 0
                            ? 'Batch sold out in real time'
                            : `Only ${variant.stock} licenses left`}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          variant.stock === 0
                            ? onRemoveItem(product.id, variant.id)
                            : onUpdateQuantity(product.id, variant.id, variant.stock)
                        }
                        className="font-semibold underline whitespace-nowrap cursor-pointer"
                      >
                        {variant.stock === 0 ? 'Remove' : `Set to ${variant.stock}`}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="inline-flex items-center border border-[#cfc4aa] rounded-md">
                      <button
                        type="button"
                        onClick={() =>
                          item.quantity <= 1
                            ? onRemoveItem(product.id, variant.id)
                            : onUpdateQuantity(product.id, variant.id, item.quantity - 1)
                        }
                        aria-label={`Decrease quantity of ${product.name}`}
                        className="w-9 h-9 flex items-center justify-center text-[#14110a] hover:bg-[#faf7f0] rounded-l-md transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-mono text-xs font-medium tabular-nums text-[#14110a]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={item.quantity >= variant.stock}
                        onClick={() =>
                          onUpdateQuantity(product.id, variant.id, item.quantity + 1)
                        }
                        aria-label={`Increase quantity of ${product.name}`}
                        className="w-9 h-9 flex items-center justify-center text-[#14110a] hover:bg-[#faf7f0] disabled:text-[#b8b09c] rounded-r-md transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(product.id, variant.id)}
                      aria-label={`Remove ${product.name}`}
                      className="inline-flex items-center gap-1 text-xs text-[#6b6455] hover:text-[#9b3b2d] py-1.5 px-2 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {resolvedLines.length > 0 && (
          <div className="px-6 py-5 border-t border-[#e8e0cc] bg-[#faf7f0] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#6b6455]">
                <span>Subtotal</span>
                <span className="font-display text-xl font-bold tabular-nums text-[#14110a]">
                  ${subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[#6b6455]">
                <span>Digital Access Delivery</span>
                <span>Instant after confirmation</span>
              </div>
            </div>

            {hasAnyConflict && (
              <p className="text-xs text-[#9b3b2d] font-medium">
                Please resolve the live license stock adjustment above before continuing.
              </p>
            )}

            <button
              type="button"
              disabled={hasAnyConflict}
              onClick={onProceedToCheckout}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] mgr-gold-bg text-[#0a0a0a] text-xs font-bold tracking-[0.1em] uppercase rounded-md hover:opacity-90 disabled:bg-[#e8e0cc] disabled:bg-none disabled:text-[#8c8473] transition-opacity cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
