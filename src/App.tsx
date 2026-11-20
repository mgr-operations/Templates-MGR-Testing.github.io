import { useEffect, useMemo, useState } from 'react';
import { Activity, Search } from 'lucide-react';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutFlow } from './components/CheckoutFlow';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { InventoryMonitorDrawer } from './components/InventoryMonitorDrawer';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { useInventorySocket } from './hooks/useInventorySocket';
import { CartItem, Product, ProductCategory } from './types/store';

const CATEGORIES: ProductCategory[] = [
  'All',
  'Operations',
  'Sales',
  'Delivery',
  'Automation',
];
const CART_STORAGE_KEY = 'mgr_solutions_bag_v1';

const PURCHASE_STEPS = [
  {
    num: '01',
    title: 'Choose a template',
    desc: 'Review what it includes, select your license tier, and confirm live availability.',
  },
  {
    num: '02',
    title: 'Secure checkout',
    desc: 'Complete your order via instant card settlement or Net-7 corporate invoicing.',
  },
  {
    num: '03',
    title: 'Get access',
    desc: 'Your receipt, license keys, and ClickUp workspace import links are issued immediately.',
  },
  {
    num: '04',
    title: 'Make it yours',
    desc: 'Follow the setup guide and adapt the operating system to your growing team.',
  },
  {
    num: '05',
    title: 'Get support',
    desc: 'Need tailored implementation? MGR advisory and setup calls are ready when you are.',
  },
];

function loadStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const {
    products,
    events,
    activeShoppers,
    connectionStatus,
    lastUpdatedSku,
    latestEvent,
    placeOrder,
    adjustInventory,
  } = useInventorySocket();

  const [cartItems, setCartItems] = useState<CartItem[]>(loadStoredCart);
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  const [selectedProductInfo, setSelectedProductInfo] = useState<{
    productId: string;
    variantId?: string;
  } | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota issues
    }
  }, [cartItems]);

  const totalAvailableUnits = useMemo(
    () =>
      products.reduce(
        (total, p) => total + p.variants.reduce((vSum, v) => vSum + v.stock, 0),
        0
      ),
    [products]
  );

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (activeCategory !== 'All' && product.category !== activeCategory) {
        return false;
      }
      if (inStockOnly && !product.variants.some((v) => v.stock > 0)) {
        return false;
      }
      if (q) {
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.shortDescription.toLowerCase().includes(q);
        const matchesSku = product.variants.some((v) =>
          v.sku.toLowerCase().includes(q)
        );
        return matchesName || matchesDesc || matchesSku;
      }
      return true;
    });
  }, [products, activeCategory, searchQuery, inStockOnly]);

  const selectedProduct: Product | null = useMemo(() => {
    if (!selectedProductInfo) return null;
    return products.find((p) => p.id === selectedProductInfo.productId) ?? null;
  }, [products, selectedProductInfo]);

  const handleAddToCart = (productId: string, variantId: string, quantity = 1) => {
    const product = products.find((p) => p.id === productId);
    const variant = product?.variants.find((v) => v.id === variantId);
    if (!variant || variant.stock <= 0) return;

    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.productId === productId && item.variantId === variantId
      );
      if (existing) {
        const nextQty = Math.min(variant.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, quantity: nextQty }
            : item
        );
      }
      return [
        ...prev,
        { productId, variantId, quantity: Math.min(variant.stock, quantity) },
      ];
    });
  };

  const handleBuyNow = (productId: string, variantId: string, quantity: number) => {
    handleAddToCart(productId, variantId, quantity);
    setSelectedProductInfo(null);
    setIsCheckoutOpen(true);
  };

  const handleUpdateQuantity = (productId: string, variantId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId, variantId);
      return;
    }
    const product = products.find((p) => p.id === productId);
    const variant = product?.variants.find((v) => v.id === variantId);
    const clamped = variant ? Math.min(quantity, Math.max(1, variant.stock)) : quantity;

    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: clamped }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string, variantId: string) => {
    setCartItems((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && item.variantId === variantId)
      )
    );
  };

  const handleExploreCollection = () => {
    const el = document.getElementById('template-library');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#14110a]">
      <Header
        cartCount={cartCount}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1">
        <Hero
          totalAvailableUnits={totalAvailableUnits}
          activeShoppers={activeShoppers}
          featuredProduct={products[0]}
          onExploreCollection={handleExploreCollection}
          onOpenInventoryConsole={() => setIsInventoryOpen(true)}
          onInspectFeatured={(p) =>
            setSelectedProductInfo({ productId: p.id, variantId: p.variants[0]?.id })
          }
        />

        <section
          id="template-library"
          className="max-w-[1200px] mx-auto px-4 sm:px-8 py-16 lg:py-24"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#e8e0cc]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9c7a2e] mb-2">
                MGR Template Library
              </p>
              <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#14110a]">
                Built for the work that has to get done.
              </h2>
              <p className="text-sm sm:text-base text-[#6b6455] mt-2 max-w-[56ch]">
                Each purchase includes the ClickUp template, setup guidance, and a clear explanation of how to adapt it to your team.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className="flex flex-wrap items-center gap-1 p-1 bg-[#faf7f0] border border-[#e8e0cc] rounded-lg"
                role="tablist"
                aria-label="Filter templates by category"
              >
                {CATEGORIES.map((category) => {
                  const isSelected = activeCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setActiveCategory(category)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-[#0a0a0a] text-[#e8d08a]'
                          : 'text-[#6b6455] hover:text-[#14110a]'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>

              <div className="relative flex-1 sm:flex-initial sm:w-52">
                <Search
                  className="w-4 h-4 text-[#6b6455] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates or SKU"
                  aria-label="Search templates"
                  className="w-full pl-9 pr-3 py-2 min-h-[40px] text-xs bg-[#fffdfa] border border-[#cfc4aa] rounded-md focus:outline-none focus:border-[#c9a24b]"
                />
              </div>

              <button
                type="button"
                onClick={() => setInStockOnly((v) => !v)}
                aria-pressed={inStockOnly}
                className={`px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  inStockOnly
                    ? 'bg-[#14110a] text-[#e8d08a] border-[#14110a]'
                    : 'bg-white text-[#4a4436] border-[#cfc4aa] hover:border-[#9c7a2e]'
                }`}
              >
                Available Now
              </button>
            </div>
          </div>

          {latestEvent && (
            <div className="mt-6 px-4 py-3 rounded-lg bg-[#faf7f0] border border-[#e8e0cc] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5 text-[#14110a]">
                <Activity className="w-4 h-4 text-[#9c7a2e] shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">Live update:</strong> {latestEvent.productName} ({latestEvent.sku}) — {latestEvent.message}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsInventoryOpen(true)}
                className="text-[#9c7a2e] font-bold uppercase tracking-wider text-[11px] underline text-left sm:text-right whitespace-nowrap cursor-pointer"
              >
                Inspect Event Log
              </button>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display text-2xl font-semibold text-[#14110a] mb-1">
                No templates match your current filter
              </p>
              <p className="text-sm text-[#6b6455] mb-5">
                Clear your search query or reset the category filter to view all systems.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('All');
                  setSearchQuery('');
                  setInStockOnly(false);
                }}
                className="px-5 py-2.5 min-h-[44px] border border-[#9c7a2e] text-xs font-bold uppercase tracking-wider text-[#9c7a2e] rounded-md hover:bg-[#faf7f0] transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartItems={cartItems}
                  lastUpdatedSku={lastUpdatedSku}
                  onAddToCart={handleAddToCart}
                  onSelectProduct={(p, variantId) =>
                    setSelectedProductInfo({ productId: p.id, variantId })
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section
          id="purchase-flow"
          className="border-t border-[#e8e0cc] bg-[#faf7f0]"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-16 lg:py-20">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9c7a2e] mb-2">
                Simple Purchase Flow
              </p>
              <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#14110a]">
                Buy once. Put it to work.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-0">
              {PURCHASE_STEPS.map((step) => (
                <div
                  key={step.num}
                  className="relative pt-7 md:px-5 border-t-2 border-[#ddd2b4]"
                >
                  <span
                    className="absolute -top-[9px] left-0 w-3.5 h-3.5 rounded-full bg-[#c9a24b] border-[3px] border-[#faf7f0]"
                    aria-hidden="true"
                  />
                  <div className="font-mono text-xs font-bold tracking-[0.16em] text-[#9c7a2e] mb-3">
                    {step.num}
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[#14110a] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#6b6455] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer
        connectionStatus={connectionStatus}
        onOpenInventoryConsole={() => setIsInventoryOpen(true)}
      />

      <ProductDetailModal
        product={selectedProduct}
        initialVariantId={selectedProductInfo?.variantId}
        cartItems={cartItems}
        onClose={() => setSelectedProductInfo(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      <CartDrawer
        isOpen={isCartOpen}
        cartItems={cartItems}
        products={products}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutFlow
        isOpen={isCheckoutOpen}
        cartItems={cartItems}
        products={products}
        onClose={() => setIsCheckoutOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onSubmitOrder={placeOrder}
        onOrderCompleted={() => setCartItems([])}
      />

      <InventoryMonitorDrawer
        isOpen={isInventoryOpen}
        products={products}
        events={events}
        activeShoppers={activeShoppers}
        connectionStatus={connectionStatus}
        onClose={() => setIsInventoryOpen(false)}
        onAdjustInventory={adjustInventory}
      />
    </div>
  );
}
