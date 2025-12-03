import { useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { exportProductData } from '../utils/productExport';
import { importProductData } from '../utils/productImport';

export const useProductImportExport = (selectedProduct: string | null, products: any[], tasks: any[], refetchQueries: () => Promise<any>) => {
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
        if (!file || !selectedProduct) return;
        const product = products.find(p => p.id === selectedProduct);
        if (!product) return;

        setIsImporting(true);
        try {
            const result = await importProductData(file, client, selectedProduct, product, setImportProgress);
            alert(`Import completed.\nCreated: ${result.createdCount}\nUpdated: ${result.updatedCount}\nErrors: ${result.errorCount}`);
            if (result.collectedErrors.length > 0) {
                console.error('Import errors:', result.collectedErrors);
            }
            await refetchQueries();
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed');
        } finally {
            setIsImporting(false);
            setImportProgress('');
            event.target.value = ''; // Reset file input
        }
    };

    return { handleExport, handleImport, isImporting, importProgress };
};
