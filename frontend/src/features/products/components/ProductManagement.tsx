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
  Paper
} from '@mui/material';
import { Add, Edit, Delete } from '@shared/components/FAIcon';
import { ProductDialog } from './ProductDialog';
import { gql, useMutation } from '@apollo/client';

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

interface Props {
  products: any[];
  selectedProduct: string;
  onProductSelect: (productId: string) => void;
  onRefetch: () => void;
}

export const ProductManagement: React.FC<Props> = ({
  products,
  selectedProduct,
  onProductSelect,
  onRefetch
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteProduct] = useMutation(DELETE_PRODUCT, { onCompleted: onRefetch });

  const handleAdd = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = async (product: any) => {
    if (confirm(`Delete product "${product.name}"? This will also delete all associated tasks.`)) {
      await deleteProduct({ variables: { id: product.id } });
    }
  };

  const handleSave = async () => {
    onRefetch();
    setDialogOpen(false);
  };

  const getTaskStats = (product: any) => {
    const tasks = product.tasks?.edges?.map((e: any) => e.node) || [];
    const completed = tasks.filter((t: any) => t.completedAt || t.status?.toLowerCase() === 'completed').length;
    return { total: tasks.length, completed };
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Products</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
          size="small"
        >
          Add Product
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
        <List>
          {products.map((product: any) => {
            const stats = getTaskStats(product);
            const isSelected = product.id === selectedProduct;

            return (
              <ListItemButton
                key={product.id}
                selected={isSelected}
                onClick={() => onProductSelect(product.id)}
                sx={{
                  '&:hover .action-buttons': { opacity: 1 },
                  bgcolor: isSelected ? 'action.selected' : 'inherit'
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {product.name}
                      </Typography>
                      {product.status && (
                        <Chip
                          label={product.status}
                          size="small"
                          color={product.status === 'active' ? 'success' : 'default'}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {product.description}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="primary">
                        Tasks: {stats.completed}/{stats.total} completed
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
                        handleEdit(product);
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(product);
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

      <ProductDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        product={editingProduct}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
      />
    </Box>
  );
};
