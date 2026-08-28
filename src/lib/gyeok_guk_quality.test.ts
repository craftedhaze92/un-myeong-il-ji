import { describe, expect, it } from 'vitest';
import { analyzeGyeokGukQuality } from './gyeok_guk_quality';
import type { SajuData, TenGod } from '../types/index';

/**
 * 자평진전 성격(成格)/파격(破格) 판단 회귀 테스트.
 * gyeok_guk.ts는 격 "이름"만 정하고, 그 격이 잘 짜였는지는 이 파일이 별도로 판단한다.
 */

function emptyDist(): Record<TenGod, number> {
  return { 비견: 0, 겁재: 0, 식신: 0, 상관: 0, 편재: 0, 정재: 0, 편관: 0, 정관: 0, 편인: 0, 정인: 0 };
}

function baseSaju(overrides: Partial<SajuData>): SajuData {
  return {
    birthDate: '1990-01-01',
    solarBirthDate: '1990-01-01',
    birthTime: '00:00',
    birthCity: '서울',
    calendar: 'solar',
    isLeapMonth: false,
    gender: 'male',
    unknownHour: false,
    year: { stem: '갑', branch: '자', stemElement: '목', branchElement: '수', yinYang: '양' },
    month: { stem: '병', branch: '인', stemElement: '화', branchElement: '목', yinYang: '양' },
    day: { stem: '갑', branch: '오', stemElement: '목', branchElement: '화', yinYang: '양' },
    hour: { stem: '기', branch: '사', stemElement: '토', branchElement: '화', yinYang: '음' },
    wuxingCount: { 목: 2, 화: 3, 토: 1, 금: 0, 수: 1 },
    tenGods: [],
    dayMasterStrength: { level: 'medium', score: 50, analysis: '' },
    ...overrides,
  };
}

describe('analyzeGyeokGukQuality — 종격·중화격은 판단 대상이 아니다', () => {
  it('종왕격에는 quality가 없다(null)', () => {
    const saju = baseSaju({ tenGodsDistribution: emptyDist() });
    expect(analyzeGyeokGukQuality(saju, 'jong_wang')).toBeNull();
  });

  it('중화격에는 quality가 없다(null)', () => {
    const saju = baseSaju({ tenGodsDistribution: emptyDist() });
    expect(analyzeGyeokGukQuality(saju, 'balanced')).toBeNull();
  });

  it('tenGodsDistribution이 없으면 null이다', () => {
    const saju = baseSaju({});
    expect(analyzeGyeokGukQuality(saju, 'jeong_gwan')).toBeNull();
  });
});

describe('analyzeGyeokGukQuality — 정관격(正官格)', () => {
  it('재·인 구비하고 신강하며 상관·칠살이 없으면 성격(成格)이다', () => {
    const dist = { ...emptyDist(), 정관: 1, 정재: 1 };
    const saju = baseSaju({ tenGodsDistribution: dist, dayMasterStrength: { level: 'strong', score: 70, analysis: '' } });
    const result = analyzeGyeokGukQuality(saju, 'jeong_gwan')!;
    expect(result.status).toBe('성격');
    expect(result.useType).toBe('순용');
  });

  it('상관이 함께 투출하면(상관견관) 파격이다', () => {
    const dist = { ...emptyDist(), 정관: 1, 상관: 1 };
    const saju = baseSaju({ tenGodsDistribution: dist, dayMasterStrength: { level: 'strong', score: 70, analysis: '' } });
    const result = analyzeGyeokGukQuality(saju, 'jeong_gwan')!;
    expect(result.status).not.toBe('성격');
    expect(result.brokenBy.some((b) => b.includes('상관견관'))).toBe(true);
  });

  it('상관이 있어도 재성이 함께 있으면 통관으로 구제되어 파격까지는 아니다(패중유구 또는 성중유패)', () => {
    const dist = { ...emptyDist(), 정관: 1, 상관: 1, 정재: 1 };
    const saju = baseSaju({ tenGodsDistribution: dist, dayMasterStrength: { level: 'strong', score: 70, analysis: '' } });
    const result = analyzeGyeokGukQuality(saju, 'jeong_gwan')!;
    expect(result.status).toBe('패중유구');
    expect(result.rescuedBy.length).toBeGreaterThan(0);
  });

  it('편관이 섞이면(관살혼잡) 파격 사유에 포함된다', () => {
    const dist = { ...emptyDist(), 정관: 1, 편관: 1, 정재: 1 };
    const saju = baseSaju({ tenGodsDistribution: dist, dayMasterStrength: { level: 'strong', score: 70, analysis: '' } });
    const result = analyzeGyeokGukQuality(saju, 'jeong_gwan')!;
    expect(result.brokenBy.some((b) => b.includes('관살혼잡'))).toBe(true);
  });
});

describe('analyzeGyeokGukQuality — 정인격(正印格)은 신약해도 파격이 아니다(유일한 예외)', () => {
  it('신약해도 재성 과다가 없으면 성격이다', () => {
    const dist = { ...emptyDist(), 정인: 1 };
    const saju = baseSaju({ tenGodsDistribution: dist, dayMasterStrength: { level: 'weak', score: 30, analysis: '' } });
    const result = analyzeGyeokGukQuality(saju, 'jeong_in')!;
    expect(result.status).toBe('성격');
  });

  it('재성이 과다하면 재파인(財破印)으로 파격이다', () => {
    const dist = { ...emptyDist(), 정인: 1, 정재: 2, 편재: 1 };
    const saju = baseSaju({ tenGodsDistribution: dist, dayMasterStrength: { level: 'weak', score: 30, analysis: '' } });
    const result = analyzeGyeokGukQuality(saju, 'jeong_in')!;
    expect(result.status).not.toBe('성격');
    expect(result.brokenBy.some((b) => b.includes('재파인'))).toBe(true);
  });
});

describe('analyzeGyeokGukQuality — 식신격(食神格)은 재 또는 칠살 중 하나만 있어야 한다', () => {
  it('재성만 있으면 성격이다(식신생재)', () => {
    const dist = { ...emptyDist(), 식신: 1, 정재: 1 };
    const saju = baseSaju({ tenGodsDistribution: dist });
    const result = analyzeGyeokGukQuality(saju, 'sig_sin')!;
    expect(result.status).toBe('성격');
    expect(result.sangSin).toBe('편재');
  });

  it('재성과 칠살이 동시에 투출하면 식신이 감당하지 못해 파격이다', () => {
    const dist = { ...emptyDist(), 식신: 1, 정재: 1, 편관: 1 };
    const saju = baseSaju({ tenGodsDistribution: dist });
    const result = analyzeGyeokGukQuality(saju, 'sig_sin')!;
    expect(result.status).not.toBe('성격');
  });
});

describe('analyzeGyeokGukQuality — 칠살격(七殺格, chil_sal)은 역용(逆用)이다', () => {
  it('식상으로 제살하면 성격이고 useType은 역용이다', () => {
    const dist = { ...emptyDist(), 편관: 1, 식신: 1 };
    const saju = baseSaju({ tenGodsDistribution: dist, dayMasterStrength: { level: 'strong', score: 70, analysis: '' } });
    const result = analyzeGyeokGukQuality(saju, 'chil_sal')!;
    expect(result.useType).toBe('역용');
    expect(result.status).toBe('성격');
  });

  it('제살도 살인상생도 없으면 파격이다', () => {
    const dist = { ...emptyDist(), 편관: 1 };
    const saju = baseSaju({ tenGodsDistribution: dist, dayMasterStrength: { level: 'strong', score: 70, analysis: '' } });
    const result = analyzeGyeokGukQuality(saju, 'chil_sal')!;
    expect(result.status).toBe('파격');
  });
});
