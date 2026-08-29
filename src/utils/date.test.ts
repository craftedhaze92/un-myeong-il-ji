import { describe, expect, it } from 'vitest';
import { getFortuneYearForManAge, getManAgeForFortuneYear } from './date';

describe('getFortuneYearForManAge — getManAgeForFortuneYear의 역함수 왕복 검증', () => {
  it('나이→연도→나이 왕복이 원래 나이로 돌아온다 (흐름 탭 대운 구간→세운 연도 캐스케이드가 의존)', () => {
    const birth = '1990-05-15';
    for (const age of [0, 1, 10, 34, 54, 83, 119]) {
      const year = getFortuneYearForManAge(birth, age);
      expect(getManAgeForFortuneYear(birth, year)).toBe(age);
    }
  });

  it('생일이 연말(12/31)이어도 왕복이 성립한다', () => {
    const birth = '1990-12-31';
    for (const age of [0, 5, 44]) {
      const year = getFortuneYearForManAge(birth, age);
      expect(getManAgeForFortuneYear(birth, year)).toBe(age);
    }
  });

  it('출생연도 + 나이가 그대로 연도가 된다', () => {
    expect(getFortuneYearForManAge('1990-05-15', 34)).toBe(2024);
  });
});
