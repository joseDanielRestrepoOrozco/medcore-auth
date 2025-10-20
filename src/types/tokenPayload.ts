import { z } from 'zod';

export const tokenPayloadSchema = z.object({
  userId: z.string(),
  email: z.email(),
  fullname: z.string(),
  role: z.string().optional(),
});

export type TokenPayload = z.infer<typeof tokenPayloadSchema>;
