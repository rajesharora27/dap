import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Chip,
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
import { Add, Delete, DragIndicator, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useMutation } from '@apollo/client';
import { 
  ADD_PRODUCT_TO_SOLUTION_ENHANCED, 
  REMOVE_PRODUCT_FROM_SOLUTION_ENHANCED,
  REORDER_PRODUCTS_IN_SOLUTION 
} from '../graphql/mutations';

interface Product {
  id: string;
  name: string;
  description?: string;
  tasks?: { edges: any[] };
}

interface SolutionProduct {
  node: Product;
  order?: number;
}

interface Props {
  solutionId: string;
  solutionProducts: SolutionProduct[];
  allProducts: Product[];
  onRefetch: () => void;
}

export const SolutionProductList: React.FC<Props> = ({
  solutionId,
  solutionProducts,
  allProducts,
  onRefetch
}) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  const [addProduct] = useMutation(ADD_PRODUCT_TO_SOLUTION_ENHANCED, {
    onCompleted: onRefetch
  });
  const [removeProduct] = useMutation(REMOVE_PRODUCT_FROM_SOLUTION_ENHANCED, {
    onCompleted: onRefetch
  });
  const [reorderProducts] = useMutation(REORDER_PRODUCTS_IN_SOLUTION, {
    onCompleted: onRefetch
  });

  const getAvailableProducts = () => {
    const solutionProductIds = solutionProducts.map((sp: SolutionProduct) => sp.node.id);
    return allProducts.filter((p: Product) => !solutionProductIds.includes(p.id));
  };

  const handleAddProduct = async () => {
    if (selectedProductId) {
      const maxOrder = Math.max(...solutionProducts.map((sp: any) => sp.order || 0), 0);
      await addProduct({
        variables: {
          solutionId,
          productId: selectedProductId,
          order: maxOrder + 1
        }
      });
      setAddDialogOpen(false);
      setSelectedProductId('');
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (confirm('Remove this product from the solution?')) {
      await removeProduct({
        variables: { solutionId, productId }
      });
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    const products = [...solutionProducts].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    const temp = products[index];
    products[index] = products[index - 1];
    products[index - 1] = temp;
    
    const productOrders = products.map((sp: any, idx: number) => ({
      productId: sp.node.id,
      order: idx + 1
    }));
    
    await reorderProducts({
      variables: { solutionId, productOrders }
    });
  };

  const handleMoveDown = async (index: number) => {
    const products = [...solutionProducts].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    if (index === products.length - 1) return;
    
    const temp = products[index];
    products[index] = products[index + 1];
    products[index + 1] = temp;
    
    const productOrders = products.map((sp: any, idx: number) => ({
      productId: sp.node.id,
      order: idx + 1
    }));
    
    await reorderProducts({
      variables: { solutionId, productOrders }
    });
  };

  const getProductStats = (product: Product) => {
    const tasks = product.tasks?.edges || [];
    const completed = tasks.filter((t: any) => t.node.completedAt).length;
    return { total: tasks.length, completed };
  };

  const sortedProducts = [...solutionProducts].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Products in Solution</Typography>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setAddDialogOpen(true)}
          size="small"
        >
          Add Product
        </Button>
      </Box>

      <Paper variant="outlined">
        <List>
          {sortedProducts.map((sp: any, index: number) => {
            const product = sp.node;
            const stats = getProductStats(product);
            const isFirst = index === 0;
            const isLast = index === sortedProducts.length - 1;

            return (
              <React.Fragment key={product.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    '&:hover .order-buttons': { opacity: 1 },
                    display: 'flex',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
                    <DragIndicator sx={{ color: 'text.disabled' }} />
                    <Chip 
                      label={`#${index + 1}`} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {product.name}
                        </Typography>
                        <Chip
                          label={`${stats.completed}/${stats.total} tasks`}
                          size="small"
                          color={stats.completed === stats.total && stats.total > 0 ? 'success' : 'default'}
                        />
                      </Box>
                    }
                    secondary={product.description}
                  />

                  <Box
                    className="order-buttons"
                    sx={{
                      display: 'flex',
                      gap: 0.5,
                      opacity: 0,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleMoveUp(index)}
                      disabled={isFirst}
                    >
                      <ArrowUpward fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleMoveDown(index)}
                      disabled={isLast}
                    >
                      <ArrowDownward fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveProduct(product.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
              </React.Fragment>
            );
          })}

          {sortedProducts.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No products in this solution. Click "Add Product" to get started.
              </Typography>
            </Box>
          )}
        </List>
      </Paper>

      {/* Add Product Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Product to Solution</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Product</InputLabel>
            <Select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              label="Select Product"
            >
              {getAvailableProducts().map((product: Product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {getAvailableProducts().length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              All available products have been added to this solution.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddProduct}
            variant="contained"
            disabled={!selectedProductId}
          >
            Add Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};








