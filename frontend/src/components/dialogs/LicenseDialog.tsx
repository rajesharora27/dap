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
  Switch,
  Typography,
  Divider,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Chip
} from '@mui/material';
import { License } from '../../types/shared';
import { ValidationUtils } from '../../utils/sharedHandlers';

interface ProductLicense {
  id: string;
  name: string;
  level: number;
  productId: string;
  productName: string;
  description?: string;
}

interface LicenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (license: Omit<License, 'id'> & { customAttrs?: { productLicenseMapping?: { [productId: string]: string[] } } }) => void;
  license?: License | null;
  availableProductLicenses?: ProductLicense[];
  title?: string;
}

const ALL_LICENSES_MARKER = '__ALL_LICENSES__';

export const LicenseDialog: React.FC<LicenseDialogProps> = ({
  open,
  onClose,
  onSave,
  license,
  availableProductLicenses = [],
  title
}) => {
  const [formData, setFormData] = useState<Omit<License, 'id'>>({
    name: '',
    description: '',
    level: 1,
    isActive: true
  });
  const [productLicenseMapping, setProductLicenseMapping] = useState<{ [productId: string]: string[] }>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Group licenses by product
  const licensesByProduct = React.useMemo(() => {
    return availableProductLicenses.reduce((acc, lic) => {
      if (!acc[lic.productId]) {
        acc[lic.productId] = {
          productName: lic.productName,
          licenses: []
        };
      }
      acc[lic.productId].licenses.push(lic);
      return acc;
    }, {} as { [productId: string]: { productName: string; licenses: ProductLicense[] } });
  }, [availableProductLicenses]);

  useEffect(() => {
    if (license) {
      setFormData({
        name: license.name,
        description: license.description,
        level: license.level,
        isActive: license.isActive
      });
      // Try to load existing mapping if available in the license object (it might come from customAttrs or separate field in future)
      // For now, we initialize empty or based on potential future prop
      const mapping = (license as any).customAttrs?.productLicenseMapping || (license as any).productLicenseMapping || {};
      setProductLicenseMapping(mapping);
    } else {
      setFormData({
        name: '',
        description: '',
        level: 1,
        isActive: true
      });
      // Default: map to all licenses for all products if creating new
      const defaultMapping: { [productId: string]: string[] } = {};
      Object.keys(licensesByProduct).forEach(productId => {
        defaultMapping[productId] = [ALL_LICENSES_MARKER];
      });
      setProductLicenseMapping(defaultMapping);
    }
    setValidationErrors([]);
  }, [license, open, licensesByProduct]);

  const handleSave = () => {
    const errors = ValidationUtils.validateLicense(formData);

    if (errors.length > 0) {
      setValidationErrors(errors);
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    setValidationErrors([]);
    onSave({
      ...formData,
      customAttrs: { productLicenseMapping }
    });
    onClose();
  };

  const handleProductLicenseChange = (productId: string, selectedLicenseIds: string[]) => {
    // If "All Licenses" is selected, clear other selections if it wasn't already selected, or handle toggle
    // Logic: if marker is present, it overrides others.
    if (selectedLicenseIds.includes(ALL_LICENSES_MARKER)) {
      // If it was already selected and we are clicking other things, we might want to unselect it?
      // But typical MUI multi-select behavior with a "Select All" checkbox usually means:
      // if we select "Select All", we explicitly set to [MARKER].
      // But since we receive the new array, we verify the presence.

      // Simple logic: if new array has marker, set to marker.
      // But need to handle unselecting marker.
      // Let's stick to: if marker is freshly selected, it clears others. if others are selected, marker is removed.
      // However, looking at SolutionReleaseDialog logic:
      /*
      if (selectedReleaseIds.includes(ALL_RELEASES_MARKER)) {
           setProductReleaseMapping(prev => ({ ...prev, [productId]: [ALL_RELEASES_MARKER] }));
         }
      */
      // This logic effectively makes "Select All" sticky and exclusive.
      setProductLicenseMapping(prev => ({
        ...prev,
        [productId]: [ALL_LICENSES_MARKER]
      }));
    } else {
      setProductLicenseMapping(prev => ({
        ...prev,
        [productId]: selectedLicenseIds
      }));
    }
  };

  // Refined "Select All" logic to behave more intuitively (like a toggle)
  const handleProductLicenseChangeEnhanced = (productId: string, selected: string[]) => {
    const current = productLicenseMapping[productId] || [];
    const wasAll = current.includes(ALL_LICENSES_MARKER);
    const isAll = selected.includes(ALL_LICENSES_MARKER);

    if (!wasAll && isAll) {
      // "Select All" was just clicked
      setProductLicenseMapping(prev => ({ ...prev, [productId]: [ALL_LICENSES_MARKER] }));
    } else if (wasAll && !isAll) {
      // "Select All" was just unclicked -> Clear all
      setProductLicenseMapping(prev => ({ ...prev, [productId]: [] }));
    } else if (wasAll && isAll && selected.length > 1) {
      // "Select All" was active, and user clicked another item -> Unselect "Select All" and select the item?
      // Or keep "Select All" and ignore other clicks?
      // Better: If "All" is active, and user selects specific, remove "All" and keep specific? 
      // But "selected" comes from MUI which merges.
      // If we had [ALL] and user clicked 'A', selected is [ALL, A].
      // We should probably switch to just [A].
      const newSelection = selected.filter(id => id !== ALL_LICENSES_MARKER);
      setProductLicenseMapping(prev => ({ ...prev, [productId]: newSelection }));
    } else {
      // Normal selection
      setProductLicenseMapping(prev => ({ ...prev, [productId]: selected }));
    }
  };


  const getSelectedLicenses = (productId: string): string[] => {
    return productLicenseMapping[productId] || [];
  };

  const renderSelectedValues = (productId: string, selected: string[]) => {
    if (selected.includes(ALL_LICENSES_MARKER)) {
      return <Chip label="All Licenses" size="small" color="primary" />;
    }

    const productLicenses = licensesByProduct[productId]?.licenses || [];
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {selected.map(licId => {
          const lic = productLicenses.find(l => l.id === licId);
          return lic ? (
            <Chip key={licId} label={`${lic.name} (L${lic.level})`} size="small" />
          ) : null;
        })}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {title || (license ? 'Edit License' : 'Add New License')}
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
            autoFocus
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
              <MenuItem value={1}>1 - Essential</MenuItem>
              <MenuItem value={2}>2 - Advantage</MenuItem>
              <MenuItem value={3}>3 - Signature</MenuItem>
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

          {availableProductLicenses.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
                Map to Product Licenses
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select which product licenses this solution license includes.
              </Typography>

              {Object.entries(licensesByProduct).map(([productId, { productName, licenses }]) => (
                <FormControl key={productId} fullWidth margin="normal">
                  <InputLabel>{productName} Licenses</InputLabel>
                  <Select
                    multiple
                    value={getSelectedLicenses(productId)}
                    onChange={(e) => handleProductLicenseChangeEnhanced(productId, e.target.value as string[])}
                    input={<OutlinedInput label={`${productName} Licenses`} />}
                    renderValue={(selected) => renderSelectedValues(productId, selected as string[])}
                  >
                    <MenuItem value={ALL_LICENSES_MARKER}>
                      <Checkbox checked={getSelectedLicenses(productId).includes(ALL_LICENSES_MARKER)} />
                      <ListItemText primary="Select All Licenses" />
                    </MenuItem>
                    <Divider />
                    {licenses.map((lic) => (
                      <MenuItem
                        key={lic.id}
                        value={lic.id}
                      >
                        <Checkbox
                          checked={getSelectedLicenses(productId).includes(lic.id)}
                          disabled={getSelectedLicenses(productId).includes(ALL_LICENSES_MARKER) && false} // Let them behave as toggle
                        />
                        <ListItemText primary={`${lic.name} (L${lic.level})`} secondary={lic.description} />
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
