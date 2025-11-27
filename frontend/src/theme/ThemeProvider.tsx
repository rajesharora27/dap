import * as React from 'react';
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { createAppTheme, ThemeKey, DEFAULT_THEME, CustomThemeConfig } from './themes';

interface ThemeContextType {
  currentTheme: ThemeKey | string;
  customThemes: CustomThemeConfig[];
  setTheme: (theme: ThemeKey | string) => void;
  addCustomTheme: (config: CustomThemeConfig) => void;
  updateCustomTheme: (id: string, config: CustomThemeConfig) => void;
  deleteCustomTheme: (id: string) => void;
  getCustomThemeById: (id: string) => CustomThemeConfig | undefined;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const AppThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Load theme from localStorage or use default
  const [currentTheme, setCurrentTheme] = useState<ThemeKey | string>(() => {
    const saved = localStorage.getItem('appTheme');
    return saved || DEFAULT_THEME;
  });

  // Load custom themes array from localStorage
  const [customThemes, setCustomThemes] = useState<CustomThemeConfig[]>(() => {
    const savedCustom = localStorage.getItem('appCustomThemes');
    return savedCustom ? JSON.parse(savedCustom) : [];
  });

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('appTheme', currentTheme);
  }, [currentTheme]);

  // Save custom themes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('appCustomThemes', JSON.stringify(customThemes));
  }, [customThemes]);

  // Get current custom theme config if applicable
  const getCurrentCustomTheme = (): CustomThemeConfig | undefined => {
    if (currentTheme.startsWith('custom-')) {
      return customThemes.find(t => t.id === currentTheme);
    }
    return undefined;
  };

  const theme = createAppTheme(currentTheme as ThemeKey, getCurrentCustomTheme());

  const setTheme = (newTheme: ThemeKey | string) => {
    setCurrentTheme(newTheme);
  };

  const addCustomTheme = (config: CustomThemeConfig) => {
    const newTheme = {
      ...config,
      id: `custom-${Date.now()}`,
    };
    setCustomThemes(prev => [...prev, newTheme]);
    setCurrentTheme(newTheme.id);
  };

  const updateCustomTheme = (id: string, config: CustomThemeConfig) => {
    setCustomThemes(prev => prev.map(t => 
      t.id === id ? { ...config, id } : t
    ));
  };

  const deleteCustomTheme = (id: string) => {
    setCustomThemes(prev => prev.filter(t => t.id !== id));
    // If the deleted theme was active, switch to default
    if (currentTheme === id) {
      setCurrentTheme(DEFAULT_THEME);
    }
  };

  const getCustomThemeById = (id: string): CustomThemeConfig | undefined => {
    return customThemes.find(t => t.id === id);
  };

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      customThemes,
      setTheme, 
      addCustomTheme,
      updateCustomTheme,
      deleteCustomTheme,
      getCustomThemeById,
    }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

