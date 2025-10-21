/**
 * Customer Telemetry Export Service
 * 
 * Generates Excel templates for customer adoption plan telemetry data.
 * Users can fill these templates and import them to update telemetry values.
 * 
 * @module CustomerTelemetryExportService
 */

import ExcelJS from 'exceljs';
import { prisma } from '../../context';

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
    const worksheet = workbook.addWorksheet('Telemetry_Data');

    // Set up columns
    worksheet.columns = [
      { header: 'Task Name', key: 'taskName', width: 30 },
      { header: 'Attribute Name', key: 'attributeName', width: 25 },
      { header: 'Data Type', key: 'dataType', width: 15 },
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

        row.values = {
          taskName: task.name,
          attributeName: attribute.name,
          dataType: attribute.dataType,
          currentValue: '', // User will fill this
          date: today,
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
      '• DATE: Use YYYY-MM-DD format (e.g., 2025-10-18)',
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
}
