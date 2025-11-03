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
  CircularProgress
} from '@mui/material';
import { ALL_OUTCOMES_ID, ALL_RELEASES_ID } from './TaskDialog';

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
  const [licenseLevel, setLicenseLevel] = useState('ESSENTIAL');
  const [name, setName] = useState('');
  const [selectedOutcomeIds, setSelectedOutcomeIds] = useState<string[]>([]);
  const [selectedReleaseIds, setSelectedReleaseIds] = useState<string[]>([]);

  const { data, loading } = useQuery(GET_CUSTOMER_SOLUTION, {
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label="All Outcomes"
                onClick={() => handleOutcomeToggle(ALL_OUTCOMES_ID)}
                color={selectedOutcomeIds.includes(ALL_OUTCOMES_ID) ? 'primary' : 'default'}
                variant={selectedOutcomeIds.includes(ALL_OUTCOMES_ID) ? 'filled' : 'outlined'}
              />
              {data.customerSolution.solution.outcomes.map((outcome: any) => (
                <Chip
                  key={outcome.id}
                  label={outcome.name}
                  onClick={() => handleOutcomeToggle(outcome.id)}
                  color={selectedOutcomeIds.includes(outcome.id) ? 'primary' : 'default'}
                  variant={selectedOutcomeIds.includes(outcome.id) ? 'filled' : 'outlined'}
                  disabled={selectedOutcomeIds.includes(ALL_OUTCOMES_ID)}
                />
              ))}
            </Box>
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label="All Releases"
                onClick={() => handleReleaseToggle(ALL_RELEASES_ID)}
                color={selectedReleaseIds.includes(ALL_RELEASES_ID) ? 'primary' : 'default'}
                variant={selectedReleaseIds.includes(ALL_RELEASES_ID) ? 'filled' : 'outlined'}
              />
              {data.customerSolution.solution.releases.map((release: any) => (
                <Chip
                  key={release.id}
                  label={release.name}
                  onClick={() => handleReleaseToggle(release.id)}
                  color={selectedReleaseIds.includes(release.id) ? 'primary' : 'default'}
                  variant={selectedReleaseIds.includes(release.id) ? 'filled' : 'outlined'}
                  disabled={selectedReleaseIds.includes(ALL_RELEASES_ID)}
                />
              ))}
            </Box>
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