import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  Typography,
} from '@mui/material';

import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

import { GlassCard } from '../../../../dashboard/GlassCard';

export function SettingsNotificationsPage() {
  const [settings, setSettings] = useState({
    emailDeliverabilityAlerts: true,
    weeklyDigest: true,
    productAnnouncements: false,
    billingAlerts: true,
    securityAlerts: true,
    digestDay: 'Monday',
    quietHours: '22:00-07:00',
  });
  const [snack, setSnack] = useState<string | null>(null);

  const setValue = (key: keyof typeof settings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            Control what reaches your inbox and which alerts should bypass regular digests.
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<NotificationsActiveIcon />} sx={{ borderRadius: 1, fontWeight: 600 }} onClick={() => setSnack('Notification preferences saved.')}>
          Save preferences
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3,1fr)' } }}>
        {[
          { label: 'Critical alerts', value: settings.securityAlerts && settings.billingAlerts ? 'Enabled' : 'Partial', color: settings.securityAlerts && settings.billingAlerts ? 'success.main' : 'warning.main' },
          { label: 'Digest cadence', value: settings.weeklyDigest ? 'Weekly' : 'Off', color: settings.weeklyDigest ? 'text.primary' : 'warning.main' },
          { label: 'Quiet hours', value: settings.quietHours, color: 'text.primary' },
        ].map((card) => (
          <GlassCard key={card.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{card.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={card.color} sx={{ mt: 0.5 }}>{card.value}</Typography>
          </GlassCard>
        ))}
      </Box>

      <Alert severity="info" sx={{ fontSize: 13 }}>
        Security and billing alerts should usually remain enabled even if you mute product or marketing updates.
      </Alert>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2,1fr)' } }}>
        <GlassCard sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>Alert categories</Typography>
          <Stack spacing={1.75}>
            {[
              {
                key: 'emailDeliverabilityAlerts',
                title: 'Deliverability alerts',
                description: 'Bounce spikes, complaint trends, and reputation degradation.',
              },
              {
                key: 'billingAlerts',
                title: 'Billing alerts',
                description: 'Failed payments, renewals, and plan limit warnings.',
              },
              {
                key: 'securityAlerts',
                title: 'Security alerts',
                description: 'Suspicious sign-ins, MFA changes, and password events.',
              },
              {
                key: 'productAnnouncements',
                title: 'Product announcements',
                description: 'Optional feature launches and release highlights.',
              },
            ].map((item) => (
              <Box key={item.key} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={700}>{item.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                </Box>
                <Switch
                  checked={Boolean(settings[item.key as keyof typeof settings])}
                  onChange={(event) => setValue(item.key as keyof typeof settings, event.target.checked)}
                />
              </Box>
            ))}
          </Stack>
        </GlassCard>

        <GlassCard sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>Digest preferences</Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" fontWeight={700}>Weekly summary digest</Typography>
                <Typography variant="caption" color="text.secondary">Performance highlights, send volume, and engagement trends.</Typography>
              </Box>
              <Switch checked={settings.weeklyDigest} onChange={(event) => setValue('weeklyDigest', event.target.checked)} />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Digest day</InputLabel>
              <Select value={settings.digestDay} label="Digest day" onChange={(event) => setValue('digestDay', event.target.value)}>
                <MenuItem value="Monday">Monday</MenuItem>
                <MenuItem value="Wednesday">Wednesday</MenuItem>
                <MenuItem value="Friday">Friday</MenuItem>
              </Select>
              <FormHelperText>Ignored when weekly digests are disabled.</FormHelperText>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Quiet hours</InputLabel>
              <Select value={settings.quietHours} label="Quiet hours" onChange={(event) => setValue('quietHours', event.target.value)}>
                <MenuItem value="22:00-07:00">22:00 - 07:00</MenuItem>
                <MenuItem value="21:00-06:00">21:00 - 06:00</MenuItem>
                <MenuItem value="Off">Off</MenuItem>
              </Select>
              <FormHelperText>Critical security notifications may still bypass quiet hours.</FormHelperText>
            </FormControl>
          </Stack>
        </GlassCard>
      </Box>

      <GlassCard sx={{ p: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Delivery channels</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <Chip label="Email enabled" color="success" variant="outlined" />
          <Chip label="In-app alerts coming soon" variant="outlined" />
          <Chip label="Slack alerts via integrations" variant="outlined" />
        </Stack>
      </GlassCard>

      <Snackbar open={Boolean(snack)} autoHideDuration={3500} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnack(null)}>{snack}</Alert>
      </Snackbar>
    </Stack>
  );
}
