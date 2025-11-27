# Theme Selector Enhancements

## 🎨 What's New

The DAP application theme selector has been significantly enhanced with:

1. **5 Top Light Themes** - Popular light themes for better daytime viewing
2. **Custom Theme Builder** - Create your own custom themes with full color control
3. **19 Total Themes** - Expanded from 14 to 19 predefined themes

---

## 📋 Available Themes

### Dark Themes (13)
1. **Cisco Dark Blue** ⭐ (Default) - Official Cisco branding
2. **Cursor Dark** - Inspired by Cursor IDE
3. **Material Dark** - Google's Material Design dark mode
4. **GitHub Dark** - GitHub's popular dark theme
5. **VS Code Dark+** - Microsoft's VS Code theme
6. **Dracula** - Vibrant purple theme
7. **Nord** - Scandinavian cool colors
8. **Monokai** - Classic cyan & green
9. **Solarized Dark** - Carefully crafted palette
10. **One Dark Pro** - Atom's popular theme
11. **Gruvbox Dark** - Retro warm colors
12. **Tokyo Night** - Deep blue Japanese theme
13. **Ayu Dark** - Minimalist modern theme

### Light Themes (5 NEW!) 🆕
14. **Google Light** - Clean Google Material Design light theme
15. **Apple Light** - iOS-inspired light theme with signature blue
16. **Notion Light** - Minimalist and clean, inspired by Notion
17. **Slack Light** - Purple accent with professional look
18. **Figma Light** - Vibrant green and orange from Figma branding

### Plus: Material Light (Already existed)
- **Material Light** - Google's classic light theme

---

## 🎨 Custom Theme Builder

### How to Create a Custom Theme

1. **Access Theme Settings**
   - Click **Admin** in the left sidebar (admin access required)
   - Click **Themes**

2. **Create Custom Theme**
   - Click the **"Create Custom Theme"** button
   - A theme builder panel will expand

3. **Configure Your Theme**
   - **Theme Name**: Give your theme a unique name
   - **Mode Toggle**: Switch between Light and Dark mode
   - **Color Pickers**: Customize 6 color properties:
     - **Primary Color** - Main brand color (buttons, highlights)
     - **Secondary Color** - Accent color
     - **Background Color** - Main background
     - **Paper Color** - Card/panel background
     - **Primary Text** - Main text color
     - **Secondary Text** - Muted text color

4. **Save & Apply**
   - Click **"Save & Apply Custom Theme"**
   - Your custom theme is immediately applied and added to the theme list
   - It's saved in your browser's local storage

### Editing Custom Themes

1. Open the theme dropdown
2. **Hover** over the custom theme you want to edit
3. Click the **pencil icon** (Edit) that appears
4. The theme builder opens with the theme's current colors pre-filled
5. Make your changes
6. Click **"Save Changes"** to update the theme

### Deleting Custom Themes

1. Open the theme dropdown
2. **Hover** over the custom theme you want to delete
3. Click the **trash icon** (Delete) that appears
4. Confirm the deletion when prompted
5. If the deleted theme was active, the app switches to the default theme automatically

### Color Picker Features

- **Visual Color Picker**: Click the colored square to open a visual picker
- **Hex Input**: Type hex color codes directly (e.g., `#1976D2`)
- **Auto-generated Variants**: Light and dark shades are automatically calculated

### Custom Theme Management

- **Multiple Custom Themes**: Create and save unlimited custom themes
- Custom themes appear in the dropdown with a **"Custom"** badge
- Custom themes persist across browser sessions (stored in localStorage)
- **Edit Custom Themes**: Hover over a custom theme in the dropdown and click the edit icon (pencil)
- **Delete Custom Themes**: Hover over a custom theme in the dropdown and click the delete icon (trash)
- **Active Theme Indicator**: Currently applied theme shows an **"Active"** badge
- Switch between predefined and custom themes anytime
- If you delete the currently active custom theme, the app automatically switches to the default theme

---

## 🚀 How to Use

### Accessing Theme Settings

**For Admin Users:**
1. Log in to DAP
2. Click **Admin** in the left navigation
3. Click **Themes** in the admin submenu

### Switching Themes

1. Open the **"Select Theme"** dropdown
2. Browse available themes with visual color indicators
3. Light themes are marked with a **"Light"** badge
4. Click any theme to apply it instantly
5. Currently active theme shows an **"Active"** badge

### Theme Preview

The current theme preview shows:
- **Primary Color** chip - Main brand color
- **Secondary Color** chip - Accent color
- **Mode Badge** - Light or Dark mode indicator

---

## 🎯 Light Theme Highlights

### Google Light
- **Primary**: Google Blue (#4285F4)
- **Secondary**: Google Green (#34A853)
- **Best For**: Clean, professional interfaces

### Apple Light
- **Primary**: iOS Blue (#007AFF)
- **Secondary**: iOS Green (#34C759)
- **Best For**: Modern, minimalist look

### Notion Light
- **Primary**: Notion Blue (#2383E2)
- **Background**: Warm white (#F7F6F3)
- **Best For**: Document-heavy workflows

### Slack Light
- **Primary**: Slack Purple (#611F69)
- **Secondary**: Slack Green (#2EB67D)
- **Best For**: Team collaboration feel

### Figma Light
- **Primary**: Figma Green (#0ACF83)
- **Secondary**: Figma Orange (#F24E1E)
- **Best For**: Creative, design-focused work

---

## 💾 Storage & Persistence

### Theme Preferences
- **Storage**: Browser localStorage
- **Persistence**: Survives browser restarts
- **Scope**: Per-browser (not synced across devices)
- **Capacity**: Unlimited custom themes (limited only by browser localStorage quota)

### Custom Theme Storage
- **Custom themes array** is stored in: `localStorage.appCustomThemes` (JSON array)
- **Selected theme** is stored in: `localStorage.appTheme`
- Each custom theme has a unique ID generated when created: `custom-{timestamp}`

### Clearing Themes
To reset to defaults and remove all custom themes:
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Delete `appTheme` and `appCustomThemes` keys
4. Refresh the page

To remove a single custom theme, use the delete button in the theme dropdown.

---

## 🔧 Technical Details

### Files Modified

1. **`/frontend/src/theme/themes.ts`**
   - Added 5 new light themes
   - Added custom theme support
   - Added color adjustment helper function

2. **`/frontend/src/theme/ThemeProvider.tsx`**
   - Added custom theme state management
   - Added localStorage persistence for custom themes

3. **`/frontend/src/components/ThemeSelector.tsx`**
   - Enhanced UI with custom theme builder
   - Added color pickers for all theme properties
   - Added light/dark mode toggle

### API

```typescript
// Custom theme configuration interface
interface CustomThemeConfig {
  id?: string; // Auto-generated unique ID
  name: string;
  palette: {
    mode: 'light' | 'dark';
    primary: { main: string };
    secondary: { main: string };
    background: { default: string; paper: string };
    text: { primary: string; secondary: string };
  };
}

// Theme Provider context
interface ThemeContextType {
  currentTheme: ThemeKey | string; // Can be predefined key or custom theme ID
  customThemes: CustomThemeConfig[]; // Array of all custom themes
  setTheme: (theme: ThemeKey | string) => void;
  addCustomTheme: (config: CustomThemeConfig) => void;
  updateCustomTheme: (id: string, config: CustomThemeConfig) => void;
  deleteCustomTheme: (id: string) => void;
  getCustomThemeById: (id: string) => CustomThemeConfig | undefined;
}
```

### Usage Examples

**Creating a Custom Theme:**
```typescript
const { addCustomTheme } = useTheme();

addCustomTheme({
  name: 'Ocean Blue',
  palette: {
    mode: 'light',
    primary: { main: '#006994' },
    secondary: { main: '#00C9A7' },
    background: { default: '#F0F8FF', paper: '#FFFFFF' },
    text: { primary: '#1A1A1A', secondary: '#666666' },
  }
});
// Theme is automatically applied and assigned an ID like 'custom-1732543210123'
```

**Editing a Custom Theme:**
```typescript
const { updateCustomTheme } = useTheme();

updateCustomTheme('custom-1732543210123', {
  name: 'Ocean Blue (Updated)',
  palette: {
    mode: 'light',
    primary: { main: '#007AA3' }, // Changed color
    secondary: { main: '#00C9A7' },
    background: { default: '#F0F8FF', paper: '#FFFFFF' },
    text: { primary: '#1A1A1A', secondary: '#666666' },
  }
});
```

**Deleting a Custom Theme:**
```typescript
const { deleteCustomTheme } = useTheme();

deleteCustomTheme('custom-1732543210123');
// If this theme was active, switches to default theme
```

---

## 🎨 Design Guidelines

### Creating Effective Custom Themes

**For Light Themes:**
- Use darker colors for text (#000000 - #333333)
- Use lighter backgrounds (#FAFAFA - #FFFFFF)
- Ensure sufficient contrast (WCAG AA minimum)

**For Dark Themes:**
- Use lighter text colors (#E0E0E0 - #FFFFFF)
- Use darker backgrounds (#121212 - #2C2C2C)
- Avoid pure black (#000000), use dark grays

**Color Contrast Tips:**
- Primary color should stand out against background
- Text should be easily readable
- Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) for validation

---

## 🐛 Troubleshooting

### Theme Not Applying
1. **Hard refresh**: Press `Ctrl + Shift + R`
2. **Clear cache**: Browser settings → Clear browsing data
3. **Check console**: F12 → Console for errors

### Custom Theme Lost
- Custom themes are browser-specific
- Check if you're using the same browser/profile
- Export/save your hex codes manually if needed

### Colors Look Wrong
- Verify hex codes start with `#`
- Use 6-character hex codes (e.g., `#FF5722`)
- Avoid shorthand 3-character codes

### Can't Edit/Delete Custom Theme
- Make sure you're hovering over the theme in the dropdown
- Edit and delete icons appear on hover
- Only custom themes can be edited/deleted (not predefined themes)
- If icons don't appear, try refreshing the page

### Custom Theme Disappeared
- Check if you accidentally deleted it
- Custom themes are stored per-browser (not synced)
- If you cleared browser data, custom themes are lost
- Consider exporting theme colors manually before clearing data

---

## 📊 Summary Statistics

- **Total Predefined Themes**: 19 (14 dark + 5 light)
- **Light Themes**: 6 (Google Light, Apple Light, Notion Light, Slack Light, Figma Light, Material Light)
- **Dark Themes**: 13 (Cisco Dark Blue, Cursor Dark, and 11 more)
- **Custom Themes**: Unlimited (create, edit, delete as many as you want)
- **Custom Options**: 6 customizable color properties per theme
- **Build Hash**: `index-CJMwS6hb.js`
- **New Features**: Multi-theme management with edit/delete functionality

---

## ✨ Future Enhancements

Potential improvements for future versions:
- Export/import custom themes as JSON
- Theme preview before applying
- Multiple custom theme slots
- Sync themes across devices (requires backend)
- Community theme library
- Accessibility checker integration

---

## 📝 Quick Start Example

**Create a Custom "Ocean Blue" Light Theme:**

1. Click Admin → Themes → Create Custom Theme
2. Set Name: "Ocean Blue"
3. Mode: Light
4. Colors:
   - Primary: `#006994` (Deep ocean blue)
   - Secondary: `#00C9A7` (Teal accent)
   - Background: `#F0F8FF` (Alice blue)
   - Paper: `#FFFFFF` (White)
   - Primary Text: `#1A1A1A` (Near black)
   - Secondary Text: `#666666` (Gray)
5. Click "Save & Apply Custom Theme"

---

## 🆕 Latest Updates (November 25, 2025)

### Version 2.1.1 - Custom Theme Management

**New Features:**
- ✅ **Multiple Custom Themes**: Create unlimited custom themes (previously limited to 1)
- ✅ **Edit Custom Themes**: Edit existing custom themes via dropdown hover actions
- ✅ **Delete Custom Themes**: Remove unwanted custom themes with confirmation
- ✅ **Unique Theme IDs**: Each custom theme gets a unique identifier (`custom-{timestamp}`)
- ✅ **Visual Indicators**: Edit (pencil) and Delete (trash) icons on hover
- ✅ **Smart Auto-Switch**: Automatically switches to default theme when deleting active custom theme
- ✅ **Theme Counter**: Shows how many custom themes you have saved
- ✅ **Edit Mode UI**: Different UI state when editing vs creating new themes

**Technical Changes:**
- Migrated from single `customTheme` object to `customThemes` array
- Added `id` field to `CustomThemeConfig` interface
- New context methods: `addCustomTheme`, `updateCustomTheme`, `deleteCustomTheme`, `getCustomThemeById`
- Enhanced localStorage management for multiple themes
- Improved theme selection logic to handle custom theme IDs

---

**Date**: November 25, 2025  
**Version**: 2.1.1  
**Frontend Build**: `index-CJMwS6hb.js`

