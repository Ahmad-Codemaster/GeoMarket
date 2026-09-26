import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Trash2, CheckCircle2, Star, Loader2 } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { LocationPickerModal } from '../../components/location/LocationPickerModal';
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from '../../hooks/useAddresses';
import { useCurrentUser } from '../../hooks/useAuth';
import { toast } from '../../hooks/useToast';

export function SavedAddressesPage() {
  const { data: user } = useCurrentUser();
  const [modalOpen, setModalOpen] = useState(false);
  const { data: addresses, isLoading, isError, refetch } = useAddresses();
  const deleteMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();

  const handleDelete = async (id: string, label: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: 'Address deleted',
        description: `${label} has been removed from your saved delivery locations.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: 'Unable to remove address. Please try again.',
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultMutation.mutateAsync(id);
      toast({
        title: 'Default address updated',
        description: 'Your primary delivery location has been updated.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Unable to update default address.',
      });
    }
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Delivery Locations"
        description="Manage your customer-designated delivery coordinates and drop-off addresses"
        action={
          <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Delivery Location
          </Button>
        }
      />

      <div className="space-y-6">
        {(user as any)?.isGuest && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-sm">
            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Guest Session Active:</strong> Locations configured in this session will be saved temporarily. Log in to permanently link them to your customer account.
              </span>
            </div>
            <Button size="sm" variant="outline" asChild className="shrink-0 bg-white border-emerald-300 hover:bg-emerald-100 text-emerald-800">
              <Link to="/login">Log In to Save</Link>
            </Button>
          </div>
        )}

        {isLoading ? (
          <LoadingState label="Loading delivery locations…" />
        ) : isError ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-destructive">
              Failed to load saved addresses. Please refresh or try again later.
            </CardContent>
          </Card>
        ) : !addresses || addresses.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saved Locations</CardTitle>
              <CardDescription>
                Locations used during checkout and store proximity matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={MapPin}
                title="No Delivery Locations Configured"
                description="Add your home, office, or frequent drop-off location using the interactive map to enable local store discovery."
                action={{
                  label: 'Add First Location',
                  onClick: () => setModalOpen(true),
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((addr) => (
              <Card
                key={addr.id}
                className={addr.isDefault ? 'border-primary/50 shadow-xs' : 'border-border/60'}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold">{addr.addressLabel}</CardTitle>
                      {addr.isDefault && (
                        <Badge variant="default" className="text-[10px] gap-1 px-1.5 py-0">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-xs">{addr.city}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-2 text-sm pb-4">
                  <p className="font-medium text-foreground">{addr.addressLine}</p>

                  {(addr.recipientName || addr.recipientPhone) && (
                    <div className="text-xs text-muted-foreground pt-1 border-t">
                      {addr.recipientName && <span>Contact: {addr.recipientName}</span>}
                      {addr.recipientPhone && <span className="block">{addr.recipientPhone}</span>}
                    </div>
                  )}

                  <div className="text-[11px] font-mono text-muted-foreground pt-1">
                    {addr.latitude.toFixed(6)}, {addr.longitude.toFixed(6)}
                  </div>
                </CardContent>

                <CardFooter className="pt-2 pb-4 border-t flex items-center justify-between">
                  {!addr.isDefault ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 px-2"
                      onClick={() => handleSetDefault(addr.id)}
                      disabled={setDefaultMutation.isPending}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Set as Default
                    </Button>
                  ) : (
                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Primary Address
                    </span>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(addr.id, addr.addressLabel)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <LocationPickerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAddressCreated={() => refetch()}
      />
    </PageContainer>
  );
}
