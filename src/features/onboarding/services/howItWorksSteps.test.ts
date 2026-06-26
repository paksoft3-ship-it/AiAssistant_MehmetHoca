import { describe, it, expect } from 'vitest';
import {
  HOW_IT_WORKS_STEPS,
  buildHowItWorksScript,
  type HowItWorksStep,
} from './howItWorksSteps';

describe('howItWorksSteps', () => {
  it('covers the full core workflow in order', () => {
    // import → listen → pause → note → discuss → save → continue → export
    expect(HOW_IT_WORKS_STEPS).toHaveLength(8);
    expect(HOW_IT_WORKS_STEPS.every((s) => s.title && s.description && s.icon)).toBe(true);
  });

  it('builds a spoken script with numbered steps and the intro', () => {
    const script = buildHowItWorksScript();
    expect(script.startsWith('EidosUs nasıl çalışır?')).toBe(true);
    expect(script).toContain('Adım 1:');
    expect(script).toContain('Adım 8:');
    expect(script).toContain(HOW_IT_WORKS_STEPS[0].title);
  });

  it('numbers steps according to the provided list', () => {
    const steps: HowItWorksStep[] = [
      { icon: 'a', title: 'Bir', description: 'birinci' },
      { icon: 'b', title: 'İki', description: 'ikinci' },
    ];
    const script = buildHowItWorksScript(steps, 'Test');
    expect(script).toBe('Test Adım 1: Bir. birinci Adım 2: İki. ikinci');
  });
});
