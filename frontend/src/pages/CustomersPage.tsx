import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, LinearProgress, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress, IconButton, Tooltip, Divider
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Edit, Delete, Add } from '../components/common/FAIcon';
import { useQuery } from '@apollo/client';
import { CustomerAdoptionPanelV4 } from '../components/CustomerAdoptionPanelV4';
import { gql } from '@apollo/client';


import { useAuth } from '../components/AuthContext';

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
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(() => {
        return localStorage.getItem('lastSelectedCustomerId');
    });

    // Queries - must be before any conditional returns (skip handles auth)
    const { data: customersData, loading: customersLoading, error: customersError } = useQuery(CUSTOMERS, {
        errorPolicy: 'all',
        fetchPolicy: 'cache-and-network',
        skip: !isAuthenticated || authLoading
    });

    const customers = customersData?.customers || [];
    const selectedCustomer = customers.find((c: any) => c.id === selectedCustomerId);

    // Effects - must be before any conditional returns
    useEffect(() => {
        if (selectedCustomerId) {
            localStorage.setItem('lastSelectedCustomerId', selectedCustomerId);
        }
    }, [selectedCustomerId]);

    // Auto-select first customer if none selected
    useEffect(() => {
        if (!customersLoading && customers.length > 0 && !selectedCustomerId && isAuthenticated) {
            const lastId = localStorage.getItem('lastSelectedCustomerId');
            if (lastId && customers.some((c: any) => c.id === lastId)) {
                setSelectedCustomerId(lastId);
            }
        }
    }, [customersLoading, customers, selectedCustomerId, isAuthenticated]);

    // Now we can have conditional returns after all hooks
    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

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
                                onChange={(e) => {
                                    if (e.target.value === '__add_new__') {
                                        if ((window as any).__openAddCustomerDialog) {
                                            (window as any).__openAddCustomerDialog();
                                        }
                                    } else {
                                        setSelectedCustomerId(e.target.value);
                                    }
                                }}
                                label="Select Customer"
                            >
                                {[...customers].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((customer: any) => (
                                    <MenuItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </MenuItem>
                                ))}
                                <Divider />
                                <MenuItem value="__add_new__" sx={{ color: 'success.main', fontWeight: 600 }}>
                                    <Add sx={{ mr: 1, fontSize: '1rem' }} /> Add New Customer
                                </MenuItem>
                            </Select>
                        </FormControl>
                        {selectedCustomerId && (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Tooltip title="Edit Customer">
                                    <IconButton
                                        onClick={() => {
                                            if ((window as any).__openEditCustomerDialog) {
                                                (window as any).__openEditCustomerDialog();
                                            }
                                        }}
                                        color="primary"
                                    >
                                        <Edit />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Customer">
                                    <IconButton
                                        onClick={() => {
                                            if ((window as any).__deleteCustomer) {
                                                (window as any).__deleteCustomer();
                                            }
                                        }}
                                        color="error"
                                    >
                                        <Delete />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}

                        {/* Always visible Add button - positioned last */}

                    </Box>
                </Paper>
            )}

            {/* Customer Content */}
            {!customersLoading && !customersError && customers.find((c: any) => c.id === selectedCustomerId) && (
                <>
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
