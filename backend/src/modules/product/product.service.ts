/**
 * Product Service Module
 * 
 * Provides business logic for product management including CRUD operations,
 * license associations, and cascading deletes.
 * 
 * @module modules/product/product.service
 * 
 * @example
 * ```typescript
 * import { ProductService } from './product.service';
 * 
 * // Create a new product
 * const product = await ProductService.createProduct(userId, {
 *   name: 'Cisco Duo',
 *   description: 'Multi-factor authentication solution'
 * });
 * 
 * // Update a product
 * await ProductService.updateProduct(userId, product.id, {
 *   description: 'Updated description'
 * });
 * ```
 */

import { prisma } from '../../shared/graphql/context';
import { logAudit } from '../../shared/utils/audit';
import { createChangeSet, recordChange } from '../../shared/utils/changes';
import { CreateProductSchema, UpdateProductSchema } from './product.validation';
import { z } from 'zod';

/** Input type for creating a product, derived from Zod schema */
type CreateProductInput = z.infer<typeof CreateProductSchema>;

/** Input type for updating a product, derived from Zod schema */
type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

/**
 * Service class for product management operations.
 * 
 * All methods are static and handle their own database transactions.
 * Each operation logs an audit trail for compliance and debugging.
 * 
 * @class ProductService
 */
export class ProductService {
  /**
   * Create a new product in the system.
   * 
   * Creates the product record and optionally associates licenses with it.
   * An audit log entry is created for the operation.
   * 
   * @param userId - ID of the user performing the operation (for audit)
   * @param input - Product creation data
   * @param input.name - Product name (required)
   * @param input.description - Product description (optional)
   * @param input.resources - JSON object of resource links (optional)
   * @param input.customAttrs - Custom attributes JSON (optional)
   * @param input.licenseIds - Array of license IDs to associate (optional)
   * @returns Promise resolving to the created Product record
   * 
   * @example
   * ```typescript
   * const product = await ProductService.createProduct('user123', {
   *   name: 'Cisco Umbrella',
   *   description: 'Cloud-delivered security service',
   *   customAttrs: { category: 'Security', tier: 'Enterprise' },
   *   licenseIds: ['license1', 'license2']
   * });
   * ```
   */
  static async createProduct(userId: string, input: CreateProductInput) {
    // Extract license IDs from input and handle relationship
    const { licenseIds, ...productData } = input;

    // Create a new product
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
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

    await logAudit('CREATE_PRODUCT', 'Product', product.id, { name: product.name, input }, userId);
    return product;
  }

  /**
   * Update an existing product.
   * 
   * Updates the product fields and optionally reassigns licenses.
   * Creates a change set for tracking modifications and logs the operation.
   * 
   * @param userId - ID of the user performing the operation (for audit)
   * @param id - Product ID to update
   * @param input - Fields to update (all optional)
   * @param input.name - New product name
   * @param input.description - New description
   * @param input.resources - Updated resource links
   * @param input.customAttrs - Updated custom attributes
   * @param input.licenseIds - New license associations (replaces existing)
   * @returns Promise resolving to the updated Product record
   * @throws Error if product not found
   * 
   * @example
   * ```typescript
   * // Update description only
   * await ProductService.updateProduct(userId, productId, {
   *   description: 'New description'
   * });
   * 
   * // Reassign licenses
   * await ProductService.updateProduct(userId, productId, {
   *   licenseIds: ['newLicense1', 'newLicense2']
   * });
   * ```
   */
  static async updateProduct(userId: string, id: string, input: UpdateProductInput) {
    const { licenseIds, ...productData } = input;

    // Fetch before state for change tracking
    const before = await prisma.product.findUnique({ where: { id } });

    // Prepare update data, handling null values for JSON fields
    const updateData: Record<string, unknown> = { ...productData };
    if (productData.customAttrs === null) {
      updateData.customAttrs = undefined;
    }

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

    // Record Change Set for audit trail
    if (before) {
      const cs = await createChangeSet(userId);
      await recordChange(cs.id, 'Product', id, before, product);
    }

    await logAudit('UPDATE_PRODUCT', 'Product', product.id, { name: product.name, input }, userId);
    return product;
  }

  /**
   * Delete a product with cascading cleanup.
   * 
   * Performs a hard delete of the product and all related records:
   * - Tasks associated with this product
   * - Outcomes defined for this product
   * - Licenses assigned to this product
   * - Releases for this product
   * - Solution-Product relationships
   * - Customer-Product relationships
   * 
   * @param userId - ID of the user performing the operation (for audit)
   * @param id - Product ID to delete
   * @returns Promise resolving to true on success
   * @throws Error if deletion fails
   * 
   * @example
   * ```typescript
   * const success = await ProductService.deleteProduct(userId, productId);
   * if (success) {
   *   console.log('Product deleted successfully');
   * }
   * ```
   * 
   * @warning This is a destructive operation. All associated data will be
   * permanently deleted. Consider soft-delete for recoverable scenarios.
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
