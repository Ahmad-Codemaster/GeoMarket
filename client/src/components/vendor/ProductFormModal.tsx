import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  X,
  Sparkles,
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
import { uploadApi } from '../../lib/api';
import type { ProductDto, StoreDto } from '@geomarket/shared';

const PRESET_PRODUCT_IMAGES = [
  { label: 'Smartphone', url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80' },
  { label: 'Laptop', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80' },
  { label: 'Headphones', url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80' },
  { label: 'Smart TV', url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80' },
  { label: 'Luxury Suit', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Men Kurta', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Shoes', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80' },
  { label: 'Perfume', url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Chocolates', url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80' },
  { label: 'Basmati Rice', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cooking Oil', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80' },
  { label: 'Fresh Butchery', url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80' },
  { label: 'Artisan Cake', url: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Croissant', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80' },
  { label: 'Sports Gear', url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=600&q=80' },
];

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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Product image size cannot exceed 5MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadApi.uploadImage(file);
      setImageUrl(res.url);
      toast({
        title: 'Image Uploaded',
        description: 'Product image uploaded successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err.message || 'Could not upload image.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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

          {/* Product Image Management (Upload, Presets, or Direct URL) */}
          <div className="space-y-3 p-3.5 rounded-xl border bg-muted/20">
            <div className="flex items-center justify-between">
              <Label htmlFor="imageUrl" className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-primary" />
                Product Visual &amp; Photography
              </Label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-[11px] text-destructive hover:underline flex items-center gap-1 font-medium"
                >
                  <X className="h-3 w-3" /> Remove Image
                </button>
              )}
            </div>

            {/* Live Image Preview */}
            {imageUrl ? (
              <div className="relative h-44 w-full rounded-lg border overflow-hidden bg-background shadow-xs group">
                <img
                  src={imageUrl}
                  alt="Product preview"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium backdrop-blur-xs flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-400" /> Active Preview
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-32 w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer bg-background/50 hover:bg-background"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Loader2 className="h-5 w-5 animate-spin" /> Uploading image…
                  </div>
                ) : (
                  <>
                    <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-foreground">Click to upload product photo</p>
                      <p className="text-[10px] text-muted-foreground">PNG, JPG, or WEBP up to 5MB</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
            />

            {/* Upload Action Button & Direct URL Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="shrink-0 text-xs font-medium"
              >
                {isUploading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="mr-1.5 h-3.5 w-3.5 text-primary" />
                )}
                Browse File…
              </Button>

              <div className="flex-1">
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste external image URL (https://...)"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Quick-Pick Image Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-accent" />
                Or pick from instant department presets:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {PRESET_PRODUCT_IMAGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-colors ${
                      imageUrl === preset.url
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background hover:bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
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
