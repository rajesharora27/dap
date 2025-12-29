import React, { useState, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableRow, IconButton,
    TextField, Box, Typography, Button
} from '@mui/material';
import {
    Edit as EditIcon, Delete as DeleteIcon,
    CheckCircle, Cancel as CancelIcon, Add as AddIcon
} from '@mui/icons-material';
import { Release } from '@features/product-releases';

interface ReleasesTableProps {
    items: any[];
    onUpdate: (id: string, updates: Partial<Release>) => void;
    onDelete: (id: string) => void;
    onReorder: (newOrderIds: string[]) => void; // Kept for interface compatibility but not used
    onCreate: (release: { name: string; description?: string; level?: number }) => void;
    readOnly?: boolean;
    // External add control - when provided, hides internal add button
    externalAddMode?: boolean;
    onExternalAddComplete?: () => void;
}

const ReleaseRow = ({
    release,
    isEditing,
    onEditStart,
    onEditCancel,
    onEditSave,
    onDelete
}: {
    release: any;
    isEditing: boolean;
    onEditStart: () => void;
    onEditCancel: () => void;
    onEditSave: (name: string, description: string, level: number) => void;
    onDelete: () => void;
}) => {
    const [name, setName] = useState(release.name);
    const [description, setDescription] = useState(release.description || '');
    const [level, setLevel] = useState(release.level || 1);

    const handleSave = () => {
        if (name.trim()) {
            onEditSave(name, description, Number(level));
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
            setName(release.name);
            setDescription(release.description || '');
            setLevel(release.level || 1);
        }
    }, [isEditing, release]);

    return (
        <TableRow sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
            {isEditing ? (
                <>
                    <TableCell width="30%">
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                placeholder="Version Name"
                            />
                            <TextField
                                type="number"
                                size="small"
                                value={level}
                                onChange={(e) => setLevel(Number(e.target.value))}
                                sx={{ width: 80 }}
                                placeholder="Level"
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
                        {release.name} <Typography component="span" variant="caption" color="text.secondary">(Lvl {release.level})</Typography>
                    </TableCell>
                    <TableCell onClick={onEditStart} sx={{ cursor: 'pointer' }}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {release.description}
                        </Typography>
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

export const ReleasesTable: React.FC<ReleasesTableProps> = ({
    items,
    onUpdate,
    onDelete,
    onReorder, // Not used - releases are sorted by level (descending)
    onCreate,
    readOnly = false,
    externalAddMode,
    onExternalAddComplete
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [internalAdding, setInternalAdding] = useState(false);
    
    // Use external control if provided, otherwise internal
    const isAdding = externalAddMode !== undefined ? externalAddMode : internalAdding;

    // New Release State
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newLevel, setNewLevel] = useState(1);

    // Sort releases by level in descending order (highest level first)
    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => (b.level || 0) - (a.level || 0));
    }, [items]);

    const handleCreate = () => {
        if (newName.trim()) {
            onCreate({ name: newName, description: newDesc, level: newLevel });
            setNewName('');
            setNewDesc('');
            setNewLevel(1);
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
                    Manage product releases/versions. Sorted by level (highest first).
                </Typography>
                {/* Only show internal add button when not using external control */}
                {!readOnly && externalAddMode === undefined && (
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => setInternalAdding(true)}
                        disabled={isAdding}
                        size="small"
                    >
                        Add Release
                    </Button>
                )}
            </Box>

            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell width="30%">Name/Level</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right" width="120px">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {isAdding && (
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Version Name"
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
                                        sx={{ width: 80 }}
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

                    {sortedItems.map((release) => {
                        const id = release.id || release._tempId;
                        return (
                            <ReleaseRow
                                key={id}
                                release={release}
                                isEditing={editingId === id}
                                onEditStart={() => !readOnly && setEditingId(id)}
                                onEditCancel={() => setEditingId(null)}
                                onEditSave={(name, description, level) => {
                                    onUpdate(id, { name, description, level });
                                    setEditingId(null);
                                }}
                                onDelete={() => onDelete(id)}
                            />
                        );
                    })}

                    {items.length === 0 && !isAdding && (
                        <TableRow>
                            <TableCell colSpan={3} align="center">
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                    No releases defined.
                                </Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </React.Fragment>
    );
};
