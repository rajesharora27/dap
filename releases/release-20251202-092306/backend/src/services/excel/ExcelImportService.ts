import ExcelJS from 'exceljs';
import { PrismaClient, LicenseLevel } from '@prisma/client';

const prisma = new PrismaClient();

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
        customAttributes: this.compareArrays(
          existingProduct?.customAttributes || [],
          customAttributesData,
          'attributeName'
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

    // Check for validation errors
    if (preview.validationErrors.length > 0) {
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
        errors: preview.validationErrors,
        warnings: preview.warnings
      };
    }

    // Perform import in a transaction
    try {
      const result = await prisma.$transaction(async (tx) => {
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
        existingOutcomes.forEach(o => outcomeMap.set(o.name, o.id));

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
        existingReleases.forEach(r => {
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
        existingLicenses.forEach(l => licenseMap.set(l.name, l.id));

        // Import custom attributes
        for (const attr of preview.changes.customAttributes.toCreate) {
          await tx.customAttribute.create({
            data: {
              attributeName: attr.attributeName,
              attributeValue: attr.attributeValue || '',
              dataType: attr.dataType || 'TEXT',
              description: attr.description || '',
              isRequired: attr.isRequired ?? false,
              displayOrder: attr.displayOrder || 0,
              productId
            }
          });
        }

        for (const attr of preview.changes.customAttributes.toUpdate) {
          const existing = await tx.customAttribute.findFirst({
            where: { attributeName: attr.attributeName, productId }
          });
          if (existing) {
            await tx.customAttribute.update({
              where: { id: existing.id },
              data: {
                attributeValue: attr.attributeValue || '',
                dataType: attr.dataType || 'TEXT',
                description: attr.description || '',
                isRequired: attr.isRequired ?? false,
                displayOrder: attr.displayOrder || 0
              }
            });
          }
        }

        // Import tasks last to ensure dependencies exist
        for (const task of preview.changes.tasks.toCreate) {
          const outcomeIds = this.resolveTaskEntityIds(task.outcomes, outcomeMap);
          const releaseIds = this.resolveTaskEntityIds(task.releases, releaseMap);
          const licenseLevel = this.normalizeTaskLicenseLevel(task.licenseLevel);

          const created = await tx.task.create({
            data: {
              name: task.name,
              description: task.description || '',
              estMinutes: task.estMinutes || 60,
              weight: task.weight || 1,
              sequenceNumber: task.sequenceNumber || 1,
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
        warnings: preview.warnings
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
   * Parse Product Info sheet (Tab 1)
   */
  private parseProductInfoSheet(
    workbook: ExcelJS.Workbook,
    errors: ValidationError[]
  ): any {
    const sheet = workbook.getWorksheet('Product Info');
    if (!sheet) {
      errors.push({
        sheet: 'Product Info',
        message: 'Product Info sheet not found',
        severity: 'error'
      });
      return { name: '', description: '' };
    }

    const data: any = {};
    
    // Parse vertical layout (Field | Value)
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const field = row.getCell(1).value?.toString().trim();
      const value = row.getCell(2).value?.toString().trim();
      
      if (field === 'Product Name') data.name = value;
      else if (field === 'Description') data.description = value;
    });

    if (!data.name) {
      errors.push({
        sheet: 'Product Info',
        field: 'Product Name',
        message: 'Product Name is required',
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
    const sheet = workbook.getWorksheet('Tasks');
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
          const header = headers[colNumber];
          const value = cell.value?.toString().trim();
          
          if (header === 'Task Name') task.name = value;
          else if (header === 'Description') task.description = value;
          else if (header === 'License Level') task.licenseLevel = value;
          else if (header === 'License Name') task.licenseName = value;
          else if (header === 'Est. Minutes') task.estMinutes = parseInt(value || '60');
          else if (header === 'Weight') task.weight = parseFloat(value || '1');
          else if (header === 'Sequence Number') task.sequenceNumber = parseInt(value || '1');
          else if (header === 'Priority') task.priority = value;
          else if (header === 'How-To Doc') task.howToDoc = value;
          else if (header === 'How-To Video') task.howToVideo = value;
          else if (header === 'Outcomes') task.outcomes = value ? value.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
          else if (header === 'Releases') task.releases = value ? value.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
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
    const sheet = workbook.getWorksheet('Licenses');
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
          const header = headers[colNumber];
          const value = cell.value?.toString().trim();
          
          if (header === 'License Name') license.name = value;
          else if (header === 'Description') license.description = value;
          else if (header === 'Level') {
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
          else if (header === 'Is Active') license.isActive = value?.toLowerCase() === 'true' || value === '1';
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
    const sheet = workbook.getWorksheet('Outcomes');
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
          const header = headers[colNumber];
          const value = cell.value?.toString().trim();
          
          if (header === 'Outcome Name') outcome.name = value;
          else if (header === 'Description') outcome.description = value;
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
    const sheet = workbook.getWorksheet('Releases');
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
          const header = headers[colNumber];
          const value = cell.value?.toString().trim();
          
          if (header === 'Release Name') release.name = value;
          else if (header === 'Description') release.description = value;
          else if (header === 'Level') release.level = parseFloat(value || '1.0');
          else if (header === 'Is Active') release.isActive = value?.toLowerCase() === 'true' || value === '1';
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
    const sheet = workbook.getWorksheet('Custom Attributes');
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
          const header = headers[colNumber];
          const value = cell.value?.toString().trim();
          
          if (header === 'Attribute Name') attr.attributeName = value;
          else if (header === 'Value') attr.attributeValue = value;
          else if (header === 'Data Type') attr.dataType = value;
          else if (header === 'Description') attr.description = value;
          else if (header === 'Is Required') attr.isRequired = value?.toLowerCase() === 'true' || value === '1';
          else if (header === 'Display Order') attr.displayOrder = parseInt(value || '0');
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
    const sheet = workbook.getWorksheet('Telemetry');
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
          const header = headers[colNumber];
          const value = cell.value?.toString().trim();
          
          if (header === 'Task Name') attr.taskName = value;
          else if (header === 'Attribute Name') attr.attributeName = value;
          else if (header === 'Operator') attr.operator = value;
          else if (header === 'Expected Value') attr.expectedValue = value;
          else if (header === 'Data Type') attr.dataType = value;
        });
        
        if (attr.taskName && attr.attributeName) {
          attributes.push(attr);
        }
      }
    });

    return attributes;
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
  const licenseNames = new Set<string>();
  const licenseLevels = new Set<LicenseLevel>();

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

      if (task.licenseName) {
        const name = task.licenseName.trim();
        if (licenseNames.size > 0 && !licenseNames.has(name)) {
          errors.push({
            sheet: 'Tasks',
            row,
            field: 'License Name',
            message: `Task "${taskName}" references license "${task.licenseName}" that is not defined for this product.`,
            severity: 'error'
          });
        }
      }

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
