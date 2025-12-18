import React, { useState, useEffect } from 'react';
import { EntitySummary } from '../components/EntitySummary';
import {
    Box, Paper, Typography, LinearProgress, FormControl, InputLabel, Select, MenuItem, Button
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useQuery } from '@apollo/client';
import { CustomerAdoptionPanelV4 } from '../components/CustomerAdoptionPanelV4';
import { gql } from '@apollo/client';

const CUSTOMERS = gql`
  query Customers {
    customers {
      id
      name
      description
      products {
        id
        name
        product {
          id
          name
        }
        adoptionPlan {
          id
        }
      }
      solutions {
        id
        name
        solution {
          id
          name
        }
        adoptionPlan {
          id
        }
      }
    }
  }
`;

export const CustomersPage: React.FC = () => {
    const theme = useTheme();
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(() => {
        return localStorage.getItem('lastSelectedCustomerId');
    });

    const { data: customersData, loading: customersLoading, error: customersError } = useQuery(CUSTOMERS, {
        errorPolicy: 'all'
    });

    const customers = customersData?.customers || [];
    const selectedCustomer = customers.find((c: any) => c.id === selectedCustomerId);

    useEffect(() => {
        if (selectedCustomerId) {
            localStorage.setItem('lastSelectedCustomerId', selectedCustomerId);
        }
    }, [selectedCustomerId]);

    // Auto-select first customer if none selected
    useEffect(() => {
        if (!customersLoading && customers.length > 0 && !selectedCustomerId) {
            const lastId = localStorage.getItem('lastSelectedCustomerId');
            if (lastId && customers.some((c: any) => c.id === lastId)) {
                setSelectedCustomerId(lastId);
            }
        }
    }, [customersLoading, customers, selectedCustomerId]);

    return (
        <Box>
            {/* Loading and Error States */}
            {customersLoading && (
                <Box sx={{ mb: 2 }}>
                    <LinearProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading customers...
                    </Typography>
                </Box>
            )}
            {customersError && (
                <Box sx={{ mb: 2 }}>
                    <Typography color="error">Error: {customersError.message}</Typography>
                </Box>
            )}

            {/* Customer Selector */}
            {!customersLoading && !customersError && (
                <Paper sx={{ p: 3, mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <FormControl sx={{ minWidth: 300, flex: '1 1 300px' }}>
                            <InputLabel>Select Customer</InputLabel>
                            <Select
                                value={selectedCustomerId || ''}
                                onChange={(e) => setSelectedCustomerId(e.target.value)}
                                label="Select Customer"
                            >
                                {[...customers].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((customer: any) => (
                                    <MenuItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {selectedCustomerId && (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Button
                                    startIcon={<Edit />}
                                    variant="contained"
                                    size="medium"
                                    onClick={() => {
                                        if ((window as any).__openEditCustomerDialog) {
                                            (window as any).__openEditCustomerDialog();
                                        }
                                    }}
                                >
                                    Edit
                                </Button>
                                <Button
                                    startIcon={<Delete />}
                                    variant="outlined"
                                    size="medium"
                                    color="error"
                                    onClick={() => {
                                        if ((window as any).__deleteCustomer) {
                                            (window as any).__deleteCustomer();
                                        }
                                    }}
                                >
                                    Delete
                                </Button>
                            </Box>
                        )}

                        {/* Always visible Add button - positioned last */}
                        <Button
                            variant="contained"
                            color="success"
                            size="medium"
                            startIcon={<Add />}
                            onClick={() => {
                                localStorage.removeItem('lastSelectedCustomerId');
                                setSelectedCustomerId(null);
                                setTimeout(() => {
                                    if ((window as any).__openAddCustomerDialog) {
                                        (window as any).__openAddCustomerDialog();
                                    }
                                }, 100);
                            }}
                        >
                            Add Customer
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Customer Content */}
            {!customersLoading && !customersError && customers.find((c: any) => c.id === selectedCustomerId) && (
                <>
                    <EntitySummary
                        title={customers.find((c: any) => c.id === selectedCustomerId).name}
                        description={customers.find((c: any) => c.id === selectedCustomerId).description || 'No description.'}
                        stats={[
                            { label: 'Active Products', value: customers.find((c: any) => c.id === selectedCustomerId).products?.length || 0, color: theme.palette.primary.main },
                            { label: 'Active Solutions', value: customers.find((c: any) => c.id === selectedCustomerId).solutions?.length || 0, color: theme.palette.warning.main }
                        ]}
                    />
                    <CustomerAdoptionPanelV4
                        selectedCustomerId={selectedCustomerId}
                        onRequestAddCustomer={() => {
                            localStorage.removeItem('lastSelectedCustomerId');
                            setSelectedCustomerId(null);
                            setTimeout(() => {
                                if ((window as any).__openAddCustomerDialog) {
                                    (window as any).__openAddCustomerDialog();
                                }
                            }, 100);
                        }}
                    />
                </>
            )}
            {!customersLoading && !customersError && !selectedCustomer && selectedCustomerId && (
                <Typography>Customer not found.</Typography>
            )}
        </Box>
    );
};
