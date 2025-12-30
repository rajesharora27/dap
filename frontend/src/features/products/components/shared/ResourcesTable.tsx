
import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableRow, IconButton,
    TextField, Tooltip, Box, Typography, Button, Link
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
    CheckCircle, Cancel as CancelIcon, Add as AddIcon, OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { Resource } from '@shared/types';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';
import { SortableHandle } from '@shared/components/SortableHandle';

interface ResourcesTableProps {
    items: Resource[];
    onUpdate: (index: number, updates: { label?: string; url?: string }) => void;
    onDelete: (index: number) => void;
    onReorder: (newOrderIndexes: number[]) => void;
    onCreate: (resource: { label: string; url: string }) => void;
    readOnly?: boolean;
    externalAddMode?: boolean;
    onExternalAddComplete?: () => void;
}

const SortableResourceRow = ({
    resource,
    index,
    isEditing,
    readOnly,
    onEditStart,
    onEditCancel,
    onEditSave,
    onDelete
}: {
    resource: Resource;
    index: number;
    isEditing: boolean;
    readOnly?: boolean;
    onEditStart: () => void;
    onEditCancel: () => void;
    onEditSave: (label: string, url: string) => void;
    onDelete: () => void;
}) => {
    const id = `resource-${index}`;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, disabled: readOnly });

    const [label, setLabel] = useState(resource.label);
    const [url, setUrl] = useState(resource.url);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? alpha('#000', 0.05) : undefined,
        zIndex: isDragging ? 1 : undefined,
    };

    const handleSave = () => {
        if (label.trim() && url.trim()) {
            onEditSave(label, url);
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

    // Reset state when editing starts or resource changes
    React.useEffect(() => {
        if (isEditing) {
            setLabel(resource.label);
            setUrl(resource.url);
        }
    }, [isEditing, resource]);

    return (
        <TableRow ref={setNodeRef} style={style} sx={{ '&:hover .drag-handle': { opacity: 1 } }}>
            {!readOnly && (
                <TableCell width="40px" sx={{ textAlign: 'center' }}>
                    <SortableHandle
                        index={index}
                        attributes={attributes}
                        listeners={listeners}
                    />
                </TableCell>
            )}

            {isEditing ? (
                <>
                    <TableCell>
                        <TextField
                            fullWidth
                            size="small"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            placeholder="Resource Name"
                        />
                    </TableCell>
                    <TableCell>
                        <TextField
                            fullWidth
                            size="small"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="https://..."
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
                        onClick={() => !readOnly && onEditStart()}
                        sx={{ cursor: readOnly ? 'default' : 'pointer', fontWeight: 500 }}
                    >
                        {resource.label}
                    </TableCell>
                    <TableCell onClick={() => !readOnly && onEditStart()} sx={{ cursor: readOnly ? 'default' : 'pointer' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Link
                                href={resource.url}
                                target="_blank"
                                rel="noopener"
                                sx={{ fontSize: '0.875rem' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {resource.url.length > 50 ? resource.url.slice(0, 50) + '...' : resource.url}
                            </Link>
                            <IconButton
                                size="small"
                                href={resource.url}
                                target="_blank"
                                rel="noopener"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <OpenInNewIcon fontSize="inherit" />
                            </IconButton>
                        </Box>
                    </TableCell>
                    <TableCell align="right" width="120px">
                        {!readOnly && (
                            <>
                                <IconButton size="small" onClick={onEditStart}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={onDelete}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </>
                        )}
                    </TableCell>
                </>
            )}
        </TableRow>
    );
};

export const ResourcesTable: React.FC<ResourcesTableProps> = ({
    items,
    onUpdate,
    onDelete,
    onReorder,
    onCreate,
    readOnly = false,
    externalAddMode,
    onExternalAddComplete
}) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [internalAdding, setInternalAdding] = useState(false);

    // Use external control if provided, otherwise internal
    const isAdding = externalAddMode !== undefined ? externalAddMode : internalAdding;

    // Internal state for immediate DnD visual feedback
    const [localItems, setLocalItems] = useState(items);

    // Sync internal state when props change (e.g., after Apollo refetch)
    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    // New Resource State
    const [newLabel, setNewLabel] = useState('');
    const [newUrl, setNewUrl] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Resizable columns
    const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
        tableId: 'resources-table',
        columns: [
            { key: 'drag', minWidth: 40, defaultWidth: 40 },
            { key: 'name', minWidth: 150, defaultWidth: 300 },
            { key: 'url', minWidth: 200, defaultWidth: 400 },
            { key: 'actions', minWidth: 100, defaultWidth: 120 },
        ],
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = parseInt(String(active.id).replace('resource-', ''));
            const newIndex = parseInt(String(over.id).replace('resource-', ''));

            // Update local state IMMEDIATELY for visual feedback
            const newLocalItems = arrayMove(localItems, oldIndex, newIndex);
            setLocalItems(newLocalItems);

            // Then call the handler (which triggers async mutation)
            // Pass the new order as indexes mapping to original positions
            const newOrderIndexes = newLocalItems.map((_, i) => {
                const origIndex = items.findIndex(item =>
                    item.label === newLocalItems[i].label && item.url === newLocalItems[i].url
                );
                return origIndex >= 0 ? origIndex : i;
            });
            onReorder(newOrderIndexes);
        }
    };

    const handleCreate = () => {
        if (newLabel.trim() && newUrl.trim()) {
            onCreate({ label: newLabel.trim(), url: newUrl.trim() });
            setNewLabel('');
            setNewUrl('');
            if (externalAddMode !== undefined && onExternalAddComplete) {
                onExternalAddComplete();
            } else {
                setInternalAdding(false);
            }
        }
    };

    const handleCancelAdd = () => {
        setNewLabel('');
        setNewUrl('');
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
                    Add helpful links like User Guides, Documentation, or Video Demos.
                </Typography>
                {/* Only show internal add button when not using external control */}
                {!readOnly && externalAddMode === undefined && (
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => setInternalAdding(true)}
                        disabled={isAdding}
                        size="small"
                    >
                        Add Resource
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
                            {!readOnly && (
                                <ResizableTableCell
                                    width={columnWidths['drag']}
                                    resizable
                                    resizeHandleProps={getResizeHandleProps('drag')}
                                    isResizing={isResizing}
                                />
                            )}
                            <ResizableTableCell
                                width={columnWidths['name']}
                                resizable
                                resizeHandleProps={getResizeHandleProps('name')}
                                isResizing={isResizing}
                            >
                                Resource Name
                            </ResizableTableCell>
                            <ResizableTableCell
                                width={columnWidths['url']}
                                resizable
                                resizeHandleProps={getResizeHandleProps('url')}
                                isResizing={isResizing}
                            >
                                URL
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
                                {!readOnly && <TableCell />}
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="e.g. User Guide"
                                        value={newLabel}
                                        onChange={(e) => setNewLabel(e.target.value)}
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
                                        placeholder="https://..."
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreate();
                                            if (e.key === 'Escape') handleCancelAdd();
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
                            items={localItems.map((_, i) => `resource-${i}`)}
                            strategy={verticalListSortingStrategy}
                        >
                            {localItems.map((resource, index) => (
                                <SortableResourceRow
                                    key={`resource-${index}`}
                                    resource={resource}
                                    index={index}
                                    isEditing={editingIndex === index}
                                    readOnly={readOnly}
                                    onEditStart={() => setEditingIndex(index)}
                                    onEditCancel={() => setEditingIndex(null)}
                                    onEditSave={(label, url) => {
                                        onUpdate(index, { label, url });
                                        setEditingIndex(null);
                                    }}
                                    onDelete={() => onDelete(index)}
                                />
                            ))}
                        </SortableContext>

                        {localItems.length === 0 && !isAdding && (
                            <TableRow>
                                <TableCell colSpan={readOnly ? 3 : 4} align="center">
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                        No resources defined.
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
