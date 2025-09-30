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
  OutlinedInput,
  Slider
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

const UPDATE_TASK = gql`
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
      howToDoc
      howToVideo
      license {
        id
        name
        level
      }
      outcomes {
        id
        name
      }
      releases {
        id
        name
        level
      }
    }
  }
`;

interface License {
  id: string;
  name: string;
  level?: number;
}

interface Release {
  id: string;
  name: string;
  level: number;
}

interface TaskDetailDialogProps {
  open: boolean;
  task: any;
  productId: string;
  availableLicenses?: License[];
  availableReleases?: Release[];
  onClose: () => void;
  onSave: () => void;
}

export function TaskDetailDialog({ open, task, productId, availableLicenses = [], availableReleases = [], onClose, onSave }: TaskDetailDialogProps) {
  const [editingTask, setEditingTask] = useState<any>(null);
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([]);
  const [selectedReleases, setSelectedReleases] = useState<string[]>([]);

  // Add individual state for form fields to match TaskDialog
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estMinutes, setEstMinutes] = useState(60);
  const [weight, setWeight] = useState(1);
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [howToDoc, setHowToDoc] = useState('');
  const [howToVideo, setHowToVideo] = useState('');
  const [selectedLicense, setSelectedLicense] = useState<string>('');

  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  
  // Weight calculation (simplified since we don't have existingTasks in this context)
  const remainingWeight = Math.max(0, 100 - (task?.weight || 0));
  const maxAllowedWeight = Math.max(1, remainingWeight + (task?.weight || 0));

  const [updateTask] = useMutation(UPDATE_TASK);

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
          }
        }
      }

      setEditingTask(taskData);
      
      // Set individual form fields
      setName(task.name || '');
      setDescription(task.description || '');
      setEstMinutes(task.estMinutes || 60);
      setWeight(task.weight || 1);
      setNotes(task.notes || '');
      setPriority(task.priority || 'Medium');
      setHowToDoc(task.howToDoc || '');
      setHowToVideo(task.howToVideo || '');
      setSelectedLicense(taskData.licenseId || '');
      
      setSelectedOutcomes(task.outcomes?.map((outcome: any) => outcome.id) || []);
      setSelectedReleases(task.releases?.map((r: any) => r.id) || task.availableInReleases?.map((r: any) => r.id) || []);
    } else {
      setEditingTask(null);
      setName('');
      setDescription('');
      setEstMinutes(60);
      setWeight(1);
      setNotes('');
      setPriority('Medium');
      setHowToDoc('');
      setHowToVideo('');
      setSelectedLicense('');
      setSelectedOutcomes([]);
      setSelectedReleases([]);
    }
  }, [task, availableLicenses, availableReleases]);

  const handleSave = async () => {
    if (!name?.trim()) {
      alert('Task name is required');
      return;
    }

    // Ensure all required fields have valid values
    const taskInput = {
      name: name.trim(),
      description: description || '',
      estMinutes: Math.max(1, parseInt(estMinutes.toString()) || 1),
      weight: Math.max(0, parseFloat(weight.toString()) || 0),
      licenseId: selectedLicense || undefined,
      priority: priority || undefined,
      notes: notes || '',
      howToDoc: howToDoc.trim() || undefined,
      howToVideo: howToVideo.trim() || undefined,
      outcomeIds: selectedOutcomes,
      releaseIds: selectedReleases
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

  if (!editingTask) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      keepMounted
      container={document.getElementById('root')}
      BackdropProps={{
        onClick: onClose
      }}
      slotProps={{
        backdrop: {
          invisible: false
        }
      }}
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
          mt: 4
        }
      }}
    >
      <DialogTitle>Task Details</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
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
              <TextField
                fullWidth
                label="Weight (%)"
                type="number"
                value={weight}
                onChange={(e) => {
                  const value = Math.min(maxAllowedWeight, Math.max(1, parseInt(e.target.value) || 1));
                  setWeight(value);
                }}
                margin="normal"
                inputProps={{ 
                  min: 1, 
                  max: maxAllowedWeight
                }}
                helperText={`Max allowed: ${maxAllowedWeight}%`}
              />
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
                        const outcome = outcomes.find((o: any) => o.id === value);
                        return (
                          <Chip key={value} label={outcome?.name || value} size="small" />
                        );
                      })}
                    </Box>
                  )}
                >
                  {outcomes.map((outcome: any) => (
                    <MenuItem key={outcome.id} value={outcome.id}>
                      {outcome.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Releases Section */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Releases</InputLabel>
            <Select
              multiple
              value={selectedReleases}
              onChange={(e) => setSelectedReleases(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Releases" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const release = availableReleases.find(r => r.id === value);
                    return (
                      <Chip key={value} label={release ? `${release.name} (v${release.level})` : value} size="small" />
                    );
                  })}
                </Box>
              )}
              disabled={availableReleases?.length === 0}
            >
              {availableReleases?.length > 0 ? (
                [...availableReleases]
                  .sort((a, b) => a.level - b.level)
                  .map((release) => (
                    <MenuItem key={release.id} value={release.id}>
                      {release.name} (v{release.level})
                    </MenuItem>
                  ))
              ) : (
                <MenuItem disabled>No releases available for this product</MenuItem>
              )}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {availableReleases?.length > 0 
                ? "Tasks are automatically available in higher release levels."
                : "Create releases for this product to assign tasks to specific versions."
              }
            </Typography>
          </FormControl>

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

          <TextField
            fullWidth
            label="How To Documentation Link"
            value={howToDoc}
            onChange={(e) => setHowToDoc(e.target.value)}
            margin="normal"
            placeholder="https://docs.example.com/how-to-implement-this-task"
            helperText="HTTP link to documentation explaining how to implement this task"
          />

          <TextField
            fullWidth
            label="How To Video Link"
            value={howToVideo}
            onChange={(e) => setHowToVideo(e.target.value)}
            margin="normal"
            placeholder="https://youtube.com/watch?v=example"
            helperText="Link to video tutorial explaining how to implement this task"
          />

          {weight > 90 && (
            <Box sx={{ mt: 2 }}>
              <Typography color="warning.main" variant="body2">
                ⚠️ High task weight ({weight}%). Consider breaking this into smaller tasks.
              </Typography>
            </Box>
          )}
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
