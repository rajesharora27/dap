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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { ExpandMore } from '@mui/icons-material';
import { License, Outcome, Product, CustomAttribute } from '../../types/shared';
import { ValidationUtils } from '../../utils/sharedHandlers';
import { CustomAttributeDialog } from './CustomAttributeDialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    customAttrs?: any;
    outcomes?: Array<{ id?: string; name: string; description?: string; isNew?: boolean; delete?: boolean }>;
    licenses?: Array<{ id?: string; name: string; description?: string; level: string; isActive: boolean; isNew?: boolean; delete?: boolean }>;
    requiredLicenseLevel?: number;
  }) => Promise<void>;
  product?: Product | null;
  title: string;
}



export const ProductDialog: React.FC<Props> = ({ open, onClose, onSave, product, title }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customAttrs, setCustomAttrs] = useState<{ [key: string]: any }>({});
  const [outcomes, setOutcomes] = useState<Array<{ id?: string; name: string; description?: string; isNew?: boolean; delete?: boolean }>>([]);
  const [licenses, setLicenses] = useState<Array<{ id?: string; name: string; description?: string; level: number; isActive: boolean; isNew?: boolean; delete?: boolean }>>([]);
  const [requiredLicenseLevel, setRequiredLicenseLevel] = useState(1);
  const [newOutcomeName, setNewOutcomeName] = useState('');
  const [newOutcomeDescription, setNewOutcomeDescription] = useState('');
  const [newLicenseName, setNewLicenseName] = useState('');
  const [newLicenseDescription, setNewLicenseDescription] = useState('');
  const [newLicenseLevel, setNewLicenseLevel] = useState(1);
  const [newLicenseActive, setNewLicenseActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Custom attribute dialog states
  const [addCustomAttributeDialog, setAddCustomAttributeDialog] = useState(false);
  const [editCustomAttributeDialog, setEditCustomAttributeDialog] = useState(false);
  const [editingCustomAttribute, setEditingCustomAttribute] = useState<CustomAttribute | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setOutcomes(product.outcomes || []);
      setLicenses((product.licenses || []).map(license => ({
        id: license.id,
        name: license.name,
        description: license.description,
        level: license.level,
        isActive: license.isActive
      })));
      setRequiredLicenseLevel(product.requiredLicenseLevel || 1);
      setCustomAttrs(product.customAttrs || {});
    } else {
      setName('');
      setDescription('');
      setOutcomes([]);
      setLicenses([]);
      setRequiredLicenseLevel(1);
      setCustomAttrs({
        priority: "medium",
        owner: "",
        department: ""
      });
    }
    setNewOutcomeName('');
    setNewOutcomeDescription('');
    setNewLicenseName('');
    setNewLicenseDescription('');
    setNewLicenseLevel(1);
    setNewLicenseActive(true);
    setError('');
  }, [product, open]);

  const handleAddOutcome = () => {
    // Use shared validation logic
    const outcomeData = {
      name: newOutcomeName.trim(),
      description: newOutcomeDescription.trim() || undefined
    };

    const validationErrors = ValidationUtils.validateOutcome(outcomeData);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]); // Show first error
      return;
    }

    setOutcomes([...outcomes, {
      ...outcomeData,
      isNew: true
    }]);

    setNewOutcomeName('');
    setNewOutcomeDescription('');
    setError('');
  };

  const handleAddLicense = () => {
    // Use shared validation logic
    const licenseData = {
      name: newLicenseName.trim(),
      description: newLicenseDescription.trim() || undefined,
      level: newLicenseLevel,
      isActive: newLicenseActive
    };

    const validationErrors = ValidationUtils.validateLicense(licenseData);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]); // Show first error
      return;
    }

    setLicenses([...licenses, {
      ...licenseData,
      isNew: true
    }]);

    setNewLicenseName('');
    setNewLicenseDescription('');
    setNewLicenseLevel(licenses.length + 1); // Auto-increment level for next license
    setNewLicenseActive(true);
    setError('');
  };

  const handleDeleteOutcome = (index: number) => {
    const updatedOutcomes = [...outcomes];
    if (updatedOutcomes[index].id) {
      // Mark existing outcome for deletion
      updatedOutcomes[index] = { ...updatedOutcomes[index], delete: true };
    } else {
      // Remove new outcome that wasn't saved yet
      updatedOutcomes.splice(index, 1);
    }
    setOutcomes(updatedOutcomes);
  };

  const handleDeleteLicense = (index: number) => {
    const updatedLicenses = [...licenses];
    if (updatedLicenses[index].id) {
      // Mark existing license for deletion
      updatedLicenses[index] = { ...updatedLicenses[index], delete: true };
    } else {
      // Remove new license that wasn't saved yet
      updatedLicenses.splice(index, 1);
    }
    setLicenses(updatedLicenses);
  };

  // Custom Attribute handlers
  const handleAddCustomAttribute = (attributeData: CustomAttribute) => {
    const updatedCustomAttrs = {
      ...customAttrs,
      [attributeData.key]: attributeData.value
    };
    setCustomAttrs(updatedCustomAttrs);
    setAddCustomAttributeDialog(false);
  };

  const handleEditCustomAttribute = (attributeData: CustomAttribute) => {
    const updatedCustomAttrs = { ...customAttrs };

    // Remove old key if key was changed
    if (editingCustomAttribute && editingCustomAttribute.key !== attributeData.key) {
      delete updatedCustomAttrs[editingCustomAttribute.key];
    }

    // Add/update with new key and value
    updatedCustomAttrs[attributeData.key] = attributeData.value;

    setCustomAttrs(updatedCustomAttrs);
    setEditCustomAttributeDialog(false);
    setEditingCustomAttribute(null);
  };

  const handleDeleteCustomAttribute = (key: string) => {
    const updatedCustomAttrs = { ...customAttrs };
    delete updatedCustomAttrs[key];
    setCustomAttrs(updatedCustomAttrs);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    // customAttrs is already an object, no need to parse
    const parsedAttrs = customAttrs;

    // Use shared validation for the product
    const productValidationErrors = ValidationUtils.validateProduct({
      name: name.trim(),
      description: description.trim() || undefined,
      customAttrs: Object.keys(parsedAttrs).length > 0 ? parsedAttrs : undefined
    });

    if (productValidationErrors.length > 0) {
      setError(productValidationErrors[0]); // Show first error
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        customAttrs: Object.keys(parsedAttrs).length > 0 ? parsedAttrs : undefined,
        outcomes: outcomes.length > 0 ? outcomes : undefined,
        licenses: licenses.length > 0 ? licenses.map(license => ({
          ...license,
          level: license.level.toString() // Convert level to string
        })) : undefined,
        requiredLicenseLevel: requiredLicenseLevel > 1 ? requiredLicenseLevel : undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '2 1 300px' }}>
              <TextField
                fullWidth
                label="Product Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
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
            placeholder="Describe the product's purpose, features, and benefits..."
          />

          {/* Outcomes Management */}
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Outcomes ({outcomes.filter(o => !o.delete).length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {outcomes.filter(o => !o.delete).length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Current Outcomes
                  </Typography>
                  <List dense>
                    {outcomes.map((outcome, index) =>
                      !outcome.delete && (
                        <ListItem
                          key={index}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              onClick={() => handleDeleteOutcome(index)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={outcome.name}
                            secondary={outcome.description}
                            sx={{
                              '& .MuiListItemText-primary': {
                                fontWeight: outcome.isNew ? 'bold' : 'normal'
                              }
                            }}
                          />
                        </ListItem>
                      )
                    )}
                  </List>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              <Box>
                <Typography variant="h6" gutterBottom>
                  Add New Outcome
                </Typography>
                <TextField
                  fullWidth
                  label="Outcome Name"
                  value={newOutcomeName}
                  onChange={(e) => setNewOutcomeName(e.target.value)}
                  margin="dense"
                  placeholder="e.g., User Authentication, Data Analytics"
                />
                <TextField
                  fullWidth
                  label="Outcome Description"
                  value={newOutcomeDescription}
                  onChange={(e) => setNewOutcomeDescription(e.target.value)}
                  margin="dense"
                  multiline
                  rows={2}
                  placeholder="Describe what this outcome achieves..."
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddOutcome}
                  sx={{ mt: 1 }}
                >
                  Add Outcome
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Licenses Management */}
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Licenses ({licenses.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <TextField
                  label="Required License Level"
                  type="number"
                  value={requiredLicenseLevel}
                  onChange={(e) => setRequiredLicenseLevel(parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1, max: 10 }}
                  helperText="Minimum license level required to access this product"
                  sx={{ mb: 2 }}
                />
              </Box>

              {licenses.filter(l => !l.delete).length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Current Licenses
                  </Typography>
                  <List dense>
                    {licenses.map((license, index) =>
                      !license.delete && (
                        <ListItem
                          key={index}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              onClick={() => handleDeleteLicense(index)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={`${license.name} (Level ${license.level})`}
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  {license.description}
                                </Typography>
                                <Typography variant="caption" color={license.isActive ? 'success.main' : 'error.main'}>
                                  {license.isActive ? 'Active' : 'Inactive'}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      )
                    )}
                  </List>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              <Box>
                <Typography variant="h6" gutterBottom>
                  Add New License
                </Typography>
                <TextField
                  fullWidth
                  label="License Name"
                  value={newLicenseName}
                  onChange={(e) => setNewLicenseName(e.target.value)}
                  margin="dense"
                  placeholder="e.g., Basic Access, Premium Features, Enterprise"
                />
                <TextField
                  fullWidth
                  label="License Description"
                  value={newLicenseDescription}
                  onChange={(e) => setNewLicenseDescription(e.target.value)}
                  margin="dense"
                  multiline
                  rows={2}
                  placeholder="Describe what this license provides access to..."
                />
                <TextField
                  label="License Level"
                  type="number"
                  value={newLicenseLevel}
                  onChange={(e) => setNewLicenseLevel(parseInt(e.target.value) || 1)}
                  margin="dense"
                  inputProps={{ min: 1, max: 10 }}
                  helperText="Higher levels include access to lower levels"
                  sx={{ mr: 2, width: '200px' }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newLicenseActive}
                      onChange={(e) => setNewLicenseActive(e.target.checked)}
                    />
                  }
                  label="Active"
                  sx={{ mt: 1 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddLicense}
                  sx={{ mt: 1 }}
                >
                  Add License
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Other Product Attributes ({Object.keys(customAttrs).length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Manage additional metadata for this product
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setAddCustomAttributeDialog(true)}
                  size="small"
                >
                  Add Attribute
                </Button>
              </Box>

              {Object.keys(customAttrs).length > 0 ? (
                <List dense>
                  {Object.entries(customAttrs).map(([key, value]: [string, any]) => (
                    <ListItemButton
                      key={key}
                      sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                      onDoubleClick={() => {
                        setEditingCustomAttribute({
                          key,
                          value,
                          type: Array.isArray(value) ? 'array' :
                            typeof value === 'object' && value !== null ? 'object' :
                              typeof value === 'number' ? 'number' :
                                typeof value === 'boolean' ? 'boolean' : 'string'
                        });
                        setEditCustomAttributeDialog(true);
                      }}
                    >
                      <ListItemText
                        primary={key}
                        secondary={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCustomAttribute({
                              key,
                              value,
                              type: Array.isArray(value) ? 'array' :
                                typeof value === 'object' && value !== null ? 'object' :
                                  typeof value === 'number' ? 'number' :
                                    typeof value === 'boolean' ? 'boolean' : 'string'
                            });
                            setEditCustomAttributeDialog(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete the attribute "${key}"?`)) {
                              handleDeleteCustomAttribute(key);
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItemButton>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No additional attributes defined for this product.
                </Typography>
              )}
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
          {loading ? 'Saving...' : 'Save Product'}
        </Button>
      </DialogActions>

      {/* Add Custom Attribute Dialog */}
      <CustomAttributeDialog
        open={addCustomAttributeDialog}
        onClose={() => setAddCustomAttributeDialog(false)}
        onSave={handleAddCustomAttribute}
        attribute={null}
        existingKeys={Object.keys(customAttrs)}
      />

      {/* Edit Custom Attribute Dialog */}
      <CustomAttributeDialog
        open={editCustomAttributeDialog}
        onClose={() => {
          setEditCustomAttributeDialog(false);
          setEditingCustomAttribute(null);
        }}
        onSave={handleEditCustomAttribute}
        attribute={editingCustomAttribute}
        existingKeys={Object.keys(customAttrs)}
      />
    </Dialog>
  );
};
