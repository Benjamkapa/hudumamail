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
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

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
                setResetToken(null);
                try {
                  const res = await forgotPasswordApi(values);
                  if (res.resetToken) setResetToken(res.resetToken);
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

            {resetToken && (
              <Alert severity="info">
                Dev mode token: <code>{resetToken}</code>{' '}
                <Link component="button" onClick={() => nav(`/reset-password?token=${encodeURIComponent(resetToken)}`)} underline="hover">
                  Continue
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

