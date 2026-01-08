import { useApolloClient, useMutation } from '@apollo/client';
import {
    UPDATE_PERSONAL_PRODUCT,
    CREATE_PERSONAL_OUTCOME,
    UPDATE_PERSONAL_OUTCOME,
    DELETE_PERSONAL_OUTCOME,
    CREATE_PERSONAL_RELEASE,
    UPDATE_PERSONAL_RELEASE,
    DELETE_PERSONAL_RELEASE,
    GET_PERSONAL_PRODUCT,
    CREATE_PERSONAL_LICENSE,
    UPDATE_PERSONAL_LICENSE,
    DELETE_PERSONAL_LICENSE,
    REORDER_PERSONAL_LICENSES,
    CREATE_PERSONAL_TAG,
    UPDATE_PERSONAL_TAG,
    DELETE_PERSONAL_TAG,
    REORDER_PERSONAL_TAGS,
    PERSONAL_PRODUCT_FRAGMENT,
    GET_MY_PERSONAL_PRODUCTS
} from '../graphql/personal-sandbox';

const REFETCH_QUERIES = ['GetMyPersonalProducts', 'GetPersonalProduct'];

export function usePersonalProductEditing(personalProductId: string | null | undefined) {
    const client = useApolloClient();

    // Mutations
    const [updateProduct] = useMutation(UPDATE_PERSONAL_PRODUCT);

    // Outcomes
    const [createOutcome] = useMutation(CREATE_PERSONAL_OUTCOME);
    const [updateOutcome] = useMutation(UPDATE_PERSONAL_OUTCOME);
    const [deleteOutcome] = useMutation(DELETE_PERSONAL_OUTCOME);

    // Releases
    const [createRelease] = useMutation(CREATE_PERSONAL_RELEASE);
    const [updateRelease] = useMutation(UPDATE_PERSONAL_RELEASE);
    const [deleteRelease] = useMutation(DELETE_PERSONAL_RELEASE);

    // Licenses
    const [createLicense] = useMutation(CREATE_PERSONAL_LICENSE);
    const [updateLicense] = useMutation(UPDATE_PERSONAL_LICENSE);
    const [deleteLicense] = useMutation(DELETE_PERSONAL_LICENSE);
    const [reorderLicenses] = useMutation(REORDER_PERSONAL_LICENSES);

    // Tags
    const [createTag] = useMutation(CREATE_PERSONAL_TAG);
    const [updateTag] = useMutation(UPDATE_PERSONAL_TAG);
    const [deleteTag] = useMutation(DELETE_PERSONAL_TAG);
    const [reorderTags] = useMutation(REORDER_PERSONAL_TAGS);


    // Helper to get current product from Apollo cache
    const getCurrentProduct = (): any => {
        if (!personalProductId) return null;
        try {
            // Best approach: Read exact fragment from cache
            const id = `PersonalProduct:${personalProductId}`;
            const fragmentData = client.readFragment({
                id,
                fragment: PERSONAL_PRODUCT_FRAGMENT
            });
            if (fragmentData) return fragmentData;

            // Fallback: Try single product query cache
            const singleData = client.readQuery({
                query: GET_PERSONAL_PRODUCT,
                variables: { id: personalProductId }
            });
            if (singleData?.personalProduct) {
                return singleData.personalProduct;
            }

            // Fallback: Try list query cache
            const listData = client.readQuery({ query: GET_MY_PERSONAL_PRODUCTS });
            if (listData?.myPersonalProducts) {
                return listData.myPersonalProducts.find((p: any) => p.id === personalProductId) || null;
            }
        } catch (e) {
            console.warn('[usePersonalProductEditing] Cache read failed:', e);
        }
        return null;
    };

    // --- Outcomes ---
    const handleOutcomeUpdate = async (id: string, updates: any) => {
        await updateOutcome({ variables: { id, input: updates }, refetchQueries: REFETCH_QUERIES });
    };

    const handleOutcomeDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this outcome?')) return;
        await deleteOutcome({ variables: { id }, refetchQueries: REFETCH_QUERIES });
    };

    const handleOutcomeCreate = async (data: { name: string; description?: string }) => {
        if (!personalProductId) return;
        await createOutcome({ variables: { input: { ...data, personalProductId } }, refetchQueries: REFETCH_QUERIES });
    };

    const handleOutcomeReorder = async (newOrderIds: string[]) => {
        console.warn('Outcome reordering not supported in Personal Sandbox');
    };

    // --- Releases ---
    const handleReleaseUpdate = async (id: string, updates: any) => {
        const input: any = { ...updates };
        if (typeof input.level !== 'undefined') {
            input.version = String(input.level);
            delete input.level;
        }
        await updateRelease({ variables: { id, input }, refetchQueries: REFETCH_QUERIES });
    };

    const handleReleaseDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this release?')) return;
        await deleteRelease({ variables: { id }, refetchQueries: REFETCH_QUERIES });
    };

    const handleReleaseCreate = async (data: { name: string; description?: string; level?: number }) => {
        if (!personalProductId) return;
        const input: any = {
            name: data.name,
            version: data.level ? String(data.level) : '1.0',
        };
        await createRelease({ variables: { input: { ...input, personalProductId } }, refetchQueries: REFETCH_QUERIES });
    };

    const handleReleaseReorder = async (newOrderIds: string[]) => {
        console.warn('Release reordering not supported in Personal Sandbox');
    };

    // --- Resources ---
    const handleResourceUpdate = async (index: number, updates: { label?: string; url?: string }) => {
        if (!personalProductId) return;
        const product = getCurrentProduct();
        if (!product) return;

        const updatedResources = [...(product.resources || [])];
        updatedResources[index] = { ...updatedResources[index], ...updates };

        await updateProduct({
            variables: {
                id: personalProductId,
                input: { name: product.name, resources: updatedResources }
            },
            refetchQueries: REFETCH_QUERIES
        });
    };

    const handleResourceDelete = async (index: number) => {
        if (!personalProductId) return;
        const product = getCurrentProduct();
        if (!product) return;

        const updatedResources = [...(product.resources || [])];
        updatedResources.splice(index, 1);

        await updateProduct({
            variables: {
                id: personalProductId,
                input: { name: product.name, resources: updatedResources }
            },
            refetchQueries: REFETCH_QUERIES
        });
    };

    const handleResourceCreate = async (data: { label: string; url: string }) => {
        if (!personalProductId) return;
        const product = getCurrentProduct();
        if (!product) return;

        const updatedResources = [...(product.resources || []), data];

        await updateProduct({
            variables: {
                id: personalProductId,
                input: { name: product.name, resources: updatedResources }
            },
            refetchQueries: REFETCH_QUERIES
        });
    };

    const handleResourceReorder = async (newOrderIndexes: number[]) => {
        if (!personalProductId) return;
        const product = getCurrentProduct();
        if (!product) return;

        const updatedResources = newOrderIndexes.map(i => product.resources[i]);

        await updateProduct({
            variables: {
                id: personalProductId,
                input: { name: product.name, resources: updatedResources }
            },
            refetchQueries: REFETCH_QUERIES
        });
    };

    // --- Tags ---
    const handleTagCreate = async (data: { name: string; description?: string; color?: string }) => {
        if (!personalProductId) return;
        await createTag({ variables: { input: { ...data, personalProductId } }, refetchQueries: REFETCH_QUERIES });
    };

    const handleTagUpdate = async (id: string, updates: any) => {
        await updateTag({ variables: { id, input: updates }, refetchQueries: REFETCH_QUERIES });
    };

    const handleTagDelete = async (id: string) => {
        if (!confirm('Delete this tag?')) return;
        await deleteTag({ variables: { id }, refetchQueries: REFETCH_QUERIES });
    };

    const handleTagReorder = async (ids: string[]) => {
        await reorderTags({ variables: { ids } });
    };


    // --- Licenses ---
    const handleLicenseCreate = async (data: { name: string; description?: string; level?: number; isActive?: boolean }) => {
        if (!personalProductId) return;
        await createLicense({ variables: { input: { ...data, personalProductId } }, refetchQueries: REFETCH_QUERIES });
    };

    const handleLicenseUpdate = async (id: string, updates: any) => {
        await updateLicense({ variables: { id, input: updates }, refetchQueries: REFETCH_QUERIES });
    };

    const handleLicenseDelete = async (id: string) => {
        if (!confirm('Delete this license?')) return;
        await deleteLicense({ variables: { id }, refetchQueries: REFETCH_QUERIES });
    };

    const handleLicenseReorder = async (ids: string[]) => {
        await reorderLicenses({ variables: { ids } });
    };

    // --- Custom Attributes (Json on Product) ---
    const getAttributesList = (): { key: string; value: any }[] => {
        const product = getCurrentProduct();
        const customAttrs = product?.customAttrs || {};

        if (Array.isArray(customAttrs)) return customAttrs;

        const order = customAttrs._order || [];
        const keys = Object.keys(customAttrs).filter((k: string) => !k.startsWith('_'));

        keys.sort((a, b) => {
            const ia = order.indexOf(a);
            const ib = order.indexOf(b);
            if (ia === -1 && ib === -1) return 0;
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
        });

        return keys.map((key) => ({ key, value: customAttrs[key] }));
    };

    const handleAttributeCreate = async (key: string, value: any) => {
        if (!personalProductId) return;
        const product = getCurrentProduct();
        if (!product) return;

        const currentAttrs = product.customAttrs || {};
        const updated = { ...currentAttrs };
        updated[key] = value;

        // Create a copy of _order to avoid mutating frozen cache object
        const order = [...(updated._order || Object.keys(updated).filter((k: string) => !k.startsWith('_')))];
        if (!order.includes(key)) order.push(key);
        updated._order = order;

        await updateProduct({
            variables: { id: personalProductId, input: { name: product.name, customAttrs: updated } },
            refetchQueries: REFETCH_QUERIES
        });
    };

    const handleAttributeUpdate = async (oldKey: string, newKey: string, newValue: any) => {
        if (!personalProductId) return;
        const product = getCurrentProduct();
        if (!product) return;

        const currentAttrs = product.customAttrs || {};
        const updated = { ...currentAttrs };

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

        await updateProduct({
            variables: { id: personalProductId, input: { name: product.name, customAttrs: updated } },
            refetchQueries: REFETCH_QUERIES
        });
    };

    const handleAttributeDelete = async (key: string) => {
        if (!personalProductId) return;
        if (!confirm(`Delete attribute "${key}"?`)) return;
        const product = getCurrentProduct();
        if (!product) return;

        const currentAttrs = product.customAttrs || {};
        const updated = { ...currentAttrs };
        delete updated[key];

        if (updated._order) {
            updated._order = updated._order.filter((k: string) => k !== key);
        }

        await updateProduct({
            variables: { id: personalProductId, input: { name: product.name, customAttrs: updated } },
            refetchQueries: REFETCH_QUERIES
        });
    };

    const handleAttributeReorder = async (newKeys: string[]) => {
        if (!personalProductId) return;
        const product = getCurrentProduct();
        if (!product) return;

        const currentAttrs = product.customAttrs || {};
        const updated = { ...currentAttrs, _order: newKeys };

        await updateProduct({
            variables: { id: personalProductId, input: { name: product.name, customAttrs: updated } },
            refetchQueries: REFETCH_QUERIES
        });
    };

    return {
        // Outcomes
        handleOutcomeUpdate,
        handleOutcomeDelete,
        handleOutcomeCreate,
        handleOutcomeReorder,
        // Releases
        handleReleaseUpdate,
        handleReleaseDelete,
        handleReleaseCreate,
        handleReleaseReorder,
        // Resources
        handleResourceUpdate,
        handleResourceDelete,
        handleResourceCreate,
        handleResourceReorder,
        // Tags
        handleTagUpdate,
        handleTagDelete,
        handleTagCreate,
        handleTagReorder,
        // Licenses
        handleLicenseUpdate,
        handleLicenseDelete,
        handleLicenseCreate,
        handleLicenseReorder,
        // Attributes
        handleAttributeUpdate,
        handleAttributeDelete,
        handleAttributeCreate,
        handleAttributeReorder,
        getAttributesList
    };
}
