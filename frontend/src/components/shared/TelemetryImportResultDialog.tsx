/**
 * Shared Telemetry Import Result Dialog
 * Used by both Products and Solutions tabs for consistent UI
 */
import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
} from '@mui/material';
import { ImportResultDialogState } from '../../utils/telemetryOperations';

interface TelemetryImportResultDialogProps {
  state: ImportResultDialogState;
  onClose: () => void;
}

export const TelemetryImportResultDialog: React.FC<TelemetryImportResultDialogProps> = ({
  state,
  onClose,
}) => {
  return (
    <Dialog
      open={state.open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {state.success ? '✅ Telemetry Import Successful' : '❌ Telemetry Import Failed'}
      </DialogTitle>
      <DialogContent>
        {state.success && state.summary && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Summary Card */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  📊 Import Summary
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Tasks Processed</Typography>
                    <Typography variant="h6">{state.summary.tasksProcessed}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Attributes Updated</Typography>
                    <Typography variant="h6">{state.summary.attributesUpdated}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Criteria Evaluated</Typography>
                    <Typography variant="h6">{state.summary.criteriaEvaluated}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Criteria Met</Typography>
                    <Typography variant="h6" color="success.main">
                      {state.taskResults?.reduce((sum, task) => sum + task.criteriaMet, 0) || 0}
                      /{state.summary.criteriaEvaluated}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Task Results */}
            {state.taskResults && state.taskResults.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    📋 Task Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {state.taskResults.map((task, index) => (
                      <Box 
                        key={index}
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 1.5,
                          bgcolor: 'grey.50',
                          borderRadius: 1
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {task.taskName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {task.criteriaMet}/{task.criteriaTotal} criteria met
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={`${task.completionPercentage}%`}
                            size="small"
                            color={task.completionPercentage === 100 ? 'success' : task.completionPercentage > 0 ? 'info' : 'default'}
                          />
                          {task.completionPercentage === 100 && <span>✓</span>}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Warnings/Errors */}
            {state.summary.errors && state.summary.errors.length > 0 && (
              <Alert severity="warning">
                <Typography variant="subtitle2" gutterBottom>⚠️ Warnings:</Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {state.summary.errors.map((error, index) => (
                    <li key={index}>
                      <Typography variant="body2">{error}</Typography>
                    </li>
                  ))}
                </Box>
              </Alert>
            )}

            <Alert severity="info" icon={false}>
              <Typography variant="body2">
                🔄 Task statuses have been automatically evaluated and updated based on telemetry criteria.
              </Typography>
            </Alert>
          </Box>
        )}

        {!state.success && (
          <Box sx={{ mt: 1 }}>
            <Alert severity="error">
              <Typography variant="body2">
                {state.errorMessage || 'Import failed. Please check the file format and try again.'}
              </Typography>
            </Alert>
            {state.summary?.errors && state.summary.errors.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Errors:</Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {state.summary.errors.map((error, index) => (
                    <li key={index}>
                      <Typography variant="body2">{error}</Typography>
                    </li>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          variant="contained"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

