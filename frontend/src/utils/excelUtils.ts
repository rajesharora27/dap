import ExcelJS from 'exceljs';

export const createExcelWorkbook = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    workbook.modified = new Date();
    return workbook;
};
