import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import LockResetIcon from '@mui/icons-material/LockReset';
import SecurityIcon from '@mui/icons-material/Security';

import { http } from '../../../../../lib/api/http';
import { useAuth } from '../../../../../state/auth/useAuth';
import { GlassCard } from '../../../../dashboard/GlassCard';

const SESSIONS = [
  { id: 's_01', device: 'Chrome on Windows', location: 'Nairobi, KE', lastSeen: 'Just now', current: true },
  { id: 's_02', device: 'Safari on macOS', location: 'London, UK', lastSeen: '2 days ago', current: false },
  { id: 's_03', device: 'Mobile app token', location: 'Frankfurt, DE', lastSeen: '5 days ago', current: false },
];

export function SettingsSecurityPage() {
  const { accessToken } = useAuth();
  const [form, setForm] = useState({ oldPassword: '', newPassword: '' });
  const [security, setSecurity] = useState({
    mfaEnabled: true,
    loginEmails: true,
    apiKeyApprovals: true,
  });
  const [snack, setSnack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setFormValue = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setSecurityValue = (key: keyof typeof security, value: boolean) => {
    setSecurity((prev) => ({ ...prev, [key]: value }));
  };

  const handlePasswordChange = async () => {
    setError(null);
    if (!form.oldPassword || form.newPassword.length < 8) {
      setError('Enter your current password and a new password with at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await http.post(
        '/auth/change-password',
        form,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnack((data as { message?: string })?.message ?? 'Password updated successfully.');
      setForm({ oldPassword: '', newPassword: '' });
    } catch (err: unknown) {
      const nextError = typeof err === 'object' && err && 'response' in err
        ? String(((err as { response?: { data?: { error?: string } } }).response?.data?.error) ?? 'Failed to change password.')
        : 'Failed to change password.';
      setError(nextError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Security</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage password hygiene, session visibility, and security notifications for your account.
          </Typography>
        </Stack>
        <Chip icon={<SecurityIcon sx={{ fontSize: '14px !important' }} />} label="MFA enabled" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3,1fr)' } }}>
        {[
          { label: 'Active sessions', value: SESSIONS.length, color: 'text.primary' },
          { label: 'MFA', value: security.mfaEnabled ? 'Enabled' : 'Disabled', color: security.mfaEnabled ? 'success.main' : 'warning.main' },
          { label: 'Security alerts', value: security.loginEmails ? 'Enabled' : 'Muted', color: security.loginEmails ? 'success.main' : 'warning.main' },
        ].map((card) => (
          <GlassCard key={card.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{card.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={card.color} sx={{ mt: 0.5 }}>{card.value}</Typography>
          </GlassCard>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2,1fr)' } }}>
        <GlassCard sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>Change password</Typography>
          <Stack spacing={2}>
            <TextField
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={form.oldPassword}
              onChange={(event) => setFormValue('oldPassword', event.target.value)}
              fullWidth
            />
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={(event) => setFormValue('newPassword', event.target.value)}
              helperText="Minimum 8 characters."
              fullWidth
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button variant="contained" startIcon={<LockResetIcon />} onClick={handlePasswordChange} disabled={saving}>
              {saving ? 'Updating...' : 'Update password'}
            </Button>
          </Stack>
        </GlassCard>

        <GlassCard sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>Security preferences</Typography>
          <Stack spacing={1.75}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" fontWeight={700}>Require MFA</Typography>
                <Typography variant="caption" color="text.secondary">Prompt for a second factor during sign-in.</Typography>
              </Box>
              <Switch checked={security.mfaEnabled} onChange={(event) => setSecurityValue('mfaEnabled', event.target.checked)} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" fontWeight={700}>Email me on new login</Typography>
                <Typography variant="caption" color="text.secondary">Get notified when a new browser or device signs in.</Typography>
              </Box>
              <Switch checked={security.loginEmails} onChange={(event) => setSecurityValue('loginEmails', event.target.checked)} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" fontWeight={700}>Approve API key creation</Typography>
                <Typography variant="caption" color="text.secondary">Receive an alert whenever a new API key is created in your workspace.</Typography>
              </Box>
              <Switch checked={security.apiKeyApprovals} onChange={(event) => setSecurityValue('apiKeyApprovals', event.target.checked)} />
            </Box>
          </Stack>
        </GlassCard>
      </Box>

      <GlassCard sx={{ p: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>Recent sessions</Typography>
        <Stack spacing={1.25}>
          {SESSIONS.map((session) => (
            <Box key={session.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
              <Box>
                <Typography variant="body2" fontWeight={700}>{session.device}</Typography>
                <Typography variant="caption" color="text.secondary">{session.location} · {session.lastSeen}</Typography>
              </Box>
              <Chip label={session.current ? 'Current session' : 'Recent'} size="small" color={session.current ? 'success' : 'default'} variant="outlined" />
            </Box>
          ))}
        </Stack>
      </GlassCard>

      <Snackbar open={Boolean(snack)} autoHideDuration={3500} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnack(null)}>{snack}</Alert>
      </Snackbar>
    </Stack>
  );
}
