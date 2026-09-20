import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Store,
  Package,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { useCustomerOrders, useCancelCustomerOrder } from '../../hooks/useOrders';
import { useToast } from '../../hooks/useToast';
import { OrderStatus } from '@geomarket/shared';

export function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case OrderStatus.PLACED:
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Placed</Badge>;
    case OrderStatus.CONFIRMED:
      return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">Confirmed</Badge>;
    case OrderStatus.PREPARING:
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Preparing</Badge>;
    case OrderStatus.READY:
      return <Badge variant="secondary" className="bg-teal-100 text-teal-800 border-teal-200">Ready</Badge>;
    case OrderStatus.OUT_FOR_DELIVERY:
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">Out for Delivery</Badge>;
    case OrderStatus.DELIVERED:
      return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Delivered</Badge>;
    case OrderStatus.CANCELLED:
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function CustomerOrdersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading, isError } = useCustomerOrders();
  const cancelMutation = useCancelCustomerOrder();

  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;
    try {
      await cancelMutation.mutateAsync(cancelOrderId);
      toast({
        title: 'Order Cancelled',
        description: 'Your order has been cancelled and items returned to stock.',
      });
      setCancelOrderId(null);
    } catch (err: any) {
      toast({
        title: 'Cancellation Failed',
        description: err.message || 'Unable to cancel order.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <PageContainer width="wide">
        <PageHeader title="My Orders" description="Track deliveries and view order history" />
        <div className="space-y-4 mt-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !data || data.orders.length === 0) {
    return (
      <PageContainer width="wide">
        <PageHeader title="My Orders" description="Track deliveries and view order history" />
        <Card className="mt-6">
          <CardContent className="pt-6">
            <EmptyState
              icon={Package}
              title="No Orders Yet"
              description="You haven't placed any orders yet. Explore nearby stores to get started!"
              action={{
                label: 'Find Stores Nearby',
                onClick: () => navigate('/stores'),
              }}
            />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="wide">
      <PageHeader
        title="My Orders"
        description="Track active deliveries and view your order history"
      />

      <div className="space-y-4 mt-6">
        {data.orders.map((order) => {
          const isCancellable =
            order.status === OrderStatus.PLACED || order.status === OrderStatus.CONFIRMED;

          return (
            <Card key={order.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-foreground">
                        Order #{order.id.slice(0, 8)}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Store className="h-3.5 w-3.5 text-primary" />
                        {order.store?.name || 'Local Store'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="font-semibold text-foreground">
                        Rs. {order.totalAmount.toFixed(2)} (COD)
                      </span>
                    </div>

                    {order.addressSnapshot && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        Delivering to: {order.addressSnapshot.address}, {order.addressSnapshot.city}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isCancellable && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setCancelOrderId(order.id)}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      View Details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cancel Order Confirmation Dialog */}
      <Dialog open={!!cancelOrderId} onOpenChange={(open) => !open && setCancelOrderId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order?</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to cancel this order? The ordered inventory will be immediately restored to the store stock.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setCancelOrderId(null)}>
              Keep Order
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelOrder}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling…' : 'Yes, Cancel Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

export default CustomerOrdersPage;
