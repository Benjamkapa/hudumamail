import { Alert, Button, Divider, Link, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { AuthSplitLayout } from '../auth/AuthSplitLayout';
import { forgotPasswordApi } from '../../lib/api/authApi';

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const nav = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  if (isSuccess) {
    return (
      <AuthSplitLayout title="Check your inbox" bullets={['Reset instructions sent', 'Secure link generated', 'Check spam folder'] as string[]}>
        <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
          <Stack spacing={1} alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Check your email</Typography>
            <Typography variant="body1" textAlign="center" color="text.secondary">
              If an account exists for that email, we've sent instructions to reset your password.
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
<AuthSplitLayout title="Account recovery" bullets={['Encrypted reset links', 'Fast identity verification', 'System integrity check'] as string[]}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Forgot password
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Enter your email and we’ll send reset instructions.
          </Typography>
        </Stack>

            <form
              onSubmit={handleSubmit(async (values) => {
                setServerError(null);
                try {
                  await forgotPasswordApi(values);
                  setIsSuccess(true);
                } catch (e: any) {
                  setServerError(e?.response?.data?.error ?? 'Failed to request reset');
                }
              })}
            >
              <Stack spacing={1.5}>
                <TextField label="Email" error={!!errors.email} helperText={errors.email?.message} {...register('email')} />
                <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
                  Send reset instructions
                </Button>
              </Stack>
            </form>

            {serverError && <Alert severity="error">{serverError}</Alert>}

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

