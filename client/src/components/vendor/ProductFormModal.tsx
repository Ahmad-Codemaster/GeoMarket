import React, { useState, useEffect } from 'react';
import {
  Package,
  Loader2,
  AlertCircle,
  Tag,
  DollarSign,
  Layers,
  FileText,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useProductCategories } from '../../hooks/useCategories';
import { useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { toast } from '../../hooks/useToast';
import type { ProductDto, StoreDto } from '@geomarket/shared';

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductDto | null;
  storeId?: string;
  stores?: StoreDto[];
  onSuccess?: () => void;
}

export function ProductFormModal({
  open,
  onOpenChange,
  product,
  storeId,
  stores,
  onSuccess,
}: ProductFormModalProps) {
  const isEditing = !!product;

  const { data: categories = [], isLoading: isLoadingCategories } = useProductCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [selectedStoreId, setSelectedStoreId] = useState<string>(storeId || '');
  const [name, setName] = useState('');
  const [productCategoryId, setProductCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setSelectedStoreId(product.storeId);
      setName(product.name);
      setProductCategoryId(product.productCategoryId);
      setPrice(String(product.price));
      setStockQuantity(String(product.stockQuantity));
      setSku(product.sku || '');
      setUnit(product.unit || '');
      setImageUrl(product.imageUrl || '');
      setDescription(product.description || '');
      setIsActive(product.isActive);
    } else {
      setSelectedStoreId(storeId || (stores && stores.length > 0 ? stores[0].id : ''));
      setName('');
      setProductCategoryId('');
      setPrice('');
      setStockQuantity('0');
      setSku('');
      setUnit('');
      setImageUrl('');
      setDescription('');
      setIsActive(true);
    }
    setErrors({});
    setApiError(null);
  }, [product, storeId, stores, open]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!isEditing && !selectedStoreId) {
      nextErrors.storeId = 'Please select a store for this product';
    }

    if (!name.trim()) {
      nextErrors.name = 'Product name is required';
    } else if (name.trim().length > 255) {
      nextErrors.name = 'Product name cannot exceed 255 characters';
    }

    if (!productCategoryId) {
      nextErrors.productCategoryId = 'Please select a product category';
    }

    const numericPrice = parseFloat(price);
    if (price === '' || isNaN(numericPrice) || numericPrice < 0) {
      nextErrors.price = 'Price must be a valid number greater than or equal to 0';
    }

    const numericStock = parseInt(stockQuantity, 10);
    if (stockQuantity === '' || isNaN(numericStock) || numericStock < 0) {
      nextErrors.stockQuantity = 'Stock must be an integer greater than or equal to 0';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    try {
      if (isEditing && product) {
        await updateMutation.mutateAsync({
          productId: product.id,
          data: {
            name: name.trim(),
            productCategoryId,
            price: parseFloat(price),
            stockQuantity: parseInt(stockQuantity, 10),
            sku: sku.trim() || null,
            unit: unit.trim() || null,
            imageUrl: imageUrl.trim() || null,
            description: description.trim() || null,
            isActive,
          },
        });

        toast({
          variant: 'success',
          title: 'Product updated',
          description: `"${name.trim()}" has been updated successfully.`,
        });
      } else {
        await createMutation.mutateAsync({
          storeId: selectedStoreId,
          data: {
            name: name.trim(),
            productCategoryId,
            price: parseFloat(price),
            stockQuantity: parseInt(stockQuantity, 10),
            sku: sku.trim() || null,
            unit: unit.trim() || null,
            imageUrl: imageUrl.trim() || null,
            description: description.trim() || null,
            isActive,
          },
        });

        toast({
          variant: 'success',
          title: 'Product created',
          description: `"${name.trim()}" has been added to your store catalog.`,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setApiError(err.message || 'An error occurred while saving the product');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {isEditing ? 'Edit Catalog Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Update price, attributes, details, and inventory for this item.'
                  : 'Add a new product to your physical store catalog.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {apiError && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Store Selection (if not fixed and multiple stores exist) */}
          {!isEditing && (!storeId || stores) && (
            <div className="space-y-1.5">
              <Label htmlFor="storeId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Store <span className="text-destructive">*</span>
              </Label>
              {stores && stores.length > 0 ? (
                <select
                  id="storeId"
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled>Select physical store</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="storeId"
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  placeholder="Store UUID"
                />
              )}
              {errors.storeId && (
                <p className="text-xs text-destructive">{errors.storeId}</p>
              )}
            </div>
          )}

          {/* Product Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Product Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Organic Whole Wheat Sourdough"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Category & SKU row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="productCategory" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Product Category <span className="text-destructive">*</span>
              </Label>
              <select
                id="productCategory"
                value={productCategoryId}
                onChange={(e) => setProductCategoryId(e.target.value)}
                disabled={isLoadingCategories}
                className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">
                  {isLoadingCategories ? 'Loading categories...' : 'Select catalog category'}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.productCategoryId && (
                <p className="text-xs text-destructive">{errors.productCategoryId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sku" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                SKU / Barcode <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g., BRD-SVR-001"
              />
            </div>
          </div>

          {/* Price & Stock & Unit row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Price (PKR) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className={errors.price ? 'border-destructive' : ''}
                />
              </div>
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stockQuantity" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Initial Stock <span className="text-destructive">*</span>
              </Label>
              <Input
                id="stockQuantity"
                type="number"
                step="1"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="0"
                className={errors.stockQuantity ? 'border-destructive' : ''}
              />
              {errors.stockQuantity && (
                <p className="text-xs text-destructive">{errors.stockQuantity}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unit" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Unit / Measure <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., loaf, kg, pack"
              />
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <Label htmlFor="imageUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Product Image URL <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.example.com/item.jpg"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Describe ingredients, shelf life, allergens, or preparation instructions..."
              className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Active Lifecycle Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div className="text-xs">
              <label htmlFor="isActive" className="font-semibold text-foreground cursor-pointer">
                Active in Store Catalog
              </label>
              <p className="text-muted-foreground">
                When checked, this product is marked active and will be available for customers once the store is live.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Product...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
