import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Alert,
    CircularProgress
} from '@mui/material';
import { Add, Edit, Delete, Sync } from '@shared/components/FAIcon';
import { useQuery } from '@apollo/client';
import {
    SOLUTION_ADOPTION_PLAN,
} from '../graphql/queries';
import { AssignSolutionDialog } from './AssignSolutionDialog';
import { EditSolutionLicensesDialog } from './EditSolutionLicensesDialog';
import { SolutionAdoptionPlanView } from '@features/adoption-plans';
import { CustomerAssignmentHeader } from './CustomerAssignmentHeader';
import { useCustomerContext } from '../context/CustomerContext';
import { ConfirmDialog } from '@shared/components';

export function CustomerSolutionsTab() {
    const {
        selectedCustomer: customer,
        loading: customerLoading,
        refetch,
        mutations,
        setSuccessMessage,
        setErrorMessage
    } = useCustomerContext();

    const customerId = customer?.id;
    const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [editLicensesDialogOpen, setEditLicensesDialogOpen] = useState(false);
    const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);

    const {
        syncSolutionAdoptionPlan,
        syncingSolutionPlan: syncLoading,
        removeSolutionFromCustomer,
        removingSolution: removeLoading,
        createSolutionAdoptionPlan
    } = mutations;

    // Auto-select last used solution or first available solution
    useEffect(() => {
        if (!customer?.solutions || customer.solutions.length === 0) {
            setSelectedSolutionId(null);
            return;
        }

        const solutions = customer.solutions;
        const lastSelectedKey = `lastSolutionAdoptionPlan_${customerId}`;
        const lastSelectedId = localStorage.getItem(lastSelectedKey);

        if (lastSelectedId && solutions.some((s: any) => s.id === lastSelectedId)) {
            setSelectedSolutionId(lastSelectedId);
        } else if (!selectedSolutionId) {
            const saseSolution = solutions.find((s: any) => s.solution?.name === 'SASE');
            const solutionWithPlan = solutions.find((s: any) => s.adoptionPlan);
            setSelectedSolutionId(saseSolution?.id || solutionWithPlan?.id || solutions[0].id);
        }
    }, [customer?.solutions, customerId, selectedSolutionId]);

    useEffect(() => {
        if (selectedSolutionId && customerId) {
            const lastSelectedKey = `lastSolutionAdoptionPlan_${customerId}`;
            localStorage.setItem(lastSelectedKey, selectedSolutionId);
        }
    }, [selectedSolutionId, customerId]);

    const selectedCustomerSolution = React.useMemo(() =>
        customer?.solutions?.find((cs: any) => cs.id === selectedSolutionId),
        [customer?.solutions, selectedSolutionId]
    );

    const adoptionPlanIdForQuery = selectedCustomerSolution?.adoptionPlan?.id;

    const { data: planData, refetch: refetchPlan } = useQuery(SOLUTION_ADOPTION_PLAN, {
        variables: { id: adoptionPlanIdForQuery },
        skip: !selectedSolutionId || !selectedCustomerSolution?.adoptionPlan
    });

    const handleDelete = () => {
        if (selectedSolutionId) {
            removeSolutionFromCustomer({
                variables: { id: selectedSolutionId }
            }).then(() => {
                setSelectedSolutionId(null);
                refetch();
                setDeleteConfirmDialogOpen(false);
                setSuccessMessage('Solution removed successfully');
            }).catch(err => {
                setErrorMessage(`Failed to remove solution: ${err.message}`);
            });
        }
    };

    if (!customerId) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">No Customer Selected</Typography>
            </Box>
        );
    }

    if (customerLoading) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    const customerSolutions = customer?.solutions || [];

    const headerItems = customerSolutions.map((cs: any) => ({
        id: cs.id,
        label: cs.name ? `${cs.name} - ${cs.solution?.name} (${cs.licenseLevel})` : `${cs.solution?.name} (${cs.licenseLevel})`
    }));

    const headerActions = [];
    if (selectedCustomerSolution?.adoptionPlan) {
        headerActions.push({
            id: 'sync',
            label: syncLoading ? 'Syncing...' : selectedCustomerSolution.adoptionPlan.needsSync ? 'Sync Needed' : 'Sync with latest solution tasks',
            icon: <Sync />,
            onClick: () => syncSolutionAdoptionPlan({ variables: { solutionAdoptionPlanId: selectedCustomerSolution.adoptionPlan.id } }),
            disabled: syncLoading,
            color: (selectedCustomerSolution.adoptionPlan.needsSync ? 'warning' : 'primary') as "warning" | "primary",
            tooltip: syncLoading ? 'Syncing...' : selectedCustomerSolution.adoptionPlan.needsSync ? 'Sync Needed' : 'Sync with latest solution tasks'
        });
    }

    headerActions.push({
        id: 'edit',
        label: 'Edit solution licenses',
        icon: <Edit />,
        onClick: () => setEditLicensesDialogOpen(true),
        tooltip: 'Edit solution licenses'
    });

    headerActions.push({
        id: 'delete',
        label: 'Remove solution assignment',
        icon: <Delete />,
        onClick: () => setDeleteConfirmDialogOpen(true),
        color: 'error' as "error",
        tooltip: 'Remove solution assignment'
    });

    const emptyMessage = (
        <Box sx={{ textAlign: 'center', py: 6, px: 3, backgroundColor: 'background.default', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>No Solutions Assigned Yet</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setAssignDialogOpen(true)} sx={{ mt: 2 }}>
                Assign First Solution
            </Button>
        </Box>
    );

    return (
        <Box sx={{ p: 2.5 }}>
            <CustomerAssignmentHeader
                selectedId={selectedSolutionId}
                onSelect={(id) => setSelectedSolutionId(id)}
                items={headerItems}
                onAssignNew={() => setAssignDialogOpen(true)}
                assignNewLabel="Assign New Solution"
                actions={selectedSolutionId ? headerActions : []}
                emptyMessage={emptyMessage}
            />

            {selectedCustomerSolution?.adoptionPlan && (
                <SolutionAdoptionPlanView
                    solutionAdoptionPlanId={selectedCustomerSolution.adoptionPlan.id}
                    customerName={customer.name}
                    lastSyncedAt={selectedCustomerSolution.adoptionPlan.lastSyncedAt}
                />
            )}

            {selectedSolutionId && !selectedCustomerSolution?.adoptionPlan && (
                <Alert severity="warning" sx={{ mt: 2 }} action={
                    <Button color="inherit" size="small" onClick={async () => {
                        try {
                            await createSolutionAdoptionPlan({ variables: { customerSolutionId: selectedSolutionId } });
                            refetch();
                        } catch (err: any) {
                            setErrorMessage(`Failed to create adoption plan: ${err.message}`);
                        }
                    }}>Create Now</Button>
                }>This solution does not have an adoption plan yet.</Alert>
            )}

            <AssignSolutionDialog
                open={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
                customerId={customerId}
                onSuccess={() => { refetch(); setAssignDialogOpen(false); }}
            />

            {selectedSolutionId && (
                <EditSolutionLicensesDialog
                    open={editLicensesDialogOpen}
                    onClose={() => setEditLicensesDialogOpen(false)}
                    customerSolutionId={selectedSolutionId}
                    onSuccess={() => { refetch(); refetchPlan(); setEditLicensesDialogOpen(false); }}
                />
            )}

            <ConfirmDialog
                open={deleteConfirmDialogOpen}
                title="Remove Solution Assignment"
                message={`Are you sure you want to remove "${selectedCustomerSolution?.name}" from this customer? This will also remove the adoption plan and underlying product assignments. This action cannot be undone.`}
                confirmLabel={removeLoading ? "Deleting..." : "Delete"}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirmDialogOpen(false)}
                severity="error"
            />
        </Box>
    );
}
