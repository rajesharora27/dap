import { z } from 'zod';

const ResourceSchema = z.object({
    label: z.string().min(1, "Label is required"),
    url: z.string().min(1, "URL is required")
});

export const CreateProductSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    resources: z.array(ResourceSchema).optional().nullable(),
    customAttrs: z.record(z.string(), z.any()).optional().nullable(),
    licenseIds: z.array(z.string()).optional()
});

export const UpdateProductSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long").optional(),
    resources: z.array(ResourceSchema).optional().nullable(),
    statusPercent: z.number().min(0).max(100).optional().nullable(),
    customAttrs: z.record(z.string(), z.any()).optional().nullable(),
    licenseIds: z.array(z.string()).optional()
});
