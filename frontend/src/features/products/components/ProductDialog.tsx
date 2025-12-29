import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Box, Tabs, Tab, Alert
} from '@mui/material';
import { useQuery } from '@apollo/client';
import { Product, ProductTag } from '../types';
import { License } from '@features/product-licenses';
import { Outcome } from '@features/product-outcomes';
import { Release } from '@features/product-releases';

// Shared Components
import { OutcomesTable } from './shared/OutcomesTable';
import { TagsTable } from './shared/TagsTable';
import { ReleasesTable } from './shared/ReleasesTable';
import { LicensesTable } from './shared/LicensesTable';
import { AttributesTable } from './shared/AttributesTable';

// GraphQL & Hook - SAME CODE as ProductsPage
import { PRODUCT } from '../graphql';
import { useProductEditing } from '../hooks/useProductEditing';

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

// Extended types for local state management (only used in create mode)
interface ExtendedOutcome extends Outcome {
  delete?: boolean;
  isNew?: boolean;
  _tempId?: string;
}
interface ExtendedLicense extends License {
  delete?: boolean;
  isNew?: boolean;
  _tempId?: string;
}
interface ExtendedRelease extends Release {
  delete?: boolean;
  isNew?: boolean;
  _tempId?: string;
}
interface ExtendedProductTag extends ProductTag {
  delete?: boolean;
  isNew?: boolean;
  _tempId?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    customAttrs?: Record<string, any>;
    outcomes?: Outcome[];
    licenses?: License[];
    releases?: Release[];
    tags?: ProductTag[];
  }) => Promise<void>;
  productId?: string | null;  // Changed: just pass ID, dialog fetches its own data
  product?: Product | null;   // For backwards compatibility / create mode
  title: string;
  initialTab?: 'general' | 'outcomes' | 'licenses' | 'releases' | 'tags' | 'customAttributes';
}

export const ProductDialog: React.FC<Props> = ({
  open, onClose, onSave, productId: propProductId, product: propProduct, title, initialTab = 'general'
}) => {
  // Determine product ID - prefer explicit productId prop, fall back to product.id
  const productId = propProductId || propProduct?.id || null;
  const isEditMode = !!productId;

  // Query for live product data - SAME QUERY as ProductsPage
  // This ensures both places use the same Apollo cache entry
  const { data: productData } = useQuery(PRODUCT, {
    variables: { id: productId },
    skip: !productId || !open,
    fetchPolicy: 'cache-and-network'
  });

  // Use live data from query, or fall back to prop for create mode
  const product = productData?.product || propProduct || null;

  // Use shared hook for edit mode - SAME CODE as ProductsPage
  const productEditing = useProductEditing(productId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customAttrs, setCustomAttrs] = useState<Record<string, any>>({});

  // Local state only used in CREATE mode (product doesn't exist yet)
  const [outcomes, setOutcomes] = useState<ExtendedOutcome[]>([]);
  const [licenses, setLicenses] = useState<ExtendedLicense[]>([]);
  const [releases, setReleases] = useState<ExtendedRelease[]>([]);
  const [tags, setTags] = useState<ExtendedProductTag[]>([]);

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tabMap: Record<string, number> = { general: 0, outcomes: 1, licenses: 2, releases: 3, tags: 4, customAttributes: 5 };

  useEffect(() => {
    if (open) {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setCustomAttrs(product.customAttrs || {});
        // In edit mode, local arrays aren't used - we read from product prop
    } else {
        // Create mode: initialize local state
      setName('');
      setDescription('');
      setOutcomes([]);
        setTags([]);
        setLicenses([{ name: 'Essential', description: 'Basic', level: 1, isActive: true, isNew: true, _tempId: 'default-lic' } as any]);
        setReleases([{ name: '1.0', description: 'Initial', level: 1, isNew: true, _tempId: 'default-rel' } as any]);
      setCustomAttrs({});
    }
      setTabValue(tabMap[initialTab] || 0);
      setError('');
    }
  }, [product, open, initialTab]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true); setError('');
    try {
      if (isEditMode) {
        // In edit mode, only save General info (name, description)
        // Other tabs use the shared hook which saves immediately
        await onSave({
          name: name.trim(),
          description: description.trim() || undefined,
          customAttrs,
        });
      } else {
        // In create mode, save everything (batch)
        await onSave({
          name: name.trim(),
          description: description.trim() || undefined,
          customAttrs,
          outcomes: getVisibleItems(outcomes),
          licenses: getVisibleItems(licenses),
          releases: getVisibleItems(releases),
          tags: getVisibleItems(tags)
        });
      }
      onClose();
    } catch (e: any) { setError(e.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  // Helper to filter non-deleted items for display (create mode only)
  const getVisibleItems = <T extends { delete?: boolean }>(items: T[]) => items.filter(i => !i.delete);

  // --- CREATE MODE HANDLERS (local state) ---
  const handleOutcomeUpdateLocal = (id: string, updates: Partial<Outcome>) => {
    setOutcomes(prev => prev.map(item => (item.id === id || (item as any)._tempId === id) ? { ...item, ...updates } : item));
  };
  const handleOutcomeDeleteLocal = (id: string) => {
    const item = outcomes.find(i => i.id === id || (i as any)._tempId === id);
    if (!item) return;
    if ((item as any).isNew) {
      setOutcomes(prev => prev.filter(i => i !== item));
    } else {
      setOutcomes(prev => prev.map(i => i === item ? { ...i, delete: true } : i));
    }
  };
  const handleOutcomeCreateLocal = (data: { name: string; description?: string }) => {
    setOutcomes(prev => [...prev, { ...data, isNew: true, _tempId: Math.random().toString(36).substr(2, 9) } as any]);
  };
  const handleOutcomeReorderLocal = (newOrderIds: string[]) => {
    const visible = getVisibleItems(outcomes);
    const deleted = outcomes.filter(i => i.delete);
    const newVisible = newOrderIds.map(id => visible.find(i => i.id === id || (i as any)._tempId === id)).filter(Boolean) as Outcome[];
    setOutcomes([...newVisible, ...deleted]);
  };

  const handleTagUpdateLocal = (id: string, updates: Partial<ProductTag>) => {
    setTags(prev => prev.map(item => (item.id === id || (item as any)._tempId === id) ? { ...item, ...updates } : item));
  };
  const handleTagDeleteLocal = (id: string) => {
    const item = tags.find(i => i.id === id || (i as any)._tempId === id);
    if (!item) return;
    if ((item as any).isNew) {
      setTags(prev => prev.filter(i => i !== item));
    } else {
      setTags(prev => prev.map(i => i === item ? { ...i, delete: true } : i));
    }
  };
  const handleTagCreateLocal = (data: { name: string; color: string; description?: string }) => {
    setTags(prev => [...prev, { ...data, isNew: true, _tempId: Math.random().toString(36).substr(2, 9) } as any]);
  };
  const handleTagReorderLocal = (newOrderIds: string[]) => {
    const visible = getVisibleItems(tags);
    const deleted = tags.filter(i => i.delete);
    const newVisible = newOrderIds.map(id => visible.find(i => i.id === id || (i as any)._tempId === id)).filter(Boolean) as ProductTag[];
    setTags([...newVisible, ...deleted]);
  };

  const handleReleaseUpdateLocal = (id: string, updates: Partial<Release>) => {
    setReleases(prev => prev.map(item => (item.id === id || (item as any)._tempId === id) ? { ...item, ...updates } : item));
  };
  const handleReleaseDeleteLocal = (id: string) => {
    const item = releases.find(i => i.id === id || (i as any)._tempId === id);
    if (!item) return;
    if ((item as any).isNew) {
      setReleases(prev => prev.filter(i => i !== item));
    } else {
      setReleases(prev => prev.map(i => i === item ? { ...i, delete: true } : i));
    }
  };
  const handleReleaseCreateLocal = (data: { name: string; description?: string; level?: number }) => {
    setReleases(prev => [...prev, { ...data, isNew: true, _tempId: Math.random().toString(36).substr(2, 9) } as any]);
  };
  const handleReleaseReorderLocal = (newOrderIds: string[]) => {
    const visible = getVisibleItems(releases);
    const deleted = releases.filter(i => i.delete);
    const newVisible = newOrderIds.map(id => visible.find(i => i.id === id || (i as any)._tempId === id)).filter(Boolean) as Release[];
    setReleases([...newVisible, ...deleted]);
  };

  const handleLicenseUpdateLocal = (id: string, updates: Partial<License>) => {
    setLicenses(prev => prev.map(item => (item.id === id || (item as any)._tempId === id) ? { ...item, ...updates } : item));
  };
  const handleLicenseDeleteLocal = (id: string) => {
    const item = licenses.find(i => i.id === id || (i as any)._tempId === id);
    if (!item) return;
    if ((item as any).isNew) {
      setLicenses(prev => prev.filter(i => i !== item));
    } else {
      setLicenses(prev => prev.map(i => i === item ? { ...i, delete: true } : i));
    }
  };
  const handleLicenseCreateLocal = (data: { name: string; description?: string; level?: number; isActive?: boolean }) => {
    setLicenses(prev => [...prev, { ...data, isNew: true, _tempId: Math.random().toString(36).substr(2, 9) } as any]);
  };
  const handleLicenseReorderLocal = (newOrderIds: string[]) => {
    const visible = getVisibleItems(licenses);
    const deleted = licenses.filter(i => i.delete);
    const newVisible = newOrderIds.map(id => visible.find(i => i.id === id || (i as any)._tempId === id)).filter(Boolean) as License[];
    setLicenses([...newVisible, ...deleted]);
  };

  // Custom Attributes (local for both modes initially, then saved)
  const getLocalAttributesList = () => {
    const order = customAttrs._order || [];
    const keys = Object.keys(customAttrs).filter(k => !k.startsWith('_'));
    keys.sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return keys.map(key => ({ key, value: customAttrs[key] }));
  };

  const handleAttributeUpdateLocal = (oldKey: string, newKey: string, newValue: any) => {
    const updated = { ...customAttrs };
    if (oldKey !== newKey) {
      delete updated[oldKey];
      if (updated._order) {
        const idx = updated._order.indexOf(oldKey);
        if (idx !== -1) updated._order[idx] = newKey;
      }
    }
    updated[newKey] = newValue;
    setCustomAttrs(updated);
  };

  const handleAttributeDeleteLocal = (key: string) => {
    if (!confirm(`Delete attribute "${key}"?`)) return;
    const updated = { ...customAttrs };
    delete updated[key];
    if (updated._order) {
      updated._order = updated._order.filter((k: string) => k !== key);
    }
    setCustomAttrs(updated);
  };

  const handleAttributeCreateLocal = (key: string, value: any) => {
    const updated = { ...customAttrs };
    updated[key] = value;
    const order = updated._order || Object.keys(updated).filter(k => !k.startsWith('_'));
    if (!order.includes(key)) order.push(key);
    updated._order = order;
    setCustomAttrs(updated);
  };

  const handleAttributeReorderLocal = (newKeys: string[]) => {
    setCustomAttrs({ ...customAttrs, _order: newKeys });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: '90vh' } }}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="General" />
          <Tab label={`Tags (${isEditMode ? (product?.tags?.length || 0) : getVisibleItems(tags).length})`} />
          <Tab label={`Outcomes (${isEditMode ? (product?.outcomes?.length || 0) : getVisibleItems(outcomes).length})`} />
          <Tab label={`Releases (${isEditMode ? (product?.releases?.length || 0) : getVisibleItems(releases).length})`} />
          <Tab label={`Licenses (${isEditMode ? (product?.licenses?.length || 0) : getVisibleItems(licenses).length})`} />
          <Tab label={`Custom Attributes (${isEditMode ? productEditing.getAttributesList(product?.customAttrs).length : getLocalAttributesList().length})`} />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {isEditMode && tabValue !== 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Changes are saved immediately.
          </Alert>
        )}

          <TabPanel value={tabValue} index={0}>
          <TextField fullWidth label="Name" value={name} onChange={e => setName(e.target.value)} required sx={{ mb: 2 }} />
          <TextField fullWidth label="Description" value={description} onChange={e => setDescription(e.target.value)} multiline rows={4} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
          <TagsTable
            items={isEditMode ? (product?.tags || []) : getVisibleItems(tags)}
            onUpdate={isEditMode ? productEditing.handleTagUpdate : handleTagUpdateLocal}
            onDelete={isEditMode ? productEditing.handleTagDelete : handleTagDeleteLocal}
            onCreate={isEditMode ? productEditing.handleTagCreate : handleTagCreateLocal}
            onReorder={isEditMode ? productEditing.handleTagReorder : handleTagReorderLocal}
          />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
          <OutcomesTable
            items={isEditMode ? (product?.outcomes || []) : getVisibleItems(outcomes)}
            onUpdate={isEditMode ? productEditing.handleOutcomeUpdate : handleOutcomeUpdateLocal}
            onDelete={isEditMode ? productEditing.handleOutcomeDelete : handleOutcomeDeleteLocal}
            onCreate={isEditMode ? productEditing.handleOutcomeCreate : handleOutcomeCreateLocal}
            onReorder={isEditMode ? productEditing.handleOutcomeReorder : handleOutcomeReorderLocal}
          />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
          <ReleasesTable
            items={isEditMode ? (product?.releases || []) : getVisibleItems(releases)}
            onUpdate={isEditMode ? productEditing.handleReleaseUpdate : handleReleaseUpdateLocal}
            onDelete={isEditMode ? productEditing.handleReleaseDelete : handleReleaseDeleteLocal}
            onCreate={isEditMode ? productEditing.handleReleaseCreate : handleReleaseCreateLocal}
            onReorder={isEditMode ? productEditing.handleReleaseReorder : handleReleaseReorderLocal}
          />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
          <LicensesTable
            items={isEditMode ? (product?.licenses || []) : getVisibleItems(licenses)}
            onUpdate={isEditMode ? productEditing.handleLicenseUpdate : handleLicenseUpdateLocal}
            onDelete={isEditMode ? productEditing.handleLicenseDelete : handleLicenseDeleteLocal}
            onCreate={isEditMode ? productEditing.handleLicenseCreate : handleLicenseCreateLocal}
            onReorder={isEditMode ? productEditing.handleLicenseReorder : handleLicenseReorderLocal}
          />
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
          <AttributesTable
            items={isEditMode ? productEditing.getAttributesList(product?.customAttrs) : getLocalAttributesList()}
            onUpdate={isEditMode ? productEditing.handleAttributeUpdate : handleAttributeUpdateLocal}
            onDelete={isEditMode ? productEditing.handleAttributeDelete : handleAttributeDeleteLocal}
            onCreate={isEditMode ? productEditing.handleAttributeCreate : handleAttributeCreateLocal}
            onReorder={isEditMode ? productEditing.handleAttributeReorder : handleAttributeReorderLocal}
          />
          </TabPanel>

        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {isEditMode ? 'Done' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>
  );
};
