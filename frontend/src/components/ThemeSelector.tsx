import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Chip,
  Stack,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  Palette as PaletteIcon,
  Add as AddIcon,
  ColorLens as ColorLensIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '../components/common/FAIcon';
import { useTheme } from '../theme/ThemeProvider';
import { getThemeOptions, themes, CustomThemeConfig } from '../theme/themes';

export const ThemeSelector: React.FC = () => {
  const { currentTheme, customThemes, setTheme, addCustomTheme, updateCustomTheme, deleteCustomTheme, getCustomThemeById } = useTheme();
  const themeOptions = getThemeOptions();

  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [customConfig, setCustomConfig] = useState<CustomThemeConfig>({
    name: 'My Custom Theme',
    palette: {
      mode: 'light',
      primary: {
        main: '#1976D2',
      },
      secondary: {
        main: '#DC004E',
      },
      background: {
        default: '#FAFAFA',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#000000',
        secondary: '#666666',
      },
    },
  });

  const handleThemeChange = (event: any) => {
    setTheme(event.target.value);
  };

  const handleColorChange = (field: string, value: string) => {
    const parts = field.split('.');
    setCustomConfig((prev) => {
      const updated = { ...prev };
      let current: any = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return updated;
    });
  };

  const handleSaveCustomTheme = () => {
    if (editingThemeId) {
      // Update existing theme
      updateCustomTheme(editingThemeId, customConfig);
      setEditingThemeId(null);
    } else {
      // Add new theme
      addCustomTheme(customConfig);
    }
    setShowCustomBuilder(false);
    // Reset to default config
    setCustomConfig({
      name: 'My Custom Theme',
      palette: {
        mode: 'light',
        primary: { main: '#1976D2' },
        secondary: { main: '#DC004E' },
        background: { default: '#FAFAFA', paper: '#FFFFFF' },
        text: { primary: '#000000', secondary: '#666666' },
      },
    });
  };

  const handleCancelCustom = () => {
    setShowCustomBuilder(false);
    setEditingThemeId(null);
    // Reset config
    setCustomConfig({
      name: 'My Custom Theme',
      palette: {
        mode: 'light',
        primary: { main: '#1976D2' },
        secondary: { main: '#DC004E' },
        background: { default: '#FAFAFA', paper: '#FFFFFF' },
        text: { primary: '#000000', secondary: '#666666' },
      },
    });
  };

  const handleEditCustomTheme = (themeId: string) => {
    const theme = getCustomThemeById(themeId);
    if (theme) {
      setCustomConfig(theme);
      setEditingThemeId(themeId);
      setShowCustomBuilder(true);
    }
  };

  const handleDeleteCustomTheme = (themeId: string) => {
    if (window.confirm('Are you sure you want to delete this custom theme?')) {
      deleteCustomTheme(themeId);
    }
  };

  const getCurrentThemeConfig = () => {
    // Check if it's a custom theme
    if (typeof currentTheme === 'string' && currentTheme.startsWith('custom-')) {
      const customTheme = getCustomThemeById(currentTheme);
      if (customTheme) return customTheme;
    }
    // Check if it's a predefined theme
    if (currentTheme !== 'custom' && themes[currentTheme as keyof typeof themes]) {
      return themes[currentTheme as keyof typeof themes];
    }
    // Fallback
    return themes.ciscoLight;
  };

  const currentConfig = getCurrentThemeConfig();

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <PaletteIcon color="primary" />
          <Typography variant="h6">Theme Settings</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Choose your preferred color theme for the application. The theme will be saved and applied across all your sessions.
        </Typography>

        {/* Theme Selector Dropdown */}
        <FormControl fullWidth>
          <InputLabel id="theme-selector-label">Select Theme</InputLabel>
          <Select
            labelId="theme-selector-label"
            id="theme-selector"
            value={currentTheme}
            label="Select Theme"
            onChange={handleThemeChange}
          >
            {/* Predefined Themes */}
            {themeOptions.map((option) => {
              const themeConfig = themes[option.key as keyof typeof themes];
              return (
                <MenuItem key={option.key} value={option.key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: themeConfig.palette.primary.main,
                        border: '2px solid',
                        borderColor: 'divider',
                      }}
                    />
                    <Typography>{option.name}</Typography>
                    {themeConfig.palette.mode === 'light' && (
                      <Chip label="Light" size="small" variant="outlined" sx={{ ml: 'auto', mr: 1 }} />
                    )}
                    {option.key === currentTheme && (
                      <Chip label="Active" size="small" color="primary" sx={{ ml: 'auto' }} />
                    )}
                  </Box>
                </MenuItem>
              );
            })}
            
            {/* Custom Themes */}
            {customThemes.map((customTheme) => (
              <MenuItem 
                key={customTheme.id} 
                value={customTheme.id}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  '&:hover .theme-actions': {
                    opacity: 1,
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: customTheme.palette.primary.main,
                      border: '2px solid',
                      borderColor: 'divider',
                    }}
                  />
                  <Typography>{customTheme.name}</Typography>
                  <Chip label="Custom" size="small" color="secondary" sx={{ ml: 'auto' }} />
                  {customTheme.id === currentTheme && (
                    <Chip label="Active" size="small" color="primary" />
                  )}
                </Box>
                <Box 
                  className="theme-actions"
                  sx={{ 
                    display: 'flex', 
                    gap: 0.5, 
                    ml: 1,
                    opacity: 0.7,
                    transition: 'opacity 0.2s',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip title="Edit theme">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCustomTheme(customTheme.id!);
                      }}
                      sx={{ p: 0.5 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete theme">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomTheme(customTheme.id!);
                      }}
                      sx={{ p: 0.5 }}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Current Theme Preview */}
        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            <strong>Current Theme:</strong> {currentConfig.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="Primary"
              size="small"
              sx={{
                bgcolor: currentConfig.palette.primary.main,
                color: currentConfig.palette.mode === 'dark' ? '#fff' : '#000',
              }}
            />
            <Chip
              label="Secondary"
              size="small"
              sx={{
                bgcolor: currentConfig.palette.secondary.main,
                color: currentConfig.palette.mode === 'dark' ? '#fff' : '#000',
              }}
            />
            <Chip
              label={currentConfig.palette.mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        <Divider />

        {/* Custom Themes Info */}
        {customThemes.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              You have <strong>{customThemes.length}</strong> custom theme{customThemes.length !== 1 ? 's' : ''} saved. 
              Hover over a custom theme in the dropdown to edit or delete it.
            </Typography>
          </Box>
        )}

        {/* Custom Theme Builder Toggle */}
        <Box>
          <Button
            variant={showCustomBuilder ? "outlined" : "contained"}
            startIcon={showCustomBuilder ? <CancelIcon /> : <AddIcon />}
            onClick={() => {
              if (showCustomBuilder) {
                handleCancelCustom();
              } else {
                setShowCustomBuilder(true);
              }
            }}
            fullWidth
          >
            {showCustomBuilder ? (editingThemeId ? 'Cancel Editing' : 'Cancel') : 'Create Custom Theme'}
          </Button>
        </Box>

        {/* Custom Theme Builder */}
        <Collapse in={showCustomBuilder}>
          <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.default' }}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ColorLensIcon color="secondary" />
                <Typography variant="h6">
                  {editingThemeId ? 'Edit Custom Theme' : 'Custom Theme Builder'}
                </Typography>
              </Box>

              <Alert severity={editingThemeId ? "warning" : "info"} sx={{ mb: 2 }}>
                {editingThemeId 
                  ? 'Editing existing custom theme. Changes will be saved when you click "Save Changes".'
                  : 'Design your own theme by selecting colors. Light and dark variants will be generated automatically.'
                }
              </Alert>

              {/* Theme Name */}
              <TextField
                label="Theme Name"
                value={customConfig.name}
                onChange={(e) => setCustomConfig({ ...customConfig, name: e.target.value })}
                fullWidth
              />

              {/* Mode Switch */}
              <FormControlLabel
                control={
                  <Switch
                    checked={customConfig.palette.mode === 'dark'}
                    onChange={(e) =>
                      setCustomConfig({
                        ...customConfig,
                        palette: {
                          ...customConfig.palette,
                          mode: e.target.checked ? 'dark' : 'light',
                          background: e.target.checked
                            ? { default: '#121212', paper: '#1E1E1E' }
                            : { default: '#FAFAFA', paper: '#FFFFFF' },
                          text: e.target.checked
                            ? { primary: '#FFFFFF', secondary: '#B0B0B0' }
                            : { primary: '#000000', secondary: '#666666' },
                        },
                      })
                    }
                  />
                }
                label={`${customConfig.palette.mode === 'dark' ? 'Dark' : 'Light'} Mode`}
              />

              {/* Color Pickers */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {/* Primary Color */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Primary Color
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customConfig.palette.primary.main}
                      onChange={(e) => handleColorChange('palette.primary.main', e.target.value)}
                      style={{ width: 60, height: 40, cursor: 'pointer', border: 'none', borderRadius: '4px' }}
                    />
                    <TextField
                      value={customConfig.palette.primary.main}
                      onChange={(e) => handleColorChange('palette.primary.main', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Box>

                {/* Secondary Color */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Secondary Color
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customConfig.palette.secondary.main}
                      onChange={(e) => handleColorChange('palette.secondary.main', e.target.value)}
                      style={{ width: 60, height: 40, cursor: 'pointer', border: 'none', borderRadius: '4px' }}
                    />
                    <TextField
                      value={customConfig.palette.secondary.main}
                      onChange={(e) => handleColorChange('palette.secondary.main', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Box>

                {/* Background Default */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Background Color
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customConfig.palette.background.default}
                      onChange={(e) => handleColorChange('palette.background.default', e.target.value)}
                      style={{ width: 60, height: 40, cursor: 'pointer', border: 'none', borderRadius: '4px' }}
                    />
                    <TextField
                      value={customConfig.palette.background.default}
                      onChange={(e) => handleColorChange('palette.background.default', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Box>

                {/* Background Paper */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Paper Color
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customConfig.palette.background.paper}
                      onChange={(e) => handleColorChange('palette.background.paper', e.target.value)}
                      style={{ width: 60, height: 40, cursor: 'pointer', border: 'none', borderRadius: '4px' }}
                    />
                    <TextField
                      value={customConfig.palette.background.paper}
                      onChange={(e) => handleColorChange('palette.background.paper', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Box>

                {/* Text Primary */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Primary Text
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customConfig.palette.text?.primary || '#000000'}
                      onChange={(e) => handleColorChange('palette.text.primary', e.target.value)}
                      style={{ width: 60, height: 40, cursor: 'pointer', border: 'none', borderRadius: '4px' }}
                    />
                    <TextField
                      value={customConfig.palette.text?.primary || '#000000'}
                      onChange={(e) => handleColorChange('palette.text.primary', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Box>

                {/* Text Secondary */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Secondary Text
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customConfig.palette.text?.secondary || '#666666'}
                      onChange={(e) => handleColorChange('palette.text.secondary', e.target.value)}
                      style={{ width: 60, height: 40, cursor: 'pointer', border: 'none', borderRadius: '4px' }}
                    />
                    <TextField
                      value={customConfig.palette.text?.secondary || '#666666'}
                      onChange={(e) => handleColorChange('palette.text.secondary', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Box>
              </Box>

              {/* Save Button */}
              <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveCustomTheme}
                  fullWidth
                >
                  {editingThemeId ? 'Save Changes' : 'Save & Apply Custom Theme'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancelCustom}
                  fullWidth
                >
                  Cancel
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Collapse>
      </Stack>
    </Paper>
  );
};

