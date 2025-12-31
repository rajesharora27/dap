import React from 'react';
import { Box, IconButton, Tooltip, Badge, CircularProgress } from '@mui/material';
import { Lock, LockOpen, FilterList, Clear, Add } from '@shared/components/FAIcon';
import { ColumnVisibilityToggle } from '@shared/components/ColumnVisibilityToggle';

interface TasksTabToolbarProps {
    loading?: boolean;
    isLocked: boolean;
    onToggleLock: () => void;
    showFilters: boolean;
    onToggleFilters: () => void;
    hasActiveFilters: boolean;
    activeFilterCount: number;
    onClearFilters: () => void;
    visibleColumns: string[];
    onToggleColumn: (column: string) => void;
    onAddTask: () => void;
}

export function TasksTabToolbar({
    loading,
    isLocked,
    onToggleLock,
    showFilters,
    onToggleFilters,
    hasActiveFilters,
    activeFilterCount,
    onClearFilters,
    visibleColumns,
    onToggleColumn,
    onAddTask
}: TasksTabToolbarProps) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {loading && <CircularProgress size={20} sx={{ mr: 1 }} />}

            <Tooltip title={isLocked ? "Unlock Tasks to Edit" : "Lock Tasks"}>
                <IconButton
                    size="small"
                    onClick={onToggleLock}
                    sx={{ color: isLocked ? 'text.secondary' : 'primary.main' }}
                >
                    {isLocked ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />}
                </IconButton>
            </Tooltip>

            <Tooltip title={showFilters ? "Hide Filters" : hasActiveFilters ? "Filters Active" : "Show Filters"}>
                <IconButton
                    size="small"
                    onClick={onToggleFilters}
                    color={hasActiveFilters || showFilters ? "primary" : "default"}
                >
                    <Badge badgeContent={activeFilterCount} color="secondary">
                        <FilterList fontSize="small" />
                    </Badge>
                </IconButton>
            </Tooltip>

            {hasActiveFilters && (
                <Tooltip title="Clear Filters">
                    <IconButton
                        size="small"
                        onClick={onClearFilters}
                        color="secondary"
                    >
                        <Clear fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}

            <ColumnVisibilityToggle
                visibleColumns={visibleColumns}
                onToggleColumn={onToggleColumn}
            />

            <Tooltip title={isLocked ? "Unlock Tasks to Add" : "Add Task"}>
                <span>
                    <IconButton
                        size="small"
                        color="primary"
                        disabled={isLocked}
                        onClick={onAddTask}
                    >
                        <Add fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
        </Box>
    );
}
