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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import { License } from '../../types/shared';
import { ValidationUtils } from '../../utils/sharedHandlers';

interface LicenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (license: Omit<License, 'id'>) => void;
  license?: License | null;
}

export const LicenseDialog: React.FC<LicenseDialogProps> = ({
  open,
  onClose,
  onSave,
  license
}) => {
  const [formData, setFormData] = useState<Omit<License, 'id'>>({
    name: '',
    description: '',
    level: 1,
    isActive: true
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (license) {
      setFormData({
        name: license.name,
        description: license.description,
        level: license.level,
        isActive: license.isActive
      });
    } else {
      setFormData({
        name: '',
        description: '',
        level: 1,
        isActive: true
      });
    }
  }, [license, open]);

  const handleSave = () => {
    const errors = ValidationUtils.validateLicense(formData);

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
    >
      <DialogTitle>
        {license ? 'Edit License' : 'Add New License'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="License Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
            required
            helperText="Enter a descriptive name for this license"
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            margin="normal"
            multiline
            rows={3}
            placeholder="Describe what this license provides..."
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>License Level</InputLabel>
            <Select
              value={formData.level}
              onChange={(e) => setFormData(prev => ({ ...prev, level: Number(e.target.value) }))}
              label="License Level"
            >
              <MenuItem value={1}>Level 1 - Basic</MenuItem>
              <MenuItem value={2}>Level 2 - Standard</MenuItem>
              <MenuItem value={3}>Level 3 - Premium</MenuItem>
              <MenuItem value={4}>Level 4 - Enterprise</MenuItem>
              <MenuItem value={5}>Level 5 - Ultimate</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
            }
            label="License is Active"
            sx={{ mt: 2 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          {license ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
