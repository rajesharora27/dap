import React, { useState, useEffect } from 'react';
import { getDevApiBaseUrl } from '../../config/frontend.config';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Divider,
    Alert,
    Chip,
    TextField,
    InputAdornment,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Tooltip
} from '@mui/material';
import {
    Description as DocIcon,
    Article as ArticleIcon,
    Code as CodeIcon,
    Build as BuildIcon,
    BugReport as TestIcon,
    Security as SecurityIcon,
    Speed as PerformanceIcon,
    GitHub as GitHubIcon,
    Search as SearchIcon,
    Download as DownloadIcon,
    OpenInNew as OpenIcon,
    Info as InfoIcon
} from '@mui/icons-material';

interface Document {
    name: string;
    path: string;
    category: string;
    description: string;
    size?: string;
    icon: React.ReactNode;
}

export const DevelopmentDocsPanel: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [docContent, setDocContent] = useState<string>('');

    const documents: Document[] = [
        {
            name: 'README',
            path: '/README.md',
            category: 'Overview',
            description: 'Main project documentation and quickstart guide',
            icon: <DocIcon />
        },
        {
            name: 'Context',
            path: '/CONTEXT.md',
            category: 'Overview',
            description: 'Application architecture and domain model',
            icon: <ArticleIcon />
        },
        {
            name: 'Contributing',
            path: '/CONTRIBUTING.md',
            category: 'Development',
            description: 'Contribution guidelines and workflow',
            icon: <GitHubIcon />
        },
        {
            name: 'Comprehensive Analysis',
            path: '/COMPREHENSIVE_ANALYSIS.md',
            category: 'Analysis',
            description: 'Complete codebase analysis with recommendations',
            icon: <CodeIcon />
        },
        {
            name: 'Executive Summary',
            path: '/EXECUTIVE_SUMMARY.md',
            category: 'Analysis',
            description: 'High-level improvements overview',
            icon: <DocIcon />
        },
        {
            name: 'Quick Reference',
            path: '/QUICK_REFERENCE.md',
            category: 'Reference',
            description: 'Quick reference for critical improvements',
            icon: <CodeIcon />
        },
        {
            name: 'Phase 2: Error Tracking',
            path: '/PHASE2_SUMMARY.md',
            category: 'Implementation',
            description: 'Sentry error tracking implementation',
            icon: <SecurityIcon />
        },
        {
            name: 'Phase 4: Performance',
            path: '/PHASE4_SUMMARY.md',
            category: 'Implementation',
            description: 'Performance optimization with DataLoader',
            icon: <PerformanceIcon />
        },
        {
            name: 'Phase 5: CI/CD',
            path: '/PHASE5_SUMMARY.md',
            category: 'Implementation',
            description: 'GitHub Actions CI/CD pipeline',
            icon: <GitHubIcon />
        },
        {
            name: 'Test Coverage',
            path: '/FINAL_TEST_COVERAGE.md',
            category: 'Testing',
            description: '70% test coverage achievement',
            icon: <TestIcon />
        },
        {
            name: 'Test Coverage Plan',
            path: '/TEST_COVERAGE_PLAN.md',
            category: 'Testing',
            description: 'Test coverage implementation plan',
            icon: <TestIcon />
        },
        {
            name: 'Comprehensive Test Summary',
            path: '/COMPREHENSIVE_TEST_SUMMARY.md',
            category: 'Testing',
            description: 'Complete test suite documentation',
            icon: <TestIcon />
        },
        {
            name: 'Final Summary',
            path: '/FINAL_SUMMARY.md',
            category: 'Summary',
            description: 'Overall project improvements summary',
            icon: <DocIcon />
        },
        {
            name: 'Deployment README',
            path: '/deploy/README.md',
            category: 'Deployment',
            description: 'Production deployment guide',
            icon: <BuildIcon />
        },
        {
            name: 'GitHub Workflows',
            path: '/.github/workflows/README.md',
            category: 'CI/CD',
            description: 'GitHub Actions workflows documentation',
            icon: <GitHubIcon />
        }
    ];

    const filteredDocs = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = Array.from(new Set(documents.map(d => d.category)));

    const loadDocument = async (doc: Document) => {
        setSelectedDoc(doc);
        setDocContent('Loading...');

        try {
            const response = await fetch(`${getDevApiBaseUrl()}/api/dev/docs${doc.path}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            setDocContent(result.content);
        } catch (error: any) {
            setDocContent(`Failed to load document: ${error.message}\n\nPath: ${doc.path}`);
        }
    };

    const openInVSCode = (path: string) => {
        alert(`Open in VS Code:\ncode ${path}`);
    };

    return (
        <Box>
            {/* Overview Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <InfoIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Documentation Browser Overview
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Browse and search project documentation directly within the development panel. Access all guides, references, and technical docs.
                        </Typography>
                        <Typography variant="body2" component="div">
                            <strong>Features:</strong>
                            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                                <li><strong>Search Documentation:</strong> Find docs across 90+ files</li>
                                <li><strong>Browse by Category:</strong> Organized into logical sections</li>
                                <li><strong>View Content:</strong> Read markdown files in-panel</li>
                                <li><strong>Quick Navigation:</strong> Jump to specific guides</li>
                            </ul>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            <strong>Requirements:</strong> Documentation files in project root and docs/ directory
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>How to Use:</strong> Search or browse by category, click document to view content, use buttons to open externally.
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ArticleIcon /> Documentation
                </Typography>
                <TextField
                    fullWidth
                    placeholder="Search documentation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        )
                    }}
                />
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                    <strong>Documentation Hub:</strong> All project documentation in one place.
                    Click on any document to view or open in your editor.
                </Typography>
            </Alert>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={3} sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                        {categories.map((category) => {
                            const categoryDocs = filteredDocs.filter(d => d.category === category);
                            if (categoryDocs.length === 0) return null;

                            return (
                                <Box key={category}>
                                    <Box sx={{ p: 2, bgcolor: 'grey.100' }}>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            {category}
                                        </Typography>
                                    </Box>
                                    <List dense>
                                        {categoryDocs.map((doc) => (
                                            <ListItemButton
                                                key={doc.path}
                                                selected={selectedDoc?.path === doc.path}
                                                onClick={() => loadDocument(doc)}
                                            >
                                                <ListItemIcon sx={{ minWidth: 40 }}>
                                                    {doc.icon}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={doc.name}
                                                    secondary={doc.description}
                                                    secondaryTypographyProps={{
                                                        fontSize: '0.75rem',
                                                        noWrap: true
                                                    }}
                                                />
                                            </ListItemButton>
                                        ))}
                                    </List>
                                    <Divider />
                                </Box>
                            );
                        })}
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    {selectedDoc ? (
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        {selectedDoc.name}
                                    </Typography>
                                    <Chip
                                        label={selectedDoc.category}
                                        size="small"
                                        sx={{ mr: 1 }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedDoc.path}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<CodeIcon />}
                                        onClick={() => openInVSCode(selectedDoc.path)}
                                    >
                                        Open in Editor
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<OpenIcon />}
                                        onClick={() => window.open(selectedDoc.path, '_blank')}
                                    >
                                        Open File
                                    </Button>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{
                                p: 2,
                                bgcolor: 'grey.50',
                                borderRadius: 1,
                                maxHeight: '60vh',
                                overflow: 'auto'
                            }}>
                                <Typography
                                    variant="body2"
                                    component="pre"
                                    sx={{
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {docContent}
                                </Typography>
                            </Box>
                        </Paper>
                    ) : (
                        <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
                            <ArticleIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                                Select a document to view
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {filteredDocs.length} documents available
                            </Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                    {categories.slice(0, 4).map((category) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={category}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle2" gutterBottom>
                                        {category}
                                    </Typography>
                                    <Typography variant="h4" color="primary">
                                        {documents.filter(d => d.category === category).length}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        documents
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    );
};
