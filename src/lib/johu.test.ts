import { describe, expect, it } from 'vitest';
import { selectJohuYongSin } from './johu';
import type { SajuData } from '../types/index';

/**
 * 궁통보감 조후용신(johu.ts) 회귀 테스트.
 *
 * 핵심 회귀: 예전 조후 알고리즘(yongsin/seasonal_algorithm.ts의 SEASON_MAP)은 월지 12칸만
 * 보고 일간을 완전히 무시했다 — 같은 子月이면 갑목이든 임수든 똑같은 용신이 나왔다.
 * 궁통보감의 조후용신표는 일간(10) × 월지(12) = 120칸이 원칙이라, 일간이 다르면 같은
 * 월지라도 필요한 조후 글자가 달라야 한다. 아래 테스트들은 이걸 명시적으로 검증한다.
 */

function saju(overrides: {
  dayStem: SajuData['day']['stem'];
  monthBranch: SajuData['month']['branch'];
  chartStems?: SajuData['year']['stem'][];
}): SajuData {
  const [yearStem, hourStem] = overrides.chartStems ?? ['갑', '갑'];
  return {
    birthDate: '1990-01-01',
    solarBirthDate: '1990-01-01',
    birthTime: '00:00',
    birthCity: '서울',
    calendar: 'solar',
    isLeapMonth: false,
    gender: 'male',
    unknownHour: false,
    year: { stem: yearStem ?? '갑', branch: '자', stemElement: '목', branchElement: '수', yinYang: '양' },
    month: { stem: '갑', branch: overrides.monthBranch, stemElement: '목', branchElement: '수', yinYang: '양' },
    day: { stem: overrides.dayStem, branch: '오', stemElement: '목', branchElement: '화', yinYang: '양' },
    hour: { stem: hourStem ?? '갑', branch: '오', stemElement: '목', branchElement: '화', yinYang: '양' },
    wuxingCount: { 목: 4, 화: 2, 토: 0, 금: 0, 수: 2 },
    tenGods: [],
  };
}

describe('selectJohuYongSin — 대표 칸 회귀 고정', () => {
  it('갑목(甲木) 자월(子月, 한겨울)은 정화(丁火)로 온난한다', () => {
    const result = selectJohuYongSin(saju({ dayStem: '갑', monthBranch: '자' }));
    expect(result.yongSinStems).toContain('정');
    expect(result.yongSinElement).toBe('화');
  });

  it('병화(丙火) 인월(寅月, 초봄)은 임수(壬水)·경금(庚金)이 필요하다', () => {
    const result = selectJohuYongSin(saju({ dayStem: '병', monthBranch: '인' }));
    expect(result.yongSinStems).toEqual(expect.arrayContaining(['임', '경']));
  });

  it('경금(庚金) 자월(子月)은 병정(丙丁)으로 온난한다', () => {
    const result = selectJohuYongSin(saju({ dayStem: '경', monthBranch: '자' }));
    expect(result.yongSinElement).toBe('화');
    expect(result.yongSinStems).toContain('병');
  });

  it('기토(己土) 오월(午月, 한여름)은 계수(癸水)로 식히고 병화(丙火)를 보조로 쓴다', () => {
    const result = selectJohuYongSin(saju({ dayStem: '기', monthBranch: '오' }));
    expect(result.yongSinElement).toBe('수');
    expect(result.assistStems).toContain('병');
  });
});

describe('selectJohuYongSin — 일간이 다르면 같은 월지라도 조후용신이 달라진다 (핵심 회귀)', () => {
  it('같은 자월(子月)이라도 갑목은 화(정화), 임수는 토(무토)가 필요하다', () => {
    const gapResult = selectJohuYongSin(saju({ dayStem: '갑', monthBranch: '자' }));
    const imResult = selectJohuYongSin(saju({ dayStem: '임', monthBranch: '자' }));

    expect(gapResult.yongSinElement).not.toBe(imResult.yongSinElement);
    expect(gapResult.yongSinElement).toBe('화');
    expect(imResult.yongSinElement).toBe('토');
  });
});

describe('selectJohuYongSin — urgency(조후 시급도) 판정', () => {
  it('극단 계절(子月)이고 조후 글자가 원국에 없으면 high다', () => {
    // 갑목 자월의 조후용신은 정(丁) — 원국 어디에도 정이 없다.
    const result = selectJohuYongSin(saju({ dayStem: '갑', monthBranch: '자', chartStems: ['갑', '갑'] }));
    expect(result.hasInChart).toBe(false);
    expect(result.urgency).toBe('high');
  });

  it('극단 계절이지만 조후 글자가 이미 원국(년간)에 있으면 medium이다', () => {
    const result = selectJohuYongSin(saju({ dayStem: '갑', monthBranch: '자', chartStems: ['정', '갑'] }));
    expect(result.hasInChart).toBe(true);
    expect(result.urgency).toBe('medium');
  });

  it('중간 계절(卯月)이면 조후 글자 유무와 무관하게 low다', () => {
    const result = selectJohuYongSin(saju({ dayStem: '갑', monthBranch: '묘', chartStems: ['갑', '갑'] }));
    expect(result.urgency).toBe('low');
  });
});

describe('selectJohuYongSin — 신뢰도(confidence)는 verified 여부를 반영한다', () => {
  it('verified: true인 칸(무토 인월)은 verified: false인 칸(갑목 인월)보다 신뢰도가 높다', () => {
    // 둘 다 인월(같은 계절)이라 urgency 계산 조건은 유사하게 맞춘다.
    const verifiedEntry = selectJohuYongSin(saju({ dayStem: '무', monthBranch: '인' }));
    const unverifiedEntry = selectJohuYongSin(saju({ dayStem: '갑', monthBranch: '인' }));
    expect(verifiedEntry.confidence).toBeGreaterThan(unverifiedEntry.confidence);
  });
});
