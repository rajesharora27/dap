
import { ExcelExportService } from '../src/services/excel/ExcelExportService';
import ExcelJS from 'exceljs';
import { prisma } from '../src/context';

async function verifyExport() {
    const productName = 'Cisco Secure Access'; // Known to have tags
    console.log(`Verifying export for ${productName}...`);

    const service = new ExcelExportService();
    try {
        const result = await service.exportProduct(productName);
        console.log(`Export generated. Size: ${result.size} bytes.`);

        // Read back the buffer to verify contents
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(result.buffer);

        // 1. Check Tags Sheet
        const tagsSheet = workbook.getWorksheet('Tags');
        if (!tagsSheet) {
            console.error('❌ FAILED: "Tags" sheet is missing!');
        } else {
            console.log('✅ "Tags" sheet exists.');
            const rowCount = tagsSheet.rowCount;
            console.log(`   - Rows in Tags sheet: ${rowCount}`);
            if (rowCount > 1) {
                const firstTag = tagsSheet.getRow(2).getCell(1).value;
                console.log(`   - First tag found: "${firstTag}"`);
            } else {
                console.warn('   ⚠️ Tags sheet is empty (only header?)');
            }
        }

        // 2. Check Tasks Sheet for Tags Column
        const tasksSheet = workbook.getWorksheet('Tasks');
        if (!tasksSheet) {
            console.error('❌ FAILED: "Tasks" sheet is missing!');
        } else {
            console.log('✅ "Tasks" sheet exists.');
            const headerRow = tasksSheet.getRow(1);

            // Find 'Tags' column index
            let tagsColIndex = -1;
            headerRow.eachCell((cell, colNumber) => {
                if (cell.value === 'Tags') {
                    tagsColIndex = colNumber;
                }
            });

            if (tagsColIndex === -1) {
                console.error('❌ FAILED: "Tags" column header not found in Tasks sheet!');
            } else {
                console.log(`✅ "Tags" column found at index ${tagsColIndex}.`);

                // Check for data in Tags column
                let tagsFound = false;
                tasksSheet.eachRow((row, rowNumber) => {
                    if (rowNumber > 1) {
                        const cellValue = row.getCell(tagsColIndex).value;
                        if (cellValue) {
                            console.log(`   - Found tag data in row ${rowNumber}: "${cellValue}"`);
                            tagsFound = true;
                        }
                    }
                });

                if (!tagsFound) {
                    console.warn('   ⚠️ No tag data found in Tasks sheet "Tags" column.');
                } else {
                    console.log('✅ Tag data present in Tasks matches.');
                }
            }
        }

        // 3. Check Instructions
        const instrSheet = workbook.getWorksheet('Instructions');
        if (instrSheet) {
            let hasTagsMention = false;
            instrSheet.eachRow((row) => {
                row.eachCell((cell) => {
                    if (cell.value && cell.value.toString().includes('Tab 7: Tags')) {
                        hasTagsMention = true;
                    }
                });
            });
            if (hasTagsMention) {
                console.log('✅ Instructions mention "Tab 7: Tags".');
            } else {
                console.error('❌ FAILED: Instructions do not mention "Tab 7: Tags".');
            }
        }

    } catch (error) {
        console.error('Export failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyExport();
