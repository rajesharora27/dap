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
  Checkbox,
  ListItemText,
  Chip,
  Divider,
  OutlinedInput
} from '@mui/material';

interface ProductRelease {
  id: string;
  name: string;
  level: number;
  productId: string;
  productName: string;
  description?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    level: number;
    description?: string;
    productReleaseMapping: { [productId: string]: string[] }; // productId -> release IDs (or ['ALL'])
  }) => void;
  release?: {
    name: string;
    level: number;
    description?: string;
    productReleaseMapping?: { [productId: string]: string[] };
  } | null;
  title: string;
  availableProductReleases: ProductRelease[];
}

const ALL_RELEASES_MARKER = '__ALL_RELEASES__';

export const SolutionReleaseDialog: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  release,
  title,
  availableProductReleases
}) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<number>(1.0);
  const [description, setDescription] = useState('');
  const [productReleaseMapping, setProductReleaseMapping] = useState<{ [productId: string]: string[] }>({});
  const [error, setError] = useState('');

  // Group releases by product
  const releasesByProduct = availableProductReleases.reduce((acc, rel) => {
    if (!acc[rel.productId]) {
      acc[rel.productId] = {
        productName: rel.productName,
        releases: []
      };
    }
    acc[rel.productId].releases.push(rel);
    return acc;
  }, {} as { [productId: string]: { productName: string; releases: ProductRelease[] } });

  useEffect(() => {
    if (release) {
      setName(release.name || '');
      setLevel(release.level || 1.0);
      setDescription(release.description || '');
      setProductReleaseMapping(release.productReleaseMapping || {});
    } else {
      setName('');
      setLevel(1.0);
      setDescription('');
      // Default: map to all releases for all products
      const defaultMapping: { [productId: string]: string[] } = {};
      Object.keys(releasesByProduct).forEach(productId => {
        defaultMapping[productId] = [ALL_RELEASES_MARKER];
      });
      setProductReleaseMapping(defaultMapping);
    }
    setError('');
  }, [release, open, availableProductReleases]);

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
      description: description.trim() || undefined,
      productReleaseMapping
    });
    onClose();
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setLevel(value);
    }
  };

  const handleProductReleaseChange = (productId: string, selectedReleaseIds: string[]) => {
    // If "All Releases" is selected, clear other selections
    if (selectedReleaseIds.includes(ALL_RELEASES_MARKER)) {
      setProductReleaseMapping(prev => ({
        ...prev,
        [productId]: [ALL_RELEASES_MARKER]
      }));
    } else {
      setProductReleaseMapping(prev => ({
        ...prev,
        [productId]: selectedReleaseIds
      }));
    }
  };

  const getSelectedReleases = (productId: string): string[] => {
    return productReleaseMapping[productId] || [];
  };

  const renderSelectedValues = (productId: string, selected: string[]) => {
    if (selected.includes(ALL_RELEASES_MARKER)) {
      return <Chip label="All Releases" size="small" color="primary" />;
    }

    const productReleases = releasesByProduct[productId]?.releases || [];
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {selected.map(releaseId => {
          const rel = productReleases.find(r => r.id === releaseId);
          return rel ? (
            <Chip key={releaseId} label={`${rel.name} (v${rel.level})`} size="small" />
          ) : null;
        })}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Solution Release Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            autoFocus
            placeholder="e.g., Enterprise Bundle v2.0, Security Package Alpha"
            required
          />

          <TextField
            fullWidth
            label="Release Level"
            type="number"
            value={level}
            onChange={handleLevelChange}
            margin="normal"
            inputProps={{ min: 0.1, step: 0.1 }}
            helperText="Version number (e.g., 1.0, 2.5)"
            required
          />

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={2}
            placeholder="Describe this solution release..."
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}

          {Object.keys(releasesByProduct).length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
                Map to Product Releases
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select which product releases this solution release includes. Choose "All Releases" to include all current and future releases.
              </Typography>

              {Object.entries(releasesByProduct).map(([productId, { productName, releases }]) => (
                <FormControl key={productId} fullWidth margin="normal">
                  <InputLabel>{productName} Releases</InputLabel>
                  <Select
                    multiple
                    value={getSelectedReleases(productId)}
                    onChange={(e) => handleProductReleaseChange(productId, e.target.value as string[])}
                    input={<OutlinedInput label={`${productName} Releases`} />}
                    renderValue={(selected) => renderSelectedValues(productId, selected as string[])}
                  >
                    <MenuItem value={ALL_RELEASES_MARKER}>
                      <Checkbox checked={getSelectedReleases(productId).includes(ALL_RELEASES_MARKER)} />
                      <ListItemText primary="All Releases" />
                    </MenuItem>
                    <Divider />
                    {releases.map((rel) => (
                      <MenuItem
                        key={rel.id}
                        value={rel.id}
                        disabled={getSelectedReleases(productId).includes(ALL_RELEASES_MARKER)}
                      >
                        <Checkbox
                          checked={getSelectedReleases(productId).includes(rel.id)}
                          disabled={getSelectedReleases(productId).includes(ALL_RELEASES_MARKER)}
                        />
                        <ListItemText primary={`${rel.name} (v${rel.level})`} secondary={rel.description} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim() || level <= 0}>
          {release ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

