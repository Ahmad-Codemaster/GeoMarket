import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useRegisterCustomer, useCurrentUser } from '../../hooks/useAuth';
import { toast } from '../../hooks/useToast';
import { ApiError } from '../../lib/api';
import { UserRole } from '@geomarket/shared';

const registerCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).trim(),
  lastName: z.string().min(1, 'Last name is required').max(100).trim(),
  email: z.string().email('Enter a valid email address').trim(),
  phone: z.string().min(7, 'Phone must be at least 7 digits').max(20).trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

type RegisterCustomerForm = z.infer<typeof registerCustomerSchema>;

const roleHome: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: '/dashboard',
  [UserRole.VENDOR]: '/vendor',
  [UserRole.ADMIN]: '/admin',
};

export function RegisterCustomerPage() {
  const navigate = useNavigate();
  const registerMutation = useRegisterCustomer();
  const { data: user } = useCurrentUser();

  useEffect(() => {
    if (user) navigate(roleHome[user.role], { replace: true });
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterCustomerForm>({
    resolver: zodResolver(registerCustomerSchema),
  });

  const onSubmit = async (data: RegisterCustomerForm) => {
    try {
      await registerMutation.mutateAsync(data);
      toast({
        title: 'Account created successfully',
        description: 'Welcome to GeoMarket! Your customer account is active.',
        variant: 'success',
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('email', { message: 'An account with this email already exists' });
      } else if (err instanceof ApiError) {
        setError('root', { message: err.message });
      } else {
        toast({
          variant: 'destructive',
          title: 'Registration failed',
          description: 'An unexpected error occurred. Please try again.',
        });
      }
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      description="Join GeoMarket to discover and order from local stores in your area"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              placeholder="e.g. Ali"
              aria-invalid={!!errors.firstName}
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              placeholder="e.g. Hassan"
              aria-invalid={!!errors.lastName}
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+92 300 1234567"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            {...register('phone')}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {errors.root && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-2.5">
            <p className="text-sm text-destructive">{errors.root.message}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full mt-2"
          disabled={isSubmitting || registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Creating account…' : 'Create customer account'}
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
        <p>
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
        <p>
          Want to sell as a vendor?{' '}
          <Link to="/register/vendor" className="text-primary font-medium hover:underline">
            Register as Vendor
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
