import ExcelJS from 'exceljs';
import { ApolloClient } from '@apollo/client';
import { CREATE_OUTCOME, UPDATE_OUTCOME } from '../graphql/mutations';

export class ExcelService {
  constructor(private client: ApolloClient<any>) {}

  async exportProductWorkbook(productId: string, productName: string, tasks: any[], outcomes: any[], licenses: any[], releases: any[]) {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Instructions sheet
      const instructionsSheet = workbook.addWorksheet('Instructions');
      instructionsSheet.addRow(['DAP Excel Import/Export Instructions']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow(['1. This workbook contains multiple sheets for different data types']);
      instructionsSheet.addRow(['2. You can modify data and re-import to update the system']);
      instructionsSheet.addRow(['3. Required columns are marked with (Required)']);
      instructionsSheet.addRow(['4. ID columns are for existing records - leave blank for new records']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow(['Sheet Descriptions:']);
      instructionsSheet.addRow(['- Product: Basic product information']);
      instructionsSheet.addRow(['- Tasks: Task details with relationships']);
      instructionsSheet.addRow(['- Licenses: Product licenses and levels']);
      instructionsSheet.addRow(['- Releases: Product releases']);
      instructionsSheet.addRow(['- Outcomes: Business outcomes']);
      instructionsSheet.addRow(['- CustomAttributes: Additional product attributes']);
      instructionsSheet.addRow(['- Telemetry: Task telemetry configuration']);

      // Product sheet
      const productSheet = workbook.addWorksheet('Product');
      productSheet.addRow(['ID', 'Name (Required)', 'Description', 'Custom Attributes (JSON)']);
      productSheet.addRow([productId, productName, '', JSON.stringify({})]);

      // Tasks sheet
      const tasksSheet = workbook.addWorksheet('Tasks');
      tasksSheet.addRow([
        'ID', 'Name (Required)', 'Description', 'Est Minutes (Required)', 
        'Weight (Required)', 'Sequence Number', 'License Level', 
        'Notes', 'How To Doc (JSON Array)', 'How To Video (JSON Array)',
        'License ID', 'Outcome IDs (JSON Array)', 'Release IDs (JSON Array)'
      ]);
      
      tasks.forEach(task => {
        tasksSheet.addRow([
          task.id,
          task.name,
          task.description || '',
          task.estMinutes,
          task.weight,
          task.sequenceNumber,
          task.licenseLevel,
          task.notes || '',
          JSON.stringify(task.howToDoc || []),
          JSON.stringify(task.howToVideo || []),
          task.license?.id || '',
          JSON.stringify(task.outcomes?.map((o: any) => o.id) || []),
          JSON.stringify(task.releases?.map((r: any) => r.id) || [])
        ]);
      });

      // Licenses sheet
      const licensesSheet = workbook.addWorksheet('Licenses');
      licensesSheet.addRow(['ID', 'Name (Required)', 'Description', 'Level (Required)', 'Is Active']);
      licenses.forEach(license => {
        licensesSheet.addRow([
          license.id,
          license.name,
          license.description || '',
          license.level,
          license.isActive
        ]);
      });

      // Releases sheet
      const releasesSheet = workbook.addWorksheet('Releases');
      releasesSheet.addRow(['ID', 'Name (Required)', 'Description', 'Level (Required)', 'Is Active']);
      releases.forEach(release => {
        releasesSheet.addRow([
          release.id,
          release.name,
          release.description || '',
          release.level,
          release.isActive
        ]);
      });

      // Outcomes sheet
      const outcomesSheet = workbook.addWorksheet('Outcomes');
      outcomesSheet.addRow(['ID', 'Name (Required)', 'Description']);
      outcomes.forEach(outcome => {
        outcomesSheet.addRow([
          outcome.id,
          outcome.name,
          outcome.description || ''
        ]);
      });

      // Custom Attributes sheet
      const customAttrsSheet = workbook.addWorksheet('CustomAttributes');
      customAttrsSheet.addRow(['Key', 'Value', 'Type']);
      customAttrsSheet.addRow(['example_attr', 'example_value', 'string']);

      // Telemetry sheet
      const telemetrySheet = workbook.addWorksheet('Telemetry');
      telemetrySheet.addRow(['Task ID', 'Attribute Name', 'Data Type', 'Success Criteria (JSON)', 'Required', 'Active', 'Order']);
      
      tasks.forEach(task => {
        if (task.telemetryAttributes) {
          task.telemetryAttributes.forEach((attr: any) => {
            telemetrySheet.addRow([
              task.id,
              attr.name,
              attr.dataType,
              JSON.stringify(attr.successCriteria || {}),
              attr.isRequired,
              attr.isActive,
              attr.order
            ]);
          });
        }
      });

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${productName.replace(/[^a-z0-9]/gi, '_')}_export.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  async importOutcomes(file: File, selectedProduct: string, existingOutcomes: any[], refetchProducts: () => void) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());

      const worksheet = workbook.getWorksheet('Outcomes');
      if (!worksheet) {
        throw new Error('No "Outcomes" worksheet found in the file');
      }

      let importedCount = 0;
      let updatedCount = 0;

      // Get headers from first row
      const headerRow = worksheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString().toLowerCase() || '';
      });

      // Process each data row
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const values: any[] = [];
        
        row.eachCell((cell, colNumber) => {
          values[colNumber - 1] = cell.value;
        });

        // Skip empty rows
        if (values.every(val => !val)) continue;

        const outcomeData: any = {};
        headers.forEach((header, index) => {
          outcomeData[header] = values[index] || '';
        });

        if (!outcomeData.name) {
          console.warn('Skipping outcome without name on row:', i);
          continue;
        }

        try {
          // Clean up the ID - handle empty strings and trim whitespace
          const cleanId = outcomeData.id?.toString().trim();
          const existingOutcome = existingOutcomes.find((o: any) => o.id?.toString() === cleanId);

          if (cleanId && existingOutcome) {
            // Update existing outcome
            await this.client.mutate({
              mutation: UPDATE_OUTCOME,
              variables: {
                id: existingOutcome.id,
                input: {
                  name: outcomeData.name,
                  description: outcomeData.description || '',
                  productId: selectedProduct
                }
              },
              refetchQueries: ['Products'],
              awaitRefetchQueries: true
            });
            updatedCount++;
          } else {
            // Create new outcome
            await this.client.mutate({
              mutation: CREATE_OUTCOME,
              variables: {
                input: {
                  name: outcomeData.name,
                  description: outcomeData.description || '',
                  productId: selectedProduct
                }
              },
              refetchQueries: ['Products'],
              awaitRefetchQueries: true
            });
            importedCount++;
          }
        } catch (error) {
          console.error(`Failed to import/update outcome on row ${i}:`, outcomeData.name, error);
        }
      }

      await refetchProducts();
      
      return {
        success: true,
        importedCount,
        updatedCount
      };
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  }

  triggerOutcomeImport(selectedProduct: string, existingOutcomes: any[], refetchProducts: () => void) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const result = await this.importOutcomes(file, selectedProduct, existingOutcomes, refetchProducts);
        alert(`Import completed!\nCreated: ${result.importedCount} outcomes\nUpdated: ${result.updatedCount} outcomes`);
      } catch (error) {
        alert('Failed to import outcomes: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };
    input.click();
  }
}
