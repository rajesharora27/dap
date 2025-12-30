import React from 'react';
import {
    Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Button,
    IconButton, Tabs, Tab, CircularProgress, Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Delete, FileUpload } from '@shared/components/FAIcon';
import { useApolloClient } from '@apollo/client';

import { useSolutionContext } from '../context/SolutionContext';
import { useSolutionDialogs } from '../hooks/useSolutionDialogs';
import { SolutionSummaryDashboard } from './SolutionSummaryDashboard';
import { SolutionMetadataSection } from './SolutionMetadataSection';
import { SolutionTasksTab } from './SolutionTasksTab';
import { SolutionDialog } from './SolutionDialog';
import { BulkImportDialog } from '@features/data-management/components/BulkImportDialog';

// Import mutations for sub-entity management if handling top-level save, 
// BUT SolutionDialog mostly handles it. We just need to trigger refetch.

export function SolutionsPageContent() {
    const theme = useTheme();
    const client = useApolloClient();

    const {
        solutions,
        loadingSolutions,
        selectedSolutionId,
        setSelectedSolutionId,
        selectedSolution,
        loadingSelectedSolution,
        refetchSolutions,
        refetchSelectedSolution,
        refetchTasks,
        selectedSubSection,
        setSelectedSubSection,
        deleteSolution,

        // Context actions for summary dashboard
        setShowFilters,
        setTaskOutcomeFilter,

        // Add Button Mode
        setExternalAddMode
    } = useSolutionContext();

    const {
        isImportDialogOpen,
        setImportDialogOpen,
        isSolutionDialogOpen,
        editingSolution,
        openAddSolution,
        openEditSolution,
        closeSolutionDialog
    } = useSolutionDialogs();

    // -- Handlers --
    const handleSaveSolution = async () => {
        // SolutionDialog handles everything internally (creating, updating, sub-entities).
        // We just need to refresh our view.
        await Promise.all([
            refetchSolutions(),
            selectedSolutionId ? refetchSelectedSolution() : Promise.resolve(),
            selectedSolutionId ? refetchTasks() : Promise.resolve()
        ]);
        closeSolutionDialog();
    };

    const handleDeleteSolution = async () => {
        if (!selectedSolution) return;
        if (window.confirm(`Are you sure you want to delete "${selectedSolution.name}"?`)) {
            try {
                await deleteSolution(selectedSolution.id);
            } catch (e) {
                // Error handled in context
            }
        }
    }

    if (loadingSolutions) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
            {/* Header & Selector */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 300 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Solutions
                    </Typography>
                    <FormControl size="small" fullWidth>
                        <InputLabel>Select Solution</InputLabel>
                        <Select
                            value={selectedSolutionId || ''}
                            onChange={(e) => setSelectedSolutionId(e.target.value)}
                            label="Select Solution"
                        >
                            {solutions.map((s) => (
                                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<FileUpload />}
                        onClick={() => setImportDialogOpen(true)}
                    >
                        Import
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={openAddSolution}
                    >
                        New Solution
                    </Button>
                </Box>
            </Box>

            {/* Selected Solution Content */}
            {selectedSolution && selectedSolutionId && (
                <Paper sx={{ mb: 3, overflow: 'hidden' }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6">{selectedSolution.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                startIcon={<Edit sx={{ fontSize: 18 }} />}
                                size="small"
                                onClick={() => openEditSolution(selectedSolution)}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Delete sx={{ fontSize: 18 }} />}
                                size="small"
                                onClick={handleDeleteSolution}
                            >
                                Delete
                            </Button>
                        </Box>
                    </Box>

                    {/* Tabs */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                        <Tabs
                            value={selectedSubSection}
                            onChange={(_, v) => setSelectedSubSection(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ borderBottom: 1, borderColor: 'divider', flex: 1 }}
                        >
                            <Tab label="Summary" value="summary" />
                            <Tab label="Resources" value="resources" />
                            <Tab label="Tasks" value="tasks" />
                            <Tab label="Tags" value="tags" />
                            <Tab label="Outcomes" value="outcomes" />
                            <Tab label="Releases" value="releases" />
                            <Tab label="Licenses" value="licenses" />
                            <Tab label="Custom Attributes" value="customAttributes" />
                        </Tabs>

                        {/* Quick Add Button logic */}
                        {selectedSubSection !== 'summary' && selectedSubSection !== 'tasks' && (
                            <Box sx={{ ml: 2 }}>
                                <Tooltip title="Add Item">
                                    <IconButton
                                        color="primary"
                                        onClick={() => setExternalAddMode(selectedSubSection)}
                                    >
                                        <Add />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ p: 0 }}>
                        {selectedSubSection === 'summary' && (
                            <Box sx={{ p: 2 }}>
                                <SolutionSummaryDashboard
                                    solution={selectedSolution}
                                    onOutcomeClick={(outcomeName: any) => {
                                        setSelectedSubSection('tasks');
                                        setShowFilters(true);
                                        if (outcomeName === 'All Outcomes') {
                                            setTaskOutcomeFilter(['__ALL_OUTCOMES__']);
                                        } else {
                                            const outcome = selectedSolution?.outcomes?.find((o: any) => o.name === outcomeName);
                                            if (outcome && outcome.id) {
                                                setTaskOutcomeFilter([outcome.id]);
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        )}

                        {selectedSubSection === 'tasks' && (
                            <Box sx={{ p: 2 }}>
                                <SolutionTasksTab />
                            </Box>
                        )}

                        {/* Metadata Section handles all other tabs */}
                        {selectedSubSection !== 'summary' && selectedSubSection !== 'tasks' && (
                            <Box sx={{ p: 2 }}>
                                <SolutionMetadataSection />
                            </Box>
                        )}
                    </Box>
                </Paper>
            )}

            {/* Dialogs */}
            <SolutionDialog
                open={isSolutionDialogOpen}
                onClose={closeSolutionDialog}
                onSave={handleSaveSolution}
                solutionId={editingSolution?.id}
                solution={editingSolution} // Pass full object just in case
            // title={editingSolution ? 'Edit Solution' : 'Add Solution'} // Title is handled inside dialog
            />

            {isImportDialogOpen && (
                <BulkImportDialog
                    open={isImportDialogOpen}
                    onClose={() => setImportDialogOpen(false)}
                    onSuccess={() => {
                        refetchSolutions();
                        refetchSelectedSolution();
                    }}
                    entityType="SOLUTION"
                />
            )}
        </Box>
    );
}
