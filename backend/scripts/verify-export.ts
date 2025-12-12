
import { ExcelExportService } from '../src/services/excel/ExcelExportService';
import ExcelJS from 'exceljs';
import { prisma } from '../src/context';

async function verifyExport() {
    try {
        console.log('--- Verifying Export for Cisco Duo ---');

        // Check if product exists
        const product = await prisma.product.findUnique({ where: { name: 'Cisco Duo' } });
        if (!product) {
            console.error('ERROR: Product "Cisco Duo" not found in database.');
            return;
        }
        console.log('Product found:', product.id);

        // Export
        const service = new ExcelExportService();
        const result = await service.exportProduct('Cisco Duo');
        console.log('Export generated. Size:', result.size);

        // Parse back
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(result.buffer);

        console.log('Worksheets found in exported file:');
        workbook.eachSheet((sheet, id) => {
            console.log(`- Sheet ${id}: "${sheet.name}"`);
        });

        const infoSheet = workbook.getWorksheet('Product Info');
        if (infoSheet) {
            console.log('SUCCESS: "Product Info" sheet verified.');
        } else {
            console.error('FAILURE: "Product Info" sheet MISSING.');
        }

    } catch (error) {
        console.error('Export verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyExport();
