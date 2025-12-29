import React, { useState, useEffect } from 'react';
import { TextField, Box, Chip } from '@mui/material';
import { SortableEntityItem, InlineForm } from './SortableEntityItem';

export interface ReleaseData {
    id?: string;
    name: string;
    level: number;
    description?: string;
    isNew?: boolean;
    delete?: boolean;
    isActive?: boolean;
    customAttrs?: any;
}

interface InlineReleaseEditorProps {
    release: ReleaseData;
    index: number;
    isEditing: boolean;
    onStartEdit: () => void;
    onSave: (data: ReleaseData) => void;
    onCancel: () => void;
    onDelete: () => void;
    dragDisabled?: boolean;
}

export function InlineReleaseEditor({
    release,
    index,
    isEditing,
    onStartEdit,
    onSave,
    onCancel,
    onDelete,
    dragDisabled,
}: InlineReleaseEditorProps) {
    const [name, setName] = useState(release.name || '');
    const [level, setLevel] = useState(release.level || 1.0);
    const [description, setDescription] = useState(release.description || '');

    useEffect(() => {
        if (isEditing) {
            setName(release.name || '');
            setLevel(release.level || 1.0);
            setDescription(release.description || '');
        }
    }, [isEditing, release]);

    const handleSave = () => {
        if (!name.trim() || level <= 0) return;
        onSave({
            ...release,
            name: name.trim(),
            level,
            description: description.trim() || undefined,
        });
    };

    const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            setLevel(value);
        }
    };

    if (isEditing) {
        return (
            <InlineForm
                onSave={handleSave}
                onCancel={onCancel}
                saveDisabled={!name.trim() || level <= 0}
            >
                <TextField
                    label="Release Name"
                    size="small"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    autoFocus
                    required
                    placeholder="e.g., Alpha, Beta, Version 1.0"
                />
                <TextField
                    label="Release Level"
                    size="small"
                    type="number"
                    value={level}
                    onChange={handleLevelChange}
                    fullWidth
                    required
                    inputProps={{ min: 0.1, step: 0.1 }}
                    helperText="Version number (e.g., 1.0, 2.5)"
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
            </InlineForm>
        );
    }

    return (
        <SortableEntityItem
            id={release.id || `new-${index}`}
            primary={release.name}
            secondary={`Level: ${release.level}${release.description ? ` - ${release.description}` : ''}`}
            badge={release.isNew ? <Chip label="New" size="small" color="success" variant="outlined" /> : undefined}
            onEdit={onStartEdit}
            onDelete={onDelete}
            isNew={release.isNew}
            disabled={dragDisabled}
        />
    );
}

// Simple add form component
interface AddReleaseFormProps {
    onSave: (data: Omit<ReleaseData, 'id'>) => void;
    onCancel: () => void;
}

export function AddReleaseForm({ onSave, onCancel }: AddReleaseFormProps) {
    const [name, setName] = useState('');
    const [level, setLevel] = useState(1.0);
    const [description, setDescription] = useState('');

    const handleSave = () => {
        if (!name.trim() || level <= 0) return;
        onSave({
            name: name.trim(),
            level,
            description: description.trim() || undefined,
            isNew: true,
        });
    };

    const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            setLevel(value);
        }
    };

    return (
        <InlineForm
            onSave={handleSave}
            onCancel={onCancel}
            saveDisabled={!name.trim() || level <= 0}
            saveLabel="Add Release"
        >
            <TextField
                label="Release Name"
                size="small"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                autoFocus
                required
                placeholder="e.g., Alpha, Beta, Version 1.0"
            />
            <TextField
                label="Release Level"
                size="small"
                type="number"
                value={level}
                onChange={handleLevelChange}
                fullWidth
                required
                inputProps={{ min: 0.1, step: 0.1 }}
                helperText="Version number (e.g., 1.0, 2.5)"
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
        </InlineForm>
    );
}
