import { describe, expect, it } from 'vitest';
import { buildSajuViewModel } from './view-model';
import { calculateTenGod } from '@/lib/ten_gods';
import type { SajuData } from '@/types';

/**
 * 일간 무(戊, 토·양)와 년지 자(子, 지지 자체는 수·양이지만 지장간 본기는 계수·음)로 구성한
 * 합성 명식. 예전 view-model.ts#tenGodFromElement는 자(子)를 지지 자체의 오행·음양(수·양)으로
 * 판정해 무-자 관계를 "편재"로 냈는데, ten_gods.ts#calculateTenGod가 쓰는 본기(계, 음) 기준으로는
 * "정재"가 맞다 — 카드 표시와 saju.tenGodsDistribution이 같은 명식을 두고 다른 답을 냈던 회귀.
 */
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

describe('지지 십성은 지장간 본기 기준이어야 한다 — 子를 양으로 보아 편재/정재가 뒤바뀌던 회귀', () => {
  const vm = buildSajuViewModel({
    name: '',
    saju,
    daeUn: [],
    hasHour: true,
    gender: 'male',
    dark: true,
    nowYear: 2024,
  });
  const yearPillarVm = vm.pillars.find((p) => p.labelEn === '연주')!;

  it('일간 무(戊)와 년지 자(子)의 십성은 정재다 (본기 계수 기준)', () => {
    expect(yearPillarVm.branch.god).toBe('정재');
    expect(yearPillarVm.branch.god).not.toBe('편재');
  });

  it('카드에 찍힌 십성이 calculateTenGod(일간, 지장간 본기)와 일치한다', () => {
    expect(yearPillarVm.branch.god).toBe(calculateTenGod('무', '계'));
  });
});

describe('대운 지지 십성도 명식 카드와 같은 지장간 본기 기준이다', () => {
  // 대운/세운 지지는 saju.jiJangGan(출생 사주 전용)에 들어있지 않으므로 view-model.ts가
  // extractJiJangGan의 본기(자=계)를 직접 쓴다. 명식 카드(연지 자)와 같은 지지를 대운에
  // 넣어 두 경로가 같은 답(정재)을 내는지 확인한다.
  const daeUn = [
    {
      startAge: 10,
      endAge: 19,
      stem: '병' as const,
      branch: '자' as const,
      stemElement: '화' as const,
      branchElement: '수' as const,
      pillarIndex: 0,
    },
  ];
  const vm = buildSajuViewModel({
    name: '',
    saju,
    daeUn,
    hasHour: true,
    gender: 'male',
    dark: true,
    nowYear: 2024,
  });

  it('대운 자(子)의 지지 십성도 정재다 (본기 계수 기준)', () => {
    expect(vm.luck[0]!.branchGod).toBe('정재');
    expect(vm.luck[0]!.branchGod).toBe(calculateTenGod('무', '계'));
  });
});

describe('오행 오각형 — 노드 5개, 상생 화살표 5개, 상극 화살표 5개', () => {
  const vm = buildSajuViewModel({
    name: '',
    saju,
    daeUn: [],
    hasHour: true,
    gender: 'male',
    dark: true,
    nowYear: 2024,
  });

  it('오행 5개 노드가 모두 나온다', () => {
    expect(vm.elementCycle.nodes.length).toBe(5);
    expect(new Set(vm.elementCycle.nodes.map((n) => n.key)).size).toBe(5);
  });

  it('상생 화살표 5개, 상극 화살표 5개다', () => {
    expect(vm.elementCycle.sheng.length).toBe(5);
    expect(vm.elementCycle.ke.length).toBe(5);
  });

  it('오행 pct 합이 100에 가깝다', () => {
    const sum = vm.elementCycle.nodes.reduce((a, n) => a + n.pct, 0);
    expect(sum).toBeCloseTo(100, 0);
  });
});

describe('jiJangGan 정보가 없을 때도 extractJiJangGan의 본기(첫 원소)로 폴백한다', () => {
  const sajuWithoutJiJangGan: SajuData = { ...saju, jiJangGan: undefined };
  const vm = buildSajuViewModel({
    name: '',
    saju: sajuWithoutJiJangGan,
    daeUn: [],
    hasHour: true,
    gender: 'male',
    dark: true,
    nowYear: 2024,
  });
  const yearPillarVm = vm.pillars.find((p) => p.labelEn === '연주')!;

  it('여전히 정재다 (JI_JANG_GAN 테이블의 자=계 폴백)', () => {
    expect(yearPillarVm.branch.god).toBe('정재');
  });
});
