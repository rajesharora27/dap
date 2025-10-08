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
  Chip,
  OutlinedInput,
  Tabs,
  Tab
} from '@mui/material';
import { Release } from '../../types/shared';
import TelemetryConfiguration from '../telemetry/TelemetryConfiguration';

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
  howToDoc?: string[];
  howToVideo?: string[];
  outcomes?: Array<{ id: string; name: string }>;
  releases?: Array<{ id: string; name: string; level: number }>;
  releaseIds?: string[];
  telemetryAttributes?: TelemetryAttribute[];
}

interface TelemetryAttribute {
  id?: string;
  name: string;
  description: string;
  dataType: 'BOOLEAN' | 'NUMBER' | 'STRING' | 'TIMESTAMP';
  successCriteria?: any;
  isRequired: boolean;
  order: number;
  currentValue?: {
    value: string;
    notes?: string;
  };
  isSuccessful?: boolean;
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
    releaseIds?: string[];
    howToDoc?: string[];
    howToVideo?: string[];
    telemetryAttributes?: TelemetryAttribute[];
  }) => Promise<void>;
  task?: Task | null;
  title: string;
  productId?: string;
  solutionId?: string;
  existingTasks: Task[];
  outcomes?: Outcome[];
  availableLicenses?: License[];
  availableReleases?: Release[];
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
  availableLicenses = [],
  availableReleases = []
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estMinutes, setEstMinutes] = useState(60);
  const [weight, setWeight] = useState(1);
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [howToDoc, setHowToDoc] = useState<string[]>([]);
  const [howToVideo, setHowToVideo] = useState<string[]>([]);
  const [selectedLicense, setSelectedLicense] = useState<string>('');
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([]);
  const [selectedReleases, setSelectedReleases] = useState<string[]>([]);
  const [telemetryAttributes, setTelemetryAttributes] = useState<TelemetryAttribute[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate total weight of other tasks to show remaining weight
  const otherTasks = existingTasks.filter(t => t.id !== task?.id);
  const totalUsedWeight = otherTasks.reduce((sum, t) => sum + (t.weight || 0), 0);
  const remainingWeight = Math.max(0, 100 - totalUsedWeight);
  const maxAllowedWeight = Math.max(0.01, remainingWeight + (task?.weight || 0));

  useEffect(() => {
    if (task) {
      setName(task.name || '');
      setDescription(task.description || '');
      setEstMinutes(task.estMinutes || 60);
      setWeight(task.weight || 1);
      setNotes(task.notes || '');
      setPriority(task.priority || 'Medium');
      setHowToDoc(task.howToDoc || []);
      setHowToVideo(task.howToVideo || []);
      setSelectedLicense(task.licenseId || '');
      setSelectedOutcomes(task.outcomes?.map(o => o.id) || []);
      setSelectedReleases(task.releases?.map(r => r.id) || task.releaseIds || []);
      setTelemetryAttributes(task.telemetryAttributes || []);
    } else {
      setName('');
      setDescription('');
      setEstMinutes(60);
      setWeight(Math.min(maxAllowedWeight, Math.max(0.01, remainingWeight)));
      setNotes('');
      setPriority('Medium');
      setHowToDoc([]);
      setHowToVideo([]);
      setSelectedLicense('');
      setSelectedOutcomes([]);
      setSelectedReleases([]);
      setTelemetryAttributes([]);
    }
    setError('');
    setActiveTab(0);
  }, [task, open, remainingWeight]);

    const handleSave = async () => {
    if (!name.trim()) {
      setError('Task name is required');
      return;
    }

    // Validate weight against remaining weight
    const maxAllowedWeightForValidation = remainingWeight + (task?.weight || 0);

    if (weight < 0.01 || weight > maxAllowedWeightForValidation) {
      setError(`Weight must be between 0.01 and ${maxAllowedWeightForValidation.toFixed(2)} (remaining weight in product)`);
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
        howToDoc: howToDoc.filter(link => link.trim()).length > 0 ? howToDoc.filter(link => link.trim()) : undefined,
        howToVideo: howToVideo.filter(link => link.trim()).length > 0 ? howToVideo.filter(link => link.trim()) : undefined,
        licenseId: selectedLicense || undefined,
        outcomeIds: selectedOutcomes.length > 0 ? selectedOutcomes : undefined,
        releaseIds: selectedReleases.length > 0 ? selectedReleases : undefined,
        telemetryAttributes: telemetryAttributes.length > 0 ? telemetryAttributes : undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      keepMounted
      disableEnforceFocus
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
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Basic Info" />
            <Tab label="Telemetry" />
          </Tabs>

          {activeTab === 0 && (
            <Box>
              <TextField
                fullWidth
                label="Task Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
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
                  const value = parseFloat(e.target.value) || 0.01;
                  setWeight(Math.min(maxAllowedWeight, Math.max(0.01, value)));
                }}
                margin="normal"
                inputProps={{ 
                  min: 0.01, 
                  max: maxAllowedWeight,
                  step: 0.01
                }}
                helperText={`Remaining weight: ${(remainingWeight + (task?.weight || 0)).toFixed(2)}% • Max allowed: ${maxAllowedWeight.toFixed(2)}%`}
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

          {/* Releases Selection */}
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

          {/* How To Documentation Links */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              How To Documentation Links
            </Typography>
            {howToDoc.map((link, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  value={link}
                  onChange={(e) => {
                    const newLinks = [...howToDoc];
                    newLinks[index] = e.target.value;
                    setHowToDoc(newLinks);
                  }}
                  placeholder="https://example.com/documentation"
                  size="small"
                />
                <Button
                  onClick={() => {
                    setHowToDoc(howToDoc.filter((_, i) => i !== index));
                  }}
                  variant="outlined"
                  color="error"
                  size="small"
                >
                  Remove
                </Button>
              </Box>
            ))}
            <Button
              onClick={() => setHowToDoc([...howToDoc, ''])}
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
            >
              + Add Documentation Link
            </Button>
          </Box>

          {/* How To Video Links */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              How To Video Links
            </Typography>
            {howToVideo.map((link, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  value={link}
                  onChange={(e) => {
                    const newLinks = [...howToVideo];
                    newLinks[index] = e.target.value;
                    setHowToVideo(newLinks);
                  }}
                  placeholder="https://example.com/video"
                  size="small"
                />
                <Button
                  onClick={() => {
                    setHowToVideo(howToVideo.filter((_, i) => i !== index));
                  }}
                  variant="outlined"
                  color="error"
                  size="small"
                >
                  Remove
                </Button>
              </Box>
            ))}
            <Button
              onClick={() => setHowToVideo([...howToVideo, ''])}
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
            >
              + Add Video Link
            </Button>
          </Box>

          {totalUsedWeight > 90 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Product weight is almost fully allocated ({totalUsedWeight}% used). Consider adjusting task weights.
            </Alert>
          )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <TelemetryConfiguration
                taskId={task?.id}
                attributes={telemetryAttributes}
                onChange={setTelemetryAttributes}
                disabled={loading}
              />
            </Box>
          )}

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disableRipple>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          disableRipple
        >
          {loading ? 'Saving...' : 'Save Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};