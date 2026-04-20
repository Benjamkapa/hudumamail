import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Container } from '@mui/material';
import { useAuth } from '../../state/auth/useAuth';

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      auth.googleLogin(code).then(() => {
        nav('/app/dashboard', { replace: true });
      }).catch(() => {
        nav('/login?error=google_failed', { replace: true });
      });
    } else {
      nav('/login', { replace: true });
    }
  }, [searchParams, auth, nav]);

  return (
    <Container sx={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress />
        <div>Completing Google login...</div>
      </Box>
    </Container>
  );
}

