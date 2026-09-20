import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User as UserIcon, LayoutDashboard, Store, ShieldCheck, Package, MapPin, Truck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useLogout } from '../../hooks/useAuth';
import { toast } from '../../hooks/useToast';
import { getInitials, formatRole } from '../../lib/utils';
import type { AuthUser } from '@geomarket/shared';
import { UserRole } from '@geomarket/shared';

interface UserMenuProps {
  user: AuthUser;
}

const roleBadgeVariant: Record<UserRole, 'default' | 'vendor' | 'admin'> = {
  [UserRole.CUSTOMER]: 'default',
  [UserRole.VENDOR]: 'vendor',
  [UserRole.ADMIN]: 'admin',
};

const dashboardLink: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: '/dashboard',
  [UserRole.VENDOR]: '/vendor',
  [UserRole.ADMIN]: '/admin',
};

export function UserMenu({ user }: UserMenuProps) {
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    toast({ title: 'Signed out', description: 'See you next time!', variant: 'default' });
    navigate('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-1 hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
            {user.firstName}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <Badge variant={roleBadgeVariant[user.role]} className="mt-1 w-fit text-[10px]">
              {formatRole(user.role)}
            </Badge>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate(dashboardLink[user.role])}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </DropdownMenuItem>

          {user.role === UserRole.VENDOR && (
            <>
              <DropdownMenuItem onClick={() => navigate('/vendor/stores')}>
                <Store className="mr-2 h-4 w-4" />
                My Stores
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/vendor/products')}>
                <Package className="mr-2 h-4 w-4" />
                Products &amp; Inventory
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/vendor/orders')}>
                <Truck className="mr-2 h-4 w-4" />
                Incoming Orders
              </DropdownMenuItem>
            </>
          )}

          {user.role === UserRole.ADMIN && (
            <DropdownMenuItem onClick={() => navigate('/admin/stores')}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Administration
            </DropdownMenuItem>
          )}

          {user.role === UserRole.CUSTOMER && (
            <>
              <DropdownMenuItem onClick={() => navigate('/stores')}>
                <Store className="mr-2 h-4 w-4" />
                Discover Stores
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/orders')}>
                <Package className="mr-2 h-4 w-4" />
                My Orders
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/addresses')}>
                <MapPin className="mr-2 h-4 w-4" />
                Delivery Locations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <UserIcon className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
            </>
          )}

          {user.role === UserRole.VENDOR && (
            <DropdownMenuItem onClick={() => navigate('/vendor/profile')}>
              <Settings className="mr-2 h-4 w-4" />
              Vendor Profile
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
