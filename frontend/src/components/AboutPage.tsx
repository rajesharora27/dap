import React from 'react';
import { Box, Typography, Paper, Divider, Chip } from '@mui/material';
import { Info as InfoIcon } from '@shared/components/FAIcon';

export const AboutPage: React.FC = () => {
    const version = __APP_VERSION__;
    const buildTimestamp = __BUILD_TIMESTAMP__;

    // Format the date nicely
    let buildDate = 'Unknown';
    try {
        buildDate = new Date(buildTimestamp).toLocaleString(undefined, {
            dateStyle: 'full',
            timeStyle: 'long'
        });
    } catch (e) {
        buildDate = buildTimestamp;
    }

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <InfoIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                        About DAP
                    </Typography>
                </Box>

                <Divider sx={{ mb: 4 }} />

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', mb: 2 }}>
                        Release Information
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body1" sx={{ width: 180, fontWeight: 500, color: 'text.primary' }}>
                            Application Version:
                        </Typography>
                        <Chip
                            label={`v${version}`}
                            color="primary"
                            variant="filled"
                            size="medium"
                            sx={{ fontWeight: 600 }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Typography variant="body1" sx={{ width: 180, fontWeight: 500, color: 'text.primary', mt: 0.5 }}>
                            Build Timestamp:
                        </Typography>
                        <Box>
                            <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                                {buildDate}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                (Time when this release was built)
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box>
                    <Typography variant="body2" color="text.secondary">
                        Digital Adoption Platform (DAP)
                        <br />
                        &copy; {new Date().getFullYear()} Cisco Systems, Inc. All rights reserved.
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};
