import * as React from 'react';
import { useState } from 'react';
import { Box } from '@mui/material';
import { CustomerMetricCards } from './CustomerMetricCards';
import { CustomerAssignmentsTable, TableItem } from './CustomerAssignmentsTable';
import { useCustomerContext } from '../context/CustomerContext';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';

interface CustomerOverviewTabProps {
    onProductClick: () => void;
    onSolutionClick: () => void;
    onAssignProduct: () => void;
    onAssignSolution: () => void;
}

export function CustomerOverviewTab({
    onProductClick,
    onSolutionClick,
    onAssignProduct,
    onAssignSolution,
}: CustomerOverviewTabProps) {
    const {
        selectedCustomer,
        overviewMetrics,
        mutations,
        refetch,
        setSuccessMessage,
        setErrorMessage
    } = useCustomerContext();

    const [deleteConfirm, setDeleteConfirm] = useState<{
        open: boolean;
        type: 'product' | 'solution' | null;
        id: string | null;
        name: string;
    }>({ open: false, type: null, id: null, name: '' });

    const products = selectedCustomer?.products || [];
    const solutions = selectedCustomer?.solutions || [];

    // Combine products and solutions into a single table items list
    const tableItems: TableItem[] = React.useMemo(() => {
        const items: TableItem[] = [];

        // Add products
        products.forEach((cp: any) => {
            const isSolution = !!cp.customerSolutionId;
            const assignmentName = isSolution ? cp.name.split(' - ')[0] : cp.name;

            items.push({
                id: cp.id,
                assignmentName: assignmentName,
                itemName: cp.product?.name || 'Unknown Product',
                licenseLevel: cp.licenseLevel,
                type: 'product',
                source: isSolution ? 'solution' : 'direct',
                progress: cp.adoptionPlan?.progressPercentage || 0,
                lastSyncedAt: cp.adoptionPlan?.lastSyncedAt,
                adoptionPlanId: cp.adoptionPlan?.id,
            });
        });

        // Add solutions
        solutions.forEach((cs: any) => {
            items.push({
                id: cs.id,
                assignmentName: cs.name,
                itemName: cs.solution?.name || 'Unknown Solution',
                licenseLevel: cs.licenseLevel,
                type: 'solution',
                source: 'direct',
                progress: cs.adoptionPlan?.progressPercentage || 0,
                lastSyncedAt: cs.adoptionPlan?.lastSyncedAt,
                adoptionPlanId: cs.adoptionPlan?.id,
                needsSync: cs.adoptionPlan?.needsSync,
            });
        });

        return items;
    }, [products, solutions]);

    const handleSyncProduct = (id: string) => {
        const product = products.find((p: any) => p.id === id);
        if (product?.adoptionPlan?.id) {
            mutations.syncAdoptionPlan({
                variables: { adoptionPlanId: product.adoptionPlan.id }
            });
        }
    };

    const handleSyncSolution = (id: string, planId: string) => {
        mutations.syncSolutionAdoptionPlan({
            variables: { solutionAdoptionPlanId: planId }
        });
    };

    const handleDeleteProduct = (id: string) => {
        const product = products.find((p: any) => p.id === id);
        const name = product?.product?.name || product?.name || 'this product';
        setDeleteConfirm({ open: true, type: 'product', id, name });
    };

    const handleDeleteSolution = (id: string) => {
        const solution = solutions.find((s: any) => s.id === id);
        const name = solution?.solution?.name || solution?.name || 'this solution';
        setDeleteConfirm({ open: true, type: 'solution', id, name });
    };

    const handleConfirmDelete = async () => {
        const { type, id } = deleteConfirm;
        if (!id) return;

        try {
            if (type === 'product') {
                await mutations.removeProductFromCustomer({
                    variables: { id }
                });
                setSuccessMessage('Product removed successfully');
            } else if (type === 'solution') {
                await mutations.removeSolutionFromCustomer({
                    variables: { id }
                });
                setSuccessMessage('Solution removed successfully');
            }
            refetch();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to remove assignment');
        } finally {
            setDeleteConfirm({ open: false, type: null, id: null, name: '' });
        }
    };

    return (
        <Box sx={{ p: 2.5 }}>
            <CustomerMetricCards overviewMetrics={overviewMetrics} />
            <CustomerAssignmentsTable
                items={tableItems}
                onSyncProduct={handleSyncProduct}
                onSyncSolution={handleSyncSolution}
                onAssignProduct={onAssignProduct}
                onAssignSolution={onAssignSolution}
                onEditProduct={() => onProductClick()}
                onEditSolution={() => onSolutionClick()}
                onDeleteProduct={handleDeleteProduct}
                onDeleteSolution={handleDeleteSolution}
                syncingProductId={mutations.syncingPlan ? 'syncing' : null}
                syncingSolutionId={mutations.syncingSolutionPlan ? 'syncing' : null}
            />

            <ConfirmDialog
                open={deleteConfirm.open}
                title={`Remove ${deleteConfirm.type === 'product' ? 'Product' : 'Solution'} Assignment`}
                message={deleteConfirm.type === 'product' 
                    ? `Are you sure you want to remove "${deleteConfirm.name}" from this customer? This will also remove the associated adoption plan and all recorded progress. This action cannot be undone.`
                    : `Are you sure you want to remove "${deleteConfirm.name}" from this customer? This will also remove the adoption plan and underlying product assignments. This action cannot be undone.`
                }
                confirmLabel="Remove"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirm({ open: false, type: null, id: null, name: '' })}
                severity="error"
            />
        </Box>
    );
}
