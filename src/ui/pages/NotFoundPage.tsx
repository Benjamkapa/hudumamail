import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const nav = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Page not found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The page you’re looking for doesn’t exist.
            </Typography>
            <Button variant="contained" onClick={() => nav('/app/dashboard', { replace: true })}>
              Go to dashboard
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

