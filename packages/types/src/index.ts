import { z } from "zod"

export const userRoleSchema = z.enum(["USER", "REPORTER", "ADMIN"])
export const userStatusSchema = z.enum(["ACTIVE", "SUSPENDED"])

export const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  role: userRoleSchema,
})

export type UserRole = z.infer<typeof userRoleSchema>
export type UserStatus = z.infer<typeof userStatusSchema>
export type SessionUser = z.infer<typeof sessionUserSchema>
