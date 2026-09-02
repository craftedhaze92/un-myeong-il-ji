import { describe, expect, it } from 'vitest';
import { calculateSaju } from './saju';
import {
  calculateElementDistribution,
  getElementStatusMap,
  groupTenGodsByElement,
} from './element_distribution';
import { calculateTenGodsDistribution } from './ten_gods';
import type { SajuData, WuXing } from '../types/index';

/**
 * view-model.test.ts의 합성 명식과 같은 값 — 일간 무(戊)에 지장간 세력이 지지별로 정확히
 * 100(=가중치 1.0)씩 합쳐지도록 손으로 짠 명식. calculateSaju가 만드는 실제 지장간 세력은
 * 절기 근접도에 따라 40~100 사이를 오가 합계가 8/6으로 딱 떨어지지 않으므로, "합계가
 * 정확히 얼마인가"를 검증하려면 실제 계산이 아니라 이렇게 통제된 고정값이 필요하다.
 */
const controlledSaju: SajuData = {
  birthDate: '1990-01-01',
  solarBirthDate: '1990-01-01',
  birthTime: '00:00',
  birthCity: '서울',
  calendar: 'solar',
  isLeapMonth: false,
  gender: 'male',
  unknownHour: false,
  year: { stem: '갑', branch: '자', stemElement: '목', branchElement: '수', yinYang: '양' },
  month: { stem: '을', branch: '축', stemElement: '목', branchElement: '토', yinYang: '음' },
  day: { stem: '무', branch: '오', stemElement: '토', branchElement: '화', yinYang: '양' },
  hour: { stem: '병', branch: '인', stemElement: '화', branchElement: '목', yinYang: '양' },
  wuxingCount: { 목: 2, 화: 2, 토: 2, 금: 0, 수: 2 },
  tenGods: [],
  jiJangGan: {
    year: { primary: { stem: '계', strength: 100 } },
    month: {
      primary: { stem: '기', strength: 60 },
      secondary: { stem: '신', strength: 20 },
      residual: { stem: '계', strength: 20 },
    },
    day: { primary: { stem: '정', strength: 70 }, secondary: { stem: '기', strength: 30 } },
    hour: {
      primary: { stem: '갑', strength: 60 },
      secondary: { stem: '병', strength: 30 },
      residual: { stem: '무', strength: 10 },
    },
  },
};

describe('calculateElementDistribution — 지장간 세력이 지지마다 정확히 100%로 합쳐지는 통제된 명식에서는 합계가 정확히 8이다', () => {
  // 네 지지(자·축·오·인) 모두 jiJangGan strength 합이 100이 되도록 설계했으므로
  // 4개 천간(1.0×4) + 4개 지지 지장간(1.0×4) = 8이 정확히 나와야 한다.
  it('합계가 정확히 8이다', () => {
    const { total } = calculateElementDistribution(controlledSaju);
    expect(total).toBeCloseTo(8, 10);
  });

  it('pct 5개 항목의 합이 100이다', () => {
    const { pct } = calculateElementDistribution(controlledSaju);
    const sum = Object.values(pct).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 0);
  });
});

describe('calculateElementDistribution — 실제 계산에서도 total은 항상 양수이고 pct 합은 100이다', () => {
  // 실제 지장간 세력은 절기 근접도에 따라 40~100 사이를 오가므로 total이 정확히
  // 8/6으로 떨어지지는 않는다. 그래도 pct는 total을 분모로 재정규화하므로 100%는 보장된다.
  const withHour = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');
  const unknownHour = calculateSaju('1990-05-15', '12:00', 'solar', false, 'male', '서울', {
    unknownHour: true,
  });

  it('시주 포함 명식의 total은 0보다 크다', () => {
    expect(calculateElementDistribution(withHour).total).toBeGreaterThan(0);
  });

  it('시간 미상 명식의 total이 시주 포함 명식보다 작다 (시주만큼 빠짐)', () => {
    const withTotal = calculateElementDistribution(withHour).total;
    const unknownTotal = calculateElementDistribution(unknownHour).total;
    expect(unknownTotal).toBeLessThan(withTotal);
  });

  it('pct 5개 항목의 합이 100에 가깝다', () => {
    const { pct } = calculateElementDistribution(withHour);
    const sum = Object.values(pct).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 0);
  });
});

describe('calculateElementDistribution — 오행 pct는 그 오행에 속한 십성 2개 pct의 합과 같다 (단일 소스 검증)', () => {
  const saju = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');
  const { counts, groups } = calculateElementDistribution(saju);
  const distribution = calculateTenGodsDistribution(saju, { includeDayMaster: true });

  it.each(Object.keys(groups) as WuXing[])('%s의 카운트가 해당 십성 두 개의 지장간 가중합(includeDayMaster)과 정확히 같다', (el) => {
    const [a, b] = groups[el]!.gods;
    expect(counts[el]).toBeCloseTo(distribution[a] + distribution[b], 10);
  });
});

describe('groupTenGodsByElement — 일간 오행 자신은 항상 비겁 그룹이다', () => {
  it.each(['목', '화', '토', '금', '수'] as WuXing[])('일간이 %s면 %s 자신이 비겁(비견/겁재) 그룹이다', (el) => {
    const groups = groupTenGodsByElement(el);
    expect(groups[el]!.group).toBe('비겁');
    expect(groups[el]!.gods).toEqual(['비견', '겁재']);
  });
});

describe('getElementStatusMap — wuxing.ts#analyzeWuXingBalance와 같은 임계값을 쓴다', () => {
  it('평균의 1.5배를 넘는 오행은 발달, 0.5배 미만은 부족으로 판정한다', () => {
    const counts: Record<WuXing, number> = { 목: 8, 화: 0, 토: 2, 금: 2, 수: 2 };
    // 평균 = 14/5 = 2.8. 목(8) > 4.2 → 발달. 화(0) < 1.4 → 부족. 나머지는 적정.
    const status = getElementStatusMap(counts);
    expect(status.목).toBe('발달');
    expect(status.화).toBe('부족');
    expect(status.토).toBe('적정');
  });
});
