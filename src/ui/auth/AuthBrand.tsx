import { Box, Stack, Typography } from '@mui/material';

export function AuthBrand({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <Stack spacing={1.25} alignItems="center" sx={{ textAlign: 'center' }}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        {/* image link */}
        <Box
          component="img"
          src="/favicon.png"
          alt="ChapMail logo"
          sx={{ width: 90, objectFit: 'contain', mb: 1, filter: 'drop-shadow(0 4px 12px rgba(0,102,255,0.4))' }}
        />
      </Stack>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  );
}
