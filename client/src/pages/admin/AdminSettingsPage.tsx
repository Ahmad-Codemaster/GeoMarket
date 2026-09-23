import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Settings, KeyRound, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { adminApi } from '../../lib/api';
import { toast } from '../../hooks/useToast';
import { useCurrentUser } from '../../hooks/useAuth';

function PasswordInput({
  id,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
        autoComplete="new-password"
      />
      <button
        type="button"
        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function AdminSettingsPage() {
  const { data: user } = useCurrentUser();

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const changePwdMutation = useMutation({
    mutationFn: () => adminApi.changePassword(currentPwd, newPwd),
    onSuccess: () => {
      toast({ title: 'Password updated', description: 'Your admin password has been changed successfully.' });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to update password',
        description: err.message ?? 'Please check your current password and try again.',
        variant: 'destructive',
      });
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 8) {
      toast({ title: 'Password too short', description: 'New password must be at least 8 characters.', variant: 'destructive' });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast({ title: 'Passwords do not match', description: 'New password and confirmation do not match.', variant: 'destructive' });
      return;
    }
    changePwdMutation.mutate();
  };

  return (
    <PageContainer width="default">
      <PageHeader
        title="Admin Settings"
        description="Manage your admin account security and preferences."
      />

      <div className="space-y-6 max-w-2xl">
        {/* Account Info */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Account Information
            </CardTitle>
            <CardDescription>Your admin account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">First Name</Label>
                <p className="text-sm font-semibold">{user?.firstName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Last Name</Label>
                <p className="text-sm font-semibold">{user?.lastName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email Address</Label>
                <p className="text-sm font-semibold">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <p className="text-sm font-semibold capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Your account has full administrative privileges on the GeoMarket platform.</span>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your admin account password. Choose a strong password with at least 8 characters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-pwd" className="text-sm">Current Password</Label>
                <PasswordInput
                  id="current-pwd"
                  placeholder="Enter your current password"
                  value={currentPwd}
                  onChange={setCurrentPwd}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-pwd" className="text-sm">New Password</Label>
                <PasswordInput
                  id="new-pwd"
                  placeholder="Minimum 8 characters"
                  value={newPwd}
                  onChange={setNewPwd}
                />
                {newPwd.length > 0 && newPwd.length < 8 && (
                  <p className="text-xs text-destructive">Must be at least 8 characters</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-pwd" className="text-sm">Confirm New Password</Label>
                <PasswordInput
                  id="confirm-pwd"
                  placeholder="Re-enter new password"
                  value={confirmPwd}
                  onChange={setConfirmPwd}
                />
                {confirmPwd.length > 0 && newPwd !== confirmPwd && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={changePwdMutation.isPending || !currentPwd || !newPwd || !confirmPwd}
                  className="w-full sm:w-auto"
                >
                  {changePwdMutation.isPending ? 'Updating…' : 'Update Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
