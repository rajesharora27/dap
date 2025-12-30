/**
 * Customer Service Module
 * 
 * Provides business logic for customer management including CRUD operations
 * and product/solution associations.
 * 
 * Customers represent organizations that adopt products and solutions.
 * They can have multiple products and solutions assigned to them.
 * 
 * @module modules/customer/customer.service
 * 
 * @example
 * ```typescript
 * import { CustomerService } from './customer.service';
 * 
 * // Create a customer
 * const customer = await CustomerService.createCustomer(userId, {
 *   name: 'Acme Corporation',
 *   description: 'Enterprise customer'
 * });
 * 
 * // Assign products and solutions
 * await CustomerService.addProductToCustomer(userId, customer.id, productId);
 * await CustomerService.addSolutionToCustomer(userId, customer.id, solutionId);
 * ```
 */

import { prisma } from '../../shared/graphql/context';
import { logAudit } from '../../shared/utils/audit';
import { createChangeSet, recordChange } from '../../shared/utils/changes';
import { CreateCustomerSchema, UpdateCustomerSchema } from './customer.validation';
import { z } from 'zod';

/** Input type for creating a customer, derived from Zod schema */
type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

/** Input type for updating a customer, derived from Zod schema */
type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;

/**
 * Service class for customer management operations.
 * 
 * Handles customer lifecycle and product/solution assignments.
 * All methods are static and include audit logging.
 * 
 * @class CustomerService
 */
export class CustomerService {
  /**
   * Create a new customer in the system.
   * 
   * @param userId - ID of the user performing the operation (for audit)
   * @param input - Customer creation data
   * @param input.name - Customer name (required)
   * @param input.description - Customer description (optional)
   * @returns Promise resolving to the created Customer record
   * 
   * @example
   * ```typescript
   * const customer = await CustomerService.createCustomer('user123', {
   *   name: 'Enterprise Corp',
   *   description: 'Large enterprise customer in financial sector'
   * });
   * ```
   */
  static async createCustomer(userId: string, input: CreateCustomerInput) {
    const customer = await prisma.customer.create({
      data: {
        name: input.name,
        description: input.description
      }
    });

    await logAudit('CREATE_CUSTOMER', 'Customer', customer.id, { input }, userId);
    return customer;
  }

  /**
   * Update an existing customer.
   * 
   * Updates the customer fields and creates a change set for tracking.
   * 
   * @param userId - ID of the user performing the operation (for audit)
   * @param id - Customer ID to update
   * @param input - Fields to update (all optional)
   * @param input.name - New customer name
   * @param input.description - New description
   * @returns Promise resolving to the updated Customer record
   * @throws Error if customer not found
   * 
   * @example
   * ```typescript
   * await CustomerService.updateCustomer(userId, customerId, {
   *   description: 'Updated to premium tier'
   * });
   * ```
   */
  static async updateCustomer(userId: string, id: string, input: UpdateCustomerInput) {
    const before = await prisma.customer.findUnique({ where: { id } });

    const updated = await prisma.customer.update({
      where: { id },
      data: { ...input }
    });

    if (before) {
      const cs = await createChangeSet(userId);
      await recordChange(cs.id, 'Customer', id, before, updated);
    }

    await logAudit('UPDATE_CUSTOMER', 'Customer', id, { before, after: updated }, userId);
    return updated;
  }

  /**
   * Delete a customer.
   * 
   * Performs a hard delete of the customer record. Cascading deletion
   * of related records (products, solutions, adoption plans) is handled
   * by database constraints.
   * 
   * @param userId - ID of the user performing the operation (for audit)
   * @param id - Customer ID to delete
   * @returns Promise resolving to true on success
   * @throws Error if deletion fails (e.g., foreign key constraints)
   * 
   * @warning Ensure customer has no active adoption plans before deletion.
   */
  static async deleteCustomer(userId: string, id: string) {
    await prisma.customer.delete({ where: { id } });
    await logAudit('DELETE_CUSTOMER', 'Customer', id, {}, userId);
    return true;
  }

  /**
   * Assign a product to a customer.
   * 
   * Creates a customer-product association. Uses upsert to handle
   * idempotency - calling multiple times with same IDs is safe.
   * 
   * @param userId - ID of the user performing the operation (for audit)
   * @param customerId - Customer to assign product to
   * @param productId - Product to assign
   * @returns Promise resolving to true on success
   * 
   * @example
   * ```typescript
   * // Assign Cisco Duo to customer
   * await CustomerService.addProductToCustomer(userId, customerId, duoProductId);
   * ```
   */
  static async addProductToCustomer(userId: string, customerId: string, productId: string) {
    await prisma.customerProduct.upsert({
      where: { customerId_productId: { customerId, productId } },
      update: {},
      create: { customerId, productId }
    });
    await logAudit('ADD_PRODUCT_CUSTOMER', 'Customer', customerId, { productId }, userId);
    return true;
  }

  /**
   * Remove a product assignment from a customer.
   * 
   * Deletes the customer-product association. Does not delete
   * the product itself. Associated adoption plans may be affected.
   * 
   * @param userId - ID of the user performing the operation (for audit)
   * @param customerId - Customer to remove product from
   * @param productId - Product to remove
   * @returns Promise resolving to true on success
   */
  static async removeProductFromCustomer(userId: string, customerId: string, productId: string) {
    await prisma.customerProduct.deleteMany({ where: { customerId, productId } });
    await logAudit('REMOVE_PRODUCT_CUSTOMER', 'Customer', customerId, { productId }, userId);
    return true;
  }

  /**
   * Assign a solution to a customer.
   * 
   * Creates a customer-solution association. Uses upsert to handle
   * idempotency. When a solution is assigned, the customer can then
   * create solution adoption plans.
   * 
   * @param userId - ID of the user performing the operation (for audit)
   * @param customerId - Customer to assign solution to
   * @param solutionId - Solution to assign
   * @returns Promise resolving to true on success
   * 
   * @example
   * ```typescript
   * // Assign SASE solution to customer
   * await CustomerService.addSolutionToCustomer(userId, customerId, saseSolutionId);
   * ```
   */
  static async addSolutionToCustomer(userId: string, customerId: string, solutionId: string) {
    await prisma.customerSolution.upsert({
      where: { customerId_solutionId: { customerId, solutionId } },
      update: {},
      create: { customerId, solutionId }
    });
    await logAudit('ADD_SOLUTION_CUSTOMER', 'Customer', customerId, { solutionId }, userId);
    return true;
  }

  /**
   * Remove a solution assignment from a customer.
   * 
   * Deletes the customer-solution association. Does not delete
   * the solution itself. Associated adoption plans will be affected.
   * 
   * @param userId - ID of the user performing the operation (for audit)
   * @param customerId - Customer to remove solution from
   * @param solutionId - Solution to remove
   * @returns Promise resolving to true on success
   * 
   * @warning Removing a solution may cascade-delete adoption plans.
   * Consider the impact before removing.
   */
  static async removeSolutionFromCustomer(userId: string, customerId: string, solutionId: string) {
    await prisma.customerSolution.deleteMany({ where: { customerId, solutionId } });
    await logAudit('REMOVE_SOLUTION_CUSTOMER', 'Customer', customerId, { solutionId }, userId);
    return true;
  }
}
