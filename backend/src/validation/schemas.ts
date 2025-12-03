import { z } from 'zod';

export const CreateProductSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    description: z.string().max(5000, "Description is too long").optional().nullable(),
    customAttrs: z.record(z.string(), z.any()).optional().nullable(),
    licenseIds: z.array(z.string()).optional()
});

export const UpdateProductSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long").optional(),
    description: z.string().max(5000, "Description is too long").optional().nullable(),
    statusPercent: z.number().min(0).max(100).optional().nullable(),
    customAttrs: z.record(z.string(), z.any()).optional().nullable(),
    licenseIds: z.array(z.string()).optional()
});

export const CreateSolutionSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    description: z.string().max(5000, "Description is too long").optional().nullable(),
    customAttrs: z.record(z.string(), z.any()).optional().nullable()
});

export const UpdateSolutionSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long").optional(),
    description: z.string().max(5000, "Description is too long").optional().nullable(),
    customAttrs: z.record(z.string(), z.any()).optional().nullable()
});

export const CreateCustomerSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    description: z.string().max(5000, "Description is too long").optional().nullable()
});

export const UpdateCustomerSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long").optional(),
    description: z.string().max(5000, "Description is too long").optional().nullable()
});
