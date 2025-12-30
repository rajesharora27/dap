import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { PRODUCTS, PRODUCT, DELETE_PRODUCT, UPDATE_PRODUCT, CREATE_PRODUCT, TASKS_FOR_PRODUCT } from '../graphql';
import { Product } from '../types';
import { DEFAULT_VISIBLE_COLUMNS } from '@shared/components/ColumnVisibilityToggle';

// Define the context shape
interface ProductContextType {
    // Selection & Data
    selectedProductId: string | null;
    setSelectedProductId: (id: string | null) => void;
    products: Product[];
    loadingProducts: boolean;
    selectedProduct: Product | null;
    loadingSelectedProduct: boolean;
    refetchProducts: () => Promise<any>;
    refetchSelectedProduct: () => Promise<any>;

    // Tasks
    tasks: any[];
    loadingTasks: boolean;
    refetchTasks: () => Promise<any>;

    // Task Filters
    taskTagFilter: string[];
    setTaskTagFilter: (tags: string[]) => void;
    taskOutcomeFilter: string[];
    setTaskOutcomeFilter: (outcomes: string[]) => void;
    taskReleaseFilter: string[];
    setTaskReleaseFilter: (releases: string[]) => void;
    taskLicenseFilter: string[];
    setTaskLicenseFilter: (licenses: string[]) => void;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    handleClearFilters: () => void;
    filteredTasks: any[];

    // UI State
    visibleColumns: string[];
    handleToggleColumn: (columnKey: string) => void;
    selectedSubSection: 'summary' | 'resources' | 'tasks' | 'outcomes' | 'releases' | 'licenses' | 'customAttributes' | 'tags';
    setSelectedSubSection: (section: any) => void;

    // External Add Mode
    externalAddMode: string | null;
    setExternalAddMode: (mode: string | null) => void;

    // Global Messages
    successMessage: string | null;
    errorMessage: string | null;
    setSuccessMessage: (msg: string | null) => void;
    setErrorMessage: (msg: string | null) => void;

    // Mutations (wrappers)
    deleteProduct: (id: string) => Promise<void>;
    updateProduct: (id: string, input: any) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProductContext = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProductContext must be used within a ProductProvider');
    }
    return context;
};

interface ProductProviderProps {
    children: ReactNode;
    initialSelectedId?: string | null;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children, initialSelectedId }) => {
    // --- State ---
    const [selectedProductId, _setSelectedProductId] = useState<string | null>(() => {
        return initialSelectedId || localStorage.getItem('lastSelectedProductId') || null;
    });

    const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
        const saved = localStorage.getItem('dap_product_task_columns');
        return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLUMNS;
    });

    const [selectedSubSection, setSelectedSubSection] = useState<'summary' | 'resources' | 'tasks' | 'outcomes' | 'releases' | 'licenses' | 'customAttributes' | 'tags'>('summary');
    const [externalAddMode, setExternalAddMode] = useState<string | null>(null);

    const [taskTagFilter, setTaskTagFilter] = useState<string[]>([]);
    const [taskOutcomeFilter, setTaskOutcomeFilter] = useState<string[]>([]);
    const [taskReleaseFilter, setTaskReleaseFilter] = useState<string[]>([]);
    const [taskLicenseFilter, setTaskLicenseFilter] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const client = useApolloClient();

    // --- Persist Selection ---
    const setSelectedProductId = useCallback((id: string | null) => {
        _setSelectedProductId(id);
        if (id) {
            localStorage.setItem('lastSelectedProductId', id);
        } else {
            localStorage.removeItem('lastSelectedProductId');
        }
    }, []);

    // --- Persist Columns ---
    useEffect(() => {
        localStorage.setItem('dap_product_task_columns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    const handleToggleColumn = useCallback((columnKey: string) => {
        setVisibleColumns(prev =>
            prev.includes(columnKey)
                ? prev.filter(k => k !== columnKey)
                : [...prev, columnKey]
        );
    }, []);

    // --- Queries ---
    const {
        data: productsData,
        loading: loadingProducts,
        refetch: refetchProducts
    } = useQuery(PRODUCTS, {
        fetchPolicy: 'cache-and-network'
    });

    const products = productsData?.products?.edges?.map((e: any) => e.node) || [];

    // Fallback selection logic
    useEffect(() => {
        if (!loadingProducts && products.length > 0) {
            const isValidSelection = selectedProductId && products.some((p: any) => p.id === selectedProductId);

            if (!isValidSelection) {
                // Try case-insensitive comparison
                const defaultProduct = products.find((p: any) =>
                    p.name.trim().toLowerCase() === 'cisco secure access'
                );

                // Fallback to first product if default not found
                const targetId = defaultProduct ? defaultProduct.id : products[0].id;

                if (targetId && targetId !== selectedProductId) {
                    setSelectedProductId(targetId);
                }
            }
        }
    }, [products, loadingProducts, selectedProductId, setSelectedProductId]);

    // Single Product Detail
    const {
        data: productData,
        loading: loadingSelectedProduct,
        refetch: refetchSelectedProduct
    } = useQuery(PRODUCT, {
        variables: { id: selectedProductId },
        skip: !selectedProductId,
        fetchPolicy: 'cache-and-network'
    });

    const fetchedProduct = productData?.product;
    const listProduct = products.find((p: any) => p.id === selectedProductId);
    // Prefer detailed data, fallback to list data
    const selectedProduct = (fetchedProduct?.id === selectedProductId) ? fetchedProduct : listProduct;

    // Tasks for Product
    const {
        data: tasksData,
        loading: loadingTasks,
        refetch: refetchTasks
    } = useQuery(TASKS_FOR_PRODUCT, {
        variables: { productId: selectedProductId },
        skip: !selectedProductId
    });

    const tasks = tasksData?.tasks?.edges?.map((e: any) => e.node) || [];

    // Refetch tasks when switching to tasks tab
    useEffect(() => {
        if (selectedSubSection === 'tasks' && selectedProductId) {
            refetchTasks();
        }
    }, [selectedSubSection, selectedProductId, refetchTasks]);


    // --- Filtering Logic ---
    const filteredTasks = tasks.filter((task: any) => {
        // Tag filter (OR within tags)
        if (taskTagFilter.length > 0) {
            if (!task.tags?.some((t: any) => taskTagFilter.includes(t.id))) {
                return false;
            }
        }
        // Outcome filter (OR within outcomes)
        if (taskOutcomeFilter.length > 0) {
            const hasSpecificOutcomes = task.outcomes && task.outcomes.length > 0;

            // Special case: "__ALL_OUTCOMES__" means show ONLY tasks with no specific outcomes
            if (taskOutcomeFilter.includes('__ALL_OUTCOMES__')) {
                if (hasSpecificOutcomes) {
                    return false; // Exclude tasks that have specific outcomes
                }
                // Keep tasks with no specific outcomes (they apply to ALL)
            } else if (hasSpecificOutcomes) {
                // Normal filtering: check if task has any of the selected outcomes
                if (!task.outcomes.some((o: any) => taskOutcomeFilter.includes(o.id))) {
                    return false;
                }
            }
        }
        // Release filter (OR within releases)
        if (taskReleaseFilter.length > 0) {
            // If task has NO specific releases, it implies it applies to ALL releases
            const hasSpecificReleases = task.releases && task.releases.length > 0;
            if (hasSpecificReleases) {
                if (!task.releases.some((r: any) => taskReleaseFilter.includes(r.id))) {
                    return false;
                }
            }
        }
        // License filter (hierarchical - higher level includes lower levels)
        if (taskLicenseFilter.length > 0) {
            if (!task.license) {
                return false;
            }
            // Get the maximum level from selected licenses (higher level = includes more)
            const selectedLicenses = selectedProduct?.licenses?.filter((l: any) => taskLicenseFilter.includes(l.id)) || [];
            const maxSelectedLevel = Math.max(...selectedLicenses.map((l: any) => l.level || 0));
            // Task's license level must be <= max selected level
            if ((task.license.level || 0) > maxSelectedLevel) {
                return false;
            }
        }
        return true;
    });

    const handleClearFilters = useCallback(() => {
        setTaskTagFilter([]);
        setTaskOutcomeFilter([]);
        setTaskReleaseFilter([]);
        setTaskLicenseFilter([]);
    }, []);

    // --- Mutation Wrappers ---
    const deleteProduct = async (id: string) => {
        try {
            await client.mutate({
                mutation: DELETE_PRODUCT,
                variables: { id },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
            });
            setSelectedProductId(null);
            setSuccessMessage('Product deleted successfully');
        } catch (error: any) {
            console.error('Error deleting product:', error);
            setErrorMessage('Failed to delete product: ' + error.message);
            throw error;
        }
    };

    const updateProduct = async (id: string, input: any) => {
        try {
            await client.mutate({
                mutation: UPDATE_PRODUCT,
                variables: { id, input },
                refetchQueries: ['Products', 'ProductDetail'],
                awaitRefetchQueries: true
            });
            await refetchProducts();
            if (id === selectedProductId) {
                await refetchSelectedProduct();
            }
        } catch (error: any) {
            console.error('Error updating product:', error);
            setErrorMessage('Failed to update product: ' + error.message);
            throw error;
        }
    };

    const value: ProductContextType = {
        selectedProductId,
        setSelectedProductId,
        products,
        loadingProducts,
        selectedProduct,
        loadingSelectedProduct,
        refetchProducts,
        refetchSelectedProduct,

        tasks,
        loadingTasks,
        refetchTasks,

        taskTagFilter,
        setTaskTagFilter,
        taskOutcomeFilter,
        setTaskOutcomeFilter,
        taskReleaseFilter,
        setTaskReleaseFilter,
        taskLicenseFilter,
        setTaskLicenseFilter,
        showFilters,
        setShowFilters,
        handleClearFilters,
        filteredTasks,

        visibleColumns,
        handleToggleColumn,
        selectedSubSection,
        setSelectedSubSection,
        externalAddMode,
        setExternalAddMode,

        successMessage,
        errorMessage,
        setSuccessMessage,
        setErrorMessage,

        deleteProduct,
        updateProduct
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};
