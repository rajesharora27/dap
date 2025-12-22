import * as React from 'react';
import { useState, useEffect } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  TextField,
  Chip,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Paper
} from '@mui/material';
import { ALL_OUTCOMES_ID, ALL_RELEASES_ID } from '@/components/dialogs/TaskDialog';

const GET_CUSTOMER_SOLUTION = gql`
  query GetCustomerSolution($id: ID!) {
    customerSolution(id: $id) {
      id
      name
      licenseLevel
      selectedOutcomes {
        id
        name
        description
      }
      selectedReleases {
        id
        name
        description
      }
      solution {
        id
        name
        description
        outcomes {
          id
          name
          description
        }
        releases {
          id
          name
          description
        }
        products {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  }
`;

const UPDATE_CUSTOMER_SOLUTION = gql`
  mutation UpdateCustomerSolution($id: ID!, $input: UpdateCustomerSolutionInput!) {
    updateCustomerSolution(id: $id, input: $input) {
      id
      name
      licenseLevel
      selectedOutcomes {
        id
        name
        description
      }
      selectedReleases {
        id
        name
        description
      }
    }
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  customerSolutionId: string;
  onSuccess: () => void;
}

export function EditSolutionEntitlementsDialog({
  open,
  onClose,
  customerSolutionId,
  onSuccess,
}: Props) {
  const [licenseLevel, setLicenseLevel] = useState('Essential');
  const [name, setName] = useState('');
  const [selectedOutcomeIds, setSelectedOutcomeIds] = useState<string[]>([]);
  const [selectedReleaseIds, setSelectedReleaseIds] = useState<string[]>([]);

  const { data, loading, error: queryError } = useQuery(GET_CUSTOMER_SOLUTION, {
    variables: { id: customerSolutionId },
    skip: !customerSolutionId || !open,
  });

  const [updateSolution, { loading: updating }] = useMutation(UPDATE_CUSTOMER_SOLUTION, {
    refetchQueries: ['GetCustomerSolutions', 'GetCustomerSolution', 'GetCustomers'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      onClose();
      onSuccess();
    },
    onError: (err) => {
      console.error('Error updating solution:', err);
      alert('Failed to update: ' + err.message);
    }
  });

  useEffect(() => {
    if (data?.customerSolution && open) {
      setLicenseLevel(data.customerSolution.licenseLevel);
      setName(data.customerSolution.name);
      
      // Handle selected outcomes - extract IDs from objects
      const currentOutcomes = data.customerSolution.selectedOutcomes || [];
      const currentOutcomeIds = currentOutcomes.map((o: any) => o.id);
      if (currentOutcomeIds.length === 0 || currentOutcomeIds.includes(ALL_OUTCOMES_ID)) {
        setSelectedOutcomeIds([ALL_OUTCOMES_ID]);
      } else {
        setSelectedOutcomeIds(currentOutcomeIds);
      }
      
      // Handle selected releases - extract IDs from objects
      const currentReleases = data.customerSolution.selectedReleases || [];
      const currentReleaseIds = currentReleases.map((r: any) => r.id);
      if (currentReleaseIds.length === 0 || currentReleaseIds.includes(ALL_RELEASES_ID)) {
        setSelectedReleaseIds([ALL_RELEASES_ID]);
      } else {
        setSelectedReleaseIds(currentReleaseIds);
      }
    }
  }, [data, open]);

  const handleOutcomeToggle = (outcomeId: string) => {
    if (outcomeId === ALL_OUTCOMES_ID) {
      // Toggle "All" - if selected, deselect all; if not selected, select only "All"
      if (selectedOutcomeIds.includes(ALL_OUTCOMES_ID)) {
        setSelectedOutcomeIds([]);
      } else {
        setSelectedOutcomeIds([ALL_OUTCOMES_ID]);
      }
    } else {
      // Toggle individual outcome - remove "All" if it was selected
      setSelectedOutcomeIds((prev) => {
        const newSelection = prev.filter(id => id !== ALL_OUTCOMES_ID);
        if (newSelection.includes(outcomeId)) {
          return newSelection.filter(id => id !== outcomeId);
        } else {
          return [...newSelection, outcomeId];
        }
      });
    }
  };

  const handleReleaseToggle = (releaseId: string) => {
    if (releaseId === ALL_RELEASES_ID) {
      // Toggle "All" - if selected, deselect all; if not selected, select only "All"
      if (selectedReleaseIds.includes(ALL_RELEASES_ID)) {
        setSelectedReleaseIds([]);
      } else {
        setSelectedReleaseIds([ALL_RELEASES_ID]);
      }
    } else {
      // Toggle individual release - remove "All" if it was selected
      setSelectedReleaseIds((prev) => {
        const newSelection = prev.filter(id => id !== ALL_RELEASES_ID);
        if (newSelection.includes(releaseId)) {
          return newSelection.filter(id => id !== releaseId);
        } else {
          return [...newSelection, releaseId];
        }
      });
    }
  };

  const handleSave = () => {
    // Filter out special "All" markers before sending to backend
    const filteredOutcomeIds = selectedOutcomeIds.filter(id => id !== ALL_OUTCOMES_ID);
    const filteredReleaseIds = selectedReleaseIds.filter(id => id !== ALL_RELEASES_ID);
    
    updateSolution({
      variables: {
        id: customerSolutionId,
        input: {
          name,
          licenseLevel,
          selectedOutcomeIds: filteredOutcomeIds,
          selectedReleaseIds: filteredReleaseIds
        }
      }
    });
  };

  const hasChanges = data?.customerSolution && (
    licenseLevel !== data.customerSolution.licenseLevel ||
    name !== data.customerSolution.name ||
    JSON.stringify(selectedOutcomeIds.filter(id => id !== ALL_OUTCOMES_ID).sort()) !== 
      JSON.stringify((data.customerSolution.selectedOutcomes || []).map((o: any) => o.id).sort()) ||
    JSON.stringify(selectedReleaseIds.filter(id => id !== ALL_RELEASES_ID).sort()) !== 
      JSON.stringify((data.customerSolution.selectedReleases || []).map((r: any) => r.id).sort())
  );

  const isFormValid = name.trim() !== '';

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Solution Assignment</DialogTitle>
      
      <DialogContent>
        {/* Assignment Name */}
        <TextField
          fullWidth
          label="Assignment Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
        />

        {/* License Level */}
        <FormControl fullWidth margin="normal">
          <InputLabel>License Level</InputLabel>
          <Select
            value={licenseLevel}
            onChange={(e) => setLicenseLevel(e.target.value)}
            label="License Level"
          >
            <MenuItem value="Essential">Essential</MenuItem>
            <MenuItem value="Advantage">Advantage</MenuItem>
            <MenuItem value="Signature">Signature</MenuItem>
          </Select>
        </FormControl>

        {/* Outcomes */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Outcomes
          </Typography>
          {data?.customerSolution?.solution?.outcomes && data.customerSolution.solution.outcomes.length > 0 ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedOutcomeIds.includes(ALL_OUTCOMES_ID) || selectedOutcomeIds.length === 0}
                      onChange={() => handleOutcomeToggle(ALL_OUTCOMES_ID)}
                    />
                  }
                  label={<Typography fontWeight="bold">All Outcomes</Typography>}
                />
                <Box sx={{ pl: 3, borderLeft: '2px solid #e0e0e0', ml: 1.5, mt: 1 }}>
                  {data.customerSolution.solution.outcomes.map((outcome: any) => (
                    <FormControlLabel
                      key={outcome.id}
                      control={
                        <Checkbox
                          checked={selectedOutcomeIds.includes(outcome.id)}
                          onChange={() => handleOutcomeToggle(outcome.id)}
                          disabled={selectedOutcomeIds.includes(ALL_OUTCOMES_ID)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">{outcome.name}</Typography>
                          {outcome.description && (
                            <Typography variant="caption" color="text.secondary">
                              {outcome.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  ))}
                </Box>
              </FormGroup>
            </Paper>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No outcomes available
            </Typography>
          )}
        </Box>

        {/* Releases */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Releases
          </Typography>
          {data?.customerSolution?.solution?.releases && data.customerSolution.solution.releases.length > 0 ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedReleaseIds.includes(ALL_RELEASES_ID) || selectedReleaseIds.length === 0}
                      onChange={() => handleReleaseToggle(ALL_RELEASES_ID)}
                    />
                  }
                  label={<Typography fontWeight="bold">All Releases</Typography>}
                />
                <Box sx={{ pl: 3, borderLeft: '2px solid #e0e0e0', ml: 1.5, mt: 1 }}>
                  {data.customerSolution.solution.releases.map((release: any) => (
                    <FormControlLabel
                      key={release.id}
                      control={
                        <Checkbox
                          checked={selectedReleaseIds.includes(release.id)}
                          onChange={() => handleReleaseToggle(release.id)}
                          disabled={selectedReleaseIds.includes(ALL_RELEASES_ID)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">{release.name}</Typography>
                          {release.description && (
                            <Typography variant="caption" color="text.secondary">
                              {release.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  ))}
                </Box>
              </FormGroup>
            </Paper>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No releases available
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={updating || !hasChanges || !isFormValid}
        >
          {updating ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};