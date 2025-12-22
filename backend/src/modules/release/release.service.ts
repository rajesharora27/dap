/**
 * Release Module Service
 */

import { prisma } from '../../shared/graphql/context';
import { logAudit } from '../../shared/utils/audit';

export interface ReleaseInput {
    name: string;
    description?: string;
    level: number;
    isActive: boolean;
    productId?: string;
    solutionId?: string;
    customAttrs?: any;
}

export class ReleaseService {
    static async createRelease(userId: string, input: ReleaseInput) {
        const release = await prisma.release.create({
            data: {
                name: input.name,
                description: input.description,
                level: input.level,
                isActive: input.isActive !== undefined ? input.isActive : true,
                productId: input.productId || null,
                solutionId: input.solutionId || null,
                customAttrs: input.customAttrs
            }
        });

        await logAudit('CREATE_RELEASE', 'Release', release.id, { input }, userId);
        return release;
    }

    static async updateRelease(userId: string, id: string, input: Partial<ReleaseInput>) {
        const before = await prisma.release.findUnique({ where: { id } });

        const release = await prisma.release.update({
            where: { id },
            data: {
                name: input.name,
                description: input.description,
                level: input.level,
                isActive: input.isActive,
                productId: input.productId,
                solutionId: input.solutionId,
                customAttrs: input.customAttrs
            }
        });

        await logAudit('UPDATE_RELEASE', 'Release', id, { before, after: release }, userId);
        return release;
    }

    static async deleteRelease(userId: string, id: string) {
        console.log(`Deleting release: ${id}`);

        try {
            await prisma.release.delete({ where: { id } });
            console.log(`Release deleted successfully: ${id}`);
        } catch (error: any) {
            console.error(`Failed to delete release ${id}:`, error.message);
            throw new Error(`Failed to delete release: ${error.message}`);
        }

        await logAudit('DELETE_RELEASE', 'Release', id, {}, userId);
        return true;
    }
}
