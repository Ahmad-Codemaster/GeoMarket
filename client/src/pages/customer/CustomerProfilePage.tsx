import { User as UserIcon, Mail, Phone, Shield, Calendar, MapPin } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useCurrentUser } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

export function CustomerProfilePage() {
  const { data: user } = useCurrentUser();

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="My Account"
        description="View your customer account details and linked preferences"
      />

      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Personal Details</CardTitle>
              <Badge variant="default">Customer</Badge>
            </div>
            <CardDescription>Verified account credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 py-2 border-b">
              <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2 border-b">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2 border-b">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Phone Number</p>
                <p className="text-sm font-medium">{user?.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Account Status</p>
                <p className="text-sm font-medium">
                  {user?.isActive ? (
                    <span className="text-emerald-600 font-medium">Active</span>
                  ) : (
                    <span className="text-destructive">Inactive</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Addresses Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Saved Delivery Addresses</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>
              Locations used to determine nearby store eligibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
              <p className="text-sm font-medium">No saved addresses yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Customer delivery address management with coordinates, geocoded labels, and PostGIS
                proximity indexing will be configured in Phase 5.
              </p>
              <div className="pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/addresses">Manage Addresses</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
