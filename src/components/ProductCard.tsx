import { useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Plus, XCircle } from 'lucide-react';
import { CartItem, Product } from '../types/store';
import { TemplateCover } from './TemplateCover';

interface ProductCardProps {
  product: Product;
  cartItems: CartItem[];
  lastUpdatedSku: string | null;
  onAddToCart: (productId: string, variantId: string, quantity?: number) => void;
  onSelectProduct: (product: Product, variantId: string) => void;
}

export function ProductCard({
  product,
  cartItems,
  lastUpdatedSku,
  onAddToCart,
  onSelectProduct,
}: ProductCardProps) {
  const defaultVariant =
    product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string>(defaultVariant.id);
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  const displayPrice = product.price + (selectedVariant.priceDelta ?? 0);

  const inCartQty =
    cartItems.find(
      (item) =>
        item.productId === product.id && item.variantId === selectedVariant.id
    )?.quantity ?? 0;

  const remainingToAdd = Math.max(0, selectedVariant.stock - inCartQty);
  const isOutOfStock = selectedVariant.stock <= 0;
  const isLowStock = selectedVariant.stock > 0 && selectedVariant.stock <= 3;
  const isFlashing = lastUpdatedSku === selectedVariant.sku;

  const handleAdd = () => {
    if (remainingToAdd <= 0) return;
    onAddToCart(product.id, selectedVariant.id, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article
      className={`group flex flex-col bg-white border rounded-[14px] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(48,35,10,0.1)] ${
        isFlashing
          ? 'border-[#c9a24b] ring-2 ring-[#c9a24b]/25'
          : 'border-[#e8e0cc] shadow-[0_12px_30px_rgba(48,35,10,0.05)]'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelectProduct(product, selectedVariant.id)}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c9a24b] cursor-pointer"
        aria-label={`View details for ${product.name}`}
      >
        <TemplateCover
          eyebrow={product.coverEyebrow}
          title={product.coverTitle}
          tone={product.coverTone}
          className="min-h-[195px]"
        />
      </button>

      <div className="p-6 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#6b6455] mb-1.5">
            <span className="tracking-[0.14em] uppercase font-bold text-[#9c7a2e]">
              {product.category}
            </span>
            <span className="font-mono tabular-nums">{selectedVariant.sku}</span>
          </div>

          <div className="flex items-baseline justify-between gap-3 mb-2">
            <button
              type="button"
              onClick={() => onSelectProduct(product, selectedVariant.id)}
              className="text-left font-display text-[28px] leading-[1.05] font-semibold text-[#14110a] hover:text-[#9c7a2e] transition-colors focus-visible:outline-none focus-visible:underline cursor-pointer"
            >
              {product.name}
            </button>
            <span className="font-display text-2xl font-bold tabular-nums text-[#14110a] shrink-0">
              ${displayPrice}
            </span>
          </div>

          <p className="text-sm text-[#6b6455] leading-relaxed line-clamp-2 mb-4">
            {product.shortDescription}
          </p>

          <div className="text-xs text-[#665e4f] mb-4">
            {product.platform} · Setup guide included
          </div>

          <div className="space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6455]">
              License Edition
            </span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={`License tiers for ${product.name}`}>
              {product.variants.map((variant) => {
                const isSelected = variant.id === selectedVariant.id;
                const shortLabel = variant.name.split('(')[0].split('+')[0].trim();
                return (
                  <button
                    key={variant.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`px-2.5 py-2 rounded-md border text-left text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] ${
                      isSelected
                        ? 'border-[#9c7a2e] bg-[#faf7f0] text-[#14110a] font-semibold'
                        : 'border-[#e8e0cc] bg-white text-[#6b6455] hover:border-[#c9a24b]'
                    }`}
                  >
                    <span className="block truncate">{shortLabel}</span>
                    <span className="font-mono text-[10px] tabular-nums text-[#9c7a2e]">
                      {variant.stock === 0 ? 'Sold out' : `${variant.stock} left`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#efe9da] flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-[#9b3b2d]">
                <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Release batch sold out</span>
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-[#9c7a2e] tabular-nums">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Only {selectedVariant.stock} licenses left</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-[#176b42] tabular-nums">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{selectedVariant.stock} licenses available</span>
              </span>
            )}

            {inCartQty > 0 && (
              <span className="text-[#6b6455] font-mono tabular-nums">
                {inCartQty} in bag
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => onSelectProduct(product, selectedVariant.id)}
              className="col-span-2 px-3 py-2.5 min-h-[44px] text-xs font-bold tracking-[0.06em] uppercase text-[#9c7a2e] border border-[#e5dcc6] hover:border-[#c9a24b] hover:bg-[#faf7f0] rounded-md transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] cursor-pointer"
            >
              Details
            </button>

            <button
              type="button"
              disabled={remainingToAdd <= 0}
              onClick={handleAdd}
              className={`col-span-3 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-bold tracking-[0.06em] uppercase rounded-md transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] ${
                remainingToAdd <= 0
                  ? 'bg-[#f1ebdc] text-[#8c8473] cursor-not-allowed'
                  : justAdded
                    ? 'bg-[#176b42] text-white cursor-pointer'
                    : 'mgr-gold-bg text-[#0a0a0a] hover:opacity-90 cursor-pointer'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Added</span>
                </>
              ) : isOutOfStock ? (
                <span>Unavailable</span>
              ) : remainingToAdd === 0 ? (
                <span>Max in Bag</span>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add to Bag</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
