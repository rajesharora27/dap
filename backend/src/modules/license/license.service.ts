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
        // Calculate next display order
        const maxOrder = await prisma.license.findFirst({
            where: {
                productId: input.productId || null,
                solutionId: input.solutionId || null,
                deletedAt: null
            },
            orderBy: { displayOrder: 'desc' }
        });

        const license = await prisma.license.create({
            data: {
                name: input.name,
                description: input.description,
                level: input.level,
                isActive: input.isActive,
                productId: input.productId || null,
                solutionId: input.solutionId || null,
                customAttrs: input.customAttrs,
                displayOrder: (maxOrder?.displayOrder ?? 0) + 1
            }
        });

        await logAudit('CREATE_LICENSE', 'License', license.id, { name: license.name, input }, userId);
        return license;
    }

    static async updateLicense(userId: string, id: string, input: Partial<LicenseInput> & { displayOrder?: number }) {
        console.log(`[DEBUG] updateLicense called with id=${id}`);
        console.log(`[DEBUG] updateLicense input:`, JSON.stringify(input, null, 2));

        const before = await prisma.license.findUnique({ where: { id } });
        console.log(`[DEBUG] updateLicense before:`, JSON.stringify(before, null, 2));

        // Build update data, preserving existing productId/solutionId if not explicitly provided
        const updateData: any = {
            name: input.name,
            description: input.description,
            level: input.level,
            isActive: input.isActive,
            customAttrs: input.customAttrs,
            displayOrder: input.displayOrder
        };

        // Only update productId if explicitly provided in input
        if (input.productId !== undefined) {
            updateData.productId = input.productId || null;
        }

        // Only update solutionId if explicitly provided in input
        if (input.solutionId !== undefined) {
            updateData.solutionId = input.solutionId || null;
        }

        console.log(`[DEBUG] updateLicense updateData:`, JSON.stringify(updateData, null, 2));

        const license = await prisma.license.update({
            where: { id },
            data: updateData
        });

        console.log(`[DEBUG] updateLicense result:`, JSON.stringify(license, null, 2));

        await logAudit('UPDATE_LICENSE', 'License', id, { name: license.name, before, after: license }, userId);
        return license;
    }

    static async deleteLicense(userId: string, id: string) {
        console.log(`Deleting license: ${id}`);

        // Get license name before deletion for audit
        const license = await prisma.license.findUnique({ where: { id }, select: { id: true, name: true } });

        try {
            await prisma.license.delete({ where: { id } });
            console.log(`License deleted successfully: ${id}`);
        } catch (error: any) {
            console.error(`Failed to delete license ${id}:`, error.message);
            throw new Error(`Failed to delete license: ${error.message}`);
        }

        await logAudit('DELETE_LICENSE', 'License', id, { name: license?.name }, userId);
        return true;
    }

    static async reorderLicenses(userId: string, productId: string | null, solutionId: string | null, licenseIds: string[]) {
        await prisma.$transaction(
            licenseIds.map((id, index) =>
                prisma.license.update({
                    where: { id },
                    data: { displayOrder: index + 1 }
                })
            )
        );

        return prisma.license.findMany({
            where: {
                productId: productId || undefined,
                solutionId: solutionId || undefined,
                deletedAt: null
            },
            orderBy: { displayOrder: 'asc' }
        });
    }
}
