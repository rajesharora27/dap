import { createExcelWorkbook } from './excelUtils';

export const exportProductData = async (product: any, tasks: any[]) => {
    const workbook = await createExcelWorkbook();
    workbook.creator = 'DAP Application';
    workbook.created = new Date();

    // ═══════════════════════════════════════════════════════════════════════════
    // SHEET 1: Instructions
    // ═══════════════════════════════════════════════════════════════════════════
    const instructionsSheet = workbook.addWorksheet('Instructions');
    instructionsSheet.columns = [{ header: '', key: 'content', width: 100 }];
    instructionsSheet.addRows([
        ['═══════════════════════════════════════════════════════════════════════════════'],
        ['                    PRODUCT DATA IMPORT/EXPORT FORMAT                          '],
        ['═══════════════════════════════════════════════════════════════════════════════'],
        [''],
        [`Product: ${product.name}`],
        [''],
        ['• To CREATE a NEW product: Change "Product Name" in the "Product Info" sheet'],
        ['• To UPDATE an existing product: Keep the same "Product Name"'],
        ['• Column headers are case-insensitive'],
        [''],
        ['═══════════════════════════════════════════════════════════════════════════════'],
        ['SHEET: Product Info (Vertical: Field | Value)'],
        ['───────────────────────────────────────────────────────────────────────────────'],
        ['  Product Name     [REQUIRED] Unique name - change to create new product'],
        ['  Description      [Optional] Product description'],
        [''],
        ['═══════════════════════════════════════════════════════════════════════════════'],
        ['SHEET: Outcomes'],
        ['───────────────────────────────────────────────────────────────────────────────'],
        ['  Outcome Name     [REQUIRED] Unique outcome name'],
        ['  Description      [Optional] Outcome description'],
        [''],
        ['═══════════════════════════════════════════════════════════════════════════════'],
        ['SHEET: Licenses'],
        ['───────────────────────────────────────────────────────────────────────────────'],
        ['  License Name     [REQUIRED] License tier name'],
        ['  Description      [Optional] License description'],
        ['  Level            [REQUIRED] 1=ESSENTIAL, 2=ADVANTAGE, 3=SIGNATURE'],
        ['  Is Active        [Optional] TRUE or FALSE (default: TRUE)'],
        [''],
        ['═══════════════════════════════════════════════════════════════════════════════'],
        ['SHEET: Releases'],
        ['───────────────────────────────────────────────────────────────────────────────'],
        ['  Release Name     [REQUIRED] Release version name (e.g., "v1.0")'],
        ['  Description      [Optional] Release description'],
        ['  Level            [Optional] Numeric version (e.g., 1.0, 2.0)'],
        ['  Is Active        [Optional] TRUE or FALSE (default: TRUE)'],
        [''],
        ['═══════════════════════════════════════════════════════════════════════════════'],
        ['SHEET: Tasks'],
        ['───────────────────────────────────────────────────────────────────────────────'],
        ['  Task Name        [REQUIRED] Unique task name'],
        ['  Description      [Optional] Task description'],
        ['  Est. Minutes     [Optional] Estimated time in minutes (default: 60)'],
        ['  Weight           [Optional] Task weight 0-100 (default: 1)'],
        ['  Sequence Number  [Optional] Display order (auto-assigned if empty)'],
        ['  License Level    [REQUIRED] ESSENTIAL, ADVANTAGE, or SIGNATURE'],
        ['  Outcomes         [Optional] Comma-separated outcome names'],
        ['  Releases         [Optional] Comma-separated release names'],
        [''],
        ['═══════════════════════════════════════════════════════════════════════════════'],
        ['SHEET: Custom Attributes'],
        ['───────────────────────────────────────────────────────────────────────────────'],
        ['  Attribute Name   [REQUIRED] Unique attribute name'],
        ['  Value            [Optional] Attribute value'],
        ['  Data Type        [Optional] TEXT, NUMBER, BOOLEAN, JSON (default: TEXT)'],
        ['  Description      [Optional] Attribute description'],
        ['  Is Required      [Optional] TRUE or FALSE (default: FALSE)'],
        ['  Display Order    [Optional] Numeric display order'],
        [''],
        ['═══════════════════════════════════════════════════════════════════════════════'],
        ['SHEET: Telemetry'],
        ['───────────────────────────────────────────────────────────────────────────────'],
        ['  Task Name        [REQUIRED] Must match a task from Tasks sheet'],
        ['  Attribute Name   [REQUIRED] Telemetry metric name'],
        ['  Description      [Optional] Metric description'],
        ['  Data Type        [Optional] STRING, NUMBER, BOOLEAN, TIMESTAMP, JSON'],
        ['  Is Required      [Optional] TRUE or FALSE'],
        ['  Success Criteria [Optional] JSON: {"operator":">=","expectedValue":10}'],
        ['  Order            [Optional] Numeric display order'],
        ['  Is Active        [Optional] TRUE or FALSE (default: TRUE)'],
        [''],
        ['═══════════════════════════════════════════════════════════════════════════════'],
    ]);

    // ═══════════════════════════════════════════════════════════════════════════
    // SHEET 2: Product Info (Vertical layout)
    // ═══════════════════════════════════════════════════════════════════════════
    const productInfoSheet = workbook.addWorksheet('Product Info');
    productInfoSheet.columns = [
        { header: 'Field', key: 'field', width: 30 },
        { header: 'Value', key: 'value', width: 100 }
    ];
    productInfoSheet.addRows([
        { field: 'Product Name', value: product.name },
        { field: 'Description', value: product.description }
    ]);

    // ═══════════════════════════════════════════════════════════════════════════
    // SHEET 3: Outcomes
    // ═══════════════════════════════════════════════════════════════════════════
    const outcomesSheet = workbook.addWorksheet('Outcomes');
    outcomesSheet.columns = [
        { header: 'Outcome Name', key: 'name', width: 40 },
        { header: 'Description', key: 'description', width: 60 }
    ];
    product.outcomes?.forEach((o: any) => {
        outcomesSheet.addRow({ name: o.name, description: o.description });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // SHEET 4: Licenses
    // ═══════════════════════════════════════════════════════════════════════════
    const licensesSheet = workbook.addWorksheet('Licenses');
    licensesSheet.columns = [
        { header: 'License Name', key: 'name', width: 30 },
        { header: 'Description', key: 'description', width: 60 },
        { header: 'Level', key: 'level', width: 15 },
        { header: 'Is Active', key: 'isActive', width: 12 }
    ];
    product.licenses?.forEach((l: any) => {
        licensesSheet.addRow({
            name: l.name,
            description: l.description,
            level: l.level,
            isActive: l.isActive !== false
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // SHEET 5: Releases
    // ═══════════════════════════════════════════════════════════════════════════
    const releasesSheet = workbook.addWorksheet('Releases');
    releasesSheet.columns = [
        { header: 'Release Name', key: 'name', width: 30 },
        { header: 'Description', key: 'description', width: 60 },
        { header: 'Level', key: 'level', width: 15 },
        { header: 'Is Active', key: 'isActive', width: 12 }
    ];
    product.releases?.forEach((r: any) => {
        releasesSheet.addRow({
            name: r.name,
            description: r.description,
            level: r.level,
            isActive: r.isActive !== false
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // SHEET 6: Tasks
    // ═══════════════════════════════════════════════════════════════════════════
    const tasksSheet = workbook.addWorksheet('Tasks');
    tasksSheet.columns = [
        { header: 'Task Name', key: 'name', width: 40 },
        { header: 'Description', key: 'description', width: 60 },
        { header: 'Est. Minutes', key: 'estMinutes', width: 15 },
        { header: 'Weight', key: 'weight', width: 10 },
        { header: 'Sequence Number', key: 'sequenceNumber', width: 15 },
        { header: 'License Level', key: 'licenseLevel', width: 15 },
        { header: 'Outcomes', key: 'outcomes', width: 40 },
        { header: 'Releases', key: 'releases', width: 40 }
    ];
    tasks.forEach((t: any) => {
        tasksSheet.addRow({
            name: t.name,
            description: t.description,
            estMinutes: t.estMinutes,
            weight: t.weight,
            sequenceNumber: t.sequenceNumber,
            licenseLevel: t.licenseLevel,
            outcomes: t.outcomes?.map((o: any) => o.name).join(', '),
            releases: t.releases?.map((r: any) => r.name).join(', ')
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // SHEET 7: Custom Attributes
    // ═══════════════════════════════════════════════════════════════════════════
    const customAttrsSheet = workbook.addWorksheet('Custom Attributes');
    customAttrsSheet.columns = [
        { header: 'Attribute Name', key: 'attributeName', width: 30 },
        { header: 'Value', key: 'value', width: 60 },
        { header: 'Data Type', key: 'dataType', width: 15 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Is Required', key: 'isRequired', width: 12 },
        { header: 'Display Order', key: 'displayOrder', width: 15 }
    ];
    if (product.customAttrs) {
        Object.entries(product.customAttrs).forEach(([key, value]) => {
            customAttrsSheet.addRow({
                attributeName: key,
                value: typeof value === 'string' ? value : JSON.stringify(value),
                dataType: 'TEXT',
                description: '',
                isRequired: false,
                displayOrder: 0
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHEET 8: Telemetry
    // ═══════════════════════════════════════════════════════════════════════════
    const telemetrySheet = workbook.addWorksheet('Telemetry');
    telemetrySheet.columns = [
        { header: 'Task Name', key: 'taskName', width: 40 },
        { header: 'Attribute Name', key: 'attributeName', width: 30 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Data Type', key: 'dataType', width: 15 },
        { header: 'Is Required', key: 'isRequired', width: 12 },
        { header: 'Success Criteria', key: 'successCriteria', width: 40 },
        { header: 'Order', key: 'order', width: 10 },
        { header: 'Is Active', key: 'isActive', width: 12 }
    ];
    tasks.forEach((t: any) => {
        t.telemetryAttributes?.forEach((ta: any) => {
            telemetrySheet.addRow({
                taskName: t.name,
                attributeName: ta.name,
                description: ta.description || '',
                dataType: ta.dataType || 'STRING',
                isRequired: ta.isRequired || false,
                successCriteria: ta.successCriteria ? JSON.stringify(ta.successCriteria) : '',
                order: ta.order || 0,
                isActive: ta.isActive !== false
            });
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // Save and download
    // ═══════════════════════════════════════════════════════════════════════════
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${product.name.replace(/[^a-z0-9]/gi, '_')}_export.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
};
