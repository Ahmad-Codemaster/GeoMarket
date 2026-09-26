import React, { useState, useEffect } from 'react';
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
  Navigation,
  User,
  Phone,
  Home,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Skeleton } from '../../components/ui/skeleton';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { EmptyState } from '../../components/common/EmptyState';
import { useCurrentUser, useGuestSession } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useAddresses } from '../../hooks/useAddresses';
import { useCheckout } from '../../hooks/useOrders';
import { useToast } from '../../hooks/useToast';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: currentUser } = useCurrentUser();
  const guestSessionMutation = useGuestSession();
  const { data: cart, isLoading: cartLoading, isError: cartError } = useCart();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const checkoutMutation = useCheckout();

  // Mode: 'saved' (if user has addresses) or 'inline' (guest / new address)
  const isGuestUser = !currentUser || currentUser.isGuest;
  const hasSavedAddresses = Boolean(addresses && addresses.length > 0);

  const [deliveryMode, setDeliveryMode] = useState<'saved' | 'inline'>(
    hasSavedAddresses && !isGuestUser ? 'saved' : 'inline'
  );

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Guest / Inline delivery form state
  const [fullName, setFullName] = useState(
    currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : ''
  );
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Islamabad');
  const [latitude, setLatitude] = useState<number>(33.6844);
  const [longitude, setLongitude] = useState<number>(73.0479);
  const [isLocating, setIsLocating] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync mode when addresses load
  useEffect(() => {
    if (addresses && addresses.length > 0 && !isGuestUser) {
      setDeliveryMode('saved');
      const defaultAddr = addresses.find((a) => a.isDefault);
      setSelectedAddressId(defaultAddr ? defaultAddr.id : addresses[0].id);
    } else {
      setDeliveryMode('inline');
    }
  }, [addresses, isGuestUser]);

  useEffect(() => {
    if (currentUser) {
      if (!fullName) {
        setFullName(`${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim());
      }
      if (!phone && currentUser.phone) {
        setPhone(currentUser.phone);
      }
    }
  }, [currentUser]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location Unavailable',
        description: 'Geolocation is not supported by your browser.',
        variant: 'destructive',
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setIsLocating(false);
        toast({
          title: 'Location Updated',
          description: 'Your current GPS coordinates have been set.',
        });
      },
      (err) => {
        setIsLocating(false);
        toast({
          title: 'Location Error',
          description: err.message || 'Could not fetch your current location.',
          variant: 'destructive',
        });
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  if (cartLoading || (addressesLoading && !isGuestUser)) {
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
      let checkoutPayload: any = {};

      if (deliveryMode === 'saved') {
        if (!selectedAddressId) {
          setErrorMessage('Please select a saved delivery address or switch to new address.');
          return;
        }
        checkoutPayload = { addressId: selectedAddressId };
      } else {
        // Validate guest/inline fields
        const trimmedName = fullName.trim();
        const trimmedPhone = phone.trim();
        const trimmedAddress = addressLine.trim();
        const trimmedCity = city.trim() || 'Islamabad';

        if (!trimmedName || trimmedName.length < 2) {
          setErrorMessage('Please enter your full recipient name (at least 2 characters).');
          return;
        }
        if (!trimmedPhone || trimmedPhone.length < 7) {
          setErrorMessage('Please enter a valid contact phone number (at least 7 digits).');
          return;
        }
        if (!trimmedAddress || trimmedAddress.length < 5) {
          setErrorMessage('Please enter your complete street / delivery address (at least 5 characters).');
          return;
        }
        if (!trimmedCity || trimmedCity.length < 2) {
          setErrorMessage('Please enter a valid city name.');
          return;
        }

        // If not logged in at all, ensure guest session exists
        if (!currentUser) {
          await guestSessionMutation.mutateAsync({
            firstName: trimmedName.split(' ')[0] || 'Guest',
            lastName: trimmedName.split(' ').slice(1).join(' ') || 'Customer',
            phone: trimmedPhone,
          });
        }

        checkoutPayload = {
          inlineAddress: {
            recipientName: trimmedName,
            recipientPhone: trimmedPhone,
            addressLine: trimmedAddress,
            city: trimmedCity,
            latitude: latitude || 33.6844,
            longitude: longitude || 73.0479,
          },
        };
      }

      const res = await checkoutMutation.mutateAsync(checkoutPayload);

      toast({
        title: 'Order Placed Successfully!',
        description: `Order #${res.order.id.slice(0, 8)} has been confirmed with Cash on Delivery.`,
      });

      // Navigate to order celebration & invoice page
      navigate(`/orders/${res.order.id}/success`);
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
        title="Checkout & Delivery"
        description="Review your delivery details, items, and confirm Cash on Delivery"
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
          {/* Step 1: Delivery Address */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  1. Delivery Destination
                </CardTitle>
                <CardDescription className="text-xs">
                  Where should the store rider deliver your order?
                </CardDescription>
              </div>
              {hasSavedAddresses && !isGuestUser && (
                <div className="flex gap-2">
                  <Button
                    variant={deliveryMode === 'saved' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setDeliveryMode('saved')}
                  >
                    Saved Addresses
                  </Button>
                  <Button
                    variant={deliveryMode === 'inline' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setDeliveryMode('inline')}
                  >
                    New Address
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {deliveryMode === 'saved' && hasSavedAddresses ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses?.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddressId(addr.id);
                            setErrorMessage(null);
                          }}
                          className={`cursor-pointer rounded-xl p-3.5 border text-left transition-all ${
                            isSelected
                              ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
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
                            {addr.recipientName || 'Recipient'} ({addr.recipientPhone || 'No phone'})
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {addr.addressLine}, {addr.city}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Inline / Guest Delivery Form */
                <div className="space-y-4 pt-1">
                  {isGuestUser && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Ordering as a <strong>Guest</strong>. No password needed!
                      </span>
                      <Link to="/login" className="text-primary font-semibold hover:underline">
                        Log in for saved addresses
                      </Link>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-xs font-semibold flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="e.g. Sara Ahmed"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        Contact Phone *
                      </Label>
                      <Input
                        id="phone"
                        placeholder="e.g. 03001234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="addressLine" className="text-xs font-semibold flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5 text-muted-foreground" />
                      Street Address / House No. *
                    </Label>
                    <Input
                      id="addressLine"
                      placeholder="e.g. House 42, Street 7, Sector F-7/2"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-xs font-semibold">
                        City
                      </Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center justify-between">
                        <span>Delivery Location Coords</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[11px] gap-1 text-primary hover:text-primary"
                          onClick={handleUseCurrentLocation}
                          disabled={isLocating}
                        >
                          {isLocating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Navigation className="h-3 w-3" />
                          )}
                          {isLocating ? 'Detecting...' : 'Use GPS'}
                        </Button>
                      </Label>
                      <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border flex items-center justify-between">
                        <span>Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}</span>
                        <Badge variant="outline" className="text-[10px]">Auto-Targeted</Badge>
                      </div>
                    </div>
                  </div>
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
                  Direct Store Order
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
              <div className="flex items-center gap-3 p-3.5 border rounded-xl bg-primary/5 border-primary/30">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Cash on Delivery (COD)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pay safely in cash directly to the delivery rider upon receiving your package.
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
                <Alert className="py-2 text-xs border-amber-300 bg-amber-50 text-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
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
                className="w-full font-semibold gap-2 shadow-md hover-lift"
                size="lg"
                disabled={
                  (deliveryMode === 'saved' && !selectedAddressId) ||
                  (deliveryMode === 'inline' && (!fullName.trim() || !phone.trim() || !addressLine.trim())) ||
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

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center">
                <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Fast & secure local order fulfillment</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

export default CheckoutPage;
