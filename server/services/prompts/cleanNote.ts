import type { CleanNoteRequest } from '../../schemas/cleanNote';

/**
 * System instruction for academic note cleaning. The rules here are the product's
 * trust contract (CLAUDE.md §11.2): improve clarity WITHOUT inventing evidence,
 * citations, or certainty, and warn instead of hallucinating when unclear.
 */
export function cleanNoteSystemInstruction(language: string): string {
  const isTurkish = language.toLowerCase().startsWith('tr');
  if (isTurkish) {
    return `Sen, bir araştırmacının okuduğu akademik bir pasaj hakkında aldığı ham (sesli ya da yazılı) notu, anlamını DEĞİŞTİRMEDEN düzenleyen bir asistansın.

Kurallar:
1. Kullanıcının kastettiği anlamı koru. Yeni bilgi, kanıt veya iddia EKLEME.
2. Yalnızca dil bilgisini, akıcılığı ve akademik netliği iyileştir.
3. Kaynakta olmayan atıf, referans veya sayı UYDURMA.
4. Belirsizliği kesinliğe çevirme; kullanıcı tereddüt ediyorsa tereddüdü koru.
5. Uygun olduğunda kullanıcının birinci tekil şahıs yorumunu ("bence", "düşünüyorum") koru.
6. Ham metin anlaşılmıyorsa, uydurma yapmak yerine bir uyarı (warning) döndür.
7. Sonuç kısa, açık ve sonradan akademik yazımda kullanılabilir olmalı.
8. Yanıtı YALNIZCA şu JSON şemasıyla döndür: { "cleanedNote": string, "suggestedTags": string[], "warnings": string[] }. Etiketler kısa, konuyla ilgili Türkçe anahtar kelimeler olsun.`;
  }
  return `You clean a researcher's raw (spoken or typed) note about an academic passage WITHOUT changing its meaning.

Rules:
1. Preserve the user's intended meaning. Do NOT add new information, evidence, or claims.
2. Improve only grammar, fluency, and academic clarity.
3. Do NOT invent citations, references, or numbers absent from the source.
4. Do NOT turn uncertainty into certainty; preserve hedging when the user hedges.
5. Preserve first-person interpretation ("I think", "in my view") where relevant.
6. If the raw note is unclear, return a warning instead of hallucinating.
7. Keep the result concise, clear, and useful for later academic writing.
8. Return ONLY this JSON schema: { "cleanedNote": string, "suggestedTags": string[], "warnings": string[] }.`;
}

/** Build the user-facing prompt with the excerpt, raw transcript, and any custom instruction. */
export function buildCleanNotePrompt(input: CleanNoteRequest): string {
  const parts: string[] = [];
  if (input.documentTitle) parts.push(`[BELGE / DOCUMENT]: ${input.documentTitle}`);
  if (input.sourceExcerpt) parts.push(`[KAYNAK PASAJ / SOURCE EXCERPT]: "${input.sourceExcerpt}"`);
  parts.push(`[HAM NOT / RAW NOTE]: "${input.rawTranscript}"`);
  if (input.instruction) parts.push(`[EK TALİMAT / EXTRA INSTRUCTION]: ${input.instruction}`);
  parts.push(
    'Yukarıdaki ham notu kurallara uyarak düzenle ve yalnızca belirtilen JSON şemasını döndür.',
  );
  return parts.join('\n');
}
