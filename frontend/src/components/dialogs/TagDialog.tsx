// TagDialog.tsx – UI for creating and editing Product Tags
import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import { Close, Save } from '@shared/components/FAIcon';

// Define the shape of a ProductTag used by the UI
export interface ProductTag {
    id: string;
    name: string;
    description?: string;
    color?: string; // hex colour string, e.g. "#1976d2"
    displayOrder?: number;
}

interface TagDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Called when the dialog should be closed */
    onClose: () => void;
    /** Called after a successful save (create or update) */
    onSave: (tag: Omit<ProductTag, 'id'>, existingId?: string) => void;
    /** Tag to edit – if omitted the dialog works in "create" mode */
    tag?: ProductTag | null;
    /** List of existing tag names – used for simple uniqueness validation */
    existingNames?: string[];
}

export const TagDialog: React.FC<TagDialogProps> = ({
    open,
    onClose,
    onSave,
    tag,
    existingNames = []
}) => {
    const isEditMode = Boolean(tag);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#1976d2'); // default MUI primary colour
    const [nameError, setNameError] = useState('');

    // Populate fields when editing or when dialog opens
    useEffect(() => {
        if (tag) {
            setName(tag.name);
            setDescription(tag.description || '');
            setColor(tag.color ?? '#1976d2');
        } else {
            setName('');
            setDescription('');
            setColor('#1976d2');
        }
        setNameError('');
    }, [tag, open]);

    const validate = () => {
        if (!name.trim()) {
            setNameError('Tag name is required');
            return false;
        }
        // If creating a new tag, ensure the name is not already used
        const conflict = existingNames
            .filter(n => n !== (tag?.name ?? ''))
            .some(n => n.toLowerCase() === name.trim().toLowerCase());
        if (conflict) {
            setNameError('A tag with this name already exists');
            return false;
        }
        return true;
    };

    const handleSave = () => {
        if (!validate()) return;
        const payload: Omit<ProductTag, 'id'> = {
            name: name.trim(),
            description: description.trim() || undefined,
            color,
            // displayOrder will be handled by the backend (auto‑increment) if omitted
        };
        onSave(payload, tag?.id);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{isEditMode ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Tag Name"
                        value={name}
                        onChange={e => {
                            setName(e.target.value);
                            if (nameError) setNameError('');
                        }}
                        error={!!nameError}
                        helperText={nameError || 'Unique name for the tag'}
                        fullWidth
                        required
                    />

                    <TextField
                        label="Description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Optional description"
                        fullWidth
                        multiline
                        rows={2}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                            label="Colour"
                            type="color"
                            value={color}
                            onChange={e => setColor(e.target.value)}
                            sx={{ width: 80, padding: 0, border: 0 }}
                        />
                        <Tooltip title="Preview">
                            <Chip
                                label={name || 'Tag'}
                                sx={{
                                    backgroundColor: color,
                                    color: '#fff',
                                    fontWeight: 500,
                                    height: 32,
                                    '& .MuiChip-label': { paddingLeft: 1, paddingRight: 1 }
                                }}
                            />
                        </Tooltip>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} startIcon={<Close />}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary" startIcon={<Save />}>
                    {isEditMode ? 'Update' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
