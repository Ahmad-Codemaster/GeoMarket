import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useCurrentUser } from '../../hooks/useAuth';
import { UserRole } from '@geomarket/shared';

const roleHome: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: '/dashboard',
  [UserRole.VENDOR]: '/vendor',
  [UserRole.ADMIN]: '/admin',
};

export function NotFoundPage() {
  const { data: user } = useCurrentUser();
  const homeTarget = user ? roleHome[user.role] : '/';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-secondary/30">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Compass className="h-10 w-10 text-muted-foreground animate-pulse" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-3">Out of Delivery Range</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        The destination coordinate or route you requested could not be resolved on the GeoMarket map.
      </p>
      <Button asChild>
        <Link to={homeTarget}>
          <Home className="mr-2 h-4 w-4" />
          Return to {user ? 'Dashboard' : 'Home'}
        </Link>
      </Button>
    </div>
  );
}
