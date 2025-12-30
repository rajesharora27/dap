
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
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';
import { SortableHandle } from '@shared/components/SortableHandle';

export interface AttributeItem {
    key: string;
    value: any;
}

interface AttributesTableProps {
    items: AttributeItem[];
    onUpdate: (oldKey: string, newKey: string, newValue: any) => void;
    onDelete: (key: string) => void;
    onReorder: (newKeys: string[]) => void;
    onCreate: (key: string, value: any) => void;
    readOnly?: boolean;
    // External add control - when provided, hides internal add button
    externalAddMode?: boolean;
    onExternalAddComplete?: () => void;
}

const SortableAttributeRow = ({
    attrKey,
    value,
    index,
    isEditing,
    onEditStart,
    onEditCancel,
    onEditSave,
    onDelete
}: {
    attrKey: string;
    value: any;
    index: number;
    isEditing: boolean;
    onEditStart: () => void;
    onEditCancel: () => void;
    onEditSave: (newKey: string, newValue: any) => void;
    onDelete: () => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: attrKey });

    const [editKey, setEditKey] = useState(attrKey);
    const [editValue, setEditValue] = useState(typeof value === 'object' ? JSON.stringify(value) : String(value));

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? alpha('#000', 0.05) : undefined,
        zIndex: isDragging ? 1 : undefined,
    };

    const handleSave = () => {
        if (editKey.trim()) {
            // Basic parsing logic
            let parsed = editValue;
            // Try to parse number or boolean or json if complex
            if (editValue === 'true') parsed = true as any;
            else if (editValue === 'false') parsed = false as any;
            else if (!isNaN(Number(editValue)) && editValue.trim() !== '') parsed = Number(editValue) as any;
            else {
                try { parsed = JSON.parse(editValue); } catch { }
            }
            onEditSave(editKey, parsed);
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
            setEditKey(attrKey);
            setEditValue(typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
    }, [isEditing, attrKey, value]);

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
                    <TableCell width="30%">
                        <TextField
                            fullWidth
                            size="small"
                            value={editKey}
                            onChange={(e) => setEditKey(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            placeholder="Key"
                        />
                    </TableCell>
                    <TableCell>
                        <TextField
                            fullWidth
                            size="small"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Value"
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
                        {attrKey}
                    </TableCell>
                    <TableCell onClick={onEditStart} sx={{ cursor: 'pointer' }}>
                        <Tooltip title={typeof value === 'object' ? JSON.stringify(value) : String(value)} placement="top">
                            <Typography variant="body2" color="text.secondary" noWrap>
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </Typography>
                        </Tooltip>
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

export const AttributesTable: React.FC<AttributesTableProps> = ({
    items,
    onUpdate,
    onDelete,
    onReorder,
    onCreate,
    readOnly = false,
    externalAddMode,
    onExternalAddComplete
}) => {
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [internalAdding, setInternalAdding] = useState(false);

    // Use external control if provided, otherwise internal
    const isAdding = externalAddMode !== undefined ? externalAddMode : internalAdding;

    // Internal state for immediate DnD visual feedback
    const [localItems, setLocalItems] = useState(items);

    // Sync internal state when props change (e.g., after Apollo refetch)
    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    // New Attribute State
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Resizable columns
    const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
        tableId: 'attributes-table',
        columns: [
            { key: 'drag', minWidth: 40, defaultWidth: 40 },
            { key: 'key', minWidth: 100, defaultWidth: 300 },
            { key: 'value', minWidth: 200, defaultWidth: 400 },
            { key: 'actions', minWidth: 100, defaultWidth: 120 },
        ],
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = localItems.findIndex((item) => item.key === active.id);
            const newIndex = localItems.findIndex((item) => item.key === over.id);

            // Update local state IMMEDIATELY for visual feedback
            const newLocalItems = arrayMove(localItems, oldIndex, newIndex);
            setLocalItems(newLocalItems);

            // Then call the handler (which triggers async mutation)
            const newKeys = newLocalItems.map(i => i.key);
            onReorder(newKeys);
        }
    };

    const handleCreate = () => {
        if (newKey.trim()) {
            let parsed = newValue;
            if (newValue === 'true') parsed = true as any;
            else if (newValue === 'false') parsed = false as any;
            else if (!isNaN(Number(newValue)) && newValue.trim() !== '') parsed = Number(newValue) as any;
            else {
                try { parsed = JSON.parse(newValue); } catch { }
            }

            onCreate(newKey, parsed);
            setNewKey('');
            setNewValue('');
            if (externalAddMode !== undefined && onExternalAddComplete) {
                onExternalAddComplete();
            } else {
                setInternalAdding(false);
            }
        }
    };

    const handleCancelAdd = () => {
        setNewKey('');
        setNewValue('');
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
                    Custom Attributes allow you to extend the product data model.
                </Typography>
                {/* Only show internal add button when not using external control */}
                {!readOnly && externalAddMode === undefined && (
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => setInternalAdding(true)}
                        disabled={isAdding}
                        size="small"
                    >
                        Add Attribute
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
                                width={columnWidths['key']}
                                resizable
                                resizeHandleProps={getResizeHandleProps('key')}
                                isResizing={isResizing}
                            >
                                Key
                            </ResizableTableCell>
                            <ResizableTableCell
                                width={columnWidths['value']}
                                resizable
                                resizeHandleProps={getResizeHandleProps('value')}
                                isResizing={isResizing}
                            >
                                Value
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
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Key"
                                        value={newKey}
                                        onChange={(e) => setNewKey(e.target.value)}
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
                                        placeholder="Value"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
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
                            items={localItems.map((i) => i.key)}
                            strategy={verticalListSortingStrategy}
                        >
                            {localItems.map((attr, index) => (
                                <SortableAttributeRow
                                    key={attr.key}
                                    attrKey={attr.key}
                                    value={attr.value}
                                    index={index}
                                    isEditing={editingKey === attr.key}
                                    onEditStart={() => !readOnly && setEditingKey(attr.key)}
                                    onEditCancel={() => setEditingKey(null)}
                                    onEditSave={(newKey, newValue) => {
                                        onUpdate(attr.key, newKey, newValue);
                                        setEditingKey(null);
                                    }}
                                    onDelete={() => onDelete(attr.key)}
                                />
                            ))}
                        </SortableContext>

                        {localItems.length === 0 && !isAdding && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                        No attributes defined.
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
