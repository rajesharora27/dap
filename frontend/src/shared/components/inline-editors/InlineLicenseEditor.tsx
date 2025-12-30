import React, { useState, useEffect } from 'react';
import { TextField, Box, Chip, FormControlLabel, Switch } from '@mui/material';
import { SortableEntityItem, InlineForm } from './SortableEntityItem';

export interface LicenseData {
    id?: string;
    name: string;
    level: number;
    description?: string;
    isActive?: boolean;
    isNew?: boolean;
    delete?: boolean;
    customAttrs?: any;
}

interface InlineLicenseEditorProps {
    license: LicenseData;
    index: number;
    isEditing: boolean;
    onStartEdit: () => void;
    onSave: (data: LicenseData) => void;
    onCancel: () => void;
    onDelete: () => void;
    dragDisabled?: boolean;
}

export function InlineLicenseEditor({
    license,
    index,
    isEditing,
    onStartEdit,
    onSave,
    onCancel,
    onDelete,
    dragDisabled,
}: InlineLicenseEditorProps) {
    const [name, setName] = useState(license.name || '');
    const [level, setLevel] = useState(license.level || 1);
    const [description, setDescription] = useState(license.description || '');
    const [isActive, setIsActive] = useState(license.isActive !== false);

    useEffect(() => {
        if (isEditing) {
            setName(license.name || '');
            setLevel(license.level || 1);
            setDescription(license.description || '');
            setIsActive(license.isActive !== false);
        }
    }, [isEditing, license]);

    const handleSave = () => {
        if (!name.trim() || level <= 0) return;
        onSave({
            ...license,
            name: name.trim(),
            level,
            description: description.trim() || undefined,
            isActive,
        });
    };

    const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
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
                    label="License Name"
                    size="small"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    autoFocus
                    required
                    placeholder="e.g., Essential, Professional, Enterprise"
                />
                <TextField
                    label="License Level"
                    size="small"
                    type="number"
                    value={level}
                    onChange={handleLevelChange}
                    fullWidth
                    required
                    inputProps={{ min: 1, step: 1 }}
                    helperText="Higher levels typically include features from lower levels"
                />
                <TextField
                    label="Description"
                    size="small"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="Describe what this license tier includes"
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            size="small"
                        />
                    }
                    label="Active"
                />
            </InlineForm>
        );
    }

    return (
        <SortableEntityItem
            id={license.id || `new-${index}`}
            primary={`${license.name} (Level ${license.level})`}
            index={index}
            secondary={license.description}
            badge={
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {license.isNew && <Chip label="New" size="small" color="success" variant="outlined" />}
                    {!license.isActive && <Chip label="Inactive" size="small" color="warning" variant="outlined" />}
                </Box>
            }
            onEdit={onStartEdit}
            onDelete={onDelete}
            isNew={license.isNew}
            disabled={dragDisabled}
        />
    );
}

// Simple add form component
interface AddLicenseFormProps {
    onSave: (data: Omit<LicenseData, 'id'>) => void;
    onCancel: () => void;
}

export function AddLicenseForm({ onSave, onCancel }: AddLicenseFormProps) {
    const [name, setName] = useState('');
    const [level, setLevel] = useState(1);
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);

    const handleSave = () => {
        if (!name.trim() || level <= 0) return;
        onSave({
            name: name.trim(),
            level,
            description: description.trim() || undefined,
            isActive,
            isNew: true,
        });
    };

    const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
            setLevel(value);
        }
    };

    return (
        <InlineForm
            onSave={handleSave}
            onCancel={onCancel}
            saveDisabled={!name.trim() || level <= 0}
            saveLabel="Add License"
        >
            <TextField
                label="License Name"
                size="small"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                autoFocus
                required
                placeholder="e.g., Essential, Professional, Enterprise"
            />
            <TextField
                label="License Level"
                size="small"
                type="number"
                value={level}
                onChange={handleLevelChange}
                fullWidth
                required
                inputProps={{ min: 1, step: 1 }}
                helperText="Higher levels typically include features from lower levels"
            />
            <TextField
                label="Description"
                size="small"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                placeholder="Describe what this license tier includes"
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        size="small"
                    />
                }
                label="Active"
            />
        </InlineForm>
    );
}
