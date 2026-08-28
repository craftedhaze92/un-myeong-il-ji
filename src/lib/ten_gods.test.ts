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
  const saju = calculateSaju('1992-05-05', '17:50', 'solar', false, 'male', '서울');

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

  it('includeDayMaster: true의 총계가 옵션 없을 때보다 정확히 1.1 크다', () => {
    const sum = (d: Record<string, number>) => Object.values(d).reduce((a, b) => a + b, 0);
    const base = calculateTenGodsDistribution(saju);
    const withDayMaster = calculateTenGodsDistribution(saju, { includeDayMaster: true });
    expect(sum(withDayMaster) - sum(base)).toBeCloseTo(1.1, 10);
  });

  it('includeDayMaster: true의 총계는 정확히 8이다 (천간 4 + 지지 지장간 4×1.0)', () => {
    const sum = (d: Record<string, number>) => Object.values(d).reduce((a, b) => a + b, 0);
    const withDayMaster = calculateTenGodsDistribution(saju, { includeDayMaster: true });
    expect(sum(withDayMaster)).toBeCloseTo(8, 10);
  });
});
