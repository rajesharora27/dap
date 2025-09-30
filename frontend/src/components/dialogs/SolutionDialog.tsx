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
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

interface Solution {
  id: string;
  name: string;
  description?: string;
  version?: string;
  type?: string;
  isTemplate?: boolean;
  customAttrs?: any;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { 
    name: string; 
    description?: string; 
    version?: string;
    type?: string;
    isTemplate?: boolean;
    customAttrs?: any 
  }) => Promise<void>;
  solution?: Solution | null;
  title: string;
}

const solutionTypes = [
  'Complete Solution',
  'Integration Package',
  'Service Bundle',
  'Consulting Package',
  'Support Package',
  'Training Program',
  'Custom Solution'
];

export const SolutionDialog: React.FC<Props> = ({ open, onClose, onSave, solution, title }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('');
  const [type, setType] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [customAttrs, setCustomAttrs] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (solution) {
      setName(solution.name || '');
      setDescription(solution.description || '');
      setVersion(solution.version || '');
      setType(solution.type || '');
      setIsTemplate(solution.isTemplate || false);
      setCustomAttrs(JSON.stringify(solution.customAttrs || {}, null, 2));
    } else {
      setName('');
      setDescription('');
      setVersion('1.0.0');
      setType('');
      setIsTemplate(false);
      setCustomAttrs('{\n  "pricing_model": "subscription",\n  "duration_months": 12,\n  "support_level": "standard"\n}');
    }
    setError('');
  }, [solution, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!type) {
      setError('Solution type is required');
      return;
    }

    let parsedAttrs = {};
    try {
      if (customAttrs.trim()) {
        parsedAttrs = JSON.parse(customAttrs);
      }
    } catch (e) {
      setError('Invalid JSON in custom attributes');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        version: version.trim() || '1.0.0',
        type: type,
        isTemplate: isTemplate,
        customAttrs: Object.keys(parsedAttrs).length > 0 ? parsedAttrs : undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save solution');
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
      keepMounted
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
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ flex: "2 1 400px" }}>
              <TextField
                fullWidth
                label="Solution Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
                autoFocus
                placeholder="e.g., Enterprise Analytics Suite"
              />
            </Box>
            <Box sx={{ flex: "1 1 200px" }}>
              <TextField
                fullWidth
                label="Version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                margin="normal"
                placeholder="e.g., 1.0.0"
              />
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            placeholder="Describe the solution's scope, objectives, and deliverables..."
          />

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ flex: "2 1 400px" }}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Solution Type</InputLabel>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  label="Solution Type"
                >
                  {solutionTypes.map((solutionType) => (
                    <MenuItem key={solutionType} value={solutionType}>
                      {solutionType}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: "1 1 200px" }}>
              <Box sx={{ mt: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isTemplate}
                      onChange={(e) => setIsTemplate(e.target.checked)}
                    />
                  }
                  label="Template Solution"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Can be reused as a template for new solutions
                </Typography>
              </Box>
            </Box>
          </Box>

          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Solution Details & Attributes</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                fullWidth
                label="Custom Attributes"
                value={customAttrs}
                onChange={(e) => setCustomAttrs(e.target.value)}
                multiline
                rows={6}
                placeholder='{"pricing_model": "subscription", "duration_months": 12, "support_level": "premium"}'
                helperText="Add solution-specific metadata. Common fields: pricing_model, duration_months, support_level, delivery_method, etc."
              />
            </AccordionDetails>
          </Accordion>

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
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
          {loading ? 'Saving...' : 'Save Solution'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
