/**
 * Central product/brand configuration.
 * Renaming the product later should only require editing this file (CLAUDE.md §1).
 */
export const PRODUCT = {
  /** Public working name. */
  name: 'EidosUs',
  /** Descriptive subtitle (English). */
  subtitle: 'Academic Active Reading Assistant',
  /** Turkish descriptive name. */
  nameTr: 'Akademik Sesli Okuma ve Kaynak Bağlantılı Not Asistanı',
  /** Short Turkish tagline used in headers. */
  taglineTr: 'Aktif Okuma & Araştırma Notları',
  /** Primary UI language for the MVP. */
  primaryLanguage: 'tr',
} as const;

export type Product = typeof PRODUCT;
