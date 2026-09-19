import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useLogin, useCurrentUser } from '../../hooks/useAuth';
import { toast } from '../../hooks/useToast';
import { ApiError } from '../../lib/api';
import { UserRole } from '@geomarket/shared';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const roleHome: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: '/dashboard',
  [UserRole.VENDOR]: '/vendor',
  [UserRole.ADMIN]: '/admin',
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();
  const { data: user } = useCurrentUser();

  // If already authenticated, redirect to role home
  useEffect(() => {
    if (user) navigate(roleHome[user.role], { replace: true });
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      const { user } = await loginMutation.mutateAsync(data);
      const from = (location.state as { from?: Location })?.from?.pathname;
      navigate(from || roleHome[user.role], { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Generic message — do not reveal whether email exists
        setError('root', { message: 'Invalid email or password' });
      } else {
        toast({ variant: 'destructive', title: 'Sign-in failed', description: 'Please try again.' });
      }
    }
  };

  return (
    <AuthLayout title="Welcome back" description="Sign in to your GeoMarket account">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {errors.root && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
            <p className="text-sm text-destructive">{errors.root.message}</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting || loginMutation.isPending}>
          {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
        <p>
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </p>
        <p>
          Are you a vendor?{' '}
          <Link to="/register/vendor" className="text-primary font-medium hover:underline">
            Register your store
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
