import { describe, expect, it } from 'vitest';
import { calculateSaju } from './saju';

describe('calculateSaju smoke test', () => {
  const result = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');

  it('computes the year pillar as 경오 (BASE_YEAR=4 arithmetic: (1990-4)%10=6→경, (1990-4)%12=6→오; matches the well-known 1990=경오년(백말띠))', () => {
    expect(result.year.stem).toBe('경');
    expect(result.year.branch).toBe('오');
  });

  it('returns all four pillars with valid, defined stem/branch/element fields', () => {
    for (const pillar of [result.year, result.month, result.day, result.hour]) {
      expect(pillar.stem).toBeTypeOf('string');
      expect(pillar.branch).toBeTypeOf('string');
      expect(pillar.stemElement).toBeTypeOf('string');
      expect(pillar.branchElement).toBeTypeOf('string');
      expect(['음', '양']).toContain(pillar.yinYang);
    }
  });

  it('wuxingCount always sums to exactly 8 (4 pillars × stem + branch)', () => {
    const total = Object.values(result.wuxingCount).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(8);
  });

  it('echoes back the input metadata unchanged', () => {
    expect(result.birthDate).toBe('1990-05-15');
    expect(result.birthTime).toBe('14:30');
    expect(result.calendar).toBe('solar');
    expect(result.gender).toBe('male');
    expect(result.birthCity).toBe('서울');
  });
});
