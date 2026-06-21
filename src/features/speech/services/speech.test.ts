import { describe, it, expect } from 'vitest';
import type { AppVoice } from '../../../types';
import { rankVoice, getBestVoiceForLanguage, getSpokenVoice } from './voiceRanking';
import { SPEED_OPTIONS, formatSpeedLabel } from './speechOptions';

function voice(partial: Partial<AppVoice> & { voiceURI: string; name: string; lang: string }): AppVoice {
  return { localService: true, default: false, ...partial };
}

describe('rankVoice (honest, rule-based)', () => {
  it('scores natural/neural cloud voices above basic local voices', () => {
    const neuralCloud = voice({ voiceURI: 'a', name: 'Microsoft Emel Online (Natural)', lang: 'tr-TR', localService: false });
    const basicLocal = voice({ voiceURI: 'b', name: 'Turkish', lang: 'tr-TR', localService: true });
    expect(rankVoice(neuralCloud)).toBeGreaterThan(rankVoice(basicLocal));
  });

  it('does NOT boost invented persona names (no tolga/cem/dilara bias)', () => {
    const fakePersona = voice({ voiceURI: 'a', name: 'Tolga', lang: 'tr-TR' });
    const plain = voice({ voiceURI: 'b', name: 'Ahmet', lang: 'tr-TR' });
    expect(rankVoice(fakePersona)).toBe(rankVoice(plain));
  });
});

describe('getBestVoiceForLanguage', () => {
  const voices = [
    voice({ voiceURI: 'en', name: 'English', lang: 'en-US' }),
    voice({ voiceURI: 'tr-basic', name: 'Turkish', lang: 'tr-TR' }),
    voice({ voiceURI: 'tr-neural', name: 'Turkish Neural', lang: 'tr-TR', localService: false }),
  ];
  it('picks the highest-ranked voice of the language', () => {
    expect(getBestVoiceForLanguage(voices, 'tr')?.voiceURI).toBe('tr-neural');
  });
  it('returns null when no voice matches', () => {
    expect(getBestVoiceForLanguage(voices, 'ja')).toBeNull();
  });
});

describe('getSpokenVoice', () => {
  const voices = [
    voice({ voiceURI: 'en', name: 'English', lang: 'en-US' }),
    voice({ voiceURI: 'tr', name: 'Turkish', lang: 'tr-TR' }),
  ];
  it('keeps the preferred voice when its language matches', () => {
    expect(getSpokenVoice(voices, 'tr', 'tr')?.voiceURI).toBe('tr');
  });
  it('ignores a preferred voice in the wrong language', () => {
    // Preferred is English but the document is Turkish → must switch to Turkish.
    expect(getSpokenVoice(voices, 'en', 'tr')?.voiceURI).toBe('tr');
  });
});

describe('SPEED_OPTIONS', () => {
  it('has no duplicate values', () => {
    expect(new Set(SPEED_OPTIONS).size).toBe(SPEED_OPTIONS.length);
  });
  it('formats labels consistently', () => {
    expect(formatSpeedLabel(1)).toBe('1.0x');
    expect(formatSpeedLabel(1.25)).toBe('1.25x');
    expect(formatSpeedLabel(2)).toBe('2.0x');
  });
});
