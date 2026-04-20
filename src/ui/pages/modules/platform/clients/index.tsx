import { Paper, Stack, Typography } from '@mui/material';

export function AdminClientsPage() {
  return (
    <Stack spacing={2}>
      <Stack spacing={0.2}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Client accounts
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage tenants and subscription status.
        </Typography>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Client administration - coming soon.</Typography>
      </Paper>
    </Stack>
  );
}
