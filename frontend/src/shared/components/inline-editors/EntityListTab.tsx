import React, { useState } from 'react';
import { Box, Typography, IconButton, List, Tooltip } from '@mui/material';
import { Add as AddIcon } from '@shared/components/FAIcon';

// Generic entity list tab for Outcomes, Releases, Licenses, Tags
interface EntityListTabProps<T> {
    items: T[];
    description: string;
    loading?: boolean;
    getId: (item: T, index: number) => string;
    renderEditor: (props: {
        item: T;
        index: number;
        isEditing: boolean;
        onStartEdit: () => void;
        onSave: (data: any) => void;
        onCancel: () => void;
        onDelete: () => void;
    }) => React.ReactNode;
    renderAddForm: (props: { onSave: (data: any) => void; onCancel: () => void }) => React.ReactNode;
    onSave: (id: string, data: any) => Promise<void>;
    onCreate: (data: any) => Promise<void>;
    onDelete: (id: string, name: string) => Promise<void>;
    emptyMessage?: string;
}

export function EntityListTab<T extends { id?: string; name?: string }>({
    items,
    description,
    loading = false,
    getId,
    renderEditor,
    renderAddForm,
    onSave,
    onCreate,
    onDelete,
    emptyMessage = 'No items added yet. Click the + button to add one.',
}: EntityListTabProps<T>) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [adding, setAdding] = useState(false);

    const handleSave = async (data: any, index: number) => {
        const item = items[index];
        if (item?.id) {
            await onSave(item.id, data);
        }
        setEditingIndex(null);
    };

    const handleCreate = async (data: any) => {
        await onCreate(data);
        setAdding(false);
    };

    const handleDelete = async (index: number) => {
        const item = items[index];
        if (item?.id && confirm(`Delete "${item.name}"?`)) {
            await onDelete(item.id, item.name || '');
        }
    };

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">{description}</Typography>
                <Tooltip title="Add">
                    <IconButton color="primary" onClick={() => setAdding(true)} size="small" disabled={adding || loading}>
                        <AddIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {items.length > 0 && (
                <List dense>
                    {items.map((item, index) =>
                        renderEditor({
                            item,
                            index,
                            isEditing: editingIndex === index,
                            onStartEdit: () => setEditingIndex(index),
                            onSave: (data) => handleSave(data, index),
                            onCancel: () => setEditingIndex(null),
                            onDelete: () => handleDelete(index),
                        })
                    )}
                </List>
            )}

            {adding && renderAddForm({ onSave: handleCreate, onCancel: () => setAdding(false) })}

            {!adding && items.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    {emptyMessage}
                </Typography>
            )}
        </>
    );
}
