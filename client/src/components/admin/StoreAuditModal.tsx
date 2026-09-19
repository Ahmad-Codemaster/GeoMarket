import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import {
  ShieldCheck,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Mail,
  Phone,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { StoreStatus, type StoreDto } from '@geomarket/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { getActiveMapTileProvider } from '../../lib/maps/mapTileProvider';
import {
  useAdminStore,
  useApproveStore,
  useRejectStore,
  useSuspendStore,
  useRestoreStore,
} from '../../hooks/useStores';
import { toast } from '../../hooks/useToast';

interface StoreAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreDto | null;
  onSuccess?: () => void;
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function StoreAuditModal({
  open,
  onOpenChange,
  store: initialStore,
  onSuccess,
}: StoreAuditModalProps) {
  // Query full store details if id is available to ensure latest operating hours & vendor profile
  const { data: refreshedStore } = useAdminStore(open && initialStore ? initialStore.id : null);
  const store = refreshedStore || initialStore;

  const tileProvider = useMemo(() => getActiveMapTileProvider(), []);
  const tileConfig = tileProvider.getTileConfig();

  const approveMutation = useApproveStore();
  const rejectMutation = useRejectStore();
  const suspendMutation = useSuspendStore();
  const restoreMutation = useRestoreStore();

  // Sub-action prompt states
  const [actionPrompt, setActionPrompt] = useState<'idle' | 'reject' | 'suspend'>('idle');
  const [reasonInput, setReasonInput] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setActionPrompt('idle');
      setReasonInput('');
      setReasonError(null);
    }
  }, [open, store?.id]);

  if (!store) return null;

  const lat = Number(store.latitude) || 31.4124;
  const lon = Number(store.longitude) || 73.1091;
  const radiusMeters = Math.max(100, (Number(store.deliveryRadiusKm) || 5) * 1000);

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(store.id);
      toast({
        variant: 'success',
        title: 'Store approved',
        description: `"${store.name}" has been verified and marked active for marketplace discovery.`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Approval failed',
        description: err.message || 'Could not approve store.',
      });
    }
  };

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync(store.id);
      toast({
        variant: 'success',
        title: 'Store restored',
        description: `"${store.name}" operations and listing status have been restored.`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Restore failed',
        description: err.message || 'Could not restore store.',
      });
    }
  };

  const handleConfirmPrompt = async () => {
    if (reasonInput.trim().length < 5) {
      setReasonError('Reason must be at least 5 characters long.');
      return;
    }

    try {
      if (actionPrompt === 'reject') {
        await rejectMutation.mutateAsync({ id: store.id, reason: reasonInput.trim() });
        toast({
          variant: 'destructive',
          title: 'Store rejected',
          description: `"${store.name}" was rejected. Feedback was transmitted to the vendor.`,
        });
      } else if (actionPrompt === 'suspend') {
        await suspendMutation.mutateAsync({ id: store.id, reason: reasonInput.trim() });
        toast({
          variant: 'destructive',
          title: 'Store suspended',
          description: `"${store.name}" has been suspended from operating on GeoMarket.`,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setReasonError(err.message || 'Action failed. Please try again.');
    }
  };

  const isMutating =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    suspendMutation.isPending ||
    restoreMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-6">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle className="text-lg font-bold">{store.name}</DialogTitle>
                <DialogDescription className="text-xs">
                  Physical Store Verification &amp; Spatial Boundary Audit
                </DialogDescription>
              </div>
            </div>

            {store.status === StoreStatus.APPROVED && (
              <Badge variant="success">Approved</Badge>
            )}
            {store.status === StoreStatus.PENDING_APPROVAL && (
              <Badge variant="warning">Pending Approval</Badge>
            )}
            {store.status === StoreStatus.REJECTED && (
              <Badge variant="destructive">Rejected</Badge>
            )}
            {store.status === StoreStatus.SUSPENDED && (
              <Badge variant="secondary">Suspended</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Section 1: Spatial Boundary & Centroid Map Inspection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                Physical Centroid &amp; Delivery Polygon
              </h4>
              <span className="text-xs font-mono text-muted-foreground">
                Radius: {store.deliveryRadiusKm} km ({Math.round(radiusMeters)} m)
              </span>
            </div>

            <div className="h-64 w-full rounded-lg border overflow-hidden relative shadow-inner">
              {open && (
                <MapContainer
                  center={[lat, lon]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url={tileConfig.urlTemplate}
                    attribution={tileConfig.attribution}
                    maxZoom={tileConfig.maxZoom}
                    minZoom={tileConfig.minZoom}
                  />
                  <Marker position={[lat, lon]} />
                  <Circle
                    center={[lat, lon]}
                    radius={radiusMeters}
                    pathOptions={{
                      color: '#0284c7',
                      fillColor: '#38bdf8',
                      fillOpacity: 0.25,
                      weight: 2,
                    }}
                  />
                  <MapCenterController center={[lat, lon]} />
                  <MapResizer />
                </MapContainer>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-muted/40 p-2.5 rounded-md border">
              <div>
                <span className="text-muted-foreground block text-[10px]">City</span>
                <span className="font-semibold">{store.city}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Street Address</span>
                <span className="font-semibold truncate block" title={store.addressLine}>
                  {store.addressLine}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Coordinates</span>
                <span>{lat.toFixed(5)}, {lon.toFixed(5)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Delivery Radius</span>
                <span className="font-semibold">{store.deliveryRadiusKm} km</span>
              </div>
            </div>
          </div>

          {/* Section 2: Vendor Legal & Representative Information */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-primary" />
              Verified Vendor Legal Entity
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border text-xs">
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Business Legal Name:</span>
                  <span className="font-semibold text-sm">
                    {store.vendorProfile?.businessLegalName || 'N/A (Unassigned)'}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Tax Identification (NTN / FTN):</span>
                  <span className="font-mono font-medium">
                    {store.vendorProfile?.taxIdNumber || 'Not provided'}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Category Classification:</span>
                  <span className="font-medium">
                    {store.storeCategory?.name || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 sm:border-l sm:pl-4">
                <span className="text-muted-foreground block text-[11px] font-semibold uppercase">
                  Vendor Representative Contact:
                </span>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {store.vendorProfile?.user
                      ? `${store.vendorProfile.user.firstName} ${store.vendorProfile.user.lastName}`
                      : 'No contact details'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono">
                    {store.vendorProfile?.user?.email || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono">
                    {store.vendorProfile?.user?.phone || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Commercial Policy & Operating Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                Commercial Parameters
              </h4>
              <div className="p-3 bg-muted/30 rounded-lg border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Delivery Fee:</span>
                  <span className="font-semibold">PKR {Number(store.baseDeliveryFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Order Amount:</span>
                  <span className="font-semibold">PKR {Number(store.minOrderAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Intake Status:</span>
                  <span className={store.isAcceptingOrders ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                    {store.isAcceptingOrders ? 'Accepting Orders' : 'Paused'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Catalog State:</span>
                  <span className={store.isActive ? 'text-emerald-600 font-semibold' : 'text-zinc-600'}>
                    {store.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                Operating Hours Schedule
              </h4>
              <div className="p-2.5 bg-muted/30 rounded-lg border text-xs max-h-36 overflow-y-auto space-y-1">
                {DAY_NAMES.map((dayName, idx) => {
                  const dayHour = store.operatingHours?.find((h) => h.dayOfWeek === idx);
                  const isClosed = dayHour ? dayHour.isClosed : false;
                  return (
                    <div key={idx} className="flex justify-between text-[11px] py-0.5 border-b border-muted/50 last:border-0">
                      <span className="font-medium text-muted-foreground w-24">{dayName}</span>
                      {isClosed ? (
                        <span className="text-rose-600 font-medium">Closed</span>
                      ) : dayHour?.openingTime ? (
                        <span className="font-mono text-foreground">
                          {dayHour.openingTime} - {dayHour.closingTime}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-mono">09:00 - 22:00</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Existing Rejection / Suspension Remarks */}
          {store.rejectionReason && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-rose-900 flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-rose-600" />
                Current Rejection Reason:
              </span>
              <p className="text-rose-800 leading-relaxed pl-5.5">
                {store.rejectionReason}
              </p>
            </div>
          )}

          {store.suspensionReason && (
            <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-zinc-700" />
                Current Suspension Reason:
              </span>
              <p className="text-zinc-800 leading-relaxed pl-5.5">
                {store.suspensionReason}
              </p>
            </div>
          )}

          {/* Section 5: Inline Action Reason Prompt (Reject or Suspend) */}
          {actionPrompt !== 'idle' && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  {actionPrompt === 'reject' ? 'Store Rejection Feedback' : 'Store Suspension Justification'}
                </Label>
                <span className="text-[11px] text-amber-800">Minimum 5 characters required</span>
              </div>

              <textarea
                className="w-full text-xs rounded-md border border-amber-300 bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={3}
                placeholder={
                  actionPrompt === 'reject'
                    ? 'Enter specific non-compliance rationale (e.g. invalid physical address, outside trade jurisdiction, missing licenses)...'
                    : 'Enter justification for suspending this storefront (e.g. repeated unfulfilled orders, vendor dispute)...'
                }
                value={reasonInput}
                onChange={(e) => {
                  setReasonInput(e.target.value);
                  if (reasonError) setReasonError(null);
                }}
              />

              {reasonError && (
                <p className="text-xs text-destructive font-medium">{reasonError}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActionPrompt('idle')}
                  disabled={isMutating}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant={actionPrompt === 'reject' ? 'destructive' : 'default'}
                  onClick={handleConfirmPrompt}
                  disabled={isMutating || reasonInput.trim().length < 5}
                  className="text-xs h-8 gap-1.5"
                >
                  {isMutating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : actionPrompt === 'reject' ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  {actionPrompt === 'reject' ? 'Confirm Rejection' : 'Confirm Suspension'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {actionPrompt === 'idle' && (
          <DialogFooter className="mt-4 pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground self-start sm:self-auto">
              Store ID: <span className="font-mono">{store.id}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isMutating}
                className="text-xs h-8"
              >
                Close
              </Button>

              {store.status === StoreStatus.SUSPENDED && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleRestore}
                  disabled={isMutating}
                  className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {restoreMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  Restore Store
                </Button>
              )}

              {store.status === StoreStatus.APPROVED && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActionPrompt('suspend')}
                  disabled={isMutating}
                  className="text-xs h-8 gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  Suspend Store
                </Button>
              )}

              {store.status === StoreStatus.PENDING_APPROVAL && (
                <>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setActionPrompt('reject')}
                    disabled={isMutating}
                    className="text-xs h-8 gap-1.5"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject Store
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={isMutating}
                    className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Approve Store
                  </Button>
                </>
              )}

              {store.status === StoreStatus.REJECTED && (
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={isMutating}
                  className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Override &amp; Approve
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
