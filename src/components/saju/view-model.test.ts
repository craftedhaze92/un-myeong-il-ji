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

describe('대운별 세운(luck[i].seun)이 그 대운의 정확한 10년치를 담는다 — result-panel.tsx가 대운 클릭 시 이 목록으로 세운 띠를 갈아 끼운다', () => {
  // saju.solarBirthDate = '1990-01-01' → birthYear 1990. 대운 startAge/endAge를 실제 연도로
  // 환산하면(birthYear + age) 이 구간엔 nowYear(2024)가 들어있지 않아야 한다.
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

  it('endAge가 대운 구간 그대로 담긴다', () => {
    expect(vm.luck[0]!.endAge).toBe(19);
  });

  it('seun은 startAge~endAge에 해당하는 10년(2000~2009)이다', () => {
    expect(vm.luck[0]!.seun.length).toBe(10);
    expect(vm.luck[0]!.seun[0]!.year).toBe(2000);
    expect(vm.luck[0]!.seun.at(-1)!.year).toBe(2009);
  });

  it('이 구간엔 실제 올해(2024)가 없으므로 어떤 칸도 current로 표시되지 않는다 — "현재" 표시가 엉뚱한 대운의 세운으로 새던 회귀 가드', () => {
    expect(vm.luck[0]!.seun.every((s) => !s.current)).toBe(true);
  });
});

describe('대운 구간이 실제 올해를 포함하면 그 해만 세운에서 current로 표시된다', () => {
  // startAge 30~39 → 1990 + 30~39 = 2020~2029, nowYear(2024) 포함.
  const daeUn = [
    {
      startAge: 30,
      endAge: 39,
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

  it('2024년 칸만 current이고 나머지 9개는 아니다', () => {
    const seun = vm.luck[0]!.seun;
    const currentYears = seun.filter((s) => s.current).map((s) => s.year);
    expect(currentYears).toEqual([2024]);
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
