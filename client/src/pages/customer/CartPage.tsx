import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Store as StoreIcon,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Package,
  Info,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { useToast } from '../../hooks/useToast';
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from '../../hooks/useCart';

export function CartPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading, isError, refetch } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const { toast } = useToast();


  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const handleUpdateQuantity = async (itemId: string, newQty: number, maxStock: number) => {
    // If current item quantity exceeds stock and user decreases, step down to maxStock
    const targetQty = Math.min(newQty, maxStock);
    if (targetQty < 1) return;

    try {
      setUpdatingItemId(itemId);
      await updateItem.mutateAsync({ itemId, quantity: targetQty });
    } catch (err: any) {
      toast({
        title: 'Failed to update quantity',
        description: err.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string, productName: string) => {
    try {
      setUpdatingItemId(itemId);
      await removeItem.mutateAsync(itemId);
      toast({
        title: 'Item removed',
        description: `${productName} was removed from your cart.`,
      });
    } catch (err: any) {
      toast({
        title: 'Failed to remove item',
        description: err.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart.mutateAsync();
      setClearDialogOpen(false);
      toast({
        title: 'Cart cleared',
        description: 'All items have been removed from your cart.',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to clear cart',
        description: err.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <PageContainer width="wide">
        <PageHeader
          title="Shopping Cart"
          description="Your selected items from a single physical store"
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer width="wide">
        <ErrorState
          title="Failed to load cart"
          message="We encountered an issue loading your shopping cart. Please try again."
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  const items = cart?.items || [];
  const isEmpty = !cart || items.length === 0;

  if (isEmpty) {
    return (
      <PageContainer width="wide">
        <PageHeader
          title="Shopping Cart"
          description="Your selected items from a single physical store"
        />
        <div className="mt-8">
          <Card className="border-dashed border-2">
            <CardContent className="py-16">
              <EmptyState
                icon={ShoppingCart}
                title="Your Cart is Empty"
                description="Explore local stores and discover products delivering to your location."
                action={{
                  label: 'Browse Nearby Stores',
                  onClick: () => navigate('/stores'),
                }}
              />

            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  const store = cart.store;
  const subtotal = cart.subtotal;
  const deliveryFee = store?.baseDeliveryFee ?? 0;
  const minOrderAmount = store?.minOrderAmount ?? 0;
  const minOrderShortfall = Math.max(0, minOrderAmount - subtotal);
  const estimatedTotal = subtotal + deliveryFee;

  return (
    <PageContainer width="wide">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Shopping Cart
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Single-store order fulfillment policy enforced
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs">
            <Link to="/stores">
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            className="text-xs text-destructive hover:text-destructive gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Cart
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Cart Line Items Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Store Context Banner */}
          {store && (
            <Card className="bg-muted/30 border-primary/20">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    <StoreIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fulfilling Merchant:</span>
                    <h3 className="font-semibold text-foreground text-sm">{store.name}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <Badge variant={store.isActive && store.isAcceptingOrders ? 'success' : 'destructive'} className="text-[10px]">
                    {store.isActive && store.isAcceptingOrders ? 'Store Active' : 'Orders Paused'}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2">
                    <Link to={`/stores/${store.slug || store.id}`}>View Store</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Single-Store Invariant Info Alert */}
          <Alert variant="info" className="bg-primary/5 border-primary/20 py-2.5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs font-semibold">Single-Store Policy Active</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">
              All items in your cart originate from {store?.name || 'one store'} to guarantee direct, single-courier delivery.
            </AlertDescription>
          </Alert>

          {/* Line Items Card */}
          <Card>
            <CardHeader className="py-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Items ({cart.itemCount})
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  Prices updated in real-time
                </span>
              </div>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {items.map((item) => {
                const isItemUpdating = updatingItemId === item.id;
                const isOutOfStock = item.status === 'out_of_stock';
                const isUnavailable = item.status === 'unavailable';

                return (
                  <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Item Info */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden border">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-foreground truncate">
                            {item.productName}
                          </h4>
                          <span className="sm:hidden font-bold text-sm text-foreground">
                            Rs. {item.lineTotal.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
                          <span>Rs. {item.unitPrice.toFixed(2)}</span>
                          {item.unit && <span>/ {item.unit}</span>}
                        </div>

                        {/* Availability Warnings */}
                        {isOutOfStock && (
                          <div className="flex items-center gap-1 text-[11px] text-destructive font-medium pt-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>Only {item.availableStock} in stock. Adjust quantity.</span>
                          </div>
                        )}

                        {isUnavailable && (
                          <div className="flex items-center gap-1 text-[11px] text-destructive font-medium pt-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>Product or merchant is currently inactive.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity and Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0">
                      {/* Quantity Controls */}
                      <div className="flex items-center border rounded-md shadow-2xs bg-background">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-r-none"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.availableStock)}
                          disabled={item.quantity <= 1 || isItemUpdating}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>

                        <div className="w-10 text-center text-xs font-semibold">
                          {isItemUpdating ? (
                            <Loader2 className="h-3 w-3 animate-spin mx-auto text-muted-foreground" />
                          ) : (
                            item.quantity
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-l-none"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.availableStock)}
                          disabled={item.quantity >= item.availableStock || isItemUpdating}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Line Total (desktop) */}
                      <div className="hidden sm:block text-right min-w-24">
                        <p className="font-bold text-sm text-foreground">
                          Rs. {item.lineTotal.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.quantity} × Rs. {item.unitPrice.toFixed(2)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveItem(item.id, item.productName)}
                        disabled={isItemUpdating}
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Column */}
        <div className="space-y-6">
          <Card className="shadow-2xs">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-base font-bold">Order Summary</CardTitle>
              <CardDescription className="text-xs">
                Calculated based on current merchant parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({cart.itemCount} items)</span>
                  <span className="font-semibold text-foreground">Rs. {subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Delivery Fee</span>
                  <span className="font-semibold text-foreground">
                    {deliveryFee > 0 ? `Rs. ${deliveryFee.toFixed(2)}` : 'Free Delivery'}
                  </span>
                </div>

                {minOrderAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Minimum Order Required</span>
                    <span>Rs. {minOrderAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Minimum Order Warning */}
              {minOrderShortfall > 0 && (
                <Alert variant="warning" className="text-xs py-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Add <strong>Rs. {minOrderShortfall.toFixed(2)}</strong> more to reach the minimum order requirement for this store.
                  </AlertDescription>
                </Alert>
              )}

              {/* Inactive Items Warning */}
              {!cart.isValid && (
                <Alert variant="destructive" className="text-xs py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some items in your cart are currently out of stock or unavailable. Please adjust quantities before ordering.
                  </AlertDescription>
                </Alert>
              )}

              <div className="border-t pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-foreground">Estimated Total</span>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-foreground">
                    Rs. {estimatedTotal.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-muted-foreground">Includes delivery fee</p>
                </div>
              </div>

              {/* Checkout Action */}
              <div className="pt-2 space-y-2">
                <Button
                  className="w-full gap-2 font-semibold"
                  size="lg"
                  disabled={!cart.isValid || minOrderShortfall > 0}
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <p className="text-[11px] text-center text-muted-foreground">
                  Cash on Delivery • Authoritative real-time price &amp; inventory verification
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Clear Cart Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear Shopping Cart?</DialogTitle>
            <DialogDescription className="text-xs">
              This will remove all {cart.itemCount} items from your cart. You will then be able to add products from any store.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearCart}
              disabled={clearCart.isPending}
            >
              {clearCart.isPending ? 'Clearing…' : 'Yes, Clear Cart'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
export default CartPage;
