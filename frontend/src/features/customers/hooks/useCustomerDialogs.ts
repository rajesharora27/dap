import { useCustomerContext } from '../context/CustomerContext';
import { useCallback } from 'react';

export function useCustomerDialogs() {
    const { dialogs } = useCustomerContext();

    const openAddCustomer = useCallback(() => {
        dialogs.customer.setEditingCustomer(null);
        dialogs.customer.setOpen(true);
    }, [dialogs.customer]);

    const openEditCustomer = useCallback((customer: any) => {
        dialogs.customer.setEditingCustomer(customer);
        dialogs.customer.setOpen(true);
    }, [dialogs.customer]);

    const closeCustomerDialog = useCallback(() => {
        dialogs.customer.setOpen(false);
        dialogs.customer.setEditingCustomer(null);
    }, [dialogs.customer]);

    const openAssignProduct = useCallback(() => {
        dialogs.assignProduct.setOpen(true);
    }, [dialogs.assignProduct]);

    const closeAssignProduct = useCallback(() => {
        dialogs.assignProduct.setOpen(false);
    }, [dialogs.assignProduct]);

    const openAssignSolution = useCallback(() => {
        dialogs.assignSolution.setOpen(true);
    }, [dialogs.assignSolution]);

    const closeAssignSolution = useCallback(() => {
        dialogs.assignSolution.setOpen(false);
    }, [dialogs.assignSolution]);

    return {
        // Customer Dialog
        isCustomerDialogOpen: dialogs.customer.open,
        editingCustomer: dialogs.customer.editingCustomer,
        openAddCustomer,
        openEditCustomer,
        closeCustomerDialog,

        // Assign Product Dialog
        isAssignProductOpen: dialogs.assignProduct.open,
        openAssignProduct,
        closeAssignProduct,

        // Assign Solution Dialog
        isAssignSolutionOpen: dialogs.assignSolution.open,
        openAssignSolution,
        closeAssignSolution
    };
}
