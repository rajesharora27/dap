/**
 * Customer Telemetry Import Service
 * 
 * Imports telemetry values from Excel files and updates customer adoption plan telemetry.
 * Validates data, evaluates success criteria, and provides detailed import results.
 * 
 * @module CustomerTelemetryImportService
 */

import ExcelJS from 'exceljs';
import { prisma } from '../../shared/graphql/context';
import { v4 as uuidv4 } from 'uuid';
import { evaluateTelemetryAttribute, evaluateTaskStatusFromTelemetry } from './evaluationEngine';

export interface ImportResult {
  success: boolean;
  batchId: string;
  summary: {
    tasksProcessed: number;
    attributesUpdated: number;
    criteriaEvaluated: number;
    errors: string[];
  };
  taskResults: TaskImportResult[];
}

export interface TaskImportResult {
  taskId: string;
  taskName: string;
  attributesUpdated: number;
  criteriaMet: number;
  criteriaTotal: number;
  completionPercentage: number;
  errors: string[];
}

export class CustomerTelemetryImportService {
  /**
   * SHARED CORE METHOD: Import telemetry from Excel for any task list
   * Used by both product and solution telemetry imports
   */
  private static async importTelemetryFromExcel(
    tasks: any[],
    fileBuffer: Buffer,
    planType: string
  ): Promise<ImportResult> {
    const batchId = uuidv4();
    const errors: string[] = [];
    const taskResults: Map<string, TaskImportResult> = new Map();

    // Parse Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);

    // Find the Telemetry_Data sheet
    const worksheet = workbook.getWorksheet('Telemetry_Data');
    if (!worksheet) {
      throw new Error('Excel file must contain a "Telemetry_Data" sheet');
    }

    // Validate columns
    const headerRow = worksheet.getRow(1);
    const requiredColumns = ['Task Name', 'Attribute Name', 'Data Type', 'Current Value', 'Date'];
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value?.toString() || '';
    });

    for (const required of requiredColumns) {
      if (!headers.includes(required)) {
        throw new Error(`Missing required column: "${required}"`);
      }
    }

    // Get column indices
    const colIndices = {
      taskName: headers.indexOf('Task Name'),
      attributeName: headers.indexOf('Attribute Name'),
      dataType: headers.indexOf('Data Type'),
      currentValue: headers.indexOf('Current Value'),
      date: headers.indexOf('Date'),
      notes: headers.indexOf('Notes')
    };

    // Create task lookup map
    const taskMap = new Map(
      tasks.map((task: any) => [task.name, task])
    );

    // Collect all import operations as promises
    const importOperations: Promise<void>[] = [];

    const updatedTaskIds = new Set<string>();

    // Process each data row
    worksheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return; // Skip header

      try {
        const taskName = row.getCell(colIndices.taskName).value?.toString().trim();
        const attributeName = row.getCell(colIndices.attributeName).value?.toString().trim();
        const dataType = row.getCell(colIndices.dataType).value?.toString().trim();
        const currentValueRaw = row.getCell(colIndices.currentValue).value;
        const dateRaw = row.getCell(colIndices.date).value;
        const notes = colIndices.notes !== -1 ? (row.getCell(colIndices.notes).value?.toString() || null) : null;

        // Skip empty rows
        if (!taskName || !attributeName) {
          return;
        }

        // Skip rows with no current value
        if (currentValueRaw === null || currentValueRaw === undefined || currentValueRaw === '') {
          return;
        }

        // Find matching task
        const task: any = taskMap.get(taskName);
        if (!task) {
          errors.push(`Row ${rowNum}: Task "${taskName}" not found in ${planType}`);
          return;
        }

        // Find matching attribute
        const attribute: any = task.telemetryAttributes.find(
          (attr: any) => attr.name === attributeName
        );
        if (!attribute) {
          errors.push(`Row ${rowNum}: Attribute "${attributeName}" not found for task "${taskName}"`);
          return;
        }

        // Validate and parse value based on data type
        let parsedValue: any;
        try {
          parsedValue = this.parseValueByDataType(currentValueRaw, dataType || attribute.dataType);
        } catch (parseError: any) {
          errors.push(`Row ${rowNum}: ${parseError.message}`);
          return;
        }

        // Parse date
        let recordDate = new Date();
        if (dateRaw) {
          if (dateRaw instanceof Date) {
            recordDate = dateRaw;
          } else if (typeof dateRaw === 'string') {
            recordDate = new Date(dateRaw);
            if (isNaN(recordDate.getTime())) {
              errors.push(`Row ${rowNum}: Invalid date format "${dateRaw}". Use YYYY-MM-DD`);
              recordDate = new Date(); // Use current date as fallback
            }
          }
        }

        // Initialize task result if not exists
        if (!taskResults.has(task.id)) {
          taskResults.set(task.id, {
            taskId: task.id,
            taskName: task.name,
            attributesUpdated: 0,
            criteriaMet: 0,
            criteriaTotal: task.telemetryAttributes.filter((a: any) => a.successCriteria).length,
            completionPercentage: 0,
            errors: []
          });
        }

        // Create telemetry value and evaluate criteria
        const operation = this.createTelemetryValueAndEvaluate(
          attribute,
          parsedValue,
          batchId,
          recordDate,
          notes,
          taskResults.get(task.id)!
        ).then(() => {
          updatedTaskIds.add(task.id);
        }).catch((error: any) => {
          errors.push(`Row ${rowNum}: Failed to create telemetry value - ${error.message}`);
        });

        importOperations.push(operation);

      } catch (rowError: any) {
        errors.push(`Row ${rowNum}: ${rowError.message}`);
      }
    });

    // Wait for all import operations to complete
    await Promise.all(importOperations);

    // POST-IMPORT: Re-evaluate status for ALL tasks with telemetry attributes
    // This ensures tasks missing from the import are updated (e.g. DONE -> NO_LONGER_USING)
    console.log(`[Import] Re-evaluating status for all tasks with telemetry. BatchId: ${batchId}`);

    // Get all tasks with telemetry attributes from the plan
    const allTaskIds = tasks
      .filter((t: any) => t.telemetryAttributes && t.telemetryAttributes.length > 0)
      .map((t: any) => t.id);

    console.log(`[Import] Found ${allTaskIds.length} tasks to re-evaluate.`);

    for (const taskId of allTaskIds) {
      try {
        let task: any = await prisma.customerTask.findUnique({
          where: { id: taskId },
          include: {
            telemetryAttributes: {
              include: {
                values: {
                  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                  take: 1
                }
              }
            }
          }
        });

        let isSolutionTask = false;
        if (!task) {
          task = await prisma.customerSolutionTask.findUnique({
            where: { id: taskId },
            include: {
              telemetryAttributes: {
                include: {
                  values: {
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                    take: 1
                  }
                }
              }
            }
          });
          isSolutionTask = true;
        }

        if (task) {
          // Debug log for specific task
          if (task.name.includes('SD-WAN')) {
            console.log(`[Import] Evaluating SD-WAN task: ${task.name} (${task.id})`);
            console.log(`[Import] Current Status: ${task.status}, Source: ${task.statusUpdateSource}`);
            const attrs = task.telemetryAttributes.map((a: any) => ({
              name: a.name,
              latestBatch: a.values[0]?.batchId,
              currentBatch: batchId,
              isFresh: a.values[0]?.batchId === batchId
            }));
            console.log(`[Import] Attributes:`, JSON.stringify(attrs, null, 2));
          }

          const { newStatus, shouldUpdate } = await evaluateTaskStatusFromTelemetry(
            { status: task.status, statusUpdateSource: task.statusUpdateSource },
            task.telemetryAttributes,
            { currentBatchId: batchId }
          );

          if (task.name.includes('SD-WAN')) {
            console.log(`[Import] SD-WAN Result: NewStatus=${newStatus}, ShouldUpdate=${shouldUpdate}`);
          }

          if (shouldUpdate) {
            console.log(`Updating task ${task.name} status: ${task.status} -> ${newStatus}`);
            if (isSolutionTask) {
              await prisma.customerSolutionTask.update({
                where: { id: taskId },
                data: {
                  status: newStatus,
                  isComplete: newStatus === 'DONE',
                  completedAt: newStatus === 'DONE' ? new Date() : null,
                  statusUpdateSource: 'TELEMETRY',
                  statusUpdatedAt: new Date()
                }
              });
            } else {
              await prisma.customerTask.update({
                where: { id: taskId },
                data: {
                  status: newStatus,
                  isComplete: newStatus === 'DONE',
                  completedAt: newStatus === 'DONE' ? new Date() : null,
                  statusUpdateSource: 'TELEMETRY',
                  statusUpdatedAt: new Date()
                }
              });
            }
          }
        }
      } catch (evalError) {
        console.error(`Failed to re-evaluate task ${taskId} after import:`, evalError);
      }
    }

    // Calculate completion percentages
    for (const result of taskResults.values()) {
      result.completionPercentage = result.criteriaTotal > 0
        ? Math.round((result.criteriaMet / result.criteriaTotal) * 100)
        : 0;
    }

    // Calculate summary
    const summary = {
      tasksProcessed: taskResults.size,
      attributesUpdated: Array.from(taskResults.values()).reduce(
        (sum, r) => sum + r.attributesUpdated,
        0
      ),
      criteriaEvaluated: Array.from(taskResults.values()).reduce(
        (sum, r) => sum + r.criteriaTotal,
        0
      ),
      errors
    };

    return {
      success: errors.length === 0,
      batchId,
      summary,
      taskResults: Array.from(taskResults.values())
    };
  }

  /**
   * Import telemetry values for PRODUCT adoption plan
   * Uses shared importTelemetryFromExcel method
   */
  static async importTelemetryValues(
    adoptionPlanId: string,
    fileBuffer: Buffer
  ): Promise<ImportResult> {
    // Load adoption plan with tasks
    const adoptionPlan = await prisma.adoptionPlan.findUnique({
      where: { id: adoptionPlanId },
      include: {
        tasks: {
          include: {
            telemetryAttributes: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!adoptionPlan) {
      throw new Error(`Adoption plan ${adoptionPlanId} not found`);
    }

    // Use shared import method
    return this.importTelemetryFromExcel(adoptionPlan.tasks, fileBuffer, 'adoption plan');
  }

  /**
   * Parse value based on data type
   */
  private static parseValueByDataType(value: any, dataType: string): any {
    const type = dataType.toUpperCase();

    switch (type) {
      case 'BOOLEAN':
        return this.parseBoolean(value);

      case 'NUMBER':
        return this.parseNumber(value);

      case 'PERCENTAGE':
        return this.parsePercentage(value);

      case 'STRING':
        return value.toString();

      case 'DATE':
        return this.parseDate(value);

      case 'TIMESTAMP':
        return this.parseTimestamp(value);

      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  }

  /**
   * Parse boolean value
   */
  private static parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;

    const str = value.toString().toLowerCase().trim();

    if (['true', 't', 'yes', 'y', '1'].includes(str)) return true;
    if (['false', 'f', 'no', 'n', '0'].includes(str)) return false;

    throw new Error(`Invalid boolean value: "${value}". Use true/false, yes/no, or 1/0`);
  }

  /**
   * Parse number value
   */
  private static parseNumber(value: any): number {
    if (typeof value === 'number') return value;

    const num = parseFloat(value.toString().replace(/,/g, ''));
    if (isNaN(num)) {
      throw new Error(`Invalid number value: "${value}"`);
    }

    return num;
  }

  /**
   * Parse percentage value
   */
  private static parsePercentage(value: any): number {
    let num: number;

    if (typeof value === 'number') {
      num = value;
    } else {
      const str = value.toString().replace('%', '').trim();
      num = parseFloat(str);
    }

    if (isNaN(num)) {
      throw new Error(`Invalid percentage value: "${value}"`);
    }

    if (num < 0 || num > 100) {
      throw new Error(`Percentage must be between 0 and 100, got: ${num}`);
    }

    return num;
  }

  /**
   * Parse date value
   */
  private static parseDate(value: any): string {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    const str = value.toString().trim();
    const date = new Date(str);

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date value: "${value}". Use YYYY-MM-DD format`);
    }

    return date.toISOString().split('T')[0];
  }

  /**
   * Parse timestamp value (date with time)
   * Accepts various formats:
   * - ISO 8601: 2025-11-18T14:30:00Z or 2025-11-18T14:30:00
   * - Date objects
   * - Unix timestamps (numbers)
   * - Date strings: 2025-11-18 14:30:00
   */
  private static parseTimestamp(value: any): string {
    // If already a Date object, return ISO string
    if (value instanceof Date) {
      return value.toISOString();
    }

    // If a number, treat as Unix timestamp (milliseconds)
    if (typeof value === 'number') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid timestamp value: "${value}"`);
      }
      return date.toISOString();
    }

    // Parse string value
    const str = value.toString().trim();
    const date = new Date(str);

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid timestamp value: "${value}". Use ISO format (YYYY-MM-DDTHH:mm:ss) or Unix timestamp`);
    }

    return date.toISOString();
  }

  /**
   * Create telemetry value and evaluate success criteria
   */
  private static async createTelemetryValueAndEvaluate(
    attribute: any,
    value: any,
    batchId: string,
    recordDate: Date,
    notes: string | null,
    taskResult: TaskImportResult
  ): Promise<void> {
    try {
      // Create the telemetry value
      // Always use current timestamp for createdAt to ensure proper ordering of imports
      await prisma.customerTelemetryValue.create({
        data: {
          customerAttributeId: attribute.id,
          value: value,
          source: 'excel',
          batchId: batchId,
          notes: notes,
          createdAt: new Date() // Use current timestamp, not recordDate from file
        }
      });

      taskResult.attributesUpdated++;

      // Evaluate success criteria
      let isMet = false;
      if (attribute.successCriteria) {
        try {
          // Create a temporary attribute object with the new value for evaluation
          const attributeWithValue = {
            ...attribute,
            values: [{ value: value }]
          };
          const evaluationResult = await evaluateTelemetryAttribute(attributeWithValue);
          isMet = evaluationResult.success;

          console.log(`Evaluated ${attribute.name}:`, {
            value,
            criteria: attribute.successCriteria,
            isMet,
            details: evaluationResult.details
          });
        } catch (evalError) {
          console.error(`Failed to evaluate criteria for ${attribute.name}:`, evalError);
          isMet = false;
        }
      }

      // Update the attribute's isMet status
      await prisma.customerTelemetryAttribute.update({
        where: { id: attribute.id },
        data: {
          isMet: isMet,
          lastCheckedAt: new Date()
        }
      });

      if (isMet) {
        taskResult.criteriaMet++;
      }

    } catch (error: any) {
      taskResult.errors.push(`Failed to process attribute ${attribute.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get telemetry status for an adoption plan
   */
  static async getTelemetryStatus(adoptionPlanId: string): Promise<{
    totalTasks: number;
    tasksWithTelemetry: number;
    totalAttributes: number;
    attributesMet: number;
    lastImportAt: Date | null;
    lastBatchId: string | null;
  }> {
    const adoptionPlan = await prisma.adoptionPlan.findUnique({
      where: { id: adoptionPlanId },
      include: {
        tasks: {
          include: {
            telemetryAttributes: {
              include: {
                values: {
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    if (!adoptionPlan) {
      throw new Error(`Adoption plan ${adoptionPlanId} not found`);
    }

    const tasksWithTelemetry = adoptionPlan.tasks.filter(
      (task: any) => task.telemetryAttributes.length > 0
    );

    let totalAttributes = 0;
    let attributesMet = 0;
    let lastImportAt: Date | null = null;
    let lastBatchId: string | null = null;

    for (const task of adoptionPlan.tasks) {
      for (const attribute of (task as any).telemetryAttributes) {
        totalAttributes++;
        if (attribute.isMet) {
          attributesMet++;
        }

        // Track most recent import
        if (attribute.values.length > 0) {
          const latestValue = attribute.values[0];
          if (!lastImportAt || latestValue.createdAt > lastImportAt) {
            lastImportAt = latestValue.createdAt;
            lastBatchId = latestValue.batchId;
          }
        }
      }
    }

    return {
      totalTasks: adoptionPlan.tasks.length,
      tasksWithTelemetry: tasksWithTelemetry.length,
      totalAttributes,
      attributesMet,
      lastImportAt,
      lastBatchId
    };
  }

  /**
   * Get detailed telemetry for a specific task
   */
  static async getTaskTelemetryDetails(customerTaskId: string): Promise<{
    taskId: string;
    taskName: string;
    attributes: Array<{
      id: string;
      name: string;
      dataType: string;
      isMet: boolean;
      lastValue: any;
      lastCheckedAt: Date | null;
      successCriteria: any;
    }>;
    criteriaMet: number;
    criteriaTotal: number;
    completionPercentage: number;
  }> {
    const task = await prisma.customerTask.findUnique({
      where: { id: customerTaskId },
      include: {
        telemetryAttributes: {
          include: {
            values: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!task) {
      throw new Error(`Customer task ${customerTaskId} not found`);
    }

    const attributes = (task.telemetryAttributes as any[]).map(attr => ({
      id: attr.id,
      name: attr.name,
      dataType: attr.dataType,
      isMet: attr.isMet,
      lastValue: attr.values.length > 0 ? attr.values[0].value : null,
      lastCheckedAt: attr.lastCheckedAt,
      successCriteria: attr.successCriteria
    }));

    const criteriaMet = attributes.filter(a => a.isMet).length;
    const criteriaTotal = attributes.length;
    const completionPercentage = criteriaTotal > 0
      ? Math.round((criteriaMet / criteriaTotal) * 100)
      : 0;

    return {
      taskId: task.id,
      taskName: task.name,
      attributes,
      criteriaMet,
      criteriaTotal,
      completionPercentage
    };
  }

  /**
   * Import telemetry values for SOLUTION adoption plan
   * Uses the SAME shared importTelemetryFromExcel method as products
   */
  static async importSolutionTelemetryValues(
    solutionAdoptionPlanId: string,
    fileBuffer: Buffer
  ): Promise<ImportResult> {
    // Load solution adoption plan with tasks
    const solutionPlan = await prisma.solutionAdoptionPlan.findUnique({
      where: { id: solutionAdoptionPlanId },
      include: {
        tasks: {
          include: {
            telemetryAttributes: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!solutionPlan) {
      throw new Error(`Solution adoption plan ${solutionAdoptionPlanId} not found`);
    }

    // Use the SAME shared import method as products
    return this.importTelemetryFromExcel(solutionPlan.tasks, fileBuffer, 'solution adoption plan');
  }
}
