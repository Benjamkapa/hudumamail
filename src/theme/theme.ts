import { createTheme, alpha } from '@mui/material/styles';

const blue = {
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
};

const indigo = {
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#0b122a',
};

const red = {
  500: '#ef4444',
};

export const bulkeTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: blue[500] },
    secondary: { main: blue[300] },
    error: { main: red[500] },
    background: {
      default: '#060a16',
      paper: '#0b1220',
    },
    text: {
      primary: '#e8efff',
      secondary: alpha('#e8efff', 0.68),
    },
    divider: alpha('#bcd2ff', 0.12),
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: [
      'Nunito',
      'Play',
      'Ubuntu',
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(900px circle at 20% 10%, rgba(14,165,233,0.20), transparent 55%), radial-gradient(900px circle at 80% 30%, rgba(29,78,216,0.22), transparent 60%), radial-gradient(1000px circle at 50% 120%, rgba(56,189,248,0.12), transparent 60%), #060a16',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${alpha('#bcd2ff', 0.14)}`,
          boxShadow: `0 24px 80px ${alpha('#000', 0.55)}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${alpha('#bcd2ff', 0.14)}`,
          boxShadow: `0 24px 80px ${alpha('#000', 0.55)}`,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 14 },
        containedPrimary: {
          background: `linear-gradient(135deg, ${blue[500]} 0%, ${indigo[700]} 100%)`,
        },
      },
    },
    MuiTextField: { defaultProps: { fullWidth: true, size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#bcd2ff', 0.06),
          borderRadius: 14,
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(blue[400], 0.55) },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: blue[500] },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: alpha('#070b16', 0.72),
          backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${alpha('#bcd2ff', 0.14)}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: alpha('#070b16', 0.65),
          backdropFilter: 'blur(16px)',
          borderRight: `1px solid ${alpha('#bcd2ff', 0.14)}`,
        },
      },
    },
  },
});

