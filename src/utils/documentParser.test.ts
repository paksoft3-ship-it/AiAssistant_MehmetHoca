import { describe, it, expect } from 'vitest';
import {
  detectLanguage,
  isLineHeading,
  checkIfGraph,
  isHeaderFooterNoise,
  isAcademicDisclaimerNoise,
  reconstructParagraphs,
  segmentTextIntoLines,
  collapseSpacedOutText,
  formatFileSize,
} from './documentParser';

describe('detectLanguage', () => {
  it('detects English from common stopwords', () => {
    expect(detectLanguage('the quick brown fox and the lazy dog is in the house')).toBe('en');
  });
  it('detects Turkish from common stopwords', () => {
    expect(detectLanguage('bu çalışma bir model ve yöntem için ile birlikte ele alınmıştır')).toBe(
      'tr',
    );
  });
  it('defaults to en when nothing matches', () => {
    expect(detectLanguage('zzzz qqqq wwww')).toBe('en');
  });
});

describe('isLineHeading', () => {
  it('treats numbered sections as headings', () => {
    expect(isLineHeading('1. Giriş')).toBe(true);
    expect(isLineHeading('2.1 Yöntem')).toBe(true);
  });
  it('does not treat full sentences as headings', () => {
    expect(isLineHeading('Bu cümle normal bir gövde metni cümlesidir ve nokta ile biter.')).toBe(
      false,
    );
  });
  it('rejects lines ending in continuation punctuation', () => {
    expect(isLineHeading('Bir sonraki bölümde,')).toBe(false);
  });
});

describe('checkIfGraph', () => {
  it('detects figure/table/graph captions', () => {
    expect(checkIfGraph('Şekil 1: Sistem mimarisi')).toBe(true);
    expect(checkIfGraph('Figure 3. Accuracy over time')).toBe(true);
    expect(checkIfGraph('Tablo 2: Sonuçlar')).toBe(true);
  });
  it('ignores ordinary prose', () => {
    expect(checkIfGraph('Bu paragraf grafiklerle ilgili değildir ve uzun bir cümledir.')).toBe(
      false,
    );
  });
});

describe('header/footer & disclaimer noise', () => {
  it('flags bare page numbers and pagination', () => {
    expect(isHeaderFooterNoise('12')).toBe(true);
    expect(isHeaderFooterNoise('- 7 -')).toBe(true);
    expect(isHeaderFooterNoise('Sayfa 3')).toBe(true);
    expect(isHeaderFooterNoise('3 / 10')).toBe(true);
  });
  it('flags DOI and copyright lines', () => {
    expect(isHeaderFooterNoise('DOI: 10.1234/abcd')).toBe(true);
    expect(isHeaderFooterNoise('© 2024 Elsevier')).toBe(true);
  });
  it('keeps real content', () => {
    expect(isHeaderFooterNoise('Bu çalışmanın amacı modeli değerlendirmektir.')).toBe(false);
  });
  it('detects academic disclaimers', () => {
    expect(isAcademicDisclaimerNoise('All rights reserved by the publisher')).toBe(true);
    expect(isAcademicDisclaimerNoise('Tüm hakları saklıdır')).toBe(true);
  });
});

describe('reconstructParagraphs', () => {
  it('joins a soft-wrapped line that continues in lowercase', () => {
    const out = reconstructParagraphs('Bu uzun bir satir olup devam eden\nbir cümledir.');
    expect(out).toHaveLength(1);
    expect(out[0]).toBe('Bu uzun bir satir olup devam eden bir cümledir.');
  });
  it('keeps separate paragraphs split by blank lines', () => {
    const out = reconstructParagraphs('Birinci paragraf budur.\n\nİkinci Paragraf Başlar Burada.');
    expect(out).toHaveLength(2);
  });
});

describe('segmentTextIntoLines', () => {
  it('splits a paragraph into sentences', () => {
    const out = segmentTextIntoLines('Bu birinci cümledir. Bu da ikinci cümledir.');
    expect(out).toEqual(['Bu birinci cümledir.', 'Bu da ikinci cümledir.']);
  });
  it('drops page-number noise', () => {
    const out = segmentTextIntoLines('Anlamlı bir cümle buradadır.\n\n42');
    expect(out).toContain('Anlamlı bir cümle buradadır.');
    expect(out).not.toContain('42');
  });
});

describe('collapseSpacedOutText', () => {
  it('collapses letter-spaced words', () => {
    expect(collapseSpacedOutText('S T R A T E J İ')).toBe('STRATEJİ');
  });
});

describe('formatFileSize', () => {
  it('formats bytes into readable units', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
  });
});
