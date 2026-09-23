import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ShoppingBag,
  Store,
  Truck,
  Star,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  ArrowLeft,
  Package,
  ShieldCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useDiscoveredProduct } from '../../hooks/useDiscovery';
import { useCart, useAddToCart, useClearCart } from '../../hooks/useCart';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { useToast } from '../../hooks/useToast';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);

  const { data: product, isLoading, error, refetch } = useDiscoveredProduct(id || '');
  const { data: cart } = useCart();
  const addToCartMutation = useAddToCart();
  const clearCartMutation = useClearCart();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingState label="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorState
          title="Product Not Found"
          message="The requested product could not be found or is currently unavailable."
          onRetry={refetch}
        />
      </div>
    );
  }

  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const store = product.store;

  const handleAddToCart = async () => {
    if (isOutOfStock) return;

    // Check for store conflict
    if (cart && cart.items && cart.items.length > 0 && cart.storeId && cart.storeId !== product.storeId) {
      setConflictDialogOpen(true);
      return;
    }

    try {
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity,
      });

      toast({
        title: 'Added to cart',
        description: `${quantity} × ${product.name} added to your basket.`,
      });
    } catch (err: any) {
      if (err?.code === 'CART_STORE_CONFLICT') {
        setConflictDialogOpen(true);
      } else {
        toast({
          title: 'Could not add to cart',
          description: err.message || 'An error occurred while adding this item.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleClearAndAdd = async () => {
    try {
      await clearCartMutation.mutateAsync();
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity,
      });
      setConflictDialogOpen(false);
      toast({
        title: 'Cart updated',
        description: `Your previous cart was cleared and ${quantity} × ${product.name} was added.`,
      });
    } catch (err: any) {
      toast({
        title: 'Error updating cart',
        description: err.message || 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Breadcrumbs Navigation */}
      <div className="bg-white border-b border-slate-200/80 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 overflow-x-auto whitespace-nowrap">
            <Link to="/stores" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <Store className="w-3.5 h-3.5" />
              Stores
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <Link to={`/stores/${store.slug || store.id}`} className="hover:text-emerald-600 transition-colors font-medium text-slate-700">
              {store.name}
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-500">{product.category.name}</span>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-slate-900 font-medium truncate max-w-[200px] sm:max-w-none">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Product Image Gallery */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group">
              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100/70 flex items-center justify-center relative">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Package className="w-16 h-16 stroke-1" />
                    <span className="text-sm font-medium">No image available</span>
                  </div>
                )}

                {/* Stock Tag Badge */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {isOutOfStock ? (
                    <Badge variant="destructive" className="rounded-lg shadow-sm font-semibold px-3 py-1">
                      Out of Stock
                    </Badge>
                  ) : isLowStock ? (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm font-semibold px-3 py-1">
                      Only {product.stockQuantity} left
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm font-semibold px-3 py-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      In Stock
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Product Info & Actions */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              {product.category && (
                <span className="inline-block text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md mb-3">
                  {product.category.name}
                </span>
              )}

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                {product.name}
              </h1>

              {/* Price & Unit Display */}
              <div className="flex items-baseline gap-3 mb-6 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-3xl sm:text-4xl font-black text-emerald-700">
                  Rs. {product.price.toLocaleString()}
                </span>
                {product.unit && (
                  <span className="text-sm font-medium text-emerald-600">
                    / {product.unit}
                  </span>
                )}
                {product.sku && (
                  <span className="ml-auto text-xs text-slate-500 font-mono">
                    SKU: {product.sku}
                  </span>
                )}
              </div>

              {/* Product Description */}
              {product.description && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Description</h3>
                  <p className="text-slate-600 text-base leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Store Summary Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm mb-8 hover:border-emerald-200 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {store.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Sold & fulfilled by</div>
                      <Link
                        to={`/stores/${store.slug || store.id}`}
                        className="text-base font-bold text-slate-900 hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                      >
                        {store.name}
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                      <div className="text-xs text-slate-500 mt-0.5">{store.city}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{store.averageRating > 0 ? store.averageRating.toFixed(1) : 'New'}</span>
                    {store.totalReviews > 0 && (
                      <span className="text-amber-600/70 font-normal">({store.totalReviews})</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Delivery fee: <strong>Rs. {store.baseDeliveryFee}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Status: <strong className={store.isOpen ? 'text-emerald-600' : 'text-slate-500'}>{store.isOpen ? 'Open Now' : 'Closed'}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer on Mobile / Inline on Desktop */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Quantity Stepper */}
                <div className="flex items-center justify-between sm:justify-start border border-slate-200 rounded-xl bg-slate-50/70 p-1.5 flex-shrink-0">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-10 h-10 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-slate-900 text-base">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                    disabled={quantity >= product.stockQuantity || isOutOfStock}
                    className="w-10 h-10 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || addToCartMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {isOutOfStock
                    ? 'Out of Stock'
                    : addToCartMutation.isPending
                    ? 'Adding to Cart...'
                    : `Add to Cart • Rs. ${(product.price * quantity).toLocaleString()}`}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 mt-4 pt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  100% Genuine Guaranteed
                </span>
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  Cash on Delivery Available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Carousel / Grid */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">More from {store.name}</h2>
                <p className="text-slate-500 text-sm mt-1">Explore other products from this store</p>
              </div>
              <Link
                to={`/stores/${store.slug || store.id}`}
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                View Full Store Catalog
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {product.relatedProducts.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/products/${rel.slug || rel.id}`}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover-lift flex flex-col group"
                >
                  <div className="aspect-square rounded-xl bg-slate-100 overflow-hidden mb-3 flex items-center justify-center">
                    {rel.imageUrl ? (
                      <img
                        src={rel.imageUrl}
                        alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-1">
                    {rel.name}
                  </h3>
                  <div className="mt-auto pt-2">
                    <span className="text-sm font-extrabold text-emerald-600">
                      Rs. {rel.price.toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Store Conflict Modal */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Replace cart items?
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm mt-2">
              Your cart currently contains items from another store. GeoMarket delivers each order fresh directly from a single store. Would you like to clear your existing cart and start a new order with <strong>{store.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2.5 mt-6">
            <Button
              variant="outline"
              onClick={() => setConflictDialogOpen(false)}
              className="rounded-xl border-slate-200 text-slate-700"
            >
              Keep Current Cart
            </Button>
            <Button
              onClick={handleClearAndAdd}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              Start New Order Here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
