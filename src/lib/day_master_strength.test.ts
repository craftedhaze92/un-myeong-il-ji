import { describe, expect, it } from 'vitest';
import { analyzeDayMasterStrength, STRENGTH_BAND_THRESHOLDS } from './day_master_strength';
import type { SajuData } from '../types/index';

/**
 * 일간(day master) 강약 판정 회귀 테스트.
 *
 * 예전 구현은 sajuData.tenGodsDistribution.비견/겁재/정인/편인 개수만 세고
 * (지지 지장간 세력 없이) 월령 하나만 강/중/약 3단계로 봤다 — 득령·득지·득세·통근
 * 3요소 판정도, 월지/일지/시지/년지 사이 자리 가중치도 없었다. 이 파일의 재작성은
 * 8글자를 직접 순회해 자리 가중치를 곱한 아군/적군 세력비로 계산한다.
 *
 * 합성 명식은 일부러 극단적으로(전부 지원/전부 소모) 짜서 채점 방식 자체를 검증한다.
 * 실제 calculateSaju가 만드는 명식과 달리 여기서는 지지·천간 조합이 달력상 실재하지
 * 않아도 된다 — day_master_strength.ts는 SajuData 구조만 보고 계산하기 때문이다.
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
    year: { stem: '갑', branch: '자', stemElement: '목', branchElement: '수', yinYang: '양' },
    month: { stem: '갑', branch: '자', stemElement: '목', branchElement: '수', yinYang: '양' },
    day: { stem: '갑', branch: '자', stemElement: '목', branchElement: '수', yinYang: '양' },
    hour: { stem: '갑', branch: '자', stemElement: '목', branchElement: '수', yinYang: '양' },
    wuxingCount: { 목: 8, 화: 0, 토: 0, 금: 0, 수: 0 },
    tenGods: [],
    ...overrides,
  };
}

describe('analyzeDayMasterStrength — 득령·득지·득세 3요소가 전부 충족되면 강(强)으로 판정한다', () => {
  // 갑(甲) 일간. 월지=자(지장간 계 하나뿐, 인성)로 득령, 일지=자로 득지,
  // 나머지 천간·지지도 전부 비겁·인성으로 채워 득세까지 만족시킨다.
  const saju = baseSaju({
    year: { stem: '계', branch: '묘', stemElement: '수', branchElement: '목', yinYang: '음' },
    month: { stem: '계', branch: '자', stemElement: '수', branchElement: '수', yinYang: '음' },
    day: { stem: '갑', branch: '자', stemElement: '목', branchElement: '수', yinYang: '양' },
    hour: { stem: '갑', branch: '해', stemElement: '목', branchElement: '수', yinYang: '양' },
  });
  const result = analyzeDayMasterStrength(saju);

  it('득령·득지·득세가 모두 true다', () => {
    expect(result.deukRyeong).toBe(true);
    expect(result.deukJi).toBe(true);
    expect(result.deukSe).toBe(true);
  });

  it('점수가 STRENGTH_BAND_THRESHOLDS.strong 이상이라 강(strong 이상) 레벨이 나온다', () => {
    expect(result.score).toBeGreaterThanOrEqual(STRENGTH_BAND_THRESHOLDS.strong);
    expect(['strong', 'very_strong']).toContain(result.level);
  });

  it('일간과 같은 오행(목)의 천간을 지장간에 둔 자리(년지 묘의 을, 시지 해의 갑)만 통근으로 잡힌다', () => {
    // 통근은 "일간과 같은 오행의 천간"만 인정한다 — 월지·일지(자, 지장간 계/수)는
    // 인성으로 일간을 생조할 뿐 통근은 아니다.
    expect(result.rootedAt).toEqual(expect.arrayContaining(['year', 'hour']));
    expect(result.rootedAt).not.toContain('month');
    expect(result.rootedAt).not.toContain('day');
  });
});

describe('analyzeDayMasterStrength — 득령·득지·득세가 전부 실(失)이면 약(弱)으로 판정한다', () => {
  // 갑(甲) 일간. 월지=오(지장간 정·기, 상관·정재 — 인성/비겁 없음)로 실령,
  // 일지=오로 실지, 나머지도 전부 식상·재성·관성으로 채워 실세까지 만든다.
  const saju = baseSaju({
    year: { stem: '정', branch: '사', stemElement: '화', branchElement: '화', yinYang: '음' },
    month: { stem: '경', branch: '오', stemElement: '금', branchElement: '화', yinYang: '양' },
    day: { stem: '갑', branch: '오', stemElement: '목', branchElement: '화', yinYang: '양' },
    hour: { stem: '기', branch: '술', stemElement: '토', branchElement: '토', yinYang: '음' },
  });
  const result = analyzeDayMasterStrength(saju);

  it('득령·득지·득세가 모두 false다', () => {
    expect(result.deukRyeong).toBe(false);
    expect(result.deukJi).toBe(false);
    expect(result.deukSe).toBe(false);
  });

  it('점수가 STRENGTH_BAND_THRESHOLDS.medium 미만이라 약(weak 이하) 레벨이 나온다', () => {
    expect(result.score).toBeLessThan(STRENGTH_BAND_THRESHOLDS.medium);
    expect(['weak', 'very_weak']).toContain(result.level);
  });

  it('통근한 자리가 없다', () => {
    expect(result.rootedAt).toHaveLength(0);
  });
});

describe('analyzeDayMasterStrength — 월지 자리 가중치가 년지보다 크다', () => {
  // 우호적인 지지(묘 — 을목 하나뿐, 비겁)를 월지에 두는 경우와 년지에 두는 경우를
  // 비교한다. 나머지 자리는 전부 적군(식상·재성·관성) 글자로 채워 차이를 극대화한다.
  const drainStem = { stem: '경', stemElement: '금', yinYang: '양' } as const;
  const drainBranch = { branch: '사', branchElement: '화' } as const; // 병·무·경 = 식상·재성·관성
  const friendlyBranch = { branch: '묘', branchElement: '목' } as const; // 을(乙) 하나뿐 = 겁재

  const withFriendlyOnMonth = baseSaju({
    year: { stem: drainStem.stem, branch: drainBranch.branch, stemElement: drainStem.stemElement, branchElement: drainBranch.branchElement, yinYang: drainStem.yinYang },
    month: { stem: drainStem.stem, branch: friendlyBranch.branch, stemElement: drainStem.stemElement, branchElement: friendlyBranch.branchElement, yinYang: drainStem.yinYang },
    day: { stem: '갑', branch: '오', stemElement: '목', branchElement: '화', yinYang: '양' },
    hour: { stem: drainStem.stem, branch: '술', stemElement: drainStem.stemElement, branchElement: '토', yinYang: drainStem.yinYang },
  });

  const withFriendlyOnYear = baseSaju({
    year: { stem: drainStem.stem, branch: friendlyBranch.branch, stemElement: drainStem.stemElement, branchElement: friendlyBranch.branchElement, yinYang: drainStem.yinYang },
    month: { stem: drainStem.stem, branch: drainBranch.branch, stemElement: drainStem.stemElement, branchElement: drainBranch.branchElement, yinYang: drainStem.yinYang },
    day: { stem: '갑', branch: '오', stemElement: '목', branchElement: '화', yinYang: '양' },
    hour: { stem: drainStem.stem, branch: '술', stemElement: drainStem.stemElement, branchElement: '토', yinYang: drainStem.yinYang },
  });

  it('같은 우호 글자라도 월지에 있을 때가 년지에 있을 때보다 점수가 높다', () => {
    const monthScore = analyzeDayMasterStrength(withFriendlyOnMonth).score;
    const yearScore = analyzeDayMasterStrength(withFriendlyOnYear).score;
    expect(monthScore).toBeGreaterThan(yearScore);
  });
});

describe('analyzeDayMasterStrength — 시간 미상(unknownHour) 명식은 시주를 계산에서 뺀다', () => {
  const saju = baseSaju({
    unknownHour: true,
    hour: { stem: '갑', branch: '자', stemElement: '목', branchElement: '수', yinYang: '양' },
  });

  it('rootedAt에 hour가 절대 포함되지 않는다', () => {
    const result = analyzeDayMasterStrength(saju);
    expect(result.rootedAt).not.toContain('hour');
  });
});
