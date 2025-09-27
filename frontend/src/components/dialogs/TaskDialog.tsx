import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Slider,
  Chip,
  OutlinedInput
} from '@mui/material';

interface Task {
  id: string;
  name: string;
  description?: string;
  estMinutes: number;
  weight: number;
  notes?: string;
  priority?: string;
  sequenceNumber?: number;
  licenseLevel?: string;
  requiredLicenseLevel?: number;
  licenseId?: string;
  outcomes?: Array<{ id: string; name: string }>;
}

interface Outcome {
  id: string;
  name: string;
}

interface License {
  id: string;
  name: string;
  level?: number;
}



interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    estMinutes: number;
    weight: number;
    notes?: string;
    priority?: string;
    licenseId?: string;
    outcomeIds?: string[];
  }) => Promise<void>;
  task?: Task | null;
  title: string;
  productId?: string;
  solutionId?: string;
  existingTasks: Task[];
  outcomes?: Outcome[];
  availableLicenses?: License[];
}

const priorities = ['Low', 'Medium', 'High', 'Critical'];

export const TaskDialog: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  task,
  title,
  productId,
  solutionId,
  existingTasks,
  outcomes = [],
  availableLicenses = []
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estMinutes, setEstMinutes] = useState(60);
  const [weight, setWeight] = useState(1);
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [selectedLicense, setSelectedLicense] = useState<string>('');
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate total weight of other tasks to show remaining weight
  const otherTasks = existingTasks.filter(t => t.id !== task?.id);
  const totalUsedWeight = otherTasks.reduce((sum, t) => sum + (t.weight || 0), 0);
  const remainingWeight = 100 - totalUsedWeight;

  console.log('TaskDialog Weight Calculation Details:', {
    existingTasksTotal: existingTasks.length,
    currentTaskId: task?.id,
    otherTasksCount: otherTasks.length,
    otherTasksWeights: otherTasks.map(t => ({ id: t.id, name: t.name, weight: t.weight })),
    totalUsedWeight,
    remainingWeight,
    calculation: `100 - ${totalUsedWeight} = ${remainingWeight}`
  });

  // Debug weight calculation
  React.useEffect(() => {
    console.log('Weight Debug - TaskDialog:', {
      existingTasksCount: existingTasks.length,
      currentTaskId: task?.id,
      allExistingTasks: existingTasks.map(t => ({ id: t.id, name: t.name, weight: t.weight })),
      filteredTasks: existingTasks.filter(t => t.id !== task?.id).map(t => ({ id: t.id, name: t.name, weight: t.weight })),
      totalUsedWeight,
      remainingWeight,
      productId,
      solutionId
    });
  }, [existingTasks, task?.id, totalUsedWeight, remainingWeight, productId, solutionId]);

  useEffect(() => {
    if (task) {
      setName(task.name || '');
      setDescription(task.description || '');
      setEstMinutes(task.estMinutes || 60);
      setWeight(task.weight || 1);
      setNotes(task.notes || '');
      setPriority(task.priority || 'Medium');
      setSelectedLicense(task.licenseId || '');
      setSelectedOutcomes(task.outcomes?.map(o => o.id) || []);
    } else {
      setName('');
      setDescription('');
      setEstMinutes(60);
      setWeight(Math.min(remainingWeight, 10));
      setNotes('');
      setPriority('Medium');
      setSelectedLicense('');
      setSelectedOutcomes([]);
    }
    setError('');
  }, [task, open, remainingWeight]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Task name is required');
      return;
    }

    const maxAllowedWeight = remainingWeight + (task?.weight || 0);
    console.log('Weight Validation Debug:', {
      inputWeight: weight,
      remainingWeight,
      currentTaskWeight: task?.weight || 0,
      maxAllowedWeight,
      wouldExceedLimit: weight > maxAllowedWeight
    });

    if (weight <= 0 || weight > maxAllowedWeight) {
      setError(`Weight must be between 1 and ${maxAllowedWeight} (remaining weight in product)`);
      return;
    }

    if (estMinutes <= 0) {
      setError('Estimated time must be greater than 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        estMinutes: estMinutes,
        weight: weight,
        notes: notes.trim() || undefined,
        priority: priority,
        licenseId: selectedLicense || undefined,
        outcomeIds: selectedOutcomes.length > 0 ? selectedOutcomes : undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Basic Information */}
          <TextField
            fullWidth
            label="Task Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
            autoFocus
            placeholder="e.g., Implement user authentication"
          />

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            placeholder="Detailed description of what needs to be accomplished..."
          />

          {/* Time, Weight, Priority, and License Level */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <Box sx={{ flex: '1 1 200px' }}>
              <TextField
                fullWidth
                label="Estimated Time (minutes)"
                type="number"
                value={estMinutes}
                onChange={(e) => setEstMinutes(parseInt(e.target.value) || 0)}
                margin="normal"
              />
            </Box>
            <Box sx={{ flex: '1 1 200px' }}>
              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography gutterBottom>
                  Weight: {weight}% (Remaining: {remainingWeight + (task?.weight || 0)}%)
                </Typography>
                <Slider
                  value={weight}
                  onChange={(_, value) => setWeight(value as number)}
                  min={1}
                  max={remainingWeight + (task?.weight || 0)}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 200px' }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  label="Priority"
                >
                  {priorities.map((pri) => (
                    <MenuItem key={pri} value={pri}>
                      {pri}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* License Selection */}
          {availableLicenses.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Required License</InputLabel>
                <Select
                  value={selectedLicense}
                  onChange={(e) => setSelectedLicense(e.target.value)}
                  label="Required License"
                >
                  <MenuItem value="">
                    <em>No license required</em>
                  </MenuItem>
                  {availableLicenses.map((license) => (
                    <MenuItem key={license.id} value={license.id}>
                      {license.name} (Level {license.level})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Outcomes Selection */}
          {outcomes.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Expected Outcomes</InputLabel>
                <Select
                  multiple
                  value={selectedOutcomes}
                  onChange={(e) => setSelectedOutcomes(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  input={<OutlinedInput label="Expected Outcomes" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const outcome = outcomes.find(o => o.id === value);
                        return (
                          <Chip key={value} label={outcome?.name || value} size="small" />
                        );
                      })}
                    </Box>
                  )}
                >
                  {outcomes.map((outcome) => (
                    <MenuItem key={outcome.id} value={outcome.id}>
                      {outcome.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Notes */}
          <TextField
            fullWidth
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            margin="normal"
            multiline
            rows={2}
            placeholder="Additional notes, comments, or requirements..."
          />

          {/* Validation Alerts */}
          {totalUsedWeight > 90 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Product weight is almost fully allocated ({totalUsedWeight}% used). Consider adjusting task weights.
            </Alert>
          )}

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
