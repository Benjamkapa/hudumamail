import { useNavigate } from 'react-router-dom';
import { Alert, Button, Divider, Link, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { useAuth } from '../../state/auth/useAuth';
import { AuthSplitLayout } from '../auth/AuthSplitLayout';

const schema = z.object({
  companyName: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string().min(1),
}).refine((v) => v.password === v.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { companyName: '', name: '', email: '', password: '', confirmPassword: '' },
  });

  if (isSuccess) {
    return (
      <AuthSplitLayout title="Check your inbox" bullets={['Verification email sent', 'Activate your account', 'Ready to scale'] as string[]}>
        <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
          <Stack spacing={1} alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Check your email</Typography>
            <Typography variant="body1" textAlign="center" color="text.secondary">
              We've sent a verification link to your inbox. Please click it to activate your account.
            </Typography>
          </Stack>
          <Button variant="contained" fullWidth onClick={() => nav('/login')}>
            Back to Login
          </Button>
        </Stack>
      </AuthSplitLayout>
    );
  }

  return (
<AuthSplitLayout title="Get started" bullets={['Zero-config infrastructure', 'Advanced security patterns', 'Scalable list architecture'] as string[]}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Create account
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Join 10,000+ teams sending smarter emails today.
          </Typography>
        </Stack>

            <form
              onSubmit={handleSubmit(async (values) => {
                setServerError(null);
                try {
                  await auth.register({
                    companyName: values.companyName,
                    name: values.name,
                    email: values.email,
                    password: values.password,
                  });
                  setIsSuccess(true);
                } catch (e: any) {
                  const msg =
                    e?.response?.data?.error ??
                    (e?.response?.data ? JSON.stringify(e.response.data) : null) ??
                    e?.message ??
                    'Registration failed';
                  setServerError(msg);
                  setError('email', { message: msg });
                }
              })}
            >
              <Stack spacing={1.5}>
                <TextField
                  label="Company name"
                  error={!!errors.companyName}
                  helperText={errors.companyName?.message}
                  {...register('companyName')}
                />
                <TextField label="Full name" error={!!errors.name} helperText={errors.name?.message} {...register('name')} />
                <TextField label="Email" error={!!errors.email} helperText={errors.email?.message} {...register('email')} />
                <TextField
                  label="Password"
                  type="password"
                  helperText={errors.password?.message ?? 'Min 8 chars, with 1 uppercase and 1 number'}
                  error={!!errors.password}
                  {...register('password')}
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
                {serverError && (
                  <Alert severity="error">
                    {serverError}
                    {serverError.toLowerCase().includes('connect') || serverError.toLowerCase().includes('network') ? (
                      <>
                        {' '}
                        Backend not reachable.
                      </>
                    ) : null}
                    {serverError.toLowerCase().includes('plan') ? (
                      <>
                        {' '}
                        If this is a fresh DB, run backend seed: <code>npm run seed</code>
                      </>
                    ) : null}
                  </Alert>
                )}
                <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
                  Create account
                </Button>
              </Stack>
            </form>

        <Divider />
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 1 }}>
          Already have an account?{' '}
          <Link component="button" onClick={() => nav('/login')} underline="hover" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Sign in
          </Link>
        </Typography>
      </Stack>
    </AuthSplitLayout>
  );
}

