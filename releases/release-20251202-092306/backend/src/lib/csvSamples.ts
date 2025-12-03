/**
 * CSV Sample Templates
 * 
 * This module provides sample CSV templates for products and tasks
 * with clear documentation of required and optional fields.
 */

export const PRODUCT_SAMPLE_CSV = `id,name,description,statusPercent
# CSV Format: Simple Product Import/Export
# 
# Field Descriptions:
# - id: Product ID (OPTIONAL for import - leave empty to create new product, provide ID to update existing)
# - name: Product name (REQUIRED - text, max 255 characters)
# - description: Product description (OPTIONAL - text, can be multiline in quotes)
# - statusPercent: Status percentage (OPTIONAL - number between 0-100, defaults to 0)
#
# Import Behavior:
# - If 'id' is empty, a new product will be created
# - If 'id' is provided, the existing product will be updated
# - Complex relationships (licenses, outcomes, custom attributes) are NOT supported
# - Tasks are NOT included in product import - use separate task import
#
# Sample Data (remove these lines for actual import):
,Sample Product 1,"This is a sample product for demonstration purposes",25
,Sample Product 2,"Basic product with zero status",0
prod123,"Update Existing Product","This will update the product with ID 'prod123'",75`;

export const TASK_SAMPLE_CSV = `id,name,description,estMinutes,weight,sequenceNumber,licenseLevel,priority,notes,licenseId,outcomeIds
# CSV Format: Task Import/Export
#
# Field Descriptions:
# - id: Task ID (OPTIONAL for import - leave empty to create new, provide ID to update existing)
# - name: Task name (REQUIRED - text, max 255 characters)
# - description: Task description (OPTIONAL - text, can be multiline in quotes)
# - estMinutes: Estimated minutes to complete (REQUIRED - positive integer)
# - weight: Task weight/importance (REQUIRED - decimal between 0.1 and 100.0)
# - sequenceNumber: Execution sequence (OPTIONAL - integer, will auto-generate if empty)
# - licenseLevel: Required license level (OPTIONAL - Essential/Advantage/Signature, defaults to Essential)
# - priority: Task priority (OPTIONAL - Low/Medium/High/Critical, defaults to Medium)
# - notes: Additional notes (OPTIONAL - text)
# - licenseId: Single license ID for hierarchical system (OPTIONAL - references existing license)
# - outcomeIds: Outcome IDs this task contributes to (OPTIONAL - JSON array, e.g., "['out1', 'out2']")
#
# Import Modes:
# - APPEND: Add new tasks to existing ones (keeps existing tasks)
# - OVERWRITE: Replace all existing tasks with imported ones (deletes existing)
#
# Validation Rules:
# - Weight sum for all tasks in a product should total approximately 100%
# - Sequence numbers must be unique within the product
# - EstMinutes must be positive
# - licenseId must reference an existing license
# - outcomeIds must reference existing outcomes
#
# Sample Data (remove these lines for actual import):
,Setup Environment,"Install and configure development environment with all required tools",120,15.0,1,Essential,High,Make sure all dependencies are installed,license_essential,"[""outcome_setup""]"
,Write Tests,"Create comprehensive test suite covering all functionality",180,25.0,2,Advantage,High,Focus on edge cases and error handling,license_advantage,"[""outcome_quality"", ""outcome_testing""]"
,Code Review,Peer review of implementation,60,10.0,3,Signature,Medium,,license_signature,"[""outcome_quality""]"
task123,Update Existing Task,"This will update the task with ID 'task123' with new attributes",90,20.0,4,Essential,Low,Updated via CSV import,license_essential,"[]"`;

export function generateProductSampleCsv(): string {
  return PRODUCT_SAMPLE_CSV;
}

export function generateTaskSampleCsv(): string {
  return TASK_SAMPLE_CSV;
}

/**
 * Validate CSV headers for products
 */
export function validateProductHeaders(headers: string[]): { valid: boolean; missing: string[]; extra: string[] } {
  const required = ['name'];
  const allowed = ['id', 'name', 'description', 'customAttrs', 'licenseIds'];

  const missing = required.filter(field => !headers.includes(field));
  const extra = headers.filter(field => !allowed.includes(field));

  return {
    valid: missing.length === 0,
    missing,
    extra
  };
}

/**
 * Validate CSV headers for tasks
 */
export function validateTaskHeaders(headers: string[]): { valid: boolean; missing: string[]; extra: string[] } {
  const required = ['name', 'estMinutes', 'weight'];
  const allowed = ['id', 'name', 'description', 'estMinutes', 'weight', 'sequenceNumber', 'licenseLevel', 'priority', 'notes', 'licenseId', 'outcomeIds'];

  const missing = required.filter(field => !headers.includes(field));
  const extra = headers.filter(field => !allowed.includes(field));

  return {
    valid: missing.length === 0,
    missing,
    extra
  };
}
