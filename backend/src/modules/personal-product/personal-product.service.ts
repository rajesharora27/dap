/**
 * Personal Product Service
 * Handles CRUD operations for user's personal sandbox products
 */

import { prisma } from '../../shared/graphql/context';
import { Prisma } from '@prisma/client';

// ============================================================================
// PERSONAL PRODUCT CRUD
// ============================================================================

export async function getMyPersonalProducts(userId: string) {
    return prisma.personalProduct.findMany({
        where: { userId },
        include: {
            tasks: {
                orderBy: { sequenceNumber: 'asc' },
                include: {
                    outcomes: { include: { personalOutcome: true } },
                    releases: { include: { personalRelease: true } },
                    taskTags: { include: { personalTag: true } },
                    telemetryAttributes: true,
                },
            },
            outcomes: true,
            releases: true,
            licenses: true,
            tags: true,
            assignments: true,
        },
        orderBy: { updatedAt: 'desc' },
    });
}

export async function getPersonalProduct(id: string, userId: string) {
    return prisma.personalProduct.findFirst({
        where: { id, userId },
        include: {
            tasks: {
                orderBy: { sequenceNumber: 'asc' },
                include: {
                    outcomes: { include: { personalOutcome: true } },
                    releases: { include: { personalRelease: true } },
                    taskTags: { include: { personalTag: true } },
                    telemetryAttributes: true,
                },
            },
            outcomes: true,
            releases: true,
            licenses: true,
            tags: true,
            assignments: true,
        },
    });
}

export async function createPersonalProduct(
    userId: string,
    data: { name: string; description?: string; resources?: any }
) {
    // Check 10-product limit
    const count = await prisma.personalProduct.count({ where: { userId } });
    if (count >= 10) {
        throw new Error('Personal product limit (10) reached. Delete an existing product to add more.');
    }

    return prisma.personalProduct.create({
        data: {
            userId,
            name: data.name,
            description: data.description,
            resources: data.resources,
            customAttrs: (data as any).customAttrs,
        },
        include: {
            tasks: true,
            outcomes: true,
            releases: true,
            licenses: true,
            tags: true,
            assignments: true,
        },
    });
}

export async function updatePersonalProduct(
    id: string,
    userId: string,
    data: { name?: string; description?: string; resources?: any }
) {
    // Verify ownership
    const product = await prisma.personalProduct.findFirst({ where: { id, userId } });
    if (!product) throw new Error('Personal product not found');

    return prisma.personalProduct.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
            resources: data.resources,
            customAttrs: (data as any).customAttrs,
        },
        include: {
            tasks: true,
            outcomes: true,
            releases: true,
            licenses: true,
            tags: true,
            assignments: true,
        },
    });
}

export async function deletePersonalProduct(id: string, userId: string) {
    const product = await prisma.personalProduct.findFirst({ where: { id, userId } });
    if (!product) throw new Error('Personal product not found');

    await prisma.personalProduct.delete({ where: { id } });
    return true;
}

// ============================================================================
// PERSONAL TASK CRUD
// ============================================================================

export async function createPersonalTask(
    userId: string,
    data: {
        personalProductId: string;
        name: string;
        description?: string;
        estMinutes?: number;
        weight?: number;
        howToDoc?: string[];
        howToVideo?: string[];
        licenseLevel?: number;
        outcomeIds?: string[];
        releaseIds?: string[];
    }
) {
    // Verify product ownership
    const product = await prisma.personalProduct.findFirst({
        where: { id: data.personalProductId, userId },
    });
    if (!product) throw new Error('Personal product not found');

    // Get next sequence number
    const maxSeq = await prisma.personalTask.aggregate({
        where: { personalProductId: data.personalProductId },
        _max: { sequenceNumber: true },
    });

    const task = await prisma.personalTask.create({
        data: {
            personalProductId: data.personalProductId,
            name: data.name,
            description: data.description,
            estMinutes: data.estMinutes ?? 30,
            weight: data.weight ?? 1.0,
            sequenceNumber: (maxSeq._max.sequenceNumber ?? 0) + 1,
            howToDoc: data.howToDoc ?? [],
            howToVideo: data.howToVideo ?? [],
            licenseLevel: data.licenseLevel,
            status: 'NOT_STARTED',
            outcomes: data.outcomeIds ? {
                create: data.outcomeIds.map(oid => ({ personalOutcomeId: oid })),
            } : undefined,
            releases: data.releaseIds ? {
                create: data.releaseIds.map(rid => ({ personalReleaseId: rid })),
            } : undefined,
            taskTags: (data as any).tagIds ? {
                create: (data as any).tagIds.map((tid: string) => ({ personalTagId: tid })),
            } : undefined,
        },
        include: {
            outcomes: { include: { personalOutcome: true } },
            releases: { include: { personalRelease: true } },
            taskTags: { include: { personalTag: true } },
            telemetryAttributes: true,
        },
    });

    return task;
}

export async function updatePersonalTask(
    id: string,
    userId: string,
    data: {
        name?: string;
        description?: string;
        estMinutes?: number;
        weight?: number;
        sequenceNumber?: number;
        howToDoc?: string[];
        howToVideo?: string[];
        licenseLevel?: number;
        outcomeIds?: string[];
        releaseIds?: string[];
        tagIds?: string[];
        status?: string;
        statusNotes?: string;
    }
) {
    // Verify ownership through product
    const task = await prisma.personalTask.findUnique({
        where: { id },
        include: { personalProduct: true },
    });
    if (!task || task.personalProduct.userId !== userId) {
        throw new Error('Personal task not found');
    }

    // Handle outcome/release updates
    if (data.outcomeIds !== undefined) {
        await prisma.personalTaskOutcome.deleteMany({ where: { personalTaskId: id } });
        await prisma.personalTaskOutcome.createMany({
            data: data.outcomeIds.map(oid => ({ personalTaskId: id, personalOutcomeId: oid })),
        });
    }

    if (data.releaseIds !== undefined) {
        await prisma.personalTaskRelease.deleteMany({ where: { personalTaskId: id } });
        await prisma.personalTaskRelease.createMany({
            data: data.releaseIds.map(rid => ({ personalTaskId: id, personalReleaseId: rid })),
        });
    }

    if (data.tagIds !== undefined) {
        await prisma.personalTaskTag.deleteMany({ where: { personalTaskId: id } });
        await prisma.personalTaskTag.createMany({
            data: data.tagIds.map(tid => ({ personalTaskId: id, personalTagId: tid })),
        });
    }

    return prisma.personalTask.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
            estMinutes: data.estMinutes,
            weight: data.weight,
            sequenceNumber: data.sequenceNumber,
            howToDoc: data.howToDoc,
            howToVideo: data.howToVideo,
            licenseLevel: data.licenseLevel,
            status: data.status as any,
            statusNotes: data.statusNotes,
            statusUpdatedAt: data.status ? new Date() : undefined,
            statusUpdateSource: data.status ? 'MANUAL' : undefined,
        },
        include: {
            outcomes: { include: { personalOutcome: true } },
            releases: { include: { personalRelease: true } },
            taskTags: { include: { personalTag: true } },
            telemetryAttributes: true,
        },
    });
}

export async function deletePersonalTask(id: string, userId: string) {
    const task = await prisma.personalTask.findUnique({
        where: { id },
        include: { personalProduct: true },
    });
    if (!task || task.personalProduct.userId !== userId) {
        throw new Error('Personal task not found');
    }

    await prisma.personalTask.delete({ where: { id } });
    return true;
}


// ============================================================================
// PERSONAL OUTCOME/RELEASE CRUD
// ============================================================================

export async function createPersonalOutcome(
    userId: string,
    data: { personalProductId: string; name: string; description?: string }
) {
    const product = await prisma.personalProduct.findFirst({
        where: { id: data.personalProductId, userId },
    });
    if (!product) throw new Error('Personal product not found');

    return prisma.personalOutcome.create({
        data: {
            personalProductId: data.personalProductId,
            name: data.name,
            description: data.description,
        },
    });
}

export async function updatePersonalOutcome(
    id: string,
    userId: string,
    data: { name?: string; description?: string }
) {
    const outcome = await prisma.personalOutcome.findUnique({
        where: { id },
        include: { personalProduct: true },
    });
    if (!outcome || outcome.personalProduct.userId !== userId) {
        throw new Error('Personal outcome not found');
    }

    return prisma.personalOutcome.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
        },
    });
}


export async function deletePersonalOutcome(id: string, userId: string) {
    const outcome = await prisma.personalOutcome.findUnique({
        where: { id },
        include: { personalProduct: true },
    });
    if (!outcome || outcome.personalProduct.userId !== userId) {
        throw new Error('Personal outcome not found');
    }

    await prisma.personalOutcome.delete({ where: { id } });
    return true;
}

export async function createPersonalRelease(
    userId: string,
    data: { personalProductId: string; name: string; version?: string; releaseDate?: Date }
) {
    const product = await prisma.personalProduct.findFirst({
        where: { id: data.personalProductId, userId },
    });
    if (!product) throw new Error('Personal product not found');

    return prisma.personalRelease.create({
        data: {
            personalProductId: data.personalProductId,
            name: data.name,
            version: data.version,
            releaseDate: data.releaseDate,
        },
    });
}

export async function updatePersonalRelease(
    id: string,
    userId: string,
    data: { name?: string; version?: string; releaseDate?: Date }
) {
    const release = await prisma.personalRelease.findUnique({
        where: { id },
        include: { personalProduct: true },
    });
    if (!release || release.personalProduct.userId !== userId) {
        throw new Error('Personal release not found');
    }

    return prisma.personalRelease.update({
        where: { id },
        data: {
            name: data.name,
            version: data.version,
            releaseDate: data.releaseDate,
        },
    });
}


export async function deletePersonalRelease(id: string, userId: string) {
    const release = await prisma.personalRelease.findUnique({
        where: { id },
        include: { personalProduct: true },
    });
    if (!release || release.personalProduct.userId !== userId) {
        throw new Error('Personal release not found');
    }

    await prisma.personalRelease.delete({ where: { id } });
    return true;
}

// ============================================================================
// PRODUCT IMPORTER
// ============================================================================

interface ExportedProduct {
    name: string;
    description?: string;
    resources?: any;
    tasks?: Array<{
        name: string;
        description?: string;
        estMinutes?: number;
        weight?: number;
        sequenceNumber?: number;
        howToDoc?: string[];
        howToVideo?: string[];
        outcomes?: Array<{ name: string }>;
        releases?: Array<{ name: string }>;
    }>;
    outcomes?: Array<{ name: string; description?: string }>;
    releases?: Array<{ name: string; version?: string; releaseDate?: string }>;
}

export async function importPersonalProduct(userId: string, exportData: ExportedProduct) {
    // Check limit
    const count = await prisma.personalProduct.count({ where: { userId } });
    if (count >= 10) {
        throw new Error('Personal product limit (10) reached.');
    }

    // Create product
    const product = await prisma.personalProduct.create({
        data: {
            userId,
            name: `${exportData.name} (imported)`,
            description: exportData.description,
            resources: exportData.resources,
        },
    });

    // Create outcomes
    const outcomeMap = new Map<string, string>(); // name -> id
    if (exportData.outcomes) {
        for (const o of exportData.outcomes) {
            const outcome = await prisma.personalOutcome.create({
                data: {
                    personalProductId: product.id,
                    name: o.name,
                    description: o.description,
                },
            });
            outcomeMap.set(o.name, outcome.id);
        }
    }

    // Create releases
    const releaseMap = new Map<string, string>(); // name -> id
    if (exportData.releases) {
        for (const r of exportData.releases) {
            const release = await prisma.personalRelease.create({
                data: {
                    personalProductId: product.id,
                    name: r.name,
                    version: r.version,
                    releaseDate: r.releaseDate ? new Date(r.releaseDate) : null,
                },
            });
            releaseMap.set(r.name, release.id);
        }
    }

    // Create tasks with linked outcomes/releases
    if (exportData.tasks) {
        for (let i = 0; i < exportData.tasks.length; i++) {
            const t = exportData.tasks[i];
            const task = await prisma.personalTask.create({
                data: {
                    personalProductId: product.id,
                    name: t.name,
                    description: t.description,
                    estMinutes: t.estMinutes ?? 30,
                    weight: t.weight ?? 1.0,
                    sequenceNumber: t.sequenceNumber ?? i + 1,
                    howToDoc: t.howToDoc ?? [],
                    howToVideo: t.howToVideo ?? [],
                },
            });

            // Link outcomes
            if (t.outcomes) {
                for (const o of t.outcomes) {
                    const outcomeId = outcomeMap.get(o.name);
                    if (outcomeId) {
                        await prisma.personalTaskOutcome.create({
                            data: { personalTaskId: task.id, personalOutcomeId: outcomeId },
                        });
                    }
                }
            }

            // Link releases
            if (t.releases) {
                for (const r of t.releases) {
                    const releaseId = releaseMap.get(r.name);
                    if (releaseId) {
                        await prisma.personalTaskRelease.create({
                            data: { personalTaskId: task.id, personalReleaseId: releaseId },
                        });
                    }
                }
            }
        }
    }

    // Return full product
    return getPersonalProduct(product.id, userId);
}
// ============================================================================
// COPY FROM CATALOG
// ============================================================================

export async function copyGlobalProductToPersonal(userId: string, productId: string) {
    // Check limit
    const count = await prisma.personalProduct.count({ where: { userId } });
    if (count >= 10) {
        throw new Error('Personal product limit (10) reached.');
    }

    // Fetch Global Product
    const globalProduct = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            tasks: {
                orderBy: { sequenceNumber: 'asc' },
                include: {
                    outcomes: true,
                    releases: true,
                    telemetryAttributes: true,
                    taskTags: true,
                }
            },
            outcomes: true,
            releases: true,
            licenses: true,
            tags: true,
        }
    });

    if (!globalProduct) throw new Error('Global product not found');

    // Create Personal Product
    const product = await prisma.personalProduct.create({
        data: {
            userId,
            name: `${globalProduct.name} (Copy)`,
            description: globalProduct.description,
            resources: globalProduct.resources as any,
            customAttrs: globalProduct.customAttrs as any,
        }
    });

    // Outcomes Map
    const outcomeMap = new Map<string, string>(); // GlobalOutcomeId -> PersonalOutcomeId
    for (const o of globalProduct.outcomes) {
        const po = await prisma.personalOutcome.create({
            data: {
                personalProductId: product.id,
                name: o.name,
                description: o.description,
            }
        });
        outcomeMap.set(o.id, po.id);
    }

    // Releases Map
    const releaseMap = new Map<string, string>(); // GlobalReleaseId -> PersonalReleaseId
    for (const r of globalProduct.releases) {
        const pr = await prisma.personalRelease.create({
            data: {
                personalProductId: product.id,
                name: r.name,
                level: r.level,
                version: String(r.level),
                description: r.description,
            }
        });
        releaseMap.set(r.id, pr.id);
    }

    // Licenses Map
    // const licenseMap = new Map<string, string>(); // Only if needed for relationships
    for (const l of globalProduct.licenses) {
        await prisma.personalLicense.create({
            data: {
                personalProductId: product.id,
                name: l.name,
                description: l.description,
                level: l.level,
                isActive: l.isActive,
                customAttrs: l.customAttrs as any,
                displayOrder: l.displayOrder,
            }
        });
    }

    // Tags Map
    const tagMap = new Map<string, string>(); // GlobalTagId -> PersonalTagId
    for (const t of globalProduct.tags) {
        const pt = await prisma.personalTag.create({
            data: {
                personalProductId: product.id,
                name: t.name,
                description: t.description,
                color: t.color,
                displayOrder: t.displayOrder,
            }
        });
        tagMap.set(t.id, pt.id);
    }

    // Tasks
    // LicenseLevel enum to int conversion
    const licenseLevelToInt = (level: string | null | undefined): number => {
        if (!level) return 1;
        switch (level) {
            case 'SIGNATURE': return 3;
            case 'ADVANTAGE': return 2;
            case 'ESSENTIAL':
            default: return 1;
        }
    };

    for (const t of globalProduct.tasks) {
        const pt = await prisma.personalTask.create({
            data: {
                personalProductId: product.id,
                name: t.name,
                description: t.description,
                estMinutes: t.estMinutes,
                weight: t.weight,
                sequenceNumber: t.sequenceNumber,
                howToDoc: t.howToDoc,
                howToVideo: t.howToVideo,
                status: 'NOT_STARTED',
                licenseLevel: licenseLevelToInt(t.licenseLevel),
            }
        });

        // Link Outcomes
        for (const o of t.outcomes) {
            const pid = outcomeMap.get(o.outcomeId);
            if (pid) {
                await prisma.personalTaskOutcome.create({
                    data: { personalTaskId: pt.id, personalOutcomeId: pid }
                });
            }
        }

        // Link Releases
        for (const r of t.releases) {
            const pid = releaseMap.get(r.releaseId);
            if (pid) {
                await prisma.personalTaskRelease.create({
                    data: { personalTaskId: pt.id, personalReleaseId: pid }
                });
            }
        }

        // Link Tags
        for (const tt of t.taskTags) {
            const pid = tagMap.get(tt.tagId);
            if (pid) {
                await prisma.personalTaskTag.create({
                    data: { personalTaskId: pt.id, personalTagId: pid }
                });
            }
        }

        // Copy Telemetry
        for (const ta of t.telemetryAttributes) {
            await prisma.personalTelemetryAttribute.create({
                data: {
                    personalTaskId: pt.id,
                    name: ta.name,
                    description: ta.description,
                    dataType: ta.dataType,
                    isRequired: ta.isRequired,
                    successCriteria: ta.successCriteria as any,
                    order: ta.order,
                    isActive: ta.isActive,
                }
            });
        }
    }

    return getPersonalProduct(product.id, userId);
}

// ============================================================================
// PERSONAL LICENSE CRUD
// ============================================================================

export async function createPersonalLicense(
    userId: string,
    data: {
        personalProductId: string;
        name: string;
        description?: string;
        level?: number;
        isActive?: boolean;
        customAttrs?: any;
    }
) {
    const product = await prisma.personalProduct.findFirst({
        where: { id: data.personalProductId, userId },
    });
    if (!product) throw new Error('Personal product not found');

    return prisma.personalLicense.create({
        data: {
            personalProductId: data.personalProductId,
            name: data.name,
            description: data.description,
            level: data.level ?? 1,
            isActive: data.isActive ?? true,
            customAttrs: data.customAttrs,
        },
    });
}

export async function updatePersonalLicense(
    id: string,
    userId: string,
    data: {
        name?: string;
        description?: string;
        level?: number;
        isActive?: boolean;
        customAttrs?: any;
    }
) {
    const license = await prisma.personalLicense.findUnique({
        where: { id },
        include: { personalProduct: true },
    });
    if (!license || license.personalProduct.userId !== userId) {
        throw new Error('Personal license not found');
    }

    return prisma.personalLicense.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
            level: data.level,
            isActive: data.isActive,
            customAttrs: data.customAttrs,
        },
    });
}

export async function deletePersonalLicense(id: string, userId: string) {
    const license = await prisma.personalLicense.findUnique({
        where: { id },
        include: { personalProduct: true },
    });
    if (!license || license.personalProduct.userId !== userId) {
        throw new Error('Personal license not found');
    }

    await prisma.personalLicense.delete({ where: { id } });
    return true;
}

export async function reorderPersonalLicenses(ids: string[], userId: string) {
    // Basic verification - check first item ownership
    if (ids.length === 0) return true;

    const firstId = ids[0];
    const license = await prisma.personalLicense.findUnique({
        where: { id: firstId },
        include: { personalProduct: true }
    });

    if (!license || license.personalProduct.userId !== userId) {
        throw new Error('Unauthorized or license not found');
    }

    await Promise.all(
        ids.map((id, index) =>
            prisma.personalLicense.update({
                where: { id },
                data: { displayOrder: index },
            })
        )
    );
    return true;
}

// ============================================================================
// PERSONAL TAG CRUD
// ============================================================================

export async function createPersonalTag(
    userId: string,
    data: {
        personalProductId: string;
        name: string;
        description?: string;
        color?: string;
    }
) {
    const product = await prisma.personalProduct.findFirst({
        where: { id: data.personalProductId, userId },
    });
    if (!product) throw new Error('Personal product not found');

    return prisma.personalTag.create({
        data: {
            personalProductId: data.personalProductId,
            name: data.name,
            description: data.description,
            color: data.color,
        },
    });
}

export async function updatePersonalTag(
    id: string,
    userId: string,
    data: {
        name?: string;
        description?: string;
        color?: string;
    }
) {
    const tag = await prisma.personalTag.findUnique({
        where: { id },
        include: { personalProduct: true },
    });
    if (!tag || tag.personalProduct.userId !== userId) {
        throw new Error('Personal tag not found');
    }

    return prisma.personalTag.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
            color: data.color,
        },
    });
}

export async function deletePersonalTag(id: string, userId: string) {
    const tag = await prisma.personalTag.findUnique({
        where: { id },
        include: { personalProduct: true },
    });
    if (!tag || tag.personalProduct.userId !== userId) {
        throw new Error('Personal tag not found');
    }

    await prisma.personalTag.delete({ where: { id } });
    return true;
}

export async function reorderPersonalTags(ids: string[], userId: string) {
    if (ids.length === 0) return true;
    const item = await prisma.personalTag.findUnique({ where: { id: ids[0] }, include: { personalProduct: true } });
    if (!item || item.personalProduct.userId !== userId) throw new Error('Unauthorized');

    await Promise.all(ids.map((id, index) => prisma.personalTag.update({ where: { id }, data: { displayOrder: index } })));
    return true;
}

// ============================================================================
// PERSONAL TELEMETRY ATTRIBUTE CRUD
// ============================================================================

export async function createPersonalTelemetryAttribute(
    userId: string,
    data: {
        personalTaskId: string;
        name: string;
        description?: string;
        dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
        isRequired?: boolean;
        successCriteria?: any;
        order?: number;
        isActive?: boolean;
    }
) {
    const task = await prisma.personalTask.findUnique({
        where: { id: data.personalTaskId },
        include: { personalProduct: true },
    });
    if (!task || task.personalProduct.userId !== userId) {
        throw new Error('Personal task not found');
    }

    return prisma.personalTelemetryAttribute.create({
        data: {
            personalTaskId: data.personalTaskId,
            name: data.name,
            description: data.description,
            dataType: (data.dataType as any) ?? 'STRING',
            isRequired: data.isRequired ?? false,
            successCriteria: data.successCriteria ?? {}, // required field
            order: data.order ?? 0,
            isActive: data.isActive ?? true,
        },
    });
}

export async function updatePersonalTelemetryAttribute(
    id: string,
    userId: string,
    data: {
        name?: string;
        description?: string;
        dataType?: string;
        isRequired?: boolean;
        successCriteria?: any;
        order?: number;
        isActive?: boolean;
    }
) {
    const attr = await prisma.personalTelemetryAttribute.findUnique({
        where: { id },
        include: { personalTask: { include: { personalProduct: true } } },
    });
    if (!attr || attr.personalTask.personalProduct.userId !== userId) {
        throw new Error('Attribute not found');
    }

    return prisma.personalTelemetryAttribute.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
            dataType: data.dataType as any,
            isRequired: data.isRequired,
            successCriteria: data.successCriteria,
            order: data.order,
            isActive: data.isActive,
        },
    });
}

export async function deletePersonalTelemetryAttribute(id: string, userId: string) {
    const attr = await prisma.personalTelemetryAttribute.findUnique({
        where: { id },
        include: { personalTask: { include: { personalProduct: true } } },
    });
    if (!attr || attr.personalTask.personalProduct.userId !== userId) {
        throw new Error('Attribute not found');
    }
    await prisma.personalTelemetryAttribute.delete({ where: { id } });
    return true;
}

export async function reorderPersonalTelemetryAttributes(ids: string[], userId: string) {
    if (ids.length === 0) return true;
    const item = await prisma.personalTelemetryAttribute.findUnique({ where: { id: ids[0] }, include: { personalTask: { include: { personalProduct: true } } } });
    if (!item || item.personalTask.personalProduct.userId !== userId) throw new Error('Unauthorized');

    await Promise.all(ids.map((id, index) => prisma.personalTelemetryAttribute.update({ where: { id }, data: { order: index } })));
    return true;
}

export async function reorderPersonalTasks(productId: string, taskIds: string[], userId: string) {
    // Verify ownership of product
    const product = await prisma.personalProduct.findFirst({
        where: { id: productId, userId }
    });
    if (!product) throw new Error('Product not found or access denied');

    // Verify all tasks belong to this product
    const tasks = await prisma.personalTask.findMany({
        where: { id: { in: taskIds }, personalProductId: productId }
    });
    if (tasks.length !== taskIds.length) throw new Error('Invalid task list');

    // Update sequence
    const updates = taskIds.map((id, index) =>
        prisma.personalTask.update({
            where: { id },
            data: { sequenceNumber: index + 1 }
        })
    );

    await prisma.$transaction(updates);
    return true; // or return tasks?
}
