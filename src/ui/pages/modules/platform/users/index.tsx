import { Paper, Stack, Typography } from '@mui/material';

export function AdminUsersPage() {
  return (
    <Stack spacing={2}>
      <Stack spacing={0.2}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          All users
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and manage platform users.
        </Typography>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">User administration - coming soon.</Typography>
      </Paper>
    </Stack>
  );
}
