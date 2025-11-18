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
  Tab,
  Checkbox,
  ListItemText
} from '@mui/material';
import { Release } from '../../types/shared';
import TelemetryConfiguration from '../telemetry/TelemetryConfiguration';

// Special marker IDs for "All" selections
export const ALL_OUTCOMES_ID = '__ALL_OUTCOMES__';
export const ALL_RELEASES_ID = '__ALL_RELEASES__';

interface Task {
  id: string;
  name: string;
  description?: string;
  estMinutes: number;
  weight: number;
  notes?: string;
  sequenceNumber?: number;
  licenseLevel?: string;
  requiredLicenseLevel?: number;
  licenseId?: string;
  license?: { id: string; name: string; level: number };
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
    console.log('[TaskDialog] useEffect triggered - open:', open, 'task:', task ? task.name : 'null');
    if (task) {
      console.log('[TaskDialog] Task ID:', task.id, 'Name:', task.name);
      console.log('[TaskDialog] Task has telemetryAttributes?', !!task.telemetryAttributes, 'Count:', task.telemetryAttributes?.length || 0);
      setName(task.name || '');
      setDescription(task.description || '');
      setEstMinutes(task.estMinutes || 60);
      setWeight(task.weight || 1);
      setNotes(task.notes || '');
      setHowToDoc(task.howToDoc || []);
      setHowToVideo(task.howToVideo || []);
      // Fix: task.license is an object, need to access task.license.id
      setSelectedLicense((task as any).license?.id || task.licenseId || '');
      
      // If task has no outcomes (null/undefined/empty), it means "applies to all"
      // Set the special "All" marker in this case
      const taskOutcomes = task.outcomes?.map(o => o.id) || [];
      setSelectedOutcomes(taskOutcomes.length > 0 ? taskOutcomes : [ALL_OUTCOMES_ID]);
      
      // Same for releases
      const taskReleases = task.releases?.map(r => r.id) || task.releaseIds || [];
      setSelectedReleases(taskReleases.length > 0 ? taskReleases : [ALL_RELEASES_ID]);
      
      console.log('[TaskDialog] Loading task telemetry attributes:', task.telemetryAttributes);
      if (task.telemetryAttributes && task.telemetryAttributes.length > 0) {
        console.log('[TaskDialog] First attribute successCriteria:', task.telemetryAttributes[0].successCriteria, 'type:', typeof task.telemetryAttributes[0].successCriteria);
      } else {
        console.log('[TaskDialog] WARNING: No telemetry attributes found on task!');
      }
      setTelemetryAttributes(task.telemetryAttributes || []);
    } else {
      setName('');
      setDescription('');
      setEstMinutes(60);
      setWeight(Math.min(maxAllowedWeight, Math.max(0.01, remainingWeight)));
      setNotes('');
      setHowToDoc([]);
      setHowToVideo([]);
      setSelectedLicense('');
      setSelectedOutcomes([]);
      setSelectedReleases([]);
      setTelemetryAttributes([]);
    }
    setError('');
    setActiveTab(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, open]);

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
      // Filter out special "All" markers - they should not be sent to backend
      // If "All" is selected, send empty array (backend treats this as "applies to all")
      const filteredOutcomes = selectedOutcomes.filter(id => id !== ALL_OUTCOMES_ID);
      const filteredReleases = selectedReleases.filter(id => id !== ALL_RELEASES_ID);
      
      console.log('🚨 TaskDialog handleSave DEBUG:', {
        selectedOutcomes,
        selectedReleases,
        filteredOutcomes,
        filteredReleases,
        'will send outcomeIds': filteredOutcomes,
        'will send releaseIds': filteredReleases
      });
      
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        estMinutes: estMinutes,
        weight: weight,
        notes: notes.trim() || undefined,
        howToDoc: howToDoc.filter(link => link.trim()).length > 0 ? howToDoc.filter(link => link.trim()) : undefined,
        howToVideo: howToVideo.filter(link => link.trim()).length > 0 ? howToVideo.filter(link => link.trim()) : undefined,
        licenseId: selectedLicense || undefined,
        outcomeIds: filteredOutcomes,  // Send empty array [] if "All" selected, or array of IDs
        releaseIds: filteredReleases,   // Send empty array [] if "All" selected, or array of IDs
        telemetryAttributes: telemetryAttributes.length > 0 ? telemetryAttributes : undefined
      });
      console.log('[TaskDialog] Saving task with telemetry attributes:', telemetryAttributes);
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
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
          mt: 2
        },
        '& .MuiDialog-paper': {
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        borderBottom: '1px solid',
        borderColor: 'divider',
        fontWeight: 600,
        fontSize: '1.25rem'
      }}>
        Product Task: {title}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider', 
              mb: 2,
              minHeight: '40px',
              '& .MuiTab-root': {
                minHeight: '40px',
                py: 1
              }
            }}
          >
            <Tab label="Basic Info" />
            <Tab label="Telemetry" />
          </Tabs>

          {activeTab === 0 && (
            <>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {/* Task Name - Full Width */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  label="Task Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g., Implement user authentication"
                  size="small"
                />
              </Box>

              {/* Description - Full Width */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={2}
                  placeholder="Detailed description..."
                  size="small"
                />
              </Box>

              {/* Estimated Time */}
              <TextField
                fullWidth
                label="Est. Time (min)"
                type="number"
                value={estMinutes}
                onChange={(e) => setEstMinutes(parseInt(e.target.value) || 0)}
                size="small"
              />

              {/* Weight */}
              <TextField
                fullWidth
                label="Weight (%)"
                type="number"
                value={weight}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0.01;
                  setWeight(Math.min(maxAllowedWeight, Math.max(0.01, value)));
                }}
                inputProps={{ 
                  min: 0.01, 
                  max: maxAllowedWeight,
                  step: 0.01
                }}
                helperText={`Max: ${maxAllowedWeight.toFixed(2)}%`}
                size="small"
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Required License</InputLabel>
                <Select
                  value={selectedLicense}
                  onChange={(e) => setSelectedLicense(e.target.value)}
                  label="Required License"
                  renderValue={(selected) => {
                    if (!selected) return <em>No license required</em>;
                    const license = availableLicenses.find(l => l.id === selected);
                    return (
                      <Chip 
                        label={license ? `${license.name} (Level ${license.level})` : 'Unknown'}
                        color="primary"
                        size="small"
                      />
                    );
                  }}
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

            {/* Expected Outcomes */}
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Expected Outcomes</InputLabel>
                <Select
                multiple
                value={selectedOutcomes}
                onChange={(e) => {
                  const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                  
                  // Check if "All" was clicked
                  const allWasInPrevious = selectedOutcomes.includes(ALL_OUTCOMES_ID);
                  const allIsInNew = value.includes(ALL_OUTCOMES_ID);
                  
                  if (allIsInNew && !allWasInPrevious) {
                    // User just selected "All" - set only "All"
                    setSelectedOutcomes([ALL_OUTCOMES_ID]);
                  } else if (allWasInPrevious && !allIsInNew) {
                    // User deselected "All" - clear everything
                    setSelectedOutcomes([]);
                  } else if (allIsInNew && allWasInPrevious) {
                    // "All" was already selected, user clicked something else - remove "All" and set the new selection
                    setSelectedOutcomes(value.filter(v => v !== ALL_OUTCOMES_ID));
                  } else {
                    // Normal selection without "All"
                    setSelectedOutcomes(value);
                  }
                }}
                input={<OutlinedInput label="Expected Outcomes" />}
                renderValue={(selected) => {
                  if (selected.includes(ALL_OUTCOMES_ID)) {
                    return (
                      <Chip 
                        label="All Outcomes" 
                        size="small"
                        color="success"
                        sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                      />
                    );
                  }
                  return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const outcome = outcomes.find(o => o.id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={outcome?.name || value} 
                            size="small"
                            color="success"
                            sx={{ fontWeight: 600 }}
                          />
                        );
                      })}
                    </Box>
                  );
                }}
              >
                {/* "All" option at the top */}
                <MenuItem 
                  value={ALL_OUTCOMES_ID}
                  sx={{
                    backgroundColor: selectedOutcomes.includes(ALL_OUTCOMES_ID) ? '#e8f5e9' : 'transparent',
                    borderBottom: '2px solid #e0e0e0',
                    fontWeight: 700,
                    '&:hover': {
                      backgroundColor: selectedOutcomes.includes(ALL_OUTCOMES_ID) ? '#c8e6c9' : '#f5f5f5'
                    }
                  }}
                >
                  <Checkbox 
                    checked={selectedOutcomes.includes(ALL_OUTCOMES_ID)}
                    sx={{
                      color: selectedOutcomes.includes(ALL_OUTCOMES_ID) ? 'success.main' : 'default',
                      '&.Mui-checked': {
                        color: 'success.main',
                      }
                    }}
                  />
                  <ListItemText 
                    primary="All Outcomes"
                    secondary="Task applies to all outcomes"
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: 700,
                        color: selectedOutcomes.includes(ALL_OUTCOMES_ID) ? 'success.main' : 'text.primary'
                      },
                      '& .MuiListItemText-secondary': {
                        fontSize: '0.75rem'
                      }
                    }}
                  />
                </MenuItem>
                
                {/* Individual outcomes */}
                {[...outcomes]
                  .sort((a, b) => {
                    // Solution-level outcomes first, then product outcomes
                    if (a.solutionId && !b.solutionId) return -1;
                    if (!a.solutionId && b.solutionId) return 1;
                    // Within same type, sort by name
                    return a.name.localeCompare(b.name);
                  })
                  .map((outcome) => {
                  const isSelected = selectedOutcomes.includes(outcome.id);
                  const isSolutionLevel = !!(outcome as any).solutionId;
                  return (
                    <MenuItem 
                      key={outcome.id} 
                      value={outcome.id}
                      sx={{
                        backgroundColor: isSelected ? '#e8f5e9' : 'transparent',
                        '&:hover': {
                          backgroundColor: isSelected ? '#c8e6c9' : '#f5f5f5'
                        }
                      }}
                    >
                      <Checkbox 
                        checked={isSelected}
                        sx={{
                          color: isSelected ? 'success.main' : 'default',
                          '&.Mui-checked': {
                            color: 'success.main',
                          }
                        }}
                      />
                      <ListItemText 
                        primary={
                          <span>
                            {outcome.name}
                            {isSolutionLevel && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#7B1FA2' }}>🎯 Solution</span>}
                          </span>
                        }
                        sx={{
                          '& .MuiListItemText-primary': {
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelected ? 'success.main' : 'text.primary'
                          }
                        }}
                      />
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>

          {/* Releases Selection */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Releases</InputLabel>
            <Select
              multiple
              value={selectedReleases}
              onChange={(e) => {
                const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                
                // Check if "All" was clicked
                const allWasInPrevious = selectedReleases.includes(ALL_RELEASES_ID);
                const allIsInNew = value.includes(ALL_RELEASES_ID);
                
                if (allIsInNew && !allWasInPrevious) {
                  // User just selected "All" - set only "All"
                  setSelectedReleases([ALL_RELEASES_ID]);
                } else if (allWasInPrevious && !allIsInNew) {
                  // User deselected "All" - clear everything
                  setSelectedReleases([]);
                } else if (allIsInNew && allWasInPrevious) {
                  // "All" was already selected, user clicked something else - remove "All" and set the new selection
                  setSelectedReleases(value.filter(v => v !== ALL_RELEASES_ID));
                } else {
                  // Normal selection without "All"
                  setSelectedReleases(value);
                }
              }}
              input={<OutlinedInput label="Releases" />}
              renderValue={(selected) => {
                if (selected.includes(ALL_RELEASES_ID)) {
                  return (
                    <Chip 
                      label="All Releases" 
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                    />
                  );
                }
                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const release = availableReleases.find(r => r.id === value);
                      return (
                        <Chip 
                          key={value} 
                          label={release ? `${release.name} (v${release.level})` : value} 
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                      );
                    })}
                  </Box>
                );
              }}
              disabled={availableReleases?.length === 0}
            >
              {availableReleases?.length > 0 ? [
                  /* "All" option at the top */
                  <MenuItem 
                    key="all-releases"
                    value={ALL_RELEASES_ID}
                    sx={{
                      backgroundColor: selectedReleases.includes(ALL_RELEASES_ID) ? '#e3f2fd' : 'transparent',
                      borderBottom: '2px solid #e0e0e0',
                      fontWeight: 700,
                      '&:hover': {
                        backgroundColor: selectedReleases.includes(ALL_RELEASES_ID) ? '#bbdefb' : '#f5f5f5'
                      }
                    }}
                  >
                    <Checkbox 
                      checked={selectedReleases.includes(ALL_RELEASES_ID)}
                      sx={{
                        color: selectedReleases.includes(ALL_RELEASES_ID) ? 'primary.main' : 'default',
                        '&.Mui-checked': {
                          color: 'primary.main',
                        }
                      }}
                    />
                    <ListItemText 
                      primary="All Releases"
                      secondary="Task applies to all releases"
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontWeight: 700,
                          color: selectedReleases.includes(ALL_RELEASES_ID) ? 'primary.main' : 'text.primary'
                        },
                        '& .MuiListItemText-secondary': {
                          fontSize: '0.75rem'
                        }
                      }}
                    />
                  </MenuItem>,
                  
                  /* Individual releases - sort solution-level first */
                  ...[...availableReleases]
                    .sort((a, b) => {
                      // Solution-level releases first, then product releases
                      if (a.solutionId && !b.solutionId) return -1;
                      if (!a.solutionId && b.solutionId) return 1;
                      // Within same type, sort by level
                      return a.level - b.level;
                    })
                    .map((release) => {
                      const isSelected = release.id ? selectedReleases.includes(release.id) : false;
                      const isSolutionLevel = !!(release as any).solutionId;
                      return (
                        <MenuItem 
                          key={release.id} 
                          value={release.id}
                          sx={{
                            backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                            '&:hover': {
                              backgroundColor: isSelected ? '#bbdefb' : '#f5f5f5'
                            }
                          }}
                        >
                          <Checkbox 
                            checked={isSelected}
                            sx={{
                              color: isSelected ? 'primary.main' : 'default',
                              '&.Mui-checked': {
                                color: 'primary.main',
                              }
                            }}
                          />
                          <ListItemText 
                            primary={
                              <span>
                                {`${release.name} (v${release.level})`}
                                {isSolutionLevel && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#7B1FA2' }}>🎯 Solution</span>}
                              </span>
                            }
                            sx={{
                              '& .MuiListItemText-primary': {
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? 'primary.main' : 'text.primary'
                              }
                            }}
                          />
                        </MenuItem>
                      );
                    })
              ] : (
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
            </>
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