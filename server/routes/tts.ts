import { Router } from "express";
import { z } from "zod";
import { synthesizeEdgeTts } from "../services/edgeTts";

/**
 * Natural neural TTS proxy (CLAUDE.md §9 — honest, server-side voice rendering).
 *
 * Renders one passage at a time to MP3 via Microsoft's free Edge Read-Aloud
 * endpoint. No API key is required. The client plays the returned audio and
 * can always fall back to offline device voices.
 */
export const ttsRouter = Router();

// The voice name is interpolated into SSML, so constrain it to the well-formed
// `<lang>-<REGION>-<Name>Neural` shape to prevent any injection.
const VOICE_RE = /^[a-z]{2,3}-[A-Z]{2,4}-[A-Za-z0-9]+Neural$/;

const schema = z.object({
  text: z.string().min(1).max(6000),
  voice: z.string().regex(VOICE_RE, "Geçersiz ses adı."),
  rate: z.number().min(0.5).max(2).optional(),
  pitch: z.number().min(0.5).max(2).optional(),
  lang: z
    .string()
    .regex(/^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$/)
    .max(20)
    .optional(),
});

ttsRouter.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Geçersiz seslendirme isteği.", code: "bad_request" });
  }

  const { text, voice, rate, pitch } = parsed.data;

  try {
    const audio = await synthesizeEdgeTts({ text, voice, rate, pitch });
    if (!audio.length) {
      return res
        .status(502)
        .json({ error: "Doğal ses üretilemedi.", code: "tts_empty" });
    }
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", String(audio.length));
    res.setHeader("Cache-Control", "no-store");
    return res.send(audio);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Don't log the passage text — only the failure reason (CLAUDE.md §14.2).
    console.error("edge-tts failure:", message);
    return res.status(502).json({
      error: "Doğal ses servisi şu anda kullanılamıyor. Cihaz sesleriyle devam edebilirsiniz.",
      code: "tts_unavailable",
    });
  }
});
