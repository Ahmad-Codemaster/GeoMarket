import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Store,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  ShieldCheck,
  Truck,
  ArrowLeft,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useCart } from '../../hooks/useCart';
import { useAddresses } from '../../hooks/useAddresses';
import { useCheckout } from '../../hooks/useOrders';
import { useToast } from '../../hooks/useToast';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: cart, isLoading: cartLoading, isError: cartError } = useCart();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const checkoutMutation = useCheckout();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Default to the default address or the first address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault);
      setSelectedAddressId(defaultAddr ? defaultAddr.id : addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  if (cartLoading || addressesLoading) {
    return (
      <PageContainer width="wide">
        <PageHeader title="Checkout" description="Review order details and confirm delivery" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (cartError || !cart || cart.items.length === 0) {
    return (
      <PageContainer width="narrow">
        <PageHeader title="Checkout" description="Review order details and confirm delivery" />
        <Card className="mt-6">
          <CardContent className="pt-6">
            <EmptyState
              icon={ShoppingBag}
              title="Your cart is empty"
              description="Add items from a local store to proceed with checkout."
              action={{
                label: 'Browse Nearby Stores',
                onClick: () => navigate('/stores'),
              }}
            />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const subtotal = cart.subtotal;
  const deliveryFee = cart.store?.baseDeliveryFee ?? cart.store?.deliveryFee ?? 0;
  const minOrderAmount = cart.store?.minOrderAmount ?? cart.store?.minimumOrderAmount ?? 0;
  const minOrderShortfall = Math.max(0, minOrderAmount - subtotal);
  const totalAmount = Math.round((subtotal + deliveryFee) * 100) / 100;

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setErrorMessage('Please select or add a delivery address.');
      return;
    }

    if (!cart.isValid) {
      setErrorMessage('Some items in your cart are currently out of stock or unavailable. Please review your cart.');
      return;
    }

    if (minOrderShortfall > 0) {
      setErrorMessage(
        `Minimum order requirement not met. Add Rs. ${minOrderShortfall.toFixed(2)} more to place your order.`
      );
      return;
    }

    setErrorMessage(null);

    try {
      const res = await checkoutMutation.mutateAsync({
        addressId: selectedAddressId,
      });

      toast({
        title: 'Order Placed Successfully!',
        description: `Order #${res.order.id.slice(0, 8)} has been confirmed with Cash on Delivery.`,
      });

      navigate(`/orders/${res.order.id}`);
    } catch (err: any) {
      const msg = err.message || 'Failed to place order. Please check store status and stock.';
      setErrorMessage(msg);
      toast({
        title: 'Checkout Failed',
        description: msg,
        variant: 'destructive',
      });
    }
  };

  return (
    <PageContainer width="wide">
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/cart')}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shopping Cart
        </Button>
      </div>

      <PageHeader
        title="Checkout & Confirmation"
        description="Review your delivery address, store items, and confirm Cash on Delivery"
      />

      {errorMessage && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Order Submission Error</AlertTitle>
          <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Left 2 columns: Delivery Address & Ordered Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Delivery Address Selection */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  1. Delivery Address
                </CardTitle>
                <CardDescription className="text-xs">
                  Select the delivery destination for this order
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => navigate('/addresses')}
              >
                <Plus className="h-3.5 w-3.5" />
                Manage Addresses
              </Button>
            </CardHeader>
            <CardContent>
              {!addresses || addresses.length === 0 ? (
                <div className="p-4 border rounded-lg bg-muted/30 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You haven't added any saved addresses yet.
                  </p>
                  <Button size="sm" onClick={() => navigate('/addresses')}>
                    Add Delivery Address
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setErrorMessage(null);
                        }}
                        className={`cursor-pointer rounded-lg p-3.5 border text-left transition-all ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                            : 'hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm capitalize">
                            {addr.addressLabel}
                          </span>
                          {addr.isDefault && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-foreground font-medium">
                          {addr.recipientName || 'You'} ({addr.recipientPhone || 'No phone'})
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {addr.addressLine}, {addr.city}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Store & Items Summary */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    2. Order Items from {cart.store?.name || 'Store'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {cart.itemCount} items scheduled for dispatch
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  Single-Store Order
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {cart.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="h-10 w-10 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium leading-tight">{item.productName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Rs. {item.unitPrice.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-right">
                      Rs. {item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Payment Method (COD Only) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                3. Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3.5 border rounded-lg bg-muted/20 border-primary/40">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Cash on Delivery (COD)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pay the total amount in cash directly to the dispatch rider upon delivery.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 column: Order Summary & Place Order */}
        <div>
          <Card className="sticky top-6 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">
                    Rs. {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" />
                    Delivery Fee
                  </span>
                  <span className="font-medium text-foreground">
                    Rs. {deliveryFee.toFixed(2)}
                  </span>
                </div>
                {minOrderAmount > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Store Minimum</span>
                    <span>Rs. {minOrderAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {minOrderShortfall > 0 && (
                <Alert variant="warning" className="py-2 text-xs">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Add <strong>Rs. {minOrderShortfall.toFixed(2)}</strong> more to reach minimum order.
                  </AlertDescription>
                </Alert>
              )}

              {!cart.isValid && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some items in your cart are no longer available. Please update your cart before proceeding.
                  </AlertDescription>
                </Alert>
              )}

              <div className="border-t pt-3 flex justify-between items-baseline">
                <span className="font-bold text-base">Grand Total</span>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-foreground">
                    Rs. {totalAmount.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-muted-foreground">Cash on Delivery</p>
                </div>
              </div>

              <Button
                className="w-full font-semibold gap-2"
                size="lg"
                disabled={
                  !selectedAddressId ||
                  !cart.isValid ||
                  minOrderShortfall > 0 ||
                  checkoutMutation.isPending
                }
                onClick={handlePlaceOrder}
              >
                {checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Placing Order…
                  </>
                ) : (
                  <>
                    Place Order (COD)
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Authoritative real-time stock & PostGIS verification</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

export default CheckoutPage;
