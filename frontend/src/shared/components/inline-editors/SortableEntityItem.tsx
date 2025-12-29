import React from 'react';
import {
    ListItemButton,
    ListItemText,
    IconButton,
    Box,
    Typography,
    TextField,
    Button,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    DragIndicator,
} from '@shared/components/FAIcon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface SortableEntityItemProps {
    id: string;
    primary: string;
    secondary?: React.ReactNode;
    badge?: React.ReactNode;
    onEdit: () => void;
    onDelete: () => void;
    isNew?: boolean;
    disabled?: boolean;
}

export function SortableEntityItem({
    id,
    primary,
    secondary,
    badge,
    onEdit,
    onDelete,
    isNew,
    disabled,
}: SortableEntityItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <ListItemButton
            ref={setNodeRef}
            style={style}
            sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                    backgroundColor: '#f5f5f5',
                },
                bgcolor: isDragging ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
            }}
            onClick={onEdit}
        >
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    pr: 1,
                    cursor: disabled ? 'default' : 'grab',
                    color: 'text.secondary',
                    opacity: disabled ? 0.3 : 0.7,
                    touchAction: 'none',
                    '&:hover': { opacity: disabled ? 0.3 : 1, color: 'text.primary' },
                }}
            >
                <DragIndicator fontSize="small" />
            </Box>

            <ListItemText
                primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: isNew ? 'bold' : 'normal' }}
                        >
                            {primary}
                        </Typography>
                        {badge}
                    </Box>
                }
                secondary={secondary}
            />

            <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                >
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>
        </ListItemButton>
    );
}

// Inline form wrapper for editing entities
export interface InlineFormProps {
    children: React.ReactNode;
    onSave: () => void;
    onCancel: () => void;
    saveDisabled?: boolean;
    saveLabel?: string;
}

export function InlineForm({
    children,
    onSave,
    onCancel,
    saveDisabled,
    saveLabel = 'Save',
}: InlineFormProps) {
    return (
        <Box
            sx={{
                border: '1px solid #1976d2',
                borderRadius: 1,
                mb: 1,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                bgcolor: 'rgba(25, 118, 210, 0.04)',
            }}
        >
            {children}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                <Button size="small" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    size="small"
                    variant="contained"
                    onClick={onSave}
                    disabled={saveDisabled}
                >
                    {saveLabel}
                </Button>
            </Box>
        </Box>
    );
}
