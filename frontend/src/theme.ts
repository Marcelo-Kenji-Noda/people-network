import { createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';
import { createContext } from 'react';

export const ColorModeContext = createContext<{ mode: PaletteMode; toggleColorMode: () => void }>({
  mode: 'dark',
  toggleColorMode: () => {},
});

export function makeTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#1976d2' },
      secondary: { main: '#9c27b0' },
      background: mode === 'dark'
        ? { default: '#121212', paper: '#1e1e1e' }
        : { default: '#fafafa', paper: '#ffffff' },
    },
  });
}
