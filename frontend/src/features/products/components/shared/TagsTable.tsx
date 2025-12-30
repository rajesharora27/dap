
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
import { ProductTag } from '@features/products/types';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';
import { SortableHandle } from '@shared/components/SortableHandle';

interface TagsTableProps {
    items: any[];
    onUpdate: (id: string, updates: Partial<ProductTag>) => void;
    onDelete: (id: string) => void;
    onReorder: (newOrderIds: string[]) => void;
    onCreate: (tag: { name: string; color: string; description?: string }) => void;
    readOnly?: boolean;
    // External add control - when provided, hides internal add button
    externalAddMode?: boolean;
    onExternalAddComplete?: () => void;
}

const SortableTagRow = ({
    tag,
    index,
    isEditing,
    onEditStart,
    onEditCancel,
    onEditSave,
    onDelete
}: {
    tag: any;
    index: number;
    isEditing: boolean;
    onEditStart: () => void;
    onEditCancel: () => void;
    onEditSave: (name: string, color: string, description: string) => void;
    onDelete: () => void;
}) => {
    const id = tag.id || tag._tempId;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const [name, setName] = useState(tag.name);
    const [color, setColor] = useState(tag.color);
    const [description, setDescription] = useState(tag.description || '');

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? alpha('#000', 0.05) : undefined,
        zIndex: isDragging ? 1 : undefined,
    };

    const handleSave = () => {
        if (name.trim()) {
            onEditSave(name, color, description);
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
            setName(tag.name);
            setColor(tag.color);
            setDescription(tag.description || '');
        }
    }, [isEditing, tag]);

    return (
        <TableRow ref={setNodeRef} style={style} sx={{ '&:hover .drag-handle': { opacity: 1 } }}>
            <TableCell width="40px" sx={{ textAlign: 'center' }}>
                <SortableHandle
                    index={index}
                    attributes={attributes}
                    listeners={listeners}
                />
            </TableCell>

            {isEditing ? (
                <>
                    <TableCell width="200px">
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    padding: 0,
                                    border: 'none',
                                    borderRadius: 4,
                                    cursor: 'pointer'
                                }}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                placeholder="Tag Name"
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
                    <TableCell onClick={onEditStart} sx={{ cursor: 'pointer', fontWeight: 500 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    backgroundColor: tag.color,
                                    flexShrink: 0
                                }}
                            />
                            {tag.name}
                        </Box>
                    </TableCell>
                    <TableCell onClick={onEditStart} sx={{ cursor: 'pointer' }}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {tag.description}
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

export const TagsTable: React.FC<TagsTableProps> = ({
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
    const setIsAdding = externalAddMode !== undefined
        ? (val: boolean) => { if (!val && onExternalAddComplete) onExternalAddComplete(); }
        : setInternalAdding;

    // Internal state for immediate DnD visual feedback
    const [localItems, setLocalItems] = useState(items);

    // Sync internal state when props change (e.g., after Apollo refetch)
    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    // New Tag State
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#1976d2');
    const [newDesc, setNewDesc] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Resizable columns
    const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
        tableId: 'tags-table',
        columns: [
            { key: 'drag', minWidth: 40, defaultWidth: 40 },
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
            onCreate({ name: newName, color: newColor, description: newDesc });
            setNewName('');
            setNewDesc('');
            setNewColor('#1976d2');
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
        setNewColor('#1976d2');
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
                    Tags help categorize tasks and deliverables.
                </Typography>
                {/* Only show internal add button when not using external control */}
                {!readOnly && externalAddMode === undefined && (
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => setIsAdding(true)}
                        disabled={isAdding}
                        size="small"
                    >
                        Add Tag
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
                        {isAdding && (
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell />
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <input
                                            type="color"
                                            value={newColor}
                                            onChange={(e) => setNewColor(e.target.value)}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                padding: 0,
                                                border: 'none',
                                                borderRadius: 4,
                                                cursor: 'pointer'
                                            }}
                                        />
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

                        <SortableContext
                            items={localItems.map((i) => i.id || i._tempId)}
                            strategy={verticalListSortingStrategy}
                        >
                            {localItems.map((tag, index) => {
                                const id = tag.id || tag._tempId;
                                return (
                                    <SortableTagRow
                                        key={id}
                                        tag={tag}
                                        index={index}
                                        isEditing={editingId === id}
                                        onEditStart={() => !readOnly && setEditingId(id)}
                                        onEditCancel={() => setEditingId(null)}
                                        onEditSave={(name, color, description) => {
                                            onUpdate(id, { name, color, description });
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
                                        No tags defined.
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
