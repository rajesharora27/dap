# Theme Selector Feature

## Overview
A comprehensive theme selector has been added to the DAP application, allowing users to choose from 14 beautiful themes including Cisco dark blue and popular code editor themes.

## Features

### Available Themes (14 Total)

1. **Cisco Dark Blue** (Default)
   - Official Cisco branding colors
   - Deep blue background with Cisco blue (#049FD9) accents
   - Professional enterprise look

2. **Cursor Dark**
   - Inspired by the Cursor IDE
   - Purple primary colors with dark backgrounds
   - Modern and sleek

3. **Material Light**
   - Google's Material Design light theme
   - Clean and professional
   - Great for daytime use

4. **Material Dark**
   - Google's Material Design dark theme
   - Easy on the eyes
   - Excellent contrast

5. **GitHub Dark**
   - Based on GitHub's dark theme
   - Blue accents with dark backgrounds
   - Familiar to developers

6. **VS Code Dark+**
   - Microsoft's popular VS Code theme
   - Blue primary colors
   - Dark, comfortable backgrounds

7. **Dracula**
   - Famous Dracula theme
   - Purple and pink accents
   - Vibrant and colorful

8. **Nord**
   - Scandinavian-inspired Nord theme
   - Cool blue and teal colors
   - Calm and sophisticated

9. **Monokai**
   - Classic Monokai theme
   - Cyan and green accents
   - Popular among developers

10. **Solarized Dark**
    - Ethan Schoonover's Solarized Dark
    - Carefully crafted color palette
    - Easy on the eyes

11. **One Dark Pro**
    - Atom's One Dark theme
    - Blue primary with warm accents
    - Very popular theme

12. **Gruvbox Dark**
    - Retro groove theme
    - Warm orange and green colors
    - Unique and distinctive

13. **Tokyo Night**
    - Based on Tokyo Night theme
    - Deep blue backgrounds
    - Purple and blue accents

14. **Ayu Dark**
    - Minimalist Ayu theme
    - Clean and modern
    - Blue and orange accents

## How to Use

### Accessing the Theme Selector

1. **Log in** to the DAP application
2. Click on the **Admin** section in the left sidebar
3. Click on **Theme** in the admin menu
4. A theme selector panel will appear with a dropdown

### Selecting a Theme

1. Click the **Select Theme** dropdown
2. Browse through the available themes (each shows a color indicator)
3. Click on your preferred theme
4. The theme will be applied **instantly** across the entire application
5. Your selection is **automatically saved** and will persist across sessions

### Theme Preview

The theme selector shows:
- A colored circle indicator for each theme's primary color
- The theme name
- An "Active" chip for the currently selected theme
- A preview section showing:
  - Current theme name
  - Primary and secondary color chips
  - Light/Dark mode indicator

## Technical Details

### Architecture

- **Theme Provider**: Wraps the entire application
- **Theme Storage**: Themes are persisted in browser's localStorage
- **Theme Configuration**: 14 pre-defined themes with Material-UI palette definitions
- **Dynamic Switching**: Themes change instantly without page reload

### Files Added

1. `/frontend/src/theme/themes.ts` - Theme definitions and configuration
2. `/frontend/src/theme/ThemeProvider.tsx` - Theme context and provider component
3. `/frontend/src/components/ThemeSelector.tsx` - Theme selector UI component

### Files Modified

1. `/frontend/src/main.tsx` - Added ThemeProvider wrapper
2. `/frontend/src/pages/App.tsx` - Added Theme menu item and integration

### Features

- ✅ 14 professionally designed themes
- ✅ Instant theme switching
- ✅ Persistent theme selection (localStorage)
- ✅ Visual theme preview
- ✅ Color indicators for each theme
- ✅ Dark and light mode support
- ✅ Material-UI integration
- ✅ Responsive design

## Customization

To add more themes, edit `/frontend/src/theme/themes.ts` and add a new theme configuration following the existing pattern:

```typescript
newTheme: {
  name: 'Theme Name',
  palette: {
    mode: 'dark', // or 'light'
    primary: {
      main: '#HEX_COLOR',
      light: '#HEX_COLOR',
      dark: '#HEX_COLOR',
    },
    secondary: {
      main: '#HEX_COLOR',
      light: '#HEX_COLOR',
      dark: '#HEX_COLOR',
    },
    background: {
      default: '#HEX_COLOR',
      paper: '#HEX_COLOR',
    },
    text: {
      primary: '#HEX_COLOR',
      secondary: '#HEX_COLOR',
    },
  },
},
```

## Browser Support

The theme selector works with all modern browsers that support:
- localStorage
- CSS custom properties
- ES6+ JavaScript

## Notes

- The default theme is **Cisco Dark Blue**
- Theme preferences are user-specific (stored locally)
- Clearing browser data will reset to the default theme
- All themes are optimized for accessibility and readability
- Themes apply to all components including charts, tables, and dialogs

## Screenshots & Testing

To test the theme selector:
1. Clear your browser cache: `Ctrl + Shift + R`
2. Log in as an admin user
3. Navigate to Admin → Theme
4. Try switching between different themes
5. Verify the theme persists after page reload
6. Check that all UI components adapt to the selected theme

Enjoy your new customizable interface! 🎨


