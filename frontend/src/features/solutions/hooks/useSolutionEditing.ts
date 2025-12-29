/**
 * Shared hook for solution editing logic.
 * Used by both SolutionsPage (tabs) and SolutionDialog to ensure identical behavior.
 */
import { useApolloClient, useMutation } from '@apollo/client';
import {
  UPDATE_SOLUTION,
  ADD_PRODUCT_TO_SOLUTION_ENHANCED,
  REMOVE_PRODUCT_FROM_SOLUTION_ENHANCED,
  REORDER_PRODUCTS_IN_SOLUTION,
  CREATE_SOLUTION_TAG,
  UPDATE_SOLUTION_TAG,
  DELETE_SOLUTION_TAG
} from '../graphql/solutions.mutations';
import { SOLUTION } from '../graphql/solutions.queries';
import { CREATE_OUTCOME, UPDATE_OUTCOME, DELETE_OUTCOME, REORDER_OUTCOMES } from '@features/product-outcomes';
import { CREATE_RELEASE, UPDATE_RELEASE, DELETE_RELEASE } from '@features/product-releases';
import { CREATE_LICENSE, UPDATE_LICENSE, DELETE_LICENSE } from '@features/product-licenses';
import { REORDER_SOLUTION_TAGS } from '@features/tags';

const REFETCH_QUERIES = ['Solutions', 'SolutionDetail'];

export interface AttributeItem {
  key: string;
  value: any;
}

export function useSolutionEditing(solutionId: string | null | undefined) {
  const client = useApolloClient();

  // Mutations
  const [updateSolution] = useMutation(UPDATE_SOLUTION);
  const [addProduct] = useMutation(ADD_PRODUCT_TO_SOLUTION_ENHANCED);
  const [removeProduct] = useMutation(REMOVE_PRODUCT_FROM_SOLUTION_ENHANCED);
  const [reorderProducts] = useMutation(REORDER_PRODUCTS_IN_SOLUTION);
  const [createOutcome] = useMutation(CREATE_OUTCOME);
  const [updateOutcome] = useMutation(UPDATE_OUTCOME);
  const [deleteOutcome] = useMutation(DELETE_OUTCOME);
  const [reorderOutcomes] = useMutation(REORDER_OUTCOMES);
  const [createRelease] = useMutation(CREATE_RELEASE);
  const [updateRelease] = useMutation(UPDATE_RELEASE);
  const [deleteRelease] = useMutation(DELETE_RELEASE);
  const [createLicense] = useMutation(CREATE_LICENSE);
  const [updateLicenseMut] = useMutation(UPDATE_LICENSE);
  const [deleteLicense] = useMutation(DELETE_LICENSE);
  const [createTag] = useMutation(CREATE_SOLUTION_TAG);
  const [updateTag] = useMutation(UPDATE_SOLUTION_TAG);
  const [deleteTagMut] = useMutation(DELETE_SOLUTION_TAG);
  const [reorderTags] = useMutation(REORDER_SOLUTION_TAGS);

  // --- Products ---
  const handleProductAdd = async (productId: string, order: number) => {
    if (!solutionId) return;
    await client.mutate({
      mutation: ADD_PRODUCT_TO_SOLUTION_ENHANCED,
      variables: { solutionId, productId, order },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleProductRemove = async (productId: string) => {
    if (!solutionId) return;
    await client.mutate({
      mutation: REMOVE_PRODUCT_FROM_SOLUTION_ENHANCED,
      variables: { solutionId, productId },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleProductReorder = async (productOrders: { productId: string; order: number }[]) => {
    if (!solutionId) return;
    await client.mutate({
      mutation: REORDER_PRODUCTS_IN_SOLUTION,
      variables: { solutionId, productOrders },
      refetchQueries: REFETCH_QUERIES
    });
  };

  // --- Outcomes ---
  const handleOutcomeUpdate = async (id: string, updates: any) => {
    await client.mutate({
      mutation: UPDATE_OUTCOME,
      variables: { id, input: { ...updates, solutionId } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleOutcomeDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this outcome?')) return;
    await client.mutate({
      mutation: DELETE_OUTCOME,
      variables: { id },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleOutcomeCreate = async (data: { name: string; description?: string }) => {
    if (!solutionId) return;
    await client.mutate({
      mutation: CREATE_OUTCOME,
      variables: { input: { ...data, solutionId } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleOutcomeReorder = async (newOrderIds: string[]) => {
    if (!solutionId) return;
    await client.mutate({
      mutation: REORDER_OUTCOMES,
      variables: { solutionId, outcomeIds: newOrderIds },
      refetchQueries: ['SolutionDetail']
    });
  };

  // --- Tags ---
  const handleTagUpdate = async (id: string, updates: any) => {
    await client.mutate({
      mutation: UPDATE_SOLUTION_TAG,
      variables: { id, input: updates },
      refetchQueries: [...REFETCH_QUERIES, 'SolutionTags']
    });
  };

  const handleTagDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    await client.mutate({
      mutation: DELETE_SOLUTION_TAG,
      variables: { id },
      refetchQueries: [...REFETCH_QUERIES, 'SolutionTags']
    });
  };

  const handleTagCreate = async (data: { name: string; color: string; description?: string }) => {
    if (!solutionId) return;
    await client.mutate({
      mutation: CREATE_SOLUTION_TAG,
      variables: { input: { ...data, solutionId } },
      refetchQueries: [...REFETCH_QUERIES, 'SolutionTags']
    });
  };

  const handleTagReorder = async (newOrderIds: string[]) => {
    if (!solutionId) return;
    console.log('[useSolutionEditing] handleTagReorder:', { solutionId, newOrderIds });
    try {
      await client.mutate({
        mutation: REORDER_SOLUTION_TAGS,
        variables: { solutionId, tagIds: newOrderIds },
        refetchQueries: [...REFETCH_QUERIES, 'SolutionTags']
      });
      console.log('[useSolutionEditing] handleTagReorder: mutation complete');
    } catch (e) {
      console.error('[useSolutionEditing] handleTagReorder: mutation failed', e);
    }
  };

  // --- Releases ---
  const handleReleaseUpdate = async (id: string, updates: any) => {
    await client.mutate({
      mutation: UPDATE_RELEASE,
      variables: { id, input: { ...updates, solutionId } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleReleaseDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this release?')) return;
    await client.mutate({
      mutation: DELETE_RELEASE,
      variables: { id },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleReleaseCreate = async (data: { name: string; description?: string; level?: number }) => {
    if (!solutionId) return;
    await client.mutate({
      mutation: CREATE_RELEASE,
      variables: { input: { ...data, solutionId } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  // --- Licenses ---
  const handleLicenseUpdate = async (id: string, updates: any) => {
    await client.mutate({
      mutation: UPDATE_LICENSE,
      variables: { id, input: { ...updates, solutionId } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleLicenseDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this license?')) return;
    await client.mutate({
      mutation: DELETE_LICENSE,
      variables: { id },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleLicenseCreate = async (data: { name: string; description?: string; level?: number; isActive?: boolean }) => {
    if (!solutionId) return;
    await client.mutate({
      mutation: CREATE_LICENSE,
      variables: { input: { ...data, solutionId } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  // --- Resources ---
  // Resources are stored directly on the Solution, so we update via UPDATE_SOLUTION
  const handleResourceUpdate = async (index: number, updates: { label?: string; url?: string }) => {
    if (!solutionId) return;
    const solution = getCurrentSolution();
    if (!solution) return;

    const updatedResources = [...solution.resources];
    updatedResources[index] = { ...updatedResources[index], ...updates };
    const cleanResources = updatedResources.map(r => ({ label: r.label, url: r.url }));

    await client.mutate({
      mutation: UPDATE_SOLUTION,
      variables: {
        id: solutionId,
        input: { name: solution.name, resources: cleanResources, customAttrs: solution.customAttrs }
      },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleResourceDelete = async (index: number) => {
    if (!solutionId) return;
    const solution = getCurrentSolution();
    if (!solution) return;

    const updatedResources = [...solution.resources];
    updatedResources.splice(index, 1);
    const cleanResources = updatedResources.map(r => ({ label: r.label, url: r.url }));

    await client.mutate({
      mutation: UPDATE_SOLUTION,
      variables: {
        id: solutionId,
        input: { name: solution.name, resources: cleanResources, customAttrs: solution.customAttrs }
      },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleResourceCreate = async (data: { label: string; url: string }) => {
    if (!solutionId) return;
    const solution = getCurrentSolution();
    if (!solution) return;

    const updatedResources = [...solution.resources, data];
    const cleanResources = updatedResources.map(r => ({ label: r.label, url: r.url }));

    await client.mutate({
      mutation: UPDATE_SOLUTION,
      variables: {
        id: solutionId,
        input: { name: solution.name, resources: cleanResources, customAttrs: solution.customAttrs }
      },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleResourceReorder = async (newOrderIndexes: number[]) => {
    if (!solutionId) return;
    const solution = getCurrentSolution();
    if (!solution) return;

    const updatedResources = newOrderIndexes.map(i => solution.resources[i]);
    const cleanResources = updatedResources.map(r => ({ label: r.label, url: r.url }));

    await client.mutate({
      mutation: UPDATE_SOLUTION,
      variables: {
        id: solutionId,
        input: { name: solution.name, resources: cleanResources, customAttrs: solution.customAttrs }
      },
      refetchQueries: REFETCH_QUERIES
    });
  };

  // --- Custom Attributes ---
  // Helper to get current solution from Apollo cache (for name, resources, customAttrs)
  const getCurrentSolution = (): { name: string; resources: any[]; customAttrs: Record<string, any> } | null => {
    try {
      const data = client.readQuery({
        query: SOLUTION,
        variables: { id: solutionId }
      });
      if (!data?.solution) return null;
      return {
        name: data.solution.name,
        resources: data.solution.resources || [],
        customAttrs: data.solution.customAttrs || {}
      };
    } catch (e) {
      console.warn('[useSolutionEditing] Cache read failed:', e);
      return null;
    }
  };

  // Simple attribute handlers - include name/resources since SolutionInput requires them
  const handleAttributeUpdate = async (oldKey: string, newKey: string, newValue: any) => {
    if (!solutionId) return;
    const solution = getCurrentSolution();
    if (!solution) return;

    const updated = { ...solution.customAttrs };
    if (oldKey !== newKey) {
      delete updated[oldKey];
      if (updated._order) {
        const idx = updated._order.indexOf(oldKey);
        if (idx !== -1) updated._order[idx] = newKey;
      }
    }
    updated[newKey] = newValue;

    await client.mutate({
      mutation: UPDATE_SOLUTION,
      variables: { id: solutionId, input: { name: solution.name, resources: solution.resources, customAttrs: updated } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleAttributeDelete = async (key: string) => {
    if (!solutionId) return;
    if (!confirm(`Delete attribute "${key}"?`)) return;
    const solution = getCurrentSolution();
    if (!solution) return;

    const updated = { ...solution.customAttrs };
    delete updated[key];
    if (updated._order) {
      updated._order = updated._order.filter((k: string) => k !== key);
    }

    await client.mutate({
      mutation: UPDATE_SOLUTION,
      variables: { id: solutionId, input: { name: solution.name, resources: solution.resources, customAttrs: updated } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleAttributeCreate = async (key: string, value: any) => {
    if (!solutionId) return;
    const solution = getCurrentSolution();
    if (!solution) return;

    const updated = { ...solution.customAttrs };
    updated[key] = value;
    const order = updated._order || Object.keys(updated).filter(k => !k.startsWith('_'));
    if (!order.includes(key)) order.push(key);
    updated._order = order;

    await client.mutate({
      mutation: UPDATE_SOLUTION,
      variables: { id: solutionId, input: { name: solution.name, resources: solution.resources, customAttrs: updated } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleAttributeReorder = async (newKeys: string[]) => {
    if (!solutionId) return;
    const solution = getCurrentSolution();
    if (!solution) {
      console.warn('[useSolutionEditing] handleAttributeReorder: solution not in cache');
      return;
    }

    const updated = { ...solution.customAttrs, _order: newKeys };

    await client.mutate({
      mutation: UPDATE_SOLUTION,
      variables: { id: solutionId, input: { name: solution.name, resources: solution.resources, customAttrs: updated } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  // Helper to convert customAttrs to AttributeItem[]
  const getAttributesList = (customAttrs: Record<string, any> | undefined): AttributeItem[] => {
    if (!customAttrs) return [];
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

  return {
    // Products
    handleProductAdd,
    handleProductRemove,
    handleProductReorder,
    // Outcomes
    handleOutcomeUpdate,
    handleOutcomeDelete,
    handleOutcomeCreate,
    handleOutcomeReorder,
    // Tags
    handleTagUpdate,
    handleTagDelete,
    handleTagCreate,
    handleTagReorder,
    // Releases
    handleReleaseUpdate,
    handleReleaseDelete,
    handleReleaseCreate,
    // Licenses
    handleLicenseUpdate,
    handleLicenseDelete,
    handleLicenseCreate,
    // Resources
    handleResourceUpdate,
    handleResourceDelete,
    handleResourceCreate,
    handleResourceReorder,
    // Attributes
    handleAttributeUpdate,
    handleAttributeDelete,
    handleAttributeCreate,
    handleAttributeReorder,
    getAttributesList
  };
}

