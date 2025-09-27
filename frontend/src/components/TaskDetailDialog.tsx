import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Checkbox,
  FormControlLabel,
  FormGroup
} from '@mui/material';
import { gql, useQuery, useMutation } from '@apollo/client';

const OUTCOMES_FOR_PRODUCT = gql`
  query OutcomesForProduct($productId: ID!) {
    outcomes(productId: $productId) {
      id
      name
      description
    }
  }
`;

const UPDATE_TASK_WITH_OUTCOMES = gql`
  mutation UpdateTask($id: ID!, $input: TaskUpdateInput!) {
    updateTask(id: $id, input: $input) {
      id
      name
      description
      estMinutes
      weight
      sequenceNumber
      licenseLevel
      priority
      notes
      outcomes {
        id
        name
      }
    }
  }
`;

interface License {
  id: string;
  name: string;
  level?: number;
}

interface TaskDetailDialogProps {
  open: boolean;
  task: any;
  productId: string;
  availableLicenses?: License[];
  onClose: () => void;
  onSave: () => void;
}

export function TaskDetailDialog({ open, task, productId, availableLicenses = [], onClose, onSave }: TaskDetailDialogProps) {
  const [editingTask, setEditingTask] = useState<any>(null);
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([]);

  const [updateTask] = useMutation(UPDATE_TASK_WITH_OUTCOMES);

  const { data: outcomesData } = useQuery(OUTCOMES_FOR_PRODUCT, {
    variables: { productId },
    skip: !productId,
    errorPolicy: 'all'
  });

  const outcomes = outcomesData?.outcomes || [];

  useEffect(() => {
    if (task) {
      const taskData = { ...task };

      // If task has licenseLevel but no licenseId, try to map it to a licenseId from available licenses
      if (task.licenseLevel && !task.licenseId && availableLicenses.length > 0) {
        const levelMap: { [key: string]: number } = {
          'ESSENTIAL': 1,
          'Essential': 1,
          'ADVANTAGE': 2,
          'Advantage': 2,
          'SIGNATURE': 3,
          'Signature': 3,
          'PREMIER': 3,
          'Premier': 3
        };

        const requiredLevel = levelMap[task.licenseLevel];
        if (requiredLevel) {
          const matchingLicense = availableLicenses.find(license => license.level === requiredLevel);
          if (matchingLicense) {
            taskData.licenseId = matchingLicense.id;
            console.log(`Mapped licenseLevel "${task.licenseLevel}" to licenseId "${matchingLicense.id}" (${matchingLicense.name})`);
          }
        }
      }

      setEditingTask(taskData);
      setSelectedOutcomes(task.outcomes?.map((outcome: any) => outcome.id) || []);
    } else {
      setEditingTask(null);
      setSelectedOutcomes([]);
    }
  }, [task, availableLicenses]);

  const handleSave = async () => {
    if (!editingTask?.name?.trim()) {
      alert('Task name is required');
      return;
    }

    // Ensure all required fields have valid values
    const taskInput = {
      name: editingTask.name.trim(),
      description: editingTask.description || '',
      estMinutes: Math.max(1, parseInt(editingTask.estMinutes) || 1),
      weight: Math.max(0, parseFloat(editingTask.weight) || 0),
      licenseId: editingTask.licenseId || undefined,
      priority: editingTask.priority || undefined,
      notes: editingTask.notes || '',
      outcomeIds: selectedOutcomes
    };

    console.log('Attempting to update task with input:', taskInput);

    try {
      const result = await updateTask({
        variables: {
          id: editingTask.id,
          input: taskInput
        },
        refetchQueries: ['TasksForProduct'],
        awaitRefetchQueries: true
      });

      console.log('Task updated successfully:', result);
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error updating task:', error);
      console.error('GraphQL errors:', error.graphQLErrors);
      console.error('Network error:', error.networkError);
      alert('Failed to update task: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleOutcomeToggle = (outcomeId: string) => {
    setSelectedOutcomes(prev =>
      prev.includes(outcomeId)
        ? prev.filter(id => id !== outcomeId)
        : [...prev, outcomeId]
    );
  };

  if (!editingTask) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Task Details - {editingTask.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 300px' }}>
            <TextField
              label="Task Name"
              value={editingTask.name || ''}
              onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Description"
              value={editingTask.description || ''}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              label="Notes"
              value={editingTask.notes || ''}
              onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
              fullWidth
              margin="normal"
              multiline
              rows={2}
            />
          </Box>

          <Box sx={{ flex: '1 1 300px' }}>
            <TextField
              label="Estimated Minutes"
              type="number"
              value={editingTask.estMinutes || 0}
              onChange={(e) => setEditingTask({ ...editingTask, estMinutes: parseInt(e.target.value) })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Weight (%)"
              type="number"
              value={editingTask.weight || 0}
              onChange={(e) => setEditingTask({ ...editingTask, weight: parseFloat(e.target.value) })}
              fullWidth
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Required License</InputLabel>
              <Select
                value={editingTask.licenseId || ''}
                onChange={(e) => setEditingTask({ ...editingTask, licenseId: e.target.value })}
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

            <FormControl fullWidth margin="normal">
              <InputLabel>Priority</InputLabel>
              <Select
                value={editingTask.priority || ''}
                onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                label="Priority"
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ width: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Associated Outcomes
            </Typography>

            {outcomes.length > 0 ? (
              <FormGroup>
                {outcomes.map((outcome: any) => (
                  <FormControlLabel
                    key={outcome.id}
                    control={
                      <Checkbox
                        checked={selectedOutcomes.includes(outcome.id)}
                        onChange={() => handleOutcomeToggle(outcome.id)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1">{outcome.name}</Typography>
                        {outcome.description && (
                          <Typography variant="body2" color="text.secondary">
                            {outcome.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No outcomes available for this product. Create outcomes in the Product Details page.
              </Typography>
            )}

            {selectedOutcomes.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Selected Outcomes:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {selectedOutcomes.map(outcomeId => {
                    const outcome = outcomes.find((o: any) => o.id === outcomeId);
                    return outcome ? (
                      <Chip
                        key={outcome.id}
                        label={outcome.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ) : null;
                  })}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
