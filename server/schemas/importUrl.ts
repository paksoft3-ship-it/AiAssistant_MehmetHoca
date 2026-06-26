import { z } from 'zod';

export const importUrlRequestSchema = z.object({
  url: z.string().min(4).max(2048),
});

export type ImportUrlRequest = z.infer<typeof importUrlRequestSchema>;
