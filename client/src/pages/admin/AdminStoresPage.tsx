import { useState, useMemo } from 'react';
import {
  Store,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Building2,
  MapPin,
} from 'lucide-react';
import { StoreStatus, type StoreDto } from '@geomarket/shared';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../components/ui/table';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { StoreAuditModal } from '../../components/admin/StoreAuditModal';
import { useAdminStores } from '../../hooks/useStores';

type FilterTab = 'ALL' | StoreStatus;

export function AdminStoresPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<StoreDto | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  const filters = useMemo(() => {
    if (activeTab === 'ALL') return undefined;
    return { status: activeTab };
  }, [activeTab]);

  const { data: stores, isLoading, error, refetch, isFetching } = useAdminStores(filters);

  const handleOpenAudit = (store: StoreDto) => {
    setSelectedStore(store);
    setAuditModalOpen(true);
  };

  const filteredStores = useMemo(() => {
    if (!stores) return [];
    if (!searchTerm.trim()) return stores;
    const term = searchTerm.toLowerCase();
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.city.toLowerCase().includes(term) ||
        (s.vendorProfile?.businessLegalName &&
          s.vendorProfile.businessLegalName.toLowerCase().includes(term)) ||
        (s.storeCategory?.name && s.storeCategory.name.toLowerCase().includes(term)),
    );
  }, [stores, searchTerm]);

  const renderStatusBadge = (status: StoreStatus) => {
    switch (status) {
      case StoreStatus.APPROVED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case StoreStatus.PENDING_APPROVAL:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3" />
            Pending Review
          </span>
        );
      case StoreStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      case StoreStatus.SUSPENDED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-200 text-zinc-800 border border-zinc-300">
            <AlertTriangle className="h-3 w-3" />
            Suspended
          </span>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const tabs: { key: FilterTab; label: string; icon: any }[] = [
    { key: 'ALL', label: 'All Stores', icon: Store },
    { key: StoreStatus.PENDING_APPROVAL, label: 'Pending Approval', icon: Clock },
    { key: StoreStatus.APPROVED, label: 'Approved', icon: CheckCircle2 },
    { key: StoreStatus.REJECTED, label: 'Rejected', icon: XCircle },
    { key: StoreStatus.SUSPENDED, label: 'Suspended', icon: AlertTriangle },
  ];

  return (
    <PageContainer width="wide">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader
          title="Store Verification &amp; Governance"
          description="Audit physical coordinates, verify merchant licenses, and oversee store lifecycle states"
          className="mb-0"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5 self-start sm:self-auto text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Queue
        </Button>
      </div>

      <div className="space-y-5">
        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b pb-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Counter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by store name, city, vendor..."
              className="pl-9 text-xs h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredStores.length}</span> stores
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <LoadingState label="Fetching store records…" />
        ) : error ? (
          <ErrorState
            title="Failed to load store records"
            message={(error as any)?.message || 'An error occurred while communicating with the store registry.'}
            onRetry={() => refetch()}
          />
        ) : filteredStores.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={Store}
                title="No Stores Found"
                description={
                  searchTerm
                    ? 'No stores match your search criteria. Try a different query or reset filters.'
                    : activeTab === 'ALL'
                    ? 'No physical stores have registered on GeoMarket yet.'
                    : `No stores currently have the status "${activeTab}".`
                }
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Store Registry &amp; Queue</CardTitle>
              <CardDescription className="text-xs">
                Review store physical centroids, delivery polygons, and verified business legal entities
              </CardDescription>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Storefront</TableHead>
                    <TableHead className="text-xs font-semibold">Category</TableHead>
                    <TableHead className="text-xs font-semibold">Vendor Legal Entity</TableHead>
                    <TableHead className="text-xs font-semibold">City &amp; Address</TableHead>
                    <TableHead className="text-xs font-semibold">Radius</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.map((store) => (
                    <TableRow key={store.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-xs text-foreground">{store.name}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">{store.slug}</p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">
                          {store.storeCategory?.name || 'Unassigned'}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground">
                            {store.vendorProfile?.businessLegalName || 'Unassigned'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate max-w-[180px]" title={store.addressLine}>
                            {store.city} ({store.addressLine})
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs">
                        {store.deliveryRadiusKm} km
                      </TableCell>

                      <TableCell>
                        {renderStatusBadge(store.status)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenAudit(store)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                          Inspect &amp; Audit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* Audit Modal */}
      <StoreAuditModal
        open={auditModalOpen}
        onOpenChange={setAuditModalOpen}
        store={selectedStore}
        onSuccess={() => refetch()}
      />
    </PageContainer>
  );
}
