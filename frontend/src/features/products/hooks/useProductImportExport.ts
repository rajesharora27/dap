import { useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { EXPORT_PRODUCT_TO_EXCEL } from '../graphql/queries';

import { importProductData, ImportStats } from '@/utils/productImport';

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
            const { data } = await client.query({
                query: EXPORT_PRODUCT_TO_EXCEL,
                variables: { productName: product.name },
                fetchPolicy: 'network-only' // Ensure fresh data
            });

            const { filename, content, mimeType } = data.exportProductToExcel;

            // Convert base64 to blob and download
            const binaryString = window.atob(content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

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
                stats.warnings.forEach((w: string) => lines.push(`  ⚠ ${w}`));
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
