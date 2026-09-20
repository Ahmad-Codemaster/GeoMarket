import { useState } from 'react';
import {
  Package,
  Store,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  Filter,
  Eye,
  Loader2,
  User,
  Phone,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { useVendorOrders, useUpdateVendorOrderStatus } from '../../hooks/useOrders';
import { useVendorStores } from '../../hooks/useStores';
import { useToast } from '../../hooks/useToast';
import { OrderDto, OrderStatus, PaymentStatus } from '@geomarket/shared';
import { getStatusBadge } from '../customer/CustomerOrdersPage';

export function VendorOrdersPage() {
  const { toast } = useToast();
  const { data: storesData } = useVendorStores();

  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [transitioningOrderId, setTransitioningOrderId] = useState<string | null>(null);

  const queryParams = {
    ...(selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {}),
    ...(selectedStatus !== 'all' ? { status: selectedStatus as OrderStatus } : {}),
  };

  const { data, isLoading, isError, refetch } = useVendorOrders(queryParams);
  const updateStatusMutation = useUpdateVendorOrderStatus();

  const handleTransition = async (orderId: string, targetStatus: OrderStatus) => {
    try {
      setTransitioningOrderId(orderId);
      const res = await updateStatusMutation.mutateAsync({ orderId, status: targetStatus });
      toast({
        title: 'Status Updated',
        description: `Order #${orderId.slice(0, 8)} moved to ${targetStatus}.`,
      });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(res.order);
      }
    } catch (err: any) {
      toast({
        title: 'Transition Failed',
        description: err.message || 'Could not update order status.',
        variant: 'destructive',
      });
    } finally {
      setTransitioningOrderId(null);
    }
  };

  const renderTransitionActions = (order: OrderDto) => {
    const isUpdating = transitioningOrderId === order.id;

    switch (order.status) {
      case OrderStatus.PLACED:
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isUpdating}
              onClick={() => handleTransition(order.id, OrderStatus.CONFIRMED)}
            >
              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm Order'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-destructive hover:bg-destructive/10"
              disabled={isUpdating}
              onClick={() => handleTransition(order.id, OrderStatus.CANCELLED)}
            >
              Reject
            </Button>
          </div>
        );
      case OrderStatus.CONFIRMED:
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
              disabled={isUpdating}
              onClick={() => handleTransition(order.id, OrderStatus.PREPARING)}
            >
              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Start Preparing'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-destructive hover:bg-destructive/10"
              disabled={isUpdating}
              onClick={() => handleTransition(order.id, OrderStatus.CANCELLED)}
            >
              Cancel
            </Button>
          </div>
        );
      case OrderStatus.PREPARING:
        return (
          <Button
            size="sm"
            className="text-xs bg-teal-600 hover:bg-teal-700 text-white"
            disabled={isUpdating}
            onClick={() => handleTransition(order.id, OrderStatus.READY)}
          >
            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Mark as Ready'}
          </Button>
        );
      case OrderStatus.READY:
        return (
          <Button
            size="sm"
            className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isUpdating}
            onClick={() => handleTransition(order.id, OrderStatus.OUT_FOR_DELIVERY)}
          >
            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Dispatch Order'}
          </Button>
        );
      case OrderStatus.OUT_FOR_DELIVERY:
        return (
          <Button
            size="sm"
            className="text-xs bg-green-600 hover:bg-green-700 text-white"
            disabled={isUpdating}
            onClick={() => handleTransition(order.id, OrderStatus.DELIVERED)}
          >
            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Mark as Delivered (Collect COD)'}
          </Button>
        );
      case OrderStatus.DELIVERED:
      case OrderStatus.CANCELLED:
      default:
        return null;
    }
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Incoming Orders & Fulfillment"
        description="Manage live customer orders, update delivery progress, and collect Cash on Delivery"
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 my-6">
        <div className="w-56">
          <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
            <SelectTrigger className="text-xs h-9">
              <SelectValue placeholder="All Stores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owned Stores</SelectItem>
              {storesData?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="text-xs h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={OrderStatus.PLACED}>Placed</SelectItem>
              <SelectItem value={OrderStatus.CONFIRMED}>Confirmed</SelectItem>
              <SelectItem value={OrderStatus.PREPARING}>Preparing</SelectItem>
              <SelectItem value={OrderStatus.READY}>Ready</SelectItem>
              <SelectItem value={OrderStatus.OUT_FOR_DELIVERY}>Out for Delivery</SelectItem>
              <SelectItem value={OrderStatus.DELIVERED}>Delivered</SelectItem>
              <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : isError || !data || data.orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Package}
              title="No Orders Found"
              description="No incoming orders match your current filter criteria."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.orders.map((order) => (
            <Card key={order.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-foreground">
                        Order #{order.id.slice(0, 8)}
                      </span>
                      {getStatusBadge(order.status)}
                      <Badge variant="outline" className="text-[10px]">
                        {order.store?.name || 'Store'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="font-semibold text-foreground">
                        Total: Rs. {order.totalAmount.toFixed(2)}
                      </span>
                      <span className="text-xs">
                        COD Status:{' '}
                        <strong className={order.paymentStatus === PaymentStatus.PAID ? 'text-green-600' : 'text-amber-600'}>
                          {order.paymentStatus}
                        </strong>
                      </span>
                    </div>

                    {order.addressSnapshot && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>
                          {order.addressSnapshot.recipientName} ({order.addressSnapshot.recipientPhone}): {order.addressSnapshot.address}, {order.addressSnapshot.city}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                    {renderTransitionActions(order)}

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle>Order #{selectedOrder.id.slice(0, 8)}</DialogTitle>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <DialogDescription className="text-xs">
                Placed on {new Date(selectedOrder.createdAt).toLocaleString()} for {selectedOrder.store?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2 text-xs">
              {/* Customer & Address Snapshot */}
              <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  Delivery Recipient: {selectedOrder.addressSnapshot?.recipientName || 'Customer'}
                </p>
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Phone: {selectedOrder.addressSnapshot?.recipientPhone}
                </p>
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Address: {selectedOrder.addressSnapshot?.address}, {selectedOrder.addressSnapshot?.city}
                </p>
                {selectedOrder.addressSnapshot && (
                  <p className="text-[10px] text-muted-foreground pt-1">
                    GPS: ({Number(selectedOrder.addressSnapshot.latitude).toFixed(6)},{' '}
                    {Number(selectedOrder.addressSnapshot.longitude).toFixed(6)})
                  </p>
                )}
              </div>

              {/* Items List */}
              <div className="border rounded-lg divide-y">
                <div className="p-2 bg-muted/20 font-semibold text-[11px] flex justify-between">
                  <span>Product</span>
                  <span>Total</span>
                </div>
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.productNameSnapshot}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Rs. {item.unitPriceSnapshot.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold">Rs. {item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1.5 p-3 border rounded-lg bg-muted/10">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>Rs. {selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>Rs. {selectedOrder.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground text-sm pt-1 border-t">
                  <span>Grand Total</span>
                  <span>Rs. {selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-muted-foreground">Payment (COD):</span>
                  <Badge variant="outline">{selectedOrder.paymentStatus}</Badge>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {renderTransitionActions(selectedOrder)}
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </PageContainer>
  );
}

export default VendorOrdersPage;
