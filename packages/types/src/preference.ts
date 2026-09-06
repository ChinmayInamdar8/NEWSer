import {z} from "zod";

export const createPreferenceSchema = z.object({
    name : z.string().max(100),
    slug: z.string().max(100),
    is_active: z.boolean()
})

export const updatePreferenceSchema = z.object({
    name : z.string().max(100).optional(),
    slug: z.string().max(100).optional(),
    is_active: z.boolean().optional()
}).refine(
    (data)=>
        data.name!==undefined || 
        data.is_active!==undefined ||
        data.slug!==undefined,
        {
            message:"At least one field must be provided",
        },
)

export type CreatePreference = z.infer<typeof createPreferenceSchema>;
export type updatePreference = z.infer<typeof updatePreferenceSchema>;