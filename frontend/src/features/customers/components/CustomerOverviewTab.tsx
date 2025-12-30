import * as React from 'react';
import { Box } from '@mui/material';
import { CustomerMetricCards } from './CustomerMetricCards';
import { CustomerAssignmentsTable, TableItem } from './CustomerAssignmentsTable';
import { useCustomerContext } from '../context/CustomerContext';

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
        mutations
    } = useCustomerContext();

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

    return (
        <Box sx={{ p: 2.5 }}>
            <CustomerMetricCards overviewMetrics={overviewMetrics} />
            <CustomerAssignmentsTable
                items={tableItems}
                onSyncProduct={handleSyncProduct}
                onSyncSolution={handleSyncSolution}
                onAssignProduct={onAssignProduct}
                onAssignSolution={onAssignSolution}
                onEditProduct={() => onProductClick()} // Navigate to products tab
                onEditSolution={() => onSolutionClick()} // Navigate to solutions tab
                onDeleteProduct={() => { }} // Handle deletion if needed, but Overview usually just links
                onDeleteSolution={() => { }}
                syncingProductId={mutations.syncingPlan ? 'syncing' : null}
                syncingSolutionId={mutations.syncingSolutionPlan ? 'syncing' : null}
            />
        </Box>
    );
}
