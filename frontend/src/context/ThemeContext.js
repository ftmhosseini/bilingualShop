import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const ThemeContext = createContext();

const DEFAULTS = {
  primaryColor: '#131921',
  accentColor: '#febd69',
};

// darken a hex color by a fraction (0–1)
function darken(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - Math.round(((n >> 16)) * amount));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(((n >> 8) & 0xff) * amount));
  const b = Math.max(0, (n & 0xff) - Math.round((n & 0xff) * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function ThemeProvider({ children }) {
  const [primaryColor, setPrimaryColorState] = useState(
    () => localStorage.getItem('primaryColor') || DEFAULTS.primaryColor
  );
  const [accentColor, setAccentColorState] = useState(
    () => localStorage.getItem('accentColor') || DEFAULTS.accentColor
  );
  const [dir, setDir] = useState(() => localStorage.getItem('dir') || 'ltr');

  useEffect(() => {
    document.documentElement.dir = dir;
    localStorage.setItem('dir', dir);
  }, [dir]);

  // Apply CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primaryColor);
    localStorage.setItem('primaryColor', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor);
    // compute a ~20% darker shade for hover / Buy Now
    const dark = darken(accentColor, 0.2);
    document.documentElement.style.setProperty('--accent-dark', dark);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  // Load from backend on mount
  useEffect(() => {
    api.get('/api/settings').then(r => {
      if (r.data.primary_color) setPrimaryColorState(r.data.primary_color);
      if (r.data.accent_color) setAccentColorState(r.data.accent_color);
    }).catch(() => { });
  }, []);

  const setPrimaryColor = async (val) => {
    setPrimaryColorState(val);
    await api.put('/api/settings/primary_color', { value: val }).catch(() => { });
  };

  const setAccentColor = async (val) => {
    setAccentColorState(val);
    await api.put('/api/settings/accent_color', { value: val }).catch(() => { });
  };

  return (
    <ThemeContext.Provider value={{
      primaryColor, setPrimaryColor, accentColor,
      setAccentColor, dir, setDir
    }}>      
    {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
