import { useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { exportProductData } from '../utils/productExport';
import { importProductData, ImportStats } from '../utils/productImport';

export const useProductImportExport = (
    selectedProduct: string | null,
    products: any[],
    tasks: any[],
    refetchQueries: () => Promise<any>
) => {
    const client = useApolloClient();
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState('');

    const handleExport = async () => {
        if (!selectedProduct) return;
        const product = products.find(p => p.id === selectedProduct);
        if (!product) return;
        try {
            await exportProductData(product, tasks);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed');
        }
    };

    const handleImport = async (event: any) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const product = selectedProduct ? products.find(p => p.id === selectedProduct) : null;

        setIsImporting(true);
        try {
            const stats: ImportStats = await importProductData(
                file,
                client,
                selectedProduct,
                product,
                setImportProgress
            );

            // Build detailed success message
            const action = stats.isNewProduct ? 'Created new product' : 'Updated product';
            const lines = [
                `✓ ${action}: "${stats.productName}"`,
                '',
                'Import Summary:',
                `  • Tasks: ${stats.tasksImported}`,
                `  • Outcomes: ${stats.outcomesImported}`,
                `  • Releases: ${stats.releasesImported}`,
                `  • Licenses: ${stats.licensesImported}`,
                `  • Custom Attributes: ${stats.customAttributesImported}`,
                `  • Telemetry Attributes: ${stats.telemetryAttributesImported}`
            ];

            if (stats.warnings.length > 0) {
                lines.push('', 'Warnings:');
                stats.warnings.forEach(w => lines.push(`  ⚠ ${w}`));
            }

            alert(lines.join('\n'));
            await refetchQueries();

        } catch (error: any) {
            console.error('Import failed:', error);
            alert(`Import failed: ${error.message}`);
        } finally {
            setIsImporting(false);
            setImportProgress('');
            event.target.value = '';
        }
    };

    return { handleExport, handleImport, isImporting, importProgress };
};
