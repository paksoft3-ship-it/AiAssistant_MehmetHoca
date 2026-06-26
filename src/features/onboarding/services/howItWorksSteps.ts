/**
 * "Nasıl Çalışır?" (How It Works) — the canonical onboarding flow.
 *
 * Content lives here (not inside the component) so it can be reused by the
 * read-aloud feature and, later, swapped for i18n keys without touching the UI.
 * The steps mirror the core product workflow described in CLAUDE.md:
 *   import/upload → listen → pause → note → discuss → save → continue → export.
 */
export interface HowItWorksStep {
  /** Material Symbols icon name for the step. */
  icon: string;
  title: string;
  description: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    icon: 'upload_file',
    title: 'Belge yükleyin',
    description: 'PDF, DOCX veya TXT bir akademik belge yükleyin ya da örnek makaleyi açın.',
  },
  {
    icon: 'play_arrow',
    title: 'Dinlemeye başlayın',
    description: 'Metni doğal seslerle dinleyin; okunan cümle ekranda vurgulanır.',
  },
  {
    icon: 'pause',
    title: 'Duraklatın',
    description: 'Önemli bir yere geldiğinizde kontrol düğmeleriyle veya sesli komutla durdurun.',
  },
  {
    icon: 'edit_note',
    title: 'Notunuzu ekleyin',
    description: 'Bir pasaj seçin, düşüncenizi yazın veya sesli olarak söyleyin. Ham döküm korunur.',
  },
  {
    icon: 'forum',
    title: 'Pasajı tartışın',
    description: 'İsterseniz seçtiğiniz pasajı yapay zeka ile tartışıp anlayışınızı derinleştirin.',
  },
  {
    icon: 'link',
    title: 'Kaynağa bağlı kaydedin',
    description: 'Notunuz seçtiğiniz pasaj, sayfa ve bağlamla birlikte saklanır.',
  },
  {
    icon: 'resume',
    title: 'Dinlemeye devam edin',
    description: 'Kaldığınız yere dönün; okuma konumunuz otomatik olarak hatırlanır.',
  },
  {
    icon: 'download',
    title: 'Notlarınızı dışa aktarın',
    description: 'Tüm araştırma notlarınızı Markdown veya DOCX olarak indirin.',
  },
];

/**
 * Builds a single spoken script from the steps for the "Sesli Dinle" (read
 * aloud) action. Each step is announced with its ordinal so a listener can
 * follow along without looking at the screen — important for the accessibility
 * and hands-free use cases.
 */
export function buildHowItWorksScript(
  steps: HowItWorksStep[] = HOW_IT_WORKS_STEPS,
  intro = 'EidosUs nasıl çalışır?',
): string {
  const body = steps
    .map((step, i) => `Adım ${i + 1}: ${step.title}. ${step.description}`)
    .join(' ');
  return `${intro} ${body}`.trim();
}
