import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Stack, Typography, CircularProgress, Link } from '@mui/material';
import { AuthSplitLayout } from '../auth/AuthSplitLayout';
import { verifyEmailApi } from '../../lib/api/authApi';
import { CheckCircleOutline, ErrorOutline } from '@mui/icons-material';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    verifyEmailApi({ token })
      .then((res) => {
        setStatus('success');
        setMessage(res.message || 'Email verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may be expired or invalid.');
      });
  }, [params]);

  return (
    <AuthSplitLayout 
      title="Email Verification" 
      bullets={['Secure account activation', 'Identity validation', 'Access granted'] as string[]}
    >
      <Stack spacing={4} alignItems="center" sx={{ py: 4 }}>
        {status === 'loading' && (
          <>
            <CircularProgress size={48} />
            <Typography variant="h6">Verifying your email...</Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleOutline sx={{ fontSize: 64, color: 'success.main' }} />
            <Stack spacing={1} alignItems="center">
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Account Verified!</Typography>
              <Typography variant="body1" textAlign="center" color="text.secondary">
                {message}
              </Typography>
            </Stack>
            <Button 
              variant="contained" 
              fullWidth 
              size="large"
              onClick={() => nav('/login')}
            >
              Sign In
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <ErrorOutline sx={{ fontSize: 64, color: 'error.main' }} />
            <Stack spacing={1} alignItems="center">
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Verification Failed</Typography>
              <Typography variant="body1" textAlign="center" color="text.secondary">
                {message}
              </Typography>
            </Stack>
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={() => nav('/register')}
            >
              Back to Registration
            </Button>
          </>
        )}

        <Typography variant="body2">
          Need help? <Link href="mailto:support@chapmail.io" underline="hover">Contact support</Link>
        </Typography>
      </Stack>
    </AuthSplitLayout>
  );
}
