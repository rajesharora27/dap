import * as React from 'react';
import { useState, useEffect } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Delete, CheckCircle, Cancel } from '@shared/components/FAIcon';

const GET_TASK_TELEMETRY = gql`
  query TaskTelemetry($customerTaskId: ID!) {
    customerTask(id: $customerTaskId) {
      id
      name
      description
      sequenceNumber
      status
      telemetryAttributes {
        id
        name
        attributeType
        isRequired
        isActive
        successCriteria
        latestValue {
          id
          value
          createdAt
        }
        values {
          id
          value
          notes
          createdAt
        }
      }
    }
  }
`;

const ADD_TELEMETRY_VALUE = gql`
  mutation AddCustomerTelemetryValue($input: AddCustomerTelemetryValueInput!) {
    addCustomerTelemetryValue(input: $input) {
      id
      value
      createdAt
    }
  }
`;

const EVALUATE_TASK_TELEMETRY = gql`
  mutation EvaluateTaskTelemetry($customerTaskId: ID!) {
    evaluateTaskTelemetry(customerTaskId: $customerTaskId) {
      id
      status
      telemetryProgress {
        totalAttributes
        metAttributes
        completionPercentage
        allRequiredMet
      }
    }
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  customerTaskId: string | null;
  onUpdated?: () => void;
}

export const CustomerTelemetryDialog: React.FC<Props> = ({
  open,
  onClose,
  customerTaskId,
  onUpdated,
}) => {
  const [selectedAttributeId, setSelectedAttributeId] = useState<string>('');
  const [telemetryValue, setTelemetryValue] = useState<string>('');
  const [telemetryNotes, setTelemetryNotes] = useState<string>('');

  const { data, loading, refetch } = useQuery(GET_TASK_TELEMETRY, {
    variables: { customerTaskId },
    skip: !customerTaskId || !open,
    fetchPolicy: 'cache-and-network',
  });

  const [addValue, { loading: adding }] = useMutation(ADD_TELEMETRY_VALUE, {
    onCompleted: () => {
      refetch();
      setTelemetryValue('');
      setTelemetryNotes('');
      if (onUpdated) onUpdated();
    },
  });

  const [evaluateTelemetry, { loading: evaluating }] = useMutation(EVALUATE_TASK_TELEMETRY, {
    onCompleted: () => {
      refetch();
      if (onUpdated) onUpdated();
    },
  });

  const task = data?.customerTask;
  const attributes = task?.telemetryAttributes || [];
  const selectedAttribute = attributes.find((a: any) => a.id === selectedAttributeId);

  useEffect(() => {
    if (attributes.length > 0 && !selectedAttributeId) {
      setSelectedAttributeId(attributes[0].id);
    }
  }, [attributes, selectedAttributeId]);

  const handleAddValue = async () => {
    if (!selectedAttributeId || !telemetryValue.trim()) return;

    let parsedValue: any;
    try {
      // Try to parse as JSON first
      parsedValue = JSON.parse(telemetryValue);
    } catch {
      // If not valid JSON, use as string
      parsedValue = telemetryValue;
    }

    try {
      await addValue({
        variables: {
          input: {
            customerAttributeId: selectedAttributeId,
            value: parsedValue,
            notes: telemetryNotes.trim() || undefined,
            batchId: `manual_${Date.now()}`,
          },
        },
      });
    } catch (error: any) {
      alert(`Error adding telemetry value: ${error.message}`);
    }
  };

  const handleEvaluate = async () => {
    if (!customerTaskId) return;
    try {
      await evaluateTelemetry({ variables: { customerTaskId } });
    } catch (error: any) {
      alert(`Error evaluating telemetry: ${error.message}`);
    }
  };

  const evaluateCriteria = (criteria: any, value: any): boolean | null => {
    if (!criteria) return null;
    try {
      // Simple evaluation logic - extend as needed
      if (typeof criteria === 'object' && criteria.operator) {
        const { operator, value: criteriaValue } = criteria;
        switch (operator) {
          case 'EQ':
            return value === criteriaValue;
          case 'GT':
            return Number(value) > Number(criteriaValue);
          case 'GTE':
            return Number(value) >= Number(criteriaValue);
          case 'LT':
            return Number(value) < Number(criteriaValue);
          case 'LTE':
            return Number(value) <= Number(criteriaValue);
          case 'CONTAINS':
            return String(value).includes(String(criteriaValue));
          default:
            return null;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Manage Telemetry</Typography>
            {task && (
              <Typography variant="caption" color="text.secondary">
                Task #{task.sequenceNumber}: {task.name}
              </Typography>
            )}
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={handleEvaluate}
            disabled={evaluating || !task}
          >
            {evaluating ? 'Evaluating...' : 'Evaluate Criteria'}
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <LinearProgress />
        ) : !task ? (
          <Alert severity="error">Task not found</Alert>
        ) : attributes.length === 0 ? (
          <Alert severity="info">
            This task has no telemetry attributes defined. Telemetry attributes are copied from the
            product task when the adoption plan is created.
          </Alert>
        ) : (
          <>
            {/* Attribute Selector */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Telemetry Attribute</InputLabel>
              <Select
                value={selectedAttributeId}
                onChange={(e) => setSelectedAttributeId(e.target.value)}
                label="Telemetry Attribute"
              >
                {attributes.map((attr: any) => (
                  <MenuItem key={attr.id} value={attr.id}>
                    {attr.name} {attr.isRequired && '(Required)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Selected Attribute Details */}
            {selectedAttribute && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={selectedAttribute.attributeType} size="small" />
                  {selectedAttribute.isRequired && (
                    <Chip label="Required" color="primary" size="small" />
                  )}
                  {selectedAttribute.latestValue && (
                    <>
                      {evaluateCriteria(
                        selectedAttribute.successCriteria,
                        selectedAttribute.latestValue.value
                      ) === true && <Chip label="Criteria Met" color="success" size="small" icon={<CheckCircle />} />}
                      {evaluateCriteria(
                        selectedAttribute.successCriteria,
                        selectedAttribute.latestValue.value
                      ) === false && <Chip label="Criteria Not Met" color="error" size="small" icon={<Cancel />} />}
                    </>
                  )}
                </Box>

                {selectedAttribute.successCriteria && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="caption">Success Criteria:</Typography>
                    <Typography variant="body2">
                      {JSON.stringify(selectedAttribute.successCriteria, null, 2)}
                    </Typography>
                  </Alert>
                )}

                {/* Add New Value Form */}
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Add New Value
                  </Typography>
                  <TextField
                    fullWidth
                    label="Value"
                    value={telemetryValue}
                    onChange={(e) => setTelemetryValue(e.target.value)}
                    placeholder='Enter value (e.g., 42 or {"key": "value"})'
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="Notes (optional)"
                    value={telemetryNotes}
                    onChange={(e) => setTelemetryNotes(e.target.value)}
                    placeholder="Add any notes about this telemetry entry..."
                    multiline
                    rows={2}
                    sx={{ mb: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddValue}
                    disabled={adding || !telemetryValue.trim()}
                    startIcon={<Add />}
                    fullWidth
                  >
                    {adding ? 'Adding...' : 'Add Value'}
                  </Button>
                </Box>

                {/* Historical Values */}
                {selectedAttribute.values && selectedAttribute.values.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Historical Values ({selectedAttribute.values.length})
                    </Typography>
                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {selectedAttribute.values.map((val: any, index: number) => (
                        <React.Fragment key={val.id}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" component="span">
                                    {typeof val.value === 'object'
                                      ? JSON.stringify(val.value)
                                      : String(val.value)}
                                  </Typography>
                                  {index === 0 && (
                                    <Chip label="Latest" color="primary" size="small" />
                                  )}
                                </Box>
                              }
                              secondary={
                                <>
                                  {new Date(val.createdAt).toLocaleString()}
                                  {val.notes && ` • ${val.notes}`}
                                </>
                              }
                            />
                          </ListItem>
                          {index < selectedAttribute.values.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
