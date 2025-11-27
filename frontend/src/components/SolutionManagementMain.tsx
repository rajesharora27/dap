import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import {
  Add,
  Edit,
  Delete
} from '@mui/icons-material';
import { SolutionDialog } from './dialogs/SolutionDialog';
import { gql, useMutation } from '@apollo/client';

const DELETE_SOLUTION = gql`
  mutation DeleteSolution($id: ID!) {
    deleteSolution(id: $id)
  }
`;

interface Props {
  solutions: any[];
  allProducts: any[];
  onRefetch: () => void;
  onProductClick?: (productId: string) => void;
  onSolutionSelect?: (solutionId: string) => void;
}

export const SolutionManagementMain: React.FC<Props> = ({
  solutions,
  allProducts,
  onRefetch,
  onProductClick,
  onSolutionSelect
}) => {
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>(
    solutions[0]?.id || ''
  );

  // Notify parent when solution selection changes
  React.useEffect(() => {
    if (selectedSolutionId && onSolutionSelect) {
      onSolutionSelect(selectedSolutionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSolutionId]); // Intentionally excluding onSolutionSelect to prevent infinite loop
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<any>(null);
  const [dialogInitialTab, setDialogInitialTab] = useState<'general' | 'products' | 'outcomes' | 'releases' | 'customAttributes'>('general');

  const [deleteSolution] = useMutation(DELETE_SOLUTION, {
    onCompleted: () => {
      onRefetch();
      if (solutions.length > 0) {
        setSelectedSolutionId(solutions[0].id);
      }
    }
  });

  const selectedSolution = solutions.find(s => s.id === selectedSolutionId);

  const handleAddSolution = () => {
    setEditingSolution(null);
    setDialogInitialTab('general');
    setDialogOpen(true);
  };

  const handleEditSolution = (tabName?: 'general' | 'products' | 'outcomes' | 'releases' | 'customAttributes') => {
    if (selectedSolution) {
      setEditingSolution(selectedSolution);
      setDialogInitialTab(tabName || 'general');
      setDialogOpen(true);
    }
  };

  const handleDeleteSolution = async () => {
    if (!selectedSolution) return;
    if (confirm(`Delete solution "${selectedSolution.name}"? This will also remove it from all customers.`)) {
      await deleteSolution({ variables: { id: selectedSolution.id } });
    }
  };

  const handleSave = () => {
    onRefetch();
    setDialogOpen(false);
  };

  const productsList = selectedSolution?.products?.edges || [];
  const outcomesList = selectedSolution?.outcomes || [];
  const licensesList = selectedSolution?.licenses || [];
  const releasesList = selectedSolution?.releases || [];
  // Filter out licenseLevel on display (it's a separate field, not a custom attribute)
  const allCustomAttrs = selectedSolution?.customAttrs || {};
  const customAttrs = Object.fromEntries(
    Object.entries(allCustomAttrs).filter(([key]) => key.toLowerCase() !== 'licenselevel')
  );
  const finalCustomAttrEntries = Object.entries(customAttrs);

  const NAME_DISPLAY_LIMIT = 12;

  return (
    <Box>
      {/* Solution Selector and Action Buttons */}
      <Paper sx={{ p: 2, mb: 3 }}>
        {solutions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Solutions Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Solutions bundle multiple products together for unified adoption tracking
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAddSolution}
            >
              Create Your First Solution
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 300, flex: '1 1 300px' }}>
              <InputLabel>Select Solution</InputLabel>
              <Select
                value={selectedSolutionId}
                onChange={(e) => setSelectedSolutionId(e.target.value)}
                label="Select Solution"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#DFE1E6'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#0070D2'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#0070D2'
                  }
                }}
              >
                {solutions.map((solution: any) => (
                  <MenuItem key={solution.id} value={solution.id}>
                    {solution.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddSolution}
                size="medium"
                sx={{
                  backgroundColor: '#0070D2',
                  '&:hover': {
                    backgroundColor: '#005FB2'
                  }
                }}
              >
                Add
              </Button>
              {selectedSolution && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => handleEditSolution()}
                    size="medium"
                    sx={{
                      backgroundColor: '#0070D2',
                      '&:hover': {
                        backgroundColor: '#005FB2'
                      }
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleDeleteSolution}
                    size="medium"
                  >
                    Delete
                  </Button>
                </>
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Solution Details */}
      {selectedSolution && (
        <Box>
          {/* Name and Description */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              {selectedSolution.name}
            </Typography>
            {selectedSolution.description && (
              <Typography variant="body1" sx={{ mt: 1, color: '#42526E' }}>
                {selectedSolution.description}
              </Typography>
            )}
          </Paper>

          {/* Tiles Grid - Matching Products Section Pattern */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 2
            }}
          >
            {/* Products Tile */}
            <Paper
              elevation={1}
              onClick={() => handleEditSolution('products')}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid #e8e8e8',
                borderTop: '3px solid #0070D2',
                borderRadius: 2,
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderTopColor: '#049FD9',
                  borderColor: '#0070D2',
                  backgroundColor: '#fafbff'
                }
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Products ({productsList.length})
              </Typography>
              {productsList.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {(productsList.length <= NAME_DISPLAY_LIMIT ? productsList : productsList.slice(0, NAME_DISPLAY_LIMIT)).map((edge: any, idx: number) => (
                    <Typography
                      key={edge.node.id}
                      variant="body2"
                      sx={{
                        color: '#424242',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {idx + 1}. {edge.node.name}
                    </Typography>
                  ))}
                  {productsList.length > NAME_DISPLAY_LIMIT && (
                    <Typography variant="caption" color="text.secondary">
                      +{productsList.length - NAME_DISPLAY_LIMIT} more
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No products yet
                </Typography>
              )}
            </Paper>

            {/* Outcomes Tile */}
            <Paper
              elevation={1}
              onClick={() => handleEditSolution('outcomes')}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid #e8e8e8',
                borderTop: '3px solid #0070D2',
                borderRadius: 2,
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderTopColor: '#049FD9',
                  borderColor: '#0070D2',
                  backgroundColor: '#fafbff'
                }
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Outcomes
              </Typography>
              {outcomesList.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {(outcomesList.length <= NAME_DISPLAY_LIMIT ? outcomesList : outcomesList.slice(0, NAME_DISPLAY_LIMIT)).map((outcome: any) => (
                    <Typography
                      key={outcome.id}
                      variant="body2"
                      sx={{
                        color: '#424242',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {outcome.name}
                    </Typography>
                  ))}
                  {outcomesList.length > NAME_DISPLAY_LIMIT && (
                    <Typography variant="caption" color="text.secondary">
                      +{outcomesList.length - NAME_DISPLAY_LIMIT} more
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No entries yet
                </Typography>
              )}
            </Paper>

            {/* Licenses Tile - removed, now in general tab via license tier dropdown */}

            {/* Releases Tile */}
            <Paper
              elevation={1}
              onClick={() => handleEditSolution('releases')}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid #e8e8e8',
                borderTop: '3px solid #0070D2',
                borderRadius: 2,
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderTopColor: '#049FD9',
                  borderColor: '#0070D2',
                  backgroundColor: '#fafbff'
                }
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Releases
              </Typography>
              {releasesList.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {(releasesList.length <= NAME_DISPLAY_LIMIT ? releasesList : releasesList.slice(0, NAME_DISPLAY_LIMIT)).map((release: any) => (
                    <Typography
                      key={release.id}
                      variant="body2"
                      sx={{
                        color: '#424242',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {release.name} <strong>(v{release.level})</strong>
                    </Typography>
                  ))}
                  {releasesList.length > NAME_DISPLAY_LIMIT && (
                    <Typography variant="caption" color="text.secondary">
                      +{releasesList.length - NAME_DISPLAY_LIMIT} more
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No entries yet
                </Typography>
              )}
            </Paper>

            {/* Custom Attributes Tile */}
            <Paper
              elevation={1}
              onClick={() => handleEditSolution('customAttributes')}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid #e8e8e8',
                borderTop: '3px solid #0070D2',
                borderRadius: 2,
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderTopColor: '#049FD9',
                  borderColor: '#0070D2',
                  backgroundColor: '#fafbff'
                }
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Custom Attributes ({finalCustomAttrEntries.length})
              </Typography>
              {finalCustomAttrEntries.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {(finalCustomAttrEntries.length <= NAME_DISPLAY_LIMIT ? finalCustomAttrEntries : finalCustomAttrEntries.slice(0, NAME_DISPLAY_LIMIT)).map(([key, value]: [string, any]) => (
                    <Typography
                      key={key}
                      variant="body2"
                      sx={{
                        color: '#424242',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </Typography>
                  ))}
                  {finalCustomAttrEntries.length > NAME_DISPLAY_LIMIT && (
                    <Typography variant="caption" color="text.secondary">
                      +{finalCustomAttrEntries.length - NAME_DISPLAY_LIMIT} more
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No entries yet
                </Typography>
              )}
            </Paper>
          </Box>
        </Box>
      )}

      {/* Solution Dialog */}
      <SolutionDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setDialogInitialTab('general');
        }}
        onSave={handleSave}
        solution={editingSolution}
        allProducts={allProducts}
        initialTab={dialogInitialTab}
      />
    </Box>
  );
};
