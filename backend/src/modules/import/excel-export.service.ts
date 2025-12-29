/**
 * Excel Import/Export - Export Service
 * 
 * Generates Excel workbooks using shared column definitions to ensure
 * round-trip compatibility with the import system.
 */

import ExcelJS from 'exceljs';
import { prisma } from '../../shared/graphql/context';
import {
    PRODUCT_WORKBOOK_SHEETS,
    SOLUTION_WORKBOOK_SHEETS
} from './columns';
import { ColumnDefinition } from './types';

/**
 * Produces a deterministic JSON string with sorted keys.
 * This ensures round-trip compatibility by eliminating key order differences.
 */
function stableStringify(obj: unknown): string {
    if (obj === null || obj === undefined) return '';
    if (typeof obj !== 'object') return String(obj);
    if (Array.isArray(obj)) {
        return '[' + obj.map(stableStringify).join(',') + ']';
    }
    const sortedKeys = Object.keys(obj as object).sort();
    const pairs = sortedKeys.map(k => `${JSON.stringify(k)}:${stableStringify((obj as any)[k])}`);
    return '{' + pairs.join(',') + '}';
}

/**
 * Normalizes operator to canonical short form.
 * This ensures consistency between export and import.
 */
function normalizeOperator(op: string): string {
    const normalized = (op || 'equals').toLowerCase().trim();
    const mapping: Record<string, string> = {
        'greater_than': 'gt',
        'greater_than_or_equal': 'gte',
        'less_than': 'lt',
        'less_than_or_equal': 'lte',
        'equal': 'equals',
        'not_equal': 'not_equals',
    };
    return mapping[normalized] || normalized;
}


export interface ExportResult {
    filename: string;
    buffer: Buffer;
    size: number;
    mimeType: string;
    stats: {
        tasksExported: number;
        customAttributesExported: number;
        licensesExported: number;
        outcomesExported: number;
        releasesExported: number;
        resourcesExported: number;
        telemetryAttributesExported: number;
    };
}

export class ExcelExportService {

    /**
     * Export a product to Excel V2 format
     */
    async exportProduct(productId: string): Promise<ExportResult> {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                tasks: {
                    where: { deletedAt: null },
                    orderBy: { sequenceNumber: 'asc' },
                    include: {
                        outcomes: { include: { outcome: true } },
                        releases: { include: { release: true } },
                        taskTags: { include: { tag: true } },
                        telemetryAttributes: true
                    }
                },
                licenses: { where: { deletedAt: null } },
                outcomes: true,
                releases: { where: { deletedAt: null } },
                tags: true,
                customAttributes: { orderBy: { displayOrder: 'asc' } }
            }
        });

        if (!product) {
            throw new Error(`Product not found: ${productId}`);
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'DAP Export Service V2';
        workbook.created = new Date();
        workbook.modified = new Date();

        // 1. Product Info
        const infoData = [{
            id: product.id,
            name: product.name,
            description: product.description
        }];
        this.createSheet(workbook, PRODUCT_WORKBOOK_SHEETS[0], infoData);

        // 2. Tasks
        const taskData = product.tasks.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            weight: Number(t.weight),
            sequenceNumber: t.sequenceNumber,
            estMinutes: t.estMinutes,
            licenseLevel: t.licenseLevel ? t.licenseLevel.charAt(0).toUpperCase() + t.licenseLevel.slice(1).toLowerCase() : 'Essential',
            notes: t.notes,
            howToDoc: t.howToDoc,
            howToVideo: t.howToVideo,
            outcomes: t.outcomes.map((o: any) => o.outcome.name).sort(),
            releases: t.releases.map((r: any) => r.release.name).sort(),
            tags: t.taskTags.map((tag: any) => tag.tag.name).sort()
        }));
        this.createSheet(workbook, PRODUCT_WORKBOOK_SHEETS[1], taskData);

        // 3. Licenses
        const licenseData = product.licenses.map((l: any) => ({
            id: l.id,
            name: l.name,
            level: l.level,
            description: l.description
        })).sort((a: any, b: any) => a.level - b.level);
        this.createSheet(workbook, PRODUCT_WORKBOOK_SHEETS[2], licenseData);

        // 4. Outcomes
        const outcomeData = product.outcomes.map((o: any) => ({
            id: o.id,
            name: o.name,
            description: o.description
        })).sort((a: any, b: any) => a.name.localeCompare(b.name));
        this.createSheet(workbook, PRODUCT_WORKBOOK_SHEETS[3], outcomeData);

        // 5. Releases
        const releaseData = product.releases.map((r: any) => ({
            id: r.id,
            name: r.name,
            level: r.level,
            description: r.description
        })).sort((a: any, b: any) => a.level - b.level);
        this.createSheet(workbook, PRODUCT_WORKBOOK_SHEETS[4], releaseData);

        // 6. Tags
        const tagData = product.tags.map((t: any) => ({
            id: t.id,
            name: t.name,
            color: t.color,
            description: t.description
        })).sort((a: any, b: any) => a.name.localeCompare(b.name));
        this.createSheet(workbook, PRODUCT_WORKBOOK_SHEETS[5], tagData);

        // 7. Custom Attributes
        const attrData = product.customAttributes.map((ca: any) => ({
            id: ca.id,
            key: ca.attributeName,
            value: ca.attributeValue,
            displayOrder: ca.displayOrder
        }));

        // Include legacy JSON attributes if they don't exist in table
        if (product.customAttrs && typeof product.customAttrs === 'object') {
            const existingKeys = new Set(attrData.map((a: any) => a.key));
            Object.entries(product.customAttrs).forEach(([key, value], index) => {
                if (!existingKeys.has(key)) {
                    attrData.push({
                        id: undefined,
                        key: key,
                        value: String(value),
                        displayOrder: 1000 + index
                    });
                }
            });
        }
        this.createSheet(workbook, PRODUCT_WORKBOOK_SHEETS[6], attrData);

        // 8. Resources
        const resourcesData = (product.resources || []).map((r: any) => ({
            label: r.label,
            url: r.url
        }));
        this.createSheet(workbook, PRODUCT_WORKBOOK_SHEETS[7], resourcesData);

        // 9. Telemetry Attributes
        const telemetryData: any[] = [];
        product.tasks.forEach((t: any) => {
            t.telemetryAttributes.forEach((ta: any) => {
                telemetryData.push({
                    taskName: t.name,
                    attributeName: ta.name,
                    attributeType: (ta.dataType || 'string').toLowerCase(),
                    expectedValue: this.getTelemetryValue(ta.successCriteria),
                    operator: this.getTelemetryOperator(ta.successCriteria),
                    isRequired: ta.isRequired ?? true
                });
            });
        });
        this.createSheet(workbook, PRODUCT_WORKBOOK_SHEETS[8], telemetryData);

        // 10. Instructions
        this.createInstructionsSheet(workbook);

        const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
        const timestamp = new Date().toISOString().slice(0, 10);

        return {
            filename: `${product.name}_v2_${timestamp}.xlsx`,
            buffer,
            size: buffer.length,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            stats: {
                tasksExported: taskData.length,
                customAttributesExported: attrData.length,
                licensesExported: licenseData.length,
                outcomesExported: outcomeData.length,
                releasesExported: releaseData.length,
                resourcesExported: resourcesData.length,
                telemetryAttributesExported: telemetryData.length
            }
        };
    }

    /**
     * Export a solution to Excel V2 format
     */
    async exportSolution(solutionId: string): Promise<ExportResult> {
        const solution = await prisma.solution.findUnique({
            where: { id: solutionId },
            include: {
                products: {
                    include: { product: true },
                    orderBy: { order: 'asc' }
                },
                tasks: {
                    orderBy: { sequenceNumber: 'asc' },
                    include: {
                        outcomes: { include: { outcome: true } },
                        releases: { include: { release: true } },
                        solutionTaskTags: { include: { tag: true } },
                        telemetryAttributes: true
                    }
                },
                licenses: true,
                outcomes: true,
                releases: true,
                tags: true,
            }
        });

        if (!solution) {
            throw new Error(`Solution not found: ${solutionId}`);
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'DAP Export Service V2';

        // 1. Solution Info
        const infoData = [{
            id: solution.id,
            name: solution.name,
            description: solution.description,
            linkedProducts: solution.products.map((p: any) => p.product.name).sort()
        }];
        this.createSheet(workbook, SOLUTION_WORKBOOK_SHEETS[0], infoData);

        // 2. Tasks
        const taskData = solution.tasks.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            weight: Number(t.weight),
            sequenceNumber: t.sequenceNumber,
            estMinutes: t.estMinutes,
            licenseLevel: t.licenseLevel,
            notes: t.notes,
            howToDoc: t.howToDoc,
            howToVideo: t.howToVideo,
            outcomes: t.outcomes.map((o: any) => o.outcome.name).sort(),
            releases: t.releases.map((r: any) => r.release.name).sort(),
            tags: t.solutionTaskTags.map((tag: any) => tag.tag.name).sort()
        }));
        this.createSheet(workbook, SOLUTION_WORKBOOK_SHEETS[1], taskData);

        // 3. Licenses, 4. Outcomes, 5. Releases, 6. Tags
        this.createSheet(workbook, SOLUTION_WORKBOOK_SHEETS[2], solution.licenses.map((l: any) => ({ ...l, id: l.id })).sort((a: any, b: any) => a.level - b.level));
        this.createSheet(workbook, SOLUTION_WORKBOOK_SHEETS[3], solution.outcomes.map((o: any) => ({ ...o, id: o.id })).sort((a: any, b: any) => a.name.localeCompare(b.name)));
        this.createSheet(workbook, SOLUTION_WORKBOOK_SHEETS[4], solution.releases.map((r: any) => ({ ...r, id: r.id })).sort((a: any, b: any) => a.level - b.level));
        this.createSheet(workbook, SOLUTION_WORKBOOK_SHEETS[5], solution.tags.map((t: any) => ({ ...t, id: t.id })).sort((a: any, b: any) => a.name.localeCompare(b.name)));

        // 7. Custom Attributes
        this.createSheet(workbook, SOLUTION_WORKBOOK_SHEETS[6], []);

        // 8. Resources
        const resourcesData = (solution.resources || []).map((r: any) => ({
            label: r.label,
            url: r.url
        }));
        this.createSheet(workbook, SOLUTION_WORKBOOK_SHEETS[7], resourcesData);

        // 9. Telemetry
        const telemetryData: any[] = [];
        solution.tasks.forEach((t: any) => {
            t.telemetryAttributes.forEach((ta: any) => {
                telemetryData.push({
                    taskName: t.name,
                    attributeName: ta.name,
                    attributeType: (ta.dataType || 'string').toLowerCase(),
                    expectedValue: this.getTelemetryValue(ta.successCriteria),
                    operator: this.getTelemetryOperator(ta.successCriteria),
                    isRequired: ta.isRequired ?? true
                });
            });
        });
        this.createSheet(workbook, SOLUTION_WORKBOOK_SHEETS[8], telemetryData);

        // 10. Instructions
        this.createInstructionsSheet(workbook);

        const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
        const timestamp = new Date().toISOString().slice(0, 10);

        return {
            filename: `${solution.name}_solution_v2_${timestamp}.xlsx`,
            buffer,
            size: buffer.length,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            stats: {
                tasksExported: taskData.length,
                customAttributesExported: 0,
                licensesExported: solution.licenses.length,
                outcomesExported: solution.outcomes.length,
                releasesExported: solution.releases.length,
                resourcesExported: resourcesData.length,
                telemetryAttributesExported: telemetryData.length
            }
        };
    }

    private createSheet(workbook: ExcelJS.Workbook, def: { name: string, columns: ColumnDefinition[] }, data: any[]) {
        const sheet = workbook.addWorksheet(def.name);

        // Setup columns
        sheet.columns = def.columns.map(col => ({
            header: col.header,
            key: col.key,
            width: col.width,
            hidden: col.hidden
        }));

        // Style header
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };

        // Add rows
        data.forEach(item => {
            const rowData: any = {};
            def.columns.forEach(col => {
                let value = item[col.key];

                // Handle arrays -> comma strings
                if (col.type === 'array' && Array.isArray(value)) {
                    value = value.join(col.arraySeparator || ',');
                }

                rowData[col.key] = value;
            });
            sheet.addRow(rowData);
        });
    }

    /**
     * Create the Instructions helper sheet
     */
    private createInstructionsSheet(workbook: ExcelJS.Workbook) {
        const sheet = workbook.addWorksheet('Instructions');
        sheet.getColumn(1).width = 100;

        const instructions = [
            '═══════════════════════════════════════════════════════════════════',
            '  DAP EXCEL IMPORT/EXPORT V2 - USER GUIDE',
            '═══════════════════════════════════════════════════════════════════',
            '',
            'OVERVIEW:',
            '--------',
            'This Excel workbook defines a Product or Solution including its tasks,',
            'licenses, outcomes, releases, tags, custom attributes, and telemetry.',
            '',
            'You can edit this file and re-import it to update the entity in DAP.',
            'V2 system uses unique IDs (hidden) to track records across edits.',
            '',
            '═══════════════════════════════════════════════════════════════════',
            '',
            'QUICK START:',
            '-----------',
            '1. Edit the tabs you want to change (Tasks, Tags, etc.)',
            '2. Save the Excel file',
            '3. In DAP, click "Import from Excel"',
            '4. Upload this file and review the "Dry Run" report',
            '5. Click "Commit Import" to apply changes permanently',
            '',
            '═══════════════════════════════════════════════════════════════════',
            '',
            'TAB-BY-TAB GUIDE:',
            '----------------',
            '',
            'Tab 1: Product/Solution Info',
            '----------------------------',
            '• Name: UNIQUE identifier. ID is hidden in column A.',
            '• Changing the ID to blank will trigger a NEW record creation.',
            '',
            'Tab 2: Tasks',
            '-----------',
            '• Task Name: UNIQUE within this context.',
            '• Outcomes/Releases/Tags: Comma-separated names from respective tabs.',
            '• License Level: Must match one of the predefined levels.',
            '• Row Deletion: Removing a row will DELETE the task in DAP on commit.',
            '',
            'Tab 6: Tags',
            '-----------',
            '• Define tag names, colors (Hex code like #FF5733), and descriptions.',
            '• Tags missing from this tab but present in Tasks will cause validation errors.',
            '',
            'Tab 7: Custom Attributes',
            '-----------------------',
            '• Add key/value pairs to add custom metadata to the product.',
            '',
            'Tab 8: Telemetry',
            '---------------',
            '• Advanced settings for automated progress tracking.',
            '',
            '═══════════════════════════════════════════════════════════════════',
            '',
            'SAFE MODE:',
            '----------',
            'Import V2 always performs a "Dry Run" first. No data is changed ',
            'until you review the changes and click "Commit".',
            '',
            '═══════════════════════════════════════════════════════════════════'
        ];

        instructions.forEach(line => {
            const row = sheet.addRow([line]);
            if (line.startsWith('═══')) {
                row.font = { bold: true, color: { argb: 'FF4472C4' } };
            } else if (line.includes(':') && !line.startsWith(' ')) {
                row.font = { bold: true };
            }
        });
    }
    private getTelemetryOperator(criteria: any): string {
        if (!criteria) return 'equals';
        if (typeof criteria === 'string') {
            try { criteria = JSON.parse(criteria); } catch { return 'equals'; }
        }

        if (criteria.operator && !criteria.type) return normalizeOperator(criteria.operator);

        switch (criteria.type) {
            case 'boolean_flag': return 'equals';
            case 'number_threshold': return normalizeOperator(criteria.operator);
            case 'string_match': return criteria.mode === 'exact' ? 'equals' : 'contains';
            case 'string_not_null': return 'not_null';
            case 'timestamp_not_null': return 'not_null';
            case 'timestamp_comparison': return 'within_days';
            default: return 'equals';
        }
    }

    private getTelemetryValue(criteria: any): string {
        if (!criteria) return '';
        if (typeof criteria === 'string') {
            try { criteria = JSON.parse(criteria); } catch { return ''; }
        }

        if (criteria.value !== undefined && !criteria.type) {
            return typeof criteria.value === 'object' ? stableStringify(criteria.value) : String(criteria.value);
        }

        switch (criteria.type) {
            case 'boolean_flag': return String(criteria.expectedValue);
            case 'number_threshold': return String(criteria.threshold);
            case 'string_match': return String(criteria.pattern);
            case 'timestamp_comparison': return String(criteria.withinDays);
            default: return '';
        }
    }
}
