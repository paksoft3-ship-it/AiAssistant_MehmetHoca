import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Helper to execute generateContent with automatic exponential backoff for 429 rate limit/quota errors
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: any,
  maxRetries = 3,
  initialDelayMs = 2000
): Promise<any> {
  let attempt = 0;
  while (true) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      attempt++;
      const errorMessage = err?.message || String(err);
      const isRateLimit = 
        errorMessage.includes("429") || 
        errorMessage.includes("RESOURCE_EXHAUSTED") || 
        errorMessage.includes("quota") || 
        err?.status === 429 ||
        err?.code === 429;
      
      if (isRateLimit && attempt <= maxRetries) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[Gemini API Rate Limit 429] Çalışma kotası aşıldı. Girişim: ${attempt}. ${delay}ms sonra tekrar denenecek...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client lazily/safely
  let ai: GoogleGenAI | null = null;
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Gemini API client initialized successfully on the backend.");
    } else {
      console.warn("GEMINI_API_KEY environment variable is not defined. Using high-fidelity server fallbacks.");
    }
  } catch (err) {
    console.error("Failed to construct Gemini client:", err);
  }

  // API endpoint FIRST
  app.post("/api/gemini/summarize-graph", async (req, res) => {
    const { graphTitle, contextTitle, language } = req.body;
    const isTurkish = (language || 'tr').toLowerCase().startsWith('tr');

    if (!graphTitle) {
      return res.status(400).json({ error: "graphTitle is required." });
    }

    // High fidelity offline fallback templates if Gemini client is unavailable
    const fallbackSummary = isTurkish
      ? `Bu grafik, "${contextTitle || 'Makale Konusu'}" bağlamında "${graphTitle}" başlığıyla sunulmuştur. Grafik incelendiğinde, toplanan verilerin analizi doğrultusunda ilgili parametrelerin zaman içindeki değişim hızı ve genel eğilimi net bir şekilde görülmektedir. Özellikle adaptif veya akıllı sistemlerin entegrasyonuyla elde edilen başarı artışı ve süreç optimizasyonu grafik üzerinde belirgin bir dikey grafiksel ivmelenmeyle kanıtlanmıştır.`
      : `This graph, presented under the title "${graphTitle}" in the context of "${contextTitle || 'the article'}", shows the analytical distribution of relevant parameters. The data curve illustrates a steady upward trend in efficiency and performance growth, directly correlating with the adoption of advanced intelligent assistance methodologies as described in the text.`;

    if (!ai) {
      return res.json({ summary: fallbackSummary, isFallback: true });
    }

    try {
      const prompt = isTurkish
        ? `Lütfen akademik veya öğretici bir tonla, şu grafik başlığını ve makale bağlamını kullanarak 2-3 cümlelik çok doğal, akıcı ve insan sesiyle okunmaya uygun bir grafik özeti yaz. Bu bir sesli kitap okuma asistanıdır, bu yüzden okuyucuya doğrudan hitap eden, bir insanın grafik verilerini yorumlaması gibi doğal ve net bir dil kullan:
           Grafik Başlığı: "${graphTitle}"
           Makale / Belge Başlığı: "${contextTitle || 'Alternatif Başlık'}"
           Grafik neleri gösteriyor olabilir, akademik veya istatistiksel trendler neleri işaret ediyor olabilir, kısa ve bilgilendirici bir açıklama yap.`
        : `Please write a highly natural, fluent, and informative 2-3 sentence summary explaining this graph for a text-to-speech assistant. It should sound like a human expert briefly commenting on the visual chart:
           Graph Title: "${graphTitle}"
           Article Context: "${contextTitle || 'Active Document'}"`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      const summary = response.text?.trim() || fallbackSummary;
      return res.json({ summary, isFallback: false });
    } catch (err: any) {
      console.error("Gemini graph prompt failure:", err);
      return res.json({ summary: fallbackSummary, isFallback: true, error: err.message });
    }
  });

  // Batch Translation Endpoint (Single API request translates entire array of strings gracefully)
  app.post("/api/gemini/translate-batch", async (req, res) => {
    const { texts } = req.body;
    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: "texts array is required." });
    }

    if (!ai) {
      return res.json({ translatedTexts: texts, isFallback: true });
    }

    try {
      const prompt = `Lütfen aşağıdaki akademik, bilimsel veya teknik metin paragraflarını sırasıyla doğrudan Türkçeye çevir.
Çeviriler son derece profesyonel, akıcı, akademik olarak titiz ve kulağa doğal gelen Türkçe cümlelerle olmalıdır.
Metinlerin biçimlendirmesini, paragraflarını veya satır sonlarını aynen koru.
Çevrilen her metin, gönderilen listenin (input array) sırasıyla ve diziniyle (index) birebir tam eşleşmelidir.
Herhangi bir açıklama eklemeden, doğrudan bir JSON dizisi (JSON array of strings) döndür.`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { text: `Çevrilecek metin listesi:\n${JSON.stringify(texts, null, 2)}` }
            ]
          }
        ],
        config: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            },
            description: "Girdi metinlerinin birebir sırasıyla Türkçe çevirileri."
          }
        }
      });

      const responseText = response.text?.trim();
      let translatedTexts: string[] = [];
      try {
        translatedTexts = JSON.parse(responseText || "[]");
      } catch (parseErr) {
        console.warn("Failed to parse batch translate json, falling back...", parseErr);
        translatedTexts = [];
      }

      // Safeguard check for format size mismatch
      if (!Array.isArray(translatedTexts) || translatedTexts.length !== texts.length) {
        console.warn(`Translation array length mismatched. Input: ${texts.length}, Output: ${translatedTexts?.length}. Falling back to sequential prompt-by-prompt with retries.`);
        const fallbackList: string[] = [];
        for (const textItem of texts) {
          try {
            const singlePrompt = `Lütfen aşağıdaki teknik metni doğrudan Türkçeye çevir. Ekstra hiçbir açıklama ekleme, doğrudan çevrilmiş metni döndür:\n\n${textItem}`;
            const singleResponse = await generateContentWithRetry(ai, {
              model: "gemini-3.5-flash",
              contents: singlePrompt,
              config: { temperature: 0.3 }
            });
            fallbackList.push(singleResponse.text?.trim() || textItem);
          } catch (singleErr) {
            console.error("Single fallback translation item failed:", singleErr);
            fallbackList.push(textItem);
          }
        }
        translatedTexts = fallbackList;
      }

      return res.json({ translatedTexts, isFallback: false });
    } catch (err: any) {
      console.error("Gemini batch translation failure:", err);
      return res.json({ translatedTexts: texts, isFallback: true, error: err.message });
    }
  });

  app.post("/api/gemini/translate-text", async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "text is required." });
    }

    if (!ai) {
      // Safe fallback (return original text if API client is not configured)
      return res.json({ translatedText: text, isFallback: true });
    }

    try {
      const prompt = `Lütfen aşağıdaki akademik, bilimsel veya teknik metni İngilizce (veya başka bir dilden) doğrudan Türkçeye çevir. 
Çeviri son derece profesyonel, akıcı, akademik olarak titiz ve kulağa doğal gelen Türkçe cümlelerle olmalıdır. 
Metnin içinde geçen özel terimlerin yaygın Türkçe akademik karşılıklarını kullan, ancak gereksiz yere zorlama olan veya uydurma kelimeler kullanma (örneğin popüler terminolojiyi koru ya da yaygın çevirilerini yap).
Metnin biçimlendirmesini, paragraflarını veya satır sonlarını aynen koru. 
Ekstra hiçbir açıklama ekleme, doğrudan çevrilmiş metni döndür:
\n${text}`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.3, // Low temperature for precise translation
        }
      });

      const translatedText = response.text?.trim() || text;
      return res.json({ translatedText, isFallback: false });
    } catch (err: any) {
      console.error("Gemini translation prompt failure:", err);
      return res.json({ translatedText: text, isFallback: true, error: err.message });
    }
  });

  app.post("/api/gemini/debate", async (req, res) => {
    const { messages, contextText, articleTitle } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required." });
    }

    const systemInstruction = `Sen, kullanıcının akademik bir makale veya kitap/dergi okurken durup üzerine tartışmak, beyin fırtınası yapmak istediği akıllı, entelektüel, eleştirel ve sorgulayıcı bir Yapay Zeka Tartışma Arkadaşısın.
Kullanıcı seninle şu an okumakta olduğu şu bölüm üzerine kafa fırtınası yapıyor ve tartışıyor:
[OKUNAN AKADEMİK KISIM]: "${contextText || 'Bilinmiyor'}"
${articleTitle ? `[MAKALE/YAYIN BAŞLIĞI]: "${articleTitle}"` : ''}

Görevin:
1. Kullanıcının girdiğini (sorusunu, eleştirisini, yorumunu) referans cümle ile ilişkilendirerek ele al.
2. Derinlikli, bilimsel olarak tutarlı, ama aynı zamanda akıcı, samimi ve anlaşılır bir tonda yanıt ver.
3. Yanıtlarında çok uzun paragraflara boğulma (ortalama 2-3 kısa paragraf yeterlidir), diyalogu canlı tut.
4. Kullanıcıya ufuk açıcı birer soru veya alternatif bir perspektif sunarak tartışmayı canlı tut.
5. Sadece Türkçe dilinde cevap ver.`;

    if (!ai) {
      return res.json({ 
        text: "Harika bir noktaya değindiniz! Ancak şu an yapay zeka sunucusu ile bağlantı kurulamıyor. Yine de bu akademisyen referansı hakkında düşünmeye ve notlarınızı almaya devam edebilirsiniz.", 
        isFallback: true 
      });
    }

    try {
      // Map messages into Gemini friendly format { role: 'user' | 'model', parts: [{ text: string }] }
      const formattedContents = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const reply = response.text || "Yorumunuzu tam anlayamadım, lütfen tekrar tartar mısınız?";
      return res.json({ text: reply, isFallback: false });
    } catch (err: any) {
      console.error("Gemini debate call failure:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
