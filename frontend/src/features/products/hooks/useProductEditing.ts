/**
 * Shared hook for product editing logic.
 * Used by both ProductsPage (tabs) and ProductDialog to ensure identical behavior.
 */
import { useApolloClient, useMutation } from '@apollo/client';
import { UPDATE_PRODUCT } from '../graphql';
import { PRODUCT } from '../graphql';
import { CREATE_OUTCOME, UPDATE_OUTCOME, DELETE_OUTCOME, REORDER_OUTCOMES } from '@features/product-outcomes';
import { CREATE_RELEASE, UPDATE_RELEASE, DELETE_RELEASE, REORDER_RELEASES } from '@features/product-releases';
import { CREATE_LICENSE, UPDATE_LICENSE, DELETE_LICENSE, REORDER_LICENSES } from '@features/product-licenses';
import { CREATE_PRODUCT_TAG, UPDATE_PRODUCT_TAG, DELETE_PRODUCT_TAG, REORDER_PRODUCT_TAGS } from '@features/tags';
import { Product } from '../types';
import { AttributeItem } from '../components/shared/AttributesTable';

const REFETCH_QUERIES = ['Products', 'ProductDetail'];

export function useProductEditing(productId: string | null | undefined) {
  const client = useApolloClient();

  // Mutations
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [createOutcome] = useMutation(CREATE_OUTCOME);
  const [updateOutcome] = useMutation(UPDATE_OUTCOME);
  const [deleteOutcome] = useMutation(DELETE_OUTCOME);
  const [reorderOutcomes] = useMutation(REORDER_OUTCOMES);
  const [createRelease] = useMutation(CREATE_RELEASE);
  const [updateRelease] = useMutation(UPDATE_RELEASE);
  const [deleteRelease] = useMutation(DELETE_RELEASE);
  const [reorderReleases] = useMutation(REORDER_RELEASES);
  const [createLicense] = useMutation(CREATE_LICENSE);
  const [updateLicense] = useMutation(UPDATE_LICENSE);
  const [deleteLicense] = useMutation(DELETE_LICENSE);
  const [reorderLicenses] = useMutation(REORDER_LICENSES);
  const [createTag] = useMutation(CREATE_PRODUCT_TAG);
  const [updateTag] = useMutation(UPDATE_PRODUCT_TAG);
  const [deleteTag] = useMutation(DELETE_PRODUCT_TAG);
  const [reorderTags] = useMutation(REORDER_PRODUCT_TAGS);

  // --- Outcomes ---
  const handleOutcomeUpdate = async (id: string, updates: any) => {
    await client.mutate({
      mutation: UPDATE_OUTCOME,
      variables: { id, input: updates },
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
    if (!productId) return;
    await client.mutate({
      mutation: CREATE_OUTCOME,
      variables: { input: { ...data, productId } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleOutcomeReorder = async (newOrderIds: string[]) => {
    if (!productId) return;
    await client.mutate({
      mutation: REORDER_OUTCOMES,
      variables: { productId, outcomeIds: newOrderIds },
      refetchQueries: ['ProductDetail']
    });
  };

  // --- Tags ---
  const handleTagUpdate = async (id: string, updates: any) => {
    await client.mutate({
      mutation: UPDATE_PRODUCT_TAG,
      variables: { id, input: updates },
      refetchQueries: [...REFETCH_QUERIES, 'ProductTags']
    });
  };

  const handleTagDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    await client.mutate({
      mutation: DELETE_PRODUCT_TAG,
      variables: { id },
      refetchQueries: [...REFETCH_QUERIES, 'ProductTags']
    });
  };

  const handleTagCreate = async (data: { name: string; color: string; description?: string }) => {
    if (!productId) return;
    await client.mutate({
      mutation: CREATE_PRODUCT_TAG,
      variables: { input: { ...data, productId } },
      refetchQueries: [...REFETCH_QUERIES, 'ProductTags']
    });
  };

  const handleTagReorder = async (newOrderIds: string[]) => {
    if (!productId) return;
    await client.mutate({
      mutation: REORDER_PRODUCT_TAGS,
      variables: { productId, tagIds: newOrderIds },
      refetchQueries: ['ProductDetail']
    });
  };

  // --- Releases ---
  const handleReleaseUpdate = async (id: string, updates: any) => {
    await client.mutate({
      mutation: UPDATE_RELEASE,
      variables: { id, input: updates },
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
    if (!productId) return;
    await client.mutate({
      mutation: CREATE_RELEASE,
      variables: { input: { ...data, productId } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleReleaseReorder = async (newOrderIds: string[]) => {
    if (!productId) return;
    await client.mutate({
      mutation: REORDER_RELEASES,
      variables: { productId, releaseIds: newOrderIds },
      refetchQueries: ['ProductDetail']
    });
  };

  // --- Licenses ---
  const handleLicenseUpdate = async (id: string, updates: any) => {
    await client.mutate({
      mutation: UPDATE_LICENSE,
      variables: { id, input: updates },
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
    if (!productId) return;
    await client.mutate({
      mutation: CREATE_LICENSE,
      variables: { input: { ...data, productId } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleLicenseReorder = async (newOrderIds: string[]) => {
    if (!productId) return;
    await client.mutate({
      mutation: REORDER_LICENSES,
      variables: { productId, licenseIds: newOrderIds },
      refetchQueries: ['ProductDetail']
    });
  };

  // --- Resources ---
  // Resources are stored directly on the Product, so we update via UPDATE_PRODUCT
  const handleResourceUpdate = async (index: number, updates: { label?: string; url?: string }) => {
    if (!productId) return;
    const product = getCurrentProduct();
    if (!product) return;

    const updatedResources = [...product.resources];
    updatedResources[index] = { ...updatedResources[index], ...updates };
    // Strip __typename
    const cleanResources = updatedResources.map(r => ({ label: r.label, url: r.url }));

    await client.mutate({
      mutation: UPDATE_PRODUCT,
      variables: {
        id: productId,
        input: { name: product.name, resources: cleanResources, customAttrs: product.customAttrs }
      },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleResourceDelete = async (index: number) => {
    if (!productId) return;
    const product = getCurrentProduct();
    if (!product) return;

    const updatedResources = [...product.resources];
    updatedResources.splice(index, 1);
    const cleanResources = updatedResources.map(r => ({ label: r.label, url: r.url }));

    await client.mutate({
      mutation: UPDATE_PRODUCT,
      variables: {
        id: productId,
        input: { name: product.name, resources: cleanResources, customAttrs: product.customAttrs }
      },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleResourceCreate = async (data: { label: string; url: string }) => {
    if (!productId) return;
    const product = getCurrentProduct();
    if (!product) return;

    const updatedResources = [...product.resources, data];
    const cleanResources = updatedResources.map(r => ({ label: r.label, url: r.url }));

    await client.mutate({
      mutation: UPDATE_PRODUCT,
      variables: {
        id: productId,
        input: { name: product.name, resources: cleanResources, customAttrs: product.customAttrs }
      },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleResourceReorder = async (newOrderIndexes: number[]) => {
    if (!productId) return;
    const product = getCurrentProduct();
    if (!product) return;

    const updatedResources = newOrderIndexes.map(i => product.resources[i]);
    const cleanResources = updatedResources.map(r => ({ label: r.label, url: r.url }));

    await client.mutate({
      mutation: UPDATE_PRODUCT,
      variables: {
        id: productId,
        input: { name: product.name, resources: cleanResources, customAttrs: product.customAttrs }
      },
      refetchQueries: REFETCH_QUERIES
    });
  };

  // --- Custom Attributes ---
  // Helper to get current product from Apollo cache (for name, resources, customAttrs)
  const getCurrentProduct = (): { name: string; resources: any[]; customAttrs: Record<string, any> } | null => {
    try {
      const data = client.readQuery({
        query: PRODUCT,
        variables: { id: productId }
      });
      if (!data?.product) return null;
      return {
        name: data.product.name,
        resources: data.product.resources || [],
        customAttrs: data.product.customAttrs || {}
      };
    } catch (e) {
      console.warn('[useProductEditing] Cache read failed:', e);
      return null;
    }
  };

  // Simple attribute handlers - include name/resources since ProductInput requires them
  const handleAttributeUpdate = async (oldKey: string, newKey: string, newValue: any) => {
    if (!productId) return;
    const product = getCurrentProduct();
    if (!product) return;

    const updated = { ...product.customAttrs };
    // Copy _order to avoid mutating frozen cache
    if (updated._order) {
      updated._order = [...updated._order];
    }
    if (oldKey !== newKey) {
      delete updated[oldKey];
      if (updated._order) {
        const idx = updated._order.indexOf(oldKey);
        if (idx !== -1) updated._order[idx] = newKey;
      }
    }
    updated[newKey] = newValue;

    const cleanResources = (product.resources || []).map((r: any) => ({ label: r.label, url: r.url }));

    await client.mutate({
      mutation: UPDATE_PRODUCT,
      variables: { id: productId, input: { name: product.name, resources: cleanResources, customAttrs: updated } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleAttributeDelete = async (key: string) => {
    if (!productId) return;
    if (!confirm(`Delete attribute "${key}"?`)) return;
    const product = getCurrentProduct();
    if (!product) return;

    const updated = { ...product.customAttrs };
    delete updated[key];
    if (updated._order) {
      updated._order = updated._order.filter((k: string) => k !== key);
    }

    const cleanResources = (product.resources || []).map((r: any) => ({ label: r.label, url: r.url }));

    await client.mutate({
      mutation: UPDATE_PRODUCT,
      variables: { id: productId, input: { name: product.name, resources: cleanResources, customAttrs: updated } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleAttributeCreate = async (key: string, value: any) => {
    if (!productId) return;
    const product = getCurrentProduct();
    if (!product) return;

    const updated = { ...product.customAttrs };
    updated[key] = value;
    // Create a copy of _order to avoid mutating frozen cache object
    const order = [...(updated._order || Object.keys(updated).filter(k => !k.startsWith('_')))];
    if (!order.includes(key)) order.push(key);
    updated._order = order;

    const cleanResources = (product.resources || []).map((r: any) => ({ label: r.label, url: r.url }));

    await client.mutate({
      mutation: UPDATE_PRODUCT,
      variables: { id: productId, input: { name: product.name, resources: cleanResources, customAttrs: updated } },
      refetchQueries: REFETCH_QUERIES
    });
  };

  const handleAttributeReorder = async (newKeys: string[]) => {
    if (!productId) return;
    const product = getCurrentProduct();
    if (!product) {
      console.warn('[useProductEditing] handleAttributeReorder: product not in cache');
      return;
    }

    const updated = { ...product.customAttrs, _order: newKeys };

    const cleanResources = (product.resources || []).map((r: any) => ({ label: r.label, url: r.url }));

    await client.mutate({
      mutation: UPDATE_PRODUCT,
      variables: { id: productId, input: { name: product.name, resources: cleanResources, customAttrs: updated } },
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
    handleReleaseReorder,
    // Licenses
    handleLicenseUpdate,
    handleLicenseDelete,
    handleLicenseCreate,
    handleLicenseReorder,
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

