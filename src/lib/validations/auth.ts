import { z } from "zod";

export const authCredentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  fullName: z.string().trim().max(80).optional(),
});

export type AuthCredentialsInput = z.infer<typeof authCredentialsSchema>;
