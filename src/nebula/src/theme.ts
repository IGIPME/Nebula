import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7C4DFF',
      light: '#B388FF',
      dark: '#651FFF',
    },
    secondary: {
      main: '#00E5FF',
      light: '#6EFFFF',
      dark: '#00B8D4',
    },
    background: {
      default: '#0D0D1A',
      paper: '#1A1A2E',
    },
    text: {
      primary: '#E0E0E0',
      secondary: '#9E9E9E',
    },
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans SC", "Roboto", "Helvetica", "Arial", sans-serif',
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(26,26,46,0.9) 0%, rgba(20,20,40,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(124,77,255,0.15)',
          transition: 'all 0.3s ease',
          '&:hover': {
            border: '1px solid rgba(124,77,255,0.4)',
            boxShadow: '0 8px 32px rgba(124,77,255,0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
