import ExcelJS from 'exceljs';
import { LicenseLevel } from '@prisma/client';
import { prisma } from '../../context';  // Use shared instance to prevent connection leaks

const LICENSE_LEVEL_NAME_TO_NUMBER: Record<string, number> = {
  ESSENTIAL: 1,
  ADVANTAGE: 2,
  SIGNATURE: 3
};

const LICENSE_LEVEL_NUMBER_TO_NAME: Record<number, LicenseLevel> = {
  1: 'ESSENTIAL',
  2: 'ADVANTAGE',
  3: 'SIGNATURE'
};



/**
 * Import modes for handling Excel imports
 */
export enum ImportMode {
  CREATE_NEW = 'CREATE_NEW',           // Create new product, fail if exists
  UPDATE_EXISTING = 'UPDATE_EXISTING', // Update existing product, fail if not exists
  CREATE_OR_UPDATE = 'CREATE_OR_UPDATE' // Create if not exists, update if exists
}

/**
 * Validation error structure
 */
export interface ValidationError {
  sheet: string;
  row?: number;
  column?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Import preview showing what will change
 */
export interface ImportPreview {
  productName: string;
  mode: ImportMode;
  changes: {
    product?: {
      action: 'create' | 'update' | 'none';
      current?: any;
      new: any;
    };
    tasks: {
      toCreate: any[];
      toUpdate: any[];
      toDelete: any[];
    };
    outcomes: {
      toCreate: any[];
      toUpdate: any[];
      toDelete: any[];
    };
    releases: {
      toCreate: any[];
      toUpdate: any[];
      toDelete: any[];
    };
    licenses: {
      toCreate: any[];
      toUpdate: any[];
      toDelete: any[];
    };
    customAttributes: {
      toCreate: any[];
      toUpdate: any[];
      toDelete: any[];
    };
    telemetryAttributes: {
      toCreate: any[];
      toUpdate: any[];
      toDelete: any[];
    };
  };
  validationErrors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  productId?: string;
  productName: string;
  stats: {
    tasksImported: number;
    outcomesImported: number;
    releasesImported: number;
    licensesImported: number;
    customAttributesImported: number;
    telemetryAttributesImported: number;
  };
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Excel Import Service
 * Handles importing products from Excel files with validation and preview
 */
export class ExcelImportService {
  /**
   * Parse Excel file and generate import preview
   */
  async previewImport(
    buffer: Buffer,
    mode: ImportMode = ImportMode.CREATE_OR_UPDATE
  ): Promise<ImportPreview> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const validationErrors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Parse all sheets
    const productData = this.parseProductInfoSheet(workbook, validationErrors);
    const tasksData = this.parseTasksSheet(workbook, validationErrors);
    const licensesData = this.parseLicensesSheet(workbook, validationErrors);
    const outcomesData = this.parseOutcomesSheet(workbook, validationErrors);
    const releasesData = this.parseReleasesSheet(workbook, validationErrors);
    const customAttributesData = this.parseCustomAttributesSheet(workbook, validationErrors);
    const telemetryData = this.parseTelemetrySheet(workbook, validationErrors);

    // Debug logging
    console.log('[ExcelImport] Parsed data:', {
      product: productData.name,
      tasks: tasksData.length,
      licenses: licensesData.length,
      outcomes: outcomesData.length,
      releases: releasesData.length,
      customAttributes: customAttributesData.length,
      telemetry: telemetryData.length,
      customAttributesSample: customAttributesData.slice(0, 2),
      licensesSample: licensesData.slice(0, 2)
    });

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { name: productData.name },
      include: {
        tasks: { include: { outcomes: true, releases: true, telemetryAttributes: true } },
        outcomes: true,
        releases: true,
        licenses: true,
        customAttributes: true
      }
    });

    this.validateTaskReferences(
      tasksData,
      licensesData,
      outcomesData,
      releasesData,
      existingProduct,
      validationErrors
    );

    // Validate mode
    if (mode === ImportMode.CREATE_NEW && existingProduct) {
      validationErrors.push({
        sheet: 'Product Info',
        field: 'name',
        message: `Product "${productData.name}" already exists. Use UPDATE_EXISTING or CREATE_OR_UPDATE mode.`,
        severity: 'error'
      });
    } else if (mode === ImportMode.UPDATE_EXISTING && !existingProduct) {
      validationErrors.push({
        sheet: 'Product Info',
        field: 'name',
        message: `Product "${productData.name}" does not exist. Use CREATE_NEW or CREATE_OR_UPDATE mode.`,
        severity: 'error'
      });
    }

    // Build preview
    const preview: ImportPreview = {
      productName: productData.name,
      mode,
      changes: {
        product: existingProduct
          ? {
            action: 'update',
            current: {
              name: existingProduct.name,
              description: existingProduct.description
            },
            new: productData
          }
          : {
            action: 'create',
            new: productData
          },
        tasks: this.compareArrays(
          existingProduct?.tasks || [],
          tasksData,
          'name'
        ),
        outcomes: this.compareArrays(
          existingProduct?.outcomes || [],
          outcomesData,
          'name'
        ),
        releases: this.compareArrays(
          existingProduct?.releases || [],
          releasesData,
          'name'
        ),
        licenses: this.compareArrays(
          existingProduct?.licenses || [],
          licensesData,
          'name'
        ),
        customAttributes: this.compareCustomAttrsJson(
          existingProduct?.customAttrs as Record<string, any> || {},
          customAttributesData
        ),
        telemetryAttributes: this.compareTelemetryAttributes(
          existingProduct?.tasks || [],
          tasksData,
          telemetryData
        )
      },
      validationErrors,
      warnings
    };

    return preview;
  }

  /**
   * Import product from Excel file
   */
  async importProduct(
    buffer: Buffer,
    mode: ImportMode = ImportMode.CREATE_OR_UPDATE
  ): Promise<ImportResult> {
    // First, generate preview to validate
    const preview = await this.previewImport(buffer, mode);

    // Check for validation errors (not warnings - warnings are informational)
    const actualErrors = preview.validationErrors.filter((e: ValidationError) => e.severity === 'error');
    const warningsFromValidation = preview.validationErrors.filter((e: ValidationError) => e.severity === 'warning');

    if (actualErrors.length > 0) {
      return {
        success: false,
        productName: preview.productName,
        stats: {
          tasksImported: 0,
          outcomesImported: 0,
          releasesImported: 0,
          licensesImported: 0,
          customAttributesImported: 0,
          telemetryAttributesImported: 0
        },
        errors: actualErrors,
        warnings: [...preview.warnings, ...warningsFromValidation]
      };
    }

    // Perform import in a transaction
    try {
      const result = await prisma.$transaction(async (tx: any) => {
        let productId: string;

        // Create or update product
        if (preview.changes.product?.action === 'create') {
          const product = await tx.product.create({
            data: {
              name: preview.changes.product.new.name,
              description: preview.changes.product.new.description || ''
            }
          });
          productId = product.id;
        } else {
          const existingProduct = await tx.product.findUnique({
            where: { name: preview.productName }
          });
          if (!existingProduct) {
            throw new Error(`Product "${preview.productName}" not found`);
          }
          productId = existingProduct.id;

          // Update product
          await tx.product.update({
            where: { id: productId },
            data: {
              description: preview.changes.product?.new.description || ''
            }
          });
        }

        // Import outcomes
        const outcomeMap = new Map<string, string>();
        for (const outcome of preview.changes.outcomes.toCreate) {
          const created = await tx.outcome.create({
            data: {
              name: outcome.name,
              description: outcome.description || '',
              productId
            }
          });
          outcomeMap.set(outcome.name, created.id);
        }

        for (const outcome of preview.changes.outcomes.toUpdate) {
          const existing = await tx.outcome.findFirst({
            where: { name: outcome.name, productId }
          });
          if (existing) {
            await tx.outcome.update({
              where: { id: existing.id },
              data: {
                description: outcome.description || ''
              }
            });
            outcomeMap.set(outcome.name, existing.id);
          }
        }

        // Get existing outcomes for mapping
        const existingOutcomes = await tx.outcome.findMany({
          where: { productId }
        });
        existingOutcomes.forEach((o: any) => outcomeMap.set(o.name, o.id));

        // Import releases
        const releaseMap = new Map<string, string>();
        for (const release of preview.changes.releases.toCreate) {
          const created = await tx.release.create({
            data: {
              name: release.name,
              description: release.description || '',
              level: release.level,
              isActive: release.isActive ?? true,
              productId
            }
          });
          releaseMap.set(release.name, created.id);
          if (release.level !== undefined && release.level !== null) {
            releaseMap.set(release.level.toString(), created.id);
          }
        }

        for (const release of preview.changes.releases.toUpdate) {
          const existing = await tx.release.findFirst({
            where: { name: release.name, productId }
          });
          if (existing) {
            await tx.release.update({
              where: { id: existing.id },
              data: {
                description: release.description || '',
                level: release.level,
                isActive: release.isActive ?? true
              }
            });
            releaseMap.set(release.name, existing.id);
            if (release.level !== undefined && release.level !== null) {
              releaseMap.set(release.level.toString(), existing.id);
            }
          }
        }

        // Get existing releases for mapping
        const existingReleases = await tx.release.findMany({
          where: { productId }
        });
        existingReleases.forEach((r: any) => {
          releaseMap.set(r.name, r.id);
          if (r.level !== undefined && r.level !== null) {
            releaseMap.set(r.level.toString(), r.id);
          }
        });

        // Import licenses
        const licenseMap = new Map<string, string>();
        for (const license of preview.changes.licenses.toCreate) {
          const created = await tx.license.create({
            data: {
              name: license.name,
              description: license.description || '',
              level: license.level,
              isActive: license.isActive ?? true,
              productId
            }
          });
          licenseMap.set(license.name, created.id);
        }

        for (const license of preview.changes.licenses.toUpdate) {
          const existing = await tx.license.findFirst({
            where: { name: license.name, productId }
          });
          if (existing) {
            await tx.license.update({
              where: { id: existing.id },
              data: {
                description: license.description || '',
                level: license.level,
                isActive: license.isActive ?? true
              }
            });
            licenseMap.set(license.name, existing.id);
          }
        }

        // Get existing licenses for mapping
        const existingLicenses = await tx.license.findMany({
          where: { productId }
        });
        existingLicenses.forEach((l: any) => licenseMap.set(l.name, l.id));

        // Import custom attributes to the JSON field (customAttrs)
        // This is the legacy JSON field that the frontend uses
        const customAttrsJson: Record<string, any> = {};

        // Get existing customAttrs from product
        const productForAttrs = await tx.product.findUnique({
          where: { id: productId },
          select: { customAttrs: true }
        });
        const existingAttrs = (productForAttrs?.customAttrs as Record<string, any>) || {};

        // Merge existing with new/updated
        Object.assign(customAttrsJson, existingAttrs);

        for (const attr of preview.changes.customAttributes.toCreate) {
          customAttrsJson[attr.attributeName] = attr.attributeValue || '';
        }
        for (const attr of preview.changes.customAttributes.toUpdate) {
          customAttrsJson[attr.attributeName] = attr.attributeValue || '';
        }

        // Update product with new customAttrs
        if (Object.keys(customAttrsJson).length > 0 || preview.changes.customAttributes.toCreate.length > 0 || preview.changes.customAttributes.toUpdate.length > 0) {
          await tx.product.update({
            where: { id: productId },
            data: { customAttrs: customAttrsJson }
          });
        }

        // Import tasks last to ensure dependencies exist
        // First, get max sequence number to avoid conflicts when creating new tasks
        const existingTasks = await tx.task.findMany({
          where: { productId },
          select: { id: true, sequenceNumber: true }
        });
        const maxSeq = existingTasks.length > 0
          ? Math.max(...existingTasks.map((t: { sequenceNumber: number }) => t.sequenceNumber))
          : 0;

        // Move existing tasks to temporary negative sequence numbers to avoid conflicts
        for (let i = 0; i < existingTasks.length; i++) {
          await tx.task.update({
            where: { id: existingTasks[i].id },
            data: { sequenceNumber: -(i + 1000) }
          });
        }

        let nextSeq = 1;
        for (const task of preview.changes.tasks.toCreate) {
          const outcomeIds = this.resolveTaskEntityIds(task.outcomes, outcomeMap);
          const releaseIds = this.resolveTaskEntityIds(task.releases, releaseMap);
          const licenseLevel = this.normalizeTaskLicenseLevel(task.licenseLevel);

          // Use the imported sequence number or assign the next available
          const seqNum = task.sequenceNumber || nextSeq;
          nextSeq = Math.max(nextSeq, seqNum) + 1;

          const created = await tx.task.create({
            data: {
              name: task.name,
              description: task.description || '',
              estMinutes: task.estMinutes || 60,
              weight: task.weight || 1,
              sequenceNumber: seqNum,
              licenseLevel,
              howToDoc: task.howToDoc ? task.howToDoc.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
              howToVideo: task.howToVideo ? task.howToVideo.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
              productId,
              outcomes: {
                create: outcomeIds.map((id: string) => ({ outcomeId: id }))
              },
              releases: {
                create: releaseIds.map((id: string) => ({ releaseId: id }))
              }
            }
          });

          const telemetryAttrs = preview.changes.telemetryAttributes.toCreate.filter(
            (attr: any) => attr.taskName === task.name
          );
          for (const attr of telemetryAttrs) {
            await tx.telemetryAttribute.create({
              data: {
                name: attr.attributeName,
                description: attr.description || '',
                dataType: attr.dataType || 'STRING',
                successCriteria: attr.successCriteria || {},
                taskId: created.id
              }
            });
          }
        }

        for (const task of preview.changes.tasks.toUpdate) {
          const existing = await tx.task.findFirst({
            where: { name: task.name, productId }
          });
          if (existing) {
            const outcomeIds = this.resolveTaskEntityIds(task.outcomes, outcomeMap);
            const releaseIds = this.resolveTaskEntityIds(task.releases, releaseMap);
            const licenseLevel = this.normalizeTaskLicenseLevel(task.licenseLevel);

            await tx.task.update({
              where: { id: existing.id },
              data: {
                description: task.description || '',
                estMinutes: task.estMinutes || 60,
                weight: task.weight || 1,
                sequenceNumber: task.sequenceNumber || 1,
                licenseLevel,
                howToDoc: task.howToDoc ? task.howToDoc.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                howToVideo: task.howToVideo ? task.howToVideo.split(',').map((s: string) => s.trim()).filter(Boolean) : []
              }
            });

            await tx.taskOutcome.deleteMany({
              where: { taskId: existing.id }
            });
            for (const outcomeId of outcomeIds) {
              await tx.taskOutcome.create({
                data: { taskId: existing.id, outcomeId }
              });
            }

            await tx.taskRelease.deleteMany({
              where: { taskId: existing.id }
            });
            for (const releaseId of releaseIds) {
              await tx.taskRelease.create({
                data: { taskId: existing.id, releaseId }
              });
            }

            await tx.telemetryAttribute.deleteMany({
              where: { taskId: existing.id }
            });

            const telemetryAttrs = preview.changes.telemetryAttributes.toCreate.filter(
              (attr: any) => attr.taskName === task.name
            );
            for (const attr of telemetryAttrs) {
              await tx.telemetryAttribute.create({
                data: {
                  name: attr.attributeName,
                  description: attr.description || '',
                  dataType: attr.dataType || 'STRING',
                  successCriteria: attr.successCriteria || {},
                  taskId: existing.id
                }
              });
            }
          }
        }

        return {
          productId,
          tasksImported: preview.changes.tasks.toCreate.length + preview.changes.tasks.toUpdate.length,
          outcomesImported: preview.changes.outcomes.toCreate.length + preview.changes.outcomes.toUpdate.length,
          releasesImported: preview.changes.releases.toCreate.length + preview.changes.releases.toUpdate.length,
          licensesImported: preview.changes.licenses.toCreate.length + preview.changes.licenses.toUpdate.length,
          customAttributesImported: preview.changes.customAttributes.toCreate.length + preview.changes.customAttributes.toUpdate.length,
          telemetryAttributesImported: preview.changes.telemetryAttributes.toCreate.length
        };
      });

      return {
        success: true,
        productId: result.productId,
        productName: preview.productName,
        stats: result,
        errors: [],
        warnings: [...preview.warnings, ...warningsFromValidation]
      };
    } catch (error: any) {
      return {
        success: false,
        productName: preview.productName,
        stats: {
          tasksImported: 0,
          outcomesImported: 0,
          releasesImported: 0,
          licensesImported: 0,
          customAttributesImported: 0,
          telemetryAttributesImported: 0
        },
        errors: [
          {
            sheet: 'Import',
            message: `Import failed: ${error.message}`,
            severity: 'error'
          }
        ],
        warnings: preview.warnings
      };
    }
  }

  /**
   * Find worksheet by name (case-insensitive)
   */
  private findWorksheetCaseInsensitive(workbook: ExcelJS.Workbook, name: string): ExcelJS.Worksheet | undefined {
    // First try exact match
    let sheet = workbook.getWorksheet(name);
    if (sheet) return sheet;

    // Then try case-insensitive match
    const lowerName = name.toLowerCase();
    workbook.eachSheet((ws) => {
      if (ws.name.toLowerCase() === lowerName) {
        sheet = ws;
      }
    });

    return sheet;
  }

  /**
   * Get list of all sheet names in workbook
   */
  private getWorksheetNames(workbook: ExcelJS.Workbook): string[] {
    const names: string[] = [];
    workbook.eachSheet((ws) => {
      names.push(ws.name);
    });
    return names;
  }

  /**
   * Parse Product Info sheet (Tab 1)
   */
  private parseProductInfoSheet(
    workbook: ExcelJS.Workbook,
    errors: ValidationError[]
  ): any {
    const sheet = this.findWorksheetCaseInsensitive(workbook, 'Product Info');

    if (!sheet) {
      const availableSheets = this.getWorksheetNames(workbook);
      errors.push({
        sheet: 'Product Info',
        message: `Invalid File Format: "Product Info" sheet is missing. Available sheets: [${availableSheets.join(', ')}]. Please ensure you are using a valid Excel export file.`,
        severity: 'error'
      });
      return { name: '', description: '' };
    }

    const data: any = {};

    // First, try to detect the layout type
    const firstRow = sheet.getRow(1);
    const headers: string[] = [];
    firstRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value?.toString().trim() || '';
    });

    // Check if this is a horizontal layout (headers like "Name", "Product Name", "Description")
    const nameColIndex = headers.findIndex(h =>
      h && (h.toLowerCase() === 'name' ||
        h.toLowerCase() === 'product name' ||
        h.toLowerCase() === 'product')
    );
    const descColIndex = headers.findIndex(h =>
      h && h.toLowerCase() === 'description'
    );

    if (nameColIndex > 0) {
      // Horizontal layout - read data from row 2
      const dataRow = sheet.getRow(2);
      if (dataRow) {
        data.name = dataRow.getCell(nameColIndex + 1).value?.toString().trim();
        if (descColIndex > 0) {
          data.description = dataRow.getCell(descColIndex + 1).value?.toString().trim();
        }
      }
    } else {
      // Vertical layout (Field | Value) - original format
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const field = row.getCell(1).value?.toString().trim();
        const value = row.getCell(2).value?.toString().trim();

        // Accept both "Product Name" and "Name" as the product name field
        if (field === 'Product Name' || field === 'Name') data.name = value;
        else if (field === 'Description') data.description = value;
      });
    }

    if (!data.name) {
      errors.push({
        sheet: 'Product Info',
        field: 'Product Name',
        message: 'Product Name is required. Expected a "Product Name" or "Name" column/row.',
        severity: 'error'
      });
    }

    return data;
  }

  /**
   * Parse Tasks sheet (Tab 2)
   */
  private parseTasksSheet(
    workbook: ExcelJS.Workbook,
    errors: ValidationError[]
  ): any[] {
    const sheet = this.findWorksheetCaseInsensitive(workbook, 'Tasks');
    if (!sheet) {
      errors.push({
        sheet: 'Tasks',
        message: 'Tasks sheet not found',
        severity: 'warning'
      });
      return [];
    }

    const tasks: any[] = [];
    const headers: string[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // Parse headers
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value?.toString().trim() || '';
        });
      } else {
        const task: any = { __rowNumber: rowNumber };
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber]?.toLowerCase() || '';
          const value = cell.value?.toString().trim();

          // Use case-insensitive matching and accept common variations
          if (header === 'task name' || header === 'name') task.name = value;
          else if (header === 'description') task.description = value;
          else if (header === 'license level' || header === 'license') task.licenseLevel = value;
          else if (header === 'license name') task.licenseName = value;
          else if (header === 'est. minutes' || header === 'estimated minutes' || header === 'estminutes' || header === 'minutes') task.estMinutes = parseInt(value || '60');
          else if (header === 'weight') task.weight = parseFloat(value || '1');
          else if (header === 'sequence number' || header === 'sequence' || header === 'seq' || header === 'order') task.sequenceNumber = parseInt(value || '1');
          else if (header === 'priority') task.priority = value;
          else if (header === 'how-to doc' || header === 'howtodoc' || header === 'how to doc' || header === 'doc') task.howToDoc = value;
          else if (header === 'how-to video' || header === 'howtovideo' || header === 'how to video' || header === 'video') task.howToVideo = value;
          else if (header === 'outcomes' || header === 'outcome' || header === 'outcome names') task.outcomes = value ? value.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
          else if (header === 'releases' || header === 'release' || header === 'release names') task.releases = value ? value.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        });

        if (task.name) {
          if (task.licenseLevel) {
            task.licenseLevel = this.normalizeTaskLicenseLevel(task.licenseLevel);
          }
          tasks.push(task);
        }
      }
    });

    return tasks;
  }

  /**
   * Parse Licenses sheet (Tab 3)
   */
  private parseLicensesSheet(
    workbook: ExcelJS.Workbook,
    errors: ValidationError[]
  ): any[] {
    const sheet = this.findWorksheetCaseInsensitive(workbook, 'Licenses');
    if (!sheet) {
      errors.push({
        sheet: 'Licenses',
        message: 'Licenses sheet not found',
        severity: 'warning'
      });
      return [];
    }

    const licenses: any[] = [];
    const headers: string[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value?.toString().trim() || '';
        });
      } else {
        const license: any = { __rowNumber: rowNumber };
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber]?.toLowerCase() || '';
          const value = cell.value?.toString().trim();

          // Use case-insensitive matching and accept common variations
          if (header === 'license name' || header === 'name') license.name = value;
          else if (header === 'description') license.description = value;
          else if (header === 'level' || header === 'license level') {
            const normalized = this.normalizeLicenseLevelInput(value);
            license.level = normalized.level;
            license.levelName = normalized.label;
            if (!normalized.isValid) {
              errors.push({
                sheet: 'Licenses',
                row: rowNumber,
                field: 'Level',
                message: `Invalid license level "${value}" for license "${license.name || 'Unnamed'}"`,
                severity: 'error'
              });
            }
          }
          else if (header === 'is active' || header === 'active' || header === 'isactive') license.isActive = value?.toLowerCase() === 'true' || value === '1';
        });

        if (license.name) {
          licenses.push(license);
        }
      }
    });

    return licenses;
  }

  /**
   * Parse Outcomes sheet (Tab 4)
   */
  private parseOutcomesSheet(
    workbook: ExcelJS.Workbook,
    errors: ValidationError[]
  ): any[] {
    const sheet = this.findWorksheetCaseInsensitive(workbook, 'Outcomes');
    if (!sheet) {
      errors.push({
        sheet: 'Outcomes',
        message: 'Outcomes sheet not found',
        severity: 'warning'
      });
      return [];
    }

    const outcomes: any[] = [];
    const headers: string[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value?.toString().trim() || '';
        });
      } else {
        const outcome: any = { __rowNumber: rowNumber };
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber]?.toLowerCase() || '';
          const value = cell.value?.toString().trim();

          // Use case-insensitive matching
          if (header === 'outcome name' || header === 'name') outcome.name = value;
          else if (header === 'description') outcome.description = value;
        });

        if (outcome.name) {
          outcomes.push(outcome);
        }
      }
    });

    return outcomes;
  }

  /**
   * Parse Releases sheet (Tab 5)
   */
  private parseReleasesSheet(
    workbook: ExcelJS.Workbook,
    errors: ValidationError[]
  ): any[] {
    const sheet = this.findWorksheetCaseInsensitive(workbook, 'Releases');
    if (!sheet) {
      errors.push({
        sheet: 'Releases',
        message: 'Releases sheet not found',
        severity: 'warning'
      });
      return [];
    }

    const releases: any[] = [];
    const headers: string[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value?.toString().trim() || '';
        });
      } else {
        const release: any = { __rowNumber: rowNumber };
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber]?.toLowerCase() || '';
          const value = cell.value?.toString().trim();

          // Use case-insensitive matching
          if (header === 'release name' || header === 'name') release.name = value;
          else if (header === 'description') release.description = value;
          else if (header === 'level' || header === 'release level') release.level = parseFloat(value || '1.0');
          else if (header === 'is active' || header === 'active' || header === 'isactive') release.isActive = value?.toLowerCase() === 'true' || value === '1';
        });

        if (release.name) {
          releases.push(release);
        }
      }
    });

    return releases;
  }

  /**
   * Parse Custom Attributes sheet (Tab 6)
   */
  private parseCustomAttributesSheet(
    workbook: ExcelJS.Workbook,
    errors: ValidationError[]
  ): any[] {
    const sheet = this.findWorksheetCaseInsensitive(workbook, 'Custom Attributes');
    if (!sheet) {
      return []; // Optional sheet
    }

    const attributes: any[] = [];
    const headers: string[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value?.toString().trim() || '';
        });
      } else {
        const attr: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber]?.toLowerCase() || '';
          const value = cell.value?.toString().trim();

          // Use case-insensitive matching - accept 'key' as alias for 'attribute name'
          if (header === 'attribute name' || header === 'name' || header === 'key') attr.attributeName = value;
          else if (header === 'value' || header === 'attribute value') attr.attributeValue = value;
          else if (header === 'data type' || header === 'datatype' || header === 'type') attr.dataType = value;
          else if (header === 'description') attr.description = value;
          else if (header === 'is required' || header === 'required' || header === 'isrequired') attr.isRequired = value?.toLowerCase() === 'true' || value === '1';
          else if (header === 'display order' || header === 'order' || header === 'displayorder') attr.displayOrder = parseInt(value || '0');
        });

        if (attr.attributeName) {
          attributes.push(attr);
        }
      }
    });

    return attributes;
  }

  /**
   * Parse Telemetry sheet (Tab 7)
   */
  private parseTelemetrySheet(
    workbook: ExcelJS.Workbook,
    errors: ValidationError[]
  ): any[] {
    const sheet = this.findWorksheetCaseInsensitive(workbook, 'Telemetry');

    if (!sheet) {
      return []; // Optional sheet
    }

    const attributes: any[] = [];
    const headers: string[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value?.toString().trim() || '';
        });
      } else {
        const attr: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber]?.toLowerCase() || '';
          const value = cell.value?.toString().trim();

          // Use case-insensitive matching - match export format headers
          if (header === 'task name' || header === 'task') attr.taskName = value;
          else if (header === 'attribute name' || header === 'name') attr.attributeName = value;
          else if (header === 'description') attr.description = value;
          else if (header === 'data type' || header === 'datatype' || header === 'type') attr.dataType = value;
          else if (header === 'is required' || header === 'required' || header === 'isrequired') attr.isRequired = value?.toLowerCase() === 'true' || value === '1';
          else if (header === 'success criteria' || header === 'successcriteria' || header === 'criteria') {
            // Try to parse as JSON, otherwise use as string
            try {
              attr.successCriteria = value ? JSON.parse(value) : null;
            } catch {
              attr.successCriteria = value || null;
            }
          }
          else if (header === 'order' || header === 'display order') attr.order = parseInt(value || '0');
          else if (header === 'is active' || header === 'active' || header === 'isactive') attr.isActive = value?.toLowerCase() !== 'false' && value !== '0';
          // Legacy format support
          else if (header === 'operator') attr.operator = value;
          else if (header === 'expected value' || header === 'expectedvalue' || header === 'expected') attr.expectedValue = value;
        });

        if (attr.taskName && attr.attributeName) {
          attributes.push(attr);
        }
      }
    });

    return attributes;
  }

  /**
   * Compare custom attributes from JSON field with incoming data
   */
  private compareCustomAttrsJson(
    existingJson: Record<string, any>,
    incoming: any[]
  ): { toCreate: any[]; toUpdate: any[]; toDelete: any[] } {
    const existingKeys = new Set(Object.keys(existingJson || {}));
    const incomingKeys = new Set(incoming.map(item => item.attributeName));

    const toCreate = incoming.filter(item => !existingKeys.has(item.attributeName));
    const toUpdate = incoming.filter(item => existingKeys.has(item.attributeName));
    const toDelete = Array.from(existingKeys)
      .filter(key => !incomingKeys.has(key))
      .map(key => ({ attributeName: key, attributeValue: existingJson[key] }));

    return { toCreate, toUpdate, toDelete };
  }

  /**
   * Compare arrays to determine create/update/delete operations
   */
  private compareArrays(
    existing: any[],
    incoming: any[],
    keyField: string
  ): { toCreate: any[]; toUpdate: any[]; toDelete: any[] } {
    const existingMap = new Map(existing.map(item => [item[keyField], item]));
    const incomingMap = new Map(incoming.map(item => [item[keyField], item]));

    const toCreate = incoming.filter(item => !existingMap.has(item[keyField]));
    const toUpdate = incoming.filter(item => existingMap.has(item[keyField]));
    const toDelete = existing.filter(item => !incomingMap.has(item[keyField]));

    return { toCreate, toUpdate, toDelete };
  }

  private normalizeLicenseLevelInput(value: any): { level: number | null; label: string | null; isValid: boolean } {
    if (value === undefined || value === null || value === '') {
      return { level: 1, label: 'ESSENTIAL', isValid: true };
    }

    if (typeof value === 'number' && !Number.isNaN(value)) {
      const levelNumber = value;
      const label = LICENSE_LEVEL_NUMBER_TO_NAME[levelNumber] || `LEVEL_${levelNumber}`;
      return { level: levelNumber, label, isValid: Boolean(LICENSE_LEVEL_NUMBER_TO_NAME[levelNumber]) };
    }

    const text = value.toString().trim();
    if (text === '') {
      return { level: 1, label: 'ESSENTIAL', isValid: true };
    }

    const numericValue = Number(text);
    if (!Number.isNaN(numericValue)) {
      const label = LICENSE_LEVEL_NUMBER_TO_NAME[numericValue] || `LEVEL_${numericValue}`;
      return { level: numericValue, label, isValid: Boolean(LICENSE_LEVEL_NUMBER_TO_NAME[numericValue]) };
    }

    const upper = text.toUpperCase();
    const mapped = LICENSE_LEVEL_NAME_TO_NUMBER[upper];
    if (mapped !== undefined) {
      return { level: mapped, label: upper, isValid: true };
    }

    return { level: null, label: upper || null, isValid: false };
  }

  private normalizeTaskLicenseLevel(value: any): LicenseLevel {
    if (value === undefined || value === null || value === '') {
      return 'ESSENTIAL';
    }

    if (typeof value === 'number' && !Number.isNaN(value)) {
      return LICENSE_LEVEL_NUMBER_TO_NAME[value] ?? 'ESSENTIAL';
    }

    const text = value.toString().trim();
    if (text === '') {
      return 'ESSENTIAL';
    }

    const numericValue = Number(text);
    if (!Number.isNaN(numericValue) && LICENSE_LEVEL_NUMBER_TO_NAME[numericValue]) {
      return LICENSE_LEVEL_NUMBER_TO_NAME[numericValue];
    }

    const upper = text.toUpperCase();
    if (LICENSE_LEVEL_NAME_TO_NUMBER[upper] !== undefined) {
      return upper as LicenseLevel;
    }

    return 'ESSENTIAL';
  }

  private resolveTaskEntityIds(values: string[] | undefined, entityMap: Map<string, string>): string[] {
    if (!values || values.length === 0) {
      return [];
    }

    const ids = new Set<string>();
    for (const raw of values) {
      if (!raw) continue;
      const trimmed = raw.trim();
      const numeric = Number(trimmed);

      const candidates = [trimmed];
      if (!Number.isNaN(numeric)) {
        candidates.push(numeric.toString());
      }

      for (const candidate of candidates) {
        const id = entityMap.get(candidate);
        if (id) {
          ids.add(id);
          break;
        }
      }
    }

    return Array.from(ids);
  }

  private extractLicenseLevelLabel(license: any): LicenseLevel | null {
    if (!license) return null;
    if (license.levelName) {
      return this.normalizeTaskLicenseLevel(license.levelName);
    }
    if (license.level !== undefined && license.level !== null) {
      return this.normalizeTaskLicenseLevel(license.level);
    }
    return null;
  }

  private validateTaskReferences(
    tasks: any[],
    licensesData: any[],
    outcomesData: any[],
    releasesData: any[],
    existingProduct: any,
    errors: ValidationError[]
  ) {
    // Validate Total Weight
    let totalWeight = 0;
    tasks.forEach(task => {
      totalWeight += (Number(task.weight) || 0);
    });

    if (totalWeight > 100) {
      errors.push({
        sheet: 'Tasks',
        field: 'Weight',
        message: `Total task weight is ${totalWeight}, but it must not exceed 100.`,
        severity: 'error'
      });
    }

    const licenseNames = new Set<string>();
    const licenseLevels = new Set<LicenseLevel>([
      'ESSENTIAL',
      'ADVANTAGE',
      'SIGNATURE'
    ]);

    const registerLicense = (license: any) => {
      if (!license) return;
      const name = license.name?.toString().trim();
      if (name) {
        licenseNames.add(name);
      }
      const levelLabel = this.extractLicenseLevelLabel(license);
      if (levelLabel) {
        licenseLevels.add(levelLabel);
      }
    };

    licensesData.forEach(registerLicense);
    if (existingProduct?.licenses) {
      existingProduct.licenses.forEach((license: any) => registerLicense({
        name: license.name,
        level: license.level
      }));
    }

    const outcomeNames = new Set<string>();
    outcomesData.forEach((outcome: any) => {
      const name = outcome?.name?.toString().trim();
      if (name) {
        outcomeNames.add(name);
      }
    });
    if (existingProduct?.outcomes) {
      existingProduct.outcomes.forEach((outcome: any) => {
        const name = outcome?.name?.toString().trim();
        if (name) {
          outcomeNames.add(name);
        }
      });
    }

    const releaseNames = new Set<string>();
    const releaseLevels = new Set<string>();
    const registerRelease = (release: any) => {
      if (!release) return;
      const name = release.name?.toString().trim();
      if (name) {
        releaseNames.add(name);
      }
      const levelValue = release.level;
      if (levelValue !== undefined && levelValue !== null && levelValue !== '') {
        const numeric = Number(levelValue);
        if (!Number.isNaN(numeric)) {
          releaseLevels.add(numeric.toString());
        } else if (typeof levelValue === 'string') {
          const trimmed = levelValue.trim();
          if (trimmed) {
            releaseLevels.add(trimmed);
          }
        }
      }
    };

    releasesData.forEach(registerRelease);
    if (existingProduct?.releases) {
      existingProduct.releases.forEach((release: any) => registerRelease({
        name: release.name,
        level: release.level
      }));
    }

    const allowedLicenseDisplay = Array.from(licenseLevels).sort().join(', ') || 'No licenses defined';
    const allowedOutcomeDisplay = Array.from(outcomeNames).sort().join(', ') || 'No outcomes defined';
    const allowedReleaseTokens = new Set<string>([...releaseNames, ...releaseLevels]);
    const allowedReleaseDisplay = Array.from(new Set([...releaseNames, ...releaseLevels])).sort().join(', ') || 'No releases defined';

    for (const task of tasks) {
      const row = task.__rowNumber;
      const taskName = task.name || 'Unnamed Task';

      if (task.licenseLevel) {
        const normalizedLicense = this.normalizeTaskLicenseLevel(task.licenseLevel);
        if (licenseLevels.size > 0 && !licenseLevels.has(normalizedLicense)) {
          errors.push({
            sheet: 'Tasks',
            row,
            field: 'License Level',
            message: `Task "${taskName}" references license level "${task.licenseLevel}" that is not defined. Allowed values: ${allowedLicenseDisplay}.`,
            severity: 'error'
          });
        } else {
          task.licenseLevel = normalizedLicense;
        }
      }

      // License name is informational only - we use license level for actual assignment
      // No warning needed if license name doesn't match

      if (task.outcomes && task.outcomes.length > 0) {
        for (const outcomeName of task.outcomes) {
          if (!outcomeName) continue;
          if (outcomeNames.size > 0 && !outcomeNames.has(outcomeName)) {
            errors.push({
              sheet: 'Tasks',
              row,
              field: 'Outcomes',
              message: `Task "${taskName}" references outcome "${outcomeName}" that is not defined. Allowed values: ${allowedOutcomeDisplay}.`,
              severity: 'error'
            });
          }
        }
      }

      if (task.releases && task.releases.length > 0) {
        for (const releaseName of task.releases) {
          if (!releaseName) continue;
          const trimmed = releaseName.trim();
          const numeric = Number(trimmed);
          const normalizedToken = Number.isNaN(numeric) ? trimmed : numeric.toString();
          if (allowedReleaseTokens.size > 0 && !allowedReleaseTokens.has(trimmed) && !allowedReleaseTokens.has(normalizedToken)) {
            errors.push({
              sheet: 'Tasks',
              row,
              field: 'Releases',
              message: `Task "${taskName}" references release "${releaseName}" that is not defined. Allowed values: ${allowedReleaseDisplay}.`,
              severity: 'error'
            });
          }
        }
      }
    }
  }

  /**
   * Compare telemetry attributes across tasks
   */
  private compareTelemetryAttributes(
    existingTasks: any[],
    incomingTasks: any[],
    telemetryData: any[]
  ): { toCreate: any[]; toUpdate: any[]; toDelete: any[] } {
    // For simplicity, we'll recreate all telemetry attributes
    // In production, you might want more sophisticated comparison
    return {
      toCreate: telemetryData,
      toUpdate: [],
      toDelete: []
    };
  }
}
