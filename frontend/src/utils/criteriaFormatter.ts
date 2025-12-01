/**
 * Shared utility for formatting success criteria display
 * Used consistently across Products and Solutions tabs
 */

const operatorMap: Record<string, string> = {
  'greater_than': '>',
  'greater_than_or_equal': '>=',
  'less_than': '<',
  'less_than_or_equal': '<=',
  'equals': '=',
  'not_equals': '!=',
  'GREATER_THAN': '>',
  'GREATER_THAN_OR_EQUAL': '>=',
  'LESS_THAN': '<',
  'LESS_THAN_OR_EQUAL': '<=',
  'EQUALS': '=',
  'NOT_EQUALS': '!=',
};

/**
 * Formats success criteria for display
 * Handles all criteria types consistently
 */
export function formatSuccessCriteria(successCriteria: any): string {
  if (!successCriteria) {
    return 'No criteria defined';
  }

  try {
    // Handle both string (needs parsing) and object (already parsed) formats
    let parsed: any;
    if (typeof successCriteria === 'string') {
      parsed = JSON.parse(successCriteria);
    } else if (typeof successCriteria === 'object') {
      parsed = successCriteria;
    } else {
      return 'No criteria defined';
    }
    
    // Debug log for troubleshooting
    // console.log('Parsing criteria:', parsed);

    // Handle different criteria types
    if (parsed.type === 'boolean_flag') {
      return `Must be ${parsed.expectedValue ? 'TRUE' : 'FALSE'}`;
    }
    
    if (parsed.type === 'number_threshold') {
      const op = operatorMap[parsed.operator] || parsed.operator;
      return `${op} ${parsed.threshold}`;
    }
    
    if (parsed.type === 'string_match') {
      if (parsed.mode === 'exact') {
        return `= "${parsed.pattern}"`;
      } else if (parsed.mode === 'contains') {
        return `Contains "${parsed.pattern}"`;
      } else if (parsed.mode === 'regex') {
        return `Matches /${parsed.pattern}/`;
      }
      return `Match: "${parsed.pattern}"`;
    }
    
    if (parsed.type === 'string_not_null' || parsed.type === 'timestamp_not_null') {
      return 'Not null/empty';
    }
    
    if (parsed.type === 'timestamp_comparison') {
      if (parsed.mode === 'within_days' && parsed.withinDays) {
        return `Within ${parsed.withinDays} days`;
      }
      if (parsed.mode === 'before') {
        return 'Before reference date';
      }
      if (parsed.mode === 'after') {
        return 'After reference date';
      }
      return 'Timestamp comparison';
    }

    // Composite criteria
    if (parsed.type === 'composite_and' && parsed.criteria) {
      const parts = parsed.criteria.map((c: any) => formatSuccessCriteria(c));
      return parts.join(' AND ');
    }
    
    if (parsed.type === 'composite_or' && parsed.criteria) {
      const parts = parsed.criteria.map((c: any) => formatSuccessCriteria(c));
      return `(${parts.join(' OR ')})`;
    }

    // Legacy formats - check for operator with threshold/targetValue/value
    if (parsed.operator) {
      const op = operatorMap[parsed.operator] || parsed.operator;
      // Check all possible value field names
      const numValue = parsed.threshold ?? parsed.targetValue ?? parsed.value;
      if (numValue !== undefined) {
        return `${op} ${numValue}`;
      }
    }

    // Very legacy: check for expectedValue without type
    if (parsed.expectedValue !== undefined && typeof parsed.expectedValue === 'boolean') {
      return `Must be ${parsed.expectedValue ? 'TRUE' : 'FALSE'}`;
    }
    
    // Check for just "value" field (might be a boolean)
    if (parsed.value !== undefined) {
      if (typeof parsed.value === 'boolean') {
        return `Must be ${parsed.value ? 'TRUE' : 'FALSE'}`;
      }
      return `= ${parsed.value}`;
    }

    // Fallback - don't use description as it may be verbose
    return 'Criteria defined';
    
  } catch (e) {
    // If parsing fails completely
    return 'Criteria defined';
  }
}

