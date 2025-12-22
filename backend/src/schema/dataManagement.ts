import { logger } from '../shared/graphql/context';
import { prisma } from '../shared/graphql/context';
import { Context } from '../shared/graphql/context';

const dataManagementResolvers = {
  Mutation: {
    // Create sample data with 5 products
    async createSampleData(_: any, __: any, { prisma }: Context) {
      try {
        const sampleProducts = [
          {
            name: 'Enterprise CRM',
            description: 'Customer relationship management system with advanced analytics',
            customAttrs: {
              industry: 'Sales',
              department: 'Sales & Marketing',
              priority: 'HIGH',
              platform: 'Cloud',
              status: 'Active'
            }
          },
          {
            name: 'Financial Analytics Platform',
            description: 'Advanced financial analysis and reporting system',
            customAttrs: {
              industry: 'Finance',
              department: 'Finance',
              priority: 'CRITICAL',
              platform: 'Enterprise',
              status: 'Active'
            }
          },
          {
            name: 'Healthcare Management System',
            description: 'Comprehensive healthcare facility management solution',
            customAttrs: {
              industry: 'Healthcare',
              department: 'Healthcare',
              priority: 'HIGH',
              platform: 'Hybrid',
              status: 'Active'
            }
          },
          {
            name: 'Supply Chain Optimizer',
            description: 'End-to-end supply chain optimization platform',
            customAttrs: {
              industry: 'Logistics',
              department: 'Operations',
              priority: 'HIGH',
              platform: 'Cloud',
              status: 'Active'
            }
          },
          {
            name: 'HR Management Suite',
            description: 'Complete human resources management solution',
            customAttrs: {
              industry: 'HR',
              department: 'Human Resources',
              priority: 'MEDIUM',
              platform: 'Cloud',
              status: 'Active'
            }
          }
        ];

        let createdCount = 0;

        for (const product of sampleProducts) {
          await prisma.product.create({
            data: {
              ...product,
              customAttrs: JSON.stringify(product.customAttrs)
            }
          });
          createdCount++;
        }

        logger.info(`Created ${createdCount} sample products`);

        return {
          success: true,
          message: `Successfully created ${createdCount} sample products`,
          productsCreated: createdCount
        };
      } catch (error: any) {
        logger.error('Error creating sample data:', error);
        throw new Error(`Failed to create sample data: ${error?.message || 'Unknown error'}`);
      }
    },

    // Reset sample data
    async resetSampleData(_: any, __: any, ctx: Context) {
      const { prisma } = ctx;
      try {
        // Delete existing sample products
        const deleted = await prisma.product.deleteMany({
          where: {
            customAttrs: {
              contains: '"platform":'
            }
          }
        });

        // Recreate sample products
        const result = await this.createSampleData(_, __, ctx);

        return {
          success: true,
          message: `Reset completed: Deleted ${deleted.count} products and created ${result.productsCreated} new ones`,
          productsAffected: result.productsCreated
        };
      } catch (error: any) {
        logger.error('Error resetting sample data:', error);
        throw new Error(`Failed to reset sample data: ${error?.message || 'Unknown error'}`);
      }
    },

    // Delete all data
    async deleteAllData(_: any, __: any, { prisma }: Context) {
      try {
        // Delete in the correct order to respect foreign key constraints
        const deletedTasks = await prisma.task.deleteMany();
        const deletedOutcomes = await prisma.outcome.deleteMany();
        const deletedLicenses = await prisma.license.deleteMany();
        const deletedProducts = await prisma.product.deleteMany();
        const deletedSolutions = await prisma.solution.deleteMany();
        const deletedCustomers = await prisma.customer.deleteMany();

        const totalDeleted = 
          deletedTasks.count +
          deletedOutcomes.count +
          deletedLicenses.count +
          deletedProducts.count +
          deletedSolutions.count +
          deletedCustomers.count;

        logger.info(`Deleted all data: ${totalDeleted} items removed`);

        return {
          success: true,
          message: 'Successfully deleted all data',
          itemsDeleted: totalDeleted
        };
      } catch (error: any) {
        logger.error('Error deleting all data:', error);
        throw new Error(`Failed to delete all data: ${error?.message || 'Unknown error'}`);
      }
    }
  }
};