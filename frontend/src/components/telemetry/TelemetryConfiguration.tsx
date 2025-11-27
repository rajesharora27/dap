import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

// Types for telemetry configuration
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

interface TelemetryConfigurationProps {
  taskId?: string;
  attributes: TelemetryAttribute[];
  onChange: (attributes: TelemetryAttribute[]) => void;
  disabled?: boolean;
}

const TelemetryConfiguration: React.FC<TelemetryConfigurationProps> = ({
  taskId,
  attributes,
  onChange,
  disabled = false
}) => {
  const [expandedAttribute, setExpandedAttribute] = useState<string | false>(false);
  const [showCriteriaBuilder, setShowCriteriaBuilder] = useState<string | null>(null);

  const dataTypeOptions = [
    { value: 'BOOLEAN', label: 'Boolean (true/false)' },
    { value: 'NUMBER', label: 'Number' },
    { value: 'STRING', label: 'String (text)' },
    { value: 'TIMESTAMP', label: 'Timestamp' }
  ];

  const addAttribute = () => {
    const newAttribute: TelemetryAttribute = {
      name: '',
      description: '',
      dataType: 'BOOLEAN',
      isRequired: false,
      order: attributes.length + 1
    };
    onChange([...attributes, newAttribute]);
  };

  const updateAttribute = (index: number, updates: Partial<TelemetryAttribute>) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[index] = { ...updatedAttributes[index], ...updates };
    onChange(updatedAttributes);
  };

  const removeAttribute = (index: number) => {
    const updatedAttributes = attributes.filter((_, i) => i !== index);
    // Reorder remaining attributes
    const reorderedAttributes = updatedAttributes.map((attr, i) => ({
      ...attr,
      order: i + 1
    }));
    onChange(reorderedAttributes);
  };

  const buildSimpleCriteria = (dataType: string, operator: string, value: string) => {
    switch (dataType) {
      case 'BOOLEAN':
        return {
          type: 'boolean_flag',
          expectedValue: value === 'true',
          description: `Task succeeds when value is ${value}`
        };
      case 'NUMBER':
        return {
          type: 'number_threshold',
          operator: operator || 'greater_than_or_equal',
          threshold: parseFloat(value) || 0,
          description: `Task succeeds when value is ${operator || 'greater_than_or_equal'} ${value}`
        };
      case 'STRING':
        if (operator === 'not_null') {
          return {
            type: 'string_not_null',
            description: 'Task succeeds when value is not null/empty'
          };
        } else {
          return {
            type: 'string_match',
            mode: operator || 'exact',
            pattern: value,
            caseSensitive: false,
            description: operator === 'exact'
              ? `Task succeeds when value exactly matches "${value}"`
              : `Task succeeds when value contains "${value}"`
          };
        }
      case 'TIMESTAMP':
        if (operator === 'not_null') {
          return {
            type: 'timestamp_not_null',
            description: 'Task succeeds when timestamp is not null'
          };
        } else {
          return {
            type: 'timestamp_comparison',
            mode: 'within_days',
            referenceTime: 'now',
            withinDays: parseInt(value) || 7,
            description: `Task succeeds when timestamp is within ${value} days of now`
          };
        }
      default:
        return null;
    }
  };

  const SimpleCriteriaBuilder = ({
    attribute,
    index,
    onSave
  }: {
    attribute: TelemetryAttribute;
    index: number;
    onSave: () => void;
  }) => {
    // Initialize from existing criteria if present
    const getInitialOperator = () => {
      console.log('[getInitialOperator] attribute:', attribute.name, 'successCriteria:', attribute.successCriteria, 'type:', typeof attribute.successCriteria);
      if (!attribute.successCriteria) {
        return attribute.dataType === 'NUMBER' ? 'greater_than_or_equal' :
          attribute.dataType === 'STRING' ? 'exact' :
            attribute.dataType === 'TIMESTAMP' ? 'within_days' : '';
      }
      // Check if successCriteria is a string (needs parsing)
      let criteria = attribute.successCriteria;
      if (typeof criteria === 'string') {
        console.log('[getInitialOperator] WARNING: successCriteria is a string, attempting to parse:', criteria);
        try {
          criteria = JSON.parse(criteria);
        } catch (e) {
          console.error('[getInitialOperator] Failed to parse successCriteria:', e);
          return '';
        }
      }
      console.log('[getInitialOperator] parsed criteria:', criteria);

      // Handle legacy simple format: { operator: ">=", value: 10 }
      if (criteria.operator && !criteria.type) {
        console.log('[getInitialOperator] Legacy format detected, operator:', criteria.operator);
        // Map legacy operators to new format
        const operatorMap: Record<string, string> = {
          '>=': 'greater_than_or_equal',
          '>': 'greater_than',
          '<=': 'less_than_or_equal',
          '<': 'less_than',
          '==': 'equals',
          '!=': 'not_equals',
          'contains': 'contains',
          'exact': 'exact'
        };
        return operatorMap[criteria.operator] || criteria.operator;
      }

      // Handle new structured format
      if (criteria.type === 'string_not_null' || criteria.type === 'timestamp_not_null') {
        return 'not_null';
      }
      if (criteria.type === 'number_threshold') {
        return criteria.operator || 'greater_than_or_equal';
      }
      if (criteria.type === 'string_match') {
        return criteria.mode || 'exact';
      }
      if (criteria.type === 'timestamp_comparison') {
        return 'within_days';
      }
      return '';
    };

    const getInitialValue = () => {
      if (!attribute.successCriteria) return '';
      // Check if successCriteria is a string (needs parsing)
      let criteria = attribute.successCriteria;
      if (typeof criteria === 'string') {
        console.log('[getInitialValue] WARNING: successCriteria is a string, attempting to parse:', criteria);
        try {
          criteria = JSON.parse(criteria);
        } catch (e) {
          console.error('[getInitialValue] Failed to parse successCriteria:', e);
          return '';
        }
      }

      // Handle legacy simple format: { operator: ">=", value: 10 }
      if (criteria.value !== undefined && !criteria.type) {
        console.log('[getInitialValue] Legacy format detected, value:', criteria.value);
        return String(criteria.value);
      }

      // Handle new structured format
      if (criteria.type === 'boolean_flag') {
        return String(criteria.expectedValue);
      }
      if (criteria.type === 'number_threshold') {
        return String(criteria.threshold || '');
      }
      if (criteria.type === 'string_match') {
        return criteria.pattern || '';
      }
      if (criteria.type === 'timestamp_comparison') {
        return String(criteria.withinDays || '');
      }
      return '';
    };

    const [operator, setOperator] = useState(getInitialOperator());
    const [value, setValue] = useState(getInitialValue());
    const [lastSavedCriteria, setLastSavedCriteria] = useState<string>('');
    const [isInitializing, setIsInitializing] = useState(true);

    // Update states when attribute changes (e.g., when reopening dialog with existing data)
    useEffect(() => {
      const newOperator = getInitialOperator();
      const newValue = getInitialValue();
      
      console.log('[SimpleCriteriaBuilder] Initialization useEffect', {
        attributeName: attribute.name,
        successCriteria: attribute.successCriteria,
        dataType: attribute.dataType,
        currentOperator: operator,
        currentValue: value,
        newOperator,
        newValue
      });
      
      // Only update if values have actually changed to prevent unnecessary re-renders
      if (operator !== newOperator) {
        console.log('[SimpleCriteriaBuilder] Updating operator:', newOperator);
        setOperator(newOperator);
      }
      if (value !== newValue) {
        console.log('[SimpleCriteriaBuilder] Updating value:', newValue);
        setValue(newValue);
      }
      
      // Store the current criteria to compare against later
      const criteriaString = JSON.stringify(attribute.successCriteria || null);
      if (lastSavedCriteria !== criteriaString) {
        console.log('[SimpleCriteriaBuilder] Updating lastSavedCriteria');
        setLastSavedCriteria(criteriaString);
      }
      
      setIsInitializing(false); // Mark initialization as complete
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attribute.id, attribute.dataType, JSON.stringify(attribute.successCriteria)]); // Trigger when criteria object changes

    // Auto-save criteria when operator or value changes
    useEffect(() => {
      console.log('[SimpleCriteriaBuilder] useEffect triggered', {
        attributeName: attribute.name,
        dataType: attribute.dataType,
        isInitializing,
        operator,
        value,
        hasSuccessCriteria: !!attribute.successCriteria
      });

      // Skip auto-save during initialization or on initial render
      if (isInitializing) {
        console.log('[SimpleCriteriaBuilder] Skipping - still initializing');
        return;
      }

      // For BOOLEAN type, we don't use operator - the value itself is the selection
      // For other types, we need an operator to be set
      if (attribute.dataType !== 'BOOLEAN' && !operator) {
        console.log('[SimpleCriteriaBuilder] Skipping - non-BOOLEAN type with no operator');
        return;
      }

      let criteria = null;

      // For operators that don't need a value, auto-save immediately
      if (operator === 'not_null' || attribute.dataType === 'BOOLEAN') {
        // For BOOLEAN, only save if a value is selected
        if (attribute.dataType === 'BOOLEAN' && !value) {
          console.log('[SimpleCriteriaBuilder] Skipping BOOLEAN - no value selected yet');
          return;
        }
        console.log('[SimpleCriteriaBuilder] Building criteria for BOOLEAN/not_null', { operator, value });
        criteria = buildSimpleCriteria(attribute.dataType, operator, value);
      } else if (value.trim()) {
        // For operators that need a value, only auto-save if value is provided
        console.log('[SimpleCriteriaBuilder] Building criteria with value', { operator, value });
        criteria = buildSimpleCriteria(attribute.dataType, operator, value);
      }

      // Only update if criteria has actually changed (prevents infinite loop)
      const newCriteriaString = JSON.stringify(criteria);
      console.log('[SimpleCriteriaBuilder] Criteria comparison', {
        newCriteriaString,
        lastSavedCriteria,
        willSave: criteria && newCriteriaString !== lastSavedCriteria
      });

      if (criteria && newCriteriaString !== lastSavedCriteria) {
        console.log('[SimpleCriteriaBuilder] ✅ Auto-saving criteria:', { operator, value, criteria });
        setLastSavedCriteria(newCriteriaString);
        updateAttribute(index, { successCriteria: criteria });
      } else if (!criteria) {
        console.log('[SimpleCriteriaBuilder] ❌ No criteria to save');
      } else {
        console.log('[SimpleCriteriaBuilder] ⏭️ Criteria unchanged, skipping save');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [operator, value]); // Only trigger when user changes operator or value

    const getOperatorOptions = () => {
      switch (attribute.dataType) {
        case 'NUMBER':
          return [
            { value: 'greater_than', label: 'Greater than' },
            { value: 'greater_than_or_equal', label: 'Greater than or equal' },
            { value: 'less_than', label: 'Less than' },
            { value: 'less_than_or_equal', label: 'Less than or equal' },
            { value: 'equals', label: 'Equals' }
          ];
        case 'BOOLEAN':
          return [
            { value: 'true', label: 'Must be true' },
            { value: 'false', label: 'Must be false' }
          ];
        case 'STRING':
          return [
            { value: 'not_null', label: 'Not null/empty' },
            { value: 'exact', label: 'Exact match' },
            { value: 'contains', label: 'Contains' }
          ];
        case 'TIMESTAMP':
          return [
            { value: 'not_null', label: 'Not null' },
            { value: 'within_days', label: 'Within N days of now' }
          ];
        default:
          return [];
      }
    };

    return (
      <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Success Criteria for {attribute.name}
        </Typography>

        {attribute.dataType === 'BOOLEAN' ? (
          <FormControl fullWidth margin="normal">
            <InputLabel>Expected Value</InputLabel>
            <Select value={value} onChange={(e) => setValue(e.target.value)}>
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </Select>
          </FormControl>
        ) : attribute.dataType === 'NUMBER' ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Operator</InputLabel>
              <Select value={operator} onChange={(e) => setOperator(e.target.value)}>
                {getOperatorOptions().map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Threshold Value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Box>
        ) : attribute.dataType === 'STRING' ? (
          <Box>
            <FormControl fullWidth margin="normal">
              <InputLabel>Validation Type</InputLabel>
              <Select value={operator} onChange={(e) => setOperator(e.target.value)}>
                {getOperatorOptions().map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {operator !== 'not_null' && (
              <TextField
                fullWidth
                label="Expected Text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g., PASSED, SUCCESS, completed"
                margin="normal"
              />
            )}
          </Box>
        ) : attribute.dataType === 'TIMESTAMP' ? (
          <Box>
            <FormControl fullWidth margin="normal">
              <InputLabel>Validation Type</InputLabel>
              <Select value={operator} onChange={(e) => setOperator(e.target.value)}>
                {getOperatorOptions().map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {operator !== 'not_null' && (
              <TextField
                fullWidth
                label="Days (for freshness check)"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g., 7 (must be updated within 7 days)"
                margin="normal"
              />
            )}
          </Box>
        ) : null}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            ✓ Changes are saved automatically
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={onSave}
          >
            Close
          </Button>
        </Box>
      </Box>
    );
  };

  if (attributes.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Telemetry Configuration
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Add telemetry attributes to track task completion status automatically.
          You can configure success criteria that determine when a task is considered complete.
        </Alert>
        <Button
          startIcon={<AddIcon />}
          onClick={addAttribute}
          variant="outlined"
          disabled={disabled}
        >
          Add Telemetry Attribute
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Telemetry Configuration ({attributes.length})
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={addAttribute}
          variant="outlined"
          size="small"
          disabled={disabled}
        >
          Add Attribute
        </Button>
      </Box>

      {attributes.map((attribute, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Attribute Name"
                  value={attribute.name}
                  onChange={(e) => updateAttribute(index, { name: e.target.value })}
                  margin="normal"
                  placeholder="e.g., Deployment Status, Performance Score"
                  disabled={disabled}
                />

                <TextField
                  fullWidth
                  label="Description"
                  value={attribute.description}
                  onChange={(e) => updateAttribute(index, { description: e.target.value })}
                  margin="normal"
                  multiline
                  rows={2}
                  placeholder="What does this attribute measure?"
                  disabled={disabled}
                />

                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Data Type</InputLabel>
                    <Select
                      value={attribute.dataType}
                      onChange={(e) => updateAttribute(index, { dataType: e.target.value as any })}
                      disabled={disabled}
                    >
                      {dataTypeOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={attribute.isRequired}
                        onChange={(e) => updateAttribute(index, { isRequired: e.target.checked })}
                        disabled={disabled}
                      />
                    }
                    label="Required"
                  />
                </Box>

                {/* Success Criteria Configuration */}
                {attribute.successCriteria ? (
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Success criteria configured"
                      color="success"
                      variant="outlined"
                      onDelete={disabled ? undefined : () => updateAttribute(index, { successCriteria: undefined })}
                    />
                    {!disabled && (
                      <Button
                        size="small"
                        sx={{ ml: 1 }}
                        onClick={() => setShowCriteriaBuilder(showCriteriaBuilder === String(index) ? null : String(index))}
                      >
                        Edit Criteria
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setShowCriteriaBuilder(String(index))}
                      disabled={disabled || !attribute.name || !attribute.dataType}
                    >
                      Configure Success Criteria
                    </Button>
                  </Box>
                )}

                {showCriteriaBuilder === String(index) && (
                  <SimpleCriteriaBuilder
                    attribute={attribute}
                    index={index}
                    onSave={() => setShowCriteriaBuilder(null)}
                  />
                )}

                {/* Show current value if available */}
                {attribute.currentValue && (
                  <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Current Value: <strong>{attribute.currentValue.value}</strong>
                      {attribute.isSuccessful !== undefined && (
                        <Chip
                          icon={attribute.isSuccessful ? <CheckCircleIcon /> : <ErrorIcon />}
                          label={attribute.isSuccessful ? 'Passing' : 'Failing'}
                          color={attribute.isSuccessful ? 'success' : 'error'}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    {attribute.currentValue.notes && (
                      <Typography variant="caption" display="block">
                        {attribute.currentValue.notes}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              {!disabled && (
                <IconButton
                  onClick={() => removeAttribute(index)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default TelemetryConfiguration;