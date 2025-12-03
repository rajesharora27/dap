import ExcelJS from 'exceljs';
import { ApolloClient } from '@apollo/client';
import {
    UPDATE_PRODUCT,
    CREATE_OUTCOME, UPDATE_OUTCOME,
    CREATE_LICENSE, UPDATE_LICENSE,
    CREATE_RELEASE, UPDATE_RELEASE,
    CREATE_TASK, UPDATE_TASK,
    CREATE_TELEMETRY_ATTRIBUTE, UPDATE_TELEMETRY_ATTRIBUTE
} from '../graphql/mutations';
import { TASKS_FOR_PRODUCT } from '../graphql/queries';

const toPlainString = (val: any) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object' && val.richText) {
        return val.richText.map((t: any) => t.text).join('');
    }
    return String(val);
};

const normalizeLicenseLevel = (level?: string | number): string | undefined => {
    if (level === undefined || level === null) return undefined;
    if (typeof level === 'number') {
        if (level >= 2.5) return 'Signature';
        if (level >= 1.5) return 'Advantage';
        return 'Essential';
    }
    const normalized = level.trim().toLowerCase();
    if (!normalized) return undefined;
    if (normalized.includes('sign')) return 'Signature';
    if (normalized.includes('adv')) return 'Advantage';
    return 'Essential';
};

export const importProductData = async (
    file: File,
    client: ApolloClient<any>,
    productId: string,
    existingProductData: any,
    onProgress: (msg: string) => void
) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const collectedErrors: string[] = [];

    const recordError = (msg: string, err: any) => {
        console.error(msg, err);
        collectedErrors.push(`${msg}: ${err.message || err}`);
        errorCount++;
    };

    // 1. Simple Attributes
    onProgress('Importing simple attributes...');
    const simpleSheet = workbook.getWorksheet('Simple Attributes');
    if (simpleSheet) {
        const updates: any = {};
        simpleSheet.eachRow((row, rowNumber) => {
            const field = toPlainString(row.getCell(1).value).trim().toLowerCase();
            const value = toPlainString(row.getCell(2).value).trim();
            if (field === 'name') updates.name = value;
            if (field === 'description') updates.description = value;
        });

        if (Object.keys(updates).length > 0) {
            try {
                await client.mutate({
                    mutation: UPDATE_PRODUCT,
                    variables: { id: productId, input: { ...updates, customAttrs: existingProductData.customAttrs } }
                });
                updatedCount++;
            } catch (e) {
                recordError('Failed to update simple attributes', e);
            }
        }
    }

    // 2. Outcomes
    onProgress('Importing outcomes...');
    const outcomesSheet = workbook.getWorksheet('Outcomes');
    const outcomesByName = new Map();
    existingProductData.outcomes?.forEach((o: any) => outcomesByName.set(o.name.toLowerCase().trim(), o));

    if (outcomesSheet) {
        const rows: any[] = [];
        outcomesSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            rows.push({
                name: toPlainString(row.getCell(1).value).trim(),
                description: toPlainString(row.getCell(2).value).trim()
            });
        });

        for (const row of rows) {
            if (!row.name) continue;
            try {
                const existing = outcomesByName.get(row.name.toLowerCase());
                if (existing) {
                    if (existing.description !== row.description) {
                        await client.mutate({
                            mutation: UPDATE_OUTCOME,
                            variables: { id: existing.id, input: { name: row.name, description: row.description } }
                        });
                        updatedCount++;
                    }
                } else {
                    const res = await client.mutate({
                        mutation: CREATE_OUTCOME,
                        variables: { input: { productId, name: row.name, description: row.description } }
                    });
                    if (res.data?.createOutcome) {
                        outcomesByName.set(res.data.createOutcome.name.toLowerCase().trim(), res.data.createOutcome);
                        createdCount++;
                    }
                }
            } catch (e) {
                recordError(`Failed to save outcome "${row.name}"`, e);
            }
        }
    }

    // 3. Licenses
    onProgress('Importing licenses...');
    const licensesSheet = workbook.getWorksheet('Licenses');
    const licensesByName = new Map();
    existingProductData.licenses?.forEach((l: any) => licensesByName.set(l.name.toLowerCase().trim(), l));

    if (licensesSheet) {
        const rows: any[] = [];
        licensesSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            rows.push({
                name: toPlainString(row.getCell(1).value).trim(),
                description: toPlainString(row.getCell(2).value).trim(),
                level: toPlainString(row.getCell(3).value).trim(),
                isActive: toPlainString(row.getCell(4).value).trim().toLowerCase() === 'true'
            });
        });

        for (const row of rows) {
            if (!row.name) continue;
            const level = normalizeLicenseLevel(row.level) === 'Signature' ? 3 : normalizeLicenseLevel(row.level) === 'Advantage' ? 2 : 1;
            try {
                const existing = licensesByName.get(row.name.toLowerCase());
                if (existing) {
                    if (existing.description !== row.description || existing.level !== level || existing.isActive !== row.isActive) {
                        await client.mutate({
                            mutation: UPDATE_LICENSE,
                            variables: { id: existing.id, input: { name: row.name, description: row.description, level, isActive: row.isActive } }
                        });
                        updatedCount++;
                    }
                } else {
                    const res = await client.mutate({
                        mutation: CREATE_LICENSE,
                        variables: { input: { productId, name: row.name, description: row.description, level, isActive: row.isActive } }
                    });
                    if (res.data?.createLicense) {
                        licensesByName.set(res.data.createLicense.name.toLowerCase().trim(), res.data.createLicense);
                        createdCount++;
                    }
                }
            } catch (e) {
                recordError(`Failed to save license "${row.name}"`, e);
            }
        }
    }

    // 4. Releases
    onProgress('Importing releases...');
    const releasesSheet = workbook.getWorksheet('Releases');
    const releasesByName = new Map();
    existingProductData.releases?.forEach((r: any) => releasesByName.set(r.name.toLowerCase().trim(), r));

    if (releasesSheet) {
        const rows: any[] = [];
        releasesSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            rows.push({
                name: toPlainString(row.getCell(1).value).trim(),
                description: toPlainString(row.getCell(2).value).trim(),
                level: parseInt(toPlainString(row.getCell(3).value).trim()) || 1,
                isActive: toPlainString(row.getCell(4).value).trim().toLowerCase() === 'true'
            });
        });

        for (const row of rows) {
            if (!row.name) continue;
            try {
                const existing = releasesByName.get(row.name.toLowerCase());
                if (existing) {
                    if (existing.description !== row.description || existing.level !== row.level || existing.isActive !== row.isActive) {
                        await client.mutate({
                            mutation: UPDATE_RELEASE,
                            variables: { id: existing.id, input: { name: row.name, description: row.description, level: row.level, isActive: row.isActive } }
                        });
                        updatedCount++;
                    }
                } else {
                    const res = await client.mutate({
                        mutation: CREATE_RELEASE,
                        variables: { input: { productId, name: row.name, description: row.description, level: row.level, isActive: row.isActive } }
                    });
                    if (res.data?.createRelease) {
                        releasesByName.set(res.data.createRelease.name.toLowerCase().trim(), res.data.createRelease);
                        createdCount++;
                    }
                }
            } catch (e) {
                recordError(`Failed to save release "${row.name}"`, e);
            }
        }
    }

    // 5. Tasks
    onProgress('Importing tasks...');
    const tasksSheet = workbook.getWorksheet('Tasks');
    if (tasksSheet) {
        // Fetch existing tasks
        const tasksRes = await client.query({
            query: TASKS_FOR_PRODUCT,
            variables: { productId },
            fetchPolicy: 'network-only'
        });
        const existingTasks = tasksRes.data?.tasks?.edges?.map((e: any) => e.node) || [];
        const tasksByName = new Map();
        existingTasks.forEach((t: any) => tasksByName.set(t.name.toLowerCase().trim(), t));

        const rows: any[] = [];
        tasksSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            rows.push({
                name: toPlainString(row.getCell(1).value).trim(),
                description: toPlainString(row.getCell(2).value).trim(),
                estMinutes: parseInt(toPlainString(row.getCell(3).value)) || 0,
                weight: parseInt(toPlainString(row.getCell(4).value)) || 0,
                sequenceNumber: parseInt(toPlainString(row.getCell(5).value)) || 0,
                licenseLevel: toPlainString(row.getCell(6).value).trim(),
                licenseName: toPlainString(row.getCell(7).value).trim(),
                outcomeNames: toPlainString(row.getCell(8).value).split(',').map((s: string) => s.trim()).filter(Boolean),
                releaseNames: toPlainString(row.getCell(9).value).split(',').map((s: string) => s.trim()).filter(Boolean),
                notes: toPlainString(row.getCell(10).value).trim()
            });
        });

        for (const row of rows) {
            if (!row.name) continue;
            try {
                const license = row.licenseName ? licensesByName.get(row.licenseName.toLowerCase()) : undefined;
                const outcomeIds = row.outcomeNames.map((n: string) => outcomesByName.get(n.toLowerCase())?.id).filter(Boolean);
                const releaseIds = row.releaseNames.map((n: string) => releasesByName.get(n.toLowerCase())?.id).filter(Boolean);
                const licenseLevel = normalizeLicenseLevel(row.licenseLevel) || normalizeLicenseLevel(license?.level) || 'Essential';

                const input: any = {
                    name: row.name,
                    description: row.description,
                    estMinutes: row.estMinutes,
                    weight: row.weight,
                    sequenceNumber: row.sequenceNumber,
                    licenseLevel,
                    licenseId: license?.id,
                    outcomeIds,
                    releaseIds,
                    notes: row.notes
                };

                const existing = tasksByName.get(row.name.toLowerCase());
                if (existing) {
                    await client.mutate({
                        mutation: UPDATE_TASK,
                        variables: { id: existing.id, input }
                    });
                    updatedCount++;
                } else {
                    input.productId = productId;
                    const res = await client.mutate({
                        mutation: CREATE_TASK,
                        variables: { input }
                    });
                    if (res.data?.createTask) {
                        tasksByName.set(res.data.createTask.name.toLowerCase().trim(), res.data.createTask);
                        createdCount++;
                    }
                }
            } catch (e) {
                recordError(`Failed to save task "${row.name}"`, e);
            }
        }
    }

    // 6. Custom Attributes
    onProgress('Importing custom attributes...');
    const customAttrsSheet = workbook.getWorksheet('Custom Attributes');
    if (customAttrsSheet) {
        const newAttrs: any = { ...existingProductData.customAttrs };
        let changed = false;
        customAttrsSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const key = toPlainString(row.getCell(1).value).trim();
            const valStr = toPlainString(row.getCell(2).value).trim();
            if (!key) return;
            let val = valStr;
            try { val = JSON.parse(valStr); } catch (e) { }
            if (JSON.stringify(newAttrs[key]) !== JSON.stringify(val)) {
                newAttrs[key] = val;
                changed = true;
            }
        });

        if (changed) {
            try {
                await client.mutate({
                    mutation: UPDATE_PRODUCT,
                    variables: { id: productId, input: { name: existingProductData.name, description: existingProductData.description, customAttrs: newAttrs } }
                });
                updatedCount++;
            } catch (e) {
                recordError('Failed to update custom attributes', e);
            }
        }
    }

    return { createdCount, updatedCount, errorCount, collectedErrors };
};
