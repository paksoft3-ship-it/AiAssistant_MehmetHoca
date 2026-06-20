export interface ParsedLine {
  text: string;
  pageNumber: number; // 1-based page index
  lineNumber: number; // 1-based line index within that page
  globalIndex: number; // 0-based index across the entire article
  isHeading?: boolean;
  isGraph?: boolean;
  graphSummary?: string;
}

export interface ParsedPage {
  pageNumber: number;
  text: string;
  lines: string[];
}

export interface Article {
  id: string;
  serialNumber?: number;
  title: string;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'docx' | 'doc' | 'txt';
  text: string;
  pages: ParsedPage[];
  lines: ParsedLine[];
  language?: string;
  // Preserve original content for dynamic toggling & on-the-fly voice switches
  originalTitle?: string;
  originalText?: string;
  originalPages?: ParsedPage[];
  originalLines?: ParsedLine[];
  originalLanguage?: string;
  lastReadIndex?: number;
}

export interface Note {
  id: string;
  number: number; // Sequential user-friendly number (1, 2, 3...)
  timestamp: string; // Formatted local time e.g., 15:54:17
  pageNumber: number; // Page number when the note was taken
  lineNumber: number; // Line number when the note was taken
  contextText: string; // The specific sentence/line being read when notes were triggered
  noteText: string; // The transcribed or typed note text
  createdAt: string; // Full date-time
  articleId: string;
  articleTitle: string;
}

export interface SpeechSettings {
  voiceURI: string;
  rate: number; // Speed multiplier (usually 0.5 to 2.0)
  pitch: number; // Speech pitch (0.5 to 2.0)
}

export interface AppVoice {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  isVirtual?: boolean;
  virtualPitch?: number;
  virtualRateMulti?: number;
}
