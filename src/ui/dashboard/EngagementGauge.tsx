import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import { GlassCard } from './GlassCard';

export function EngagementGauge(props: { title: string; value: number; subtitle?: string }) {
  const t = useTheme();
  const clamped = Math.max(0, Math.min(100, props.value));

  return (
    <GlassCard sx={{ p: 2.2, height: '100%' }}>
      <Stack spacing={1.5} sx={{ height: '100%' }}>
        <Stack spacing={0.3}>
          <Typography variant="body2" color="text.secondary">
            {props.title}
          </Typography>
          {props.subtitle ? (
            <Typography variant="caption" color="text.secondary">
              {props.subtitle}
            </Typography>
          ) : null}
        </Stack>

        <Box sx={{ position: 'relative', width: '100%', flex: 1, minHeight: 160, display: 'grid', placeItems: 'center' }}>
          <Box
            sx={{
              width: 190,
              height: 190,
              borderRadius: '50%',
              background: `conic-gradient(${t.palette.primary.main} ${clamped * 3.6}deg, ${alpha('#bcd2ff', 0.12)} 0deg)`,
              boxShadow: `0 0 0 10px ${alpha('#000', 0.12)} inset`,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Box
              sx={{
                width: 150,
                height: 150,
                borderRadius: '50%',
                backgroundColor: alpha(t.palette.background.paper, 0.85),
                border: `1px solid ${alpha('#bcd2ff', 0.14)}`,
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.6 }}>
                {clamped.toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Engagement
              </Typography>
            </Box>
          </Box>
        </Box>
      </Stack>
    </GlassCard>
  );
}

