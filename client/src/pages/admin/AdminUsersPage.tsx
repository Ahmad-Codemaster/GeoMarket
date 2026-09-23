import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Store,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { adminApi } from '../../lib/api';
import { toast } from '../../hooks/useToast';
import { useCurrentUser } from '../../hooks/useAuth';
import { UserRole } from '@geomarket/shared';

const ROLE_BADGE: Record<string, { label: string; variant: 'default' | 'vendor' | 'admin' }> = {
  CUSTOMER: { label: 'Customer', variant: 'default' },
  VENDOR:   { label: 'Vendor',   variant: 'vendor' },
  ADMIN:    { label: 'Admin',    variant: 'admin' },
};

type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  vendorProfile: {
    id: string;
    businessLegalName: string;
    stores: Array<{ id: string; name: string; slug: string; isActive: boolean }>;
  } | null;
};

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [storesDialogUser, setStoresDialogUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ user: AdminUser; newRole: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search, roleFilter, page }],
    queryFn: () =>
      adminApi.getUsers({
        search: search.trim() || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        page,
        pageSize: 20,
      }),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      toast({ title: 'User removed', description: 'The user account has been deleted.' });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message ?? 'Could not delete user.', variant: 'destructive' });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      toast({ title: 'Role updated', description: 'User role has been changed.' });
      setRoleTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message ?? 'Could not update role.', variant: 'destructive' });
    },
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <PageContainer width="wide">
      <PageHeader
        title="User Management"
        description="View and manage all registered customers, vendors, and admins on the platform."
      />

      <div className="space-y-6">
        {/* Filters Row */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs">
          <CardContent className="pt-4 pb-4 px-5">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                {['ALL', 'CUSTOMER', 'VENDOR', 'ADMIN'].map((role) => (
                  <button
                    key={role}
                    onClick={() => { setRoleFilter(role); setPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      roleFilter === role
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {role === 'ALL' ? 'All Roles' : role.charAt(0) + role.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground self-center ml-auto shrink-0">
                {total} user{total !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="col-span-4">User</span>
              <span className="col-span-2">Role</span>
              <span className="col-span-2">Phone</span>
              <span className="col-span-2">Joined</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>

            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))
              : users.length === 0
              ? (
                <div className="text-center py-16">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No users found matching your filters.</p>
                </div>
              )
              : users.map((user) => {
                  const rb = ROLE_BADGE[user.role] ?? { label: user.role, variant: 'default' as const };
                  const isSelf = currentUser?.id === user.id;
                  return (
                    <div key={user.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center px-5 py-4 hover:bg-slate-50 transition-colors">
                      {/* User Info */}
                      <div className="sm:col-span-4 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 leading-tight">
                            {user.firstName} {user.lastName}
                            {isSelf && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>

                      {/* Role */}
                      <div className="sm:col-span-2">
                        <Badge variant={rb.variant} className="text-[10px]">{rb.label}</Badge>
                      </div>

                      {/* Phone */}
                      <div className="sm:col-span-2 text-xs text-muted-foreground">
                        {user.phone ?? '—'}
                      </div>

                      {/* Joined */}
                      <div className="sm:col-span-2 text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>

                      {/* Actions */}
                      <div className="sm:col-span-2 flex items-center gap-1.5 sm:justify-end flex-wrap">
                        {user.role === 'VENDOR' && user.vendorProfile && user.vendorProfile.stores.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 gap-1 rounded-lg"
                            onClick={() => setStoresDialogUser(user)}
                          >
                            <Store className="h-3 w-3" />
                            Stores ({user.vendorProfile.stores.length})
                          </Button>
                        )}
                        {!isSelf && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 gap-1 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Change role"
                              onClick={() => setRoleTarget({ user, newRole: user.role })}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 gap-1 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete user"
                              onClick={() => setDeleteTarget(user)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-5 py-3 bg-slate-50">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} ({total} users)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs rounded-xl"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs rounded-xl"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Vendor Stores Dialog */}
      <Dialog open={!!storesDialogUser} onOpenChange={(o) => !o && setStoresDialogUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {storesDialogUser?.firstName}'s Stores
            </DialogTitle>
            <DialogDescription>
              {storesDialogUser?.vendorProfile?.businessLegalName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {storesDialogUser?.vendorProfile?.stores.map((store) => (
              <div key={store.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{store.name}</p>
                  <p className="text-xs text-muted-foreground">/stores/{store.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={store.isActive ? 'default' : 'outline'} className="text-[10px]">
                    {store.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" asChild>
                    <Link to={`/admin/stores`}>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={!!roleTarget} onOpenChange={(o) => !o && setRoleTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {roleTarget?.user.firstName} {roleTarget?.user.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select
              value={roleTarget?.newRole}
              onValueChange={(v) => setRoleTarget((rt) => rt ? { ...rt, newRole: v } : null)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleTarget(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (roleTarget) {
                  roleMutation.mutate({ userId: roleTarget.user.id, role: roleTarget.newRole });
                }
              }}
              disabled={roleMutation.isPending || roleTarget?.newRole === roleTarget?.user.role}
            >
              {roleMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong> ({deleteTarget?.email}) and all their data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
