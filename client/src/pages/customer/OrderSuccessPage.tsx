import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  Truck,
  Printer,
  ShoppingBag,
  Clock,
  ArrowRight,
  MapPin,
  Phone,
  User,
  Store,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { orderApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';

export function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID required');
      return orderApi.getCustomerOrder(orderId);
    },
    enabled: Boolean(orderId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <LoadingState label="Finalizing order confirmation receipt..." />
      </div>
    );
  }

  if (error || !orderData?.order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <ErrorState
          title="Order Confirmation Unavailable"
          message="We could not load this order receipt. Please check your order tracking history."
          onRetry={() => navigate('/orders/track')}
        />
      </div>
    );
  }

  const order = orderData.order;

  return (
    <div className="min-h-screen bg-slate-50/60 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto print-container">
        {/* Celebration Header */}
        <div className="text-center mb-8 no-print">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-5 shadow-lg shadow-emerald-500/10 ring-8 ring-emerald-50 animate-bounce-short">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Order Placed Successfully!
          </h1>
          <p className="text-slate-600 text-base mt-2 max-w-md mx-auto">
            Thank you for shopping with GeoMarket. Your order is being prepared by the merchant.
          </p>

          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-200/80 shadow-xs mt-4">
            <span className="text-xs text-slate-500 font-medium">Order Reference:</span>
            <span className="font-mono text-sm font-bold text-slate-900">{order.id.slice(0, 13).toUpperCase()}</span>
          </div>
        </div>

        {/* Printable Invoice & Confirmation Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden print-container">
          {/* Receipt Top Header */}
          <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
                <Receipt className="w-4 h-4" />
                Official Order Receipt & Invoice
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                GeoMarket Order Confirmation
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

            <div className="flex sm:flex-col items-start sm:items-end gap-2">
              <Badge className="bg-emerald-500/30 text-white border border-emerald-400/40 text-xs font-bold px-3 py-1 rounded-lg">
                Cash on Delivery (COD)
              </Badge>
              <span className="text-xs text-emerald-200 font-medium">Status: {order.status}</span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Store & Customer Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
              {/* Store Details */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  Fulfilled By
                </div>
                <div className="font-bold text-slate-900 text-base">
                  {order.store?.name || 'Local Merchant'}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {order.store?.addressLine}, {order.store?.city}
                </div>
              </div>

              {/* Delivery Destination */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Delivery Details
                </div>
                <div className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {order.addressSnapshot?.recipientName || `${order.customer?.firstName} ${order.customer?.lastName}`}
                </div>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {order.addressSnapshot?.recipientPhone || order.customer?.phone}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {order.addressSnapshot?.address}, {order.addressSnapshot?.city}
                </div>
              </div>
            </div>

            {/* Itemized Order Breakdown */}
            <div className="py-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                Itemized Order Breakdown
              </h3>

              <div className="divide-y divide-slate-100">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex-1 pr-4">
                      <div className="font-semibold text-slate-900">
                        {item.productNameSnapshot}
                      </div>
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

            {/* Totals Summary */}
            <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-medium text-slate-900">Rs. {order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-slate-400" />
                  Standard Delivery Fee
                </span>
                <span className="font-medium text-slate-900">Rs. {order.deliveryFee.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <span className="text-base font-extrabold text-slate-900">Grand Total (COD)</span>
                  <div className="text-xs text-slate-500">Payment upon arrival</div>
                </div>
                <span className="text-2xl font-black text-emerald-700">
                  Rs. {order.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Cash on Delivery Notice Callout */}
            <div className="mt-8 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong>Cash on Delivery Reminder:</strong> Please have the exact amount of{' '}
                <strong>Rs. {order.totalAmount.toLocaleString()}</strong> ready when your delivery rider arrives at your doorstep.
              </div>
            </div>
          </div>
        </div>

        {/* Post-Checkout Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-8 no-print">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2 py-6"
          >
            <Printer className="w-4 h-4" />
            Download / Print Invoice
          </Button>

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <Link to="/stores">
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 py-6"
              >
                Continue Shopping
              </Button>
            </Link>

            <Link to={`/orders/${order.id}`}>
              <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 font-bold flex items-center justify-center gap-2 shadow-md">
                <Clock className="w-4 h-4" />
                Track Live Order Status
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
