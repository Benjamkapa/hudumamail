import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import { GlassCard } from './GlassCard';

export function StatCard(props: {
  title: string;
  value: string;
  delta?: { value: string; direction: 'up' | 'down' };
  icon: React.ReactNode;
}) {
  const t = useTheme();
  const up = props.delta?.direction === 'up';

  return (
    <GlassCard sx={{ p: 2.2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Stack spacing={0.4}>
          <Typography variant="body2" color="text.secondary">
            {props.title}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }}>
              {props.value}
            </Typography>
            {props.delta ? (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: up ? '#34d399' : t.palette.error.main,
                }}
              >
                {props.delta.value}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.5,
            display: 'grid',
            placeItems: 'center',
            background: `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.26)} 0%, ${alpha(
              '#1d4ed8',
              0.18
            )} 100%)`,
            border: `1px solid ${alpha('#bcd2ff', 0.18)}`,
          }}
        >
          {props.icon}
        </Box>
      </Stack>
    </GlassCard>
  );
}

