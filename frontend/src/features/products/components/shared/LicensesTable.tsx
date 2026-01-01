import React, { useState, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableRow, IconButton,
    TextField, Box, Typography, Button, Checkbox
} from '@mui/material';
import {
    Edit as EditIcon, Delete as DeleteIcon,
    CheckCircle, Cancel as CancelIcon, Add as AddIcon
} from '@mui/icons-material';
import { License } from '@features/product-licenses';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';
import { Chip } from '@mui/material';

interface LicensesTableProps {
    items: any[];
    onUpdate: (id: string, updates: Partial<License>) => void;
    onDelete: (id: string) => void;
    onReorder: (newOrderIds: string[]) => void; // Kept for interface compatibility but not used
    onCreate: (license: { name: string; description?: string; level?: number; isActive?: boolean }) => void;
    readOnly?: boolean;
    // External add control - when provided, hides internal add button
    externalAddMode?: boolean;

    onExternalAddComplete?: () => void;
    tasks?: any[];
}

const LicenseRow = ({
    license,
    isEditing,
    onEditStart,
    onEditCancel,
    onEditSave,
    onDelete,
    taskCount
}: {
    license: any;
    isEditing: boolean;
    onEditStart: () => void;
    onEditCancel: () => void;
    onEditSave: (name: string, description: string, level: number, isActive: boolean) => void;
    onDelete: () => void;
    taskCount?: number;
}) => {
    const [name, setName] = useState(license.name);
    const [description, setDescription] = useState(license.description || '');
    const [level, setLevel] = useState(license.level || 1);
    const [isActive, setIsActive] = useState(license.isActive ?? true);

    const handleSave = () => {
        if (name.trim()) {
            onEditSave(name, description, Number(level), isActive);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            onEditCancel();
        }
    };

    React.useEffect(() => {
        if (isEditing) {
            setName(license.name);
            setDescription(license.description || '');
            setLevel(license.level || 1);
            setIsActive(license.isActive ?? true);
        }
    }, [isEditing, license]);

    return (
        <TableRow sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
            {isEditing ? (
                <>
                    <TableCell width="35%">
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                fullWidth
                                size="small"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                placeholder="License Name"
                            />
                            <TextField
                                type="number"
                                size="small"
                                value={level}
                                onChange={(e) => setLevel(Number(e.target.value))}
                                sx={{ width: 70 }}
                                placeholder="Lvl"
                            />
                        </Box>
                    </TableCell>
                    <TableCell>
                        <TextField
                            fullWidth
                            size="small"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Description"
                        />
                    </TableCell>
                    <TableCell width="10%">
                        <Checkbox
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            size="small"
                        />
                    </TableCell>
                    <TableCell align="right" width="120px">
                        <IconButton size="small" color="success" onClick={handleSave}>
                            <CheckCircle fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={onEditCancel}>
                            <CancelIcon fontSize="small" />
                        </IconButton>
                    </TableCell>
                </>
            ) : (
                <>
                    <TableCell
                        onClick={onEditStart}
                        sx={{ cursor: 'pointer', fontWeight: 500 }}
                    >
                        {license.name} <Typography component="span" variant="caption" color="text.secondary">(Lvl {license.level})</Typography>
                    </TableCell>
                    <TableCell onClick={onEditStart} sx={{ cursor: 'pointer' }}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {license.description}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        <Box
                            sx={{
                                width: 10, height: 10, borderRadius: '50%',
                                bgcolor: license.isActive ? 'success.main' : 'text.disabled'
                            }}
                        />
                    </TableCell>
                    <TableCell>
                        {typeof taskCount === 'number' && (
                            <Chip
                                label={taskCount}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                        )}
                    </TableCell>
                    <TableCell align="right" width="120px">
                        <IconButton size="small" onClick={onEditStart}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={onDelete}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </TableCell>
                </>
            )}
        </TableRow>
    );
};

export const LicensesTable: React.FC<LicensesTableProps> = ({
    items,
    onUpdate,
    onDelete,
    onReorder, // Not used - licenses are sorted by level (ascending)
    onCreate,
    readOnly = false,
    externalAddMode,
    onExternalAddComplete,
    tasks
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [internalAdding, setInternalAdding] = useState(false);

    // Use external control if provided, otherwise internal
    const isAdding = externalAddMode !== undefined ? externalAddMode : internalAdding;

    // New License State
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newLevel, setNewLevel] = useState(1);
    const [newActive, setNewActive] = useState(true);

    // Sort licenses by level in ascending order (lowest level first)
    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => (a.level || 0) - (b.level || 0));
    }, [items]);

    // Resizable columns
    const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
        tableId: 'licenses-table',
        columns: [
            { key: 'nameLevel', minWidth: 150, defaultWidth: 300 },
            { key: 'description', minWidth: 200, defaultWidth: 400 },
            { key: 'active', minWidth: 80, defaultWidth: 100 },
            { key: 'tasks', minWidth: 80, defaultWidth: 100 },
            { key: 'actions', minWidth: 100, defaultWidth: 120 },
        ],
    });

    const handleCreate = () => {
        if (newName.trim()) {
            onCreate({ name: newName, description: newDesc, level: newLevel, isActive: newActive });
            setNewName('');
            setNewDesc('');
            setNewLevel(1);
            setNewActive(true);
            if (externalAddMode !== undefined && onExternalAddComplete) {
                onExternalAddComplete();
            } else {
                setInternalAdding(false);
            }
        }
    };

    const handleCancelAdd = () => {
        setNewName('');
        setNewDesc('');
        setNewLevel(1);
        setNewActive(true);
        if (externalAddMode !== undefined && onExternalAddComplete) {
            onExternalAddComplete();
        } else {
            setInternalAdding(false);
        }
    };

    return (
        <React.Fragment>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                    Manage available product licenses. Sorted by level (lowest first).
                </Typography>
                {/* Only show internal add button when not using external control */}
                {!readOnly && externalAddMode === undefined && (
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => setInternalAdding(true)}
                        disabled={isAdding}
                        size="small"
                    >
                        Add License
                    </Button>
                )}
            </Box>

            <Table size="small">
                <TableHead>
                    <TableRow>
                        <ResizableTableCell
                            width={columnWidths['nameLevel']}
                            resizable
                            resizeHandleProps={getResizeHandleProps('nameLevel')}
                            isResizing={isResizing}
                        >
                            Name/Level
                        </ResizableTableCell>
                        <ResizableTableCell
                            width={columnWidths['description']}
                            resizable
                            resizeHandleProps={getResizeHandleProps('description')}
                            isResizing={isResizing}
                        >
                            Description
                        </ResizableTableCell>
                        <ResizableTableCell
                            width={columnWidths['active']}
                            resizable
                            resizeHandleProps={getResizeHandleProps('active')}
                            isResizing={isResizing}
                        >
                            Active
                        </ResizableTableCell>
                        <ResizableTableCell
                            width={columnWidths['tasks']}
                            resizable
                            resizeHandleProps={getResizeHandleProps('tasks')}
                            isResizing={isResizing}
                        >
                            Tasks
                        </ResizableTableCell>
                        <ResizableTableCell
                            width={columnWidths['actions']}
                            align="right"
                            resizable
                            resizeHandleProps={getResizeHandleProps('actions')}
                            isResizing={isResizing}
                        >
                            Actions
                        </ResizableTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {isAdding && (
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="License Name"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreate();
                                            if (e.key === 'Escape') handleCancelAdd();
                                        }}
                                    />
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={newLevel}
                                        onChange={(e) => setNewLevel(Number(e.target.value))}
                                        sx={{ width: 70 }}
                                        placeholder="Lvl"
                                    />
                                </Box>
                            </TableCell>
                            <TableCell>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Description"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreate();
                                    }}
                                />
                            </TableCell>
                            <TableCell>
                                <Checkbox
                                    checked={newActive}
                                    onChange={(e) => setNewActive(e.target.checked)}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell />
                            <TableCell align="right">
                                <IconButton size="small" color="success" onClick={handleCreate}>
                                    <CheckCircle fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={handleCancelAdd}>
                                    <CancelIcon fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    )}

                    {sortedItems.map((license) => {
                        const id = license.id || license._tempId;
                        // Cumulative: count tasks from same or lower license levels
                        const currentLevel = license.level || 0;
                        const taskCount = tasks ? tasks.filter(t => t.license && (t.license.level || 0) <= currentLevel).length : undefined;
                        return (
                            <LicenseRow
                                key={id}
                                license={license}
                                isEditing={editingId === id}
                                onEditStart={() => !readOnly && setEditingId(id)}
                                onEditCancel={() => setEditingId(null)}
                                onEditSave={(name, description, level, isActive) => {
                                    onUpdate(id, { name, description, level, isActive });
                                    setEditingId(null);
                                }}
                                onDelete={() => onDelete(id)}
                                taskCount={taskCount}
                            />
                        );
                    })}

                    {items.length === 0 && !isAdding && (
                        <TableRow>
                            <TableCell colSpan={5} align="center">
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                    No licenses defined.
                                </Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </React.Fragment>
    );
};
