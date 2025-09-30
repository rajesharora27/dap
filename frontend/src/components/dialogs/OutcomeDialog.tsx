import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box
} from '@mui/material';
import { Outcome } from '../../types/shared';
import { ValidationUtils } from '../../utils/sharedHandlers';

interface OutcomeDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (outcome: Omit<Outcome, 'id'>) => void;
    outcome?: Outcome | null;
}

export const OutcomeDialog: React.FC<OutcomeDialogProps> = ({
    open,
    onClose,
    onSave,
    outcome
}) => {
    const [formData, setFormData] = useState<Omit<Outcome, 'id'>>({
        name: '',
        description: ''
    });

    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    useEffect(() => {
        if (outcome) {
            setFormData({
                name: outcome.name,
                description: outcome.description
            });
        } else {
            setFormData({
                name: '',
                description: ''
            });
        }
    }, [outcome, open]);

    const handleSave = () => {
        const errors = ValidationUtils.validateOutcome(formData);

        if (errors.length > 0) {
            setValidationErrors(errors);
            alert('Please fix the following errors:\n' + errors.join('\n'));
            return;
        }

        setValidationErrors([]);
        onSave(formData);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            keepMounted
            disableEnforceFocus
            container={document.getElementById('root')}
            BackdropProps={{
                onClick: onClose
            }}
            slotProps={{
                backdrop: {
                    invisible: false
                }
            }}
        >
            <DialogTitle>
                {outcome ? 'Edit Outcome' : 'Add New Outcome'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label="Outcome Name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        margin="normal"
                        required
                        helperText="Enter a descriptive name for this outcome"
                    />

                    <TextField
                        fullWidth
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        margin="normal"
                        multiline
                        rows={3}
                        placeholder="Describe what this outcome represents..."
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    Cancel
                </Button>
                <Button onClick={handleSave} color="primary" variant="contained">
                    {outcome ? 'Update' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};