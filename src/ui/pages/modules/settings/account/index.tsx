import { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import EditNoteIcon from '@mui/icons-material/EditNote';

import { useAuth } from '../../../../../state/auth/useAuth';
import { Role } from '../../../../../types/auth';
import { GlassCard } from '../../../../dashboard/GlassCard';

const ROLE_COLOR: Record<Role, string> = {
  SUPER_ADMIN: '#7c3aed',
  CLIENT_ADMIN: '#0284c7',
  CLIENT_USER: '#16a34a',
};

export function AccountPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    title: user?.role === Role.SUPER_ADMIN ? 'Platform administrator' : user?.role === Role.CLIENT_ADMIN ? 'Workspace administrator' : 'Marketing operator',
    timezone: 'Africa/Nairobi',
    marketingEmails: false,
    productUpdates: true,
  });
  const [snack, setSnack] = useState<string | null>(null);

  if (!user) return null;

  const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';

  const setValue = (key: keyof typeof profile, value: string | boolean) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Account</Typography>
          <Typography variant="body2" color="text.secondary">
            Profile details, workspace identity, and personal communication preferences.
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<EditNoteIcon />} sx={{ borderRadius: 1, fontWeight: 600 }} onClick={() => setSnack('Profile preferences saved.')}>
          Save changes
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' } }}>
        <GlassCard sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2.5 }}>
            <Avatar sx={{ width: 72, height: 72, fontSize: 28, fontWeight: 800, bgcolor: ROLE_COLOR[user.role] }}>
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={800}>{user.name}</Typography>
              <Typography variant="body2" color="text.secondary">{user.email}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                <Chip label={user.role.replace('_', ' ')} size="small" sx={{ bgcolor: ROLE_COLOR[user.role], color: '#fff', fontWeight: 700 }} />
                <Chip label={user.tenantName ?? 'No tenant'} size="small" variant="outlined" />
              </Stack>
            </Box>
          </Box>

          <Stack spacing={2}>
            <TextField label="Full name" value={profile.name} onChange={(event) => setValue('name', event.target.value)} fullWidth />
            <TextField label="Email address" value={profile.email} onChange={(event) => setValue('email', event.target.value)} fullWidth />
            <TextField label="Job title" value={profile.title} onChange={(event) => setValue('title', event.target.value)} fullWidth />
            <TextField label="Timezone" value={profile.timezone} onChange={(event) => setValue('timezone', event.target.value)} fullWidth />
          </Stack>
        </GlassCard>

        <Stack spacing={2}>
          <GlassCard sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>Workspace</Typography>
            <Stack spacing={1}>
              {[
                { label: 'Tenant', value: user.tenantName ?? 'Unassigned' },
                { label: 'Member since', value: createdAt },
                { label: 'Access tier', value: user.role === Role.SUPER_ADMIN ? 'Global platform access' : user.role === Role.CLIENT_ADMIN ? 'Workspace administration' : 'Standard workspace access' },
              ].map((row) => (
                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                  <Typography variant="caption" fontWeight={700}>{row.value}</Typography>
                </Box>
              ))}
            </Stack>
          </GlassCard>

          <GlassCard sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>Preferences</Typography>
            <Stack spacing={1.75}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={700}>Product updates</Typography>
                  <Typography variant="caption" color="text.secondary">Major releases, maintenance windows, and roadmap updates.</Typography>
                </Box>
                <Switch checked={profile.productUpdates} onChange={(event) => setValue('productUpdates', event.target.checked)} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={700}>Marketing emails</Typography>
                  <Typography variant="caption" color="text.secondary">Campaign ideas, webinars, and optional promotional content.</Typography>
                </Box>
                <Switch checked={profile.marketingEmails} onChange={(event) => setValue('marketingEmails', event.target.checked)} />
              </Box>
            </Stack>
          </GlassCard>
        </Stack>
      </Box>

      <Alert severity="info" sx={{ fontSize: 13 }}>
        Profile changes here affect your workspace identity in the UI. Security-sensitive updates such as password resets are handled in the Security module.
      </Alert>

      <Snackbar open={Boolean(snack)} autoHideDuration={3500} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnack(null)}>{snack}</Alert>
      </Snackbar>
    </Stack>
  );
}
