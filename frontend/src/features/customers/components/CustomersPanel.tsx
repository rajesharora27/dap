import * as React from 'react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Alert,
  Tabs,
  Tab,
  Typography
} from '@mui/material';
import { Add } from '@shared/components/FAIcon';
import { CustomerSelector } from './CustomerSelector';
import { CustomerProductsTab } from './CustomerProductsTab';
import { CustomerSolutionsTab } from './CustomerSolutionsTab';
import { CustomerOverviewTab } from './CustomerOverviewTab';
import { CustomerDialog } from './CustomerDialog';
import { AssignProductDialog } from '@features/products';
import { AssignSolutionDialog } from './AssignSolutionDialog';
import { ConfirmDialog } from '@shared/components';
import { CustomerProvider, useCustomerContext } from '../context/CustomerContext';
import { useCustomerDialogs } from '../hooks/useCustomerDialogs';

interface CustomersPanelProps {
  selectedCustomerId?: string | null;
  onRequestAddCustomer?: () => void;
  forceTab?: 'main' | 'products' | 'solutions';
  hideTabs?: boolean;
}

export function CustomersPanel(props: CustomersPanelProps) {
  return (
    <CustomerProvider initialSelectedId={props.selectedCustomerId}>
      <CustomersPanelContent {...props} />
    </CustomerProvider>
  );
}

function CustomersPanelContent({ forceTab, hideTabs }: CustomersPanelProps) {
  const {
    selectedCustomerId,
    setSelectedCustomerId,
    customers,
    selectedCustomer,
    loading,
    refetch,
    mutations,
    successMessage,
    errorMessage,
    setSuccessMessage,
    setErrorMessage,
    clearMessages
  } = useCustomerContext();

  const {
    isCustomerDialogOpen,
    editingCustomer,
    openAddCustomer,
    openEditCustomer,
    closeCustomerDialog,
    isAssignProductOpen,
    openAssignProduct,
    closeAssignProduct,
    isAssignSolutionOpen,
    openAssignSolution,
    closeAssignSolution
  } = useCustomerDialogs();

  const [activeTab, setActiveTab] = useState<'main' | 'products' | 'solutions'>(forceTab || 'main');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; customer: any }>({
    open: false,
    customer: null
  });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('add') === 'true') {
      openAddCustomer();
      // Clear the param after opening
      const newParams = new URLSearchParams(location.search);
      newParams.delete('add');
      navigate({ search: newParams.toString() }, { replace: true });
    }
  }, [location.search, openAddCustomer, navigate]);

  // Sync activeTab with forceTab when it changes
  useEffect(() => {
    if (forceTab) {
      setActiveTab(forceTab);
    }
  }, [forceTab]);

  const handleConfirmDelete = () => {
    const { customer } = deleteConfirm;
    mutations.deleteCustomer({ variables: { id: customer.id } })
      .then(() => {
        if (selectedCustomerId === customer.id) {
          setSelectedCustomerId(null);
        }
        refetch();
        setSuccessMessage('Customer deleted successfully');
        setDeleteConfirm({ open: false, customer: null });
      })
      .catch(err => setErrorMessage(err.message));
  };

  const handleSaveCustomer = async (customerData: any) => {
    try {
      if (editingCustomer) {
        await mutations.updateCustomer({
          variables: { id: editingCustomer.id, input: customerData }
        });
        setSuccessMessage('Customer updated successfully');
      } else {
        const res = await mutations.createCustomer({
          variables: { input: customerData }
        });
        const newId = res.data?.createCustomer?.id;
        if (newId) {
          setSelectedCustomerId(newId);
        }
        setSuccessMessage('Customer created successfully');
      }
      refetch();
      closeCustomerDialog();
    } catch (err: any) {
      throw err;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Messages */}
      {errorMessage && (
        <Alert severity="error" onClose={clearMessages} sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" onClose={clearMessages} sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
          {successMessage}
        </Alert>
      )}

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Customer Selector */}
        {!hideTabs && (
          <CustomerSelector
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            onSelectCustomer={setSelectedCustomerId}
            onAddCustomer={openAddCustomer}
            onEditCustomer={openEditCustomer}
            onDeleteCustomer={(c) => setDeleteConfirm({ open: true, customer: c })}
            loading={loading}
          />
        )}

        {selectedCustomer ? (
          <>
            {!hideTabs && (
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ mt: 2, backgroundColor: 'background.paper', borderRadius: '12px 12px 0 0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderBottom: '3px solid', borderColor: 'primary.main' }}>
                  <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{
                      '& .MuiTabs-indicator': { height: 4, borderRadius: '4px 4px 0 0', backgroundColor: 'primary.main' },
                      '& .MuiTab-root': {
                        fontWeight: 700,
                        fontSize: '1rem',
                        textTransform: 'none',
                        minWidth: 100,
                        py: 1.5,
                        px: 3,
                        color: 'text.secondary',
                        borderRadius: '12px 12px 0 0',
                        '&.Mui-selected': { color: 'primary.main', backgroundColor: 'rgba(4, 159, 217, 0.08)' },
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', color: 'primary.main' }
                      }
                    }}
                  >
                    <Tab label="Overview" value="main" />
                    <Tab
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          Products Assigned
                          <Box component="span" onClick={(e) => { e.stopPropagation(); openAssignProduct(); }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', color: '#10B981', '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.1)' } }}><Add fontSize="small" /></Box>
                        </Box>
                      }
                      value="products"
                    />
                    <Tab
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          Solutions Assigned
                          <Box component="span" onClick={(e) => { e.stopPropagation(); openAssignSolution(); }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', color: '#3B82F6', '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.1)' } }}><Add fontSize="small" /></Box>
                        </Box>
                      }
                      value="solutions"
                    />
                  </Tabs>
                </Box>
              </Box >
            )}

            {activeTab === 'main' && (
              <CustomerOverviewTab
                onProductClick={() => setActiveTab('products')}
                onSolutionClick={() => setActiveTab('solutions')}
                onAssignProduct={openAssignProduct}
                onAssignSolution={openAssignSolution}
              />
            )}

            {activeTab === 'products' && (
              <CustomerProductsTab />
            )}

            {activeTab === 'solutions' && (
              <CustomerSolutionsTab />
            )}

          </>
        ) : (
          !loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2, opacity: 0.7 }}>
              <Typography variant="h5" color="text.secondary">Select a Customer to View Details</Typography>
            </Box>
          )
        )}
      </Box>

      {/* Global Dialogs */}
      <CustomerDialog
        open={isCustomerDialogOpen}
        onClose={closeCustomerDialog}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
      />

      {selectedCustomer && (
        <>
          <AssignProductDialog
            open={isAssignProductOpen}
            onClose={closeAssignProduct}
            customerId={selectedCustomer.id}
            onAssigned={() => { refetch(); closeAssignProduct(); }}
          />
          <AssignSolutionDialog
            open={isAssignSolutionOpen}
            onClose={closeAssignSolution}
            customerId={selectedCustomer.id}
            onSuccess={() => { refetch(); closeAssignSolution(); }}
          />
        </>
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${deleteConfirm.customer?.name}"? This will remove all associated assignments and data. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, customer: null })}
        severity="error"
      />
    </Box>
  );
}
