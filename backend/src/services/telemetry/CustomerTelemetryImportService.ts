/**
 * Customer Telemetry Import Service
 * 
 * Imports telemetry values from Excel files and updates customer adoption plan telemetry.
 * Validates data, evaluates success criteria, and provides detailed import results.
 * 
 * @module CustomerTelemetryImportService
 */

import ExcelJS from 'exceljs';
import { prisma } from '../../context';
import { v4 as uuidv4 } from 'uuid';
import { evaluateTelemetryAttribute } from './evaluationEngine';

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
   * Import telemetry values from Excel file
   */
  static async importTelemetryValues(
    adoptionPlanId: string,
    fileBuffer: Buffer
  ): Promise<ImportResult> {
    const batchId = uuidv4();
    const errors: string[] = [];
    const taskResults: Map<string, TaskImportResult> = new Map();

    try {
      // Load adoption plan with tasks and telemetry attributes
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
        adoptionPlan.tasks.map((task: any) => [task.name, task])
      );

      // Collect all import operations as promises
      const importOperations: Promise<void>[] = [];
      
      // Process each data row
      worksheet.eachRow((row, rowNum) => {
        if (rowNum === 1) return; // Skip header

        try {
          const taskName = row.getCell(colIndices.taskName).value?.toString().trim();
          const attributeName = row.getCell(colIndices.attributeName).value?.toString().trim();
          const dataType = row.getCell(colIndices.dataType).value?.toString().trim();
          const currentValueRaw = row.getCell(colIndices.currentValue).value;
          const dateRaw = row.getCell(colIndices.date).value;
          const notes = row.getCell(colIndices.notes).value?.toString() || null;

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
            errors.push(`Row ${rowNum}: Task "${taskName}" not found in adoption plan`);
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
          ).catch((error: any) => {
            errors.push(`Row ${rowNum}: Failed to create telemetry value - ${error.message}`);
          });
          
          importOperations.push(operation);

        } catch (rowError: any) {
          errors.push(`Row ${rowNum}: ${rowError.message}`);
        }
      });

      // Wait for all import operations to complete
      await Promise.all(importOperations);

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

    } catch (error: any) {
      throw new Error(`Failed to import telemetry: ${error.message}`);
    }
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
}
