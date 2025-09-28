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
import { License, Outcome, Product, CustomAttribute, Release } from '../../types/shared';
import { ValidationUtils } from '../../utils/sharedHandlers';
import { CustomAttributeDialog } from './CustomAttributeDialog';
import { LicenseDialog } from './LicenseDialog';
import { OutcomeDialog } from './OutcomeDialog';
import { ReleaseDialog } from './ReleaseDialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    customAttrs?: any;
    outcomes?: Array<{ id?: string; name: string; description?: string; isNew?: boolean; delete?: boolean }>;
    licenses?: Array<{ id?: string; name: string; description?: string; level: string; isActive: boolean; isNew?: boolean; delete?: boolean }>;
    releases?: Array<{ id?: string; name: string; level: number; description?: string; isNew?: boolean; delete?: boolean }>;
  }) => Promise<void>;
  product?: Product | null;
  title: string;
  availableReleases: Release[];
}



export const ProductDialog: React.FC<Props> = ({ open, onClose, onSave, product, title, availableReleases }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customAttrs, setCustomAttrs] = useState<{ [key: string]: any }>({});
  const [outcomes, setOutcomes] = useState<Array<{ id?: string; name: string; description?: string; isNew?: boolean; delete?: boolean }>>([]);
  const [licenses, setLicenses] = useState<Array<{ id?: string; name: string; description?: string; level: number; isActive: boolean; isNew?: boolean; delete?: boolean }>>([]);
  const [releases, setReleases] = useState<Array<{ id?: string; name: string; level: number; description?: string; isNew?: boolean; delete?: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dialog states
  const [addCustomAttributeDialog, setAddCustomAttributeDialog] = useState(false);
  const [editCustomAttributeDialog, setEditCustomAttributeDialog] = useState(false);
  const [editingCustomAttribute, setEditingCustomAttribute] = useState<CustomAttribute | null>(null);
  const [addLicenseDialog, setAddLicenseDialog] = useState(false);
  const [editLicenseDialog, setEditLicenseDialog] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [addOutcomeDialog, setAddOutcomeDialog] = useState(false);
  const [editOutcomeDialog, setEditOutcomeDialog] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<Outcome | null>(null);
  const [addReleaseDialog, setAddReleaseDialog] = useState(false);
  const [editReleaseDialog, setEditReleaseDialog] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);

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
      setReleases((product.releases || []).map(release => ({
        id: release.id,
        name: release.name,
        level: release.level,
        description: release.description
      })));
      setCustomAttrs(product.customAttrs || {});
    } else {
      setName('');
      setDescription('');
      setOutcomes([]);
      setLicenses([]);
      setReleases([]);
      setCustomAttrs({
        priority: "medium",
        owner: "",
        department: ""
      });
    }
    setError('');
  }, [product, open]);

  // License dialog handlers
  const handleAddLicense = (licenseData: Omit<License, 'id'>) => {
    setLicenses([...licenses, {
      ...licenseData,
      isNew: true
    }]);
    setAddLicenseDialog(false);
  };

  const handleEditLicense = (licenseData: Omit<License, 'id'>) => {
    if (editingLicense) {
      const updatedLicenses = licenses.map(license => 
        license.id === editingLicense.id || license === editingLicense
          ? { ...license, ...licenseData }
          : license
      );
      setLicenses(updatedLicenses);
    }
    setEditLicenseDialog(false);
    setEditingLicense(null);
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

  const handleEditLicenseClick = (license: any, index: number) => {
    setEditingLicense(license);
    setEditLicenseDialog(true);
  };

  // Outcome dialog handlers
  const handleAddOutcome = (outcomeData: Omit<Outcome, 'id'>) => {
    setOutcomes([...outcomes, {
      ...outcomeData,
      isNew: true
    }]);
    setAddOutcomeDialog(false);
  };

  const handleEditOutcome = (outcomeData: Omit<Outcome, 'id'>) => {
    if (editingOutcome) {
      const updatedOutcomes = outcomes.map(outcome => 
        outcome.id === editingOutcome.id || outcome === editingOutcome
          ? { ...outcome, ...outcomeData }
          : outcome
      );
      setOutcomes(updatedOutcomes);
    }
    setEditOutcomeDialog(false);
    setEditingOutcome(null);
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

  const handleEditOutcomeClick = (outcome: any, index: number) => {
    setEditingOutcome(outcome);
    setEditOutcomeDialog(true);
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

  // Release dialog handlers
  const handleAddRelease = (releaseData: { name: string; level: number; description?: string }) => {
    setReleases([...releases, {
      ...releaseData,
      isNew: true
    }]);
    setAddReleaseDialog(false);
  };

  const handleEditRelease = (releaseData: { name: string; level: number; description?: string }) => {
    if (editingRelease) {
      const updatedReleases = releases.map(release => 
        release.id === editingRelease.id || release === editingRelease
          ? { ...release, ...releaseData }
          : release
      );
      setReleases(updatedReleases);
    }
    setEditReleaseDialog(false);
    setEditingRelease(null);
  };

  const handleDeleteRelease = (index: number) => {
    const updatedReleases = [...releases];
    if (updatedReleases[index].id) {
      // Mark existing release for deletion
      updatedReleases[index] = { ...updatedReleases[index], delete: true };
    } else {
      // Remove new release that wasn't saved yet
      updatedReleases.splice(index, 1);
    }
    setReleases(updatedReleases);
  };

  const handleEditReleaseClick = (release: any, index: number) => {
    setEditingRelease(release);
    setEditReleaseDialog(true);
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
        releases: releases.length > 0 ? releases : undefined
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Manage outcomes for this product
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setAddOutcomeDialog(true)}
                  size="small"
                >
                  Add Outcome
                </Button>
              </Box>

              {outcomes.filter(o => !o.delete).length > 0 ? (
                <List dense>
                  {outcomes.map((outcome, index) =>
                    !outcome.delete && (
                      <ListItemButton
                        key={index}
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                        }}
                        onClick={() => handleEditOutcomeClick(outcome, index)}
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
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditOutcomeClick(outcome, index);
                          }}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOutcome(index);
                          }}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemButton>
                    )
                  )}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No outcomes added yet. Click "Add Outcome" to get started.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Licenses Management */}
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Licenses ({licenses.filter(l => !l.delete).length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Manage licenses for this product
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setAddLicenseDialog(true)}
                  size="small"
                >
                  Add License
                </Button>
              </Box>

              {licenses.filter(l => !l.delete).length > 0 ? (
                <List dense>
                  {licenses.map((license, index) =>
                    !license.delete && (
                      <ListItemButton
                        key={index}
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                        }}
                        onClick={() => handleEditLicenseClick(license, index)}
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
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontWeight: license.isNew ? 'bold' : 'normal'
                            }
                          }}
                        />
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLicenseClick(license, index);
                          }}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLicense(index);
                          }}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemButton>
                    )
                  )}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No licenses added yet. Click "Add License" to get started.
                </Typography>
              )}
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

          {/* Releases Section */}
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Releases ({releases.filter(r => !r.delete).length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Manage releases for this product
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setAddReleaseDialog(true)}
                  size="small"
                >
                  Add Release
                </Button>
              </Box>

              {releases.filter(r => !r.delete).length > 0 ? (
                <List dense>
                  {releases.map((release, index) =>
                    !release.delete && (
                      <ListItemButton
                        key={index}
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                        }}
                        onClick={() => handleEditReleaseClick(release, index)}
                      >
                        <ListItemText
                          primary={release.name}
                          secondary={`Level: ${release.level}`}
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontWeight: release.isNew ? 'bold' : 'normal'
                            }
                          }}
                        />
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditReleaseClick(release, index);
                          }}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRelease(index);
                          }}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemButton>
                    )
                  )}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No releases defined for this product.
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

      {/* Add License Dialog */}
      <LicenseDialog
        open={addLicenseDialog}
        onClose={() => setAddLicenseDialog(false)}
        onSave={handleAddLicense}
        license={null}
      />

      {/* Edit License Dialog */}
      <LicenseDialog
        open={editLicenseDialog}
        onClose={() => {
          setEditLicenseDialog(false);
          setEditingLicense(null);
        }}
        onSave={handleEditLicense}
        license={editingLicense}
      />

      {/* Add Outcome Dialog */}
      <OutcomeDialog
        open={addOutcomeDialog}
        onClose={() => setAddOutcomeDialog(false)}
        onSave={handleAddOutcome}
        outcome={null}
      />

      {/* Edit Outcome Dialog */}
      <OutcomeDialog
        open={editOutcomeDialog}
        onClose={() => {
          setEditOutcomeDialog(false);
          setEditingOutcome(null);
        }}
        onSave={handleEditOutcome}
        outcome={editingOutcome}
      />

      {/* Add Release Dialog */}
      <ReleaseDialog
        open={addReleaseDialog}
        onClose={() => setAddReleaseDialog(false)}
        onSave={handleAddRelease}
        release={null}
        title="Add Release"
      />

      {/* Edit Release Dialog */}
      <ReleaseDialog
        open={editReleaseDialog}
        onClose={() => {
          setEditReleaseDialog(false);
          setEditingRelease(null);
        }}
        onSave={handleEditRelease}
        release={editingRelease}
        title="Edit Release"
      />
    </Dialog>
  );
};
