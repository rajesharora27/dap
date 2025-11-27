import { createTheme, ThemeOptions } from '@mui/material/styles';

// Define all available themes
export const themes = {
  // Cisco Official Dark Blue
  ciscoDark: {
    name: 'Cisco Dark Blue',
    palette: {
      mode: 'dark',
      primary: {
        main: '#049FD9', // Cisco Blue
        light: '#4BB8E8',
        dark: '#027AA3',
      },
      secondary: {
        main: '#6CC04A', // Cisco Green
        light: '#8FD670',
        dark: '#56A034',
      },
      background: {
        default: '#0D274D',
        paper: '#1A3A5C',
      },
      text: {
        primary: '#FFFFFF',
        secondary: '#B8D4E8',
      },
    },
  },

  // Cursor Dark Theme
  cursorDark: {
    name: 'Cursor Dark',
    palette: {
      mode: 'dark',
      primary: {
        main: '#8B5CF6', // Purple
        light: '#A78BFA',
        dark: '#7C3AED',
      },
      secondary: {
        main: '#10B981', // Green
        light: '#34D399',
        dark: '#059669',
      },
      background: {
        default: '#1E1E1E',
        paper: '#252526',
      },
      text: {
        primary: '#D4D4D4',
        secondary: '#9CA3AF',
      },
    },
  },

  // Material Design Light
  materialLight: {
    name: 'Material Light',
    palette: {
      mode: 'light',
      primary: {
        main: '#1976D2',
        light: '#42A5F5',
        dark: '#1565C0',
      },
      secondary: {
        main: '#DC004E',
        light: '#F50057',
        dark: '#C51162',
      },
      background: {
        default: '#FAFAFA',
        paper: '#FFFFFF',
      },
    },
  },

  // Material Design Dark
  materialDark: {
    name: 'Material Dark',
    palette: {
      mode: 'dark',
      primary: {
        main: '#90CAF9',
        light: '#B3E5FC',
        dark: '#42A5F5',
      },
      secondary: {
        main: '#F48FB1',
        light: '#F8BBD0',
        dark: '#EC407A',
      },
      background: {
        default: '#121212',
        paper: '#1E1E1E',
      },
    },
  },

  // GitHub Dark
  githubDark: {
    name: 'GitHub Dark',
    palette: {
      mode: 'dark',
      primary: {
        main: '#58A6FF',
        light: '#79B8FF',
        dark: '#1F6FEB',
      },
      secondary: {
        main: '#56D364',
        light: '#7EE787',
        dark: '#3FB950',
      },
      background: {
        default: '#0D1117',
        paper: '#161B22',
      },
      text: {
        primary: '#C9D1D9',
        secondary: '#8B949E',
      },
    },
  },

  // VS Code Dark+
  vsDark: {
    name: 'VS Code Dark+',
    palette: {
      mode: 'dark',
      primary: {
        main: '#007ACC',
        light: '#3399CC',
        dark: '#005A9E',
      },
      secondary: {
        main: '#CE9178',
        light: '#D7BA7D',
        dark: '#B5835A',
      },
      background: {
        default: '#1E1E1E',
        paper: '#252526',
      },
      text: {
        primary: '#D4D4D4',
        secondary: '#858585',
      },
    },
  },

  // Dracula
  dracula: {
    name: 'Dracula',
    palette: {
      mode: 'dark',
      primary: {
        main: '#BD93F9',
        light: '#D6ACFF',
        dark: '#9966FF',
      },
      secondary: {
        main: '#50FA7B',
        light: '#69FF94',
        dark: '#3BE162',
      },
      background: {
        default: '#282A36',
        paper: '#44475A',
      },
      text: {
        primary: '#F8F8F2',
        secondary: '#6272A4',
      },
    },
  },

  // Nord
  nord: {
    name: 'Nord',
    palette: {
      mode: 'dark',
      primary: {
        main: '#88C0D0',
        light: '#A3D4E6',
        dark: '#5E81AC',
      },
      secondary: {
        main: '#A3BE8C',
        light: '#B8D4A8',
        dark: '#81A670',
      },
      background: {
        default: '#2E3440',
        paper: '#3B4252',
      },
      text: {
        primary: '#ECEFF4',
        secondary: '#D8DEE9',
      },
    },
  },

  // Monokai
  monokai: {
    name: 'Monokai',
    palette: {
      mode: 'dark',
      primary: {
        main: '#66D9EF',
        light: '#7FE0F3',
        dark: '#4DAEC7',
      },
      secondary: {
        main: '#A6E22E',
        light: '#B8E962',
        dark: '#8BC34A',
      },
      background: {
        default: '#272822',
        paper: '#3E3D32',
      },
      text: {
        primary: '#F8F8F2',
        secondary: '#75715E',
      },
    },
  },

  // Solarized Dark
  solarizedDark: {
    name: 'Solarized Dark',
    palette: {
      mode: 'dark',
      primary: {
        main: '#268BD2',
        light: '#4AA5E3',
        dark: '#1E6AA1',
      },
      secondary: {
        main: '#2AA198',
        light: '#44B5AB',
        dark: '#1F8178',
      },
      background: {
        default: '#002B36',
        paper: '#073642',
      },
      text: {
        primary: '#839496',
        secondary: '#586E75',
      },
    },
  },

  // One Dark Pro
  oneDark: {
    name: 'One Dark Pro',
    palette: {
      mode: 'dark',
      primary: {
        main: '#61AFEF',
        light: '#7EC4F5',
        dark: '#4C8BBD',
      },
      secondary: {
        main: '#98C379',
        light: '#ABD18E',
        dark: '#7AA261',
      },
      background: {
        default: '#282C34',
        paper: '#21252B',
      },
      text: {
        primary: '#ABB2BF',
        secondary: '#5C6370',
      },
    },
  },

  // Gruvbox Dark
  gruvboxDark: {
    name: 'Gruvbox Dark',
    palette: {
      mode: 'dark',
      primary: {
        main: '#FE8019',
        light: '#FE9B40',
        dark: '#D65D0E',
      },
      secondary: {
        main: '#B8BB26',
        light: '#C7CA44',
        dark: '#98971A',
      },
      background: {
        default: '#282828',
        paper: '#3C3836',
      },
      text: {
        primary: '#EBDBB2',
        secondary: '#A89984',
      },
    },
  },

  // Tokyo Night
  tokyoNight: {
    name: 'Tokyo Night',
    palette: {
      mode: 'dark',
      primary: {
        main: '#7AA2F7',
        light: '#8FB6FA',
        dark: '#5B80D4',
      },
      secondary: {
        main: '#BB9AF7',
        light: '#C7A8FA',
        dark: '#9777D4',
      },
      background: {
        default: '#1A1B26',
        paper: '#24283B',
      },
      text: {
        primary: '#C0CAF5',
        secondary: '#9AA5CE',
      },
    },
  },

  // Ayu Dark
  ayuDark: {
    name: 'Ayu Dark',
    palette: {
      mode: 'dark',
      primary: {
        main: '#59C2FF',
        light: '#73CCFF',
        dark: '#3FA8E6',
      },
      secondary: {
        main: '#FFB454',
        light: '#FFC36D',
        dark: '#E69A3B',
      },
      background: {
        default: '#0A0E14',
        paper: '#0D1117',
      },
      text: {
        primary: '#B3B1AD',
        secondary: '#626A73',
      },
    },
  },

  // ===== TOP LIGHT THEMES =====

  // Google Light (Most Popular)
  googleLight: {
    name: 'Google Light',
    palette: {
      mode: 'light',
      primary: {
        main: '#4285F4', // Google Blue
        light: '#669DF6',
        dark: '#1967D2',
      },
      secondary: {
        main: '#34A853', // Google Green
        light: '#5BB974',
        dark: '#0F9D58',
      },
      background: {
        default: '#FFFFFF',
        paper: '#F8F9FA',
      },
      text: {
        primary: '#202124',
        secondary: '#5F6368',
      },
    },
  },

  // Apple Light
  appleLight: {
    name: 'Apple Light',
    palette: {
      mode: 'light',
      primary: {
        main: '#007AFF', // iOS Blue
        light: '#339DFF',
        dark: '#0051D5',
      },
      secondary: {
        main: '#34C759', // iOS Green
        light: '#5DD87A',
        dark: '#28A745',
      },
      background: {
        default: '#F2F2F7',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#000000',
        secondary: '#8E8E93',
      },
    },
  },

  // Notion Light
  notionLight: {
    name: 'Notion Light',
    palette: {
      mode: 'light',
      primary: {
        main: '#2383E2',
        light: '#4FA3F0',
        dark: '#1A5BB8',
      },
      secondary: {
        main: '#37352F',
        light: '#605E59',
        dark: '#25231F',
      },
      background: {
        default: '#FFFFFF',
        paper: '#F7F6F3',
      },
      text: {
        primary: '#37352F',
        secondary: '#787774',
      },
    },
  },

  // Slack Light
  slackLight: {
    name: 'Slack Light',
    palette: {
      mode: 'light',
      primary: {
        main: '#611F69', // Slack Purple
        light: '#8A4C93',
        dark: '#451349',
      },
      secondary: {
        main: '#2EB67D', // Slack Green
        light: '#58C497',
        dark: '#248E5D',
      },
      background: {
        default: '#FFFFFF',
        paper: '#F8F8F8',
      },
      text: {
        primary: '#1D1C1D',
        secondary: '#616061',
      },
    },
  },

  // Figma Light
  figmaLight: {
    name: 'Figma Light',
    palette: {
      mode: 'light',
      primary: {
        main: '#0ACF83', // Figma Green
        light: '#3AD89F',
        dark: '#07A768',
      },
      secondary: {
        main: '#F24E1E', // Figma Orange
        light: '#F57148',
        dark: '#D63A13',
      },
      background: {
        default: '#FFFFFF',
        paper: '#F5F5F5',
      },
      text: {
        primary: '#000000',
        secondary: '#666666',
      },
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
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 600,
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
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
export const DEFAULT_THEME: ThemeKey = 'ciscoDark';

