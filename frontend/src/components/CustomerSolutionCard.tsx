import * as React from 'react';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  OutlinedInput,
  Checkbox,
  ListItemText
} from '@mui/material';
import { Assessment, PlayArrow, CheckCircle } from '@mui/icons-material';
import { useMutation } from '@apollo/client';
import { 
  ASSIGN_SOLUTION_TO_CUSTOMER,
  CREATE_SOLUTION_ADOPTION_PLAN 
} from '../graphql/mutations';

interface CustomerSolution {
  id: string;
  name: string;
  licenseLevel: string;
  purchasedAt: string;
  solution: {
    id: string;
    name: string;
    description?: string;
    products?: { edges: any[] };
    outcomes?: any[];
    releases?: any[];
  };
  adoptionPlan?: {
    id: string;
    progressPercentage: number;
    totalTasks: number;
    completedTasks: number;
  };
}

interface Props {
  customerSolution: CustomerSolution;
  onViewPlan?: (planId: string) => void;
  onRefetch: () => void;
}

export const CustomerSolutionCard: React.FC<Props> = ({
  customerSolution,
  onViewPlan,
  onRefetch
}) => {
  const [createPlan, { loading: creating }] = useMutation(CREATE_SOLUTION_ADOPTION_PLAN, {
    onCompleted: onRefetch
  });

  const handleCreatePlan = async () => {
    try {
      await createPlan({
        variables: {
          customerSolutionId: customerSolution.id
        }
      });
    } catch (error: any) {
      alert(`Failed to create adoption plan: ${error.message}`);
    }
  };

  const handleViewPlan = () => {
    if (customerSolution.adoptionPlan && onViewPlan) {
      onViewPlan(customerSolution.adoptionPlan.id);
    }
  };

  const plan = customerSolution.adoptionPlan;
  const productCount = customerSolution.solution.products?.edges?.length || 0;
  
  const getLicenseLevelColor = (level: string) => {
    const colors: { [key: string]: any } = {
      'Essential': 'default',
      'Advantage': 'primary',
      'Signature': 'secondary'
    };
    return colors[level] || 'default';
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="div">
            {customerSolution.name}
          </Typography>
          <Chip
            label={customerSolution.licenseLevel}
            size="small"
            color={getLicenseLevelColor(customerSolution.licenseLevel)}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {customerSolution.solution.name}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`${productCount} products`}
            size="small"
            icon={<Assessment />}
          />
          {plan && (
            <>
              <Chip
                label={`${plan.completedTasks}/${plan.totalTasks} tasks`}
                size="small"
                color={plan.completedTasks === plan.totalTasks ? 'success' : 'default'}
              />
            </>
          )}
        </Box>

        {plan ? (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {plan.progressPercentage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(plan.progressPercentage, 100)}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        ) : (
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No adoption plan created yet
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions>
        {plan ? (
          <Button
            size="small"
            startIcon={<Assessment />}
            onClick={handleViewPlan}
          >
            View Plan
          </Button>
        ) : (
          <Button
            size="small"
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleCreatePlan}
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create Adoption Plan'}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

// Component for assigning solutions to customers
interface AssignSolutionDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  solutions: any[];
  onRefetch: () => void;
}

export const AssignSolutionDialog: React.FC<AssignSolutionDialogProps> = ({
  open,
  onClose,
  customerId,
  solutions,
  onRefetch
}) => {
  const [solutionId, setSolutionId] = useState('');
  const [name, setName] = useState('');
  const [licenseLevel, setLicenseLevel] = useState('Essential');
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([]);
  const [selectedReleases, setSelectedReleases] = useState<string[]>([]);

  const [assignSolution, { loading }] = useMutation(ASSIGN_SOLUTION_TO_CUSTOMER, {
    onCompleted: () => {
      onRefetch();
      onClose();
      resetForm();
    }
  });

  const resetForm = () => {
    setSolutionId('');
    setName('');
    setLicenseLevel('Essential');
    setSelectedOutcomes([]);
    setSelectedReleases([]);
  };

  const selectedSolution = solutions.find(s => s.id === solutionId);
  const availableOutcomes = selectedSolution?.outcomes || [];
  const availableReleases = selectedSolution?.releases || [];

  const handleAssign = async () => {
    if (!solutionId || !name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await assignSolution({
        variables: {
          input: {
            customerId,
            solutionId,
            name,
            licenseLevel,
            selectedOutcomeIds: selectedOutcomes,
            selectedReleaseIds: selectedReleases
          }
        }
      });
    } catch (error: any) {
      alert(`Failed to assign solution: ${error.message}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Assign Solution to Customer</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Solution</InputLabel>
          <Select
            value={solutionId}
            onChange={(e) => {
              setSolutionId(e.target.value);
              setName(solutions.find(s => s.id === e.target.value)?.name || '');
            }}
            label="Solution"
          >
            {solutions.map((solution: any) => (
              <MenuItem key={solution.id} value={solution.id}>
                {solution.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Assignment Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
          helperText="E.g., 'Production Environment', 'Branch Office Setup'"
        />

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

        {availableOutcomes.length > 0 && (
          <FormControl fullWidth margin="normal">
            <InputLabel>Selected Outcomes</InputLabel>
            <Select
              multiple
              value={selectedOutcomes}
              onChange={(e) => setSelectedOutcomes(e.target.value as string[])}
              input={<OutlinedInput label="Selected Outcomes" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const outcome = availableOutcomes.find((o: any) => o.id === value);
                    return <Chip key={value} label={outcome?.name} size="small" />;
                  })}
                </Box>
              )}
            >
              {availableOutcomes.map((outcome: any) => (
                <MenuItem key={outcome.id} value={outcome.id}>
                  <Checkbox checked={selectedOutcomes.indexOf(outcome.id) > -1} />
                  <ListItemText primary={outcome.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {availableReleases.length > 0 && (
          <FormControl fullWidth margin="normal">
            <InputLabel>Selected Releases</InputLabel>
            <Select
              multiple
              value={selectedReleases}
              onChange={(e) => setSelectedReleases(e.target.value as string[])}
              input={<OutlinedInput label="Selected Releases" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const release = availableReleases.find((r: any) => r.id === value);
                    return <Chip key={value} label={release?.name} size="small" />;
                  })}
                </Box>
              )}
            >
              {availableReleases.map((release: any) => (
                <MenuItem key={release.id} value={release.id}>
                  <Checkbox checked={selectedReleases.indexOf(release.id) > -1} />
                  <ListItemText primary={`${release.name} (v${release.level})`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={loading || !solutionId || !name}
        >
          {loading ? 'Assigning...' : 'Assign Solution'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};



