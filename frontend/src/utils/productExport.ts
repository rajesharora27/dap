import { createExcelWorkbook } from './excelUtils';

export const exportProductData = async (product: any, tasks: any[]) => {
    const workbook = await createExcelWorkbook();
    workbook.creator = 'DAP Application';
    workbook.created = new Date();

    // Instructions Sheet
    const instructionsSheet = workbook.addWorksheet('📋 Instructions');
    instructionsSheet.columns = [{ header: '', key: 'content', width: 100 }];
    instructionsSheet.addRows([
        ['PRODUCT DATA IMPORT/EXPORT INSTRUCTIONS'],
        [''],
        ['OVERVIEW'],
        [`This Excel file contains all data for product: ${product.name}`],
        ['Use this file to export, edit, and re-import product data.'],
        [''],
        ['SHEETS'],
        ['• Simple Attributes: Name, Description'],
        ['• Outcomes: Product Outcomes'],
        ['• Licenses: Product Licenses'],
        ['• Releases: Product Releases'],
        ['• Tasks: Product Tasks'],
        ['• Custom Attributes: Key-Value pairs'],
        ['• Telemetry Attributes: Task Telemetry'],
        [''],
        ['IMPORTANT'],
        ['• Do not change the Name of existing items if you want to update them.'],
        ['• To create new items, add rows with new Names.'],
    ]);

    // Simple Attributes
    const simpleSheet = workbook.addWorksheet('Simple Attributes');
    simpleSheet.columns = [
        { header: 'Field', key: 'field', width: 30 },
        { header: 'Value', key: 'value', width: 100 }
    ];
    simpleSheet.addRows([
        { field: 'Name', value: product.name },
        { field: 'Description', value: product.description }
    ]);

    // Outcomes
    const outcomesSheet = workbook.addWorksheet('Outcomes');
    outcomesSheet.columns = [
        { header: 'Name', key: 'name', width: 40 },
        { header: 'Description', key: 'description', width: 60 }
    ];
    product.outcomes?.forEach((o: any) => {
        outcomesSheet.addRow({ name: o.name, description: o.description });
    });

    // Licenses
    const licensesSheet = workbook.addWorksheet('Licenses');
    licensesSheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Description', key: 'description', width: 60 },
        { header: 'Level', key: 'level', width: 15 },
        { header: 'Active', key: 'isActive', width: 10 }
    ];
    product.licenses?.forEach((l: any) => {
        licensesSheet.addRow({
            name: l.name,
            description: l.description,
            level: l.level,
            isActive: l.isActive
        });
    });

    // Releases
    const releasesSheet = workbook.addWorksheet('Releases');
    releasesSheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Description', key: 'description', width: 60 },
        { header: 'Level', key: 'level', width: 15 },
        { header: 'Active', key: 'isActive', width: 10 }
    ];
    product.releases?.forEach((r: any) => {
        releasesSheet.addRow({
            name: r.name,
            description: r.description,
            level: r.level,
            isActive: r.isActive
        });
    });

    // Tasks
    const tasksSheet = workbook.addWorksheet('Tasks');
    tasksSheet.columns = [
        { header: 'Name', key: 'name', width: 40 },
        { header: 'Description', key: 'description', width: 60 },
        { header: 'Est Minutes', key: 'estMinutes', width: 15 },
        { header: 'Weight', key: 'weight', width: 10 },
        { header: 'Sequence', key: 'sequenceNumber', width: 10 },
        { header: 'License Level', key: 'licenseLevel', width: 20 },
        { header: 'License Name', key: 'licenseName', width: 20 },
        { header: 'Outcome Names', key: 'outcomeNames', width: 40 },
        { header: 'Release Names', key: 'releaseNames', width: 40 },
        { header: 'Notes', key: 'notes', width: 40 }
    ];
    tasks.forEach((t: any) => {
        tasksSheet.addRow({
            name: t.name,
            description: t.description,
            estMinutes: t.estMinutes,
            weight: t.weight,
            sequenceNumber: t.sequenceNumber,
            licenseLevel: t.licenseLevel,
            licenseName: t.license?.name,
            outcomeNames: t.outcomes?.map((o: any) => o.name).join(', '),
            releaseNames: t.releases?.map((r: any) => r.name).join(', '),
            notes: t.notes
        });
    });

    // Custom Attributes
    const customAttrsSheet = workbook.addWorksheet('Custom Attributes');
    customAttrsSheet.columns = [
        { header: 'Key', key: 'key', width: 30 },
        { header: 'Value', key: 'value', width: 60 }
    ];
    if (product.customAttrs) {
        Object.entries(product.customAttrs).forEach(([key, value]) => {
            customAttrsSheet.addRow({ key, value: JSON.stringify(value) });
        });
    }

    // Telemetry Attributes
    const telemetrySheet = workbook.addWorksheet('Telemetry Attributes');
    telemetrySheet.columns = [
        { header: 'Task Name', key: 'taskName', width: 40 },
        { header: 'Attribute Name', key: 'attributeName', width: 30 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Data Type', key: 'dataType', width: 15 },
        { header: 'Is Required', key: 'isRequired', width: 12 },
        { header: 'Success Criteria', key: 'successCriteria', width: 40 },
        { header: 'Order', key: 'order', width: 10 },
        { header: 'Is Active', key: 'isActive', width: 10 }
    ];
    tasks.forEach((t: any) => {
        t.telemetryAttributes?.forEach((ta: any) => {
            telemetrySheet.addRow({
                taskName: t.name,
                attributeName: ta.name,
                description: ta.description,
                dataType: ta.dataType,
                isRequired: ta.isRequired,
                successCriteria: ta.successCriteria,
                order: ta.order,
                isActive: ta.isActive
            });
        });
    });

    // Save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
};
