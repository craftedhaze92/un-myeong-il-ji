import { describe, expect, it } from 'vitest';
import { getTenGodDomainDelta, calculateTenGodsDistribution } from './ten_gods';
import { calculateSaju } from './saju';
import type { SajuData } from '../types/index';

// 일간을 갑(甲, 양목)으로 고정하고, 기간 천간을 바꿔가며 십성 카테고리별
// (재성/관성/식상/인성/비겁) 델타 방향이 명리학 육친 대응과 일치하는지 검증한다.
//
// 갑(甲) 기준:
// - 무(戊, 양토) → 갑이 극하는 오행(토) = 재성(편재)
// - 경(庚, 양금) → 갑을 극하는 오행(금) = 관성(편관)
// - 병(丙, 양화) → 갑이 생하는 오행(화) = 식상(식신)
// - 임(壬, 양수) → 갑을 생하는 오행(수) = 인성(편인)
// - 갑(甲) 자신  → 같은 오행 = 비겁(비견)
describe('getTenGodDomainDelta — 십성 카테고리별 4대 영역 델타', () => {
  it('재성(무) 관계는 wealth가 가장 크게 오른다', () => {
    const delta = getTenGodDomainDelta('갑', '무');
    expect(delta.wealth).toBeGreaterThan(delta.career);
    expect(delta.wealth).toBeGreaterThan(delta.health);
    expect(delta.wealth).toBeGreaterThan(delta.relationship);
    expect(delta.wealth).toBeGreaterThan(0);
  });

  it('관성(경) 관계는 career가 가장 크게 오르고 health는 가장 크게 내려간다', () => {
    const delta = getTenGodDomainDelta('갑', '경');
    expect(delta.career).toBeGreaterThan(delta.wealth);
    expect(delta.career).toBeGreaterThan(delta.relationship);
    expect(delta.health).toBeLessThan(0);
    expect(delta.health).toBeLessThan(delta.career);
    expect(delta.health).toBeLessThan(delta.wealth);
    expect(delta.health).toBeLessThan(delta.relationship);
  });

  it('식상(병) 관계는 career와 wealth가 함께 오르되 health는 소폭 내려간다', () => {
    const delta = getTenGodDomainDelta('갑', '병');
    expect(delta.career).toBeGreaterThan(0);
    expect(delta.wealth).toBeGreaterThan(0);
    expect(delta.health).toBeLessThan(0);
  });

  it('인성(임) 관계는 health가 가장 크게 오른다 — 일간을 생(生)하는 자양분', () => {
    const delta = getTenGodDomainDelta('갑', '임');
    expect(delta.health).toBeGreaterThan(delta.career);
    expect(delta.health).toBeGreaterThan(delta.wealth);
    expect(delta.health).toBeGreaterThan(delta.relationship);
    expect(delta.health).toBeGreaterThan(0);
  });

  it('비겁(갑 자신) 관계는 relationship이 오르고 wealth는 내려간다 — 군겁쟁재', () => {
    const delta = getTenGodDomainDelta('갑', '갑');
    expect(delta.relationship).toBeGreaterThan(0);
    expect(delta.wealth).toBeLessThan(0);
  });

  it('같은 입력이면 항상 같은 델타를 반환한다 (무작위 요소 없음)', () => {
    const first = getTenGodDomainDelta('경', '을');
    const second = getTenGodDomainDelta('경', '을');
    expect(second).toEqual(first);
  });
});

describe('calculateTenGodsDistribution — includeDayMaster 옵션 회귀 가드', () => {
  // element_distribution.ts#calculateElementDistribution이 오행 파이차트용으로
  // { includeDayMaster: true }를 새로 도입했다. 옵션을 안 넘기는 기존 호출부
  // (saju.ts의 sajuData.tenGodsDistribution 등)의 결과가 이 옵션 추가로 바뀌면 안 된다.
  const saju = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');

  it('옵션을 생략하면 { includeDayMaster: false }와 완전히 같은 값을 낸다', () => {
    const withoutOption = calculateTenGodsDistribution(saju);
    const explicitFalse = calculateTenGodsDistribution(saju, { includeDayMaster: false });
    expect(withoutOption).toEqual(explicitFalse);
  });

  it('includeDayMaster: true는 비견 값을 옵션 없을 때보다 1 이상 늘린다 (일간 자신이 비견으로 잡힘)', () => {
    const base = calculateTenGodsDistribution(saju);
    const withDayMaster = calculateTenGodsDistribution(saju, { includeDayMaster: true });
    expect(withDayMaster.비견).toBeGreaterThanOrEqual(base.비견 + 1);
  });

  it('includeDayMaster: true의 십성 가중합 총계는 옵션 없을 때보다 크거나 같다 (제외됐던 슬롯이 다시 더해지므로)', () => {
    const sum = (d: Record<string, number>) => Object.values(d).reduce((a, b) => a + b, 0);
    const base = calculateTenGodsDistribution(saju);
    const withDayMaster = calculateTenGodsDistribution(saju, { includeDayMaster: true });
    expect(sum(withDayMaster)).toBeGreaterThan(sum(base));
  });
});

describe('calculateTenGodsDistribution — includeDayMaster 총계 정확도 (통제된 지장간 세력 명식)', () => {
  // 실제 calculateSaju가 만드는 지장간 세력은 절기 근접도에 따라 40~100 사이를 오가
  // "정확히 얼마"를 검증하기 어렵다. 지지마다 지장간 세력 합이 정확히 100이 되도록
  // 손으로 짠 명식(view-model.test.ts의 합성 명식과 동일)으로 정확한 차이를 검증한다.
  // 일간은 무(戊). 일간과 같은 슬롯은 (1) 일주 천간 자신, (2) 시지(인) 지장간의 잔여
  // 무(戊) 10% 하나 — 총 1.0 + 0.1 = 1.1만큼 base에서 빠져 있어야 한다.
  const saju: SajuData = {
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

  // 예전엔 정확히 1.1이 나왔다 — includeDayMaster: false에서도 "일간과 같은 천간이면
  // 무조건 제외" 가드가 걸려 있어서, 시지(인) 지장간 여기의 무(戊) 10%(일간과 같은
  // 천간이지만 일간 자신이 아니라 시지에 통근한 것)까지 base에서 빠졌었다. 지금은
  // 그 통근분이 base에도 정상 반영되므로, includeDayMaster: true가 추가하는 건
  // "일주 천간 자신(1.0)" 하나뿐이라 차이가 정확히 1이 된다.
  it('includeDayMaster: true의 총계가 옵션 없을 때보다 정확히 1 크다 — 일주 천간 자신만 추가되고, 다른 자리의 통근분은 base에도 이미 반영돼 있다', () => {
    const sum = (d: Record<string, number>) => Object.values(d).reduce((a, b) => a + b, 0);
    const base = calculateTenGodsDistribution(saju);
    const withDayMaster = calculateTenGodsDistribution(saju, { includeDayMaster: true });
    expect(sum(withDayMaster) - sum(base)).toBeCloseTo(1, 10);
  });

  it('includeDayMaster: true의 총계는 정확히 8이다 (천간 4 + 지지 지장간 4×1.0)', () => {
    const sum = (d: Record<string, number>) => Object.values(d).reduce((a, b) => a + b, 0);
    const withDayMaster = calculateTenGodsDistribution(saju, { includeDayMaster: true });
    expect(sum(withDayMaster)).toBeCloseTo(8, 10);
  });

  it('옵션 없이도(includeDayMaster: false) 일간과 같은 천간을 가진 다른 자리(시지 잔여 지장간)의 세력이 비견에 반영된다 — ' +
    '예전엔 `stem !== dayStem` 가드가 "일간과 같은 천간이면 무조건 제외"까지 겸해서, 통근분까지 통째로 0으로 만들었다', () => {
    const base = calculateTenGodsDistribution(saju);
    // 시지(인) 지장간 여기 무(戊) 10% 하나가 유일한 "일간과 같은 천간" 매치.
    expect(base.비견).toBeCloseTo(0.1, 10);
  });
});

describe('calculateTenGodsDistribution — 연간이 일간과 같은 천간인 경우의 비견 집계 (Phase A 회귀)', () => {
  // 갑(甲) 일간, 연간도 갑(甲)인 합성 명식 — 연간은 stems 배열에 항상 들어가므로
  // 예전 가드("일간과 같은 천간이면 제외")가 걸리면 이 연간 갑이 통째로 사라진다.
  // 갑-갑은 같은 오행+같은 음양이라 정의상 비견이어야 한다.
  const saju: SajuData = {
    birthDate: '1984-02-10',
    solarBirthDate: '1984-02-10',
    birthTime: '10:00',
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
  };

  it('연간이 일간과 같은 천간(갑-갑)이면 비견으로 집계된다 — 예전엔 `stem !== dayStem` 가드가 비견을 통째로 0으로 만들었다', () => {
    const distribution = calculateTenGodsDistribution(saju);
    // 연간(갑)만 순수 천간 매치. 지장간 정보가 없으므로 branch 폴백(0.5 가중치)도 함께 계산되지만,
    // 최소한 연간 갑 매치로 인한 1.0은 항상 포함돼야 한다.
    expect(distribution.비견).toBeGreaterThanOrEqual(1);
  });
});

describe('calculateTenGodsDistribution — 월지 지장간 정기가 일간과 같은 경우(甲 일간 寅월)의 비견 집계 (Phase A 회귀)', () => {
  // earthly_branches.ts: 인(寅)의 정기(primary)는 갑(甲) — 일간이 갑이면 월지 당령(當令)
  // 자체가 비견이다. 예전엔 `jiJangGan.primary.stem !== dayStem` 가드가 이 매치를 통째로
  // 걸러내 "당령인데도 지장간 세력이 과소 계상"됐다.
  const saju: SajuData = {
    birthDate: '1984-02-10',
    solarBirthDate: '1984-02-10',
    birthTime: '10:00',
    birthCity: '서울',
    calendar: 'solar',
    isLeapMonth: false,
    gender: 'male',
    unknownHour: false,
    year: { stem: '계', branch: '해', stemElement: '수', branchElement: '수', yinYang: '음' },
    month: { stem: '병', branch: '인', stemElement: '화', branchElement: '목', yinYang: '양' },
    day: { stem: '갑', branch: '오', stemElement: '목', branchElement: '화', yinYang: '양' },
    hour: { stem: '기', branch: '사', stemElement: '토', branchElement: '화', yinYang: '음' },
    wuxingCount: { 목: 2, 화: 3, 토: 1, 금: 0, 수: 2 },
    tenGods: [],
    jiJangGan: {
      year: { primary: { stem: '임', strength: 70 }, secondary: { stem: '갑', strength: 30 } },
      month: {
        primary: { stem: '갑', strength: 60 },
        secondary: { stem: '병', strength: 30 },
        residual: { stem: '무', strength: 10 },
      },
      day: { primary: { stem: '정', strength: 70 }, secondary: { stem: '기', strength: 30 } },
      hour: { primary: { stem: '병', strength: 70 }, secondary: { stem: '무', strength: 20 }, residual: { stem: '경', strength: 10 } },
    },
  };

  it('월지 지장간 정기(갑)가 일간과 같으면 그 세력(60%)이 비견에 반영된다', () => {
    const distribution = calculateTenGodsDistribution(saju);
    // 월지 정기 갑 0.6 + 연지 지장간 보조 갑 0.3 = 0.9가 비견에 포함돼야 한다.
    expect(distribution.비견).toBeCloseTo(0.9, 10);
  });
});
