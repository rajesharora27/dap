import React, { useState, useEffect } from 'react';
import { Typography, TextField, Box, IconButton, Tooltip } from '@mui/material';
import { Edit, Check, Close } from './FAIcon';
import { useTheme, alpha } from '@mui/material/styles';

interface InlineEditableTextProps {
    value: string;
    onSave: (newValue: string) => Promise<void> | void;
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2';
    multiline?: boolean;
    placeholder?: string;
    disabled?: boolean;
    color?: string;
    fullWidth?: boolean;
}

export const InlineEditableText: React.FC<InlineEditableTextProps> = ({
    value,
    onSave,
    variant = 'body1',
    multiline = false,
    placeholder = 'Click to edit...',
    disabled = false,
    color,
    fullWidth = false
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    const handleSave = async () => {
        if (editValue === value) {
            setIsEditing(false);
            return;
        }

        try {
            setLoading(true);
            await onSave(editValue);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save:', error);
            // Optionally handle error state
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleCancel();
        } else if (e.key === 'Enter' && !multiline && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
    };

    if (isEditing) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: fullWidth ? '100%' : 'auto' }}>
                <TextField
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    multiline={multiline}
                    minRows={multiline ? 3 : 1}
                    autoFocus
                    variant="outlined"
                    size="small"
                    fullWidth={fullWidth}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    sx={{
                        flexGrow: 1,
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: theme.palette.background.paper
                        }
                    }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <IconButton size="small" onClick={handleSave} color="primary" disabled={loading}>
                        <Check fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={handleCancel} color="error" disabled={loading}>
                        <Close fontSize="small" />
                    </IconButton>
                </Box>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                position: 'relative',
                display: 'inline-flex', // Changed to inline-flex to tighten hit area
                alignItems: 'center',
                gap: 1,
                cursor: disabled ? 'default' : 'pointer',
                p: 0.5,
                borderRadius: 1,
                width: fullWidth ? '100%' : 'auto',
                '&:hover': {
                    bgcolor: disabled ? 'transparent' : alpha(theme.palette.primary.main, 0.04)
                },
                '&:hover .edit-icon': {
                    opacity: 1
                }
            }}
            onClick={() => !disabled && setIsEditing(true)}
        >
            <Typography
                variant={variant}
                sx={{
                    color: value ? (color || 'inherit') : 'text.secondary',
                    whiteSpace: multiline ? 'pre-line' : 'normal',
                    wordBreak: 'break-word',
                    flexGrow: 1,
                    minHeight: '1.5em'
                }}
            >
                {value || placeholder}
            </Typography>
            {!disabled && (
                <Tooltip title="Click to edit">
                    <Edit
                        className="edit-icon"
                        sx={{
                            fontSize: '0.875rem',
                            color: 'text.secondary',
                            opacity: 0,
                            transition: 'opacity 0.2s'
                        }}
                    />
                </Tooltip>
            )}
        </Box>
    );
};
