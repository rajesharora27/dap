import * as React from 'react';
import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  List, 
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tabs,
  Tab
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { CustomerDialog } from './dialogs/CustomerDialog';
import { gql, useMutation } from '@apollo/client';

const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

interface Props {
  customers: any[];
  selectedCustomer: string;
  selectedCustomerProduct: string;
  selectedCustomerSolution: string;
  onCustomerSelect: (customerId: string) => void;
  onCustomerProductSelect: (productId: string) => void;
  onCustomerSolutionSelect: (solutionId: string) => void;
  onRefetch: () => void;
}

export const CustomerManagement: React.FC<Props> = ({ 
  customers, 
  selectedCustomer,
  selectedCustomerProduct,
  selectedCustomerSolution,
  onCustomerSelect,
  onCustomerProductSelect,
  onCustomerSolutionSelect,
  onRefetch 
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [customerTab, setCustomerTab] = useState(0);

  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, { onCompleted: onRefetch });

  const currentCustomer = customers.find((c: any) => c.id === selectedCustomer);

  const handleAdd = () => {
    setEditingCustomer(null);
    setDialogOpen(true);
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleDelete = async (customer: any) => {
    if (confirm(`Delete customer "${customer.name}"?`)) {
      await deleteCustomer({ variables: { id: customer.id } });
    }
  };

  const handleSave = async () => {
    onRefetch();
    setDialogOpen(false);
  };

  const handleProductChange = (event: SelectChangeEvent) => {
    onCustomerProductSelect(event.target.value);
  };

  const handleSolutionChange = (event: SelectChangeEvent) => {
    onCustomerSolutionSelect(event.target.value);
  };

  const getCustomerStats = (customer: any) => {
    const products = customer.products || [];
    const solutions = customer.solutions || [];
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    // Count tasks from direct products
    products.forEach((product: any) => {
      const tasks = product.tasks?.edges?.map((e: any) => e.node) || [];
      totalTasks += tasks.length;
      completedTasks += tasks.filter((t: any) => t.completedAt).length;
    });
    
    // Count tasks from solution products
    solutions.forEach((solution: any) => {
      solution.products?.edges?.forEach((productEdge: any) => {
        const product = productEdge.node;
        const tasks = product.tasks?.edges?.map((e: any) => e.node) || [];
        totalTasks += tasks.length;
        completedTasks += tasks.filter((t: any) => t.completedAt).length;
      });
    });
    
    return { products: products.length, solutions: solutions.length, totalTasks, completedTasks };
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Customers</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={handleAdd}
          size="small"
        >
          Add Customer
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
        <List>
          {customers.map((customer: any) => {
            const stats = getCustomerStats(customer);
            const isSelected = customer.id === selectedCustomer;
            
            return (
              <ListItemButton 
                key={customer.id}
                selected={isSelected}
                onClick={() => onCustomerSelect(customer.id)}
                sx={{ 
                  '&:hover .action-buttons': { opacity: 1 },
                  bgcolor: isSelected ? 'action.selected' : 'inherit'
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {customer.name}
                      </Typography>
                      <Chip 
                        label={`${stats.products}P + ${stats.solutions}S`} 
                        size="small" 
                        color="primary"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {customer.description}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="info.main">
                        Total Tasks: {stats.completedTasks}/{stats.totalTasks} completed
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box 
                    className="action-buttons"
                    sx={{ opacity: 0, transition: 'opacity 0.2s', display: 'flex', gap: 0.5 }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(customer);
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(customer);
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItemButton>
            );
          })}
        </List>
      </Paper>

      {/* Customer's Products and Solutions */}
      {currentCustomer && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            "{currentCustomer.name}" Portfolio
          </Typography>

          <Tabs value={customerTab} onChange={(_, v) => setCustomerTab(v)} sx={{ mb: 2 }}>
            <Tab label={`Products (${currentCustomer.products?.length || 0})`} />
            <Tab label={`Solutions (${currentCustomer.solutions?.length || 0})`} />
          </Tabs>

          {customerTab === 0 && (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Customer Product</InputLabel>
                <Select
                  value={selectedCustomerProduct}
                  onChange={handleProductChange}
                  label="Select Customer Product"
                >
                  <MenuItem value="">
                    <em>Select a product...</em>
                  </MenuItem>
                  {currentCustomer.products?.map((product: any) => {
                    const tasks = product.tasks?.edges?.map((e: any) => e.node) || [];
                    const completed = tasks.filter((t: any) => t.completedAt).length;
                    
                    return (
                      <MenuItem key={product.id} value={product.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          <Typography>{product.name}</Typography>
                          <Chip 
                            label={`${completed}/${tasks.length} tasks`}
                            size="small"
                            color={completed === tasks.length ? 'success' : 'default'}
                          />
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>
          )}

          {customerTab === 1 && (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Customer Solution</InputLabel>
                <Select
                  value={selectedCustomerSolution}
                  onChange={handleSolutionChange}
                  label="Select Customer Solution"
                >
                  <MenuItem value="">
                    <em>Select a solution...</em>
                  </MenuItem>
                  {currentCustomer.solutions?.map((solution: any) => {
                    const products = solution.products?.edges?.map((e: any) => e.node) || [];
                    let totalTasks = 0;
                    let completedTasks = 0;
                    
                    products.forEach((product: any) => {
                      const tasks = product.tasks?.edges?.map((e: any) => e.node) || [];
                      totalTasks += tasks.length;
                      completedTasks += tasks.filter((t: any) => t.completedAt).length;
                    });
                    
                    return (
                      <MenuItem key={solution.id} value={solution.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          <Typography>{solution.name}</Typography>
                          <Chip 
                            label={`${products.length} products`}
                            size="small"
                            color="primary"
                          />
                          <Chip 
                            label={`${completedTasks}/${totalTasks} tasks`}
                            size="small"
                            color={completedTasks === totalTasks ? 'success' : 'default'}
                          />
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              {selectedCustomerSolution && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Solution Journey Progress
                  </Typography>
                  {currentCustomer.solutions
                    ?.find((s: any) => s.id === selectedCustomerSolution)
                    ?.products?.edges?.map((productEdge: any) => {
                      const product = productEdge.node;
                      const tasks = product.tasks?.edges?.map((e: any) => e.node) || [];
                      const completed = tasks.filter((t: any) => t.completedAt).length;
                      const progress = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
                      
                      return (
                        <Box key={product.id} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {product.name}
                            </Typography>
                            <Typography variant="caption">
                              {completed}/{tasks.length} tasks ({Math.round(progress)}%)
                            </Typography>
                          </Box>
                          <Box sx={{ 
                            height: 6, 
                            backgroundColor: 'grey.300', 
                            borderRadius: 3,
                            overflow: 'hidden'
                          }}>
                            <Box sx={{ 
                              height: '100%', 
                              backgroundColor: progress === 100 ? 'success.main' : 'primary.main',
                              width: `${progress}%`,
                              transition: 'width 0.3s ease'
                            }} />
                          </Box>
                        </Box>
                      );
                    })}
                </Paper>
              )}
            </Box>
          )}
        </Box>
      )}

      <CustomerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        customer={editingCustomer}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      />
    </Box>
  );
};
