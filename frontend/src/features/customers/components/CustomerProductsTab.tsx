import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
    Box,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Chip,
} from '@mui/material';
import {
    Edit,
    Delete,
    Download,
    Upload,
    Sync,
} from '@shared/components/FAIcon';
import {
    ADOPTION_PLAN,
} from '../graphql/queries';
import { AssignProductDialog } from '@features/products';
import { EditLicensesDialog } from './EditLicensesDialog';
import { TaskDetailsDialog } from '@features/tasks/components/TaskDetailsDialog';
import { downloadFileFromUrl, ImportResultDialogState } from '@/features/telemetry/utils/telemetryOperations';
import { ProductAdoptionPlanView, TelemetryImportResultDialog } from '@features/adoption-plans';
import { CustomerAssignmentHeader } from './CustomerAssignmentHeader';
import { useCustomerContext } from '../context/CustomerContext';
import { ConfirmDialog } from '@shared/components';

// Define mutation outside component to prevent recreation on each render
const IMPORT_ADOPTION_PLAN_TELEMETRY = gql`
    mutation ImportAdoptionPlanTelemetry($adoptionPlanId: ID!, $file: Upload!) {
        importAdoptionPlanTelemetry(adoptionPlanId: $adoptionPlanId, file: $file) {
            success
            summary {
                tasksProcessed
                attributesUpdated
                criteriaEvaluated
                errors
            }
            taskResults {
                taskId
                taskName
                attributesUpdated
                criteriaMet
                criteriaTotal
                completionPercentage
            }
        }
    }
`;

export function CustomerProductsTab() {
    const {
        selectedCustomer: customer,
        loading,
        mutations,
        setSuccessMessage,
        setErrorMessage
    } = useCustomerContext();

    // Refs
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // State
    const [selectedCustomerProductId, setSelectedCustomerProductId] = useState<string | null>(null);
    const [assignProductDialogOpen, setAssignProductDialogOpen] = useState(false);
    const [editLicensesDialogOpen, setEditLicensesDialogOpen] = useState(false);
    const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);
    const [taskDetailsDialogOpen, setTaskDetailsDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [importResultDialog, setImportResultDialog] = useState<ImportResultDialogState>({ open: false, success: false });

    // Mutations from context
    const {
        syncAdoptionPlan,
        syncingPlan: syncLoading,
        exportTelemetryTemplate,
        updateCustomerProduct,
        updateTaskStatus,
        removeProductFromCustomer,
        removingProduct,
    } = mutations;

    // Derived data
    const sortedProducts = useMemo(() => {
        if (!customer?.products) return [];
        return [...customer.products].sort((a: any, b: any) => {
            const aIsDirect = !a.customerSolutionId;
            const bIsDirect = !b.customerSolutionId;
            if (aIsDirect && !bIsDirect) return -1;
            if (!aIsDirect && bIsDirect) return 1;
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [customer?.products]);

    // Handle default selection
    useEffect(() => {
        if (sortedProducts.length > 0 && !selectedCustomerProductId) {
            setSelectedCustomerProductId(sortedProducts[0].id);
        }
    }, [sortedProducts, selectedCustomerProductId]);

    const selectedCustomerProduct = useMemo(() =>
        sortedProducts?.find((cp: any) => cp.id === selectedCustomerProductId),
        [sortedProducts, selectedCustomerProductId]
    );

    const adoptionPlanId = selectedCustomerProduct?.adoptionPlan?.id;

    // We still need to know if the plan exists to show the "Sync Now" UI
    const { data: planData, loading: planLoading, error: planError, refetch: refetchPlan } = useQuery(ADOPTION_PLAN, {
        variables: { id: adoptionPlanId },
        skip: !adoptionPlanId,
        fetchPolicy: 'cache-and-network',
    });

    const handleProductChange = (id: string) => setSelectedCustomerProductId(id);

    const handleSync = () => {
        if (adoptionPlanId) {
            syncAdoptionPlan({
                variables: { adoptionPlanId },
                onCompleted: () => refetchPlan()
            });
        }
    };

    const handleExportTelemetry = async () => {
        if (!adoptionPlanId) return setErrorMessage('No adoption plan found');
        try {
            const { data } = await exportTelemetryTemplate({ variables: { adoptionPlanId } });
            if (data?.exportAdoptionPlanTelemetryTemplate) {
                const { url, filename } = data.exportAdoptionPlanTelemetryTemplate;
                await downloadFileFromUrl(url, filename);
            }
        } catch (err: any) {
            setErrorMessage(`Export failed: ${err.message}`);
        }
    };

    const [importAdoptionPlanTelemetry] = useMutation(IMPORT_ADOPTION_PLAN_TELEMETRY);

    const handleImportTelemetryClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportTelemetry = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !adoptionPlanId) return;

        // Close dialog first, then reopen with delay
        setImportResultDialog({ open: false, success: false });

        try {
            const { data } = await importAdoptionPlanTelemetry({
                variables: { adoptionPlanId, file }
            });

            const result = data?.importAdoptionPlanTelemetry;
            
            // Use setTimeout to ensure React processes the close before opening again
            setTimeout(() => {
                setImportResultDialog({
                    open: true,
                    success: result?.success ?? false,
                    summary: result?.summary,
                    taskResults: result?.taskResults ?? [],
                    errorMessage: result?.summary?.errors?.length ? result.summary.errors.join(', ') : undefined,
                    timestamp: Date.now(),
                });
            }, 50);
            
            if (result?.success) {
                refetchPlan();
            }
        } catch (err: any) {
            setTimeout(() => {
                setImportResultDialog({
                    open: true,
                    success: false,
                    errorMessage: err.message,
                    timestamp: Date.now(),
                });
            }, 50);
        }
        event.target.value = '';
    };

    const handleSaveLicenses = async (licenseLevel: string, outcomeIds: string[], releaseIds: string[]) => {
        if (!selectedCustomerProductId) return;
        try {
            await updateCustomerProduct({
                variables: {
                    id: selectedCustomerProductId,
                    input: {
                        licenseLevel,
                        outcomeIds,
                        releaseIds
                    }
                }
            });
            setSuccessMessage('Product settings updated successfully');
            setEditLicensesDialogOpen(false);
            refetchPlan();
        } catch (err: any) {
            setErrorMessage(`Failed to update settings: ${err.message}`);
        }
    };

    const handleDeleteProduct = async () => {
        if (!selectedCustomerProductId) return;
        try {
            await removeProductFromCustomer({
                variables: { id: selectedCustomerProductId }
            });
            setSuccessMessage('Product removed successfully');
            setDeleteProductDialogOpen(false);
            setSelectedCustomerProductId(null);
        } catch (err: any) {
            setErrorMessage(`Failed to remove product: ${err.message}`);
        }
    };

    const handleUpdateTaskStatus = (taskId: string, newStatus: string, notes?: string) => {
        updateTaskStatus({
            variables: {
                input: {
                    customerTaskId: taskId,
                    status: newStatus,
                    notes: notes || undefined
                }
            },
            onCompleted: () => refetchPlan()
        });
    };

    const adoptionPlan = planData?.adoptionPlan;

    const headerItems = sortedProducts.map((cp: any) => ({
        id: cp.id,
        label: (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight={600}>{cp.name}</Typography>
                <Typography variant="caption" color="text.secondary">({cp.product?.name})</Typography>
                {cp.customerSolutionId && (
                    <Chip label="Solution" size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem', ml: 0.5 }} />
                )}
            </Box>
        )
    }));

    const headerActions = [
        {
            id: 'export',
            label: 'Export Telemetry Template',
            icon: <Download />,
            onClick: handleExportTelemetry,
            tooltip: 'Export Telemetry Template'
        },
        {
            id: 'import',
            label: 'Import Telemetry',
            icon: <Upload />,
            onClick: handleImportTelemetryClick,
            tooltip: 'Import Telemetry'
        },
        {
            id: 'sync',
            label: 'Sync with latest product tasks',
            icon: <Sync />,
            onClick: handleSync,
            disabled: syncLoading,
            tooltip: 'Sync with latest product tasks'
        },
        {
            id: 'edit',
            label: 'Edit licenses and version',
            icon: <Edit />,
            onClick: () => setEditLicensesDialogOpen(true),
            tooltip: 'Edit licenses and version'
        },
        {
            id: 'delete',
            label: 'Remove product assignment',
            icon: <Delete />,
            onClick: () => setDeleteProductDialogOpen(true),
            color: 'error' as const,
            tooltip: 'Remove product assignment'
        }
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        );
    }

    return (
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 1400, p: { xs: 1.5, sm: 2, md: 0 } }}>
                <input type="file" ref={fileInputRef} hidden accept=".xlsx" onChange={handleImportTelemetry} />

                <CustomerAssignmentHeader
                    selectedId={selectedCustomerProductId}
                    onSelect={handleProductChange}
                    items={headerItems}
                    onAssignNew={() => setAssignProductDialogOpen(true)}
                    assignNewLabel="Assign New Product"
                    actions={adoptionPlan ? headerActions : []}
                    themeColor={selectedCustomerProduct?.customerSolutionId ? "#3B82F6" : "#10B981"}
                />

                {/* Main Content Area */}
                <Box sx={{ p: { xs: 0, md: 2 } }}>
                    {planLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                    )}

                    {planError && (
                        <Alert severity="error" sx={{ mb: 2 }}>{planError.message}</Alert>
                    )}

                    {!planLoading && !adoptionPlan && selectedCustomerProductId && (
                        <Alert severity="info" action={<Button color="inherit" size="small" onClick={handleSync}>Sync Now</Button>}>
                            No Adoption Plan found for this product. Use Sync to create one based on current product tasks.
                        </Alert>
                    )}

                    {adoptionPlan && adoptionPlanId && (
                        <ProductAdoptionPlanView
                            adoptionPlanId={adoptionPlanId}
                            onUpdateTaskStatus={handleUpdateTaskStatus}
                        />
                    )}
                </Box>
            </Box>

            {/* Dialogs */}
            <TaskDetailsDialog
                open={taskDetailsDialogOpen}
                onClose={() => setTaskDetailsDialogOpen(false)}
                task={selectedTask}
            />

            <AssignProductDialog
                open={assignProductDialogOpen}
                onClose={() => setAssignProductDialogOpen(false)}
                customerId={customer.id}
                onAssigned={() => { refetchPlan(); setAssignProductDialogOpen(false); }}
            />

            {selectedCustomerProductId && adoptionPlan && (
                <EditLicensesDialog
                    open={editLicensesDialogOpen}
                    onClose={() => setEditLicensesDialogOpen(false)}
                    customerProductId={selectedCustomerProductId}
                    productId={adoptionPlan.productId}
                    currentLicenseLevel={adoptionPlan.licenseLevel}
                    currentSelectedOutcomes={adoptionPlan.selectedOutcomes}
                    currentSelectedReleases={adoptionPlan.selectedReleases}
                    onSave={handleSaveLicenses}
                />
            )}

            <ConfirmDialog
                open={deleteProductDialogOpen}
                title="Remove Product Assignment"
                message={`Are you sure you want to remove "${selectedCustomerProduct?.name}" from this customer? This will also remove the associated adoption plan and all recorded progress. This action cannot be undone.`}
                confirmLabel={removingProduct ? "Removing..." : "Remove"}
                onConfirm={handleDeleteProduct}
                onCancel={() => setDeleteProductDialogOpen(false)}
                severity="error"
            />

            {/* Telemetry Import Result Dialog */}
            <TelemetryImportResultDialog
                state={importResultDialog}
                onClose={() => setImportResultDialog({ ...importResultDialog, open: false })}
            />
        </Box>
    );
}
