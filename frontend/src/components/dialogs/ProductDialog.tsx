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
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Tabs,
  Tab
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { License, Outcome, Product, CustomAttribute, Release } from '../../types/shared';
import { ValidationUtils } from '../../utils/sharedHandlers';
import { CustomAttributeDialog } from './CustomAttributeDialog';
import { LicenseDialog } from './LicenseDialog';
import { OutcomeDialog } from './OutcomeDialog';
import { ReleaseDialog } from './ReleaseDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

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
  initialTab?: 'general' | 'outcomes' | 'licenses' | 'releases' | 'customAttributes';
}

export const ProductDialog: React.FC<Props> = ({ 
  open, 
  onClose, 
  onSave, 
  product, 
  title, 
  availableReleases,
  initialTab = 'general'
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customAttrs, setCustomAttrs] = useState<{ [key: string]: any }>({});
  const [outcomes, setOutcomes] = useState<Array<{ id?: string; name: string; description?: string; isNew?: boolean; delete?: boolean }>>([]);
  const [licenses, setLicenses] = useState<Array<{ id?: string; name: string; description?: string; level: number; isActive: boolean; isNew?: boolean; delete?: boolean }>>([]);
  const [releases, setReleases] = useState<Array<{ id?: string; name: string; level: number; description?: string; isNew?: boolean; delete?: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

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
      // New product - set defaults
      setName('');
      setDescription('');
      setOutcomes([{
        name: '',
        description: '',
        isNew: true
      }]);
      setLicenses([{
        name: 'Essential',
        description: 'Basic features',
        level: 1,
        isActive: true,
        isNew: true
      }]);
      setReleases([{
        name: '1.0',
        description: 'Initial release',
        level: 1,
        isNew: true
      }]);
      setCustomAttrs({});
    }
    setError('');
  }, [product, open]);

  // Set initial tab based on prop
  useEffect(() => {
    if (open) {
      const tabMap: Record<string, number> = {
        general: 0,
        outcomes: 1,
        licenses: 2,
        releases: 3,
        customAttributes: 4
      };
      setTabValue(tabMap[initialTab] || 0);
    }
  }, [open, initialTab]);

  // License handlers
  const handleAddLicense = (licenseData: { name: string; description?: string; level: number; isActive: boolean }) => {
    setLicenses([...licenses, {
      ...licenseData,
      isNew: true
    }]);
    setAddLicenseDialog(false);
  };

  const handleEditLicense = (licenseData: { name: string; description?: string; level: number; isActive: boolean }) => {
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
      updatedLicenses[index] = { ...updatedLicenses[index], delete: true };
    } else {
      updatedLicenses.splice(index, 1);
    }
    setLicenses(updatedLicenses);
  };

  const handleEditLicenseClick = (license: any, index: number) => {
    setEditingLicense(license);
    setEditLicenseDialog(true);
  };

  // Outcome handlers
  const handleAddOutcome = (outcomeData: { name: string; description?: string }) => {
    setOutcomes([...outcomes, {
      ...outcomeData,
      isNew: true
    }]);
    setAddOutcomeDialog(false);
  };

  const handleEditOutcome = (outcomeData: { name: string; description?: string }) => {
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
      updatedOutcomes[index] = { ...updatedOutcomes[index], delete: true };
    } else {
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

    if (editingCustomAttribute && editingCustomAttribute.key !== attributeData.key) {
      delete updatedCustomAttrs[editingCustomAttribute.key];
    }

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

  // Release handlers
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
      updatedReleases[index] = { ...updatedReleases[index], delete: true };
    } else {
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
      setError('Product name is required');
      return;
    }

    if (!product) {
      const activeLicenses = licenses.filter(license => !license.delete);
      if (activeLicenses.length === 0) {
        setError('At least one license is required');
        return;
      }

      const activeOutcomes = outcomes.filter(outcome => !outcome.delete);
      if (activeOutcomes.length === 0) {
        setError('At least one outcome is required');
        return;
      }

      const activeReleases = releases.filter(release => !release.delete);
      if (activeReleases.length === 0) {
        setError('At least one release is required');
        return;
      }

      for (const outcome of activeOutcomes) {
        if (!outcome.name.trim()) {
          setError('All outcome names must be specified');
          return;
        }
      }

      for (const license of activeLicenses) {
        if (!license.name.trim()) {
          setError('All license names must be specified');
          return;
        }
      }

      for (const release of activeReleases) {
        if (!release.name.trim()) {
          setError('All release names must be specified');
          return;
        }
      }
    }

    const parsedAttrs = customAttrs;

    const productValidationErrors = ValidationUtils.validateProduct({
      name: name.trim(),
      description: description.trim() || undefined,
      customAttrs: Object.keys(parsedAttrs).length > 0 ? parsedAttrs : undefined
    });

    if (productValidationErrors.length > 0) {
      setError(productValidationErrors.join(', '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        customAttrs: Object.keys(parsedAttrs).length > 0 ? parsedAttrs : undefined,
        outcomes,
        licenses,
        releases
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="product tabs">
            <Tab label="General" />
            <Tab label={`Outcomes (${outcomes.filter(o => !o.delete).length})`} />
            <Tab label={`Licenses (${licenses.filter(l => !l.delete).length})`} />
            <Tab label={`Releases (${releases.filter(r => !r.delete).length})`} />
            <Tab label={`Attributes (${Object.keys(customAttrs).length})`} />
          </Tabs>
        </Box>

        {/* General Tab */}
        <TabPanel value={tabValue} index={0}>
          <TextField
            fullWidth
            label="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={6}
            placeholder="Describe the product's purpose, features, and benefits..."
          />
        </TabPanel>

        {/* Outcomes Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Manage outcomes for this product
            </Typography>
            <Button
              variant="contained"
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
        </TabPanel>

        {/* Licenses Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Manage licenses for this product
            </Typography>
            <Button
              variant="contained"
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
                      secondaryTypographyProps={{ component: 'div' }}
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
        </TabPanel>

        {/* Releases Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Manage releases for this product
            </Typography>
            <Button
              variant="contained"
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
                      secondary={`Level: ${release.level}${release.description ? ` - ${release.description}` : ''}`}
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
        </TabPanel>

        {/* Custom Attributes Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Manage additional metadata for this product
            </Typography>
            <Button
              variant="contained"
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
        </TabPanel>

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
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
      </Dialog>

      {/* Sub-Dialogs - Rendered outside parent dialog to avoid z-index issues */}
      <CustomAttributeDialog
        open={addCustomAttributeDialog}
        onClose={() => setAddCustomAttributeDialog(false)}
        onSave={handleAddCustomAttribute}
        attribute={null}
        existingKeys={Object.keys(customAttrs)}
      />

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

      <OutcomeDialog
        open={addOutcomeDialog}
        onClose={() => setAddOutcomeDialog(false)}
        onSave={handleAddOutcome}
        outcome={null}
      />

      <OutcomeDialog
        open={editOutcomeDialog}
        onClose={() => {
          setEditOutcomeDialog(false);
          setEditingOutcome(null);
        }}
        onSave={handleEditOutcome}
        outcome={editingOutcome}
      />

      <LicenseDialog
        open={addLicenseDialog}
        onClose={() => setAddLicenseDialog(false)}
        onSave={handleAddLicense}
        license={null}
      />

      <LicenseDialog
        open={editLicenseDialog}
        onClose={() => {
          setEditLicenseDialog(false);
          setEditingLicense(null);
        }}
        onSave={handleEditLicense}
        license={editingLicense}
      />

      <ReleaseDialog
        open={addReleaseDialog}
        onClose={() => setAddReleaseDialog(false)}
        onSave={handleAddRelease}
        release={null}
        title="Add Release"
      />

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
    </>
  );
};
