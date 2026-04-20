import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function AccessDeniedPage() {
  const nav = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Access denied
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your role does not have permission to view this page.
            </Typography>
            <Button variant="contained" onClick={() => nav('/app/dashboard', { replace: true })}>
              Back to dashboard
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

