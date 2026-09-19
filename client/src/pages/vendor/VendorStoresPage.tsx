import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Plus,
  MapPin,
  Clock,
  Edit,
  Power,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
  Package,
} from 'lucide-react';
import { StoreStatus, type StoreDto } from '@geomarket/shared';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { StoreFormModal } from '../../components/vendor/StoreFormModal';
import { StoreHoursModal } from '../../components/vendor/StoreHoursModal';
import {
  useVendorStores,
  useToggleStoreOrders,
  useResubmitStore,
} from '../../hooks/useStores';
import { toast } from '../../hooks/useToast';

export function VendorStoresPage() {
  const { data: stores, isLoading, error, refetch } = useVendorStores();
  const toggleOrdersMutation = useToggleStoreOrders();
  const resubmitMutation = useResubmitStore();

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreDto | null>(null);

  const handleOpenCreate = () => {
    setSelectedStore(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (store: StoreDto) => {
    setSelectedStore(store);
    setFormModalOpen(true);
  };

  const handleOpenHours = (store: StoreDto) => {
    setSelectedStore(store);
    setHoursModalOpen(true);
  };

  const handleToggleOrders = async (store: StoreDto) => {
    try {
      await toggleOrdersMutation.mutateAsync(store.id);
      toast({
        variant: 'success',
        title: store.isAcceptingOrders ? 'Store orders paused' : 'Store accepting orders',
        description: `${store.name} order intake status has been toggled.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to update order acceptance',
        description: err.message || 'Please try again later.',
      });
    }
  };

  const handleResubmit = async (store: StoreDto) => {
    try {
      await resubmitMutation.mutateAsync(store.id);
      toast({
        variant: 'success',
        title: 'Store resubmitted',
        description: `${store.name} has been resubmitted to the administrative approval queue.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Resubmission failed',
        description: err.message || 'Please try again later.',
      });
    }
  };

  const renderStatusBadge = (status: StoreStatus) => {
    switch (status) {
      case StoreStatus.APPROVED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </span>
        );
      case StoreStatus.PENDING_APPROVAL:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            Pending Approval
          </span>
        );
      case StoreStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </span>
        );
      case StoreStatus.SUSPENDED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-200 text-zinc-800 border border-zinc-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            Suspended
          </span>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <PageContainer width="wide">
        <PageHeader
          title="Store Management"
          description="Physical storefronts and operational locations linked to your Vendor Profile"
        />
        <LoadingState label="Loading your registered stores…" />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer width="wide">
        <PageHeader
          title="Store Management"
          description="Physical storefronts and operational locations linked to your Vendor Profile"
        />
        <ErrorState
          title="Failed to load stores"
          message={(error as any)?.message || 'Could not fetch your store roster.'}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="wide">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader
          title="Store Management"
          description="Physical storefronts, delivery radius zones, and operational hours linked to your Vendor Profile"
          className="mb-0"
        />

        <Button onClick={handleOpenCreate} className="gap-2 shrink-0 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Register New Store
        </Button>
      </div>

      {!stores || stores.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Store}
              title="No Stores Registered Yet"
              description="Register your physical retail storefront, set its exact coordinates on the map, and configure your delivery radius to start receiving orders."
              action={{
                label: 'Register First Store',
                onClick: handleOpenCreate,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {stores.map((store) => {
            const isApproved = store.status === StoreStatus.APPROVED;
            const isPending = store.status === StoreStatus.PENDING_APPROVAL;
            const isRejected = store.status === StoreStatus.REJECTED;
            const isSuspended = store.status === StoreStatus.SUSPENDED;

            return (
              <Card key={store.id} className="overflow-hidden border shadow-sm transition-all hover:shadow-md">
                {/* Header Strip */}
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <CardTitle className="text-lg font-bold">{store.name}</CardTitle>
                        {renderStatusBadge(store.status)}
                        {store.storeCategory && (
                          <Badge variant="secondary" className="text-xs">
                            {store.storeCategory.name}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-1.5 text-xs">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>
                          {store.addressLine}, {store.city}
                        </span>
                      </CardDescription>
                    </div>

                    {/* Operational Switch: Accepting Orders */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant={store.isAcceptingOrders ? 'outline' : 'secondary'}
                        onClick={() => handleToggleOrders(store)}
                        disabled={toggleOrdersMutation.isPending || !isApproved}
                        className={`gap-1.5 text-xs h-9 ${
                          store.isAcceptingOrders
                            ? 'border-emerald-500 text-emerald-700 hover:bg-emerald-50'
                            : 'text-muted-foreground'
                        }`}
                        title={!isApproved ? 'Store must be approved by admin to accept orders' : undefined}
                      >
                        <Power
                          className={`h-3.5 w-3.5 ${
                            store.isAcceptingOrders ? 'text-emerald-600 fill-emerald-600' : 'text-muted-foreground'
                          }`}
                        />
                        {store.isAcceptingOrders ? 'Accepting Orders' : 'Orders Paused'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Rejection Warning Banner */}
                  {isRejected && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-2">
                      <div className="flex items-start gap-2 text-rose-800">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-rose-900">
                            Rejection feedback from administrator:
                          </p>
                          <p className="mt-0.5 leading-relaxed text-rose-800">
                            {store.rejectionReason || 'Store information does not comply with marketplace policies.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleOpenEdit(store)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Fix Store Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResubmit(store)}
                          disabled={resubmitMutation.isPending}
                          className="h-8 text-xs gap-1.5 border-rose-300 hover:bg-rose-100"
                        >
                          {resubmitMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          Resubmit for Approval
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Suspension Notice */}
                  {isSuspended && (
                    <div className="p-4 bg-zinc-100 border border-zinc-300 rounded-lg text-xs flex items-start gap-2 text-zinc-800">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-zinc-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-zinc-900">
                          Store suspended by administrator:
                        </p>
                        <p className="mt-0.5 leading-relaxed text-zinc-700">
                          {store.suspensionReason || 'Store operations are temporarily halted pending compliance resolution.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pending Notice */}
                  {isPending && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-center gap-2 text-amber-800">
                      <HelpCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>
                        This storefront is currently in the administrative verification queue. Once approved, it will become discoverable to nearby customers.
                      </span>
                    </div>
                  )}

                  {/* Store Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 bg-muted/40 rounded-md border">
                      <span className="text-muted-foreground block mb-0.5">Delivery Radius</span>
                      <span className="font-semibold text-sm">{store.deliveryRadiusKm} km</span>
                    </div>

                    <div className="p-2.5 bg-muted/40 rounded-md border">
                      <span className="text-muted-foreground block mb-0.5">Base Delivery Fee</span>
                      <span className="font-semibold text-sm">PKR {Number(store.baseDeliveryFee).toFixed(0)}</span>
                    </div>

                    <div className="p-2.5 bg-muted/40 rounded-md border">
                      <span className="text-muted-foreground block mb-0.5">Minimum Order</span>
                      <span className="font-semibold text-sm">PKR {Number(store.minOrderAmount).toFixed(0)}</span>
                    </div>

                    <div className="p-2.5 bg-muted/40 rounded-md border">
                      <span className="text-muted-foreground block mb-0.5">Customer Rating</span>
                      <span className="font-semibold text-sm">
                        {Number(store.averageRating) > 0
                          ? `★ ${Number(store.averageRating).toFixed(1)} (${store.totalReviews})`
                          : 'No reviews yet'}
                      </span>
                    </div>
                  </div>

                  {store.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {store.description}
                    </p>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-1.5 text-xs h-8"
                    >
                      <Link to={`/vendor/stores/${store.id}/products`}>
                        <Package className="h-3.5 w-3.5" />
                        Products
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenHours(store)}
                      className="gap-1.5 text-xs h-8"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Operating Hours
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenEdit(store)}
                      className="gap-1.5 text-xs h-8"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <StoreFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        store={selectedStore}
        onSuccess={() => refetch()}
      />

      <StoreHoursModal
        open={hoursModalOpen}
        onOpenChange={setHoursModalOpen}
        store={selectedStore}
        onSuccess={() => refetch()}
      />
    </PageContainer>
  );
}
