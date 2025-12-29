import { prisma } from '../../shared/graphql/context';
import { logAudit } from '../../shared/utils/audit';
import { createChangeSet, recordChange } from '../../shared/utils/changes';
import { CreateProductSchema, UpdateProductSchema } from './product.validation';
import { z } from 'zod';

type CreateProductInput = z.infer<typeof CreateProductSchema>;
type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

export class ProductService {
    /**
     * Create a new product
     */
    static async createProduct(userId: string, input: CreateProductInput) {
        // Extract license IDs from input and handle relationship
        const { licenseIds, ...productData } = input;

        // Create a new product
        const product = await prisma.product.create({
            data: {
                name: productData.name,
                resources: productData.resources ?? undefined,
                customAttrs: productData.customAttrs ?? undefined
            }
        });

        // Handle license relationship if licenseIds provided
        if (licenseIds && licenseIds.length > 0) {
            await prisma.license.updateMany({
                where: {
                    id: { in: licenseIds },
                    deletedAt: null  // Only update active licenses
                },
                data: { productId: product.id }
            });
        }

        await logAudit('CREATE_PRODUCT', 'Product', product.id, { input }, userId);
        return product;
    }

    /**
     * Update an existing product
     */
    static async updateProduct(userId: string, id: string, input: UpdateProductInput) {
        const { licenseIds, ...productData } = input;

        // Fetch before state for change tracking
        const before = await prisma.product.findUnique({ where: { id } });

        // Prepare update data
        const updateData: any = { ...productData };

        // Handle specific fields
        if (productData.customAttrs === null) updateData.customAttrs = undefined; // Prisma handles null differently? 
        // Actually, Prisma JSON can be null.

        const product = await prisma.product.update({
            where: { id },
            data: updateData
        });

        // Handle license relationship if licenseIds provided
        if (licenseIds !== undefined) {
            // First, clear existing licenses for this product
            await prisma.license.updateMany({
                where: { productId: id },
                data: { productId: null }
            });

            // Then, assign new licenses to this product
            if (licenseIds.length > 0) {
                await prisma.license.updateMany({
                    where: {
                        id: { in: licenseIds },
                        deletedAt: null
                    },
                    data: { productId: id }
                });
            }
        }

        // Record Change Set
        if (before) {
            const cs = await createChangeSet(userId);
            await recordChange(cs.id, 'Product', id, before, product);
        }

        await logAudit('UPDATE_PRODUCT', 'Product', product.id, { input }, userId);
        return product;
    }

    /**
   * Delete a product (Hard Delete with Cascade)
   */
    static async deleteProduct(userId: string, id: string) {
        try {
            // Delete related tasks
            await prisma.task.deleteMany({ where: { productId: id } });

            // Delete related outcomes
            await prisma.outcome.deleteMany({ where: { productId: id } });

            // Delete related licenses
            await prisma.license.deleteMany({ where: { productId: id } });

            // Delete related releases
            await prisma.release.deleteMany({ where: { productId: id } });

            // Delete product-solution relationships
            await prisma.solutionProduct.deleteMany({ where: { productId: id } });

            // Delete product-customer relationships
            await prisma.customerProduct.deleteMany({ where: { productId: id } });

            // Finally, delete the product itself
            await prisma.product.delete({ where: { id } });

            await logAudit('DELETE_PRODUCT', 'Product', id, {}, userId);
            return true;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw new Error(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
