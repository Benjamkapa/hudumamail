import { Alert, Button, Divider, Link, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { AuthSplitLayout } from '../auth/AuthSplitLayout';
import { resetPasswordApi } from '../../lib/api/authApi';

const schema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, 'Minimum 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string().min(1),
  })
  .refine((v) => v.password === v.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [ok, setOk] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { token: params.get('token') ?? '', password: '', confirmPassword: '' },
  });

  return (
<AuthSplitLayout title="Reset password" bullets={['Secure credential update', 'Session validation', 'Identity protection'] as string[]}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            New password
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Choose a strong password to secure your account.
          </Typography>
        </Stack>

            {!ok && (
              <form
                onSubmit={handleSubmit(async (values) => {
                  setOk(null);
                  setServerError(null);
                  try {
                    const res = await resetPasswordApi({ token: values.token, password: values.password });
                    setOk(res.message ?? 'Password reset successful');
                  } catch (e: any) {
                    setServerError(e?.response?.data?.error ?? 'Reset failed');
                  }
                })}
              >
                <Stack spacing={1.5}>
                  <TextField label="Reset token" error={!!errors.token} helperText={errors.token?.message} {...register('token')} />
                  <TextField
                    label="New password"
                    type="password"
                    error={!!errors.password}
                    helperText={errors.password?.message ?? 'Min 8 chars, with 1 uppercase and 1 number'}
                    {...register('password')}
                  />
                  <TextField
                    label="Confirm password"
                    type="password"
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                  <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
                    Update password
                  </Button>
                </Stack>
              </form>
            )}

            {serverError && <Alert severity="error">{serverError}</Alert>}
            {ok && (
              <Alert severity="success">
                {ok}{' '}
                <Link component="button" onClick={() => nav('/login', { replace: true })} underline="hover">
                  Sign in
                </Link>
              </Alert>
            )}

            <Divider />
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 1 }}>
              Back to{' '}
              <Link component="button" onClick={() => nav('/login')} underline="hover" sx={{ fontWeight: 700, color: 'primary.main' }}>
                sign in
              </Link>
            </Typography>
      </Stack>
    </AuthSplitLayout>
  );
}

