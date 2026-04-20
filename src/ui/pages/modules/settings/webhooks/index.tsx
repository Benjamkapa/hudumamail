import { Paper, Stack, Typography } from '@mui/material';

export function SettingsWebhooksPage() {
  return (
    <Stack spacing={2}>
      <Stack spacing={0.2}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Webhooks
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure webhook endpoints and retries.
        </Typography>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Webhook settings - coming soon.</Typography>
      </Paper>
    </Stack>
  );
}
