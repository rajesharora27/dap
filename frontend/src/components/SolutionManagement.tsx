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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import { Add, Edit, Delete, Remove } from '@mui/icons-material';
import { SolutionDialog } from './dialogs/SolutionDialog';
import { gql, useMutation } from '@apollo/client';

const DELETE_SOLUTION = gql`
  mutation DeleteSolution($id: ID!) {
    deleteSolution(id: $id)
  }
`;

const ADD_PRODUCT_TO_SOLUTION = gql`
  mutation AddProductToSolution($solutionId: ID!, $productId: ID!) {
    addProductToSolution(solutionId: $solutionId, productId: $productId)
  }
`;

const REMOVE_PRODUCT_FROM_SOLUTION = gql`
  mutation RemoveProductFromSolution($solutionId: ID!, $productId: ID!) {
    removeProductFromSolution(solutionId: $solutionId, productId: $productId)
  }
`;

interface Props {
  solutions: any[];
  allProducts: any[];
  selectedSolution: string;
  onSolutionSelect: (solutionId: string) => void;
  onRefetch: () => void;
}

export const SolutionManagement: React.FC<Props> = ({ 
  solutions, 
  allProducts,
  selectedSolution, 
  onSolutionSelect,
  onRefetch 
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<any>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');

  const [deleteSolution] = useMutation(DELETE_SOLUTION, { onCompleted: onRefetch });
  const [addProductToSolution] = useMutation(ADD_PRODUCT_TO_SOLUTION, { onCompleted: onRefetch });
  const [removeProductFromSolution] = useMutation(REMOVE_PRODUCT_FROM_SOLUTION, { onCompleted: onRefetch });

  const currentSolution = solutions.find((s: any) => s.id === selectedSolution);

  const handleAdd = () => {
    setEditingSolution(null);
    setDialogOpen(true);
  };

  const handleEdit = (solution: any) => {
    setEditingSolution(solution);
    setDialogOpen(true);
  };

  const handleDelete = async (solution: any) => {
    if (confirm(`Delete solution "${solution.name}"?`)) {
      await deleteSolution({ variables: { id: solution.id } });
    }
  };

  const handleSave = async () => {
    onRefetch();
    setDialogOpen(false);
  };

  const handleAddProduct = () => {
    setSelectedProduct('');
    setProductDialogOpen(true);
  };

  const handleAddProductToSolution = async () => {
    if (selectedProduct && selectedSolution) {
      await addProductToSolution({ 
        variables: { 
          solutionId: selectedSolution, 
          productId: selectedProduct 
        } 
      });
      setProductDialogOpen(false);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (confirm('Remove this product from the solution?')) {
      await removeProductFromSolution({ 
        variables: { 
          solutionId: selectedSolution, 
          productId 
        } 
      });
    }
  };

  const getAvailableProducts = () => {
    const solutionProductIds = currentSolution?.products?.edges?.map((e: any) => e.node.id) || [];
    return allProducts.filter((p: any) => !solutionProductIds.includes(p.id));
  };

  const getSolutionStats = (solution: any) => {
    const products = solution.products?.edges?.map((e: any) => e.node) || [];
    let totalTasks = 0;
    let completedTasks = 0;
    
    products.forEach((product: any) => {
      const tasks = product.tasks?.edges?.map((e: any) => e.node) || [];
      totalTasks += tasks.length;
      completedTasks += tasks.filter((t: any) => t.completedAt || t.status?.toLowerCase() === 'completed').length;
    });
    
    return { products: products.length, totalTasks, completedTasks };
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Solutions</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={handleAdd}
          size="small"
        >
          Add Solution
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
        <List>
          {solutions.map((solution: any) => {
            const stats = getSolutionStats(solution);
            const isSelected = solution.id === selectedSolution;
            
            return (
              <ListItemButton 
                key={solution.id}
                selected={isSelected}
                onClick={() => onSolutionSelect(solution.id)}
                sx={{ 
                  '&:hover .action-buttons': { opacity: 1 },
                  bgcolor: isSelected ? 'action.selected' : 'inherit'
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {solution.name}
                      </Typography>
                      <Chip 
                        label={`${stats.products} products`} 
                        size="small" 
                        color="primary"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {solution.description}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="info.main">
                        Tasks: {stats.completedTasks}/{stats.totalTasks} completed
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
                        handleEdit(solution);
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(solution);
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

      {/* Products in selected solution */}
      {currentSolution && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1">
              Products in "{currentSolution.name}"
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<Add />}
              onClick={handleAddProduct}
              size="small"
            >
              Add Product
            </Button>
          </Box>

          <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
            <List dense>
              {currentSolution.products?.edges?.map((productEdge: any) => {
                const product = productEdge.node;
                const tasks = product.tasks?.edges?.map((e: any) => e.node) || [];
                const completed = tasks.filter((t: any) => t.completedAt).length;
                
                return (
                  <ListItemButton key={product.id}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {product.name}
                          </Typography>
                          <Chip 
                            label={`${completed}/${tasks.length} tasks`}
                            size="small"
                            color={completed === tasks.length ? 'success' : 'default'}
                          />
                        </Box>
                      }
                      secondary={product.description}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveProduct(product.id)}
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItemButton>
                );
              }) || []}
              
              {(!currentSolution.products?.edges?.length) && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No products in this solution
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Box>
      )}

      <SolutionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        solution={editingSolution}
        allProducts={allProducts}
      />

      {/* Add Product Dialog */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)}>
        <DialogTitle>Add Product to Solution</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Product</InputLabel>
            <Select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              label="Select Product"
            >
              {getAvailableProducts().map((product: any) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddProductToSolution} 
            variant="contained"
            disabled={!selectedProduct}
          >
            Add Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
