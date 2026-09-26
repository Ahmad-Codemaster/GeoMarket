import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '../../hooks/useCart';
import { useUiStore } from '../../store/ui.store';

export function CartDrawer() {
  const navigate = useNavigate();
  const { cartDrawerOpen, setCartDrawerOpen } = useUiStore();
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const items = cart?.items || [];
  const itemCount = cart?.itemCount ?? 0;
  const subtotal = cart?.subtotal ?? 0;
  const deliveryFee = cart?.store?.baseDeliveryFee ?? 0;
  const grandTotal = subtotal + (items.length > 0 ? deliveryFee : 0);

  const handleUpdateQty = (itemId: string, newQty: number, maxStock?: number) => {
    if (newQty < 1) {
      removeItem.mutate(itemId);
      return;
    }
    const safeQty = maxStock ? Math.min(newQty, maxStock) : newQty;
    updateItem.mutate({ itemId, quantity: safeQty });
  };

  const handleCheckout = () => {
    setCartDrawerOpen(false);
    navigate('/checkout');
  };

  const handleViewCart = () => {
    setCartDrawerOpen(false);
    navigate('/cart');
  };

  if (!cartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden transition-all duration-300">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setCartDrawerOpen(false)}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300 border-l border-slate-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Your Cart</h3>
              {itemCount > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
            <button
              onClick={() => setCartDrawerOpen(false)}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Store Banner if store is present */}
          {cart?.store && items.length > 0 && (
            <div className="px-6 py-2.5 bg-emerald-50/70 border-b border-emerald-100/60 flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-semibold truncate">
                Store: <span className="font-bold">{cart.store.name}</span>
              </span>
              <span className="text-emerald-700 font-medium shrink-0">⚡ Direct Dispatch</span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                <p className="text-xs">Loading cart items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 mb-1">Your cart is empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6">
                  Add fresh groceries, bakery items, or pharmacy essentials from neighborhood stores!
                </p>
                <button
                  onClick={() => {
                    setCartDrawerOpen(false);
                    navigate('/stores');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Explore Nearby Stores
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors gap-3"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg bg-white overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-slate-300" />
                    )}
                  </div>

                  {/* Title & Price */}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-slate-800 truncate mb-1" title={item.productName}>
                      {item.productName}
                    </h5>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-extrabold text-emerald-600">
                        Rs {item.lineTotal.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Rs {item.unitPrice} each)
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="inline-flex items-center border border-slate-200 bg-white rounded-md">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1, item.availableStock)}
                          className="px-2 py-0.5 text-slate-500 hover:text-slate-800 text-xs font-bold"
                          title="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-700">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1, item.availableStock)}
                          className="px-2 py-0.5 text-slate-500 hover:text-slate-800 text-xs font-bold"
                          title="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem.mutate(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer with subtotal and COD checkout */}
          {items.length > 0 && (
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/60 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">Rs {subtotal.toLocaleString()}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Est. Delivery</span>
                    <span className="font-bold text-slate-800">Rs {deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-emerald-600">Rs {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleViewCart}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs transition-colors"
                >
                  View Full Cart
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Checkout COD</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-400 font-medium">
                ✓ Cash on Delivery • Direct Doorstep Delivery
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartDrawer;
