import { Building2, Mail, Phone, ShieldCheck, Hash, UserCheck } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { useCurrentUser } from '../../hooks/useAuth';

export function VendorProfilePage() {
  const { data: user } = useCurrentUser();

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Vendor Profile"
        description="Business identification and owner relationship mapping"
      />

      <div className="space-y-6">
        <Alert variant="info">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Audited Ownership Model</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed">
            Strict domain structure: <code>USERS → VENDOR_PROFILES → STORES</code>.
            Stores are owned by this VendorProfile entity, not directly attached to raw user
            credentials.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Business Profile</CardTitle>
              <Badge variant="vendor">Vendor Entity</Badge>
            </div>
            <CardDescription>Verified enterprise details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 py-2 border-b">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Vendor Profile ID</p>
                <p className="text-xs font-mono font-medium truncate">
                  {user?.vendorProfileId || 'Associated during registration'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2 border-b">
              <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Authorized Representative</p>
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2 border-b">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Contact Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2 border-b">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Contact Phone</p>
                <p className="text-sm font-medium">{user?.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2">
              <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Account Status</p>
                <p className="text-sm font-medium">
                  {user?.isActive ? (
                    <span className="text-emerald-600 font-medium">Active &amp; Authorized</span>
                  ) : (
                    <span className="text-destructive">Inactive</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
