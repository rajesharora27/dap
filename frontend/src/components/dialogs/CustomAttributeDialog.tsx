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
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip
} from '@mui/material';
import { CustomAttribute } from '../../types/shared';
import { ValidationUtils } from '../../utils/sharedHandlers';

interface CustomAttributeDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (attribute: CustomAttribute) => void;
    attribute?: CustomAttribute | null;
    existingKeys?: string[];
}

export const CustomAttributeDialog: React.FC<CustomAttributeDialogProps> = ({
    open,
    onClose,
    onSave,
    attribute,
    existingKeys = []
}) => {
    const [formData, setFormData] = useState<CustomAttribute>({
        key: '',
        value: '',
        type: 'string'
    });
    const [valueError, setValueError] = useState('');
    const [keyError, setKeyError] = useState('');

    useEffect(() => {
        if (attribute) {
            // Editing existing attribute
            setFormData({
                key: attribute.key,
                value: typeof attribute.value === 'object' ? JSON.stringify(attribute.value, null, 2) : String(attribute.value),
                type: attribute.type
            });
        } else {
            // Adding new attribute
            setFormData({
                key: '',
                value: '',
                type: 'string'
            });
        }
        setValueError('');
        setKeyError('');
    }, [attribute, open]);

    const handleValueChange = (newValue: string) => {
        setFormData(prev => ({ ...prev, value: newValue }));
        setValueError(''); // Clear error on change
    };

    const handleKeyChange = (newKey: string) => {
        setFormData(prev => ({ ...prev, key: newKey }));
        setKeyError(''); // Clear error on change
    };

    const handleTypeChange = (newType: string) => {
        setFormData(prev => ({ ...prev, type: newType as CustomAttribute['type'] }));
        setValueError(''); // Clear error on type change
    };

    const handleSave = () => {
        const errors = ValidationUtils.validateCustomAttribute(formData);

        if (!attribute && existingKeys.includes(formData.key.trim())) {
            errors.push('Key already exists');
        }

        if (attribute && attribute.key !== formData.key.trim() && existingKeys.includes(formData.key.trim())) {
            errors.push('Key already exists');
        }

        if (errors.length > 0) {
            setKeyError(errors.find(e => e.includes('key') || e.includes('Key')) || '');
            setValueError(errors.find(e => !e.includes('key') && !e.includes('Key')) || '');
            return;
        }

        setKeyError('');
        setValueError('');

        let processedValue: any = formData.value;

        // Convert value based on type
        switch (formData.type) {
            case 'number':
                processedValue = Number(formData.value);
                break;
            case 'boolean':
                processedValue = String(formData.value).toLowerCase() === 'true';
                break;
            case 'array':
            case 'object':
                processedValue = JSON.parse(formData.value);
                break;
            default:
                processedValue = formData.value;
        }

        onSave({
            key: formData.key.trim(),
            value: processedValue,
            type: formData.type
        });
        onClose();
    };

    const getHelperText = () => {
        switch (formData.type) {
            case 'string':
                return 'Enter any text value';
            case 'number':
                return 'Enter a numeric value (e.g., 42, 3.14)';
            case 'boolean':
                return 'Enter "true" or "false"';
            case 'array':
                return 'Enter a JSON array (e.g., ["item1", "item2", 123])';
            case 'object':
                return 'Enter a JSON object (e.g., {"nested": "value"})';
            default:
                return '';
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
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
                {attribute ? 'Edit Product Attribute' : 'Add Product Attribute'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label="Attribute Key"
                        value={formData.key}
                        onChange={(e) => handleKeyChange(e.target.value)}
                        margin="normal"
                        required
                        error={!!keyError}
                        helperText={keyError || 'Unique identifier for this attribute'}
                        disabled={!!attribute} // Don't allow editing key of existing attributes
                    />

                    <FormControl fullWidth margin="normal">
                        <InputLabel>Value Type</InputLabel>
                        <Select
                            value={formData.type}
                            onChange={(e) => handleTypeChange(e.target.value)}
                            label="Value Type"
                        >
                            <MenuItem value="string">String (Text)</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                            <MenuItem value="boolean">Boolean (true/false)</MenuItem>
                            <MenuItem value="array">Array (JSON)</MenuItem>
                            <MenuItem value="object">Object (JSON)</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="Value"
                        value={formData.value}
                        onChange={(e) => handleValueChange(e.target.value)}
                        margin="normal"
                        required
                        error={!!valueError}
                        helperText={valueError || getHelperText()}
                        multiline={formData.type === 'array' || formData.type === 'object'}
                        rows={formData.type === 'array' || formData.type === 'object' ? 4 : 1}
                        placeholder={
                            formData.type === 'array' ? '["value1", "value2"]' :
                                formData.type === 'object' ? '{"key": "value"}' :
                                    formData.type === 'boolean' ? 'true' :
                                        formData.type === 'number' ? '42' : 'Enter value...'
                        }
                    />

                    {existingKeys.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Existing Keys:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {existingKeys.map(key => (
                                    <Chip key={key} label={key} size="small" variant="outlined" />
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    Cancel
                </Button>
                <Button onClick={handleSave} color="primary" variant="contained">
                    {attribute ? 'Update' : 'Add'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};