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
  List,
  ListItem,
  ListItemText,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemButton,
  Alert,
  Chip,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { gql, useMutation } from '@apollo/client';
import { CustomAttributeDialog } from './CustomAttributeDialog';
import { OutcomeDialog } from './OutcomeDialog';
import { SolutionReleaseDialog } from './SolutionReleaseDialog';

const CREATE_SOLUTION = gql`
  mutation CreateSolution($input: SolutionInput!) {
    createSolution(input: $input) {
      id
      name
      description
      customAttrs
    }
  }
`;

const UPDATE_SOLUTION = gql`
  mutation UpdateSolution($id: ID!, $input: SolutionInput!) {
    updateSolution(id: $id, input: $input) {
      id
      name
      description
      customAttrs
    }
  }
`;

const ADD_PRODUCT_TO_SOLUTION = gql`
  mutation AddProductToSolutionEnhanced($solutionId: ID!, $productId: ID!) {
    addProductToSolutionEnhanced(solutionId: $solutionId, productId: $productId) {
      id
    }
  }
`;

const REMOVE_PRODUCT_FROM_SOLUTION = gql`
  mutation RemoveProductFromSolutionEnhanced($solutionId: ID!, $productId: ID!) {
    removeProductFromSolutionEnhanced(solutionId: $solutionId, productId: $productId) {
      id
    }
  }
`;

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
      id={`solution-tabpanel-${index}`}
      aria-labelledby={`solution-tab-${index}`}
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

interface Solution {
  id: string;
  name: string;
  description?: string;
  customAttrs?: any;
  products?: any;
  outcomes?: any[];
  licenses?: any[];
  releases?: any[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  solution?: Solution | null;
  allProducts: any[];
  initialTab?: 'general' | 'products' | 'outcomes' | 'releases' | 'customAttributes';
}

export const SolutionDialog: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  solution,
  allProducts,
  initialTab = 'general'
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [licenseLevel, setLicenseLevel] = useState<'Essential' | 'Advantage' | 'Signature'>('Essential');
  const [customAttrs, setCustomAttrs] = useState<{ [key: string]: any }>({});
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [solutionOutcomes, setSolutionOutcomes] = useState<Array<{ id?: string; name: string; description?: string; isNew?: boolean; delete?: boolean }>>([]);
  const [releases, setReleases] = useState<Array<{ id?: string; name: string; level: number; description?: string; productReleaseMapping?: any; isNew?: boolean; delete?: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Dialog states for sub-dialogs
  const [addCustomAttributeDialog, setAddCustomAttributeDialog] = useState(false);
  const [editCustomAttributeDialog, setEditCustomAttributeDialog] = useState(false);
  const [editingCustomAttribute, setEditingCustomAttribute] = useState<any>(null);
  const [addOutcomeDialog, setAddOutcomeDialog] = useState(false);
  const [editOutcomeDialog, setEditOutcomeDialog] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<any>(null);
  const [addReleaseDialog, setAddReleaseDialog] = useState(false);
  const [editReleaseDialog, setEditReleaseDialog] = useState(false);
  const [editingRelease, setEditingRelease] = useState<any>(null);

  const [createSolution] = useMutation(CREATE_SOLUTION);
  const [updateSolution] = useMutation(UPDATE_SOLUTION);
  const [addProduct] = useMutation(ADD_PRODUCT_TO_SOLUTION);
  const [removeProduct] = useMutation(REMOVE_PRODUCT_FROM_SOLUTION);

  useEffect(() => {
    if (solution) {
      setName(solution.name || '');
      setDescription(solution.description || '');
      const attrs = solution.customAttrs || {};
      setLicenseLevel(attrs.licenseLevel || 'Essential');
      const { licenseLevel: _, ...otherAttrs } = attrs;
      setCustomAttrs(otherAttrs);
      const productIds = (solution.products?.edges || []).map((edge: any) => edge.node.id);
      setSelectedProductIds(productIds);
      setSolutionOutcomes((solution.outcomes || []).map(o => ({ ...o })));
      setReleases((solution.releases || []).map(r => ({ ...r })));
    } else {
      setName('');
      setDescription('');
      setLicenseLevel('Essential');
      setCustomAttrs({});
      setSelectedProductIds([]);
      setSolutionOutcomes([]);
      setReleases([]);
    }
    setError('');
  }, [solution, open]);

  // Set initial tab based on prop
  useEffect(() => {
    if (open) {
      const tabMap: Record<string, number> = {
        general: 0,
        products: 1,
        outcomes: 2,
        releases: 3,
        customAttributes: 4
      };
      setTabValue(tabMap[initialTab] || 0);
    }
  }, [open, initialTab]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (selectedProductIds.length === 0) {
      setError('Please add at least one product to the solution');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const attrsWithLicense = {
        ...customAttrs,
        licenseLevel
      };

      const input = {
        name: name.trim(),
        description: description.trim() || undefined,
        customAttrs: attrsWithLicense
      };

      let solutionId = solution?.id;

      if (solution) {
        await updateSolution({
          variables: { id: solution.id, input }
        });
      } else {
        const result = await createSolution({
          variables: { input }
        });
        solutionId = result.data.createSolution.id;
      }

      if (solutionId) {
        const existingProductIds = (solution?.products?.edges || []).map((edge: any) => edge.node.id);
        
        for (const productId of selectedProductIds) {
          if (!existingProductIds.includes(productId)) {
            await addProduct({
              variables: { solutionId, productId }
            });
          }
        }

        for (const productId of existingProductIds) {
          if (!selectedProductIds.includes(productId)) {
            await removeProduct({
              variables: { solutionId, productId }
            });
          }
        }
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save solution');
    } finally {
      setLoading(false);
    }
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        const removedProduct = allProducts.find(p => p.id === productId);
        if (removedProduct) {
          setSolutionOutcomes(prevOutcomes =>
            prevOutcomes.filter(outcome => {
              return !outcome.id || outcome.id.indexOf(productId) === -1;
            })
          );
        }
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const inheritedOutcomes = selectedProductIds.flatMap(productId => {
    const product = allProducts.find(p => p.id === productId);
    return (product?.outcomes || []).map((outcome: any) => ({
      ...outcome,
      sourceProductId: productId,
      sourceProductName: product.name,
      inherited: true
    }));
  });

  const allOutcomes = [...inheritedOutcomes, ...solutionOutcomes.filter(o => !o.delete)];

  // Custom Attributes Handlers
  const handleAddCustomAttributeSave = (attribute: { key: string; value: any; type: string }) => {
    setCustomAttrs(prev => ({
      ...prev,
      [attribute.key]: attribute.value
    }));
    setAddCustomAttributeDialog(false);
  };

  const handleEditCustomAttributeSave = (attribute: { key: string; value: any; type: string; oldKey?: string }) => {
    setCustomAttrs(prev => {
      const newAttrs = { ...prev };
      if (attribute.oldKey && attribute.oldKey !== attribute.key) {
        delete newAttrs[attribute.oldKey];
      }
      newAttrs[attribute.key] = attribute.value;
      return newAttrs;
    });
    setEditCustomAttributeDialog(false);
    setEditingCustomAttribute(null);
  };

  const handleDeleteCustomAttribute = (key: string) => {
    if (confirm(`Delete attribute "${key}"?`)) {
      setCustomAttrs(prev => {
        const newAttrs = { ...prev };
        delete newAttrs[key];
        return newAttrs;
      });
    }
  };

  const handleEditCustomAttribute = (attr: any) => {
    setEditingCustomAttribute(attr);
    setEditCustomAttributeDialog(true);
  };

  // Outcome Handlers
  const handleAddOutcomeSave = (outcome: { name: string; description?: string }) => {
    setSolutionOutcomes(prev => [...prev, { ...outcome, isNew: true }]);
    setAddOutcomeDialog(false);
  };

  const handleEditOutcomeSave = (outcome: { name: string; description?: string }) => {
    setSolutionOutcomes(prev =>
      prev.map(o => (o === editingOutcome ? { ...o, ...outcome } : o))
    );
    setEditOutcomeDialog(false);
    setEditingOutcome(null);
  };

  const handleDeleteOutcome = (outcome: any) => {
    if (confirm(`Delete outcome "${outcome.name}"?`)) {
      if (outcome.isNew) {
        setSolutionOutcomes(prev => prev.filter(o => o !== outcome));
      } else {
        setSolutionOutcomes(prev =>
          prev.map(o => (o === outcome ? { ...o, delete: true } : o))
        );
      }
    }
  };

  // Release Handlers
  const handleAddReleaseSave = (release: { name: string; level: number; description?: string; productReleaseMapping: any }) => {
    setReleases(prev => [...prev, { ...release, isNew: true, isActive: true }]);
    setAddReleaseDialog(false);
  };

  const handleEditReleaseSave = (release: { name: string; level: number; description?: string; productReleaseMapping: any }) => {
    setReleases(prev =>
      prev.map(r => (r === editingRelease ? { ...r, ...release } : r))
    );
    setEditReleaseDialog(false);
    setEditingRelease(null);
  };

  const handleDeleteRelease = (release: any) => {
    if (confirm(`Delete release "${release.name}"?`)) {
      if (release.isNew) {
        setReleases(prev => prev.filter(r => r !== release));
      } else {
        setReleases(prev =>
          prev.map(r => (r === release ? { ...r, delete: true } : r))
        );
      }
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const selectedProducts = allProducts.filter(p => selectedProductIds.includes(p.id));
  const availableProducts = allProducts.filter(p => !selectedProductIds.includes(p.id));

  const allProductReleases = selectedProductIds.flatMap(productId => {
    const product = allProducts.find(p => p.id === productId);
    return (product?.releases || []).map((release: any) => ({
      ...release,
      productId,
      productName: product.name
    }));
  });

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
      <DialogTitle>
        {solution ? 'Edit Solution' : 'Add New Solution'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="solution tabs">
            <Tab label="General" />
            <Tab label={`Products (${selectedProductIds.length})`} />
            <Tab label={`Outcomes (${allOutcomes.length})`} />
            <Tab label={`Releases (${releases.filter(r => !r.delete).length})`} />
            <Tab label={`Attributes (${Object.keys(customAttrs).length})`} />
          </Tabs>
        </Box>

        {/* General Tab */}
        <TabPanel value={tabValue} index={0}>
              <TextField
                fullWidth
                label="Solution Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            sx={{ mb: 2 }}
            placeholder="e.g., Enterprise Security Bundle"
            helperText="A descriptive name for your solution bundle"
          />

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
            sx={{ mb: 2 }}
            placeholder="Describe the solution's purpose, scope, and value proposition..."
            helperText="Explain what this solution delivers to customers"
          />

          <FormControl fullWidth required>
            <InputLabel>Solution License Tier</InputLabel>
                <Select
              value={licenseLevel}
              onChange={(e) => setLicenseLevel(e.target.value as any)}
              label="Solution License Tier"
            >
              <MenuItem value="Essential">Essential</MenuItem>
              <MenuItem value="Advantage">Advantage</MenuItem>
              <MenuItem value="Signature">Signature</MenuItem>
                </Select>
              </FormControl>
          <Alert severity="info" sx={{ mt: 1 }}>
            All underlying products will be set to the <strong>{licenseLevel}</strong> tier for simplicity.
          </Alert>
        </TabPanel>

        {/* Products Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select products to bundle into this solution. Customers will adopt all included products together at the {licenseLevel} tier.
          </Typography>

          {selectedProductIds.length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please add at least one product to create a meaningful solution
            </Alert>
          )}

          {selectedProducts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Included Products:
              </Typography>
              <List sx={{ bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                {selectedProducts.map((product, index) => (
                  <ListItem
                    key={product.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleProductToggle(product.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={`${index + 1}. ${product.name}`}
                      secondary={product.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {availableProducts.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Add Products:
              </Typography>
              <List sx={{ bgcolor: 'grey.50', border: '1px solid #e0e0e0', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
                {availableProducts.map((product) => (
                  <ListItemButton
                    key={product.id}
                    onClick={() => handleProductToggle(product.id)}
                    dense
                  >
                    <Checkbox
                      edge="start"
                      checked={false}
                      disableRipple
                    />
                    <ListItemText
                      primary={product.name}
                      secondary={product.description}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          )}
        </TabPanel>

        {/* Outcomes Tab */}
        <TabPanel value={tabValue} index={2}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Outcomes are inherited from products (read-only) and can be supplemented with solution-specific outcomes.
          </Alert>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddOutcomeDialog(true)}
              size="small"
            >
              Add Solution Outcome
            </Button>
          </Box>

          {allOutcomes.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No outcomes yet. Add products or create solution-specific outcomes.
            </Typography>
          ) : (
            <Box>
              {inheritedOutcomes.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                    Inherited from Products:
                  </Typography>
                  <List dense>
                    {inheritedOutcomes.map((outcome, idx) => (
                      <ListItem
                        key={`inherited-${idx}`}
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: '#f5f5f5'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">{outcome.name}</Typography>
                              <Chip
                                label={`From: ${outcome.sourceProductName}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip label="Read-Only" size="small" color="default" variant="outlined" />
                            </Box>
                          }
                          secondary={outcome.description}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {solutionOutcomes.filter(o => !o.delete).length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'secondary.main' }}>
                    Solution-Specific:
                  </Typography>
                  <List dense>
                    {solutionOutcomes.filter(o => !o.delete).map((outcome, idx) => (
                      <ListItemButton
                        key={`solution-${idx}`}
                        onDoubleClick={() => {
                          setEditingOutcome(outcome);
                          setEditOutcomeDialog(true);
                        }}
                        sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}
                      >
                        <ListItemText
                          primary={outcome.name}
                          secondary={outcome.description || 'Double-click to edit'}
                        />
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingOutcome(outcome);
                            setEditOutcomeDialog(true);
                          }}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOutcome(outcome);
                          }}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemButton>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}
        </TabPanel>

        {/* Releases Tab */}
        <TabPanel value={tabValue} index={3}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Solution releases are independent and can map to underlying product releases.
          </Alert>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddReleaseDialog(true)}
              size="small"
            >
              Add Release
            </Button>
          </Box>

          {allProductReleases.length > 0 && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Product Releases Available:
                </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {allProductReleases.map((rel, idx) => (
                  <Chip
                    key={idx}
                    label={`${rel.productName}: ${rel.name} (v${rel.level})`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {releases.filter(r => !r.delete).length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No releases defined yet.
            </Typography>
          ) : (
            <List dense>
              {releases.filter(r => !r.delete).map((release, idx) => {
                // Get mapped product releases for display
                const mappedProductReleases: JSX.Element[] = [];
                if (release.productReleaseMapping) {
                  Object.entries(release.productReleaseMapping).forEach(([productId, releaseIds]) => {
                    const product = allProducts.find(p => p.id === productId);
                    if (!product) return;
                    
                    if ((releaseIds as string[]).includes('__ALL_RELEASES__')) {
                      mappedProductReleases.push(
                        <Chip
                          key={productId}
                          label={`${product.name}: All Releases`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      );
                    } else {
                      (releaseIds as string[]).forEach(releaseId => {
                        const productRelease = product.releases?.find((r: any) => r.id === releaseId);
                        if (productRelease) {
                          mappedProductReleases.push(
                            <Chip
                              key={`${productId}-${releaseId}`}
                              label={`${product.name}: ${productRelease.name} (v${productRelease.level})`}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          );
                        }
                      });
                    }
                  });
                }

                return (
                  <ListItemButton
                    key={idx}
                    onDoubleClick={() => {
                      setEditingRelease(release);
                      setEditReleaseDialog(true);
                    }}
                    sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1, flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight={600}>{release.name}</Typography>
                            <Chip label={`v${release.level}`} size="small" color="primary" variant="outlined" />
                          </Box>
                        }
                        secondary={release.description || 'Double-click to edit'}
                      />
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRelease(release);
                          setEditReleaseDialog(true);
                        }}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRelease(release);
                        }}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    {mappedProductReleases.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', width: '100%' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mr: 1, fontWeight: 600 }}>
                          Includes:
                        </Typography>
                        {mappedProductReleases}
                      </Box>
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </TabPanel>

        {/* Custom Attributes Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddCustomAttributeDialog(true)}
              size="small"
            >
              Add Attribute
            </Button>
          </Box>

          {Object.keys(customAttrs).length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No custom attributes defined.
            </Typography>
          ) : (
            <List dense>
              {Object.entries(customAttrs).map(([key, value]) => (
                <ListItemButton
                  key={key}
                  onDoubleClick={() => handleEditCustomAttribute({ key, value, type: typeof value })}
                  sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}
                >
                  <ListItemText
                    primary={<Typography variant="subtitle2" fontWeight="bold">{key}</Typography>}
                    secondary={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  />
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCustomAttribute({ key, value, type: typeof value });
                    }}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomAttribute(key);
                    }}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemButton>
              ))}
            </List>
          )}
        </TabPanel>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading || !name.trim() || selectedProductIds.length === 0}
        >
          {loading ? 'Saving...' : solution ? 'Update Solution' : 'Create Solution'}
        </Button>
      </DialogActions>
    </Dialog>

      {/* Sub-Dialogs - Rendered outside parent dialog to avoid z-index issues */}
      <CustomAttributeDialog
        open={addCustomAttributeDialog}
        onClose={() => setAddCustomAttributeDialog(false)}
        onSave={handleAddCustomAttributeSave}
        attribute={null}
        existingKeys={Object.keys(customAttrs)}
      />

      <CustomAttributeDialog
        open={editCustomAttributeDialog}
        onClose={() => {
          setEditCustomAttributeDialog(false);
          setEditingCustomAttribute(null);
        }}
        onSave={handleEditCustomAttributeSave}
        attribute={editingCustomAttribute}
        existingKeys={Object.keys(customAttrs)}
      />

      <OutcomeDialog
        open={addOutcomeDialog}
        onClose={() => setAddOutcomeDialog(false)}
        onSave={handleAddOutcomeSave}
        outcome={null}
      />

      <OutcomeDialog
        open={editOutcomeDialog}
        onClose={() => {
          setEditOutcomeDialog(false);
          setEditingOutcome(null);
        }}
        onSave={handleEditOutcomeSave}
        outcome={editingOutcome}
      />

      <SolutionReleaseDialog
        open={addReleaseDialog}
        onClose={() => setAddReleaseDialog(false)}
        onSave={handleAddReleaseSave}
        release={null}
        title="Add Solution Release"
        availableProductReleases={allProductReleases}
      />

      <SolutionReleaseDialog
        open={editReleaseDialog}
        onClose={() => {
          setEditReleaseDialog(false);
          setEditingRelease(null);
        }}
        onSave={handleEditReleaseSave}
        release={editingRelease}
        title="Edit Solution Release"
        availableProductReleases={allProductReleases}
      />
    </>
  );
};
