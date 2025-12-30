import * as React from 'react';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useCustomerData } from '../hooks/useCustomerData';
import { useCustomerMutations } from '../hooks/useCustomerMutations';

interface CustomerContextType {
    // Selection State
    selectedCustomerId: string | null;
    setSelectedCustomerId: (id: string | null) => void;

    // Data State (from useCustomerData)
    customers: any[];
    selectedCustomer: any | null;
    overviewMetrics: any;
    loading: boolean;
    error: any;
    refetch: () => Promise<any>;

    // Mutation Actions (from useCustomerMutations)
    mutations: ReturnType<typeof useCustomerMutations>;

    // Dialog States
    dialogs: {
        customer: {
            open: boolean;
            setOpen: (open: boolean) => void;
            editingCustomer: any | null;
            setEditingCustomer: (c: any | null) => void
        };
        assignProduct: {
            open: boolean;
            setOpen: (open: boolean) => void
        };
        assignSolution: {
            open: boolean;
            setOpen: (open: boolean) => void
        };
    };

    // UI Status State
    successMessage: string | null;
    errorMessage: string | null;
    setSuccessMessage: (msg: string | null) => void;
    setErrorMessage: (msg: string | null) => void;
    clearMessages: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode; initialSelectedId?: string | null }> = ({
    children,
    initialSelectedId
}) => {
    // Selection logic with localStorage persistence
    const [selectedCustomerId, setInternalSelectedId] = useState<string | null>(() => {
        if (initialSelectedId !== undefined) return initialSelectedId;
        return localStorage.getItem('lastSelectedCustomerId');
    });

    const setSelectedCustomerId = (id: string | null) => {
        setInternalSelectedId(id);
        if (id) localStorage.setItem('lastSelectedCustomerId', id);
        else localStorage.removeItem('lastSelectedCustomerId');
    };

    // Sync with prop if it changes
    useEffect(() => {
        if (initialSelectedId !== undefined) {
            setInternalSelectedId(initialSelectedId);
        }
    }, [initialSelectedId]);

    // Data fetching
    const {
        customers,
        selectedCustomer,
        overviewMetrics,
        loading,
        error,
        refetch
    } = useCustomerData(selectedCustomerId);

    // Mutations
    const mutations = useCustomerMutations();

    // Dialog States
    const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
    const [assignProductDialogOpen, setAssignProductDialogOpen] = useState(false);
    const [assignSolutionDialogOpen, setAssignSolutionDialogOpen] = useState(false);

    // Status messages
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const clearMessages = () => {
        setSuccessMessage(null);
        setErrorMessage(null);
    };

    const value = useMemo(() => ({
        selectedCustomerId,
        setSelectedCustomerId,
        customers,
        selectedCustomer,
        overviewMetrics,
        loading,
        error,
        refetch,
        mutations,
        dialogs: {
            customer: {
                open: customerDialogOpen,
                setOpen: setCustomerDialogOpen,
                editingCustomer,
                setEditingCustomer
            },
            assignProduct: {
                open: assignProductDialogOpen,
                setOpen: setAssignProductDialogOpen
            },
            assignSolution: {
                open: assignSolutionDialogOpen,
                setOpen: setAssignSolutionDialogOpen
            }
        },
        successMessage,
        errorMessage,
        setSuccessMessage,
        setErrorMessage,
        clearMessages
    }), [
        selectedCustomerId,
        customers,
        selectedCustomer,
        overviewMetrics,
        loading,
        error,
        mutations,
        customerDialogOpen,
        editingCustomer,
        assignProductDialogOpen,
        assignSolutionDialogOpen,
        successMessage,
        errorMessage
    ]);

    return (
        <CustomerContext.Provider value={value}>
            {children}
        </CustomerContext.Provider>
    );
};

export const useCustomerContext = () => {
    const context = useContext(CustomerContext);
    if (context === undefined) {
        throw new Error('useCustomerContext must be used within a CustomerProvider');
    }
    return context;
};
