import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Receipt,
  Package,
  Clock,
  Printer,
  ShoppingBag,
  Store,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { orderApi } from '../../lib/api';
import { OrderDto, OrderStatus } from '@geomarket/shared';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/useToast';

export function GuestOrderLookupPage() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const { toast } = useToast();

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !phone.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter both your Order ID and the phone number used at checkout.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await orderApi.lookupOrder(orderId.trim(), phone.trim());
      setOrder(res.order);
      toast({
        title: 'Order found',
        description: `Loaded status for Order #${res.order.id.slice(0, 8).toUpperCase()}`,
      });
    } catch (err: any) {
      setOrder(null);
      toast({
        title: 'Order not found',
        description: err.message || 'We could not find an order matching that ID and phone number.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DELIVERED:
        return <Badge className="bg-emerald-600 text-white">Delivered</Badge>;
      case OrderStatus.OUT_FOR_DELIVERY:
        return <Badge className="bg-blue-600 text-white">Out for Delivery</Badge>;
      case OrderStatus.PREPARING:
      case OrderStatus.READY:
        return <Badge className="bg-amber-500 text-white">In Progress</Badge>;
      case OrderStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge className="bg-slate-700 text-white">Order Placed</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 no-print">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mb-4 shadow-sm">
            <Search className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Track Your Order
          </h1>
          <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto">
            Placed an order as a guest? Enter your Order ID and delivery phone number below to check your live order progress.
          </p>
        </div>

        {/* Lookup Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md mb-8 no-print">
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Order ID (UUID)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 123e4567-e89b-12d3-a456..."
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="rounded-xl border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <Input
                  type="text"
                  placeholder="e.g. +923001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border-slate-200"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 font-bold shadow-sm transition-all"
            >
              {isLoading ? 'Searching...' : 'Look Up Order Status'}
            </Button>
          </form>
        </div>

        {/* Order Details Result */}
        {order && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden print-container animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
                  <Receipt className="w-4 h-4" />
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </div>
                <h2 className="text-xl sm:text-2xl font-black">
                  Order Status: {order.status}
                </h2>
                <div className="text-emerald-100 text-xs mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div>{getStatusBadge(order.status)}</div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    Fulfilled By
                  </div>
                  <div className="font-bold text-slate-900 text-base">{order.store?.name}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {order.store?.addressLine}, {order.store?.city}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Delivery Destination
                  </div>
                  <div className="font-bold text-slate-900 text-base">
                    {order.addressSnapshot?.recipientName || 'Guest Recipient'}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {order.addressSnapshot?.recipientPhone}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {order.addressSnapshot?.address}, {order.addressSnapshot?.city}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Ordered Items
                </h3>

                <div className="divide-y divide-slate-100">
                  {order.items?.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                      <div className="flex-1 pr-4">
                        <div className="font-semibold text-slate-900">{item.productNameSnapshot}</div>
                        <div className="text-xs text-slate-500">
                          Qty: {item.quantity} × Rs. {item.unitPriceSnapshot.toLocaleString()}
                        </div>
                      </div>
                      <div className="font-bold text-slate-900 whitespace-nowrap">
                        Rs. {item.lineTotal.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Items Subtotal</span>
                  <span className="font-medium text-slate-900">Rs. {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-slate-900">Rs. {order.deliveryFee.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-base font-extrabold text-slate-900">Grand Total (COD)</span>
                  <span className="text-2xl font-black text-emerald-700">
                    Rs. {order.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100 no-print">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto rounded-xl border-slate-200 text-slate-700 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Invoice
                </Button>

                <Link to={`/orders/${order.id}`} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Open Live Tracker
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
