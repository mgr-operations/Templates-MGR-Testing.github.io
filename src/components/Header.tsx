import { ShoppingBag } from 'lucide-react';
import { ProductCategory } from '../types/store';

interface HeaderProps {
  cartCount: number;
  activeCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
  onOpenCart: () => void;
}

const NAV_ITEMS: Array<{ label: string; category?: ProductCategory; targetId: string }> = [
  { label: 'Templates', category: 'All', targetId: 'template-library' },
  { label: 'Operations', category: 'Operations', targetId: 'template-library' },
  { label: 'Sales', category: 'Sales', targetId: 'template-library' },
  { label: 'How It Works', targetId: 'purchase-flow' },
];

export function Header({
  cartCount,
  activeCategory,
  onSelectCategory,
  onOpenCart,
}: HeaderProps) {
  const handleNavClick = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.category) {
      onSelectCategory(item.category);
    }
    const target = document.getElementById(item.targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#c9a24b]/25">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="font-display text-2xl font-semibold tracking-tight text-[#e8d08a] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] rounded-sm"
        >
          MGR Solutions
        </a>

        <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = item.category ? activeCategory === item.category : false;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`text-xs font-medium tracking-[0.12em] uppercase transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b cursor-pointer ${
                  isActive
                    ? 'text-[#e8d08a] border-[#c9a24b]'
                    : 'text-[#b8b09c] border-transparent hover:text-[#e8d08a] hover:border-[#c9a24b]/40'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] rounded-sm`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2.5 px-4 py-2 min-h-[40px] mgr-gold-bg text-[#0a0a0a] text-xs font-bold tracking-[0.08em] uppercase rounded-md hover:opacity-90 transition-opacity duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d08a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Bag</span>
            <span className="font-mono text-xs tabular-nums bg-black/15 px-1.5 py-0.5 rounded">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
