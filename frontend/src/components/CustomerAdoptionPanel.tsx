import * as React from 'react';
import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemSecondaryAction,
  Paper,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Assignment,
  TrendingUp,
  CheckCircle,
  HourglassEmpty,
  NotInterested,
} from '@mui/icons-material';
import { AssignProductDialog } from './dialogs/AssignProductDialog';
import { AdoptionPlanDialog } from './dialogs/AdoptionPlanDialog';
import { CustomerDialog } from './dialogs/CustomerDialog';

// GraphQL Queries
const GET_CUSTOMERS_WITH_ADOPTION = gql`
  query GetCustomersWithAdoption {
    customers {
      id
      name
      description
      createdAt
      updatedAt
    }
  }
`;

const GET_CUSTOMER_DETAIL = gql`
  query GetCustomerDetail($id: ID!) {
    customer(id: $id) {
      id
      name
      description
      products {
        id
        licenseLevel
        selectedOutcomes {
          id
          name
        }
        product {
          id
          name
          description
        }
        adoptionPlan {
          id
          progressPercentage
          totalTasks
          completedTasks
          totalWeight
          completedWeight
          needsSync
          lastSyncedAt
        }
        createdAt
        purchasedAt
      }
      solutions {
        id
        solution {
          id
          name
          description
        }
      }
    }
  }
`;

const GET_ADOPTION_PLANS_FOR_CUSTOMER = gql`
  query GetAdoptionPlansForCustomer($customerId: ID!) {
    adoptionPlansForCustomer(customerId: $customerId) {
      id
      productId
      productName
      licenseLevel
      totalTasks
      completedTasks
      progressPercentage
      totalWeight
      completedWeight
      needsSync
      lastSyncedAt
      createdAt
      updatedAt
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const CustomerAdoptionPanel: React.FC = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [assignProductDialogOpen, setAssignProductDialogOpen] = useState(false);
  const [adoptionPlanDialogOpen, setAdoptionPlanDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [selectedAdoptionPlan, setSelectedAdoptionPlan] = useState<any>(null);

  // Queries
  const { data: customersData, loading: customersLoading, refetch: refetchCustomers } = useQuery(
    GET_CUSTOMERS_WITH_ADOPTION,
    { fetchPolicy: 'cache-and-network' }
  );

  const { data: customerDetailData, loading: customerDetailLoading } = useQuery(
    GET_CUSTOMER_DETAIL,
    {
      variables: { id: selectedCustomerId },
      skip: !selectedCustomerId,
      fetchPolicy: 'cache-and-network',
    }
  );

  const { data: adoptionPlansData, loading: adoptionPlansLoading } = useQuery(
    GET_ADOPTION_PLANS_FOR_CUSTOMER,
    {
      variables: { customerId: selectedCustomerId },
      skip: !selectedCustomerId,
      fetchPolicy: 'cache-and-network',
    }
  );

  // Mutations
  const [createCustomer] = useMutation(CREATE_CUSTOMER, {
    onCompleted: () => {
      refetchCustomers();
      setCustomerDialogOpen(false);
    },
  });

  const [updateCustomer] = useMutation(UPDATE_CUSTOMER, {
    onCompleted: () => {
      refetchCustomers();
      setCustomerDialogOpen(false);
    },
  });

  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, {
    onCompleted: () => {
      refetchCustomers();
      setSelectedCustomerId(null);
    },
  });

  const customers = customersData?.customers || [];
  const selectedCustomer = customerDetailData?.customer;
  const adoptionPlans = adoptionPlansData?.adoptionPlansForCustomer || [];

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerDialogOpen(true);
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setCustomerDialogOpen(true);
  };

  const handleDeleteCustomer = async (customer: any) => {
    if (window.confirm(`Delete customer "${customer.name}"? This will also delete all adoption plans.`)) {
      try {
        await deleteCustomer({ variables: { id: customer.id } });
      } catch (error: any) {
        alert(`Error deleting customer: ${error.message}`);
      }
    }
  };

  const handleSaveCustomer = async (data: { name: string; description?: string }) => {
    try {
      if (editingCustomer) {
        await updateCustomer({
          variables: {
            id: editingCustomer.id,
            input: data,
          },
        });
      } else {
        await createCustomer({
          variables: {
            input: data,
          },
        });
      }
    } catch (error: any) {
      alert(`Error saving customer: ${error.message}`);
    }
  };

  const handleAssignProduct = () => {
    setAssignProductDialogOpen(true);
  };

  const handleViewAdoptionPlan = (plan: any) => {
    setSelectedAdoptionPlan(plan);
    setAdoptionPlanDialogOpen(true);
  };

  const getStatusChip = (progressPercentage: number) => {
    if (progressPercentage >= 100) {
      return <Chip label="Complete" color="success" size="small" icon={<CheckCircle />} />;
    } else if (progressPercentage > 0) {
      return <Chip label="In Progress" color="primary" size="small" icon={<HourglassEmpty />} />;
    } else {
      return <Chip label="Not Started" color="default" size="small" icon={<NotInterested />} />;
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Customer Adoption Management
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddCustomer}>
          Add Customer
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 2 }}>
        {/* Customer List */}
        <Paper sx={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Customers ({customers.length})</Typography>
          </Box>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {customersLoading ? (
                <LinearProgress />
              ) : customers.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">No customers yet</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddCustomer}
                    sx={{ mt: 2 }}
                  >
                    Add First Customer
                  </Button>
                </Box>
              ) : (
                <List>
                  {customers.map((customer: any) => (
                    <ListItemButton
                      key={customer.id}
                      selected={selectedCustomerId === customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      sx={{
                        '&:hover .action-buttons': { opacity: 1 },
                      }}
                    >
                      <ListItemText
                        primary={customer.name}
                        secondary={customer.description}
                      />
                      <ListItemSecondaryAction
                        className="action-buttons"
                        sx={{ opacity: 0, transition: 'opacity 0.2s' }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCustomer(customer);
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomer(customer);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Box>
          </Paper>

        {/* Customer Details */}
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {!selectedCustomerId ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Select a customer to view details
                </Typography>
              </Box>
            ) : customerDetailLoading ? (
              <LinearProgress />
            ) : selectedCustomer ? (
              <>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {selectedCustomer.name}
                      </Typography>
                      {selectedCustomer.description && (
                        <Typography variant="body2" color="text.secondary">
                          {selectedCustomer.description}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Button
                        variant="contained"
                        startIcon={<Assignment />}
                        onClick={handleAssignProduct}
                        size="small"
                      >
                        Assign Product
                      </Button>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                    <Tab label="Overview" />
                    <Tab label={`Adoption Plans (${adoptionPlans.length})`} />
                    <Tab label="Products & Solutions" />
                  </Tabs>
                </Box>

                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  {/* Overview Tab */}
                  <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {adoptionPlans.length === 0 ? (
                        <Alert severity="info" sx={{ width: '100%' }}>
                          No adoption plans yet. Assign a product to this customer to create an adoption plan.
                        </Alert>
                      ) : (
                        adoptionPlans.map((plan: any) => (
                          <Box key={plan.id} sx={{ flex: '1 1 calc(50% - 16px)', minWidth: '300px' }}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  {plan.productName}
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                  <Chip
                                    label={plan.licenseLevel}
                                    size="small"
                                    color="primary"
                                    sx={{ mr: 1 }}
                                  />
                                  {getStatusChip(plan.progressPercentage)}
                                  {plan.needsSync && (
                                    <Chip
                                      label="Needs Sync"
                                      size="small"
                                      color="warning"
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Progress: {plan.progressPercentage.toFixed(1)}%
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.min(plan.progressPercentage, 100)}
                                    sx={{ mb: 1 }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {plan.completedTasks} of {plan.totalTasks} tasks completed
                                  </Typography>
                                </Box>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleViewAdoptionPlan(plan)}
                                  fullWidth
                                >
                                  View Details
                                </Button>
                              </CardContent>
                            </Card>
                          </Box>
                        ))
                      )}
                    </Box>
                  </TabPanel>

                  {/* Adoption Plans Tab */}
                  <TabPanel value={tabValue} index={1}>
                    {adoptionPlansLoading ? (
                      <LinearProgress />
                    ) : adoptionPlans.length === 0 ? (
                      <Alert severity="info">No adoption plans yet.</Alert>
                    ) : (
                      <List>
                        {adoptionPlans.map((plan: any) => (
                          <React.Fragment key={plan.id}>
                            <ListItem>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1" fontWeight="medium">
                                      {plan.productName}
                                    </Typography>
                                    <Chip label={plan.licenseLevel} size="small" />
                                    {getStatusChip(plan.progressPercentage)}
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ mt: 1 }}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={Math.min(plan.progressPercentage, 100)}
                                      sx={{ mb: 0.5 }}
                                    />
                                    <Typography variant="caption">
                                      {plan.completedTasks}/{plan.totalTasks} tasks •{' '}
                                      {plan.completedWeight.toFixed(1)}/{plan.totalWeight.toFixed(1)} weight •{' '}
                                      {plan.progressPercentage.toFixed(1)}% complete
                                    </Typography>
                                  </Box>
                                }
                              />
                              <ListItemSecondaryAction>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleViewAdoptionPlan(plan)}
                                >
                                  View Details
                                </Button>
                              </ListItemSecondaryAction>
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </TabPanel>

                  {/* Products & Solutions Tab */}
                  <TabPanel value={tabValue} index={2}>
                    <Typography variant="h6" gutterBottom>
                      Assigned Products
                    </Typography>
                    {selectedCustomer.products?.length === 0 ? (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        No products assigned yet.
                      </Alert>
                    ) : (
                      <List>
                        {selectedCustomer.products?.map((cp: any) => (
                          <ListItem key={cp.id}>
                            <ListItemText
                              primary={cp.product.name}
                              secondary={
                                <>
                                  <Typography variant="caption" component="div">
                                    License: {cp.licenseLevel}
                                  </Typography>
                                  {cp.selectedOutcomes?.length > 0 && (
                                    <Box sx={{ mt: 0.5 }}>
                                      {cp.selectedOutcomes.map((outcome: any) => (
                                        <Chip
                                          key={outcome.id}
                                          label={outcome.name}
                                          size="small"
                                          sx={{ mr: 0.5, mb: 0.5 }}
                                        />
                                      ))}
                                    </Box>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Assigned Solutions
                    </Typography>
                    {selectedCustomer.solutions?.length === 0 ? (
                      <Alert severity="info">No solutions assigned yet.</Alert>
                    ) : (
                      <List>
                        {selectedCustomer.solutions?.map((cs: any) => (
                          <ListItem key={cs.id}>
                            <ListItemText
                              primary={cs.solution.name}
                              secondary={cs.solution.description}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </TabPanel>
                </Box>
              </>
            ) : null}
          </Paper>
      </Box>

      {/* Dialogs */}
      <CustomerDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      />

      {selectedCustomerId && (
        <>
          <AssignProductDialog
            open={assignProductDialogOpen}
            onClose={() => setAssignProductDialogOpen(false)}
            customerId={selectedCustomerId}
            onAssigned={() => {
              setAssignProductDialogOpen(false);
              refetchCustomers();
            }}
          />

          <AdoptionPlanDialog
            open={adoptionPlanDialogOpen}
            onClose={() => {
              setAdoptionPlanDialogOpen(false);
              setSelectedAdoptionPlan(null);
            }}
            adoptionPlanId={selectedAdoptionPlan?.id}
          />
        </>
      )}
    </Box>
  );
};
