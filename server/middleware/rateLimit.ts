import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for AI endpoints (CLAUDE.md §14.2, §21). Defaults to 30 requests
 * per minute per IP; tune via env without code changes.
 */
export const aiRateLimiter = rateLimit({
  windowMs: Number(process.env.AI_RATE_WINDOW_MS) || 60_000,
  max: Number(process.env.AI_RATE_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.',
    code: 'rate_limited',
  },
});
