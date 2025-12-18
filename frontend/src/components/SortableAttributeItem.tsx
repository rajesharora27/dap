
import React from 'react';
import {
    ListItemButton,
    ListItemText,
    IconButton,
    Box,
    Typography
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    DragIndicator
} from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableAttributeItem({ attrKey, value, onEdit, onDelete, onDoubleClick }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: attrKey });

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
                    backgroundColor: '#f5f5f5'
                },
                bgcolor: isDragging ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
            }}
            onDoubleClick={onDoubleClick}
        >
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    pr: 1,
                    cursor: 'grab',
                    color: 'text.secondary',
                    opacity: 0.7,
                    touchAction: 'none',
                    '&:hover': { opacity: 1, color: 'text.primary' }
                }}
            >
                <DragIndicator fontSize="small" />
            </Box>

            <ListItemText
                primary={<Typography variant="subtitle2" fontWeight="bold">{attrKey}</Typography>}
                secondary={typeof value === 'object' ? JSON.stringify(value) : String(value)}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
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
