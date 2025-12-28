import { z } from 'zod';

export const CreateTaskSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    description: z.string().optional().nullable(),
    estMinutes: z.number().optional().nullable(),
    weight: z.number().optional().nullable(),
    licenseLevel: z.string().optional().nullable(),
    productId: z.string().optional().nullable(),
    solutionId: z.string().optional().nullable(),
    sequenceNumber: z.number().optional().nullable(),
    notes: z.string().optional().nullable(),
    howToDoc: z.array(z.string()).optional(),
    howToVideo: z.array(z.string()).optional(),
    outcomeIds: z.array(z.string()).optional(),
    releaseIds: z.array(z.string()).optional(),
    tagIds: z.array(z.string()).optional(),
    telemetryAttributes: z.array(z.any()).optional(),
    licenseId: z.string().optional()
});

export const UpdateTaskSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long").optional(),
    description: z.string().optional().nullable(),
    estMinutes: z.number().optional().nullable(),
    weight: z.number().optional().nullable(),
    licenseLevel: z.string().optional().nullable(),
    sequenceNumber: z.number().optional().nullable(),
    notes: z.string().optional().nullable(),
    howToDoc: z.array(z.string()).optional(),
    howToVideo: z.array(z.string()).optional(),
    outcomeIds: z.array(z.string()).optional(),
    releaseIds: z.array(z.string()).optional(),
    tagIds: z.array(z.string()).optional(),
    telemetryAttributes: z.array(z.any()).optional(),
    licenseId: z.string().optional()
});
