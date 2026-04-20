import { Paper, Stack, Typography } from '@mui/material';

export function AdminHealthPage() {
  return (
    <Stack spacing={2}>
      <Stack spacing={0.2}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          System health
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Service uptime, queue status, and webhook delivery.
        </Typography>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Health dashboard - coming soon.</Typography>
      </Paper>
    </Stack>
  );
}
