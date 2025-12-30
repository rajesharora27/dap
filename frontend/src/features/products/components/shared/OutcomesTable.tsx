
import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableRow, IconButton,
    TextField, Tooltip, Box, Typography, Button
} from '@mui/material';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor,
    useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates,
    verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { alpha } from '@mui/material/styles';
import {
    Edit as EditIcon, Delete as DeleteIcon, DragIndicator,
    CheckCircle, Cancel as CancelIcon, Add as AddIcon
} from '@mui/icons-material';
import { Outcome } from '@features/product-outcomes';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';

interface OutcomesTableProps {
    items: any[];
    onUpdate: (id: string, updates: Partial<Outcome>) => void;
    onDelete: (id: string) => void;
    onReorder: (newOrderIds: string[]) => void;
    onCreate: (outcome: { name: string; description?: string }) => void;
    readOnly?: boolean;
    // External add control - when provided, hides internal add button
    externalAddMode?: boolean;
    onExternalAddComplete?: () => void;
}

const SortableOutcomeRow = ({
    outcome,
    isEditing,
    onEditStart,
    onEditCancel,
    onEditSave,
    onDelete
}: {
    outcome: any;
    isEditing: boolean;
    onEditStart: () => void;
    onEditCancel: () => void;
    onEditSave: (name: string, description: string) => void;
    onDelete: () => void;
}) => {
    const id = outcome.id || outcome._tempId;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const [name, setName] = useState(outcome.name);
    const [description, setDescription] = useState(outcome.description || '');

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? alpha('#000', 0.05) : undefined,
        zIndex: isDragging ? 1 : undefined,
    };

    const handleSave = () => {
        if (name.trim()) {
            onEditSave(name, description);
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

    // Reset state when editing starts or outcome changes
    React.useEffect(() => {
        if (isEditing) {
            setName(outcome.name);
            setDescription(outcome.description || '');
        }
    }, [isEditing, outcome]);

    return (
        <TableRow ref={setNodeRef} style={style} sx={{ '&:hover .drag-handle': { opacity: 1 } }}>
            <TableCell width="50px">
                <IconButton
                    size="small"
                    className="drag-handle"
                    sx={{ opacity: 0.3, cursor: 'grab' }}
                    {...attributes}
                    {...listeners}
                >
                    <DragIndicator fontSize="small" />
                </IconButton>
            </TableCell>

            {isEditing ? (
                <>
                    <TableCell>
                        <TextField
                            fullWidth
                            size="small"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            placeholder="Outcome Name"
                        />
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
                        {outcome.name}
                    </TableCell>
                    <TableCell onClick={onEditStart} sx={{ cursor: 'pointer' }}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {outcome.description}
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

export const OutcomesTable: React.FC<OutcomesTableProps> = ({
    items,
    onUpdate,
    onDelete,
    onReorder,
    onCreate,
    readOnly = false,
    externalAddMode,
    onExternalAddComplete
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [internalAdding, setInternalAdding] = useState(false);

    // Use external control if provided, otherwise internal
    const isAdding = externalAddMode !== undefined ? externalAddMode : internalAdding;

    // Internal state for immediate DnD visual feedback
    const [localItems, setLocalItems] = useState(items);

    // Sync internal state when props change (e.g., after Apollo refetch)
    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    // New Outcome State
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Resizable columns
    const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
        tableId: 'outcomes-table',
        columns: [
            { key: 'drag', minWidth: 50, defaultWidth: 50 },
            { key: 'name', minWidth: 150, defaultWidth: 300 },
            { key: 'description', minWidth: 200, defaultWidth: 400 },
            { key: 'actions', minWidth: 100, defaultWidth: 120 },
        ],
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = localItems.findIndex((item) => (item.id || item._tempId) === active.id);
            const newIndex = localItems.findIndex((item) => (item.id || item._tempId) === over.id);

            // Update local state IMMEDIATELY for visual feedback
            const newLocalItems = arrayMove(localItems, oldIndex, newIndex);
            setLocalItems(newLocalItems);

            // Then call the handler (which triggers async mutation)
            const newOrder = newLocalItems.map(i => i.id || i._tempId);
            onReorder(newOrder);
        }
    };

    const handleCreate = () => {
        if (newName.trim()) {
            onCreate({ name: newName, description: newDesc });
            setNewName('');
            setNewDesc('');
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
                    Outcomes define the value a customer gets from this product.
                </Typography>
                {/* Only show internal add button when not using external control */}
                {!readOnly && externalAddMode === undefined && (
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => setInternalAdding(true)}
                        disabled={isAdding}
                        size="small"
                    >
                        Add Outcome
                    </Button>
                )}
            </Box>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <ResizableTableCell
                                width={columnWidths['drag']}
                                resizable
                                resizeHandleProps={getResizeHandleProps('drag')}
                                isResizing={isResizing}
                            />
                            <ResizableTableCell
                                width={columnWidths['name']}
                                resizable
                                resizeHandleProps={getResizeHandleProps('name')}
                                isResizing={isResizing}
                            >
                                Name
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
                        {/* Add Row */}
                        {isAdding && (
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell />
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Name"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreate();
                                            if (e.key === 'Escape') handleCancelAdd();
                                        }}
                                    />
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

                        <SortableContext
                            items={localItems.map((i) => i.id || i._tempId)}
                            strategy={verticalListSortingStrategy}
                        >
                            {localItems.map((outcome) => {
                                const id = outcome.id || outcome._tempId;
                                return (
                                    <SortableOutcomeRow
                                        key={id}
                                        outcome={outcome}
                                        isEditing={editingId === id}
                                        onEditStart={() => !readOnly && setEditingId(id)}
                                        onEditCancel={() => setEditingId(null)}
                                        onEditSave={(name, description) => {
                                            onUpdate(id, { name, description });
                                            setEditingId(null);
                                        }}
                                        onDelete={() => onDelete(id)}
                                    />
                                );
                            })}
                        </SortableContext>

                        {localItems.length === 0 && !isAdding && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                        No outcomes defined.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </DndContext>
        </React.Fragment>
    );
};
