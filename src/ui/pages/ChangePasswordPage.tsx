import React from 'react';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { http } from '../../lib/api/http';
import { useAuth } from '../../state/auth/useAuth';

const schema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export function ChangePasswordPage() {
  const auth = useAuth();
  const accessToken = auth.accessToken!;
  const [ok, setOk] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { oldPassword: '', newPassword: '' },
  });

  return (
    <Stack spacing={2}>
      <Stack spacing={0.2}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Change password
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Update your account password.
        </Typography>
      </Stack>

      <Paper sx={{ p: 2.5 }}>
        <form
          onSubmit={handleSubmit(async (values) => {
            setOk(null);
            try {
              const { data } = await http.post(
                '/auth/change-password',
                values,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              setOk((data as any)?.message ?? 'Password updated');
              reset();
            } catch (e: any) {
              setError('oldPassword', { message: e?.response?.data?.error ?? 'Failed to change password' });
            }
          })}
        >
          <Stack spacing={1.5}>
            <TextField
              label="Current password"
              type="password"
              autoComplete="current-password"
              error={!!errors.oldPassword}
              helperText={errors.oldPassword?.message}
              {...register('oldPassword')}
            />
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message ?? 'Minimum 8 characters'}
              {...register('newPassword')}
            />
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              Update password
            </Button>
            {ok && <Alert severity="success">{ok}</Alert>}
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}

