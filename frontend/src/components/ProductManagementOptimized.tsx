import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  FileDownload,
  FileUpload
} from '@mui/icons-material';
import { useProducts } from '../hooks/useProducts';
import { ProductDialog } from './dialogs/ProductDialog';
import { useApolloClient } from '@apollo/client';
import { DELETE_PRODUCT } from '../graphql/mutations';
import { ExcelService } from '../services/excelService';

interface ProductManagementOptimizedProps {
  selectedProduct: string;
  onProductSelect: (productId: string) => void;
}

export function ProductManagementOptimized({ selectedProduct, onProductSelect }: ProductManagementOptimizedProps) {
  const client = useApolloClient();
  const { products, loading, refetch } = useProducts();
  const [addProductDialog, setAddProductDialog] = useState(false);
  const [editProductDialog, setEditProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const excelService = new ExcelService(client);

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await client.mutate({
        mutation: DELETE_PRODUCT,
        variables: { id: productId },
        refetchQueries: ['Products'],
        awaitRefetchQueries: true
      });
      
      if (selectedProduct === productId) {
        onProductSelect('');
      }
      
      alert('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditProductDialog(true);
  };

  const handleExportProduct = async (product: any) => {
    try {
      const tasks = product.tasks?.edges?.map((edge: any) => edge.node) || [];
      const outcomes = product.outcomes || [];
      const licenses = product.licenses || [];
      const releases = product.releases || [];

      await excelService.exportProductWorkbook(
        product.id,
        product.name,
        tasks,
        outcomes,
        licenses,
        releases
      );
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export product');
    }
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Product Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddProductDialog(true)}
        >
          Add Product
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Tasks</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product: any) => (
              <TableRow 
                key={product.id}
                selected={selectedProduct === product.id}
                onClick={() => onProductSelect(product.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Typography variant="subtitle2">{product.name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {product.description || 'No description'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={`${product.statusPercent || 0}%`}
                    color={product.statusPercent >= 100 ? 'success' : 'primary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {product.tasks?.edges?.length || 0} tasks
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="Export to Excel">
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportProduct(product);
                      }}
                    >
                      <FileDownload />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Product">
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProduct(product);
                      }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Product">
                    <IconButton 
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProduct(product.id);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Product Dialogs */}
      <ProductDialog
        open={addProductDialog}
        onClose={() => setAddProductDialog(false)}
        onSave={async (data) => {
          // Handle product creation
          await refetch();
          setAddProductDialog(false);
        }}
        mode="add"
      />

      <ProductDialog
        open={editProductDialog}
        onClose={() => {
          setEditProductDialog(false);
          setEditingProduct(null);
        }}
        onSave={async (data) => {
          // Handle product update
          await refetch();
          setEditProductDialog(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        mode="edit"
      />
    </Box>
  );
}
