import { Card, type CardProps } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

export function GlassCard(props: CardProps) {
  const t = useTheme();
  return (
    <Card
      {...props}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: alpha(t.palette.background.paper, 0.72),
        backdropFilter: 'blur(16px)',
        border: `1px solid ${alpha('#bcd2ff', 0.16)}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(700px circle at 15% 0%, rgba(56,189,248,0.22), transparent 55%), radial-gradient(700px circle at 85% 15%, rgba(29,78,216,0.18), transparent 60%)',
          opacity: 0.9,
          pointerEvents: 'none',
        },
        '& > *': { position: 'relative' },
        ...props.sx,
      }}
    />
  );
}

