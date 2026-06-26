import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

/**
 * Microsoft Edge "Read Aloud" neural TTS client.
 *
 * Wraps the maintained `msedge-tts` package, which talks to the same free,
 * key-less endpoint the Edge browser's Read-Aloud feature uses. This gives us
 * genuinely natural neural voices (e.g. tr-TR-EmelNeural / tr-TR-AhmetNeural)
 * instead of the single robotic device voice the Web Speech API exposes.
 *
 * The endpoint requires a rolling, time-based auth token whose scheme Microsoft
 * changes periodically; we delegate that (and the WebSocket protocol) to the
 * package so it stays working as the scheme evolves.
 *
 * Honesty note (CLAUDE.md §17): using this sends the text of the passage being
 * read to Microsoft's servers. The UI surfaces that, and users can always fall
 * back to the offline device voices.
 */

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** 0.5..2.0 multiplier -> a subtle Edge prosody pitch offset in Hz. */
function pitchHz(pitch: number): string {
  const hz = Math.round((clamp(pitch, 0.5, 2.0) - 1) * 50);
  return `${hz >= 0 ? "+" : ""}${hz}Hz`;
}

export interface EdgeTtsOptions {
  text: string;
  voice: string; // e.g. "tr-TR-EmelNeural"
  rate?: number; // 0.5..2.0 multiplier (passed through directly)
  pitch?: number; // 0.5..2.0 multiplier
}

/**
 * Synthesizes the given text and resolves with an MP3 buffer.
 * Rejects on network/protocol failure so the caller can degrade gracefully.
 */
export async function synthesizeEdgeTts(opts: EdgeTtsOptions): Promise<Buffer> {
  const { text, voice, rate = 1, pitch = 1 } = opts;

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  // `rate` accepts a relative multiplier directly (e.g. 0.95); pitch wants an
  // SSML-style offset string.
  const { audioStream } = tts.toStream(text, {
    rate: clamp(rate, 0.5, 2.0),
    pitch: pitchHz(pitch),
  });

  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    const timeout = setTimeout(() => {
      audioStream.destroy();
      reject(new Error("edge-tts timeout"));
    }, 20_000);

    audioStream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    audioStream.on("end", () => {
      clearTimeout(timeout);
      resolve(Buffer.concat(chunks));
    });
    audioStream.on("error", (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}
