import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { Add } from '@shared/components/FAIcon';
import { useMutation } from '@apollo/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';
import { SortableProductRow } from './SortableProductRow';
import { SortableProductTable } from './SortableProductTable';

import {
  ADD_PRODUCT_TO_SOLUTION_ENHANCED,
  REMOVE_PRODUCT_FROM_SOLUTION_ENHANCED,
  REORDER_PRODUCTS_IN_SOLUTION
} from '../graphql/solutions.mutations';

interface Product {
  id: string;
  name: string;
  resources?: any[];
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

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Resizable Columns
  const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
    tableId: 'solutions-products-table',
    columns: [
      { key: 'order', minWidth: 60, defaultWidth: 80 },
      { key: 'name', minWidth: 200, defaultWidth: 350 },
      { key: 'totalTasks', minWidth: 120, defaultWidth: 150 },
      { key: 'actions', minWidth: 80, defaultWidth: 100 },
    ],
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      // Find indices based on product ID
      const oldIndex = solutionProducts.findIndex((sp) => sp.node.id === active.id);
      const newIndex = solutionProducts.findIndex((sp) => sp.node.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(solutionProducts, oldIndex, newIndex);

        const productOrders = newOrder.map((sp, idx) => ({
          productId: sp.node.id,
          order: idx + 1
        }));

        try {
          await reorderProducts({
            variables: { solutionId, productOrders }
          });
        } catch (e) {
          console.error("Reorder failed", e);
        }
      }
    }
  };

  // Sort by order locally for rendering
  const sortedProducts = [...solutionProducts]
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .map(sp => sp.node);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
        <Tooltip title="Add Product">
          <IconButton onClick={() => setAddDialogOpen(true)} color="primary">
            <Add />
          </IconButton>
        </Tooltip>
      </Box>

      <SortableProductTable
        products={sortedProducts}
        onDragEnd={handleDragEnd}
        onRemove={handleRemoveProduct}
        emptyMessage='No products in this solution. Click "Add Product" to get started.'
      />

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








