import { createTheme, ThemeOptions } from '@mui/material/styles';

// Define all available themes - ALL LIGHT THEMES
export const themes = {
  // 1. Cisco Light (Default)
  ciscoLight: {
    name: 'Cisco Light',
    palette: {
      mode: 'light',
      primary: { main: '#049FD9', light: '#4BB8E8', dark: '#027AA3' },
      secondary: { main: '#6CC04A', light: '#8FD670', dark: '#56A034' },
      background: { default: '#F5F7FA', paper: '#FFFFFF' },
      text: { primary: '#0D274D', secondary: '#5A6F8A' },
    },
  },

  // 2. Material Classic
  materialLight: {
    name: 'Material Blue',
    palette: {
      mode: 'light',
      primary: { main: '#1976D2', light: '#42A5F5', dark: '#1565C0' },
      secondary: { main: '#DC004E', light: '#F50057', dark: '#C51162' },
      background: { default: '#FAFAFA', paper: '#FFFFFF' },
      text: { primary: '#212121', secondary: '#757575' },
    },
  },

  // 3. Google
  googleLight: {
    name: 'Google',
    palette: {
      mode: 'light',
      primary: { main: '#4285F4', light: '#669DF6', dark: '#1967D2' },
      secondary: { main: '#34A853', light: '#5BB974', dark: '#0F9D58' },
      background: { default: '#FFFFFF', paper: '#F8F9FA' },
      text: { primary: '#202124', secondary: '#5F6368' },
    },
  },

  // 4. Apple (iOS)
  appleLight: {
    name: 'Apple',
    palette: {
      mode: 'light',
      primary: { main: '#007AFF', light: '#339DFF', dark: '#0051D5' },
      secondary: { main: '#34C759', light: '#5DD87A', dark: '#28A745' },
      background: { default: '#F2F2F7', paper: '#FFFFFF' },
      text: { primary: '#000000', secondary: '#8E8E93' },
    },
  },

  // 5. GitHub
  githubLight: {
    name: 'GitHub',
    palette: {
      mode: 'light',
      primary: { main: '#0969DA', light: '#218BFF', dark: '#0550AE' },
      secondary: { main: '#1F883D', light: '#2DA44E', dark: '#116329' },
      background: { default: '#FFFFFF', paper: '#F6F8FA' },
      text: { primary: '#1F2328', secondary: '#656D76' },
    },
  },

  // 6. VS Code
  vsLight: {
    name: 'VS Code',
    palette: {
      mode: 'light',
      primary: { main: '#0066B8', light: '#1177BB', dark: '#004E8C' },
      secondary: { main: '#008000', light: '#22AA22', dark: '#006600' },
      background: { default: '#FFFFFF', paper: '#F3F3F3' },
      text: { primary: '#333333', secondary: '#717171' },
    },
  },

  // 7. Notion
  notionLight: {
    name: 'Notion',
    palette: {
      mode: 'light',
      primary: { main: '#2383E2', light: '#4FA3F0', dark: '#1A5BB8' },
      secondary: { main: '#EB5757', light: '#F07676', dark: '#C94444' },
      background: { default: '#FFFFFF', paper: '#F7F6F3' },
      text: { primary: '#37352F', secondary: '#787774' },
    },
  },

  // 8. Slack
  slackLight: {
    name: 'Slack',
    palette: {
      mode: 'light',
      primary: { main: '#611F69', light: '#8A4C93', dark: '#451349' },
      secondary: { main: '#2EB67D', light: '#58C497', dark: '#248E5D' },
      background: { default: '#FFFFFF', paper: '#F8F8F8' },
      text: { primary: '#1D1C1D', secondary: '#616061' },
    },
  },

  // 9. Figma
  figmaLight: {
    name: 'Figma',
    palette: {
      mode: 'light',
      primary: { main: '#0ACF83', light: '#3AD89F', dark: '#07A768' },
      secondary: { main: '#F24E1E', light: '#F57148', dark: '#D63A13' },
      background: { default: '#FFFFFF', paper: '#F5F5F5' },
      text: { primary: '#000000', secondary: '#666666' },
    },
  },

  // 10. Linear (Light)
  linearLight: {
    name: 'Linear',
    palette: {
      mode: 'light',
      primary: { main: '#5E6AD2', light: '#808AD9', dark: '#3F4AB1' },
      secondary: { main: '#F2C94C', light: '#F5D56A', dark: '#D9B42C' },
      background: { default: '#F4F5F8', paper: '#FFFFFF' },
      text: { primary: '#27282B', secondary: '#6B6F76' },
    },
  },

  // 11. Spotify Light
  spotifyLight: {
    name: 'Spotify Light',
    palette: {
      mode: 'light',
      primary: { main: '#1DB954', light: '#4ACD76', dark: '#169C44' },
      secondary: { main: '#191414', light: '#3E3E3E', dark: '#000000' },
      background: { default: '#FFFFFF', paper: '#F5F5F5' },
      text: { primary: '#121212', secondary: '#535353' },
    },
  },

  // 12. Tailwind Light
  tailwindLight: {
    name: 'Tailwind',
    palette: {
      mode: 'light',
      primary: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB' }, // Blue 500
      secondary: { main: '#10B981', light: '#34D399', dark: '#059669' }, // Emerald 500
      background: { default: '#F3F4F6', paper: '#FFFFFF' }, // Gray 100
      text: { primary: '#111827', secondary: '#4B5563' }, // Gray 900, 600
    },
  },

  // 13. Solarized Light
  solarizedLight: {
    name: 'Solarized',
    palette: {
      mode: 'light',
      primary: { main: '#268BD2', light: '#4AA5E3', dark: '#1E6AA1' },
      secondary: { main: '#2AA198', light: '#44B5AB', dark: '#1F8178' },
      background: { default: '#FDF6E3', paper: '#EEE8D5' },
      text: { primary: '#657B83', secondary: '#93A1A1' },
    },
  },

  // 14. Nord Light
  nordLight: {
    name: 'Nord',
    palette: {
      mode: 'light',
      primary: { main: '#5E81AC', light: '#81A1C1', dark: '#4C6789' },
      secondary: { main: '#A3BE8C', light: '#B8D4A8', dark: '#81A670' },
      background: { default: '#ECEFF4', paper: '#E5E9F0' },
      text: { primary: '#2E3440', secondary: '#4C566A' },
    },
  },

  // 15. Ocean Blue
  oceanBlue: {
    name: 'Ocean',
    palette: {
      mode: 'light',
      primary: { main: '#0077B6', light: '#00A8E8', dark: '#005082' },
      secondary: { main: '#00B4D8', light: '#48CAE4', dark: '#0096C7' },
      background: { default: '#F0F9FF', paper: '#FFFFFF' },
      text: { primary: '#023047', secondary: '#4A6B7C' },
    },
  },
} as const;

export type ThemeKey = keyof typeof themes | 'custom';

// Custom theme configuration interface
export interface CustomThemeConfig {
  id?: string;
  name: string;
  palette: {
    mode: 'light' | 'dark';
    primary: {
      main: string;
      light?: string;
      dark?: string;
    };
    secondary: {
      main: string;
      light?: string;
      dark?: string;
    };
    background: {
      default: string;
      paper: string;
    };
    text?: {
      primary: string;
      secondary: string;
    };
  };
}

// Helper to lighten/darken colors
const adjustColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1).toUpperCase();
};

// Create Material-UI theme from theme config
export const createAppTheme = (themeKey: ThemeKey, customConfig?: CustomThemeConfig) => {
  let themeConfig: any;

  if (themeKey === 'custom' && customConfig) {
    // Use custom theme configuration
    themeConfig = customConfig;

    // Auto-generate light/dark variants if not provided
    if (!themeConfig.palette.primary.light) {
      themeConfig.palette.primary.light = adjustColor(themeConfig.palette.primary.main, 20);
    }
    if (!themeConfig.palette.primary.dark) {
      themeConfig.palette.primary.dark = adjustColor(themeConfig.palette.primary.main, -20);
    }
    if (!themeConfig.palette.secondary.light) {
      themeConfig.palette.secondary.light = adjustColor(themeConfig.palette.secondary.main, 20);
    }
    if (!themeConfig.palette.secondary.dark) {
      themeConfig.palette.secondary.dark = adjustColor(themeConfig.palette.secondary.main, -20);
    }
  } else if (themeKey !== 'custom') {
    themeConfig = themes[themeKey as keyof typeof themes];
  } else {
    // Fallback to default if custom is selected but no config provided
    themeConfig = themes[DEFAULT_THEME as keyof typeof themes];
  }

  const themeOptions: ThemeOptions = {
    ...themeConfig,
    typography: {
      // Cisco/Apple font stack:
      // CiscoSans (Cisco employees), SF Pro (Mac), Inter (Google fallback), Segoe UI (Windows)
      fontFamily: '"CiscoSans", "SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      h1: {
        fontWeight: 600,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontWeight: 600,
        letterSpacing: '-0.015em',
      },
      h4: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      body1: {
        letterSpacing: '-0.01em',
      },
      body2: {
        letterSpacing: '-0.005em',
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
        letterSpacing: '0.01em',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};

// Get all theme names and keys for the selector
export const getThemeOptions = () => {
  return Object.entries(themes).map(([key, config]) => ({
    key: key as ThemeKey,
    name: config.name,
  }));
};

// Default theme
export const DEFAULT_THEME: ThemeKey = 'ciscoLight';

