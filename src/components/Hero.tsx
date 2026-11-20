import { Activity, ArrowRight } from 'lucide-react';
import { Product } from '../types/store';
import { TemplateCover } from './TemplateCover';

interface HeroProps {
  totalAvailableUnits: number;
  activeShoppers: number;
  featuredProduct?: Product;
  onExploreCollection: () => void;
  onOpenInventoryConsole: () => void;
  onInspectFeatured?: (product: Product) => void;
}

export function Hero({
  totalAvailableUnits,
  activeShoppers,
  featuredProduct,
  onExploreCollection,
  onOpenInventoryConsole,
  onInspectFeatured,
}: HeroProps) {
  return (
    <section
      id="top"
      className="relative bg-[#0a0a0a] text-white border-b border-[#c9a24b]/25 overflow-hidden"
      style={{
        backgroundImage:
          'radial-gradient(circle at 80% 18%, rgba(201,162,75,0.2) 0, transparent 42%), radial-gradient(circle at 10% 90%, rgba(201,162,75,0.07) 0, transparent 35%)',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#b8b09c] mb-5">
                MGR Template Library · ClickUp &amp; Operations Systems
              </p>

              <h1
                className="font-display font-semibold tracking-tight leading-[1.02] text-white mb-6"
                style={{
                  fontSize: 'clamp(2.5rem, 4.8vw, 4.15rem)',
                  textWrap: 'balance',
                }}
              >
                Start with a system that already{' '}
                <span className="mgr-gold-text">makes sense.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#b8b09c] leading-relaxed max-w-[54ch] mb-8">
                Practical ClickUp and operations templates designed to give growing teams a
                stronger starting point — with clear structure, ownership, and workflows.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onExploreCollection}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 min-h-[44px] mgr-gold-bg text-[#0a0a0a] text-xs font-bold tracking-[0.1em] uppercase rounded-md hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d08a] cursor-pointer"
                >
                  <span>Explore the Library</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={onOpenInventoryConsole}
                  className="inline-flex items-center gap-2 px-5 py-3.5 min-h-[44px] border border-[#c9a24b] text-[#e8d08a] text-xs font-bold tracking-[0.08em] uppercase rounded-md hover:bg-[#c9a24b]/10 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d08a] cursor-pointer"
                >
                  <Activity className="w-4 h-4 text-[#c9a24b]" aria-hidden="true" />
                  <span>Live License Feed</span>
                </button>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-[#2a2a2a] flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#b8b09c]">
              <span className="tabular-nums font-semibold text-[#e8d08a]">
                {totalAvailableUnits} release licenses available
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {activeShoppers} active {activeShoppers === 1 ? 'visitor' : 'visitors'}
              </span>
              <span aria-hidden="true">·</span>
              <span>Management · Growth · Results</span>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col">
            {featuredProduct && (
              <div className="flex-1 flex flex-col justify-between bg-[#141414] border border-[#c9a24b]/40 rounded-xl overflow-hidden">
                <TemplateCover
                  eyebrow={featuredProduct.coverEyebrow}
                  title={featuredProduct.coverTitle}
                  tone={featuredProduct.coverTone}
                  className="flex-1 min-h-[210px]"
                />
                <div className="p-6 border-t border-[#2a2a2a] bg-[#141414]">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#b8b09c] mb-1.5">
                    <span className="uppercase tracking-[0.14em] text-[#c9a24b] font-semibold">
                      Featured System
                    </span>
                    <span className="font-mono tabular-nums">
                      {featuredProduct.variants[0]?.sku}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <h2 className="font-display text-2xl font-semibold text-white">
                      {featuredProduct.name}
                    </h2>
                    <span className="font-display text-2xl font-semibold tabular-nums text-[#e8d08a]">
                      ${featuredProduct.price}
                    </span>
                  </div>
                  <p className="text-sm text-[#b8b09c] leading-snug mb-4">
                    {featuredProduct.shortDescription}
                  </p>
                  <button
                    type="button"
                    onClick={() => onInspectFeatured?.(featuredProduct)}
                    className="w-full py-2.5 min-h-[40px] border border-[#c9a24b]/50 text-[#e8d08a] text-xs font-bold tracking-[0.08em] uppercase rounded-md hover:bg-[#c9a24b]/10 transition-colors cursor-pointer"
                  >
                    Inspect Template &amp; Licenses
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
