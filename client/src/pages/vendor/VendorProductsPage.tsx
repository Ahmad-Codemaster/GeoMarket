import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Layers,
  Boxes,
  Edit,
  Trash2,
  Power,
  Store,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { ProductFormModal } from '../../components/vendor/ProductFormModal';
import { StockAdjustmentModal } from '../../components/vendor/StockAdjustmentModal';
import {
  useVendorProducts,
  useToggleProductActive,
  useDeleteProduct,
} from '../../hooks/useProducts';
import { useVendorStores } from '../../hooks/useStores';
import { useProductCategories } from '../../hooks/useCategories';
import { toast } from '../../hooks/useToast';
import type { ProductDto } from '@geomarket/shared';

export function VendorProductsPage() {
  const { storeId: paramStoreId } = useParams<{ storeId?: string }>();

  // Fetch vendor stores to know available stores and store names
  const { data: stores = [], isLoading: isLoadingStores } = useVendorStores();
  const { data: categories = [] } = useProductCategories();

  // Selected store filter (default to paramStoreId if provided, or 'all')
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>(
    paramStoreId || 'all',
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductDto | null>(null);

  // Queries & Mutations
  const activeFilterParam =
    selectedStatusFilter === 'active'
      ? true
      : selectedStatusFilter === 'inactive'
      ? false
      : undefined;

  const currentStoreId =
    paramStoreId || (selectedStoreFilter !== 'all' ? selectedStoreFilter : undefined);

  const {
    data: products = [],
    isLoading: isLoadingProducts,
    error: productsError,
    refetch,
  } = useVendorProducts({
    storeId: currentStoreId,
    categoryId: selectedCategoryFilter !== 'all' ? selectedCategoryFilter : undefined,
    isActive: activeFilterParam,
    search: searchQuery.trim() || undefined,
  });

  const toggleActiveMutation = useToggleProductActive();
  const deleteMutation = useDeleteProduct();

  // Store information if scoped to a specific store
  const activeStore = useMemo(() => {
    if (!currentStoreId) return null;
    return stores.find((s) => s.id === currentStoreId) || null;
  }, [stores, currentStoreId]);

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (product: ProductDto) => {
    setSelectedProduct(product);
    setFormModalOpen(true);
  };

  const handleOpenStock = (product: ProductDto) => {
    setSelectedProduct(product);
    setStockModalOpen(true);
  };

  const handleToggleActive = async (product: ProductDto) => {
    try {
      await toggleActiveMutation.mutateAsync({
        productId: product.id,
        isActive: !product.isActive,
      });

      toast({
        variant: 'success',
        title: product.isActive ? 'Product deactivated' : 'Product activated',
        description: `"${product.name}" is now ${product.isActive ? 'inactive' : 'active'}.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to update product status',
        description: err.message || 'Please try again later.',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await deleteMutation.mutateAsync(productToDelete.id);
      toast({
        variant: 'success',
        title: 'Product deleted',
        description: `"${productToDelete.name}" has been removed from catalog.`,
      });
      setProductToDelete(null);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete product',
        description: err.message || 'Please try again later.',
      });
    }
  };

  const renderStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="h-3 w-3" />
          Out of Stock
        </span>
      );
    }
    if (quantity <= 10) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          Low Stock ({quantity})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        In Stock ({quantity})
      </span>
    );
  };

  if (isLoadingStores || (isLoadingProducts && products.length === 0)) {
    return (
      <PageContainer width="wide">
        <LoadingState label="Loading catalog and inventory..." />
      </PageContainer>
    );
  }

  if (productsError) {
    return (
      <PageContainer width="wide">
        <ErrorState
          title="Could not load products"
          message={(productsError as any)?.message || 'An error occurred while loading your product catalog.'}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  // If vendor has no stores created yet
  if (stores.length === 0) {
    return (
      <PageContainer width="wide">
        <PageHeader
          title="Product Catalog &amp; Inventory"
          description="Manage catalog items, pricing, attributes, and stock for your physical stores"
        />
        <Card className="mt-6">
          <CardContent className="pt-6">
            <EmptyState
              icon={Store}
              title="No Stores Registered Yet"
              description="You must register and set up a physical store before you can add products to your catalog."
              action={{
                label: 'Register a Store',
                onClick: () => window.location.assign('/vendor/stores'),
              }}
            />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="wide">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {activeStore ? `${activeStore.name} — Products` : 'Product Catalog & Inventory'}
            </h1>
            {activeStore && (
              <Badge variant="outline" className="text-xs">
                {activeStore.city}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage inventory levels, prices, attributes, and availability across your stores.
          </p>
          {paramStoreId && (
            <div className="mt-2">
              <Link
                to="/vendor/products"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                &larr; View all store products
              </Link>
            </div>
          )}
        </div>

        <Button onClick={handleOpenCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 my-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Store Selector (if not locked by param) */}
        {!paramStoreId && (
          <div>
            <select
              value={selectedStoreFilter}
              onChange={(e) => setSelectedStoreFilter(e.target.value)}
              className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Stores ({stores.length})</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Package}
              title={
                searchQuery || selectedCategoryFilter !== 'all' || selectedStatusFilter !== 'all'
                  ? 'No Products Found'
                  : 'No Products In Catalog'
              }
              description={
                searchQuery || selectedCategoryFilter !== 'all' || selectedStatusFilter !== 'all'
                  ? 'No catalog items match your search or filter criteria. Try resetting filters.'
                  : 'Get started by creating your first product item for this store catalog.'
              }
              action={{
                label:
                  searchQuery || selectedCategoryFilter !== 'all' || selectedStatusFilter !== 'all'
                    ? 'Clear Filters'
                    : 'Add Product',
                onClick:
                  searchQuery || selectedCategoryFilter !== 'all' || selectedStatusFilter !== 'all'
                    ? () => {
                        setSearchQuery('');
                        setSelectedCategoryFilter('all');
                        setSelectedStatusFilter('all');
                      }
                    : handleOpenCreate,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group">
              {/* Product Image Banner */}
              <div className="relative h-40 w-full overflow-hidden bg-muted/40 border-b">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-secondary/30 text-muted-foreground">
                    <Package className="h-10 w-10 opacity-30" />
                  </div>
                )}
                {product.category && (
                  <Badge variant="secondary" className="absolute top-2.5 left-2.5 backdrop-blur-md bg-background/85 text-[10px] shadow-xs">
                    {product.category.name}
                  </Badge>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {product.sku && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          SKU: {product.sku}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active Status Badge */}
                  <button
                    onClick={() => handleToggleActive(product)}
                    title={product.isActive ? 'Click to deactivate' : 'Click to activate'}
                    className="focus:outline-none"
                  >
                    {product.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 transition-colors">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </button>
                </div>

                {product.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="pt-0 pb-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Price</span>
                    <span className="font-bold text-sm text-foreground">
                      PKR {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {product.unit && (
                      <span className="text-[11px] text-muted-foreground ml-1">
                        / {product.unit}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-muted-foreground block text-[11px]">Availability</span>
                    {renderStockBadge(product.stockQuantity)}
                  </div>
                </div>

                {/* Store Name attribution if viewing multi-store list */}
                {!paramStoreId && product.store && (
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                    <Store className="h-3 w-3" />
                    <span>Store: {product.store.name}</span>
                  </div>
                )}
              </CardContent>

              {/* Action Buttons */}
              <div className="p-3 bg-muted/20 border-t flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenStock(product)}
                  className="h-8 text-xs flex-1 gap-1"
                >
                  <Boxes className="h-3.5 w-3.5" />
                  Stock
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(product)}
                  className="h-8 text-xs flex-1 gap-1"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProductToDelete(product)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Delete product"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <ProductFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        product={selectedProduct}
        storeId={currentStoreId}
        stores={stores}
        onSuccess={() => refetch()}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        open={stockModalOpen}
        onOpenChange={setStockModalOpen}
        product={selectedProduct}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg max-w-sm w-full p-5 shadow-xl border space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Delete Product?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Are you sure you want to delete &quot;{productToDelete.name}&quot;?
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground bg-muted p-2.5 rounded">
              This action will remove the product from your store catalog.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProductToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
