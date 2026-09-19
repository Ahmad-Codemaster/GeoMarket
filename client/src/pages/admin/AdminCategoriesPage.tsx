import React, { useState } from 'react';
import {
  Tags,
  Store,
  Package,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import type {
  StoreCategoryDto,
  ProductCategoryDto,
} from '@geomarket/shared';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import {
  useStoreCategories,
  useProductCategories,
  useAdminCreateStoreCategory,
  useAdminUpdateStoreCategory,
  useAdminDeleteStoreCategory,
  useAdminCreateProductCategory,
  useAdminUpdateProductCategory,
  useAdminDeleteProductCategory,
} from '../../hooks/useCategories';
import { toast } from '../../hooks/useToast';

export function AdminCategoriesPage() {
  const [activeTab, setActiveTab] = useState<'stores' | 'products'>('stores');

  // Queries
  const {
    data: storeCategories,
    isLoading: loadingStoreCats,
    error: errorStoreCats,
    refetch: refetchStoreCats,
  } = useStoreCategories();

  const {
    data: productCategories,
    isLoading: loadingProductCats,
    error: errorProductCats,
    refetch: refetchProductCats,
  } = useProductCategories();

  // Store Category Mutations
  const createStoreCatMutation = useAdminCreateStoreCategory();
  const updateStoreCatMutation = useAdminUpdateStoreCategory();
  const deleteStoreCatMutation = useAdminDeleteStoreCategory();

  // Product Category Mutations
  const createProductCatMutation = useAdminCreateProductCategory();
  const updateProductCatMutation = useAdminUpdateProductCategory();
  const deleteProductCatMutation = useAdminDeleteProductCategory();

  // Modal State for Store Category
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [editingStoreCat, setEditingStoreCat] = useState<StoreCategoryDto | null>(null);
  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [storeIconUrl, setStoreIconUrl] = useState('');
  const [storeIsActive, setStoreIsActive] = useState(true);
  const [storeFormError, setStoreFormError] = useState<string | null>(null);

  // Modal State for Product Category
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductCat, setEditingProductCat] = useState<ProductCategoryDto | null>(null);
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productFormError, setProductFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{
    type: 'store' | 'product';
    id: string;
    name: string;
  } | null>(null);

  // Handlers for Store Category
  const handleOpenCreateStoreCat = () => {
    setEditingStoreCat(null);
    setStoreName('');
    setStoreDesc('');
    setStoreIconUrl('');
    setStoreIsActive(true);
    setStoreFormError(null);
    setStoreModalOpen(true);
  };

  const handleOpenEditStoreCat = (cat: StoreCategoryDto) => {
    setEditingStoreCat(cat);
    setStoreName(cat.name);
    setStoreDesc(cat.description || '');
    setStoreIconUrl(cat.iconUrl || '');
    setStoreIsActive(cat.isActive);
    setStoreFormError(null);
    setStoreModalOpen(true);
  };

  const handleSaveStoreCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setStoreFormError('Category name is required.');
      return;
    }

    try {
      if (editingStoreCat) {
        await updateStoreCatMutation.mutateAsync({
          id: editingStoreCat.id,
          data: {
            name: storeName.trim(),
            description: storeDesc.trim() || undefined,
            iconUrl: storeIconUrl.trim() || undefined,
            isActive: storeIsActive,
          },
        });
        toast({
          variant: 'success',
          title: 'Store category updated',
          description: `Updated "${storeName.trim()}".`,
        });
      } else {
        await createStoreCatMutation.mutateAsync({
          name: storeName.trim(),
          description: storeDesc.trim() || undefined,
          iconUrl: storeIconUrl.trim() || undefined,
          isActive: storeIsActive,
        });
        toast({
          variant: 'success',
          title: 'Store category created',
          description: `Created "${storeName.trim()}".`,
        });
      }

      setStoreModalOpen(false);
    } catch (err: any) {
      setStoreFormError(err.message || 'Operation failed.');
    }
  };

  // Handlers for Product Category
  const handleOpenCreateProductCat = () => {
    setEditingProductCat(null);
    setProductName('');
    setProductDesc('');
    setProductFormError(null);
    setProductModalOpen(true);
  };

  const handleOpenEditProductCat = (cat: ProductCategoryDto) => {
    setEditingProductCat(cat);
    setProductName(cat.name);
    setProductDesc(cat.description || '');
    setProductFormError(null);
    setProductModalOpen(true);
  };

  const handleSaveProductCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setProductFormError('Category name is required.');
      return;
    }

    try {
      if (editingProductCat) {
        await updateProductCatMutation.mutateAsync({
          id: editingProductCat.id,
          data: {
            name: productName.trim(),
            description: productDesc.trim() || undefined,
          },
        });
        toast({
          variant: 'success',
          title: 'Product category updated',
          description: `Updated "${productName.trim()}".`,
        });
      } else {
        await createProductCatMutation.mutateAsync({
          name: productName.trim(),
          description: productDesc.trim() || undefined,
        });
        toast({
          variant: 'success',
          title: 'Product category created',
          description: `Created "${productName.trim()}".`,
        });
      }

      setProductModalOpen(false);
    } catch (err: any) {
      setProductFormError(err.message || 'Operation failed.');
    }
  };

  // Deletion
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      if (categoryToDelete.type === 'store') {
        await deleteStoreCatMutation.mutateAsync(categoryToDelete.id);
        toast({
          variant: 'success',
          title: 'Store category removed',
          description: `Deleted "${categoryToDelete.name}".`,
        });
      } else {
        await deleteProductCatMutation.mutateAsync(categoryToDelete.id);
        toast({
          variant: 'success',
          title: 'Product category removed',
          description: `Deleted "${categoryToDelete.name}".`,
        });
      }
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: err.message || 'Could not delete category.',
      });
    }
  };

  return (
    <PageContainer width="wide">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader
          title="Category Management"
          description="Curate store trade classifications and catalog taxonomies across GeoMarket"
          className="mb-0"
        />

        <Button
          onClick={activeTab === 'stores' ? handleOpenCreateStoreCat : handleOpenCreateProductCat}
          className="gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          {activeTab === 'stores' ? 'New Store Category' : 'New Product Category'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('stores')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'stores'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Store className="h-4 w-4" />
          Store Categories
          {storeCategories && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-primary-foreground/20">
              {storeCategories.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'products'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Package className="h-4 w-4" />
          Product Categories
          {productCategories && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-primary-foreground/20">
              {productCategories.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Store Categories Content */}
      {activeTab === 'stores' && (
        <>
          {loadingStoreCats ? (
            <LoadingState label="Loading store categories…" />
          ) : errorStoreCats ? (
            <ErrorState
              title="Failed to load store categories"
              message={(errorStoreCats as any)?.message || 'Could not fetch category list.'}
              onRetry={() => refetchStoreCats()}
            />
          ) : !storeCategories || storeCategories.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={Store}
                  title="No Store Categories"
                  description="Create store categories (e.g., Groceries, Bakery, Electronics, Pharmacy) so merchants can classify their physical storefronts."
                  action={{
                    label: 'Create First Store Category',
                    onClick: handleOpenCreateStoreCat,
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold">Store Categories</CardTitle>
                <CardDescription className="text-xs">
                  High-level merchant trade classifications used for customer storefront filtering
                </CardDescription>
              </CardHeader>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Category Name</TableHead>
                      <TableHead className="text-xs font-semibold">Slug</TableHead>
                      <TableHead className="text-xs font-semibold">Description</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storeCategories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-semibold text-xs">
                          {cat.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {cat.slug}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {cat.description || '—'}
                        </TableCell>
                        <TableCell>
                          {cat.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-200 text-zinc-700">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditStoreCat(cat)}
                              className="h-8 w-8 p-0"
                              title="Edit Category"
                            >
                              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCategoryToDelete({ type: 'store', id: cat.id, name: cat.name });
                                setDeleteConfirmOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete Category"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Tab 2: Product Categories Content */}
      {activeTab === 'products' && (
        <>
          {loadingProductCats ? (
            <LoadingState label="Loading product categories…" />
          ) : errorProductCats ? (
            <ErrorState
              title="Failed to load product categories"
              message={(errorProductCats as any)?.message || 'Could not fetch product category list.'}
              onRetry={() => refetchProductCats()}
            />
          ) : !productCategories || productCategories.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={Package}
                  title="No Product Categories"
                  description="Create product categories (e.g., Dairy, Snacks, Beverages, Fresh Produce) for item catalog classification in Phase 4."
                  action={{
                    label: 'Create First Product Category',
                    onClick: handleOpenCreateProductCat,
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold">Product Categories</CardTitle>
                <CardDescription className="text-xs">
                  Taxonomies for grouping and filtering product listings across store inventories
                </CardDescription>
              </CardHeader>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Category Name</TableHead>
                      <TableHead className="text-xs font-semibold">Slug</TableHead>
                      <TableHead className="text-xs font-semibold">Description</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productCategories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-semibold text-xs">
                          {cat.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {cat.slug}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {cat.description || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditProductCat(cat)}
                              className="h-8 w-8 p-0"
                              title="Edit Category"
                            >
                              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCategoryToDelete({ type: 'product', id: cat.id, name: cat.name });
                                setDeleteConfirmOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete Category"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Modal: Create/Edit Store Category */}
      <Dialog open={storeModalOpen} onOpenChange={setStoreModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              {editingStoreCat ? 'Edit Store Category' : 'Create Store Category'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Classifies storefront operations for location discovery and customer browsing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveStoreCategory} className="space-y-4 py-2">
            {storeFormError && (
              <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{storeFormError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="storeCatName" className="text-xs font-medium">
                Category Name *
              </Label>
              <Input
                id="storeCatName"
                placeholder="e.g. Grocery &amp; Supermarket"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="storeCatDesc" className="text-xs font-medium">
                Description
              </Label>
              <Input
                id="storeCatDesc"
                placeholder="Brief description of business trade"
                value={storeDesc}
                onChange={(e) => setStoreDesc(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="storeCatIcon" className="text-xs font-medium">
                Icon URL (Optional)
              </Label>
              <Input
                id="storeCatIcon"
                placeholder="https://..."
                value={storeIconUrl}
                onChange={(e) => setStoreIconUrl(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="storeCatActive"
                checked={storeIsActive}
                onChange={(e) => setStoreIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="storeCatActive" className="text-xs font-normal cursor-pointer">
                Active (merchants can assign this category to stores)
              </Label>
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStoreModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createStoreCatMutation.isPending || updateStoreCatMutation.isPending}
                className="gap-1.5"
              >
                {createStoreCatMutation.isPending || updateStoreCatMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Create/Edit Product Category */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {editingProductCat ? 'Edit Product Category' : 'Create Product Category'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Curate product catalog groups for inventory classification.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProductCategory} className="space-y-4 py-2">
            {productFormError && (
              <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{productFormError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="productCatName" className="text-xs font-medium">
                Category Name *
              </Label>
              <Input
                id="productCatName"
                placeholder="e.g. Dairy &amp; Eggs"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="productCatDesc" className="text-xs font-medium">
                Description
              </Label>
              <Input
                id="productCatDesc"
                placeholder="Brief description of product taxonomy"
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setProductModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createProductCatMutation.isPending || updateProductCatMutation.isPending}
                className="gap-1.5"
              >
                {createProductCatMutation.isPending || updateProductCatMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Category
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to permanently delete{' '}
              <strong className="text-foreground">{categoryToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleteStoreCatMutation.isPending || deleteProductCatMutation.isPending}
              className="gap-1.5"
            >
              {deleteStoreCatMutation.isPending || deleteProductCatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
