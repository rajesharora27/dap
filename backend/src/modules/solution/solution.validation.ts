import { z } from 'zod';

const ResourceSchema = z.object({
    label: z.string().min(1, "Label is required"),
    url: z.string().min(1, "URL is required")
});

export const CreateSolutionSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    resources: z.array(ResourceSchema).optional().nullable(),
    customAttrs: z.record(z.string(), z.any()).optional().nullable(),
    licenseIds: z.array(z.string()).optional()
});

export const UpdateSolutionSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long").optional(),
    resources: z.array(ResourceSchema).optional().nullable(),
    customAttrs: z.record(z.string(), z.any()).optional().nullable(),
    licenseIds: z.array(z.string()).optional()
});
