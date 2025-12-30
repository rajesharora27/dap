import * as React from 'react';
import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Button,
  Stack,
  IconButton,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete } from '@shared/components/FAIcon';
import { SolutionDialog } from './SolutionDialog';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';
import { ConfirmDialog } from '@shared/components';

const SOLUTIONS = gql`
  query Solutions {
    solutions {
      edges {
        cursor
        node {
          id
          name
          resources { label url }
          customAttrs
          products {
            id
          }
        }
      }
    }
  }
`;
const CREATE_SOLUTION = gql`mutation CreateSolution($input:SolutionInput!){ createSolution(input:$input){ id name resources { label url } customAttrs } }`;
const UPDATE_SOLUTION = gql`mutation UpdateSolution($id:ID!,$input:SolutionInput!){ updateSolution(id:$id,input:$input){ id name resources { label url } customAttrs } }`;
const DELETE_SOLUTION = gql`mutation DeleteSolution($id:ID!){ deleteSolution(id:$id) }`;

interface Props { onSelect: (id: string) => void }
export const SolutionsPanel: React.FC<Props> = ({ onSelect }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<any>(null);
  const [dialogTitle, setDialogTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: ''
  });

  // Resizable columns integration
  const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
    tableId: 'solutions-catalog-table',
    columns: [
      { key: 'name', minWidth: 200, defaultWidth: 350 },
      { key: 'modified', minWidth: 120, defaultWidth: 180 },
      { key: 'products', minWidth: 80, defaultWidth: 120 },
      { key: 'actions', minWidth: 100, defaultWidth: 120 },
    ],
  });

  const { data, refetch } = useQuery(SOLUTIONS);
  const [createSolution] = useMutation(CREATE_SOLUTION, { onCompleted: () => refetch() });
  const [updateSolution] = useMutation(UPDATE_SOLUTION, { onCompleted: () => refetch() });
  const [deleteSolution] = useMutation(DELETE_SOLUTION, { onCompleted: () => refetch() });

  const edges = data?.solutions?.edges || [];

  // Extract timestamp from base64-encoded cursor
  const getCursorTimestamp = (cursor: string) => {
    try {
      const decoded = JSON.parse(atob(cursor));
      return decoded.createdAt ? new Date(decoded.createdAt).getTime() : 0;
    } catch (error) {
      return 0;
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

      if (diffInHours < 1) {
        return `${Math.floor(diffInMs / (1000 * 60))} mins ago`;
      } else if (diffInDays === 0) {
        return `${diffInHours} hours ago`;
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Unknown';
    }
  };

  const handleAdd = () => {
    setEditingSolution(null);
    setDialogTitle('Add Solution');
    setDialogOpen(true);
  };

  const handleEdit = (solution: any) => {
    setEditingSolution(solution);
    setDialogTitle('Edit Solution');
    setDialogOpen(true);
  };

  const handleSave = async (formData: any) => {
    if (editingSolution) {
      await updateSolution({
        variables: {
          id: editingSolution.id,
          input: formData
        }
      });
    } else {
      await createSolution({ variables: { input: formData } });
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ open: true, id, name });
  };

  const handleConfirmDelete = async () => {
    const { id, name } = deleteConfirm;
    await deleteSolution({ variables: { id } });
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} px={1} pt={1} mb={2}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          Add Solution
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <ResizableTableCell
                width={columnWidths['name']}
                resizable
                resizeHandleProps={getResizeHandleProps('name')}
                isResizing={isResizing}
              >
                <Typography variant="caption" fontWeight="bold">SOLUTION NAME</Typography>
              </ResizableTableCell>
              <ResizableTableCell
                width={columnWidths['modified']}
                resizable
                resizeHandleProps={getResizeHandleProps('modified')}
                isResizing={isResizing}
              >
                <Typography variant="caption" fontWeight="bold">LAST MODIFIED</Typography>
              </ResizableTableCell>
              <ResizableTableCell
                width={columnWidths['products']}
                resizable
                resizeHandleProps={getResizeHandleProps('products')}
                isResizing={isResizing}
              >
                <Typography variant="caption" fontWeight="bold">PRODUCTS</Typography>
              </ResizableTableCell>
              <TableCell width={columnWidths['actions']}>
                <Typography variant="caption" fontWeight="bold">ACTIONS</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {edges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">No solutions found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              edges.map((e: any) => (
                <TableRow
                  key={e.node.id}
                  hover
                  onClick={() => onSelect(e.node.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {e.node.name}
                      </Typography>
                      {e.node.customAttrs && Object.keys(e.node.customAttrs).length > 0 && (
                        <Chip
                          label={`+${Object.keys(e.node.customAttrs).length}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 18 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={`Last modified: ${new Date(getCursorTimestamp(e.cursor)).toLocaleString()}`}>
                      <Typography variant="caption">
                        {formatDate(getCursorTimestamp(e.cursor))}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${(e.node.products || []).length} associated`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </TableCell>
                  <TableCell onClick={(ev) => ev.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(e.node)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(e.node.id, e.node.name)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <SolutionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={() => { handleSave(null as any); }}
        solution={editingSolution}
        allProducts={[]}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Solution"
        message={`Are you sure you want to delete solution "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ ...deleteConfirm, open: false })}
        severity="error"
      />
    </Box>
  );
};
