/**
 * Customer Telemetry Export Service
 * 
 * Generates Excel templates for customer adoption plan telemetry data.
 * Users can fill these templates and import them to update telemetry values.
 * 
 * @module CustomerTelemetryExportService
 */

import ExcelJS from 'exceljs';
import { prisma } from '../../shared/graphql/context';

export interface TelemetryTemplateRow {
  taskName: string;
  attributeName: string;
  dataType: string;
  currentValue: string;
  date: string;
  notes: string;
}

export class CustomerTelemetryExportService {
  /**
   * Generate telemetry template for an adoption plan
   * Returns Excel buffer that can be downloaded
   */
  static async generateTelemetryTemplate(adoptionPlanId: string): Promise<Buffer> {
    // Fetch adoption plan with tasks and telemetry attributes
    const adoptionPlan = await prisma.adoptionPlan.findUnique({
      where: { id: adoptionPlanId },
      include: {
        customerProduct: {
          include: {
            customer: true,
            product: true
          }
        },
        tasks: {
          orderBy: { sequenceNumber: 'asc' },
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

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DAP System';
    workbook.created = new Date();

    // Add worksheet
    console.log(`[TelemetryExport] Generating template with Extra Columns (Required, Criteria) for plan ${adoptionPlanId}`);
    const worksheet = workbook.addWorksheet('Telemetry_Data');

    // Set up columns
    worksheet.columns = [
      { header: 'Task Name', key: 'taskName', width: 30 },
      { header: 'Attribute Name', key: 'attributeName', width: 25 },
      { header: 'Data Type', key: 'dataType', width: 15 },
      { header: 'Required', key: 'required', width: 10 },
      { header: 'Operator', key: 'operator', width: 15 },
      { header: 'Expected Value', key: 'expectedValue', width: 20 },
      { header: 'Criteria', key: 'criteria', width: 25 },
      { header: 'Current Value', key: 'currentValue', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Notes', key: 'notes', width: 30 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;

    // Add data rows
    const today = new Date().toISOString().split('T')[0];
    let rowIndex = 2;

    for (const task of adoptionPlan.tasks) {
      if (task.telemetryAttributes.length === 0) {
        continue; // Skip tasks without telemetry attributes
      }

      for (const attribute of task.telemetryAttributes) {
        const row = worksheet.getRow(rowIndex);

        // Get current value (handle JSON or simple string)
        // Fetch explicitly to be robust
        const latestValueObj = await prisma.customerTelemetryValue.findFirst({
          where: { customerAttributeId: attribute.id },
          orderBy: { createdAt: 'desc' }
        });
        let currentValue = '';
        if (latestValueObj) {
          // If value is stored as stringified JSON but dataType is not string, or vice versa, handle it?
          // The value field is JSON type in Prisma or String?
          // In import, we see: currentValue: latestValue?.value || ''
          // In generateSolutionTelemetryTemplate, line 383: currentValue = latestValue?.value || ''
          // Let's rely on .value.
          // However, if it's an object/array, we might need to stringify it if we want it in one cell?
          // The excel export expects a string or number.
          // If it's a JSON object, ExcelJS might default to [object Object].
          // Let's assume it's a primitive or we verify.
          // In customerAdoption.ts exportCustomerAdoptionToExcel: JSON.stringify(latestValue.value)
          // Let's match that safety.
          try {
            currentValue = typeof latestValueObj.value === 'object'
              ? JSON.stringify(latestValueObj.value)
              : String(latestValueObj.value);
          } catch {
            currentValue = String(latestValueObj.value);
          }
        }

        row.values = {
          taskName: task.name,
          attributeName: attribute.name,
          dataType: attribute.dataType,
          required: attribute.isRequired ? 'Yes' : 'No',
          operator: this.getOperator(attribute.successCriteria),
          expectedValue: this.getValue(attribute.successCriteria),
          criteria: this.formatCriteria(attribute.successCriteria),
          currentValue: currentValue,
          date: latestValueObj ? new Date(latestValueObj.createdAt).toISOString().split('T')[0] : today, // Use entry date if exists
          notes: ''
        };

        // Make editable columns more visible
        row.getCell('currentValue').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF2CB' } // Light yellow
        };
        row.getCell('date').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF2CB' }
        };
        row.getCell('notes').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF2CB' }
        };

        // Make read-only columns grey
        row.getCell('taskName').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
        row.getCell('attributeName').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
        row.getCell('dataType').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
        row.getCell('required').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
        row.getCell('criteria').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };

        rowIndex++;
      }
    }

    // Add borders to all cells with data
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Add instructions sheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    instructionsSheet.columns = [
      { header: 'Instructions', key: 'text', width: 100 }
    ];

    const instructions = [
      'DAP Customer Telemetry Import Template',
      '',
      `Customer: ${adoptionPlan.customerProduct.customer.name}`,
      `Product: ${adoptionPlan.customerProduct.product.name}`,
      `Adoption Plan: ${adoptionPlan.customerProduct.assignmentName || 'N/A'}`,
      `Generated: ${new Date().toISOString()}`,
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
      'HOW TO USE THIS TEMPLATE:',
      '',
      '1. Go to the "Telemetry_Data" sheet',
      '2. Fill in the "Current Value" column with actual values from your system',
      '3. Update the "Date" column if the value is from a different day',
      '4. Add optional notes in the "Notes" column',
      '5. Save this file',
      '6. Upload via DAP\'s "Import Telemetry" button',
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
      'DATA TYPES & VALUE FORMATS:',
      '',
      '• BOOLEAN: Use true/false, yes/no, 1/0, or TRUE/FALSE',
      '• NUMBER: Enter numeric values (e.g., 150, 45.5, -10)',
      '• PERCENTAGE: Enter values 0-100 (e.g., 75 means 75%)',
      '• STRING: Enter any text',
      '• DATE: Use YYYY-MM-DD format (e.g., 2025-11-18)',
      '• TIMESTAMP: Use ISO format YYYY-MM-DDTHH:mm:ss or 2025-11-18 14:30:00',
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
      'IMPORTANT NOTES:',
      '',
      '⚠ DO NOT modify the structure of the "Telemetry_Data" sheet',
      '⚠ DO NOT change Task Name, Attribute Name, or Data Type columns',
      '⚠ Grey columns are read-only (for your reference)',
      '⚠ Yellow columns are where you enter data',
      '',
      'After import, the system will:',
      '✓ Validate your values match the expected data types',
      '✓ Evaluate success criteria for each attribute',
      '✓ Update the adoption plan telemetry status',
      '✓ Show you which tasks meet their telemetry criteria',
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
      'SUCCESS CRITERIA:',
      '',
      'Each telemetry attribute has success criteria (shown in the template).',
      'Examples:',
      '  • "equals true" - Boolean must be true',
      '  • ">= 100" - Number must be 100 or greater',
      '  • "<= 50" - Number must be 50 or less',
      '  • "AND condition" - Multiple criteria must all be true',
      '',
      'After import, you\'ll see which criteria are met.',
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
      'SUPPORT:',
      '',
      'If you encounter issues:',
      '1. Check that values match the data type',
      '2. Verify task and attribute names haven\'t been modified',
      '3. Ensure dates are in YYYY-MM-DD format',
      '4. Contact your DAP administrator for help',
      '',
      `Template Version: 1.0`,
      `Generated by: DAP Telemetry System`
    ];

    instructions.forEach((text, index) => {
      const row = instructionsSheet.getRow(index + 1);
      row.values = { text };

      // Style different types of rows
      if (text.includes('═══')) {
        row.font = { bold: true, color: { argb: 'FF4472C4' } };
      } else if (text.startsWith('Customer:') || text.startsWith('Product:') || text.startsWith('Adoption Plan:')) {
        row.font = { bold: true };
      } else if (text.match(/^\d+\./)) {
        row.font = { size: 11 };
      } else if (text.startsWith('•') || text.startsWith('⚠') || text.startsWith('✓')) {
        row.font = { size: 11 };
        row.alignment = { indent: 1 };
      } else if (text.includes(':') && !text.includes('//')) {
        row.font = { bold: true, size: 12 };
      }
    });

    // Note: Instructions sheet added second, so Telemetry_Data is first tab
    // This is intentional - users should see the data sheet first

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Get metadata about what would be in the template (without generating the file)
   */
  static async getTemplateMetadata(adoptionPlanId: string): Promise<{
    taskCount: number;
    attributeCount: number;
    customerName: string;
    productName: string;
    assignmentName: string;
  }> {
    const adoptionPlan = await prisma.adoptionPlan.findUnique({
      where: { id: adoptionPlanId },
      include: {
        customerProduct: {
          include: {
            customer: true,
            product: true
          }
        },
        tasks: {
          include: {
            telemetryAttributes: true
          }
        }
      }
    });

    if (!adoptionPlan) {
      throw new Error(`Adoption plan ${adoptionPlanId} not found`);
    }

    const tasksWithTelemetry = adoptionPlan.tasks.filter((t: any) => t.telemetryAttributes.length > 0);
    const totalAttributes = adoptionPlan.tasks.reduce(
      (sum: number, task: any) => sum + task.telemetryAttributes.length,
      0
    );

    return {
      taskCount: tasksWithTelemetry.length,
      attributeCount: totalAttributes,
      customerName: adoptionPlan.customerProduct.customer.name,
      productName: adoptionPlan.customerProduct.product.name,
      assignmentName: adoptionPlan.customerProduct.assignmentName || 'N/A'
    };
  }

  /**
   * Generate telemetry template for a solution adoption plan
   * Returns Excel buffer that can be downloaded
   */
  static async generateSolutionTelemetryTemplate(solutionAdoptionPlanId: string): Promise<Buffer> {
    // Fetch solution adoption plan with tasks and telemetry attributes
    const solutionPlan = await prisma.solutionAdoptionPlan.findUnique({
      where: { id: solutionAdoptionPlanId },
      include: {
        customerSolution: {
          include: {
            customer: true,
            solution: true
          }
        },
        tasks: {
          orderBy: { sequenceNumber: 'asc' },
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

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DAP System';
    workbook.created = new Date();

    // Add worksheet
    const worksheet = workbook.addWorksheet('Telemetry_Data');

    // Set up columns
    worksheet.columns = [
      { header: 'Task Name', key: 'taskName', width: 30 },
      { header: 'Attribute Name', key: 'attributeName', width: 25 },
      { header: 'Data Type', key: 'dataType', width: 15 },
      { header: 'Required', key: 'required', width: 10 },
      { header: 'Operator', key: 'operator', width: 15 },
      { header: 'Expected Value', key: 'expectedValue', width: 20 },
      { header: 'Criteria', key: 'criteria', width: 25 },
      { header: 'Current Value', key: 'currentValue', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Notes', key: 'notes', width: 30 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;

    // Add data rows
    const today = new Date().toISOString().split('T')[0];
    let rowIndex = 2;

    for (const task of solutionPlan.tasks) {
      if (task.telemetryAttributes.length === 0) {
        continue; // Skip tasks without telemetry
      }

      for (const attr of task.telemetryAttributes) {
        // Get current value from latest telemetry value if it exists
        const latestValue = await prisma.customerTelemetryValue.findFirst({
          where: {
            customerAttributeId: attr.id
          },
          orderBy: { createdAt: 'desc' }
        });

        let currentValue = '';
        if (latestValue) {
          try {
            currentValue = typeof latestValue.value === 'object'
              ? JSON.stringify(latestValue.value)
              : String(latestValue.value);
          } catch {
            currentValue = String(latestValue.value);
          }
        }

        worksheet.addRow({
          taskName: task.name,
          attributeName: attr.name,
          dataType: attr.dataType,
          required: attr.isRequired ? 'Yes' : 'No',
          operator: this.getOperator(attr.successCriteria),
          expectedValue: this.getValue(attr.successCriteria),
          criteria: this.formatCriteria(attr.successCriteria),
          currentValue: currentValue,
          date: today,
          notes: ''
        });

        // Apply row styling
        const row = worksheet.getRow(rowIndex);
        row.alignment = { vertical: 'middle', horizontal: 'left' };
        row.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Color read-only columns (A-G)
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
          row.getCell(col).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        });

        // Color input columns (H-J)
        ['H', 'I', 'J'].forEach(col => {
          row.getCell(col).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF2CB' }
          };
        });

        rowIndex++;
      }
    }

    // Add instructions worksheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    instructionsSheet.getColumn(1).width = 80;

    const instructions = [
      '═══════════════════════════════════════════════════════════════',
      'TELEMETRY DATA TEMPLATE - SOLUTION ADOPTION PLAN',
      '═══════════════════════════════════════════════════════════════',
      '',
      `Customer: ${solutionPlan.customerSolution.customer.name}`,
      `Solution: ${solutionPlan.customerSolution.solution.name}`,
      `Assignment: ${solutionPlan.customerSolution.name}`,
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
      'HOW TO USE THIS TEMPLATE:',
      '',
      '1. Fill in the "Current Value" column with your telemetry data',
      '2. Update the "Date" column with the measurement date (YYYY-MM-DD)',
      '3. Add any relevant notes in the "Notes" column',
      '4. Do NOT modify the Task Name or Attribute Name columns',
      '5. Save the file and import it back into DAP',
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
      'DATA TYPE GUIDE:',
      '',
      '• BOOLEAN: Enter "true" or "false" (lowercase)',
      '• NUMBER: Enter numeric values only (e.g., 42, 3.14)',
      '• STRING: Enter any text',
      '• TIMESTAMP: Enter date in YYYY-MM-DD format',
      '',
      'IMPORTANT:',
      '⚠ Values must match the data type or import will fail',
      '⚠ Keep task and attribute names exactly as shown',
      '⚠ Each row represents one telemetry measurement',
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
      'AFTER IMPORTING:',
      '',
      'The system will automatically:',
      '✓ Validate all data types',
      '✓ Store your telemetry values',
      '✓ Evaluate success criteria for each attribute',
      '✓ Update the adoption plan telemetry status',
      '✓ Show you which tasks meet their telemetry criteria',
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
      'SUCCESS CRITERIA:',
      '',
      'Each telemetry attribute has success criteria (shown in the template).',
      'Examples:',
      '  • "equals true" - Boolean must be true',
      '  • ">= 100" - Number must be 100 or greater',
      '  • "<= 50" - Number must be 50 or less',
      '  • "AND condition" - Multiple criteria must all be true',
      '',
      'After import, you\'ll see which criteria are met.',
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
      'SUPPORT:',
      '',
      'If you encounter issues:',
      '1. Check that values match the data type',
      '2. Verify task and attribute names haven\'t been modified',
      '3. Ensure dates are in YYYY-MM-DD format',
      '4. Contact your DAP administrator for help',
      '',
      `Template Version: 1.0`,
      `Generated by: DAP Telemetry System`
    ];

    instructions.forEach((text, index) => {
      const row = instructionsSheet.getRow(index + 1);
      row.values = { text };

      // Style different types of rows
      if (text.includes('═══')) {
        row.font = { bold: true, color: { argb: 'FF4472C4' } };
      } else if (text.startsWith('Customer:') || text.startsWith('Solution:') || text.startsWith('Assignment:')) {
        row.font = { bold: true };
      } else if (text.match(/^\d+\./)) {
        row.font = { size: 11 };
      } else if (text.startsWith('•') || text.startsWith('⚠') || text.startsWith('✓')) {
        row.font = { size: 11 };
        row.alignment = { indent: 1 };
      } else if (text.includes(':') && !text.includes('//')) {
        row.font = { bold: true, size: 12 };
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Format success criteria into a readable string
   */
  private static formatCriteria(criteria: any): string {
    if (!criteria) return '';

    // Parse JSON if needed
    if (typeof criteria === 'string') {
      try {
        criteria = JSON.parse(criteria);
      } catch {
        return criteria;
      }
    }

    if (!criteria.type) return JSON.stringify(criteria);

    switch (criteria.type) {
      case 'boolean_flag':
        return criteria.expectedValue === true ? 'true' : 'false';

      case 'number_threshold':
        const opMap: Record<string, string> = {
          'greater_than': '>',
          'greater_than_or_equal': '>=',
          'less_than': '<',
          'less_than_or_equal': '<=',
          'equals': '=',
          'not_equals': '!='
        };
        return `${opMap[criteria.operator] || criteria.operator} ${criteria.threshold}`;

      case 'string_match':
        if (criteria.mode === 'exact') return `Equals "${criteria.pattern}"`;
        return `Contains "${criteria.pattern}"`;

      case 'string_not_null':
        return 'Not Null';

      case 'timestamp_not_null':
        return 'Not Null';

      case 'timestamp_comparison':
        return `Within ${criteria.withinDays} days`;

      case 'string_contains': // Legacy check
        return `Contains "${criteria.expectedValue}"`;

      case 'string_equals': // Legacy check
        return `Equals "${criteria.expectedValue}"`;

      case 'boolean_equals': // Legacy check
        return criteria.expectedValue === true ? 'true' : 'false';

      default:
        return JSON.stringify(criteria);
    }
  }

  private static getOperator(criteria: any): string {
    if (!criteria) return '';
    if (typeof criteria === 'string') {
      try { criteria = JSON.parse(criteria); } catch { return ''; }
    }

    if (criteria.operator && !criteria.type) return criteria.operator; // Legacy

    switch (criteria.type) {
      case 'boolean_flag': return 'equals';
      case 'number_threshold': return criteria.operator || '';
      case 'string_match': return criteria.mode || 'exact';
      case 'string_not_null': return 'not_null';
      case 'timestamp_not_null': return 'not_null';
      case 'timestamp_comparison': return 'within_days';
      default: return '';
    }
  }

  private static getValue(criteria: any): string {
    if (!criteria) return '';
    if (typeof criteria === 'string') {
      try { criteria = JSON.parse(criteria); } catch { return ''; }
    }

    if (criteria.value !== undefined && !criteria.type) return String(criteria.value); // Legacy

    switch (criteria.type) {
      case 'boolean_flag': return String(criteria.expectedValue);
      case 'number_threshold': return String(criteria.threshold);
      case 'string_match': return String(criteria.pattern);
      case 'timestamp_comparison': return String(criteria.withinDays);
      default: return '';
    }
  }
}

