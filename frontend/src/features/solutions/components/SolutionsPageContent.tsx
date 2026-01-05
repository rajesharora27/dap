import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Button,
    IconButton, Tabs, Tab, CircularProgress, Tooltip, Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Delete, FileUpload, FileDownload } from '@shared/components/FAIcon';
import { useApolloClient, useLazyQuery } from '@apollo/client';

import { useSolutionContext } from '../context/SolutionContext';
import { useSolutionDialogs } from '../hooks/useSolutionDialogs';
import { SolutionSummaryDashboard } from './SolutionSummaryDashboard';
import { SolutionMetadataSection } from './SolutionMetadataSection';
import { SolutionTasksTab } from './SolutionTasksTab';
import { SolutionDialog } from './SolutionDialog';
import { BulkImportDialog } from '@features/data-management/components/BulkImportDialog';
import { TasksTabToolbar } from '@shared/components';

// Import mutations for sub-entity management if handling top-level save, 
// BUT SolutionDialog mostly handles it. We just need to trigger refetch.
import { EXPORT_SOLUTION } from '../graphql';
import { PRODUCTS } from '@features/products';
import { useQuery } from '@apollo/client';
import { SolutionProductList } from './SolutionProductList';

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
        tasks,
        filteredTasks,
        loadingTasks,
        refetchTasks,
        selectedSubSection,
        setSelectedSubSection,
        deleteSolution,

        // Context actions for summary dashboard
        showFilters,
        setShowFilters,
        setTaskOutcomeFilter,
        taskTagFilter,
        taskOutcomeFilter,
        taskReleaseFilter,
        taskLicenseFilter,
        handleClearFilters,
        visibleColumns,
        handleToggleColumn,
        isTasksLocked,
        setIsTasksLocked,

        // Add Button Mode
        setExternalAddMode,

        // Task Dialog (from context - shared state)
        openAddTask
    } = useSolutionContext();

    // Derived state for filters
    const hasActiveFilters = taskTagFilter.length > 0 || taskOutcomeFilter.length > 0 || taskReleaseFilter.length > 0 || taskLicenseFilter.length > 0;
    const activeFilterCount = [taskTagFilter, taskOutcomeFilter, taskReleaseFilter, taskLicenseFilter].filter(f => f.length > 0).length;

    const {
        isImportDialogOpen,
        setImportDialogOpen,
        isSolutionDialogOpen,
        editingSolution,
        openAddSolution,
        openEditSolution,
        closeSolutionDialog
    } = useSolutionDialogs();

    // Products tab add dialog state
    const [productsAddOpen, setProductsAddOpen] = useState(false);

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

    const [exportSolution] = useLazyQuery(EXPORT_SOLUTION);

    const handleExportSolution = async () => {
        if (!selectedSolutionId) return;
        try {
            const { data } = await exportSolution({ variables: { solutionId: selectedSolutionId } });
            if (data?.exportSolution) {
                const { filename, content, mimeType } = data.exportSolution;

                // Convert base64 to blob and download
                const blob = new Blob([Uint8Array.from(atob(content), c => c.charCodeAt(0))], { type: mimeType });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();

                // Cleanup
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error exporting solution:', error);
            alert('Failed to export solution');
        }
    };


    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('add') === 'true') {
            openAddSolution();
            // Clear the param after opening
            const newParams = new URLSearchParams(location.search);
            newParams.delete('add');
            navigate({ search: newParams.toString() }, { replace: true });
        }
    }, [location.search, openAddSolution, navigate]);

    // Fetch all products for the picker
    const { data: productsData } = useQuery(PRODUCTS, {
        fetchPolicy: 'cache-and-network'
    });
    const allProducts = (productsData?.products as any)?.edges?.map((e: any) => e.node) || [];

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mr: 2 }}>
                        Solutions
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 280 }}>
                        <InputLabel>Select Solution</InputLabel>
                        <Select
                            value={selectedSolutionId || ''}
                            onChange={(e) => {
                                if (e.target.value === '__NEW__') openAddSolution();
                                else setSelectedSolutionId(e.target.value);
                            }}
                            label="Select Solution"
                        >
                            {solutions.map((s) => (
                                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                            ))}
                            <Divider />
                            <MenuItem value="__NEW__" sx={{ color: '#3B82F6', fontWeight: 600 }}>
                                <Add fontSize="small" sx={{ mr: 1, color: '#3B82F6' }} /> Add Solution
                            </MenuItem>
                        </Select>
                    </FormControl>

                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FileUpload />}
                        onClick={() => setImportDialogOpen(true)}
                        sx={{ height: 40 }}
                    >
                        Import
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FileDownload />}
                        onClick={handleExportSolution}
                        disabled={!selectedSolutionId}
                        sx={{ height: 40 }}
                    >
                        Export
                    </Button>
                    {selectedSolutionId && (
                        <>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Edit />}
                                onClick={() => openEditSolution(selectedSolution)}
                                sx={{ height: 40 }}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                startIcon={<Delete />}
                                onClick={handleDeleteSolution}
                                sx={{ height: 40 }}
                            >
                                Delete
                            </Button>
                        </>
                    )}
                </Box>

                {/* Solution Name - aligned with breadcrumb path */}
                {selectedSolution && (
                    <Typography
                        sx={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: 'text.primary',
                            ml: 'auto',
                        }}
                    >
                        {selectedSolution.name}
                    </Typography>
                )}
            </Box>

            {/* Selected Solution Content */}
            {selectedSolution && selectedSolutionId && (
                <Paper sx={{ mb: 3, overflow: 'hidden' }}>
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
                            <Tab label="Products" value="products" />
                            <Tab label={filteredTasks ? `Tasks (${filteredTasks.length})` : 'Tasks'} value="tasks" />
                            <Tab label="Tags" value="tags" />
                            <Tab label="Outcomes" value="outcomes" />
                            <Tab label="Releases" value="releases" />
                            <Tab label="Licenses" value="licenses" />
                            <Tab label="Custom Attributes" value="customAttributes" />
                        </Tabs>

                        {/* Tasks Tab Toolbar - inline with tabs */}
                        {selectedSubSection === 'tasks' && (
                            <Box sx={{ ml: 2 }}>
                                <TasksTabToolbar
                                    loading={loadingTasks}
                                    isLocked={isTasksLocked}
                                    onToggleLock={() => setIsTasksLocked(!isTasksLocked)}
                                    showFilters={showFilters}
                                    onToggleFilters={() => setShowFilters(!showFilters)}
                                    hasActiveFilters={hasActiveFilters}
                                    activeFilterCount={activeFilterCount}
                                    onClearFilters={handleClearFilters}
                                    visibleColumns={visibleColumns}
                                    onToggleColumn={handleToggleColumn}
                                    onAddTask={openAddTask}
                                />
                            </Box>
                        )}

                        {/* Products Tab Add Button */}
                        {selectedSubSection === 'products' && (
                            <Box sx={{ ml: 2 }}>
                                <Tooltip title="Add Product">
                                    <IconButton
                                        color="primary"
                                        onClick={() => setProductsAddOpen(true)}
                                    >
                                        <Add />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}

                        {/* Quick Add Button logic */}
                        {selectedSubSection !== 'summary' && selectedSubSection !== 'tasks' && selectedSubSection !== 'products' && (
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
                                    tasks={tasks}
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

                        {selectedSubSection === 'products' && (
                            <Box sx={{ p: 2 }}>
                                <SolutionProductList
                                    solutionId={selectedSolution.id}
                                    solutionProducts={(selectedSolution.products as any)?.edges || []}
                                    allProducts={allProducts}
                                    onRefetch={() => {
                                        refetchSolutions();
                                        refetchSelectedSolution();
                                        refetchTasks();
                                    }}
                                    externalAddOpen={productsAddOpen}
                                    onExternalAddClose={() => setProductsAddOpen(false)}
                                />
                            </Box>
                        )}

                        {selectedSubSection === 'tasks' && (
                            <Box sx={{ p: 2 }}>
                                <SolutionTasksTab />
                            </Box>
                        )}

                        {/* Metadata Section handles all other tabs */}
                        {selectedSubSection !== 'summary' && selectedSubSection !== 'tasks' && selectedSubSection !== 'products' && (
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
