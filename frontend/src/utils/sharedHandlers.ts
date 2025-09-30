import { gql } from '@apollo/client';
import { License, Outcome, CustomAttribute, Product, OperationResult, HandlerOptions, ErrorDetails } from '../types/shared';
import { ApolloClient } from '@apollo/client';

// GraphQL mutations
const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      statusPercent
      customAttrs
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      statusPercent
      customAttrs
    }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

const CREATE_LICENSE = gql`
  mutation CreateLicense($input: LicenseInput!) {
    createLicense(input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

const UPDATE_LICENSE = gql`
  mutation UpdateLicense($id: ID!, $input: LicenseInput!) {
    updateLicense(id: $id, input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

const DELETE_LICENSE = gql`
  mutation DeleteLicense($id: ID!) {
    deleteLicense(id: $id)
  }
`;

const CREATE_RELEASE = gql`
  mutation CreateRelease($input: ReleaseInput!) {
    createRelease(input: $input) {
      id
      name
      level
      description
      isActive
    }
  }
`;

const UPDATE_RELEASE = gql`
  mutation UpdateRelease($id: ID!, $input: ReleaseInput!) {
    updateRelease(id: $id, input: $input) {
      id
      name
      level
      description
      isActive
    }
  }
`;

const DELETE_RELEASE = gql`
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;

const CREATE_OUTCOME = gql`
  mutation CreateOutcome($input: OutcomeInput!) {
    createOutcome(input: $input) {
      id
      name
      description
    }
  }
`;

const UPDATE_OUTCOME = gql`
  mutation UpdateOutcome($id: ID!, $input: OutcomeInput!) {
    updateOutcome(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

const DELETE_OUTCOME = gql`
  mutation DeleteOutcome($id: ID!) {
    deleteOutcome(id: $id)
  }
`;

// Utility function for consistent error handling
export const handleError = (error: any): ErrorDetails => {
    let message = 'Unknown error occurred';

    if (error?.graphQLErrors?.length > 0) {
        message = error.graphQLErrors[0].message;
    } else if (error?.networkError?.message) {
        message = `Network error: ${error.networkError.message}`;
    } else if (error?.message) {
        message = error.message;
    }

    return {
        message,
        graphQLErrors: error?.graphQLErrors,
        networkError: error?.networkError
    };
};

// License handlers
export class LicenseHandlers {
    constructor(private client: ApolloClient<any>) { }

    async createLicense(
        license: Omit<License, 'id'>,
        options: HandlerOptions = {}
    ): Promise<OperationResult<License>> {
        try {
            if (!license.name?.trim()) {
                throw new Error('License name is required');
            }

            if (!license.productId) {
                throw new Error('Product ID is required for license creation');
            }

            const result = await this.client.mutate({
                mutation: CREATE_LICENSE,
                variables: {
                    input: {
                        name: license.name.trim(),
                        description: license.description?.trim() || '',
                        level: Number(license.level) || 1,
                        isActive: license.isActive !== false, // Default to true
                        productId: license.productId
                    }
                },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
            });

            // Trigger additional refetch if provided
            if (options.refetchProducts) {
                await options.refetchProducts();
            }
            if (options.refetchLicenses) {
                await options.refetchLicenses();
            }

            return {
                success: true,
                data: result.data.createLicense
            };
        } catch (error) {
            const errorDetails = handleError(error);

            if (options.showAlert !== false) {
                alert(`Failed to create license: ${errorDetails.message}`);
            }

            console.error('Error creating license:', error);
            return {
                success: false,
                error: errorDetails
            };
        }
    }

    async updateLicense(
        id: string,
        license: Partial<License>,
        options: HandlerOptions = {}
    ): Promise<OperationResult<License>> {
        try {
            if (!id) {
                throw new Error('License ID is required for update');
            }

            if (license.name && !license.name.trim()) {
                throw new Error('License name cannot be empty');
            }

            if (!license.productId) {
                throw new Error('Product ID is required for license update');
            }

            const result = await this.client.mutate({
                mutation: UPDATE_LICENSE,
                variables: {
                    id,
                    input: {
                        ...(license.name && { name: license.name.trim() }),
                        ...(license.description !== undefined && { description: license.description.trim() }),
                        ...(license.level !== undefined && { level: Number(license.level) }),
                        ...(license.isActive !== undefined && { isActive: license.isActive }),
                        productId: license.productId // Always required for update
                    }
                },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
            });

            // Trigger additional refetch if provided
            if (options.refetchProducts) {
                await options.refetchProducts();
            }
            if (options.refetchLicenses) {
                await options.refetchLicenses();
            }

            return {
                success: true,
                data: result.data.updateLicense
            };
        } catch (error) {
            const errorDetails = handleError(error);

            if (options.showAlert !== false) {
                alert(`Failed to update license: ${errorDetails.message}`);
            }

            console.error('Error updating license:', error);
            return {
                success: false,
                error: errorDetails
            };
        }
    }

    async deleteLicense(
        id: string,
        options: HandlerOptions = {}
    ): Promise<OperationResult<void>> {
        try {
            if (!id) {
                throw new Error('License ID is required for deletion');
            }

            await this.client.mutate({
                mutation: DELETE_LICENSE,
                variables: { id },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
            });

            // Trigger additional refetch if provided
            if (options.refetchProducts) {
                await options.refetchProducts();
            }
            if (options.refetchLicenses) {
                await options.refetchLicenses();
            }

            return {
                success: true
            };
        } catch (error) {
            const errorDetails = handleError(error);

            if (options.showAlert !== false) {
                alert(`Failed to delete license: ${errorDetails.message}`);
            }

            console.error('Error deleting license:', error);
            return {
                success: false,
                error: errorDetails
            };
        }
    }
}

// Release handlers
export class ReleaseHandlers {
    constructor(private client: ApolloClient<any>) { }

    async createRelease(
        release: { name: string; level: number; description?: string; productId: string },
        options: HandlerOptions = {}
    ): Promise<OperationResult<any>> {
        try {
            if (!release.name?.trim()) {
                throw new Error('Release name is required');
            }

            if (!release.productId) {
                throw new Error('Product ID is required for release creation');
            }

            if (release.level <= 0) {
                throw new Error('Release level must be greater than 0');
            }

            const result = await this.client.mutate({
                mutation: CREATE_RELEASE,
                variables: {
                    input: {
                        name: release.name.trim(),
                        level: Number(release.level),
                        description: release.description?.trim() || '',
                        productId: release.productId,
                        isActive: true
                    }
                },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
            });

            // Trigger additional refetch if provided
            if (options.refetchProducts) {
                await options.refetchProducts();
            }

            return {
                success: true,
                data: result.data.createRelease
            };
        } catch (error) {
            const errorDetails = handleError(error);

            if (options.showAlert !== false) {
                alert(`Failed to create release: ${errorDetails.message}`);
            }

            console.error('Error creating release:', error);
            return {
                success: false,
                error: errorDetails
            };
        }
    }

    async updateRelease(
        id: string,
        release: { name?: string; level?: number; description?: string; productId: string },
        options: HandlerOptions = {}
    ): Promise<OperationResult<any>> {
        try {
            if (!id) {
                throw new Error('Release ID is required for update');
            }

            if (release.name && !release.name.trim()) {
                throw new Error('Release name cannot be empty');
            }

            if (!release.productId) {
                throw new Error('Product ID is required for release update');
            }

            if (release.level !== undefined && release.level <= 0) {
                throw new Error('Release level must be greater than 0');
            }

            const result = await this.client.mutate({
                mutation: UPDATE_RELEASE,
                variables: {
                    id,
                    input: {
                        ...(release.name && { name: release.name.trim() }),
                        ...(release.level !== undefined && { level: Number(release.level) }),
                        ...(release.description !== undefined && { description: release.description.trim() }),
                        productId: release.productId
                    }
                },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
            });

            // Trigger additional refetch if provided
            if (options.refetchProducts) {
                await options.refetchProducts();
            }

            return {
                success: true,
                data: result.data.updateRelease
            };
        } catch (error) {
            const errorDetails = handleError(error);

            if (options.showAlert !== false) {
                alert(`Failed to update release: ${errorDetails.message}`);
            }

            console.error('Error updating release:', error);
            return {
                success: false,
                error: errorDetails
            };
        }
    }

    async deleteRelease(
        id: string,
        options: HandlerOptions = {}
    ): Promise<OperationResult<boolean>> {
        try {
            if (!id) {
                throw new Error('Release ID is required for deletion');
            }

            const result = await this.client.mutate({
                mutation: DELETE_RELEASE,
                variables: { id },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
            });

            // Trigger additional refetch if provided
            if (options.refetchProducts) {
                await options.refetchProducts();
            }

            return {
                success: true,
                data: result.data.deleteRelease
            };
        } catch (error) {
            const errorDetails = handleError(error);

            if (options.showAlert !== false) {
                alert(`Failed to delete release: ${errorDetails.message}`);
            }

            console.error('Error deleting release:', error);
            return {
                success: false,
                error: errorDetails
            };
        }
    }
}

// Outcome handlers
export class OutcomeHandlers {
    constructor(private client: ApolloClient<any>) { }

    async createOutcome(
        outcome: Omit<Outcome, 'id'>,
        options: HandlerOptions = {}
    ): Promise<OperationResult<Outcome>> {
        try {
            if (!outcome.name?.trim()) {
                throw new Error('Outcome name is required');
            }

            if (!outcome.productId) {
                throw new Error('Product ID is required for outcome creation');
            }

            const result = await this.client.mutate({
                mutation: CREATE_OUTCOME,
                variables: {
                    input: {
                        name: outcome.name.trim(),
                        description: outcome.description?.trim() || '',
                        productId: outcome.productId
                    }
                },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
            });

            // Trigger additional refetch if provided
            if (options.refetchProducts) {
                await options.refetchProducts();
            }
            if (options.refetchOutcomes) {
                await options.refetchOutcomes();
            }

            return {
                success: true,
                data: result.data.createOutcome
            };
        } catch (error) {
            const errorDetails = handleError(error);

            if (options.showAlert !== false) {
                alert(`Failed to create outcome: ${errorDetails.message}`);
            }

            console.error('Error creating outcome:', error);
            return {
                success: false,
                error: errorDetails
            };
        }
    }

    async updateOutcome(
        id: string,
        outcome: Partial<Outcome>,
        options: HandlerOptions = {}
    ): Promise<OperationResult<Outcome>> {
        try {
            if (!id) {
                throw new Error('Outcome ID is required for update');
            }

            if (outcome.name && !outcome.name.trim()) {
                throw new Error('Outcome name cannot be empty');
            }

            if (!outcome.productId) {
                throw new Error('Product ID is required for outcome update');
            }

            const result = await this.client.mutate({
                mutation: UPDATE_OUTCOME,
                variables: {
                    id,
                    input: {
                        ...(outcome.name && { name: outcome.name.trim() }),
                        ...(outcome.description !== undefined && { description: outcome.description.trim() }),
                        productId: outcome.productId // Always required for update
                    }
                },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
            });

            // Trigger additional refetch if provided
            if (options.refetchProducts) {
                await options.refetchProducts();
            }
            if (options.refetchOutcomes) {
                await options.refetchOutcomes();
            }

            return {
                success: true,
                data: result.data.updateOutcome
            };
        } catch (error) {
            const errorDetails = handleError(error);

            if (options.showAlert !== false) {
                alert(`Failed to update outcome: ${errorDetails.message}`);
            }

            console.error('Error updating outcome:', error);
            return {
                success: false,
                error: errorDetails
            };
        }
    }

    async deleteOutcome(
        id: string,
        options: HandlerOptions = {}
    ): Promise<OperationResult<void>> {
        try {
            if (!id) {
                throw new Error('Outcome ID is required for deletion');
            }

            await this.client.mutate({
                mutation: DELETE_OUTCOME,
                variables: { id },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
            });

            // Trigger additional refetch if provided
            if (options.refetchProducts) {
                await options.refetchProducts();
            }
            if (options.refetchOutcomes) {
                await options.refetchOutcomes();
            }

            return {
                success: true
            };
        } catch (error) {
            const errorDetails = handleError(error);

            if (options.showAlert !== false) {
                alert(`Failed to delete outcome: ${errorDetails.message}`);
            }

            console.error('Error deleting outcome:', error);
            return {
                success: false,
                error: errorDetails
            };
        }
    }
}

// Product handlers
export class ProductHandlers {
    constructor(private client: ApolloClient<any>) { }

    async createProduct(
        product: Omit<Product, 'id'>,
        options: HandlerOptions = {}
    ): Promise<OperationResult<Product>> {
        try {
            if (!product.name?.trim()) {
                throw new Error('Product name is required');
            }

            const result = await this.client.mutate({
                mutation: CREATE_PRODUCT,
                variables: {
                    input: {
                        name: product.name.trim(),
                        description: product.description?.trim() || '',
                        customAttrs: product.customAttrs || {}
                    }
                },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
            });

            // Trigger additional refetch if provided
            if (options.refetchProducts) {
                await options.refetchProducts();
            }

            return {
                success: true,
                data: result.data.createProduct
            };
        } catch (error) {
            const errorDetails = handleError(error);

            if (options.showAlert !== false) {
                alert(`Failed to create product: ${errorDetails.message}`);
            }

            console.error('Error creating product:', error);
            return {
                success: false,
                error: errorDetails
            };
        }
    }

    async updateProduct(
        id: string,
        product: Partial<Product>,
        options: HandlerOptions = {}
    ): Promise<OperationResult<Product>> {
        try {
            if (!id) {
                throw new Error('Product ID is required for update');
            }

            if (product.name && !product.name.trim()) {
                throw new Error('Product name cannot be empty');
            }

            const result = await this.client.mutate({
                mutation: UPDATE_PRODUCT,
                variables: {
                    id,
                    input: {
                        ...(product.name && { name: product.name.trim() }),
                        ...(product.description !== undefined && { description: product.description.trim() }),
                        ...(product.customAttrs !== undefined && {
                            customAttrs: typeof product.customAttrs === 'string'
                                ? product.customAttrs
                                : JSON.stringify(product.customAttrs)
                        })
                    }
                },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
            });

            // Trigger additional refetch if provided
            if (options.refetchProducts) {
                await options.refetchProducts();
            }

            return {
                success: true,
                data: result.data.updateProduct
            };
        } catch (error) {
            const errorDetails = handleError(error);

            if (options.showAlert !== false) {
                alert(`Failed to update product: ${errorDetails.message}`);
            }

            console.error('Error updating product:', error);
            return {
                success: false,
                error: errorDetails
            };
        }
    }

    async deleteProduct(
        id: string,
        options: HandlerOptions = {}
    ): Promise<OperationResult<void>> {
        try {
            if (!id) {
                throw new Error('Product ID is required for deletion');
            }

            await this.client.mutate({
                mutation: DELETE_PRODUCT,
                variables: { id },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
            });

            // Trigger additional refetch if provided
            if (options.refetchProducts) {
                await options.refetchProducts();
            }

            return {
                success: true
            };
        } catch (error) {
            const errorDetails = handleError(error);

            if (options.showAlert !== false) {
                alert(`Failed to delete product: ${errorDetails.message}`);
            }

            console.error('Error deleting product:', error);
            return {
                success: false,
                error: errorDetails
            };
        }
    }

    // Complex product update that handles licenses and outcomes
    async updateProductWithDetails(
        id: string,
        productData: {
            name: string;
            description?: string;
            customAttrs?: any;
            outcomes?: Array<{ id?: string; name: string; description?: string; isNew?: boolean; delete?: boolean }>;
            licenses?: Array<{ id?: string; name: string; description?: string; level: string; isActive: boolean; isNew?: boolean; delete?: boolean }>;
            releases?: Array<{ id?: string; name: string; level: number; description?: string; isNew?: boolean; delete?: boolean }>;
        },
        options: HandlerOptions = {}
    ): Promise<OperationResult<Product>> {
        try {
            if (!id) {
                throw new Error('Product ID is required for update');
            }

            if (!productData.name?.trim()) {
                throw new Error('Product name is required');
            }

            // Update product basic info first
            const productResult = await this.updateProduct(id, {
                name: productData.name,
                description: productData.description,
                customAttrs: productData.customAttrs
            }, { showAlert: false });

            if (!productResult.success) {
                throw new Error(productResult.error?.message || 'Failed to update product');
            }

            // Handle licenses if provided
            if (productData.licenses) {
                for (const license of productData.licenses) {
                    if (license.delete && license.id) {
                        // Delete existing license
                        await this.client.mutate({
                            mutation: DELETE_LICENSE,
                            variables: { id: license.id }
                        });
                    } else if (license.isNew) {
                        // Create new license
                        await this.client.mutate({
                            mutation: CREATE_LICENSE,
                            variables: {
                                input: {
                                    name: license.name,
                                    description: license.description,
                                    level: parseInt(license.level),
                                    isActive: license.isActive,
                                    productId: id
                                }
                            }
                        });
                    } else if (license.id) {
                        // Update existing license
                        await this.client.mutate({
                            mutation: UPDATE_LICENSE,
                            variables: {
                                id: license.id,
                                input: {
                                    name: license.name,
                                    description: license.description,
                                    level: parseInt(license.level),
                                    isActive: license.isActive,
                                    productId: id // Required for update
                                }
                            }
                        });
                    }
                }
            }

            // Handle outcomes if provided
            if (productData.outcomes) {
                for (const outcome of productData.outcomes) {
                    if (outcome.delete && outcome.id) {
                        // Delete existing outcome
                        await this.client.mutate({
                            mutation: DELETE_OUTCOME,
                            variables: { id: outcome.id }
                        });
                    } else if (outcome.isNew) {
                        // Create new outcome
                        await this.client.mutate({
                            mutation: CREATE_OUTCOME,
                            variables: {
                                input: {
                                    name: outcome.name,
                                    description: outcome.description,
                                    productId: id
                                }
                            }
                        });
                    } else if (outcome.id) {
                        // Update existing outcome
                        await this.client.mutate({
                            mutation: UPDATE_OUTCOME,
                            variables: {
                                id: outcome.id,
                                input: {
                                    name: outcome.name,
                                    description: outcome.description,
                                    productId: id
                                }
                            }
                        });
                    }
                }
            }

            // Handle releases if provided
            if (productData.releases) {
                for (const release of productData.releases) {
                    if (release.delete && release.id) {
                        // Delete existing release
                        await this.client.mutate({
                            mutation: DELETE_RELEASE,
                            variables: { id: release.id }
                        });
                    } else if (release.isNew) {
                        // Create new release
                        await this.client.mutate({
                            mutation: CREATE_RELEASE,
                            variables: {
                                input: {
                                    name: release.name,
                                    level: release.level,
                                    description: release.description || '',
                                    productId: id,
                                    isActive: true
                                }
                            }
                        });
                    } else if (release.id) {
                        // Update existing release
                        await this.client.mutate({
                            mutation: UPDATE_RELEASE,
                            variables: {
                                id: release.id,
                                input: {
                                    name: release.name,
                                    level: release.level,
                                    description: release.description || '',
                                    productId: id
                                }
                            }
                        });
                    }
                }
            }

            // Trigger additional refetch if provided
            if (options.refetchProducts) {
                await options.refetchProducts();
            }

            return {
                success: true,
                data: productResult.data!
            };
        } catch (error) {
            const errorDetails = handleError(error);

            if (options.showAlert !== false) {
                alert(`Failed to update product: ${errorDetails.message}`);
            }

            console.error('Error updating product with details:', error);
            return {
                success: false,
                error: errorDetails
            };
        }
    }
}

// Validation utilities
export class ValidationUtils {
    static validateLicense(license: Partial<License>): string[] {
        const errors: string[] = [];

        if (!license.name?.trim()) {
            errors.push('License name is required');
        }

        if (license.level !== undefined && (license.level < 1 || license.level > 3)) {
            errors.push('License level must be between 1 and 3 (Essential, Advantage, or Signature)');
        }

        return errors;
    }

    static validateOutcome(outcome: Partial<Outcome>): string[] {
        const errors: string[] = [];

        if (!outcome.name?.trim()) {
            errors.push('Outcome name is required');
        }

        return errors;
    }

    static validateCustomAttribute(attr: CustomAttribute): string[] {
        const errors: string[] = [];

        if (!attr.key?.trim()) {
            errors.push('Attribute key is required');
        }

        try {
            switch (attr.type) {
                case 'number':
                    if (isNaN(Number(attr.value))) {
                        errors.push('Value must be a valid number');
                    }
                    break;
                case 'boolean':
                    const lowerValue = String(attr.value).toLowerCase();
                    if (lowerValue !== 'true' && lowerValue !== 'false') {
                        errors.push('Value must be "true" or "false"');
                    }
                    break;
                case 'array':
                case 'object':
                    JSON.parse(String(attr.value)); // Will throw if invalid JSON
                    break;
            }
        } catch (error) {
            errors.push(`Invalid ${attr.type} format`);
        }

        return errors;
    }

    static validateProduct(product: Partial<Product>): string[] {
        const errors: string[] = [];

        if (!product.name?.trim()) {
            errors.push('Product name is required');
        }

        // Validate custom attributes if provided
        if (product.customAttrs) {
            try {
                if (typeof product.customAttrs === 'string') {
                    JSON.parse(product.customAttrs);
                } else if (typeof product.customAttrs !== 'object') {
                    errors.push('Custom attributes must be a valid JSON object');
                }
            } catch (error) {
                errors.push('Custom attributes must be valid JSON');
            }
        }

        return errors;
    }

    static validateProductWithMandatoryAttributes(
        product: Partial<Product>, 
        licenses: any[], 
        outcomes: any[], 
        releases: any[]
    ): string[] {
        const errors = this.validateProduct(product);

        // For new products, validate mandatory attributes
        const activeLicenses = licenses?.filter(license => !license.delete) || [];
        const activeOutcomes = outcomes?.filter(outcome => !outcome.delete) || [];
        const activeReleases = releases?.filter(release => !release.delete) || [];

        if (activeLicenses.length === 0) {
            errors.push('At least one license is required (Essential - Level 1 recommended)');
        }

        if (activeOutcomes.length === 0) {
            errors.push('At least one outcome is required (product name recommended)');
        }

        if (activeReleases.length === 0) {
            errors.push('At least one release is required (1.0 recommended)');
        }

        return errors;
    }
}