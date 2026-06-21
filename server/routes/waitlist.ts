import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { waitlistRequestSchema } from '../schemas/waitlist';

export const waitlistRouter = Router();

const DATA_DIR = process.env.WAITLIST_DIR || path.join(process.cwd(), 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.jsonl');

/**
 * POST /api/waitlist
 * Stores a beta signup in an isolated append-only JSONL file. Intentionally
 * decoupled from the core app data (CLAUDE.md §15) — failures here never affect
 * reading or notes.
 */
waitlistRouter.post('/', (req, res) => {
  const parsed = waitlistRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Geçersiz e-posta.', code: 'invalid_request', details: parsed.error.flatten() });
  }

  const record = {
    email: parsed.data.email,
    note: parsed.data.note ?? '',
    at: new Date().toISOString(),
  };

  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(WAITLIST_FILE, JSON.stringify(record) + '\n', 'utf8');
    // Privacy: log only that a signup occurred, not the address.
    console.info('[waitlist] new signup recorded');
    return res.json({ ok: true });
  } catch (err) {
    console.error('[waitlist] failed to persist signup:', err);
    return res.status(500).json({ error: 'Kayıt şu anda alınamadı.', code: 'server_error' });
  }
});
