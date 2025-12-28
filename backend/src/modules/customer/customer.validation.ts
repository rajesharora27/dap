import { z } from 'zod';

export const CreateCustomerSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    description: z.string().max(5000, "Description is too long").optional().nullable()
});

export const UpdateCustomerSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long").optional(),
    description: z.string().max(5000, "Description is too long").optional().nullable()
});
