import * as React from 'react';
import { useState, useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Chip,
  LinearProgress,
  Alert,
  Divider,
} from '@mui/material';
import { CheckCircle, HourglassEmpty, NotStarted, Block } from '@mui/icons-material';

const UPDATE_TASK_STATUS = gql`
  mutation UpdateCustomerTaskStatus($taskId: ID!, $status: CustomerTaskStatus!, $notes: String) {
    updateCustomerTaskStatus(taskId: $taskId, status: $status, notes: $notes) {
      id
      status
      statusUpdatedAt
      statusUpdatedBy
      statusNotes
      isComplete
      completedAt
    }
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  task: any;
  onUpdated: () => void;
}

export const UpdateTaskStatusDialog: React.FC<Props> = ({ open, onClose, task, onUpdated }) => {
  const [status, setStatus] = useState(task.status || 'NOT_STARTED');
  const [notes, setNotes] = useState(task.statusNotes || '');

  useEffect(() => {
    if (open && task) {
      setStatus(task.status || 'NOT_STARTED');
      setNotes(task.statusNotes || '');
    }
  }, [open, task]);

  const [updateStatus, { loading }] = useMutation(UPDATE_TASK_STATUS, {
    onCompleted: () => {
      onUpdated();
    },
  });

  const handleSubmit = async () => {
    try {
      await updateStatus({
        variables: {
          taskId: task.id,
          status,
          notes: notes.trim() || null,
        },
      });
      onClose();
    } catch (error: any) {
      alert(`Error updating task status: ${error.message}`);
    }
  };

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case 'DONE':
        return <CheckCircle fontSize="small" color="success" />;
      case 'IN_PROGRESS':
        return <HourglassEmpty fontSize="small" color="primary" />;
      case 'NOT_STARTED':
        return <NotStarted fontSize="small" color="disabled" />;
      case 'NOT_APPLICABLE':
        return <Block fontSize="small" color="action" />;
      default:
        return null;
    }
  };

  const telemetry = task.telemetryProgress;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Update Task Status</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {task.name}
          </Typography>
          {task.description && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {task.description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip label={`Sequence: ${task.sequenceNumber}`} size="small" variant="outlined" />
            <Chip label={`Weight: ${task.weight}`} size="small" variant="outlined" />
            <Chip label={`Est: ${task.estMinutes} min`} size="small" variant="outlined" />
            {task.priority && <Chip label={task.priority} size="small" variant="outlined" />}
            {task.licenseLevel && <Chip label={task.licenseLevel} size="small" color="primary" />}
          </Box>
        </Box>

        {/* Current Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Current Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon(task.status)}
            <Chip label={task.status?.replace(/_/g, ' ')} color="default" />
          </Box>
          {task.statusUpdatedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Updated: {new Date(task.statusUpdatedAt).toLocaleString()}
              {task.statusUpdatedBy && ` by ${task.statusUpdatedBy}`}
            </Typography>
          )}
          {task.statusNotes && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Note: {task.statusNotes}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Telemetry Progress */}
        {telemetry.totalAttributes > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Telemetry Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={telemetry.completionPercentage}
                sx={{ flex: 1, height: 8, borderRadius: 1 }}
              />
              <Typography variant="body2">
                {telemetry.completionPercentage.toFixed(0)}%
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                Total: {telemetry.metAttributes}/{telemetry.totalAttributes}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Required: {telemetry.metRequiredAttributes}/{telemetry.requiredAttributes}
              </Typography>
              {telemetry.allRequiredMet && (
                <Chip label="✓ All Required Met" color="success" size="small" />
              )}
            </Box>
            {!telemetry.allRequiredMet && telemetry.requiredAttributes > 0 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Some required telemetry criteria are not met yet.
              </Alert>
            )}
          </Box>
        )}

        {/* Outcomes */}
        {task.outcomes && task.outcomes.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Outcomes
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {task.outcomes.map((outcome: any) => (
                <Chip key={outcome.id} label={outcome.name} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* New Status Selection */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
          <FormLabel component="legend">New Status</FormLabel>
          <RadioGroup value={status} onChange={(e) => setStatus(e.target.value)}>
            <FormControlLabel
              value="NOT_STARTED"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon('NOT_STARTED')}
                  <Typography>Not Started</Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="IN_PROGRESS"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon('IN_PROGRESS')}
                  <Typography>In Progress</Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="DONE"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon('DONE')}
                  <Typography>Done</Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="NOT_APPLICABLE"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon('NOT_APPLICABLE')}
                  <Typography>Not Applicable</Typography>
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>

        {/* Notes */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Status Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this status update..."
          helperText="These notes will be visible in the task history"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || status === task.status}
        >
          {loading ? 'Updating...' : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
