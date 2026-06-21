/**
 * Honest runtime capability detection for the Web Speech APIs (CLAUDE.md §9, §10, §18).
 * Used to surface clear states instead of failing silently.
 */

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  return 'SpeechRecognition' in w || 'webkitSpeechRecognition' in w;
}
