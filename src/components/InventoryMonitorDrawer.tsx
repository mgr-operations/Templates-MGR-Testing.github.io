import { useEffect, useState } from 'react';
import { Activity, Minus, Plus, RefreshCw, Users, X } from 'lucide-react';
import { ConnectionStatus } from '../hooks/useInventorySocket';
import { InventoryEvent, Product } from '../types/store';

interface InventoryMonitorDrawerProps {
  isOpen: boolean;
  products: Product[];
  events: InventoryEvent[];
  activeShoppers: number;
  connectionStatus: ConnectionStatus;
  onClose: () => void;
  onAdjustInventory: (
    productId: string,
    variantId: string,
    delta: number,
    reason?: string
  ) => Promise<unknown>;
}

export function InventoryMonitorDrawer({
  isOpen,
  products,
  events,
  activeShoppers,
  connectionStatus,
  onClose,
  onAdjustInventory,
}: InventoryMonitorDrawerProps) {
  const [busySku, setBusySku] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAdjust = async (
    productId: string,
    variantId: string,
    sku: string,
    delta: number,
    reason: string
  ) => {
    setBusySku(sku);
    setActionError(null);
    try {
      await onAdjustInventory(productId, variantId, delta, reason);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Inventory adjustment failed');
    } finally {
      setBusySku(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="Live release inventory feed"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-lg h-full bg-white border-l border-[#e8e0cc] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 bg-[#0a0a0a] text-white border-b border-[#c9a24b]/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#c9a24b]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-semibold text-white">
                MGR Release Inventory
              </h2>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-[#b8b09c]">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#e8d08a]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-[#2b7a4b]'
                      : 'bg-[#c9a24b]'
                  }`}
                />
                {connectionStatus === 'connected' ? 'WebSocket Connected' : 'Reconnecting'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                {activeShoppers} active {activeShoppers === 1 ? 'session' : 'sessions'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close live release inventory"
            className="w-10 h-10 flex items-center justify-center rounded-md text-[#b8b09c] hover:bg-[#1c1c1c] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
          {actionError && (
            <div className="p-3 rounded-lg bg-[#fdf0ee] text-xs text-[#9b3b2d]">
              {actionError}
            </div>
          )}

          <section>
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#9c7a2e]">
                Release Batch Controls
              </h3>
              <span className="text-xs text-[#6b6455]">Syncs across all connected tabs</span>
            </div>

            <div className="border border-[#e8e0cc] rounded-xl divide-y divide-[#eee7d8]">
              {products.flatMap((product) =>
                product.variants.map((variant) => {
                  const isBusy = busySku === variant.sku;
                  return (
                    <div
                      key={variant.sku}
                      className="px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#14110a] truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-[#6b6455] truncate">
                          {variant.name} · <span className="font-mono">{variant.sku}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-mono text-xs font-medium tabular-nums w-14 text-right ${
                            variant.stock === 0
                              ? 'text-[#9b3b2d]'
                              : variant.stock <= 3
                                ? 'text-[#9c7a2e]'
                                : 'text-[#176b42]'
                          }`}
                        >
                          {variant.stock} left
                        </span>

                        <button
                          type="button"
                          disabled={isBusy || variant.stock <= 0}
                          onClick={() =>
                            handleAdjust(
                              product.id,
                              variant.id,
                              variant.sku,
                              -1,
                              'Remote team claimed 1 license'
                            )
                          }
                          title="Simulate remote buyer (-1)"
                          aria-label={`Simulate purchase of ${variant.sku}`}
                          className="w-8 h-8 flex items-center justify-center rounded-md border border-[#cfc4aa] text-[#14110a] hover:bg-[#faf7f0] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            handleAdjust(
                              product.id,
                              variant.id,
                              variant.sku,
                              3,
                              'MGR Studio opened +3 release licenses'
                            )
                          }
                          title="Release +3 licenses"
                          aria-label={`Release 3 more licenses for ${variant.sku}`}
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-[#cfc4aa] text-xs font-medium text-[#14110a] hover:bg-[#faf7f0] disabled:opacity-40 cursor-pointer"
                        >
                          {isBusy ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                          <span>3</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#9c7a2e] mb-3">
              Real-Time Event Ledger
            </h3>
            <div className="space-y-2.5">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-lg bg-[#faf7f0] border border-[#e8e0cc] text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[#14110a]">{evt.productName}</span>
                    <span className="font-mono text-[11px] text-[#6b6455] tabular-nums">
                      {new Date(evt.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[#4a4436]">{evt.message}</p>
                  <p className="text-[11px] text-[#6b6455] font-mono mt-1">
                    {evt.sku} · {evt.variantName}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
