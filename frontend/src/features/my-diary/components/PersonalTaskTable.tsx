/**
 * Personal Task Table
 * Table of tasks in a personal assignment with status tracking
 */

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Select,
    MenuItem,
    TextField,
    IconButton,
    Typography,
    Chip,
    Tooltip,
    LinearProgress,
} from '@mui/material';
import {
    CheckCircle as DoneIcon,
    PlayArrow as InProgressIcon,
    RadioButtonUnchecked as NotStartedIcon,
    Block as NotApplicableIcon,
    Save as SaveIcon,
    Edit as EditIcon,
} from '@shared/components/FAIcon';
import { UPDATE_PERSONAL_ASSIGNMENT_TASK_STATUS } from '../graphql/personal-sandbox';

interface PersonalTaskTableProps {
    assignment: {
        id: string;
        tasks: Array<{
            id: string;
            status: string;
            statusNotes: string | null;
            statusUpdatedAt: string | null;
            sequenceNumber: number;
            personalTask: {
                id: string;
                name: string;
                description: string | null;
                estMinutes: number;
                weight: number;
            };
        }>;
    };
    onTaskUpdated: () => void;
}

const STATUS_OPTIONS = [
    { value: 'NOT_STARTED', label: 'Not Started', icon: NotStartedIcon, color: 'default' },
    { value: 'IN_PROGRESS', label: 'In Progress', icon: InProgressIcon, color: 'info' },
    { value: 'COMPLETED', label: 'Completed', icon: DoneIcon, color: 'success' },
    { value: 'DONE', label: 'Done', icon: DoneIcon, color: 'success' },
    { value: 'NOT_APPLICABLE', label: 'N/A', icon: NotApplicableIcon, color: 'default' },
] as const;

export const PersonalTaskTable: React.FC<PersonalTaskTableProps> = ({
    assignment,
    onTaskUpdated,
}) => {
    const [editingNotes, setEditingNotes] = useState<string | null>(null);
    const [notesValue, setNotesValue] = useState('');

    const [updateStatus] = useMutation(UPDATE_PERSONAL_ASSIGNMENT_TASK_STATUS, {
        onCompleted: () => onTaskUpdated(),
    });

    const handleStatusChange = (taskId: string, newStatus: string) => {
        updateStatus({
            variables: {
                taskId,
                input: { status: newStatus },
            },
        });
    };

    const handleSaveNotes = (taskId: string) => {
        updateStatus({
            variables: {
                taskId,
                input: { status: assignment.tasks.find(t => t.id === taskId)?.status || 'NOT_STARTED', statusNotes: notesValue },
            },
        });
        setEditingNotes(null);
    };

    const getStatusIcon = (status: string) => {
        const option = STATUS_OPTIONS.find(o => o.value === status);
        if (!option) return <NotStartedIcon />;
        const Icon = option.icon;
        return <Icon color={option.color as any} />;
    };

    const sortedTasks = [...assignment.tasks].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    // Calculate completion percentage
    const totalTasks = sortedTasks.length;
    const completedTasks = sortedTasks.filter(t =>
        t.status === 'DONE' || t.status === 'COMPLETED'
    ).length;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
        <Box>
            {/* Progress Summary */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">
                        Overall Progress
                    </Typography>
                    <Typography variant="subtitle2" fontWeight="bold">
                        {completedTasks} / {totalTasks} tasks ({Math.round(progressPercentage)}%)
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    color={progressPercentage === 100 ? 'success' : 'primary'}
                    sx={{ height: 10, borderRadius: 5 }}
                />
            </Paper>

            {/* Tasks Table */}
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'background.default' }}>
                            <TableCell width={40}>#</TableCell>
                            <TableCell>Task</TableCell>
                            <TableCell width={100} align="center">Est. Time</TableCell>
                            <TableCell width={150}>Status</TableCell>
                            <TableCell>Notes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedTasks.map((task, index) => (
                            <TableRow
                                key={task.id}
                                sx={{
                                    bgcolor: task.status === 'DONE' || task.status === 'COMPLETED'
                                        ? 'action.hover'
                                        : 'inherit',
                                    '&:hover': { bgcolor: 'action.selected' },
                                }}
                            >
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                        {index + 1}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box>
                                        <Typography variant="body2" fontWeight={500}>
                                            {task.personalTask.name}
                                        </Typography>
                                        {task.personalTask.description && (
                                            <Typography variant="caption" color="text.secondary">
                                                {task.personalTask.description}
                                            </Typography>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={`${task.personalTask.estMinutes}m`}
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={task.status}
                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                        size="small"
                                        fullWidth
                                        sx={{
                                            minWidth: 130,
                                            '.MuiSelect-select': {
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                            },
                                        }}
                                    >
                                        {STATUS_OPTIONS.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {getStatusIcon(option.value)}
                                                    <span>{option.label}</span>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    {editingNotes === task.id ? (
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <TextField
                                                value={notesValue}
                                                onChange={(e) => setNotesValue(e.target.value)}
                                                size="small"
                                                fullWidth
                                                placeholder="Add notes..."
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveNotes(task.id);
                                                    if (e.key === 'Escape') setEditingNotes(null);
                                                }}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => handleSaveNotes(task.id)}
                                                color="primary"
                                            >
                                                <SaveIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    ) : (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'action.hover' },
                                                borderRadius: 1,
                                                px: 1,
                                                py: 0.5,
                                            }}
                                            onClick={() => {
                                                setEditingNotes(task.id);
                                                setNotesValue(task.statusNotes || '');
                                            }}
                                        >
                                            {task.statusNotes ? (
                                                <Typography variant="body2" sx={{ flex: 1 }}>
                                                    {task.statusNotes}
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontStyle: 'italic' }}>
                                                    Click to add notes...
                                                </Typography>
                                            )}
                                            <EditIcon fontSize="small" sx={{ opacity: 0.5 }} />
                                        </Box>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {sortedTasks.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                        No tasks in this assignment. Sync with the product to add tasks.
                    </Typography>
                </Box>
            )}
        </Box>
    );
};
