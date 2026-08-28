import { describe, expect, it } from 'vitest';
import { selectYongSin } from './yong_sin';
import type { SajuData } from '../types/index';

/**
 * 용신 선정 우선순위(전왕 > 조후 > 억부 > 통관) 회귀 테스트.
 *
 * 예전 구현은 중화(medium)일 때 "사주에서 가장 적은 오행"을 그냥 용신으로 골랐다
 * (findWeakestElement) — 적은 오행이 오히려 기신인 경우가 흔해 근거가 없었다. 또한
 * 종격(전왕)이나 조후가 억부보다 앞서야 하는 경우를 전혀 구분하지 않았다.
 */

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
    year: { stem: '을', branch: '묘', stemElement: '목', branchElement: '목', yinYang: '음' },
    month: { stem: '계', branch: '묘', stemElement: '수', branchElement: '목', yinYang: '음' },
    day: { stem: '갑', branch: '오', stemElement: '목', branchElement: '화', yinYang: '양' },
    hour: { stem: '기', branch: '사', stemElement: '토', branchElement: '화', yinYang: '음' },
    wuxingCount: { 목: 3, 화: 2, 토: 1, 금: 0, 수: 2 },
    tenGods: [],
    ...overrides,
  };
}

describe('selectYongSin — 종격(從格)이면 전왕용신을 최우선으로 택한다', () => {
  it('종왕격(비겁 과다) 명식은 전왕용신으로 일간과 같은 오행(목)을 택한다', () => {
    const saju = baseSaju({
      dayMasterStrength: { level: 'strong', score: 90, analysis: '' },
      tenGodsDistribution: {
        비견: 5, 겁재: 1, 식신: 0, 상관: 0, 편재: 0, 정재: 0, 편관: 0, 정관: 0, 편인: 0, 정인: 0,
      },
    });
    const result = selectYongSin(saju);
    expect(result.method).toBe('jeonwang');
    expect(result.primaryYongSin).toBe('목');
  });
});

describe('selectYongSin — 조후가 시급(urgency: high)하면 억부보다 조후를 앞세운다', () => {
  it('子월(한겨울) 갑목이면서 원국에 화(火)가 전혀 없으면, 중화 판정이어도 조후용신(화)을 택한다 — ' +
    '예전엔 medium일 때 가장 적은 오행을 그냥 골랐다', () => {
    const saju = baseSaju({
      month: { stem: '계', branch: '자', stemElement: '수', branchElement: '수', yinYang: '음' },
      year: { stem: '을', branch: '축', stemElement: '목', branchElement: '토', yinYang: '음' },
      hour: { stem: '기', branch: '축', stemElement: '토', branchElement: '토', yinYang: '음' },
      wuxingCount: { 목: 3, 화: 0, 토: 2, 금: 0, 수: 3 },
      dayMasterStrength: { level: 'medium', score: 50, analysis: '' },
    });
    const result = selectYongSin(saju);
    expect(result.method).toBe('johu');
    expect(result.primaryYongSin).toBe('화');
  });
});

describe('selectYongSin — 일간이 강하면(억부) 식상·재성·관성 중에서 용신이 나온다', () => {
  it('묘월(중간 계절)에 강한 갑목은 억부용신으로 식상(화)을 주 용신 삼고, 재성·관성도 희신에 포함한다', () => {
    const saju = baseSaju({
      dayMasterStrength: { level: 'strong', score: 80, analysis: '' },
    });
    const result = selectYongSin(saju);
    expect(result.method).toBe('eokbu');
    expect(result.primaryYongSin).toBe('화'); // 식상(갑목이 생하는 오행)
    expect(result.xiSin).toEqual(expect.arrayContaining(['화', '토', '금'])); // 식상·재성·관성
  });
});

describe('selectYongSin — 중화(medium)이고 조후도 급하지 않으면 통관용신을 택한다', () => {
  it('목(3)과 토(3)가 팽팽히 상극하면 그 사이를 잇는 화(火)를 통관용신으로 택한다', () => {
    const saju = baseSaju({
      dayMasterStrength: { level: 'medium', score: 50, analysis: '' },
      wuxingCount: { 목: 3, 화: 0, 토: 3, 금: 0, 수: 0 },
    });
    const result = selectYongSin(saju);
    expect(result.method).toBe('tonggwan');
    expect(result.primaryYongSin).toBe('화');
  });

  it('상극하는 두 세력이 뚜렷하지 않으면 조후용신으로 폴백한다', () => {
    const saju = baseSaju({
      dayMasterStrength: { level: 'medium', score: 50, analysis: '' },
      // 목·화만 2개씩이고 목생화(상생) 관계라 상극 쌍이 하나도 성립하지 않는다.
      wuxingCount: { 목: 2, 화: 2, 토: 0, 금: 0, 수: 0 },
    });
    const result = selectYongSin(saju);
    expect(result.method).toBe('johu');
  });
});
