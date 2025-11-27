import * as React from 'react';
import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  List,
  ListItemButton,
  ListItemText,
  Box,
  Button,
  Stack,
  IconButton,
  Typography,
  Chip
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { SolutionDialog } from './dialogs/SolutionDialog';

const SOLUTIONS = gql`
  query Solutions {
    solutions(first: 20) {
      edges {
        node {
          id
          name
          description
          customAttrs
          outcomes {
            id
            name
            description
          }
          releases {
            id
            name
            description
            level
          }
        }
      }
    }
  }
`;
const CREATE_SOLUTION = gql`mutation CreateSolution($input:SolutionInput!){ createSolution(input:$input){ id name description customAttrs } }`;
const UPDATE_SOLUTION = gql`mutation UpdateSolution($id:ID!,$input:SolutionInput!){ updateSolution(id:$id,input:$input){ id name description customAttrs } }`;
const DELETE_SOLUTION = gql`mutation DeleteSolution($id:ID!){ deleteSolution(id:$id) }`;

interface Props { onSelect: (id: string) => void }
export const SolutionsPanel: React.FC<Props> = ({ onSelect }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<any>(null);
  const [dialogTitle, setDialogTitle] = useState('');

  const { data, refetch } = useQuery(SOLUTIONS);
  const [createSolution] = useMutation(CREATE_SOLUTION, { onCompleted: () => refetch() });
  const [updateSolution] = useMutation(UPDATE_SOLUTION, { onCompleted: () => refetch() });
  const [deleteSolution] = useMutation(DELETE_SOLUTION, { onCompleted: () => refetch() });

  const edges = data?.solutions?.edges || [];

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

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete solution "${name}"?`)) {
      await deleteSolution({ variables: { id } });
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} px={1} pt={1}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          Add Solution
        </Button>
      </Stack>

      <List dense>
        {edges.map((e: any) => (
          <ListItemButton
            key={e.node.id}
            onClick={() => onSelect(e.node.id)}
            sx={{
              '&:hover .action-buttons': { opacity: 1 },
              borderRadius: 1,
              mx: 0.5,
              mb: 0.5
            }}
          >
            <ListItemText
              primary={
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
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    {e.node.description || 'No description'}
                  </Typography>
                  <Box
                    className="action-buttons"
                    sx={{ opacity: 0, transition: 'opacity 0.2s', display: 'flex', gap: 0.5 }}
                  >
                    <IconButton
                      size="small"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleEdit(e.node);
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleDelete(e.node.id, e.node.name);
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              }
            />
          </ListItemButton>
        ))}
      </List>

      <SolutionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={() => { handleSave(null as any); }}
        solution={editingSolution}
        allProducts={[]}
      />
    </Box>
  );
};
