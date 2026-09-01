import { describe, expect, it } from 'vitest';
import { calculateSaju } from './saju';
import { getEarthlyBranchFromYear } from './helpers';
import { analyzeSeyun } from './seyun_analysis';
import { analyzeWolun } from './wolun_analysis';

describe('세운의 유리/주의 달이 절기 기준 월지와 어긋나던 회귀 — 예전엔 세운 쪽만 2개월 밀려 있었다', () => {
  const saju = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');

  it('전제: 2024년(갑진년)의 연지는 진이다', () => {
    expect(getEarthlyBranchFromYear(2024)).toBe('진');
  });

  it('연지 진과 육합(진유합)인 유월 — 양력 9월 — 이 유리한 달에 포함된다', () => {
    const { importantPeriods } = analyzeSeyun(saju, 2024);
    expect(importantPeriods.favorableMonths).toContain(9);
  });

  it('연지 진과 충(진술충)인 술월 — 양력 10월 — 이 주의할 달에 포함된다', () => {
    const { importantPeriods } = analyzeSeyun(saju, 2024);
    expect(importantPeriods.cautiousMonths).toContain(10);
  });

  it('세운이 "유리한 달"로 꼽은 달의 실제 월지(analyzeWolun 기준)는 연지와 육합 관계다', () => {
    // 두 엔진의 "양력 월 → 월지" 변환 기준이 어긋나면(예: 한쪽만 오프바이원) 여기서 바로 깨진다.
    const { importantPeriods } = analyzeSeyun(saju, 2024);
    expect(importantPeriods.favorableMonths.length).toBeGreaterThan(0);
    importantPeriods.favorableMonths.forEach((month) => {
      const wolun = analyzeWolun(saju, 2024, month);
      expect(wolun.monthBranch).toBe('유'); // 진유합
    });
  });

  it('세운이 "주의할 달"로 꼽은 달의 실제 월지(analyzeWolun 기준)는 연지와 충 관계다', () => {
    const { importantPeriods } = analyzeSeyun(saju, 2024);
    expect(importantPeriods.cautiousMonths.length).toBeGreaterThan(0);
    importantPeriods.cautiousMonths.forEach((month) => {
      const wolun = analyzeWolun(saju, 2024, month);
      expect(wolun.monthBranch).toBe('술'); // 진술충
    });
  });
});

describe('세운 해석 — 실제 도전 근거가 없을 때 단정적인 기본 문구를 만들지 않는다', () => {
  const saju = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');

  it('충·불리 오행·낮은 점수가 모두 없는 해는 도전 과제를 빈 목록으로 반환한다', () => {
    const calmYear = Array.from({ length: 30 }, (_, index) => 2024 + index)
      .map((year) => analyzeSeyun(saju, year))
      .find((analysis) => analysis.interpretation.challenges.length === 0);

    expect(calmYear).toBeDefined();
    expect(calmYear?.interpretation.challenges).toEqual([]);
  });

  it('모든 세운 결과에서 특별한 어려움이 없다는 기본 문구를 생성하지 않는다', () => {
    const challenges = Array.from({ length: 30 }, (_, index) => 2024 + index)
      .flatMap((year) => analyzeSeyun(saju, year).interpretation.challenges);

    expect(challenges).not.toContain('특별한 어려움은 없습니다.');
  });
});
