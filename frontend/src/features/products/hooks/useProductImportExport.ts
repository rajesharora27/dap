import { useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { EXPORT_PRODUCT } from '../graphql/products.queries';

export const useProductImportExport = (
    selectedProduct: string | null,
    products: any[],
    _tasks: any[],
    _refetchQueries: () => Promise<any>
) => {
    const client = useApolloClient();
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!selectedProduct) return;
        // Verify product exists in list
        const product = products.find(p => p.id === selectedProduct);
        console.log('Exporting Product:', product?.name, selectedProduct);
        if (!product) return;

        setIsExporting(true);
        try {
            const { data } = await client.query({
                query: EXPORT_PRODUCT,
                variables: { productId: selectedProduct },
                fetchPolicy: 'network-only'
            });

            if (!data || !data.exportProduct) {
                console.error('No data returned from Export');
                return;
            }

            const { filename, content, mimeType } = data.exportProduct;

            // Convert base64 to blob and download
            const blob = new Blob([Uint8Array.from(atob(content), c => c.charCodeAt(0))], { type: mimeType });
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
        } finally {
            setIsExporting(false);
        }
    };

    return { handleExport, isExporting };
};
