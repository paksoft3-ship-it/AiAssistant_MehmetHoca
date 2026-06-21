import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Type } from "@google/genai";
import { config, aiAvailable } from "./server/config";
import { generateContentWithRetry } from "./server/services/geminiClient";
import { aiRateLimiter } from "./server/middleware/rateLimit";
import { aiNotesRouter } from "./server/routes/aiNotes";
import { waitlistRouter } from "./server/routes/waitlist";

async function startServer() {
  const app = express();
  const PORT = config.port;

  app.use(express.json({ limit: config.bodyLimit }));

  if (aiAvailable()) {
    console.log("Gemini API client available on the backend.");
  } else {
    console.warn(
      "AI features unavailable (GEMINI_API_KEY missing or AI_FEATURES_ENABLED=false). The app still works for local reading and notes; AI actions degrade gracefully.",
    );
  }

  // Rate-limit AI + waitlist endpoints.
  app.use("/api/ai", aiRateLimiter);
  app.use("/api/gemini", aiRateLimiter);
  app.use("/api/waitlist", aiRateLimiter);

  // Phase 3 — academic note cleaning (modular route + Zod validation).
  app.use("/api/ai", aiNotesRouter);

  // Phase 7 — beta waitlist (isolated storage).
  app.use("/api/waitlist", waitlistRouter);

  // ── Secondary AI features (translation, discussion, figure) ──────────────
  // These remain here for now; they are modularized and hardened in Phase 6.

  app.post("/api/gemini/summarize-graph", async (req, res) => {
    const { graphTitle, contextTitle, language } = req.body || {};
    const isTurkish = (language || "tr").toLowerCase().startsWith("tr");

    if (!graphTitle || typeof graphTitle !== "string") {
      return res.status(400).json({ error: "graphTitle is required." });
    }

    // Honest fallback: when AI is unavailable we cannot see the figure, so we say
    // so instead of fabricating a trend (CLAUDE.md §14.6).
    const honestUnavailable = isTurkish
      ? `Grafiğin görsel verilerine erişemediğim için yalnızca "${graphTitle}" başlığına dayanarak yorum yapabilirim. Görsel içerik olmadan bir eğilim veya sonuç iddia edemem.`
      : `I cannot access the figure's visual data, so I can only comment based on the title "${graphTitle}". I cannot claim any trend or result without the visual content.`;

    if (!aiAvailable()) {
      return res.json({ summary: honestUnavailable, isFallback: true });
    }

    try {
      const prompt = isTurkish
        ? `Aşağıdaki grafik/şekil başlığına ve makale bağlamına dayanarak, YALNIZCA başlık ve çevresindeki metinden çıkarılabilecek kadarıyla, 2-3 cümlelik dürüst bir açıklama yaz. Görsel veriye erişimin olmadığını unutma; eğilim, yüzde veya kesin sonuç UYDURMA. Emin olmadığında bunu belirt.\nGrafik Başlığı: "${graphTitle}"\nMakale Başlığı: "${contextTitle || "Bilinmiyor"}"`
        : `Based only on the following figure title and article context, write an honest 2-3 sentence note using ONLY what the title and surrounding text support. You do not have access to the visual data; do NOT fabricate trends, percentages, or conclusions. State uncertainty when unsure.\nFigure Title: "${graphTitle}"\nArticle: "${contextTitle || "Unknown"}"`;

      const response = await generateContentWithRetry({
        model: config.geminiModel,
        contents: prompt,
        config: { temperature: 0.4 },
      });

      const summary = response.text?.trim() || honestUnavailable;
      return res.json({ summary, isFallback: false });
    } catch (err: any) {
      console.error("Gemini graph prompt failure:", err?.message);
      return res.json({ summary: honestUnavailable, isFallback: true });
    }
  });

  app.post("/api/gemini/translate-batch", async (req, res) => {
    const { texts } = req.body || {};
    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: "texts array is required." });
    }

    if (!aiAvailable()) {
      return res.json({ translatedTexts: texts, isFallback: true });
    }

    try {
      const prompt = `Lütfen aşağıdaki akademik metin paragraflarını sırasıyla doğrudan Türkçeye çevir.
Çeviriler profesyonel, akıcı ve akademik olarak titiz olmalı; biçimlendirmeyi koru.
Her çeviri, gönderilen listenin sırası ve diziniyle birebir eşleşmeli.
Açıklama ekleme; doğrudan bir JSON dizisi (array of strings) döndür.`;

      const response = await generateContentWithRetry({
        model: config.geminiModel,
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { text: `Çevrilecek metin listesi:\n${JSON.stringify(texts, null, 2)}` },
            ],
          },
        ],
        config: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Girdi metinlerinin birebir sırasıyla Türkçe çevirileri.",
          },
        },
      });

      let translatedTexts: string[] = [];
      try {
        translatedTexts = JSON.parse(response.text?.trim() || "[]");
      } catch {
        translatedTexts = [];
      }

      if (!Array.isArray(translatedTexts) || translatedTexts.length !== texts.length) {
        const fallbackList: string[] = [];
        for (const textItem of texts) {
          try {
            const single = await generateContentWithRetry({
              model: config.geminiModel,
              contents: `Lütfen aşağıdaki teknik metni doğrudan Türkçeye çevir. Açıklama ekleme:\n\n${textItem}`,
              config: { temperature: 0.3 },
            });
            fallbackList.push(single.text?.trim() || textItem);
          } catch {
            fallbackList.push(textItem);
          }
        }
        translatedTexts = fallbackList;
      }

      return res.json({ translatedTexts, isFallback: false });
    } catch (err: any) {
      console.error("Gemini batch translation failure:", err?.message);
      return res.json({ translatedTexts: texts, isFallback: true });
    }
  });

  app.post("/api/gemini/translate-text", async (req, res) => {
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required." });
    }

    if (!aiAvailable()) {
      return res.json({ translatedText: text, isFallback: true });
    }

    try {
      const prompt = `Lütfen aşağıdaki akademik metni doğrudan Türkçeye çevir. Profesyonel, akıcı ve akademik bir dil kullan; biçimlendirmeyi koru. Açıklama ekleme, doğrudan çevrilmiş metni döndür:\n${text}`;
      const response = await generateContentWithRetry({
        model: config.geminiModel,
        contents: prompt,
        config: { temperature: 0.3 },
      });
      return res.json({ translatedText: response.text?.trim() || text, isFallback: false });
    } catch (err: any) {
      console.error("Gemini translation failure:", err?.message);
      return res.json({ translatedText: text, isFallback: true });
    }
  });

  app.post("/api/gemini/debate", async (req, res) => {
    const { messages, contextText, articleTitle } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required." });
    }

    const systemInstruction = `Sen, kullanıcının okuduğu akademik bir pasaj üzerine tartışan, eleştirel ve sorgulayıcı bir Yapay Zeka Tartışma Arkadaşısın.
Tartışılan bölüm: "${contextText || "Bilinmiyor"}"
${articleTitle ? `Yayın: "${articleTitle}"` : ""}

Kurallar:
1. Yanıtı SADECE verilen pasaj ve bağlamla sınırla; tüm makalenin bunu desteklediğini iddia etme.
2. Kaynaktaki olguları yorumdan açıkça ayır.
3. Derinlikli ama akıcı, 2-3 kısa paragrafı geçmeyen yanıtlar ver.
4. Tartışmayı canlı tutacak bir soru veya alternatif bakış sun.
5. Sadece Türkçe yanıt ver.`;

    if (!aiAvailable()) {
      return res.json({
        text: "Şu an yapay zeka sunucusuna bağlanılamıyor. Yine de bu pasaj hakkında düşünmeye ve notlarınızı almaya devam edebilirsiniz.",
        isFallback: true,
      });
    }

    try {
      const formattedContents = messages.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: String(msg.content ?? "") }],
      }));

      const response = await generateContentWithRetry({
        model: config.geminiModel,
        contents: formattedContents,
        config: { systemInstruction, temperature: 0.7 },
      });

      return res.json({
        text: response.text || "Yorumunuzu tam anlayamadım, tekrar eder misiniz?",
        isFallback: false,
      });
    } catch (err: any) {
      console.error("Gemini debate failure:", err?.message);
      return res.status(502).json({ error: "Yapay zeka tartışma servisi şu anda yanıt veremedi.", code: "ai_error" });
    }
  });

  // ── Static / dev middleware ──────────────────────────────────────────────
  if (!config.isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EidosUs server running on port ${PORT}`);
  });
}

startServer();
