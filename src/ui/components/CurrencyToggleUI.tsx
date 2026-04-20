import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import { useCurrency } from '../../state/currency/CurrencyContext';

export function CurrencyToggleUI() {
  const { currency, setCurrency } = useCurrency();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const blue = "#2563eb";
  const blueDim = isDark ? 'rgba(37,99,235,0.14)' : 'rgba(37,99,235,0.07)';
  const font = "'Nunito', 'Nunito Sans', sans-serif";

  return (
    <Tooltip title={`Switch Currency (Current: ${currency})`}>
      <Box
        onClick={() => setCurrency(currency === 'USD' ? 'KES' : 'USD')}
        sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.75,
          px: 1.5, py: 0.6, borderRadius: 99, cursor: 'pointer',
          border: `1.5px solid ${currency === 'KES' ? '#22c55e50' : `${blue}50`}`,
          bgcolor: currency === 'KES' ? 'rgba(34,197,94,0.08)' : blueDim,
          transition: 'all .2s',
          mx: 0.5,
          '&:hover': { borderColor: currency === 'KES' ? '#22c55e80' : `${blue}80` },
        }}
      >
        {/* Flag / icon */}
        {currency === 'USD' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="12" fill="#1e40af"/>
            <path d="M4 12H20M12 4V20" stroke="white" strokeWidth="2" opacity="0.4"/>
            <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="monospace">$</text>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="12" fill="#15803d"/>
            <text x="12" y="16" textAnchor="middle" fontSize="7" fontWeight="700" fill="white" fontFamily="monospace">KES</text>
          </svg>
        )}
        <Typography sx={{ fontSize: 12, fontWeight: 800, color: currency === 'KES' ? '#22c55e' : blue, fontFamily: font, letterSpacing: 0.5 }}>
          {currency}
        </Typography>
        {/* small swap icon */}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" stroke={currency === 'KES' ? '#22c55e' : blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Box>
    </Tooltip>
  );
}
