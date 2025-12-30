import React, { useState, useEffect } from 'react';
import { TextField, Box, Chip } from '@mui/material';
import { SortableEntityItem, InlineForm } from './SortableEntityItem';

export interface OutcomeData {
    id?: string;
    name: string;
    description?: string;
    isNew?: boolean;
    delete?: boolean;
}

interface InlineOutcomeEditorProps {
    outcome: OutcomeData;
    index: number;
    isEditing: boolean;
    onStartEdit: () => void;
    onSave: (data: OutcomeData) => void;
    onCancel: () => void;
    onDelete: () => void;
    dragDisabled?: boolean;
}

export function InlineOutcomeEditor({
    outcome,
    index,
    isEditing,
    onStartEdit,
    onSave,
    onCancel,
    onDelete,
    dragDisabled,
}: InlineOutcomeEditorProps) {
    const [name, setName] = useState(outcome.name || '');
    const [description, setDescription] = useState(outcome.description || '');

    useEffect(() => {
        if (isEditing) {
            setName(outcome.name || '');
            setDescription(outcome.description || '');
        }
    }, [isEditing, outcome]);

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({
            ...outcome,
            name: name.trim(),
            description: description.trim() || undefined,
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
                    label="Outcome Name"
                    size="small"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    autoFocus
                    required
                    placeholder="Enter outcome name"
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
            id={outcome.id || `new-${index}`}
            primary={outcome.name}
            index={index}
            secondary={outcome.description}
            badge={outcome.isNew ? <Chip label="New" size="small" color="success" variant="outlined" /> : undefined}
            onEdit={onStartEdit}
            onDelete={onDelete}
            isNew={outcome.isNew}
            disabled={dragDisabled}
        />
    );
}

// Simple add form component
interface AddOutcomeFormProps {
    onSave: (data: Omit<OutcomeData, 'id'>) => void;
    onCancel: () => void;
}

export function AddOutcomeForm({ onSave, onCancel }: AddOutcomeFormProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({
            name: name.trim(),
            description: description.trim() || undefined,
            isNew: true,
        });
    };

    return (
        <InlineForm
            onSave={handleSave}
            onCancel={onCancel}
            saveDisabled={!name.trim()}
            saveLabel="Add Outcome"
        >
            <TextField
                label="Outcome Name"
                size="small"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                autoFocus
                required
                placeholder="Enter outcome name"
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
