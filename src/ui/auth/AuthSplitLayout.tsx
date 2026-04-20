import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AuthBrand } from './AuthBrand';

interface Props {
  children: React.ReactNode;
  title: string;
  bullets: string[];
}

export function AuthSplitLayout({ children, title, bullets }: Props) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#050a18',
        backgroundImage: `radial-gradient(circle at 10% 10%, rgba(14,165,233,0.08) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(29,78,216,0.08) 0%, transparent 40%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 4, md: 6 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '1000px',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
          minHeight: '620px',
          borderRadius: .5,
          overflow: 'hidden',
          backgroundColor: '#0d1526',
          boxShadow: `0 40px 120px ${alpha('#000', 0.7)}`,
          border: `1px solid ${alpha('#ffffff', 0.08)}`,
        }}
      >
        {/* ── Left: Form ── */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: { xs: 4, sm: 6, md: 8 },
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Box sx={{ mb: 4 }}>
             <AuthBrand title={title} subtitle={bullets[0]} />
          </Box>
          {children}
        </Box>

        {/* ── Right: Visual ── */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            p: 6,
            background: `linear-gradient(135deg, ${alpha('#0ea5e9', 0.1)} 0%, ${alpha('#1d4ed8', 0.1)} 100%)`,
            position: 'relative',
            overflow: 'hidden',
            borderLeft: `1px solid ${alpha('#ffffff', 0.05)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-20%',
              right: '-20%',
              width: '80%',
              height: '80%',
              background: `radial-gradient(circle, ${alpha('#0ea5e9', 0.15)} 0%, transparent 70%)`,
              filter: 'blur(60px)',
            }
          }}
        >
            <Stack spacing={4} sx={{ position: 'relative', zIndex: 1 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -1, color: '#fff', mb: 2, lineHeight: 1.2 }}>
                       {title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: alpha('#fff', 0.6), lineHeight: 1.7 }}>
                        {bullets[0]}
                    </Typography>
                </Box>

                <Stack spacing={2.5}>
                    {bullets.slice(1).map((b, i) => (
                        <Stack key={i} direction="row" spacing={2} alignItems="center">
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0ea5e9', boxShadow: `0 0 12px ${alpha('#0ea5e9', 0.8)}` }} />
                            <Typography variant="body2" sx={{ color: alpha('#fff', 0.7), fontWeight: 500 }}>{b}</Typography>
                        </Stack>
                    ))}
                </Stack>
            </Stack>
        </Box>
      </Box>
    </Box>
  );
}
