import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Store,
  CreditCard,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  AlertCircle,
  ShieldCheck,
  Star,
  Edit3,
  Trash2,
  Send,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { useCustomerOrder, useCancelCustomerOrder } from '../../hooks/useOrders';
import { useOrderReview, useCreateReview, useUpdateReview, useDeleteReview } from '../../hooks/useReviews';
import { useToast } from '../../hooks/useToast';
import { OrderStatus, PaymentStatus } from '@geomarket/shared';
import { getStatusBadge } from './CustomerOrdersPage';

const FSM_STEPS: OrderStatus[] = [
  OrderStatus.PLACED,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

const STEP_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PLACED]: 'Order Placed',
  [OrderStatus.CONFIRMED]: 'Confirmed',
  [OrderStatus.PREPARING]: 'Preparing',
  [OrderStatus.READY]: 'Ready for Pickup',
  [OrderStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.CANCELLED]: 'Cancelled',
};

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: order, isLoading, isError } = useCustomerOrder(orderId || '');
  const cancelMutation = useCancelCustomerOrder();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <PageContainer width="wide">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !order) {
    return (
      <PageContainer width="narrow">
        <Alert variant="destructive" className="mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Order Not Found</AlertTitle>
          <AlertDescription className="text-xs">
            The requested order could not be found or you do not have permission to view it.
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate('/orders')}>
          Back to My Orders
        </Button>
      </PageContainer>
    );
  }

  const isCancelled = order.status === OrderStatus.CANCELLED;
  const currentStepIndex = FSM_STEPS.indexOf(order.status);
  const isCancellable =
    order.status === OrderStatus.PLACED || order.status === OrderStatus.CONFIRMED;

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(order.id);
      setCancelDialogOpen(false);
      toast({
        title: 'Order Cancelled',
        description: 'Your order has been cancelled and stock has been restored.',
      });
    } catch (err: any) {
      toast({
        title: 'Cancellation Failed',
        description: err.message || 'Could not cancel order.',
        variant: 'destructive',
      });
    }
  };

  // Review hooks & state (Delivered orders only)
  const isDelivered = order.status === OrderStatus.DELIVERED;
  const { data: review, isLoading: reviewLoading } = useOrderReview(order.id, isDelivered);
  const createReviewMutation = useCreateReview();
  const updateReviewMutation = useUpdateReview();
  const deleteReviewMutation = useDeleteReview();

  // Create review form state
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Edit review state
  const [isEditingReview, setIsEditingReview] = useState<boolean>(false);
  const [editRating, setEditRating] = useState<number>(5);
  const [editHoverRating, setEditHoverRating] = useState<number>(0);
  const [editComment, setEditComment] = useState<string>('');
  const [deleteReviewDialogOpen, setDeleteReviewDialogOpen] = useState<boolean>(false);

  const handleSubmitReview = async () => {
    if (rating < 1 || rating > 5) {
      setReviewError('Please select a rating between 1 and 5 stars.');
      return;
    }
    setReviewError(null);
    try {
      await createReviewMutation.mutateAsync({
        orderId: order.id,
        rating,
        comment: comment.trim() || undefined,
      });
      setRating(0);
      setComment('');
      toast({
        title: 'Review Submitted',
        description: 'Thank you for reviewing your order!',
      });
    } catch (err: any) {
      toast({
        title: 'Submission Failed',
        description: err.message || 'Could not submit review.',
        variant: 'destructive',
      });
    }
  };

  const handleStartEdit = () => {
    if (!review) return;
    setEditRating(review.rating);
    setEditComment(review.comment || '');
    setIsEditingReview(true);
  };

  const handleSaveEdit = async () => {
    if (!review) return;
    if (editRating < 1 || editRating > 5) return;
    try {
      await updateReviewMutation.mutateAsync({
        reviewId: review.id,
        data: {
          rating: editRating,
          comment: editComment.trim() || undefined,
        },
      });
      setIsEditingReview(false);
      toast({
        title: 'Review Updated',
        description: 'Your review has been updated successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not update review.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReview = async () => {
    if (!review) return;
    try {
      await deleteReviewMutation.mutateAsync(review.id);
      setDeleteReviewDialogOpen(false);
      setRating(0);
      setComment('');
      toast({
        title: 'Review Deleted',
        description: 'Your review has been removed.',
      });
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err.message || 'Could not delete review.',
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
          onClick={() => navigate('/orders')}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">
              Order #{order.id.slice(0, 8)}
            </h1>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {isCancellable && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive self-start sm:self-auto"
            onClick={() => setCancelDialogOpen(true)}
          >
            Cancel Order
          </Button>
        )}
      </div>

      {/* Stepped FSM Progress Tracker */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Order Fulfillment Lifecycle</CardTitle>
        </CardHeader>
        <CardContent>
          {isCancelled ? (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">Order Cancelled</p>
                <p className="text-xs text-muted-foreground">
                  This order was cancelled. Reserved quantities have been returned to the store stock.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {FSM_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div
                    key={step}
                    className={`flex flex-col items-center text-center p-2.5 rounded-lg border transition-all ${
                      isCurrent
                        ? 'border-primary bg-primary/10 shadow-sm font-semibold'
                        : isCompleted
                        ? 'border-border bg-muted/40 text-foreground'
                        : 'border-dashed border-border/50 text-muted-foreground/60'
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs mb-1.5 ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-[11px] leading-tight">{STEP_LABELS[step]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Left Column: Delivery Snapshot & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ordered Items Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Ordered Items Snapshot ({order.items?.length || 0})
              </CardTitle>
              <CardDescription className="text-xs">
                Historical item prices and names preserved at time of checkout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-foreground">{item.productNameSnapshot}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Rs. {item.unitPriceSnapshot.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-right">
                      Rs. {item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Immutable Delivery Address Snapshot */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Delivery Address Snapshot
              </CardTitle>
              <CardDescription className="text-xs">
                Authoritative delivery location recorded at checkout
              </CardDescription>
            </CardHeader>
            <CardContent>
              {order.addressSnapshot ? (
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">
                    {order.addressSnapshot.recipientName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Phone: {order.addressSnapshot.recipientPhone}
                  </p>
                  <p className="text-xs text-foreground mt-1">
                    {order.addressSnapshot.address}, {order.addressSnapshot.city}
                  </p>
                  <p className="text-[10px] text-muted-foreground pt-1">
                    GPS: ({Number(order.addressSnapshot.latitude).toFixed(6)},{' '}
                    {Number(order.addressSnapshot.longitude).toFixed(6)})
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No address snapshot available.</p>
              )}
            </CardContent>
          </Card>

          {/* Customer Review Section (Delivered Orders Only) */}
          {isDelivered && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    {review ? 'Your Store Review' : 'Rate & Review Your Order'}
                  </CardTitle>
                  {review && !isEditingReview && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        onClick={handleStartEdit}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs gap-1 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteReviewDialogOpen(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {review
                    ? `Submitted on ${new Date(review.createdAt).toLocaleDateString()}`
                    : `Help others by sharing your feedback for ${order.store?.name || 'this store'}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviewLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : review && !isEditingReview ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= review.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-muted stroke-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold">{review.rating} out of 5</span>
                    </div>
                    {review.comment ? (
                      <p className="text-sm text-foreground/90 bg-muted/40 p-3 rounded-md border border-border/50 whitespace-pre-wrap">
                        {review.comment}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No written comment provided.</p>
                    )}
                  </div>
                ) : isEditingReview ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold block mb-1.5">Rating (1 to 5 Stars)</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            className="p-1 focus:outline-none transition-transform hover:scale-110"
                            onMouseEnter={() => setEditHoverRating(star)}
                            onMouseLeave={() => setEditHoverRating(0)}
                            onClick={() => setEditRating(star)}
                          >
                            <Star
                              className={`h-6 w-6 ${
                                star <= (editHoverRating || editRating)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs text-muted-foreground ml-2 font-medium">
                          {editHoverRating || editRating} of 5 stars
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1">Comment (Optional)</label>
                      <Textarea
                        rows={3}
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value.slice(0, 1000))}
                        placeholder="Update your feedback..."
                        className="resize-none text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingReview(false)}
                        disabled={updateReviewMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={updateReviewMutation.isPending}
                      >
                        {updateReviewMutation.isPending ? 'Saving…' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold block mb-1.5">Rating (Required)</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            className="p-1 focus:outline-none transition-transform hover:scale-110"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => {
                              setRating(star);
                              setReviewError(null);
                            }}
                          >
                            <Star
                              className={`h-6 w-6 ${
                                star <= (hoverRating || rating)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs text-muted-foreground ml-2 font-medium">
                          {rating > 0 ? `${rating} of 5 stars` : 'Select star rating'}
                        </span>
                      </div>
                      {reviewError && (
                        <p className="text-xs text-destructive mt-1 font-medium">{reviewError}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold">Your Review (Optional)</label>
                        <span className="text-[10px] text-muted-foreground">
                          {comment.length} / 1000
                        </span>
                      </div>
                      <Textarea
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                        placeholder="How was the food, freshness, delivery time, and overall service?"
                        className="resize-none text-xs"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleSubmitReview}
                        disabled={createReviewMutation.isPending}
                        className="gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {createReviewMutation.isPending ? 'Submitting…' : 'Leave Review'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Financial Breakdown & Store Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Payment & Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">
                    Rs. {order.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-foreground">
                    Rs. {order.deliveryFee.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="border-t pt-2.5 flex justify-between items-baseline">
                <span className="font-bold text-sm">Total Amount</span>
                <span className="text-xl font-black text-foreground">
                  Rs. {order.totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-semibold">Cash on Delivery (COD)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <Badge
                    variant="outline"
                    className={
                      order.paymentStatus === PaymentStatus.PAID
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : order.paymentStatus === PaymentStatus.CANCELLED
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Info */}
          {order.store && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Store Details
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <p className="font-bold text-foreground">{order.store.name}</p>
                <p className="text-muted-foreground">
                  {order.store.addressLine}, {order.store.city}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order #{order.id.slice(0, 8)}?</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to cancel this order? This action cannot be undone. Ordered items will be returned to store stock.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setCancelDialogOpen(false)}>
              Keep Order
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling…' : 'Yes, Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Review Confirmation Dialog */}
      <Dialog open={deleteReviewDialogOpen} onOpenChange={setDeleteReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Review?</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete your review for this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDeleteReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteReview}
              disabled={deleteReviewMutation.isPending}
            >
              {deleteReviewMutation.isPending ? 'Deleting…' : 'Delete Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

export default OrderDetailPage;
