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
  IconButton,
  Alert,
  Chip,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@shared/components/FAIcon';
import { gql, useMutation, useApolloClient, useQuery } from '@apollo/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableAttributeItem } from '@shared/components/SortableAttributeItem';
import { License } from '@features/product-licenses';
import { Outcome } from '@features/product-outcomes';
import { Release } from '@features/product-releases';
import { Resource } from '@shared/types';
import { ResourcesTable } from '@features/products/components/shared/ResourcesTable';
import {
  InlineOutcomeEditor,
  AddOutcomeForm,
  SortableProductItem,
  InlineSolutionLicenseEditor,
  AddSolutionLicenseForm,
  InlineSolutionReleaseEditor,
  AddSolutionReleaseForm,
  InlineTagEditor,
  AddTagForm,
} from '@shared/components/inline-editors';
import { ConfirmDialog } from '@shared/components';

// GraphQL & Hook - SAME CODE as SolutionsPage
import { SOLUTION } from '../graphql/solutions.queries';
import { useSolutionEditing } from '../hooks/useSolutionEditing';
import { CREATE_SOLUTION_TAG, UPDATE_SOLUTION_TAG, DELETE_SOLUTION_TAG } from '@features/tags';
import { PRODUCTS } from '@features/products';

const CREATE_SOLUTION = gql`
  mutation CreateSolutionDialog($input: SolutionInput!) {
    createSolution(input: $input) {
      id
      name
      resources { label url }
      customAttrs
    }
  }
`;

const UPDATE_SOLUTION = gql`
  mutation UpdateSolutionDialog($id: ID!, $input: SolutionInput!) {
    updateSolution(id: $id, input: $input) {
      id
      name
      resources { label url }
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
  mutation CreateOutcomeSolutionDialog($input: OutcomeInput!) {
    createOutcome(input: $input) {
      id
      name
      description
    }
  }
`;

const UPDATE_OUTCOME = gql`
  mutation UpdateOutcomeSolutionDialog($id: ID!, $input: OutcomeInput!) {
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
  mutation CreateReleaseSolutionDialog($input: ReleaseInput!) {
    createRelease(input: $input) {
      id
      name
      description
      level
    }
  }
`;

const UPDATE_RELEASE = gql`
  mutation UpdateReleaseSolutionDialog($id: ID!, $input: ReleaseInput!) {
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
  mutation CreateLicenseSolutionDialog($input: LicenseInput!) {
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
  mutation UpdateLicenseSolutionDialog($id: ID!, $input: LicenseInput!) {
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
  resources?: Resource[];
  customAttrs?: any;
  products?: any;
  outcomes?: any[];
  licenses?: any[];
  releases?: any[];
  tags?: any[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  solutionId?: string | null;  // Changed: just pass ID, dialog fetches its own data
  solution?: Solution | null;   // For backwards compatibility / create mode
  allProducts?: any[];  // Optional - dialog will fetch its own fresh data
  initialTab?: 'general' | 'products' | 'outcomes' | 'releases' | 'licenses' | 'tags' | 'customAttributes';
}

export const SolutionDialog: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  solutionId: propSolutionId,
  solution: propSolution,
  allProducts: propAllProducts,
  initialTab = 'general'
}) => {
  // Determine solution ID - prefer explicit solutionId prop, fall back to solution.id
  const solutionId = propSolutionId || propSolution?.id || null;
  const isEditMode = !!solutionId;

  // Query for live solution data - SAME QUERY as SolutionsPage
  // This ensures both places use the same Apollo cache entry
  const { data: solutionData } = useQuery(SOLUTION, {
    variables: { id: solutionId },
    skip: !solutionId || !open,
    fetchPolicy: 'cache-and-network'
  });

  // Query for fresh products data - ensures we always have current product info
  const { data: productsData } = useQuery(PRODUCTS, {
    skip: !open,
    fetchPolicy: 'cache-and-network'  // Always fetch fresh data when dialog opens
  });

  // Use fresh products data from query, fall back to prop if not available
  const allProducts = productsData?.products?.edges?.map((e: any) => e.node) || propAllProducts || [];

  // Use live data from query, or fall back to prop for create mode
  const solution = solutionData?.solution || propSolution || null;

  // Use shared hook for edit mode - SAME CODE as SolutionsPage
  const solutionEditing = useSolutionEditing(solutionId);

  const [name, setName] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [customAttrs, setCustomAttrs] = useState<{ [key: string]: any }>({});
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [solutionOutcomes, setSolutionOutcomes] = useState<Outcome[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Inline editing states
  const [editingOutcomeIndex, setEditingOutcomeIndex] = useState<number | null>(null);
  const [addingOutcome, setAddingOutcome] = useState(false);
  const [editingReleaseIndex, setEditingReleaseIndex] = useState<number | null>(null);
  const [addingRelease, setAddingRelease] = useState(false);
  const [editingLicenseIndex, setEditingLicenseIndex] = useState<number | null>(null);
  const [addingLicense, setAddingLicense] = useState(false);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [addingTag, setAddingTag] = useState(false);
  const [inlineAttrKey, setInlineAttrKey] = useState<string | null>(null);
  const [inlineAttrDraft, setInlineAttrDraft] = useState<{ key: string; value: string }>({ key: '', value: '' });
  const [productToAdd, setProductToAdd] = useState<string>('');
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

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
  const [deleteOutcomeMut] = useMutation(DELETE_OUTCOME);
  const [createRelease] = useMutation(CREATE_RELEASE);
  const [updateRelease] = useMutation(UPDATE_RELEASE);
  const [deleteReleaseMut] = useMutation(DELETE_RELEASE);
  const [createLicense] = useMutation(CREATE_LICENSE);
  const [updateLicenseMut] = useMutation(UPDATE_LICENSE);
  const [deleteLicenseMut] = useMutation(DELETE_LICENSE);
  const [createTag] = useMutation(CREATE_SOLUTION_TAG);
  const [updateTag] = useMutation(UPDATE_SOLUTION_TAG);
  const [deleteTagMut] = useMutation(DELETE_SOLUTION_TAG);

  // Helper to refetch solution data
  const refetchSolution = async () => {
    await client.refetchQueries({ include: ['Solutions', 'SolutionDetail'] });
  };

  useEffect(() => {
    if (solution) {
      setName(solution.name || '');
      setResources(solution.resources || []);
      const attrs = solution.customAttrs || {};
      const cleanedAttrs = Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.toLowerCase() !== 'licenselevel')
      );
      setCustomAttrs(cleanedAttrs);
      const productIds = (solution.products?.edges || []).map((edge: any) => edge.node.id);
      setSelectedProductIds(productIds);
      setSolutionOutcomes((solution.outcomes || []).map((o: any) => ({ ...o })));
      setReleases((solution.releases || []).map((r: any) => ({ ...r })));
      setLicenses((solution.licenses || []).map((l: any) => ({ ...l })));
      setTags((solution.tags || []).map((t: any) => ({ ...t })));
    } else {
      setName('');
      setResources([]);
      setCustomAttrs({});
      setSelectedProductIds([]);
      setSolutionOutcomes([]);
      setReleases([]);
      setLicenses([]);
      setTags([]);
    }
    // Reset inline editing states
    setEditingOutcomeIndex(null);
    setAddingOutcome(false);
    setEditingReleaseIndex(null);
    setAddingRelease(false);
    setEditingLicenseIndex(null);
    setAddingLicense(false);
    setEditingTagIndex(null);
    setAddingTag(false);
    setInlineAttrKey(null);
    setProductToAdd('');
    setError('');
  }, [solution, open]);

  // Sync local state when solution data changes (after refetch)
  useEffect(() => {
    if (solution && isEditMode) {
      setSolutionOutcomes((solution.outcomes || []).map((o: any) => ({ ...o })));
      setReleases((solution.releases || []).map((r: any) => ({ ...r })));
      setLicenses((solution.licenses || []).map((l: any) => ({ ...l })));
      setTags((solution.tags || []).map((t: any) => ({ ...t })));
      const attrs = solution.customAttrs || {};
      const cleanedAttrs = Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.toLowerCase() !== 'licenselevel')
      );
      setCustomAttrs(cleanedAttrs);
    }
  }, [solution?.outcomes, solution?.releases, solution?.licenses, solution?.tags, solution?.customAttrs, isEditMode]);

  useEffect(() => {
    if (open) {
      const tabMap: Record<string, number> = {
        general: 0,
        tags: 1,
        products: 2,
        outcomes: 3,
        releases: 4,
        licenses: 5,
        customAttributes: 6
      };
      setTabValue(tabMap[initialTab as keyof typeof tabMap] || 0);
    }
  }, [open, initialTab]);

  // Product handlers - Products save immediately in edit mode
  const handleAddProduct = async () => {
    if (productToAdd && !selectedProductIds.includes(productToAdd)) {
      if (isEditMode) {
        await addProduct({
          variables: { solutionId: solution!.id, productId: productToAdd, order: selectedProductIds.length + 1 },
          refetchQueries: ['Solutions', 'SolutionDetail']
        });
        await refetchSolution();
      }
      setSelectedProductIds([...selectedProductIds, productToAdd]);
      setProductToAdd('');
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (isEditMode) {
      await removeProduct({
        variables: { solutionId: solution!.id, productId },
        refetchQueries: ['Solutions', 'SolutionDetail']
      });
    }
    setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
  };

  const handleProductDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = selectedProductIds.indexOf(active.id);
      const newIndex = selectedProductIds.indexOf(over.id);
      const newOrder = arrayMove(selectedProductIds, oldIndex, newIndex);
      setSelectedProductIds(newOrder);

      if (isEditMode) {
        const productOrders = newOrder.map((productId, index) => ({
          productId,
          order: index + 1
        }));
        await reorderProducts({
          variables: { solutionId: solution!.id, productOrders }
        });
      }
    }
  };

  // Outcome handlers - Edit mode uses shared hook for immediate persistence
  const handleOutcomeSave = async (outcomeData: any, index: number) => {
    if (isEditMode && solutionOutcomes[index].id) {
      await solutionEditing.handleOutcomeUpdate(solutionOutcomes[index].id, {
        name: outcomeData.name,
        description: outcomeData.description
      });
    } else {
      const updatedOutcomes = [...solutionOutcomes];
      updatedOutcomes[index] = { ...updatedOutcomes[index], ...outcomeData };
      setSolutionOutcomes(updatedOutcomes);
    }
    setEditingOutcomeIndex(null);
  };

  const handleAddOutcome = async (outcomeData: any) => {
    if (isEditMode) {
      await solutionEditing.handleOutcomeCreate({
        name: outcomeData.name,
        description: outcomeData.description
      });
    } else {
      setSolutionOutcomes([...solutionOutcomes, { ...outcomeData, isNew: true }]);
    }
    setAddingOutcome(false);
  };

  const handleDeleteOutcome = async (index: number) => {
    if (isEditMode && solutionOutcomes[index].id) {
      await solutionEditing.handleOutcomeDelete(solutionOutcomes[index].id);
    } else {
      setConfirmState({
        open: true,
        title: 'Delete Outcome',
        message: `Are you sure you want to delete outcome "${solutionOutcomes[index].name}"?`,
        onConfirm: () => {
          const updatedOutcomes = [...solutionOutcomes];
          if (updatedOutcomes[index].id) {
            updatedOutcomes[index] = { ...updatedOutcomes[index], delete: true };
          } else {
            updatedOutcomes.splice(index, 1);
          }
          setSolutionOutcomes(updatedOutcomes);
        }
      });
    }
  };

  const handleOutcomeDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const activeIdx = solutionOutcomes.findIndex((o, i) => (o.id || `new-${i}`) === active.id);
      const overIdx = solutionOutcomes.findIndex((o, i) => (o.id || `new-${i}`) === over.id);
      const newOrder = arrayMove(solutionOutcomes, activeIdx, overIdx);
      setSolutionOutcomes(newOrder);

      if (isEditMode) {
        const outcomeIds = newOrder.filter(o => o.id).map(o => o.id as string);
        await solutionEditing.handleOutcomeReorder(outcomeIds);
      }
    }
  };

  // Release handlers - Edit mode saves immediately
  const handleReleaseSave = async (releaseData: any, index: number) => {
    if (isEditMode && releases[index].id) {
      await updateRelease({
        variables: { id: releases[index].id, input: { name: releaseData.name, level: releaseData.level, description: releaseData.description, isActive: releaseData.isActive, solutionId: solution!.id, customAttrs: releaseData.customAttrs } },
        refetchQueries: ['Solutions', 'SolutionDetail']
      });
    }
    const updatedReleases = [...releases];
    updatedReleases[index] = { ...updatedReleases[index], ...releaseData };
    setReleases(updatedReleases);
    setEditingReleaseIndex(null);
  };

  const handleAddReleaseSave = async (releaseData: any) => {
    if (isEditMode) {
      await createRelease({
        variables: { input: { name: releaseData.name, level: releaseData.level, description: releaseData.description, isActive: true, solutionId: solution!.id, customAttrs: releaseData.customAttrs } },
        refetchQueries: ['Solutions', 'SolutionDetail']
      });
      await refetchSolution();
    } else {
      setReleases([...releases, { ...releaseData, isNew: true, isActive: true }]);
    }
    setAddingRelease(false);
  };

  const handleDeleteRelease = async (index: number) => {
    setConfirmState({
      open: true,
      title: 'Delete Release',
      message: `Are you sure you want to delete release "${releases[index].name}"?`,
      onConfirm: async () => {
        if (isEditMode && releases[index].id) {
          await deleteReleaseMut({
            variables: { id: releases[index].id },
            refetchQueries: ['Solutions', 'SolutionDetail']
          });
          await refetchSolution();
        } else {
          const updatedReleases = [...releases];
          if (updatedReleases[index].id) {
            updatedReleases[index] = { ...updatedReleases[index], delete: true };
          } else {
            updatedReleases.splice(index, 1);
          }
          setReleases(updatedReleases);
        }
      }
    });
  };

  const handleReleaseDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const activeIdx = releases.findIndex((r, i) => (r.id || `new-${i}`) === active.id);
      const overIdx = releases.findIndex((r, i) => (r.id || `new-${i}`) === over.id);
      setReleases(arrayMove(releases, activeIdx, overIdx));
    }
  };

  // License handlers - Edit mode saves immediately
  const handleLicenseSave = async (licenseData: any, index: number) => {
    if (isEditMode && licenses[index].id) {
      await updateLicenseMut({
        variables: { id: licenses[index].id, input: { name: licenseData.name, level: licenseData.level, description: licenseData.description, isActive: licenseData.isActive, solutionId: solution!.id, customAttrs: licenseData.customAttrs } },
        refetchQueries: ['Solutions', 'SolutionDetail']
      });
    }
    const updatedLicenses = [...licenses];
    updatedLicenses[index] = { ...updatedLicenses[index], ...licenseData };
    setLicenses(updatedLicenses);
    setEditingLicenseIndex(null);
  };

  const handleAddLicenseSave = async (licenseData: any) => {
    if (isEditMode) {
      await createLicense({
        variables: { input: { name: licenseData.name, level: licenseData.level, description: licenseData.description, isActive: licenseData.isActive ?? true, solutionId: solution!.id, customAttrs: licenseData.customAttrs } },
        refetchQueries: ['Solutions', 'SolutionDetail']
      });
      await refetchSolution();
    } else {
      setLicenses([...licenses, { ...licenseData, isNew: true }]);
    }
    setAddingLicense(false);
  };

  const handleDeleteLicense = async (index: number) => {
    setConfirmState({
      open: true,
      title: 'Delete License',
      message: `Are you sure you want to delete license "${licenses[index].name}"?`,
      onConfirm: async () => {
        if (isEditMode && licenses[index].id) {
          await deleteLicenseMut({
            variables: { id: licenses[index].id },
            refetchQueries: ['Solutions', 'SolutionDetail']
          });
          await refetchSolution();
        } else {
          const updatedLicenses = [...licenses];
          if (updatedLicenses[index].id) {
            updatedLicenses[index] = { ...updatedLicenses[index], delete: true };
          } else {
            updatedLicenses.splice(index, 1);
          }
          setLicenses(updatedLicenses);
        }
      }
    });
  };

  const handleLicenseDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const activeIdx = licenses.findIndex((l, i) => (l.id || `new-${i}`) === active.id);
      const overIdx = licenses.findIndex((l, i) => (l.id || `new-${i}`) === over.id);
      setLicenses(arrayMove(licenses, activeIdx, overIdx));
    }
  };

  // Tag handlers - Edit mode uses shared hook for immediate persistence
  const handleTagSave = async (tagData: any, index: number) => {
    if (isEditMode && tags[index].id) {
      await solutionEditing.handleTagUpdate(tags[index].id, {
        name: tagData.name,
        color: tagData.color,
        description: tagData.description
      });
    } else {
      const updatedTags = [...tags];
      updatedTags[index] = { ...updatedTags[index], ...tagData };
      setTags(updatedTags);
    }
    setEditingTagIndex(null);
  };

  const handleAddTagSave = async (tagData: any) => {
    if (isEditMode) {
      await solutionEditing.handleTagCreate({
        name: tagData.name,
        color: tagData.color,
        description: tagData.description
      });
    } else {
      setTags([...tags, { ...tagData, isNew: true, _tempId: Math.random().toString(36).substr(2, 9) } as any]);
    }
    setAddingTag(false);
  };

  const handleDeleteTag = async (index: number) => {
    if (isEditMode && tags[index].id) {
      await solutionEditing.handleTagDelete(tags[index].id);
    } else {
      setConfirmState({
        open: true,
        title: 'Delete Tag',
        message: `Are you sure you want to delete tag "${tags[index].name}"?`,
        onConfirm: () => {
          const updatedTags = [...tags];
          if (updatedTags[index].id) {
            updatedTags[index] = { ...updatedTags[index], delete: true };
          } else {
            updatedTags.splice(index, 1);
          }
          setTags(updatedTags);
        }
      });
    }
  };

  const visibleTags = tags.filter(t => !t.delete);

  // Custom attribute handlers - Edit mode uses shared hook
  const handleDeleteCustomAttribute = async (key: string) => {
    if (isEditMode) {
      // Use shared hook for immediate persistence
      await solutionEditing.handleAttributeDelete(key);
    } else {
      setConfirmState({
        open: true,
        title: 'Delete Attribute',
        message: `Are you sure you want to delete attribute "${key}"?`,
        onConfirm: () => {
          const updatedCustomAttrs = { ...customAttrs };
          delete updatedCustomAttrs[key];
          if (updatedCustomAttrs._order) {
            updatedCustomAttrs._order = updatedCustomAttrs._order.filter((k: string) => k !== key);
          }
          setCustomAttrs(updatedCustomAttrs);
        }
      });
    }
  };

  const beginInlineAttrEdit = (key: string, value: any) => {
    setInlineAttrKey(key);
    setInlineAttrDraft({
      key,
      value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '')
    });
  };

  const beginInlineAttrCreate = () => {
    setInlineAttrKey('__new__');
    setInlineAttrDraft({ key: '', value: '' });
  };

  const cancelInlineAttrEdit = () => {
    setInlineAttrKey(null);
    setInlineAttrDraft({ key: '', value: '' });
  };

  const saveInlineAttr = async () => {
    if (!inlineAttrKey) return;
    const newKey = inlineAttrDraft.key.trim();
    if (!newKey) return;

    let parsed: any = inlineAttrDraft.value;
    const raw = inlineAttrDraft.value.trim();
    if (raw === 'true' || raw === 'false') {
      parsed = raw === 'true';
    } else if (!Number.isNaN(Number(raw)) && raw !== '') {
      parsed = Number(raw);
    } else {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = inlineAttrDraft.value;
      }
    }

    if (isEditMode) {
      // Use shared hook for immediate persistence
      if (inlineAttrKey === '__new__') {
        await solutionEditing.handleAttributeCreate(newKey, parsed);
      } else {
        await solutionEditing.handleAttributeUpdate(inlineAttrKey, newKey, parsed);
      }
    } else {
      const updated = { ...customAttrs };
      if (inlineAttrKey !== '__new__' && inlineAttrKey !== newKey) {
        delete updated[inlineAttrKey];
      }
      updated[newKey] = parsed;
      const existingOrder = updated._order || Object.keys(updated).filter(k => !k.startsWith('_'));
      updated._order = existingOrder.includes(newKey) ? existingOrder : [...existingOrder, newKey];
      setCustomAttrs(updated);
    }
    cancelInlineAttrEdit();
  };

  const handleTagDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = tags.findIndex((item) => (item.id || (item as any)._tempId) === active.id);
      const newIndex = tags.findIndex((item) => (item.id || (item as any)._tempId) === over.id);
      const newOrder = arrayMove(tags, oldIndex, newIndex);
      setTags(newOrder);

      if (isEditMode) {
        const tagIds = newOrder.filter(t => t.id).map(t => t.id as string);
        await solutionEditing.handleTagReorder(tagIds);
      }
    }
  };

  const handleAttributeDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const keys = getSortedAttributes(customAttrs).map(([k]) => k);
      const oldIndex = keys.indexOf(active.id);
      const newIndex = keys.indexOf(over.id);
      const newOrder = arrayMove(keys, oldIndex, newIndex);

      // Always update local state immediately for visual feedback
      const updated = { ...customAttrs, _order: newOrder };
      setCustomAttrs(updated);

      // In edit mode, use shared hook for persistence
      if (isEditMode) {
        await solutionEditing.handleAttributeReorder(newOrder);
      }
    }
  };

  const getSortedAttributes = (attrs: any) => {
    if (!attrs) return [];
    const order = attrs._order || [];
    const entries = Object.entries(attrs).filter(([k]) => !k.startsWith('_'));
    return entries.sort((a, b) => {
      const indexA = order.indexOf(a[0]);
      const indexB = order.indexOf(b[0]);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

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
        // Strip __typename from resources to avoid GraphQL input error
        resources: resources.map(({ label, url }) => ({ label, url })),
        customAttrs: cleanedCustomAttrs
      };

      let solutionId = solution?.id;

      if (solution) {
        await updateSolution({ variables: { id: solution.id, input } });
      } else {
        const result = await createSolution({ variables: { input } });
        solutionId = result.data.createSolution.id;
      }

      // Only process batch saves for new solutions (create mode)
      // Edit mode saves are handled immediately by handlers
      if (solutionId && !isEditMode) {
        const existingProductIds = (solution?.products?.edges || []).map((edge: any) => edge.node.id);

        // Remove products that are no longer selected
        for (const productId of existingProductIds) {
          if (!selectedProductIds.includes(productId)) {
            await removeProduct({ variables: { solutionId, productId } });
          }
        }

        // Add new products
        for (let i = 0; i < selectedProductIds.length; i++) {
          const productId = selectedProductIds[i];
          if (!existingProductIds.includes(productId)) {
            await addProduct({ variables: { solutionId, productId, order: i + 1 } });
          }
        }

        // Reorder
        const productOrders = selectedProductIds.map((productId, index) => ({
          productId,
          order: index + 1
        }));
        await reorderProducts({ variables: { solutionId, productOrders } });

        // Save outcomes
        for (const outcome of solutionOutcomes) {
          if (outcome.delete && outcome.id) {
            await deleteOutcomeMut({ variables: { id: outcome.id } });
          } else if (outcome.isNew && !outcome.delete) {
            await createOutcome({
              variables: {
                input: {
                  name: outcome.name,
                  description: outcome.description || undefined,
                  solutionId
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
                  solutionId
                }
              }
            });
          }
        }

        // Save releases
        for (const release of releases) {
          if (release.delete && release.id) {
            await deleteReleaseMut({ variables: { id: release.id } });
          } else if (release.isNew && !release.delete) {
            await createRelease({
              variables: {
                input: {
                  name: release.name,
                  level: release.level,
                  description: release.description,
                  isActive: release.isActive,
                  solutionId,
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
                  solutionId,
                  customAttrs: release.customAttrs
                }
              }
            });
          }
        }

        // Save licenses
        for (const license of licenses) {
          if (license.delete && license.id) {
            await deleteLicenseMut({ variables: { id: license.id } });
          } else if (license.isNew && !license.delete) {
            await createLicense({
              variables: {
                input: {
                  name: license.name,
                  level: license.level,
                  description: license.description,
                  isActive: license.isActive,
                  solutionId,
                  customAttrs: license.customAttrs
                }
              }
            });
          } else if (!license.isNew && !license.delete && license.id) {
            await updateLicenseMut({
              variables: {
                id: license.id,
                input: {
                  name: license.name,
                  level: license.level,
                  description: license.description,
                  isActive: license.isActive,
                  solutionId,
                  customAttrs: license.customAttrs
                }
              }
            });
          }
        }

        // Save tags
        for (const tag of tags) {
          if (tag.delete && tag.id) {
            await deleteTagMut({ variables: { id: tag.id } });
          } else if (tag.isNew && !tag.delete) {
            await createTag({
              variables: {
                input: {
                  name: tag.name,
                  color: tag.color,
                  description: tag.description,
                  solutionId,
                }
              }
            });
          } else if (!tag.isNew && !tag.delete && tag.id) {
            await updateTag({
              variables: {
                id: tag.id,
                input: {
                  name: tag.name,
                  color: tag.color,
                  description: tag.description,
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => setTabValue(newValue);

  // Computed values
  const selectedProducts = selectedProductIds
    .map(id => allProducts.find((p: any) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);
  const availableProducts = allProducts.filter((p: any) => !selectedProductIds.includes(p.id));

  const inheritedOutcomes = selectedProductIds.flatMap(productId => {
    const product = allProducts.find((p: any) => p.id === productId);
    return (product?.outcomes || []).map((outcome: any) => ({
      ...outcome,
      sourceProductId: productId,
      sourceProductName: product.name,
      inherited: true
    }));
  });

  const allProductLicenses = selectedProductIds.flatMap(productId => {
    const product = allProducts.find((p: any) => p.id === productId);
    return (product?.licenses || []).map((license: any) => ({
      ...license,
      productId,
      productName: product.name
    }));
  });

  const allProductReleases = selectedProductIds.flatMap(productId => {
    const product = allProducts.find((p: any) => p.id === productId);
    return (product?.releases || []).map((release: any) => ({
      ...release,
      productId,
      productName: product.name
    }));
  });

  const visibleOutcomes = solutionOutcomes.filter(o => !o.delete);
  const visibleReleases = releases.filter(r => !r.delete);
  const visibleLicenses = licenses.filter(l => !l.delete);
  const allOutcomes = [...visibleOutcomes, ...inheritedOutcomes];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: '90vh' } }}>
      <DialogTitle>{solution ? 'Edit Solution' : 'Add New Solution'}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Resources" />
            <Tab label={`Tags (${visibleTags.length})`} />
            <Tab label={`Products (${selectedProductIds.length})`} />
            <Tab label={`Outcomes (${allOutcomes.length})`} />
            <Tab label={`Releases (${visibleReleases.length})`} />
            <Tab label={`Licenses (${visibleLicenses.length})`} />
            <Tab label={`Custom Attributes (${Object.keys(customAttrs).filter(k => !k.startsWith('_')).length})`} />
          </Tabs>
        </Box>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {isEditMode && tabValue !== 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Changes are saved immediately.
          </Alert>
        )}

        {/* Resources Tab */}
        <TabPanel value={tabValue} index={0}>
          <TextField fullWidth label="Solution Name" value={name} onChange={(e) => setName(e.target.value)} required sx={{ mb: 2 }} />
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Resources</Typography>
          {isEditMode ? (
            <ResourcesTable
              items={solution?.resources || []}
              onUpdate={solutionEditing.handleResourceUpdate}
              onDelete={solutionEditing.handleResourceDelete}
              onCreate={solutionEditing.handleResourceCreate}
              onReorder={solutionEditing.handleResourceReorder}
            />
          ) : (
            <ResourcesTable
              items={resources}
              onUpdate={(index, updates) => {
                const updated = [...resources];
                updated[index] = { ...updated[index], ...updates };
                setResources(updated);
              }}
              onDelete={(index) => {
                const updated = [...resources];
                updated.splice(index, 1);
                setResources(updated);
              }}
              onCreate={(data) => setResources([...resources, data])}
              onReorder={(newOrder) => {
                const reordered = newOrder.map(i => resources[i]);
                setResources(reordered);
              }}
            />
          )}
        </TabPanel>

        {/* Products Tab - Drag & Drop */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add products to bundle into this solution. Drag to reorder.
          </Typography>

          {/* Add Product Dropdown */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Add Product</InputLabel>
              <Select
                value={productToAdd}
                label="Add Product"
                onChange={(e) => setProductToAdd(e.target.value)}
              >
                {availableProducts.map((product: any) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleAddProduct}
              disabled={!productToAdd}
              sx={{ minWidth: 100 }}
            >
              Add
            </Button>
          </Box>

          {selectedProducts.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProductDragEnd}>
              <SortableContext items={selectedProductIds} strategy={verticalListSortingStrategy}>
                <List>
                  {selectedProducts.map((product, index) => (
                    <SortableProductItem
                      key={product.id}
                      product={product}
                      index={index}
                      onRemove={() => handleRemoveProduct(product.id)}
                    />
                  ))}
                </List>
              </SortableContext>
            </DndContext>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No products added yet. Use the dropdown above to add products.
            </Typography>
          )}
        </TabPanel>

        {/* Outcomes Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Manage outcomes for this solution
            </Typography>
            <Tooltip title="Add Outcome">
              <IconButton color="primary" onClick={() => setAddingOutcome(true)} size="small" disabled={addingOutcome}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {visibleOutcomes.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOutcomeDragEnd}>
              <SortableContext
                items={solutionOutcomes.filter(o => !o.delete).map((o, i) => o.id || `new-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                <List dense>
                  {solutionOutcomes.map((outcome, index) =>
                    !outcome.delete && (
                      <InlineOutcomeEditor
                        key={outcome.id || `new-${index}`}
                        outcome={outcome}
                        index={index}
                        isEditing={editingOutcomeIndex === index}
                        onStartEdit={() => setEditingOutcomeIndex(index)}
                        onSave={(data) => handleOutcomeSave(data, index)}
                        onCancel={() => setEditingOutcomeIndex(null)}
                        onDelete={() => handleDeleteOutcome(index)}
                      />
                    )
                  )}
                </List>
              </SortableContext>
            </DndContext>
          )}

          {addingOutcome && (
            <AddOutcomeForm
              onSave={handleAddOutcome}
              onCancel={() => setAddingOutcome(false)}
            />
          )}

          {!addingOutcome && visibleOutcomes.length === 0 && inheritedOutcomes.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No outcomes added yet. Click the + button to add one.
            </Typography>
          )}

          {inheritedOutcomes.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>Inherited from Products:</Typography>
              {inheritedOutcomes.map((outcome, idx) => (
                <Card key={`inh-${idx}`} variant="outlined" sx={{ mb: 1, bgcolor: '#f9f9f9' }}>
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {outcome.name} <Chip label={outcome.sourceProductName} size="small" />
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{outcome.description}</Typography>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabPanel>

        {/* Releases Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Manage releases for this solution (can map to product releases)
            </Typography>
            <Tooltip title="Add Release">
              <IconButton color="primary" onClick={() => setAddingRelease(true)} size="small" disabled={addingRelease}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {visibleReleases.length > 0 ? (
            <List dense>
              {releases.map((release, index) =>
                !release.delete && (
                  <InlineSolutionReleaseEditor
                    key={release.id || `new-${index}`}
                    release={release}
                    index={index}
                    isEditing={editingReleaseIndex === index}
                    onStartEdit={() => setEditingReleaseIndex(index)}
                    onSave={(data) => handleReleaseSave(data, index)}
                    onCancel={() => setEditingReleaseIndex(null)}
                    onDelete={() => handleDeleteRelease(index)}
                    availableProductReleases={allProductReleases}
                    dragDisabled={true}
                  />
                )
              )}
            </List>
          ) : !addingRelease ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No releases added yet. Click the + button to add one.
            </Typography>
          ) : null}

          {addingRelease && (
            <AddSolutionReleaseForm
              onSave={handleAddReleaseSave}
              onCancel={() => setAddingRelease(false)}
              availableProductReleases={allProductReleases}
            />
          )}
        </TabPanel>

        {/* Licenses Tab */}
        <TabPanel value={tabValue} index={5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Manage licenses for this solution (can map to product licenses)
            </Typography>
            <Tooltip title="Add License">
              <IconButton color="primary" onClick={() => setAddingLicense(true)} size="small" disabled={addingLicense}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {visibleLicenses.length > 0 ? (
            <List dense>
              {licenses.map((license, index) =>
                !license.delete && (
                  <InlineSolutionLicenseEditor
                    key={license.id || `new-${index}`}
                    license={license}
                    index={index}
                    isEditing={editingLicenseIndex === index}
                    onStartEdit={() => setEditingLicenseIndex(index)}
                    onSave={(data) => handleLicenseSave(data, index)}
                    onCancel={() => setEditingLicenseIndex(null)}
                    onDelete={() => handleDeleteLicense(index)}
                    availableProductLicenses={allProductLicenses}
                    dragDisabled={true}
                  />
                )
              )}
            </List>
          ) : !addingLicense ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No licenses added yet. Click the + button to add one.
            </Typography>
          ) : null}

          {addingLicense && (
            <AddSolutionLicenseForm
              onSave={handleAddLicenseSave}
              onCancel={() => setAddingLicense(false)}
              availableProductLicenses={allProductLicenses}
            />
          )}
        </TabPanel>

        {/* Tags Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Manage tags for this solution
            </Typography>
            <Tooltip title="Add Tag">
              <IconButton color="primary" onClick={() => setAddingTag(true)} size="small" disabled={addingTag}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {visibleTags.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTagDragEnd}>
              <SortableContext
                items={tags.filter(t => !t.delete).map((t, i) => t.id || (t as any)._tempId)}
                strategy={verticalListSortingStrategy}
              >
                <List dense>
                  {tags.map((tag, index) =>
                    !tag.delete && (
                      <InlineTagEditor
                        key={tag.id || (tag as any)._tempId}
                        tag={tag}
                        index={index}
                        isEditing={editingTagIndex === index}
                        onStartEdit={() => setEditingTagIndex(index)}
                        onSave={(data) => handleTagSave(data, index)}
                        onCancel={() => setEditingTagIndex(null)}
                        onDelete={() => handleDeleteTag(index)}
                        existingNames={tags.filter((_, i) => i !== index).map(t => t.name)}
                      />
                    )
                  )}
                </List>
              </SortableContext>
            </DndContext>
          )}

          {addingTag && (
            <AddTagForm
              onSave={handleAddTagSave}
              onCancel={() => setAddingTag(false)}
              existingNames={tags.map(t => t.name)}
            />
          )}

          {!addingTag && visibleTags.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No tags added yet. Click the + button to add one.
            </Typography>
          )}
        </TabPanel>

        {/* Attributes Tab */}
        <TabPanel value={tabValue} index={6}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Manage additional metadata for this solution
            </Typography>
            <Tooltip title="Add Attribute">
              <IconButton color="primary" onClick={beginInlineAttrCreate} size="small">
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAttributeDragEnd}>
            <SortableContext items={getSortedAttributes(customAttrs).map(([k]) => k)} strategy={verticalListSortingStrategy}>
              <List dense>
                {getSortedAttributes(customAttrs).map(([key, value]) => (
                  inlineAttrKey === key ? (
                    <Box
                      key={key}
                      sx={{
                        border: '1px solid #1976d2',
                        borderRadius: 1,
                        mb: 1,
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        bgcolor: 'rgba(25, 118, 210, 0.04)'
                      }}
                    >
                      <TextField
                        label="Key"
                        size="small"
                        value={inlineAttrDraft.key}
                        onChange={(e) => setInlineAttrDraft(prev => ({ ...prev, key: e.target.value }))}
                      />
                      <TextField
                        label="Value"
                        size="small"
                        value={inlineAttrDraft.value}
                        onChange={(e) => setInlineAttrDraft(prev => ({ ...prev, value: e.target.value }))}
                        multiline
                        minRows={2}
                      />
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button size="small" onClick={cancelInlineAttrEdit}>Cancel</Button>
                        <Button size="small" variant="contained" onClick={saveInlineAttr}>Save</Button>
                      </Box>
                    </Box>
                  ) : (
                    <SortableAttributeItem
                      key={key}
                      attrKey={key}
                      value={value}
                      onEdit={() => beginInlineAttrEdit(key, value)}
                      onDelete={() => handleDeleteCustomAttribute(key)}
                    />
                  )
                ))}
                {inlineAttrKey === '__new__' && (
                  <Box
                    sx={{
                      border: '1px solid #1976d2',
                      borderRadius: 1,
                      mb: 1,
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      bgcolor: 'rgba(25, 118, 210, 0.04)'
                    }}
                  >
                    <TextField
                      label="Key"
                      size="small"
                      value={inlineAttrDraft.key}
                      onChange={(e) => setInlineAttrDraft(prev => ({ ...prev, key: e.target.value }))}
                      autoFocus
                    />
                    <TextField
                      label="Value"
                      size="small"
                      value={inlineAttrDraft.value}
                      onChange={(e) => setInlineAttrDraft(prev => ({ ...prev, value: e.target.value }))}
                      multiline
                      minRows={2}
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button size="small" onClick={cancelInlineAttrEdit}>Cancel</Button>
                      <Button size="small" variant="contained" onClick={saveInlineAttr}>Save</Button>
                    </Box>
                  </Box>
                )}
              </List>
            </SortableContext>
          </DndContext>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading || !name.trim() || selectedProductIds.length === 0}>
          {loading ? 'Saving...' : isEditMode ? 'Done' : 'Create Solution'}
        </Button>
      </DialogActions>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel="Delete"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ ...confirmState, open: false })}
        severity="error"
      />
    </Dialog>
  );
};
