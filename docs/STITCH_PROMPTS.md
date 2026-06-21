# Stitch Prompts — EidosUs UI

Ready-to-paste prompts for Google Stitch (stitch.withgoogle.com). One prompt = one screen.

**How to use:**
1. Paste **STYLE PREAMBLE** at the top of every prompt (keeps screens consistent).
2. Then paste the screen-specific block below it.
3. Set platform (Web/Desktop or Mobile) as noted per screen; theme = Light (also generate Dark if you want).
4. Export the PNG + HTML/CSS and send them back. Keep the Turkish labels exactly as written.

---

## STYLE PREAMBLE (paste before every screen prompt)

> Design a calm, academic, trustworthy web app UI — "premium but not luxurious", modern, highly readable, minimal distraction. NOT playful, NOT gamified, no neon, no cartoon, no "AI sparkle" decoration.
> Colors: warm off-white background #FAFAF9; white cards #FFFFFF; hairline borders #E6E7EB; deep-navy headings #1B2A4A; body text #334155; muted text #64748B; primary muted indigo #4F46E5 (hover #4338CA, soft tint #EEF2FF); success emerald #059669; warning amber #D97706; destructive/recording red #DC2626; focus ring #6366F1.
> Typography: UI font "Inter"; document reading text uses a readable serif "Newsreader"; metadata/numbers use mono "IBM Plex Mono". Generous spacing, soft subtle shadows, rounded corners (cards 16–24px, buttons/inputs 12px, chips pill). Lucide-style thin icons. Language: Turkish.
> Accessibility: clear visible focus states, strong contrast, semantic buttons.

---

## 1. Landing / Marketing dashboard — (Web/Desktop)

> Screen: marketing landing + dashboard for an academic active-reading assistant called **EidosUs**.
> Top sticky bar: left = indigo rounded logo tile with a speaker icon + "EidosUs" and small subtitle "Aktif Okuma & Araştırma Notları". Right = voice select dropdown and speed dropdown (subtle, secondary).
> Hero (centered): small indigo pill badge "EidosUs — Aktif Okuma & Araştırma Notları"; large navy headline "Makaleyi dinleyin, durun, düşüncenizi söyleyin — kaynağa bağlı araştırma notuna dönüşsün."; one-line gray subtext about uploading PDF/DOCX/TXT and capturing source-linked notes.
> Upload dropzone card: dashed border, upload icon, "Akademik Belgeyi Buraya Bırakın veya Seçin", supported formats "PDF, DOCX, TXT", primary button "Cihazdan Dosya Seç".
> Secondary row: a soft indigo card "Bilgisayarımda makale dökümanı yok" with button "Örnek Makaleyle Dene".
> "Belge Kütüphaneniz" section: search field, language filter, sort dropdown; list of document rows each with index badge, title, mono meta (type • size • DİL • not sayısı), buttons "Okumaya Devam Et" and a trash icon.
> "NASIL ÇALIŞIR?" 4-card grid: 1 Dinle ve Aktif Oku, 2 Pasaj Seç Notunu Söyle, 3 Kaynağa Bağla, 4 Düzenle ve Sakla.
> "KİMLER İÇİN?" three pills: yüksek lisans/doktora öğrencileri; araştırmacılar ve akademisyenler; uzun akademik metinlerle çalışanlar.
> Beta waitlist card: headline "Ücretsiz Beta'ya katılın", email input + button "Beta'ya Katıl", tiny privacy line.
> FAQ accordion (4 items). Footer: "EidosUs — Academic Active Reading Assistant · Beta" + "Gizlilik ve Verileriniz" link.
> No fake testimonials, no user counts, no university logos.

---

## 2. Reader workspace — (Web/Desktop, 3 zones)

> Screen: document reading workspace, three columns.
> Top app bar: product mark + current paper title (truncated); center playback controls (previous, play/pause, next, stop) as round icon buttons; right = voice dropdown, speed dropdown, and a small "Kapat" button. A subtle local-privacy status dot.
> CENTER reading panel (largest): a thin toolbar with a search input "Belge içinde ara...", a match counter "2/7" with up/down chevrons, and below it a slim reading-progress bar labeled "Okuma: %38". Page tabs row "S.1 S.2 S.3...". Then the document on a white sheet: paragraphs in serif; ONE active sentence highlighted with indigo-soft background and a 4px indigo left border; small mono line numbers in the left margin. A floating pill "Bu Metne Not Ekle" appears over a highlighted text selection with the quoted text. Bottom: a prominent red button "DUR, NOT ALALIM!" with a pulsing dot.
> RIGHT notes rail: header "Araştırma Notları" with count chip, a sort dropdown and "Dışa Aktar" button; a search field and tag filter chips; a scrollable list of note cards. Each note card: "#1" badge, "Sayfa 4 ↗" link, origin chip "Sesli", optional violet "Düzenlendi" chip, an italic left-bordered source excerpt, the final note text, tag chips, and a footer row "Dinle · Düzenle · Sil".
> Mood: focused, quiet, academic. Reading comfort first.

---

## 3. Note editor — (Modal, Web + Mobile)

> Screen: centered modal dialog "Kaynağa Bağlı Not" with a small subtitle "Sayfa 4 · Seçili metne bağlı" and a close X.
> Source excerpt card at top: indigo-soft background, quote icon, label "KAYNAK PASAJ", italic quoted source sentence.
> Dictation row: a "Sesle Yazdır" button with a mic icon (and a red "Dinleniyor — Durdur" active state), plus small language pills TR EN DE FR ES IT; a tiny honest note "Ses tanıma davranışı tarayıcınıza ve cihazınıza bağlıdır."
> "Ham Döküm" textarea (raw transcript) with a "Temizle" link.
> A violet outline button "Akademik Olarak Düzenle" with a wand icon (optional AI step).
> "Düzenlenmiş Akademik Not" textarea with a "Ham dökümü kopyala" link.
> "Etiketler (virgülle ayırın)" input.
> Footer: ghost "İptal" + primary "Notu Kaydet" with a save icon.
> Clean, generous spacing, calm.

---

## 4. Research notes rail — (Component focus, Web)

> Screen: a single research-notes panel column on white surface.
> Header: "Araştırma Notları" + count chip; sort dropdown (Kaynak sırası / Eklenme / Güncelleme); "Dışa Aktar" button.
> Search input "Notlarda, pasajda ve etiketlerde ara..."; a horizontal row of tag filter chips ("Tümü" active + tags with tag icons).
> Note cards list (show 3): each with number badge, page-jump link with up-right arrow, origin chip (Sesli/Yazılı), italic source excerpt with left border, final note paragraph, small tag chips, and a divider footer with "Dinle / Düzenle / Sil" text buttons. Include one card in delete-confirm state ("Silinsin mi? Evet, Sil / Vazgeç") and one with a violet "Düzenlendi" chip.
> Also show the empty state variant: centered mic icon, "Henüz Not Yok", helper text about selecting a passage or "Dur, Not Alalım!".

---

## 5. Export dialog — (Modal, Web)

> Screen: centered modal "Notları Dışa Aktar" with close X and a download icon.
> Format section "Biçim": three selectable cards in a row — Markdown, Word (DOCX), Düz Metin (TXT) — each with an icon; one selected (indigo border + tint).
> Content section "İçerik": three checkboxes — "Kaynak pasajları dahil et", "Ham dökümleri dahil et", "Etiketleri dahil et".
> Order section "Sıralama": two toggle buttons "Kaynak sırası" (active) / "Eklenme zamanı".
> A checkbox "Yalnızca seçili notları dışa aktar" that reveals a small scrollable list of notes with checkboxes (each "#1 finalNote...").
> Footer: left "12 not dışa aktarılacak", right ghost "İptal" + primary "Dışa Aktar" with download icon.

---

## 6. Privacy notice — (Modal, Web + Mobile)

> Screen: centered modal "Gizlilik ve Verileriniz" with an emerald shield icon and close X.
> Three stacked items, each with an icon, bold title, and a short paragraph:
> 1) "Yerel depolama" (database icon) — belgeler ve notlar yalnızca tarayıcıda saklanır, sunucuda saklanmaz.
> 2) "Sesli okuma ve ses tanıma" (mic icon) — sesler cihaza bağlıdır; ses tanıma bazı tarayıcılarda çevrim içi olabilir; "tamamen çevrimdışı" denmez.
> 3) "Yapay zeka özellikleri" (sparkle icon) — yalnızca gerekli metin gönderilir; API anahtarı sunucuda; AI olmadan da kullanılabilir.
> A small gray line: ürün "%100 gizli" ya da "garantili premium ses" iddiasında bulunmaz.
> Footer: left red-outline "Verilerimi Sil" (trash icon) + right primary "Anladım".
> Honest, reassuring, plain.

---

## 7. Document library section — (Web, can be standalone)

> Screen: a "Belge Kütüphaneniz" panel on white surface.
> Header: title with a small indigo status dot + "Yerelde kayıtlı N belge". Controls row: search input "Belgelerde ara...", a language filter dropdown ("Tüm diller / Türkçe / English"), and a sort dropdown ("Son açılan / Başlık / Not sayısı / İlerleme").
> A divided list of document rows; each row: index badge (#1), bold title, mono meta line "PDF • 1.2 MB • DİL: Türkçe • 3 Not", and right-aligned "Okumaya Devam Et" button + trash icon. Include a thin reading-progress bar under one row's meta. Show an "Eşleşen belge bulunamadı" empty-filter state variant.

---

## 8. Mobile reader + notes (tabbed) — (Mobile)

> Screen: mobile layout for the reading app.
> Top compact bar: small logo + truncated paper title + a "Kapat" icon.
> A segmented tab switch full-width: "Okuma" (active) and "Notlar (3)".
> Reader tab: slim search + progress bar, the serif document with one highlighted active sentence and margin line numbers; a sticky bottom bar with playback controls and a red "DUR, NOT ALALIM!" button.
> Also produce the Notes tab variant: the research note cards list with search and tag chips, and an "Dışa Aktar" button.
> Touch-friendly targets, no cramped 3-column layout.

---

## 9. States — (Web, one board with variants)

> Screen: a board showing four small UI states for the upload/reader flow, consistent style:
> 1) Parsing: dropzone with a circular spinner, file icon, "Belge Analiz Ediliyor...", a thin progress bar "%62".
> 2) Unsupported file error: red-soft card, alert icon, "Ayrıştırma Hatası" + "Eski Word (.doc) formatı desteklenmiyor. Lütfen .docx veya .pdf olarak kaydedin."
> 3) Scanned PDF notice: amber-soft card, "Bu PDF taranmış görüntülerden oluşuyor olabilir; metin çıkarılamadı. OCR henüz desteklenmiyor."
> 4) AI unavailable inline note inside the note editor: small gray note "Akademik düzenleme şu anda yapılamadı. Notunuzu olduğu gibi kaydedebilirsiniz."
> Calm, honest, non-alarming.

---

## Tips for best Stitch results
- Generate **desktop** versions for screens 1, 2, 4, 5, 7, 9 and **mobile** for 3, 6, 8 (plus mobile of 1–2 if you want).
- Ask Stitch for **Light** first; regenerate **Dark** with "same layout, dark theme using #0B1120 canvas / #0F172A surfaces / #6366F1 primary".
- Keep all Turkish labels verbatim so the implementation matches the app copy.
- When you send files back, name them by screen (e.g. `01-landing.png`, `02-reader.html`) so I can map each to its component.
