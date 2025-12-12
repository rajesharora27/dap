import { ApolloClient } from '@apollo/client';
import { IMPORT_PRODUCT_FROM_EXCEL } from '../graphql/mutations';

export interface ImportStats {
    productName: string;
    productId?: string;
    isNewProduct: boolean;
    tasksImported: number;
    outcomesImported: number;
    releasesImported: number;
    licensesImported: number;
    customAttributesImported: number;
    telemetryAttributesImported: number;
    warnings: string[];
}

export const importProductData = async (
    file: File,
    client: ApolloClient<any>,
    productId: string | null,
    existingProductData: any | null,
    onProgress: (msg: string) => void
): Promise<ImportStats> => {
    onProgress('Reading file...');

    const mode = 'CREATE_OR_UPDATE';

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64Content = (reader.result as string).split(',')[1];

                onProgress('Uploading and processing...');

                const { data } = await client.mutate({
                    mutation: IMPORT_PRODUCT_FROM_EXCEL,
                    variables: {
                        content: base64Content,
                        mode: mode
                    }
                });

                const result = data.importProductFromExcel;

                if (!result.success) {
                    const errorMessages = result.errors.map((e: any) =>
                        `${e.sheet ? `[${e.sheet}] ` : ''}${e.message}`
                    );
                    throw new Error(errorMessages.join('\n') || 'Unknown import error');
                }

                // Determine if this was a new product or update
                const isNewProduct = result.productId && result.productId !== productId;

                // Collect warnings
                const warnings = result.warnings?.map((w: any) =>
                    `${w.sheet ? `[${w.sheet}] ` : ''}${w.message}`
                ) || [];

                resolve({
                    productName: result.productName || 'Unknown',
                    productId: result.productId,
                    isNewProduct,
                    tasksImported: result.stats?.tasksImported || 0,
                    outcomesImported: result.stats?.outcomesImported || 0,
                    releasesImported: result.stats?.releasesImported || 0,
                    licensesImported: result.stats?.licensesImported || 0,
                    customAttributesImported: result.stats?.customAttributesImported || 0,
                    telemetryAttributesImported: result.stats?.telemetryAttributesImported || 0,
                    warnings
                });

            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};
