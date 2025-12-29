import React, { useState, useEffect } from 'react';
import {
    TextField,
    Box,
    Chip,
    Tooltip,
} from '@mui/material';
import { SortableEntityItem, InlineForm } from './SortableEntityItem';

export interface TagData {
    id?: string;
    name: string;
    description?: string;
    color: string;
    displayOrder?: number;
    isNew?: boolean;
    delete?: boolean;
}

interface InlineTagEditorProps {
    tag: TagData;
    index: number;
    isEditing: boolean;
    onStartEdit: () => void;
    onSave: (data: TagData) => void;
    onCancel: () => void;
    onDelete: () => void;
    existingNames?: string[];
    dragDisabled?: boolean;
}

export function InlineTagEditor({
    tag,
    index,
    isEditing,
    onStartEdit,
    onSave,
    onCancel,
    onDelete,
    existingNames = [],
    dragDisabled,
}: InlineTagEditorProps) {
    const [name, setName] = useState(tag.name || '');
    const [description, setDescription] = useState(tag.description || '');
    const [color, setColor] = useState(tag.color || '#049FD9');
    const [nameError, setNameError] = useState('');

    useEffect(() => {
        if (isEditing) {
            setName(tag.name || '');
            setDescription(tag.description || '');
            setColor(tag.color || '#049FD9');
            setNameError('');
        }
    }, [isEditing, tag]);

    const validate = () => {
        if (!name.trim()) {
            setNameError('Tag name is required');
            return false;
        }
        // Check for duplicate names (excluding current tag's original name when editing)
        const conflict = existingNames
            .filter(n => n !== (tag.name ?? ''))
            .some(n => n.toLowerCase() === name.trim().toLowerCase());
        if (conflict) {
            setNameError('A tag with this name already exists');
            return false;
        }
        return true;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave({
            ...tag,
            name: name.trim(),
            description: description.trim() || undefined,
            color,
        });
    };

    if (isEditing) {
        return (
            <InlineForm
                onSave={handleSave}
                onCancel={onCancel}
                saveDisabled={!name.trim()}
            >
                <TextField
                    label="Tag Name"
                    size="small"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError('');
                    }}
                    fullWidth
                    autoFocus
                    required
                    error={!!nameError}
                    helperText={nameError || 'Unique name for the tag'}
                />
                <TextField
                    label="Description"
                    size="small"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="Optional description"
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                        label="Color"
                        type="color"
                        size="small"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        sx={{ width: 80 }}
                    />
                    <Tooltip title="Preview">
                        <Chip
                            label={name || 'Tag'}
                            sx={{
                                backgroundColor: color,
                                color: '#fff',
                                fontWeight: 500,
                                height: 32,
                            }}
                        />
                    </Tooltip>
                </Box>
            </InlineForm>
        );
    }

    return (
        <SortableEntityItem
            id={tag.id || `new-${index}`}
            primary={tag.name}
            secondary={tag.description}
            badge={
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Chip
                        label=""
                        size="small"
                        sx={{
                            backgroundColor: tag.color,
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                        }}
                    />
                    {tag.isNew && <Chip label="New" size="small" color="success" variant="outlined" />}
                </Box>
            }
            onEdit={onStartEdit}
            onDelete={onDelete}
            isNew={tag.isNew}
            disabled={dragDisabled}
        />
    );
}

// Add form for tags
interface AddTagFormProps {
    onSave: (data: Omit<TagData, 'id'>) => void;
    onCancel: () => void;
    existingNames?: string[];
}

export function AddTagForm({ onSave, onCancel, existingNames = [] }: AddTagFormProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#049FD9'); // Cisco brand blue
    const [nameError, setNameError] = useState('');

    const validate = () => {
        if (!name.trim()) {
            setNameError('Tag name is required');
            return false;
        }
        const conflict = existingNames.some(n => n.toLowerCase() === name.trim().toLowerCase());
        if (conflict) {
            setNameError('A tag with this name already exists');
            return false;
        }
        return true;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave({
            name: name.trim(),
            description: description.trim() || undefined,
            color,
            isNew: true,
        });
    };

    return (
        <InlineForm
            onSave={handleSave}
            onCancel={onCancel}
            saveDisabled={!name.trim()}
            saveLabel="Add Tag"
        >
            <TextField
                label="Tag Name"
                size="small"
                value={name}
                onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError('');
                }}
                fullWidth
                autoFocus
                required
                error={!!nameError}
                helperText={nameError || 'Unique name for the tag'}
            />
            <TextField
                label="Description"
                size="small"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                placeholder="Optional description"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                    label="Color"
                    type="color"
                    size="small"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    sx={{ width: 80 }}
                />
                <Tooltip title="Preview">
                    <Chip
                        label={name || 'Tag'}
                        sx={{
                            backgroundColor: color,
                            color: '#fff',
                            fontWeight: 500,
                            height: 32,
                        }}
                    />
                </Tooltip>
            </Box>
        </InlineForm>
    );
}
