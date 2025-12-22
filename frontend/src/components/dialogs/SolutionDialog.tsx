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
  Tab,
  Card,
  CardContent
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Badge as BadgeIcon
} from '@shared/components/FAIcon';
import { gql, useMutation, useApolloClient } from '@apollo/client';
import { CustomAttributeDialog } from './CustomAttributeDialog';
import { OutcomeDialog } from './OutcomeDialog';
import { SolutionReleaseDialog } from './SolutionReleaseDialog';
import { LicenseDialog } from './LicenseDialog';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableAttributeItem } from '../SortableAttributeItem';

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
  mutation AddProductToSolutionEnhanced($solutionId: ID!, $productId: ID!, $order: Int) {
    addProductToSolutionEnhanced(solutionId: $solutionId, productId: $productId, order: $order)
  }
`;

const REMOVE_PRODUCT_FROM_SOLUTION = gql`
  mutation RemoveProductFromSolutionEnhanced($solutionId: ID!, $productId: ID!) {
    removeProductFromSolutionEnhanced(solutionId: $solutionId, productId: $productId)
  }
`;

const REORDER_PRODUCTS_IN_SOLUTION = gql`
  mutation ReorderProductsInSolution($solutionId: ID!, $productOrders: [ProductOrderInput!]!) {
    reorderProductsInSolution(solutionId: $solutionId, productOrders: $productOrders)
  }
`;

const CREATE_OUTCOME = gql`
  mutation CreateOutcome($input: OutcomeInput!) {
    createOutcome(input: $input) {
      id
      name
      description
    }
  }
`;

const UPDATE_OUTCOME = gql`
  mutation UpdateOutcome($id: ID!, $input: OutcomeInput!) {
    updateOutcome(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

const DELETE_OUTCOME = gql`
  mutation DeleteOutcome($id: ID!) {
    deleteOutcome(id: $id)
  }
`;

const CREATE_RELEASE = gql`
  mutation CreateRelease($input: ReleaseInput!) {
    createRelease(input: $input) {
      id
      name
      description
      level
    }
  }
`;

const UPDATE_RELEASE = gql`
  mutation UpdateRelease($id: ID!, $input: ReleaseInput!) {
    updateRelease(id: $id, input: $input) {
      id
      name
      description
      level
    }
  }
`;

const DELETE_RELEASE = gql`
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;

const CREATE_LICENSE = gql`
  mutation CreateLicense($input: LicenseInput!) {
    createLicense(input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

const UPDATE_LICENSE = gql`
  mutation UpdateLicense($id: ID!, $input: LicenseInput!) {
    updateLicense(id: $id, input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

const DELETE_LICENSE = gql`
  mutation DeleteLicense($id: ID!) {
    deleteLicense(id: $id)
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
  initialTab?: 'general' | 'products' | 'outcomes' | 'releases' | 'licenses' | 'customAttributes';
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
  const [customAttrs, setCustomAttrs] = useState<{ [key: string]: any }>({});
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [solutionOutcomes, setSolutionOutcomes] = useState<Array<{ id?: string; name: string; description?: string; isNew?: boolean; delete?: boolean }>>([]);
  const [releases, setReleases] = useState<Array<{ id?: string; name: string; level: number; description?: string; productReleaseMapping?: any; customAttrs?: any; isActive?: boolean; isNew?: boolean; delete?: boolean }>>([]);
  const [licenses, setLicenses] = useState<Array<{ id?: string; name: string; level: number; description?: string; isActive: boolean; customAttrs?: any; isNew?: boolean; delete?: boolean }>>([]);
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
  const [editingRelease, setEditingRelease] = useState<any | null>(null);
  const [addLicenseDialog, setAddLicenseDialog] = useState(false);
  const [editLicenseDialog, setEditLicenseDialog] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const client = useApolloClient();

  const [createSolution] = useMutation(CREATE_SOLUTION, {
    refetchQueries: ['Solutions'],
    awaitRefetchQueries: true,
    fetchPolicy: 'network-only'
  });
  const [updateSolution] = useMutation(UPDATE_SOLUTION, {
    refetchQueries: ['Solutions'],
    awaitRefetchQueries: true,
    fetchPolicy: 'network-only',
    onCompleted: () => {
      // Force evict solution from cache to prevent stale data merging
      if (solution?.id) {
        client.cache.evict({ id: `Solution:${solution.id}` });
        client.cache.gc();
      }
    }
  });
  const [addProduct] = useMutation(ADD_PRODUCT_TO_SOLUTION);
  const [removeProduct] = useMutation(REMOVE_PRODUCT_FROM_SOLUTION);
  const [reorderProducts] = useMutation(REORDER_PRODUCTS_IN_SOLUTION);
  const [createOutcome] = useMutation(CREATE_OUTCOME);
  const [updateOutcome] = useMutation(UPDATE_OUTCOME);
  const [deleteOutcome] = useMutation(DELETE_OUTCOME);
  const [createRelease] = useMutation(CREATE_RELEASE);
  const [updateRelease] = useMutation(UPDATE_RELEASE);
  const [deleteRelease] = useMutation(DELETE_RELEASE);
  const [createLicense] = useMutation(CREATE_LICENSE);
  const [updateLicense] = useMutation(UPDATE_LICENSE);
  const [deleteLicense] = useMutation(DELETE_LICENSE);

  useEffect(() => {
    if (solution) {
      setName(solution.name || '');
      setDescription(solution.description || '');
      const attrs = solution.customAttrs || {};
      const cleanedAttrs = Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.toLowerCase() !== 'licenselevel')
      );
      setCustomAttrs(cleanedAttrs);
      const productIds = (solution.products?.edges || []).map((edge: any) => edge.node.id);
      setSelectedProductIds(productIds);
      setSolutionOutcomes((solution.outcomes || []).map(o => ({ ...o })));
      setReleases((solution.releases || []).map(r => ({ ...r })));
      setLicenses((solution.licenses || []).map(l => ({ ...l })));

    } else {
      setName('');
      setDescription('');
      setCustomAttrs({});
      setSelectedProductIds([]);
      setSolutionOutcomes([]);
      setReleases([]);
      setLicenses([]);
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
        licenses: 4,
        customAttributes: 5
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
      const cleanedCustomAttrs = Object.fromEntries(
        Object.entries(customAttrs).filter(([key]) => key.toLowerCase() !== 'licenselevel')
      );

      const input = {
        name: name.trim(),
        description: description.trim() || undefined,
        customAttrs: cleanedCustomAttrs
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

        // First, remove products that are no longer selected
        for (const productId of existingProductIds) {
          if (!selectedProductIds.includes(productId)) {
            await removeProduct({
              variables: { solutionId, productId }
            });
          }
        }

        // Then, add new products
        for (let i = 0; i < selectedProductIds.length; i++) {
          const productId = selectedProductIds[i];
          if (!existingProductIds.includes(productId)) {
            await addProduct({
              variables: {
                solutionId,
                productId,
                order: i + 1
              }
            });
          }
        }

        // Reorder
        const productOrders = selectedProductIds.map((productId, index) => ({
          productId,
          order: index + 1
        }));

        await reorderProducts({
          variables: { solutionId, productOrders }
        });
      }

      // Save outcomes
      if (solutionId) {
        for (const outcome of solutionOutcomes) {
          if (outcome.delete && outcome.id) {
            await deleteOutcome({ variables: { id: outcome.id } });
          } else if (outcome.isNew && !outcome.delete) {
            await createOutcome({
              variables: {
                input: {
                  name: outcome.name,
                  description: outcome.description || undefined,
                  solutionId: solutionId
                }
              }
            });
          } else if (!outcome.isNew && !outcome.delete && outcome.id) {
            await updateOutcome({
              variables: {
                id: outcome.id,
                input: {
                  name: outcome.name,
                  description: outcome.description || undefined,
                  solutionId: solutionId
                }
              }
            });
          }
        }
      }

      // Save releases
      if (solutionId) {
        for (const release of releases) {
          if (release.delete && release.id) {
            await deleteRelease({ variables: { id: release.id } });
          } else if (release.isNew && !release.delete) {
            await createRelease({
              variables: {
                input: {
                  name: release.name,
                  level: release.level,
                  description: release.description,
                  isActive: release.isActive,
                  solutionId: solutionId,
                  customAttrs: release.customAttrs
                }
              }
            });
          } else if (!release.isNew && !release.delete && release.id) {
            await updateRelease({
              variables: {
                id: release.id,
                input: {
                  name: release.name,
                  level: release.level,
                  description: release.description,
                  isActive: release.isActive,
                  solutionId: solutionId,
                  customAttrs: release.customAttrs
                }
              }
            });
          }
        }
      }

      // Save licenses
      if (solutionId) {
        // Handle solution-specific licenses
        for (const license of licenses) {
          if (license.delete && license.id) {
            await deleteLicense({ variables: { id: license.id } });
          } else if (license.isNew && !license.delete) {
            await createLicense({
              variables: {
                input: {
                  name: license.name,
                  level: license.level,
                  description: license.description,
                  isActive: license.isActive,
                  solutionId: solutionId,
                  customAttrs: license.customAttrs
                }
              }
            });
          } else if (!license.isNew && !license.delete && license.id) {
            await updateLicense({
              variables: {
                id: license.id,
                input: {
                  name: license.name,
                  level: license.level,
                  description: license.description,
                  isActive: license.isActive,
                  solutionId: solutionId,
                  customAttrs: license.customAttrs
                }
              }
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

  const allOutcomes = [...solutionOutcomes.filter(o => !o.delete), ...inheritedOutcomes];

  const handleAddCustomAttributeSave = (attribute: { key: string; value: any; type: string }) => {
    setCustomAttrs(prev => ({ ...prev, [attribute.key]: attribute.value }));
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
    const updatedCustomAttrs = { ...customAttrs };
    delete updatedCustomAttrs[key];
    if (updatedCustomAttrs._order) {
      updatedCustomAttrs._order = updatedCustomAttrs._order.filter((k: string) => k !== key);
    }
    setCustomAttrs(updatedCustomAttrs);
  };

  const handleAttributeDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const currentKeys = Object.keys(customAttrs).filter(k => k !== '_order' && k !== '__typename');
      const order = customAttrs._order || currentKeys;
      const completeOrder = [...new Set([...order, ...currentKeys])].filter(k => customAttrs[k] !== undefined);
      const oldIndex = completeOrder.indexOf(active.id);
      const newIndex = completeOrder.indexOf(over.id);
      const newOrder = arrayMove(completeOrder, oldIndex, newIndex);
      setCustomAttrs({ ...customAttrs, _order: newOrder });
    }
  };

  const getSortedAttributes = (attrs: any) => {
    if (!attrs) return [];
    const order = attrs._order || [];
    const entries = Object.entries(attrs).filter(([k]) => k !== '_order' && k !== '__typename');
    return entries.sort((a, b) => {
      const indexA = order.indexOf(a[0]);
      const indexB = order.indexOf(b[0]);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  const handleEditCustomAttribute = (attr: any) => {
    setEditingCustomAttribute(attr);
    setEditCustomAttributeDialog(true);
  };

  const handleAddOutcomeSave = (outcome: { name: string; description?: string }) => {
    setSolutionOutcomes(prev => [...prev, { ...outcome, isNew: true }]);
    setAddOutcomeDialog(false);
  };

  const handleEditOutcomeSave = (outcome: { name: string; description?: string }) => {
    setSolutionOutcomes(prev => prev.map(o => (o === editingOutcome ? { ...o, ...outcome } : o)));
    setEditOutcomeDialog(false);
    setEditingOutcome(null);
  };

  const handleDeleteOutcome = (outcome: any) => {
    if (confirm(`Delete outcome "${outcome.name}"?`)) {
      if (outcome.isNew) {
        setSolutionOutcomes(prev => prev.filter(o => o !== outcome));
      } else {
        setSolutionOutcomes(prev => prev.map(o => (o === outcome ? { ...o, delete: true } : o)));
      }
    }
  };

  const handleAddReleaseSave = (release: { name: string; level: number; description?: string; customAttrs: { productReleaseMapping: { [productId: string]: string[] } } }) => {
    setReleases(prev => [...prev, { ...release, isNew: true, isActive: true }]);
    setAddReleaseDialog(false);
  };

  const handleEditReleaseSave = (release: { name: string; level: number; description?: string; customAttrs?: { productReleaseMapping?: { [productId: string]: string[] } } }) => {
    setReleases(prev => prev.map(r => (r === editingRelease ? { ...r, ...release } : r)));
    setEditReleaseDialog(false);
    setEditingRelease(null);
  };

  const handleDeleteRelease = (release: any) => {
    if (confirm(`Delete release "${release.name}"?`)) {
      if (release.isNew) {
        setReleases(prev => prev.filter(r => r !== release));
      } else {
        setReleases(prev => prev.map(r => (r === release ? { ...r, delete: true } : r)));
      }
    }
  };

  const handleAddLicenseSave = (license: { name: string; level: number; description?: string; isActive: boolean; customAttrs?: any }) => {
    setLicenses(prev => [...prev, { ...license, isNew: true }]);
    setAddLicenseDialog(false);
  };

  const handleEditLicenseSave = (license: { name: string; level: number; description?: string; isActive: boolean; customAttrs?: any }) => {
    setLicenses(prev => prev.map(l => (l === editingLicense ? { ...l, ...license } : l)));
    setEditLicenseDialog(false);
    setEditingLicense(null);
  };

  const handleDeleteLicense = (license: any) => {
    if (confirm(`Delete license "${license.name}"?`)) {
      if (license.isNew) {
        setLicenses(prev => prev.filter(l => l !== license));
      } else {
        setLicenses(prev => prev.map(l => (l === license ? { ...l, delete: true } : l)));
      }
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => setTabValue(newValue);

  const selectedProducts = selectedProductIds
    .map(id => allProducts.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);
  const availableProducts = allProducts.filter(p => !selectedProductIds.includes(p.id));

  const allProductLicenses = selectedProductIds.flatMap(productId => {
    const product = allProducts.find(p => p.id === productId);
    return (product?.licenses || []).map((license: any) => ({
      ...license,
      productId,
      productName: product.name
    }));
  });

  const allProductReleases = selectedProductIds.flatMap(productId => {
    const product = allProducts.find(p => p.id === productId);
    return (product?.releases || []).map((release: any) => ({
      ...release,
      productId,
      productName: product.name
    }));
  });

  const renderMappingInfo = (item: any, type: 'licenses' | 'releases') => {
    const mappingKey = type === 'licenses' ? 'productLicenseMapping' : 'productReleaseMapping';
    const mapping = item.customAttrs?.[mappingKey];

    if (!mapping || Object.keys(mapping).length === 0) return null;

    const productCount = Object.keys(mapping).length;
    const totalItems = Object.values(mapping).flat().length;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const isAll = Object.values(mapping).flat().includes('__ALL__') || Object.values(mapping).flat().includes('ALL');

    return (
      <Box sx={{ mt: 0.5, display: 'flex', gap: 1, alignItems: 'center' }}>
        <Chip
          label={isAll ? `Mapped to All Product ${type === 'licenses' ? 'Licenses' : 'Releases'}` : `Mapped to ${totalItems} ${type === 'licenses' ? 'Licenses' : 'Releases'} across ${productCount} Product(s)`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ height: 20, fontSize: '0.7rem' }}
        />
      </Box>
    );
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: '90vh' } }}>
        <DialogTitle>{solution ? 'Edit Solution' : 'Add New Solution'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="General" />
              <Tab label={`Products (${selectedProductIds.length})`} />
              <Tab label={`Outcomes (${allOutcomes.length})`} />
              <Tab label={`Releases (${releases.filter(r => !r.delete).length})`} />
              <Tab label={`Licenses (${licenses.filter(l => !l.delete).length})`} />
              <Tab label={`Attributes (${Object.keys(customAttrs).length})`} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <TextField fullWidth label="Solution Name" value={name} onChange={(e) => setName(e.target.value)} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={4} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Select products to bundle into this solution.</Typography>
            {selectedProducts.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Included Products:</Typography>
                <List sx={{ bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  {selectedProducts.map((product, index) => (
                    <ListItem
                      key={product.id}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleProductToggle(product.id)} color="error"><DeleteIcon /></IconButton>
                      }
                    >
                      <ListItemText primary={`${index + 1}. ${product.name}`} secondary={product.description} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Add Products:</Typography>
              <List sx={{ bgcolor: 'grey.50', border: '1px solid #e0e0e0', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
                {availableProducts.map((product) => (
                  <ListItemButton key={product.id} onClick={() => handleProductToggle(product.id)} dense>
                    <Checkbox edge="start" checked={false} disableRipple />
                    <ListItemText primary={product.name} secondary={product.description} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOutcomeDialog(true)} size="small">Add Outcome</Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {solutionOutcomes.filter(o => !o.delete).map((outcome, idx) => (
                <Card key={idx} variant="outlined">
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{outcome.name}</Typography>
                          {outcome.isNew && <Chip label="New" size="small" color="success" variant="outlined" />}
                        </Box>
                        <Typography variant="body2" color="text.secondary">{outcome.description}</Typography>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => { setEditingOutcome(outcome); setEditOutcomeDialog(true); }}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteOutcome(outcome)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              {inheritedOutcomes.length > 0 && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="primary">Inherited from Products:</Typography>
                  {inheritedOutcomes.map((outcome, idx) => (
                    <Card key={`inh-${idx}`} variant="outlined" sx={{ bgcolor: '#f9f9f9' }}>
                      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{outcome.name} <Chip label={outcome.sourceProductName} size="small" /></Typography>
                        <Typography variant="body2" color="text.secondary">{outcome.description}</Typography>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddReleaseDialog(true)} size="small">Add Solution Release</Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Solution-Specific Releases:</Typography>
              {releases.filter(r => !r.delete).map((release, idx) => (
                <Card key={idx} variant="outlined">
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{release.name} <Chip label={`Level ${release.level}`} size="small" /></Typography>
                        <Typography variant="body2" color="text.secondary">{release.description}</Typography>
                        {renderMappingInfo(release, 'releases')}
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => { setEditingRelease(release); setEditReleaseDialog(true); }}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteRelease(release)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              {releases.filter(r => !r.delete).length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', ml: 1 }}>No solution-specific releases.</Typography>
              )}


            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddLicenseDialog(true)} size="small">Add Solution License</Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Solution-Specific Licenses:</Typography>
              {licenses.filter(l => !l.delete).map((license, idx) => (
                <Card key={idx} variant="outlined">
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{license.name}</Typography>
                          <Chip label={`Level ${license.level}`} size="small" />
                          {!license.isActive && <Chip label="Inactive" size="small" color="warning" />}
                        </Box>
                        <Typography variant="body2" color="text.secondary">{license.description}</Typography>
                        {renderMappingInfo(license, 'licenses')}
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => { setEditingLicense(license); setEditLicenseDialog(true); }}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteLicense(license)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              {licenses.filter(l => !l.delete).length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', ml: 1 }}>No solution-specific licenses.</Typography>
              )}



            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddCustomAttributeDialog(true)} size="small">Add Attribute</Button>
            </Box>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAttributeDragEnd}>
              <SortableContext items={getSortedAttributes(customAttrs).map(([k]) => k)} strategy={verticalListSortingStrategy}>
                <List dense>
                  {getSortedAttributes(customAttrs).map(([key, value]) => (
                    <SortableAttributeItem
                      key={key}
                      attrKey={key}
                      value={value}
                      onEdit={() => handleEditCustomAttribute({ key, value, type: typeof value })}
                      onDelete={() => handleDeleteCustomAttribute(key)}
                    />
                  ))}
                </List>
              </SortableContext>
            </DndContext>
          </TabPanel>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading || !name.trim() || selectedProductIds.length === 0}>
            {loading ? 'Saving...' : solution ? 'Update Solution' : 'Create Solution'}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomAttributeDialog
        open={addCustomAttributeDialog || editCustomAttributeDialog}
        onClose={() => { setAddCustomAttributeDialog(false); setEditCustomAttributeDialog(false); setEditingCustomAttribute(null); }}
        onSave={addCustomAttributeDialog ? handleAddCustomAttributeSave : handleEditCustomAttributeSave}
        attribute={editingCustomAttribute}
        existingKeys={Object.keys(customAttrs)}
      />

      <OutcomeDialog
        open={addOutcomeDialog || editOutcomeDialog}
        onClose={() => { setAddOutcomeDialog(false); setEditOutcomeDialog(false); setEditingOutcome(null); }}
        onSave={addOutcomeDialog ? handleAddOutcomeSave : handleEditOutcomeSave}
        outcome={editingOutcome}
      />

      <SolutionReleaseDialog
        open={addReleaseDialog || editReleaseDialog}
        onClose={() => { setAddReleaseDialog(false); setEditReleaseDialog(false); setEditingRelease(null); }}
        onSave={addReleaseDialog ? handleAddReleaseSave : handleEditReleaseSave}
        release={editingRelease}
        title={editingRelease ? 'Edit Solution Release' : 'Add Solution Release'}
        availableProductReleases={allProductReleases}
      />

      <LicenseDialog
        open={addLicenseDialog || editLicenseDialog}
        onClose={() => { setAddLicenseDialog(false); setEditLicenseDialog(false); setEditingLicense(null); }}
        onSave={addLicenseDialog ? handleAddLicenseSave : handleEditLicenseSave}
        license={editingLicense}
        availableProductLicenses={allProductLicenses}
        title={editingLicense ? 'Edit Solution License' : 'Add Solution License'}
      />
    </>
  );
};
