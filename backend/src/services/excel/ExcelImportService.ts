import ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
          }
        }

        // Get existing releases for mapping
        const existingReleases = await tx.release.findMany({
          where: { productId }
        });
        existingReleases.forEach(r => releaseMap.set(r.name, r.id));

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

        // Import tasks
        for (const task of preview.changes.tasks.toCreate) {
          const outcomeIds = task.outcomes
            ? task.outcomes.map((name: string) => outcomeMap.get(name)).filter(Boolean)
            : [];
          const releaseIds = task.releases
            ? task.releases.map((name: string) => releaseMap.get(name)).filter(Boolean)
            : [];

          const created = await tx.task.create({
            data: {
              name: task.name,
              description: task.description || '',
              estMinutes: task.estMinutes || 60,
              weight: task.weight || 1,
              sequenceNumber: task.sequenceNumber || 1,
              licenseLevel: task.licenseLevel || 'ESSENTIAL',
              priority: task.priority || 'Medium',
              howToDoc: task.howToDoc || '',
              howToVideo: task.howToVideo || '',
              productId,
              outcomes: {
                create: outcomeIds.map((id: string) => ({ outcomeId: id }))
              },
              releases: {
                create: releaseIds.map((id: string) => ({ releaseId: id }))
              }
            }
          });

          // Import telemetry attributes for this task
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
            const outcomeIds = task.outcomes
              ? task.outcomes.map((name: string) => outcomeMap.get(name)).filter(Boolean)
              : [];
            const releaseIds = task.releases
              ? task.releases.map((name: string) => releaseMap.get(name)).filter(Boolean)
              : [];

            await tx.task.update({
              where: { id: existing.id },
              data: {
                description: task.description || '',
                estMinutes: task.estMinutes || 60,
                weight: task.weight || 1,
                sequenceNumber: task.sequenceNumber || 1,
                licenseLevel: task.licenseLevel || 'ESSENTIAL',
                priority: task.priority || 'Medium',
                howToDoc: task.howToDoc || '',
                howToVideo: task.howToVideo || ''
              }
            });

            // Update task outcomes
            await tx.taskOutcome.deleteMany({
              where: { taskId: existing.id }
            });
            for (const outcomeId of outcomeIds) {
              await tx.taskOutcome.create({
                data: { taskId: existing.id, outcomeId }
              });
            }

            // Update task releases
            await tx.taskRelease.deleteMany({
              where: { taskId: existing.id }
            });
            for (const releaseId of releaseIds) {
              await tx.taskRelease.create({
                data: { taskId: existing.id, releaseId }
              });
            }

            // Update telemetry attributes
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
        const task: any = {};
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
          else if (header === 'Outcomes') task.outcomes = value ? value.split(',').map((s: string) => s.trim()) : [];
          else if (header === 'Releases') task.releases = value ? value.split(',').map((s: string) => s.trim()) : [];
        });
        
        if (task.name) {
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
        const license: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          const value = cell.value?.toString().trim();
          
          if (header === 'License Name') license.name = value;
          else if (header === 'Description') license.description = value;
          else if (header === 'Level') license.level = parseInt(value || '1');
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
        const outcome: any = {};
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
        const release: any = {};
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
