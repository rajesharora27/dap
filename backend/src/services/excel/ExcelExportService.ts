import ExcelJS from 'exceljs';
import { prisma } from '../../shared/graphql/context';
import { Product, Task, License, Outcome, Release, CustomAttribute, TelemetryAttribute } from '@prisma/client';

export interface ExportProductOptions {
  includeTelemetry?: boolean;
  includeInstructions?: boolean;
  includeDeleted?: boolean;
}

export interface ExportResult {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
  stats: {
    tasksExported: number;
    customAttributesExported: number;
    licensesExported: number;
    outcomesExported: number;
    releasesExported: number;
    telemetryAttributesExported: number;
  };
}

export class ExcelExportService {
  /**
   * Export a single product to Excel with all its data
   */
  async exportProduct(productName: string, options: ExportProductOptions = {}): Promise<ExportResult> {
    const {
      includeTelemetry = true,
      includeInstructions = true,
      includeDeleted = false
    } = options;

    // Fetch product with all relationships
    const product = await prisma.product.findUnique({
      where: { name: productName },
      include: {
        tasks: {
          where: includeDeleted ? {} : { deletedAt: null },
          include: {
            outcomes: {
              include: {
                outcome: true
              }
            },
            releases: {
              include: {
                release: true
              }
            },
            telemetryAttributes: includeTelemetry,
            taskTags: {
              include: {
                tag: true
              }
            }
          },
          orderBy: { sequenceNumber: 'asc' }
        },
        licenses: {
          where: { deletedAt: null }
        },
        outcomes: true,
        releases: {
          where: { deletedAt: null }
        },
        customAttributes: {
          orderBy: { displayOrder: 'asc' }
        },
        tags: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!product) {
      throw new Error(`Product not found: ${productName}`);
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DAP Export Service';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create tabs
    await this.createProductInfoTab(workbook, product);
    await this.createTasksTab(workbook, product, product.tasks);
    await this.createLicensesTab(workbook, product.licenses);
    await this.createOutcomesTab(workbook, product.outcomes);
    await this.createReleasesTab(workbook, product.releases);
    await this.createCustomAttributesTab(workbook, product.customAttributes);
    await this.createTagsTab(workbook, product.tags);

    if (includeTelemetry) {
      await this.createTelemetryTab(workbook, product.tasks);
    }

    if (includeInstructions) {
      await this.createInstructionsTab(workbook);
    }

    // Generate buffer
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedName = product.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedName}_${timestamp}.xlsx`;

    // Calculate stats
    const stats = {
      tasksExported: product.tasks.length,
      customAttributesExported: product.customAttributes.length,
      licensesExported: product.licenses.length,
      outcomesExported: product.outcomes.length,
      releasesExported: product.releases.length,
      telemetryAttributesExported: includeTelemetry
        ? product.tasks.reduce((sum: number, task: any) => sum + (task.telemetryAttributes?.length || 0), 0)
        : 0
    };

    return {
      filename,
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: buffer.length,
      stats
    };
  }

  /**
   * Tab 1: Product Info (core fields only)
   */
  private async createProductInfoTab(workbook: ExcelJS.Workbook, product: Product) {
    const sheet = workbook.addWorksheet('Product Info');

    // Set column widths
    sheet.columns = [
      { key: 'field', width: 25 },
      { key: 'value', width: 60 }
    ];

    // Header
    const headerRow = sheet.addRow(['PRODUCT INFORMATION', '']);
    headerRow.font = { bold: true, size: 14 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };

    sheet.addRow([]); // Empty row

    // Product fields
    const fields = [
      { field: 'Product Name', value: product.name },
      { field: 'Description', value: product.description || '' },
      { field: 'Created At', value: product.createdAt.toISOString() },
      { field: 'Updated At', value: product.updatedAt.toISOString() }
    ];

    fields.forEach(({ field, value }) => {
      const row = sheet.addRow([field, value]);
      row.getCell(1).font = { bold: true };
    });

    sheet.addRow([]); // Empty row
    const noteRow = sheet.addRow(['Note:', 'Custom attributes are in Tab 6 (Custom Attributes)']);
    noteRow.getCell(1).font = { bold: true };
    noteRow.getCell(2).font = { italic: true };

    // Freeze first row
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  }

  /**
   * Tab 2: Tasks
   */
  private async createTasksTab(workbook: ExcelJS.Workbook, product: Product, tasks: any[]) {
    const sheet = workbook.addWorksheet('Tasks');

    // Define columns
    sheet.columns = [
      { header: 'Task Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Sequence Number', key: 'sequenceNumber', width: 18 },
      { header: 'License Level', key: 'licenseLevel', width: 15 },
      { header: 'Weight', key: 'weight', width: 10 },
      { header: 'Estimated Minutes', key: 'estMinutes', width: 18 },
      { header: 'How To Doc', key: 'howToDoc', width: 40 },
      { header: 'How To Video', key: 'howToVideo', width: 40 },
      { header: 'Notes', key: 'notes', width: 40 },
      { header: 'Outcomes', key: 'outcomes', width: 30 },
      { header: 'Releases', key: 'releases', width: 20 },
      { header: 'Tags', key: 'tags', width: 20 }
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };

    // Add tasks
    tasks.forEach(task => {
      sheet.addRow({
        name: task.name,
        description: task.description || '',
        sequenceNumber: task.sequenceNumber,
        licenseLevel: task.licenseLevel,
        weight: typeof task.weight === 'object' && 'toNumber' in task.weight ? task.weight.toNumber() : task.weight,
        estMinutes: task.estMinutes,
        howToDoc: Array.isArray(task.howToDoc) ? task.howToDoc.join(', ') : (task.howToDoc || ''),
        howToVideo: Array.isArray(task.howToVideo) ? task.howToVideo.join(', ') : (task.howToVideo || ''),
        notes: task.notes || '',
        outcomes: task.outcomes.map((to: any) => to.outcome.name).join(', '),
        releases: task.releases.map((tr: any) => tr.release.name).join(', '),
        tags: task.taskTags.map((tt: any) => tt.tag.name).join(', ')
      });
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    sheet.getCell('D1').note = 'Validated against license levels defined in the Licenses tab.';
    sheet.getCell('J1').note = 'Use comma-separated outcome names from the Outcomes tab (validation enforced).';
    sheet.getCell('K1').note = 'Use comma-separated release names from the Releases tab (validation enforced).';
    sheet.getCell('L1').note = 'Use comma-separated tag names from the Tags tab (validation enforced).';

    const maxRows = Math.max(sheet.rowCount, 500);

    const buildMultiSelectFormula = (cellAddress: string, lookupRange: string) =>
      `IF(TRIM(${cellAddress})="",TRUE,SUMPRODUCT(--ISNUMBER(MATCH(TRIM(MID(SUBSTITUTE(${cellAddress},",",REPT(" ",255)),(ROW(INDIRECT("1:"&(LEN(${cellAddress})-LEN(SUBSTITUTE(${cellAddress},",",""))+1)))-1)*255+1,255)),${lookupRange},0)))=(LEN(${cellAddress})-LEN(SUBSTITUTE(${cellAddress},",",""))+1))`;

    for (let row = 2; row <= maxRows; row++) {
      sheet.getCell(`D${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`Licenses!$B$2:$B$1048576`],
        showErrorMessage: true,
        errorTitle: 'Invalid License Level',
        error: 'Select a license level from the Licenses tab.'
      };

      sheet.getCell(`J${row}`).dataValidation = {
        type: 'custom',
        allowBlank: true,
        formulae: [buildMultiSelectFormula(`J${row}`, "'Outcomes'!$A:$A")],
        showErrorMessage: true,
        errorTitle: 'Invalid Outcome',
        error: 'Provide comma-separated outcome names from the Outcomes tab.'
      };

      sheet.getCell(`K${row}`).dataValidation = {
        type: 'custom',
        allowBlank: true,
        formulae: [buildMultiSelectFormula(`K${row}`, "'Releases'!$A:$A")],
        showErrorMessage: true,
        errorTitle: 'Invalid Release',
        error: 'Provide comma-separated release names from the Releases tab.'
      };

      sheet.getCell(`L${row}`).dataValidation = {
        type: 'custom',
        allowBlank: true,
        formulae: [buildMultiSelectFormula(`L${row}`, "'Tags'!$A:$A")],
        showErrorMessage: true,
        errorTitle: 'Invalid Tag',
        error: 'Provide comma-separated tag names from the Tags tab.'
      };
    }
  }

  /**
   * Tab 3: Licenses
   */
  private async createLicensesTab(workbook: ExcelJS.Workbook, licenses: License[]) {
    const sheet = workbook.addWorksheet('Licenses');

    // Define columns
    sheet.columns = [
      { header: 'License Name', key: 'name', width: 25 },
      { header: 'License Level', key: 'level', width: 15 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Is Active', key: 'isActive', width: 12 }
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };

    // Map level number to enum
    const levelMap: { [key: number]: string } = {
      1: 'ESSENTIAL',
      2: 'ADVANTAGE',
      3: 'SIGNATURE'
    };

    // Add licenses or default 3-tier structure
    if (licenses.length > 0) {
      licenses.forEach(license => {
        sheet.addRow({
          name: license.name,
          level: levelMap[license.level] || `LEVEL_${license.level}`,
          description: license.description || '',
          isActive: license.isActive ? 'TRUE' : 'FALSE'
        });
      });
    } else {
      // Add default 3-tier structure
      const defaultLicenses = [
        { name: 'Essential Edition', level: 'ESSENTIAL', description: 'Core features with standard support', isActive: 'TRUE' },
        { name: 'Advantage Edition', level: 'ADVANTAGE', description: 'Advanced features with premium support', isActive: 'TRUE' },
        { name: 'Signature Edition', level: 'SIGNATURE', description: 'Enterprise features with dedicated support', isActive: 'TRUE' }
      ];
      defaultLicenses.forEach(license => sheet.addRow(license));
    }

    // Freeze header row
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  }

  /**
   * Tab 4: Outcomes
   */
  private async createOutcomesTab(workbook: ExcelJS.Workbook, outcomes: Outcome[]) {
    const sheet = workbook.addWorksheet('Outcomes');

    // Define columns
    sheet.columns = [
      { header: 'Outcome Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 50 }
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };

    // Add outcomes
    outcomes.forEach(outcome => {
      sheet.addRow({
        name: outcome.name,
        description: outcome.description || ''
      });
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  }

  /**
   * Tab 5: Releases
   */
  private async createReleasesTab(workbook: ExcelJS.Workbook, releases: Release[]) {
    const sheet = workbook.addWorksheet('Releases');

    // Define columns
    sheet.columns = [
      { header: 'Release Name', key: 'name', width: 25 },
      { header: 'Release Level', key: 'level', width: 15 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Is Active', key: 'isActive', width: 12 }
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };

    // Add releases
    releases.forEach(release => {
      sheet.addRow({
        name: release.name,
        level: release.level,
        description: release.description || '',
        isActive: release.isActive ? 'TRUE' : 'FALSE'
      });
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  }

  /**
   * Tab 6: Custom Attributes
   */
  private async createCustomAttributesTab(workbook: ExcelJS.Workbook, customAttributes: CustomAttribute[]) {
    const sheet = workbook.addWorksheet('Custom Attributes');

    // Define columns
    sheet.columns = [
      { header: 'Attribute Name', key: 'attributeName', width: 30 },
      { header: 'Attribute Value', key: 'attributeValue', width: 40 },
      { header: 'Data Type', key: 'dataType', width: 15 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Is Required', key: 'isRequired', width: 12 },
      { header: 'Display Order', key: 'displayOrder', width: 15 }
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };

    // Add custom attributes
    customAttributes.forEach(attr => {
      sheet.addRow({
        attributeName: attr.attributeName,
        attributeValue: attr.attributeValue || '',
        dataType: attr.dataType,
        description: attr.description || '',
        isRequired: attr.isRequired ? 'TRUE' : 'FALSE',
        displayOrder: attr.displayOrder || ''
      });
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  }

  /**
   * Tab: Tags
   */
  private async createTagsTab(workbook: ExcelJS.Workbook, tags: any[]) {
    const sheet = workbook.addWorksheet('Tags');

    // Define columns
    sheet.columns = [
      { header: 'Tag Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Color', key: 'color', width: 15 },
      { header: 'Display Order', key: 'displayOrder', width: 15 }
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFED7D31' }
    };
    headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };

    // Add tags
    tags.forEach(tag => {
      sheet.addRow({
        name: tag.name,
        description: tag.description || '',
        color: tag.color || 'default',
        displayOrder: tag.displayOrder || 0
      });
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  }

  /**
   * Tab 7: Telemetry (optional)
   */
  private async createTelemetryTab(workbook: ExcelJS.Workbook, tasks: any[]) {
    const sheet = workbook.addWorksheet('Telemetry');

    // Define columns
    sheet.columns = [
      { header: 'Task Name', key: 'taskName', width: 30 },
      { header: 'Attribute Name', key: 'attributeName', width: 25 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Data Type', key: 'dataType', width: 15 },
      { header: 'Is Required', key: 'isRequired', width: 12 },
      { header: 'Display Order', key: 'displayOrder', width: 15 }
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' }
    };
    headerRow.font = { ...headerRow.font, color: { argb: 'FF000000' } };

    // Add telemetry attributes
    tasks.forEach(task => {
      if (task.telemetryAttributes && task.telemetryAttributes.length > 0) {
        task.telemetryAttributes.forEach((attr: TelemetryAttribute) => {
          sheet.addRow({
            taskName: task.name,
            attributeName: attr.name,
            description: attr.description || '',
            dataType: attr.dataType,
            isRequired: attr.isRequired ? 'TRUE' : 'FALSE',
            displayOrder: attr.order
          });
        });
      }
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  }

  /**
   * Tab 8: Instructions (auto-generated)
   */
  private async createInstructionsTab(workbook: ExcelJS.Workbook) {
    const sheet = workbook.addWorksheet('Instructions');

    // Set column width
    sheet.columns = [
      { key: 'content', width: 100 }
    ];

    const instructions = [
      '═══════════════════════════════════════════════════════════════════',
      '                    EXCEL IMPORT INSTRUCTIONS',
      '═══════════════════════════════════════════════════════════════════',
      '',
      'OVERVIEW:',
      '--------',
      'This Excel workbook contains a complete definition of a product including',
      'all tasks, licenses, outcomes, releases, custom attributes, and telemetry.',
      '',
      'You can edit this file and re-import it to update the product in DAP.',
      '',
      '═══════════════════════════════════════════════════════════════════',
      '',
      'QUICK START:',
      '-----------',
      '1. Edit the tabs you want to change (Product Info, Tasks, etc.)',
      '2. Save the Excel file',
      '3. In DAP, click "Import Product from Excel"',
      '4. Upload this file',
      '5. Review validation results',
      '6. Confirm import',
      '7. Product updated!',
      '',
      '═══════════════════════════════════════════════════════════════════',
      '',
      'TAB-BY-TAB GUIDE:',
      '----------------',
      '',
      'Tab 1: Product Info',
      '-------------------',
      '• Product Name: UNIQUE identifier for this product',
      '  ⚠ Changing this creates a NEW product',
      '  💡 Keep the same to UPDATE existing product',
      '• Description: Detailed product description',
      '• Custom attributes are in Tab 6 (not here)',
      '',
      'Tab 2: Tasks',
      '-----------',
      '• Task Name: UNIQUE within this product',
      '  💡 To add a task: Add new row',
      '  💡 To update a task: Modify existing row',
      '  💡 To delete a task: Remove row',
      '• Sequence Number: Display order (must be unique)',
      '• License Level: ESSENTIAL, ADVANTAGE, or SIGNATURE',
      '• Weight: 0-100 (decimal allowed)',
      '• Outcomes: Comma-separated outcome names from Tab 4',
      '• Releases: Comma-separated release levels from Tab 5',
      '• Tags: Comma-separated tag names from Tab 7',
      '',
      'Tab 3: Licenses',
      '--------------',
      '• Standard 3-tier structure (Essential/Advantage/Signature)',
      '• License Level: ESSENTIAL, ADVANTAGE, or SIGNATURE',
      '',
      'Tab 4: Outcomes',
      '--------------',
      '• Outcome Name: UNIQUE within product',
      '• Referenced by tasks in Tab 2 (Outcomes column)',
      '',
      'Tab 5: Releases',
      '--------------',
      '• Release Level: Numeric version (1.0, 2.0, 2.1, etc.)',
      '• Referenced by tasks in Tab 2 (Releases column)',
      '',
      'Tab 6: Custom Attributes ⭐ NEW',
      '-----------------------',
      '• User-defined attributes for product',
      '• Attribute Name: Required, unique within product',
      '• Data Type: TEXT, NUMBER, DATE, BOOLEAN, or JSON',
      '• Add/remove rows to manage custom attributes',
      '',
      'Tab 7: Tags ⭐ NEW',
      '------------------',
      '• Product-level tags definition',
      '• Tag Name: Required, unique within product',
      '• Description: Optional description for the tag',
      '• Color: Display color (e.g., error, success, warning)',
      '• Display Order: Number',
      '',
      'Tab 8: Telemetry (Optional)',
      '---------------------------',
      '• Advanced feature - can skip if not needed',
      '• Task Name: Must match task in Tab 2',
      '',
      '═══════════════════════════════════════════════════════════════════',
      '',
      'For detailed documentation, see EXCEL_FINAL_APPROVED_STRATEGY.md',
      '',
      '═══════════════════════════════════════════════════════════════════'
    ];

    instructions.forEach(line => {
      const row = sheet.addRow([line]);
      if (line.startsWith('═══')) {
        row.font = { bold: true };
      } else if (line.includes(':') && !line.startsWith(' ')) {
        row.font = { bold: true };
      }
    });
  }
}
