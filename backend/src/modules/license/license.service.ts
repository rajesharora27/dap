/**
 * License Module Service
 * 
 * Business logic for License domain.
 */

import { prisma } from '../../shared/graphql/context';
import { logAudit } from '../../shared/utils/audit';

export interface LicenseInput {
    name: string;
    description?: string;
    level: number;
    isActive: boolean;
    productId?: string;
    solutionId?: string;
    customAttrs?: any;
}

export class LicenseService {
    static async createLicense(userId: string, input: LicenseInput) {
        const license = await prisma.license.create({
            data: {
                name: input.name,
                description: input.description,
                level: input.level,
                isActive: input.isActive,
                productId: input.productId || null,
                solutionId: input.solutionId || null,
                customAttrs: input.customAttrs
            }
        });

        await logAudit('CREATE_LICENSE', 'License', license.id, { input }, userId);
        return license;
    }

    static async updateLicense(userId: string, id: string, input: Partial<LicenseInput>) {
        const before = await prisma.license.findUnique({ where: { id } });

        const license = await prisma.license.update({
            where: { id },
            data: {
                name: input.name,
                description: input.description,
                level: input.level,
                isActive: input.isActive,
                productId: input.productId || null,
                solutionId: input.solutionId || null,
                customAttrs: input.customAttrs
            }
        });

        await logAudit('UPDATE_LICENSE', 'License', id, { before, after: license }, userId);
        return license;
    }

    static async deleteLicense(userId: string, id: string) {
        console.log(`Deleting license: ${id}`);

        try {
            await prisma.license.delete({ where: { id } });
            console.log(`License deleted successfully: ${id}`);
        } catch (error: any) {
            console.error(`Failed to delete license ${id}:`, error.message);
            throw new Error(`Failed to delete license: ${error.message}`);
        }

        await logAudit('DELETE_LICENSE', 'License', id, {}, userId);
        return true;
    }
}
