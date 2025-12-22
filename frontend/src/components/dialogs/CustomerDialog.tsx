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
  Chip,
  OutlinedInput,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore } from '@shared/components/FAIcon';

interface Customer {
  id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  company?: string;
  industry?: string;
  size?: string;
  customAttrs?: any;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    email?: string;
    phone?: string;
    company?: string;
    industry?: string;
    size?: string;
    customAttrs?: any
  }) => Promise<void>;
  customer?: Customer | null;
  title: string;
}

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Government',
  'Non-profit',
  'Consulting',
  'Other'
];

const companySizes = [
  'Startup (1-10)',
  'Small (11-50)',
  'Medium (51-200)',
  'Large (201-1000)',
  'Enterprise (1000+)'
];

export const CustomerDialog: React.FC<Props> = ({ open, onClose, onSave, customer, title }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setDescription(customer.description || '');
    } else {
      setName('');
      setDescription('');
    }
    setError('');
  }, [customer, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Customer Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
            autoFocus
            placeholder="e.g., ACME Corp"
            helperText="Required. Enter the customer or company name."
          />

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            placeholder="e.g., Large manufacturing company with 2000+ employees"
            helperText="Optional. Add details about the customer."
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
