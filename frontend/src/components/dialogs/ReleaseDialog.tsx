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
} from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; level: number; description?: string }) => void;
  release?: { name: string; level: number; description?: string } | null;
  title: string;
}

export const ReleaseDialog: React.FC<Props> = ({ open, onClose, onSave, release, title }) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<number>(1.0);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (release) {
      setName(release.name || '');
      setLevel(release.level || 1.0);
      setDescription(release.description || '');
    } else {
      setName('');
      setLevel(1.0);
      setDescription('');
    }
    setError('');
  }, [release, open]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (level <= 0) {
      setError('Level must be greater than 0');
      return;
    }

    setError('');
    onSave({
      name: name.trim(),
      level: level,
      description: description.trim() || undefined
    });
    onClose();
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setLevel(value);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Release Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            autoFocus
            placeholder="e.g. Alpha, Beta, Version 1.0"
          />
          
          <TextField
            fullWidth
            label="Release Level"
            type="number"
            value={level}
            onChange={handleLevelChange}
            margin="normal"
            inputProps={{
              step: 0.1,
              min: 0.1
            }}
            placeholder="e.g. 1.0, 1.1, 2.0"
            helperText="Decimal number representing the release version (e.g., 1.0, 1.1, 2.0)"
          />
          
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={2}
            placeholder="Optional description of this release"
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Release
        </Button>
      </DialogActions>
    </Dialog>
  );
};