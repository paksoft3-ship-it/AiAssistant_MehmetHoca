import { z } from 'zod';

/** Beta waitlist signup (CLAUDE.md §15). Isolated from the core app. */
export const waitlistRequestSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin.').max(254),
  note: z.string().max(500).optional(),
});

export type WaitlistRequest = z.infer<typeof waitlistRequestSchema>;
