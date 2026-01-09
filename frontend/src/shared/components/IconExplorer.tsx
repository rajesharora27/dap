import React, { useState, useMemo } from 'react';
import {
    Box,
    TextField,
    Typography,
    Grid,
    Card,
    CardContent,
    IconButton,
    InputAdornment,
    Tooltip,
    Snackbar,
    Alert,
    Chip
} from '@mui/material';
import {
    Search as SearchIcon,
    ContentCopy as CopyIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import * as FAIcons from './FAIcon';

interface IconInfo {
    name: string;
    Component: React.ComponentType<any>;
    category?: string;
}

const IconExplorer: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    // Extract icons from FAIcon registry
    const allIcons = useMemo(() => {
        const icons: IconInfo[] = [];
        const entries = Object.entries(FAIcons);

        entries.forEach(([name, component]) => {
            if (name !== 'Icons' && name !== 'default' && typeof component === 'object') {
                icons.push({
                    name,
                    Component: component as unknown as React.ComponentType<any>
                });
            }
        });

        return icons.sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    const filteredIcons = useMemo(() => {
        if (!searchTerm) return allIcons;
        const term = searchTerm.toLowerCase();
        return allIcons.filter(icon =>
            icon.name.toLowerCase().includes(term)
        );
    }, [allIcons, searchTerm]);

    const handleCopy = (name: string) => {
        const codeSnippet = `<FAIcon.${name} />`;
        navigator.clipboard.writeText(codeSnippet);
        setSnackbar({
            open: true,
            message: `Copied: ${codeSnippet}`,
            severity: 'success'
        });
    };

    const handleCopyAsImage = async (name: string, event: React.MouseEvent) => {
        event.stopPropagation();

        // Find the SVG element within the card's main icon container
        const card = event.currentTarget.closest('.icon-card');
        const svg = card?.querySelector('.main-icon-container svg');

        if (!svg) {
            setSnackbar({ open: true, message: 'Could not find icon SVG', severity: 'info' });
            return;
        }

        try {
            // Serialize SVG to XML
            const serializer = new XMLSerializer();
            let source = serializer.serializeToString(svg);

            // Add xml namespaces if missing
            if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            if (!source.match(/^<svg[^>]+xmlns\:xlink="http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
                source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
            }

            // Create a canvas
            const canvas = document.createElement('canvas');
            const size = 512; // High res
            canvas.width = size;
            canvas.height = size;

            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            // Convert SVG to data URL
            const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);

            const img = new Image();
            img.onload = async () => {
                ctx.clearRect(0, 0, size, size);

                // Draw centered
                const aspectRatio = img.width / img.height || 1;
                let drawWidth = size;
                let drawHeight = size;

                if (aspectRatio > 1) {
                    drawHeight = size / aspectRatio;
                } else {
                    drawWidth = size * aspectRatio;
                }

                const x = (size - drawWidth) / 2;
                const y = (size - drawHeight) / 2;

                ctx.drawImage(img, x, y, drawWidth, drawHeight);

                canvas.toBlob(async (blob) => {
                    if (blob) {
                        try {
                            const data = [new ClipboardItem({ 'image/png': blob })];
                            await navigator.clipboard.write(data);
                            setSnackbar({
                                open: true,
                                message: `Copied ${name} as image to clipboard`,
                                severity: 'success'
                            });
                        } catch (err) {
                            console.error('Clipboard write failed:', err);
                            setSnackbar({ open: true, message: 'Clipboard write failed. Browser support required.', severity: 'info' });
                        }
                    }
                }, 'image/png');
            };
            img.src = url;

        } catch (error) {
            console.error('Error copying image:', error);
            setSnackbar({ open: true, message: 'Error generating image', severity: 'info' });
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="h6" gutterBottom>
                    Icon Reference Library
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Search and explore available Font Awesome icons in the DAP platform.
                    Click an icon to copy its component usage, or use the image button to copy as PNG.
                </Typography>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search icons by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearchTerm('')}>
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                    sx={{ backgroundColor: 'background.paper' }}
                />
                <Box sx={{ mt: 1 }}>
                    <Chip
                        label={`${filteredIcons.length} icons found`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Box>
            </Box>

            <Grid container spacing={2}>
                {filteredIcons.map((icon) => (
                    <Grid key={icon.name} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                        <Card
                            variant="outlined"
                            className="icon-card"
                            sx={{
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    backgroundColor: 'action.hover',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 1
                                },
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                position: 'relative'
                            }}
                            onClick={() => handleCopy(icon.name)}
                        >
                            <Box sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5,
                                zIndex: 2
                            }}>
                                <Tooltip title="Copy as Image">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleCopyAsImage(icon.name, e)}
                                        sx={{
                                            bgcolor: 'background.paper',
                                            boxShadow: 1,
                                            '&:hover': { bgcolor: 'primary.light', color: 'white' }
                                        }}
                                    >
                                        <CopyIcon sx={{ fontSize: '0.875rem' }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Box
                                    className="main-icon-container"
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: 48,
                                        width: 48,
                                        mb: 1
                                    }}
                                >
                                    <icon.Component fontSize="large" color="primary" />
                                </Box>
                                <Typography variant="caption" sx={{
                                    wordBreak: 'break-all',
                                    fontWeight: 'medium',
                                    color: 'text.primary',
                                    fontSize: '0.65rem'
                                }}>
                                    {icon.name}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {filteredIcons.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No icons found matching "{searchTerm}"
                    </Typography>
                </Box>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default IconExplorer;
