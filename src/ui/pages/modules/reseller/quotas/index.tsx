import { Paper, Stack, Typography } from '@mui/material';

export function ResellerQuotasPage() {
  return (
    <Stack spacing={2}>
      <Stack spacing={0.2}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Quota allocation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Allocate sending limits by client.
        </Typography>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Coming soon.</Typography>
      </Paper>
    </Stack>
  );
}
