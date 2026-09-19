import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  Equal,
  ArrowRight,
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
import { Badge } from '../ui/badge';
import { useUpdateProductStock } from '../../hooks/useProducts';
import { toast } from '../../hooks/useToast';
import type { ProductDto } from '@geomarket/shared';

interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductDto | null;
  onSuccess?: () => void;
}

type OperationType = 'SET' | 'INCREMENT' | 'DECREMENT';

export function StockAdjustmentModal({
  open,
  onOpenChange,
  product,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [operation, setOperation] = useState<OperationType>('INCREMENT');
  const [quantity, setQuantity] = useState('10');
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const stockMutation = useUpdateProductStock();

  useEffect(() => {
    if (open) {
      setOperation('INCREMENT');
      setQuantity('10');
      setError(null);
      setApiError(null);
    }
  }, [open, product]);

  if (!product) return null;

  const currentStock = product.stockQuantity;
  const parsedQty = parseInt(quantity, 10);
  const validQty = !isNaN(parsedQty);

  let previewStock = currentStock;
  let isNegative = false;

  if (validQty) {
    if (operation === 'SET') {
      previewStock = parsedQty;
      if (parsedQty < 0) isNegative = true;
    } else if (operation === 'INCREMENT') {
      previewStock = currentStock + parsedQty;
    } else if (operation === 'DECREMENT') {
      previewStock = currentStock - parsedQty;
      if (previewStock < 0) isNegative = true;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setError(null);

    if (!validQty) {
      setError('Please enter a valid integer quantity');
      return;
    }

    if (operation === 'SET' && parsedQty < 0) {
      setError('Stock cannot be set to a negative value');
      return;
    }

    if ((operation === 'INCREMENT' || operation === 'DECREMENT') && parsedQty <= 0) {
      setError('Adjustment amount must be a positive integer greater than 0');
      return;
    }

    if (isNegative) {
      setError('Resulting stock level cannot be negative');
      return;
    }

    try {
      await stockMutation.mutateAsync({
        productId: product.id,
        data: {
          operation,
          quantity: parsedQty,
        },
      });

      toast({
        variant: 'success',
        title: 'Inventory updated',
        description: `${product.name} stock adjusted from ${currentStock} to ${previewStock}.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setApiError(err.message || 'Failed to update stock quantity');
    }
  };

  const isSaving = stockMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Adjust Inventory</DialogTitle>
              <DialogDescription>
                Update available stock for this catalog item
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Product summary card */}
        <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground truncate">{product.name}</h4>
            <Badge variant="outline" className="text-xs">
              {product.unit || 'units'}
            </Badge>
          </div>
          {product.sku && (
            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
          )}
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-muted-foreground">Current Stock:</span>
            <span className="font-bold text-foreground">{currentStock}</span>
          </div>
        </div>

        {apiError && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Operation selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Operation
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOperation('INCREMENT')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  operation === 'INCREMENT'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-input hover:bg-muted text-muted-foreground'
                }`}
              >
                <Plus className="h-4 w-4 mb-1" />
                Increase (+)
              </button>

              <button
                type="button"
                onClick={() => setOperation('DECREMENT')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  operation === 'DECREMENT'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-input hover:bg-muted text-muted-foreground'
                }`}
              >
                <Minus className="h-4 w-4 mb-1" />
                Decrease (-)
              </button>

              <button
                type="button"
                onClick={() => setOperation('SET')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  operation === 'SET'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-input hover:bg-muted text-muted-foreground'
                }`}
              >
                <Equal className="h-4 w-4 mb-1" />
                Set Exact
              </button>
            </div>
          </div>

          {/* Quantity input */}
          <div className="space-y-1.5">
            <Label htmlFor="stockQty" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {operation === 'SET' ? 'New Target Stock' : 'Units to Adjust'}
            </Label>
            <Input
              id="stockQty"
              type="number"
              min={operation === 'SET' ? 0 : 1}
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={error ? 'border-destructive' : ''}
              placeholder="e.g. 10"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* Preview Box */}
          <div className={`p-3 rounded-lg border text-xs transition-colors ${
            isNegative
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-border bg-muted/20 text-foreground'
          }`}>
            <div className="flex items-center justify-between font-medium">
              <span>Resulting Stock:</span>
              <div className="flex items-center gap-2 font-bold">
                <span className="text-muted-foreground">{currentStock}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className={isNegative ? 'text-destructive' : 'text-primary font-bold'}>
                  {validQty ? previewStock : '—'}
                </span>
              </div>
            </div>
            {isNegative && (
              <p className="text-[11px] text-destructive mt-1 font-normal">
                Negative stock is not permitted. Please adjust the decrement amount.
              </p>
            )}
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
            <Button
              type="submit"
              disabled={isSaving || isNegative || !validQty}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Stock...
                </>
              ) : (
                'Confirm Adjustment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
