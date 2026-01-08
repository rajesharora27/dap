/**
 * Personal Telemetry Service
 * 
 * Handles import/export and evaluation of telemetry for Personal Sandbox tasks.
 */

import ExcelJS from 'exceljs';
import { prisma } from '../../shared/graphql/context';
import { v4 as uuidv4 } from 'uuid';
import { evaluateTelemetryAttribute, evaluateTaskStatusFromTelemetry } from '../telemetry/evaluation-engine';

export class PersonalTelemetryService {
    /**
     * Generate telemetry template for a personal product
     */
    static async generateTelemetryTemplate(personalProductId: string, userId: string): Promise<Buffer> {
        const product = await (prisma as any).personalProduct.findFirst({
            where: { id: personalProductId, userId },
            include: {
                tasks: {
                    orderBy: { sequenceNumber: 'asc' },
                    include: {
                        telemetryAttributes: {
                            orderBy: { order: 'asc' },
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

        if (!product) throw new Error('Personal product not found');

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'DAP System';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Telemetry_Data');
        worksheet.columns = [
            { header: 'Task Name', key: 'taskName', width: 30 },
            { header: 'Attribute Name', key: 'attributeName', width: 25 },
            { header: 'Data Type', key: 'dataType', width: 15 },
            { header: 'Required', key: 'required', width: 10 },
            { header: 'Operator', key: 'operator', width: 15 },
            { header: 'Expected Value', key: 'expectedValue', width: 20 },
            { header: 'Current Value', key: 'currentValue', width: 20 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Notes', key: 'notes', width: 30 }
        ];

        // Style header
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

        const today = new Date().toISOString().split('T')[0];
        let rowIndex = 2;

        for (const task of product.tasks) {
            for (const attribute of task.telemetryAttributes) {
                const latestValue = attribute.values[0];
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

                const row = worksheet.addRow({
                    taskName: task.name,
                    attributeName: attribute.name,
                    dataType: attribute.dataType,
                    required: attribute.isRequired ? 'Yes' : 'No',
                    operator: this.getOperator(attribute.successCriteria),
                    expectedValue: this.getValue(attribute.successCriteria),
                    currentValue: currentValue,
                    date: latestValue ? new Date(latestValue.createdAt).toISOString().split('T')[0] : today,
                    notes: ''
                });

                // Style editable cells
                ['G', 'H', 'I'].forEach(col => {
                    row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2CB' } };
                });
                // Style read-only cells
                ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
                    row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
                });

                rowIndex++;
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer as any);
    }

    /**
     * Import telemetry for a personal product
     */
    static async importTelemetry(personalProductId: string, userId: string, fileBuffer: Buffer) {
        const product = await (prisma as any).personalProduct.findFirst({
            where: { id: personalProductId, userId },
            include: {
                tasks: {
                    include: {
                        telemetryAttributes: true
                    }
                }
            }
        });

        if (!product) throw new Error('Personal product not found');

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer as any);

        const worksheet = workbook.getWorksheet('Telemetry_Data');
        if (!worksheet) throw new Error('Worksheet "Telemetry_Data" not found');

        const batchId = uuidv4();
        const errors: string[] = [];
        const taskResults = new Map<string, any>();

        // Get headers and mapping
        const headerRow = worksheet.getRow(1);
        const headers: string[] = [];
        headerRow.eachCell((cell, colNum) => { headers[colNum] = cell.value?.toString() || ''; });

        const colIndex = {
            taskName: headers.indexOf('Task Name'),
            attrName: headers.indexOf('Attribute Name'),
            value: headers.indexOf('Current Value'),
            date: headers.indexOf('Date'),
            notes: headers.indexOf('Notes')
        };

        for (let i = 2; i <= worksheet.rowCount; i++) {
            const row = worksheet.getRow(i);
            const taskName = row.getCell(colIndex.taskName).value?.toString().trim();
            const attrName = row.getCell(colIndex.attrName).value?.toString().trim();
            const valueRaw = row.getCell(colIndex.value).value;
            const notes = row.getCell(colIndex.notes).value?.toString() || '';

            if (!taskName || !attrName || valueRaw === null || valueRaw === undefined) continue;

            const task = product.tasks.find((t: any) => t.name === taskName);
            if (!task) {
                errors.push(`Row ${i}: Task "${taskName}" not found`);
                continue;
            }

            const attribute = task.telemetryAttributes.find((a: any) => a.name === attrName);
            if (!attribute) {
                errors.push(`Row ${i}: Attribute "${attrName}" not found for task "${taskName}"`);
                continue;
            }

            try {
                // Parse and save value
                const value = await (prisma as any).personalTelemetryValue.create({
                    data: {
                        personalAttributeId: attribute.id,
                        value: String(valueRaw),
                        source: 'import',
                        batchId,
                        notes
                    }
                });

                // Evaluate
                const evaluation = await evaluateTelemetryAttribute({
                    ...attribute,
                    values: [{ value: valueRaw }]
                });

                await (prisma as any).personalTelemetryAttribute.update({
                    where: { id: attribute.id },
                    data: {
                        isMet: evaluation.success,
                        lastCheckedAt: new Date()
                    }
                });

                // Track result
                if (!taskResults.has(task.id)) {
                    taskResults.set(task.id, {
                        taskId: task.id,
                        taskName: task.name,
                        attributesUpdated: 0,
                        criteriaMet: 0,
                        criteriaTotal: task.telemetryAttributes.length,
                        completionPercentage: 0,
                        errors: []
                    });
                }
                const res = taskResults.get(task.id);
                res.attributesUpdated++;
                if (evaluation.success) res.criteriaMet++;

            } catch (err: any) {
                errors.push(`Row ${i}: ${err.message}`);
            }
        }

        // Final task status re-evaluation
        for (const taskId of taskResults.keys()) {
            const task = await (prisma as any).personalTask.findUnique({
                where: { id: taskId },
                include: { telemetryAttributes: { include: { values: { orderBy: { createdAt: 'desc' }, take: 1 } } } }
            });
            if (task) {
                const { newStatus, shouldUpdate } = await evaluateTaskStatusFromTelemetry(
                    { status: task.status, statusUpdateSource: task.statusUpdateSource },
                    task.telemetryAttributes,
                    { currentBatchId: batchId }
                );

                if (shouldUpdate) {
                    await (prisma as any).personalTask.update({
                        where: { id: taskId },
                        data: {
                            status: newStatus as any,
                            statusUpdateSource: 'TELEMETRY',
                            statusUpdatedAt: new Date()
                        }
                    });
                }
            }
        }

        return {
            success: true,
            batchId,
            summary: {
                tasksProcessed: taskResults.size,
                attributesUpdated: Array.from(taskResults.values()).reduce((s, r) => s + r.attributesUpdated, 0),
                criteriaEvaluated: Array.from(taskResults.values()).reduce((s, r) => s + r.criteriaTotal, 0),
                errors
            },
            taskResults: Array.from(taskResults.values()).map(r => ({
                ...r,
                completionPercentage: r.criteriaTotal > 0 ? (r.criteriaMet / r.criteriaTotal) * 100 : 0
            }))
        };
    }

    /**
     * Evaluate single task telemetry
     */
    static async evaluateTaskTelemetry(personalTaskId: string, userId: string) {
        const task = await (prisma as any).personalTask.findUnique({
            where: { id: personalTaskId },
            include: {
                personalProduct: true,
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

        if (!task || task.personalProduct.userId !== userId) throw new Error('Task not found');

        // Evaluate each attribute
        for (const attr of task.telemetryAttributes) {
            if (!attr.isActive || attr.values.length === 0) continue;
            const evaluation = await evaluateTelemetryAttribute(attr);
            await (prisma as any).personalTelemetryAttribute.update({
                where: { id: attr.id },
                data: { isMet: evaluation.success, lastCheckedAt: new Date() }
            });
        }

        // Re-fetch with updated attributes
        const updatedTask = await (prisma as any).personalTask.findUnique({
            where: { id: personalTaskId },
            include: {
                telemetryAttributes: {
                    include: {
                        values: { orderBy: { createdAt: 'desc' }, take: 1 }
                    }
                }
            }
        });

        const { newStatus, shouldUpdate } = await evaluateTaskStatusFromTelemetry(
            { status: task.status, statusUpdateSource: task.statusUpdateSource },
            updatedTask!.telemetryAttributes
        );

        if (shouldUpdate) {
            return (prisma as any).personalTask.update({
                where: { id: personalTaskId },
                data: {
                    status: newStatus as any,
                    statusUpdateSource: 'TELEMETRY',
                    statusUpdatedAt: new Date()
                },
                include: {
                    outcomes: { include: { personalOutcome: true } },
                    releases: { include: { personalRelease: true } },
                    taskTags: { include: { personalTag: true } },
                    telemetryAttributes: true
                }
            });
        }

        return updatedTask;
    }

    private static getOperator(criteria: any): string {
        if (!criteria) return '';
        if (typeof criteria === 'string') { try { criteria = JSON.parse(criteria); } catch { return ''; } }
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
        if (typeof criteria === 'string') { try { criteria = JSON.parse(criteria); } catch { return ''; } }
        switch (criteria.type) {
            case 'boolean_flag': return String(criteria.expectedValue);
            case 'number_threshold': return String(criteria.threshold);
            case 'string_match': return String(criteria.pattern);
            case 'timestamp_comparison': return String(criteria.withinDays);
            default: return '';
        }
    }
}
