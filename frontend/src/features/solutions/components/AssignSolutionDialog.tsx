import * as React from 'react';
import { useState, useEffect } from 'react';
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
  Checkbox,
  FormGroup,
  FormLabel,
  Alert,
  TextField,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Autocomplete
} from '@mui/material';
import { gql, useMutation, useQuery } from '@apollo/client';
import { ExpandMore } from '@shared/components/FAIcon';
import { ALL_OUTCOMES_ID, ALL_RELEASES_ID } from '@features/tasks';
import { SOLUTIONS_WITH_DETAILS } from '@features/solutions/graphql';

const ASSIGN_SOLUTION_TO_CUSTOMER = gql`
  mutation AssignSolutionToCustomer($input: AssignSolutionToCustomerInput!) {
    assignSolutionToCustomer(input: $input) {
      id
      name
      licenseLevel
      selectedOutcomes {
        id
        name
      }
      selectedReleases {
        id
        name
      }
    }
  }
`;

const CREATE_SOLUTION_ADOPTION_PLAN = gql`
  mutation CreateSolutionAdoptionPlan($customerSolutionId: ID!) {
    createSolutionAdoptionPlan(customerSolutionId: $customerSolutionId) {
      id
      progressPercentage
    }
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  customerId: string;
  onSuccess?: () => void;
}

export const AssignSolutionDialog: React.FC<Props> = ({
  open,
  onClose,
  customerId,
  onSuccess
}) => {
  const [selectedSolutionId, setSelectedSolutionId] = useState('');
  const [solutionName, setSolutionName] = useState('');
  const [licenseLevel, setLicenseLevel] = useState<'Essential' | 'Advantage' | 'Signature'>('Essential');
  const [selectedOutcomeIds, setSelectedOutcomeIds] = useState<string[]>([]);
  const [selectedReleaseIds, setSelectedReleaseIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const { data: solutionsData, loading: solutionsLoading } = useQuery(SOLUTIONS_WITH_DETAILS);

  const [assignSolution, { loading: assignLoading }] = useMutation(ASSIGN_SOLUTION_TO_CUSTOMER);
  const [createAdoptionPlan, { loading: createPlanLoading }] = useMutation(
    CREATE_SOLUTION_ADOPTION_PLAN
  );

  const solutions = solutionsData?.solutions?.edges?.map((e: any) => e.node) || [];
  const selectedSolution = solutions.find((s: any) => s.id === selectedSolutionId);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedSolutionId('');
      setSolutionName('');
      setLicenseLevel('Essential');
      setSelectedOutcomeIds([]);
      setSelectedReleaseIds([]);
      setError('');
    }
  }, [open]);

  // Auto-set solution name when solution is selected
  useEffect(() => {
    if (selectedSolution && !solutionName) {
      setSolutionName(selectedSolution.name);
    }
  }, [selectedSolution, solutionName]);

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

  const handleSubmit = async () => {
    setError('');

    if (!selectedSolutionId) {
      setError('Please select a solution');
      return;
    }

    if (!solutionName.trim()) {
      setError('Please provide a name for this assignment');
      return;
    }

    try {
      // Filter out special "All" markers before sending to backend
      // If "All" is selected, send empty array (backend treats this as "applies to all")
      const filteredOutcomeIds = selectedOutcomeIds.filter(id => id !== ALL_OUTCOMES_ID);
      const filteredReleaseIds = selectedReleaseIds.filter(id => id !== ALL_RELEASES_ID);

      // Step 1: Assign solution to customer
      const assignResult = await assignSolution({
        variables: {
          input: {
            customerId,
            solutionId: selectedSolutionId,
            name: solutionName.trim(),
            licenseLevel,
            selectedOutcomeIds: filteredOutcomeIds,
            selectedReleaseIds: filteredReleaseIds
          }
        },
        refetchQueries: ['Customers', 'GET_CUSTOMER_SOLUTIONS']
      });

      const customerSolutionId = assignResult.data?.assignSolutionToCustomer?.id;

      if (!customerSolutionId) {
        throw new Error('Failed to get customer solution ID');
      }

      // Step 2: Auto-create adoption plan
      await createAdoptionPlan({
        variables: {
          customerSolutionId
        },
        refetchQueries: ['GET_CUSTOMER_SOLUTIONS', 'Customers']
      });

      // Success!
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Assignment error:', err);
      setError(err.message || 'Failed to assign solution');
    }
  };

  const loading = assignLoading || createPlanLoading;

  // Get solution outcomes and releases
  const solutionOutcomes = selectedSolution?.outcomes || [];
  const solutionReleases = selectedSolution?.releases || [];
  const underlyingProducts = selectedSolution?.products?.edges?.map((e: any) => e.node) || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Assign Solution to Customer</DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Solution Selector */}
          <Autocomplete
            fullWidth
            options={solutions}
            getOptionLabel={(option: any) => option.name || ''}
            value={solutions.find((s: any) => s.id === selectedSolutionId) || null}
            onChange={(event, newValue) => {
              console.log('✅ Solution selected:', newValue);
              setSelectedSolutionId(newValue?.id || '');
            }}
            loading={solutionsLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Solution"
                placeholder="Select a solution"
                required
              />
            )}
            renderOption={(props, option: any) => (
              <li {...props} key={option.id}>
                <Box>
                  <Typography variant="body1">{option.name}</Typography>
                  {option.resources && option.resources.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {option.resources.length} resources
                    </Typography>
                  )}
                </Box>
              </li>
            )}
            isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
            ListboxProps={{
              style: {
                maxHeight: 300,
              },
            }}
          />

          {/* Assignment Name */}
          {selectedSolution && (
            <TextField
              fullWidth
              required
              label="Assignment Name"
              value={solutionName}
              onChange={(e) => setSolutionName(e.target.value)}
              helperText="This name will be used to identify this assignment and underlying products"
              autoFocus
            />
          )}

          {/* Show solution description and products */}
          {selectedSolution && (
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              {selectedSolution.resources && selectedSolution.resources.length > 0 && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedSolution.resources.length} resources
                </Typography>
              )}
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 'bold' }}>
                Underlying Products ({underlyingProducts.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {underlyingProducts.map((product: any) => (
                  <Chip key={product.id} label={product.name} size="small" />
                ))}
              </Box>
            </Paper>
          )}

          {/* License Level */}
          {selectedSolution && (
            <FormControl fullWidth required>
              <InputLabel>License Level</InputLabel>
              <Select
                value={licenseLevel}
                onChange={(e) => setLicenseLevel(e.target.value as any)}
                label="License Level"
              >
                <MenuItem value="Essential">Essential</MenuItem>
                <MenuItem value="Advantage">Advantage</MenuItem>
                <MenuItem value="Signature">Signature</MenuItem>
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                All underlying products will inherit this license tier
              </Typography>
            </FormControl>
          )}

          {/* Solution Outcomes Selection */}
          {selectedSolution && solutionOutcomes.length > 0 ? (
            <Box>
              <FormLabel component="legend">
                Solution Outcomes {selectedOutcomeIds.length > 0 && `(${selectedOutcomeIds.length} selected)`}
              </FormLabel>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Select outcomes for the solution. If none selected, all tasks will be included.
              </Typography>
              <FormGroup>
                {/* All Outcomes option */}
                <Box sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 1,
                  bgcolor: selectedOutcomeIds.includes(ALL_OUTCOMES_ID) ? 'action.selected' : 'background.paper',
                  border: '1px solid',
                  borderColor: selectedOutcomeIds.includes(ALL_OUTCOMES_ID) ? 'primary.main' : 'divider'
                }}>
                  <Checkbox
                    checked={selectedOutcomeIds.includes(ALL_OUTCOMES_ID)}
                    onChange={() => handleOutcomeToggle(ALL_OUTCOMES_ID)}
                  />
                  <Typography component="span" sx={{ fontWeight: 'bold' }}>
                    All Outcomes
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 5 }}>
                    Include all solution outcomes
                  </Typography>
                </Box>

                {/* Individual outcomes */}
                {solutionOutcomes.map((outcome: any) => (
                  <Box key={outcome.id} sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Checkbox
                      checked={selectedOutcomeIds.includes(outcome.id)}
                      onChange={() => handleOutcomeToggle(outcome.id)}
                      disabled={selectedOutcomeIds.includes(ALL_OUTCOMES_ID)}
                    />
                    <Typography component="span">{outcome.name}</Typography>
                    {outcome.description && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 5 }}>
                        {outcome.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </FormGroup>
            </Box>
          ) : selectedSolution ? (
            <Alert severity="info">
              <Typography variant="body2" fontWeight="600">
                No Solution-Level Outcomes
              </Typography>
              <Typography variant="caption">
                This solution has no solution-level outcomes defined. All tasks will be included in the adoption plan regardless of their outcome associations.
              </Typography>
            </Alert>
          ) : null}

          {/* Solution Releases Selection */}
          {selectedSolution && solutionReleases.length > 0 ? (
            <Box>
              <FormLabel component="legend">
                Solution Releases {selectedReleaseIds.length > 0 && `(${selectedReleaseIds.length} selected)`}
              </FormLabel>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Select releases for the solution. If none selected, all tasks will be included.
              </Typography>
              <FormGroup>
                {/* All Releases option */}
                <Box sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 1,
                  bgcolor: selectedReleaseIds.includes(ALL_RELEASES_ID) ? 'action.selected' : 'background.paper',
                  border: '1px solid',
                  borderColor: selectedReleaseIds.includes(ALL_RELEASES_ID) ? 'primary.main' : 'divider'
                }}>
                  <Checkbox
                    checked={selectedReleaseIds.includes(ALL_RELEASES_ID)}
                    onChange={() => handleReleaseToggle(ALL_RELEASES_ID)}
                  />
                  <Typography component="span" sx={{ fontWeight: 'bold' }}>
                    All Releases
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 5 }}>
                    Include all solution releases
                  </Typography>
                </Box>

                {/* Individual releases */}
                {solutionReleases.map((release: any) => (
                  <Box key={release.id} sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Checkbox
                      checked={selectedReleaseIds.includes(release.id)}
                      onChange={() => handleReleaseToggle(release.id)}
                      disabled={selectedReleaseIds.includes(ALL_RELEASES_ID)}
                    />
                    <Typography component="span">{release.name}</Typography>
                    {release.description && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 5 }}>
                        {release.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </FormGroup>
            </Box>
          ) : selectedSolution ? (
            <Alert severity="info">
              <Typography variant="body2" fontWeight="600">
                No Solution-Level Releases
              </Typography>
              <Typography variant="caption">
                This solution has no solution-level releases defined. All tasks will be included in the adoption plan regardless of their release associations.
              </Typography>
            </Alert>
          ) : null}

          {/* Info about underlying products */}
          {selectedSolution && underlyingProducts.length > 0 && (
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Note:</strong> All underlying products will be automatically assigned with:
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Same license tier ({licenseLevel})</li>
                <li>All their respective outcomes and releases</li>
                <li>Naming pattern: "{solutionName} - [Product Name]"</li>
              </ul>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !selectedSolutionId || !solutionName.trim()}
        >
          {loading ? 'Assigning...' : 'Assign & Create Adoption Plan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


