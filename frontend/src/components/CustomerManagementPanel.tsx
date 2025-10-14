import * as React from 'react';
import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Assignment,
  Visibility,
} from '@mui/icons-material';
import { CustomerDialog } from './dialogs/CustomerDialog';
import { CustomerDetailView } from './CustomerDetailView';

// GraphQL Queries and Mutations
const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers {
      id
      name
      description
      products {
        id
        licenseLevel
        product {
          id
          name
        }
        adoptionPlan {
          id
          progressPercentage
          totalTasks
          completedTasks
        }
      }
    }
  }
`;

const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerInput!) {
    createCustomer(input: $input) {
      id
      name
      description
    }
  }
`;

const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: CustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

interface Customer {
  id: string;
  name: string;
  description?: string;
  products: Array<{
    id: string;
    licenseLevel: string;
    product: {
      id: string;
      name: string;
    };
    adoptionPlan?: {
      id: string;
      progressPercentage: number;
      totalTasks: number;
      completedTasks: number;
    };
  }>;
}

export function CustomerManagementPanel() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_CUSTOMERS);

  const [createCustomer] = useMutation(CREATE_CUSTOMER, {
    onCompleted: () => {
      refetch();
      setCustomerDialogOpen(false);
      setEditingCustomer(null);
      setSuccess('Customer created successfully');
    },
    onError: (err) => setError(err.message),
  });

  const [updateCustomer] = useMutation(UPDATE_CUSTOMER, {
    onCompleted: () => {
      refetch();
      setCustomerDialogOpen(false);
      setEditingCustomer(null);
      setSuccess('Customer updated successfully');
      // Refresh detail view if currently viewing this customer
      if (selectedCustomer && editingCustomer?.id === selectedCustomer.id) {
        setSelectedCustomer(null);
        setTimeout(() => refetch(), 100);
      }
    },
    onError: (err) => setError(err.message),
  });

  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, {
    onCompleted: () => {
      refetch();
      setSuccess('Customer deleted successfully');
      if (selectedCustomer) {
        setSelectedCustomer(null);
      }
    },
    onError: (err) => setError(err.message),
  });

  const customers: Customer[] = data?.customers || [];

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerDialogOpen(true);
  };

  const handleDeleteCustomer = (customerId: string, customerName: string) => {
    if (window.confirm(`Are you sure you want to delete "${customerName}"? This will also remove all associated product assignments and adoption plans.`)) {
      deleteCustomer({ variables: { id: customerId } });
    }
  };

  const handleSaveCustomer = async (customerData: any) => {
    if (editingCustomer) {
      await updateCustomer({
        variables: {
          id: editingCustomer.id,
          input: customerData,
        },
      });
    } else {
      await createCustomer({
        variables: { input: customerData },
      });
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleBackToList = () => {
    setSelectedCustomer(null);
    refetch(); // Refresh data when returning to list
  };

  // Calculate overall adoption progress for a customer
  const calculateCustomerProgress = (customer: Customer): number => {
    if (customer.products.length === 0) return 0;
    const totalProgress = customer.products.reduce((sum, cp) => {
      return sum + (cp.adoptionPlan?.progressPercentage || 0);
    }, 0);
    return totalProgress / customer.products.length;
  };

  // If a customer is selected, show detail view
  if (selectedCustomer) {
    return (
      <CustomerDetailView
        customerId={selectedCustomer.id}
        onBack={handleBackToList}
      />
    );
  }

  // List view
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Customers</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddCustomer}
        >
          Add Customer
        </Button>
      </Box>

      {/* Messages */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Statistics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Customers
            </Typography>
            <Typography variant="h4">
              {customers.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              With Products
            </Typography>
            <Typography variant="h4">
              {customers.filter(c => c.products.length > 0).length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Product Assignments
            </Typography>
            <Typography variant="h4">
              {customers.reduce((sum, c) => sum + c.products.length, 0)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Customer List */}
      {loading ? (
        <LinearProgress />
      ) : customers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No customers yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Add your first customer to start tracking their product adoption journey
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleAddCustomer}>
            Add Customer
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Customer Name</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell align="center"><strong>Products</strong></TableCell>
                <TableCell align="center"><strong>Avg. Adoption</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((customer) => {
                  const avgProgress = calculateCustomerProgress(customer);
                  return (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {customer.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {customer.description
                            ? customer.description.length > 80
                              ? customer.description.substring(0, 80) + '...'
                              : customer.description
                            : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={customer.products.length}
                          color={customer.products.length > 0 ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {customer.products.length > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                            <Box sx={{ width: 100 }}>
                              <LinearProgress
                                variant="determinate"
                                value={avgProgress}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                            <Typography variant="caption">
                              {avgProgress.toFixed(0)}%
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details & Adoption">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewCustomer(customer)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Customer">
                          <IconButton
                            size="small"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Customer">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Customer Dialog */}
      <CustomerDialog
        open={customerDialogOpen}
        onClose={() => {
          setCustomerDialogOpen(false);
          setEditingCustomer(null);
        }}
        title={editingCustomer ? 'Edit Customer' : 'Create New Customer'}
        onSave={handleSaveCustomer}
        customer={editingCustomer ? {
          id: editingCustomer.id,
          name: editingCustomer.name,
          email: '',
          phone: '',
          company: '',
          industry: '',
          size: '',
          customAttrs: {},
        } : null}
      />
    </Box>
  );
}
