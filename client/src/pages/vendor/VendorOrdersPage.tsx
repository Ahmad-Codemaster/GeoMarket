import { ShoppingCart } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { EmptyState } from '../../components/common/EmptyState';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

export function VendorOrdersPage() {
  return (
    <PageContainer width="wide">
      <PageHeader
        title="Incoming Orders &amp; Fulfillment"
        description="Fulfillment queue, state transitions, and dispatch coordination"
      />

      <div className="space-y-6">
        <Alert variant="info">
          <ShoppingCart className="h-4 w-4" />
          <AlertTitle>Phase 6 Milestone</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed">
            Order lifecycle execution (FSM transitions: PENDING → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED),
            store-scoped authorization (<code>order.store.vendorProfileId === vendor.id</code>), and Cash-on-Delivery (COD) reconciliation are scheduled for Phase 6.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Queue</CardTitle>
            <CardDescription>
              Orders received from customers within your delivery zones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={ShoppingCart}
              title="No Active Orders"
              description="Your order queue will populate once your stores begin receiving orders in Phase 6."
              isPlaceholder={true}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
