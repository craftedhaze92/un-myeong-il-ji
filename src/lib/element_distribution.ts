/**
 * 오행 분포 — 십성 분포와 같은 분모를 쓰는 단일 소스
 *
 * result-panel.tsx의 "오행과 십성" 카드는 오각형(오행별 %)과 상세 리스트(오행별 십성 2개 %)를
 * 나란히 보여준다. 두 숫자가 서로 다른 계산에서 나오면 "목 12%인데 재성+비겁 합은 10%"처럼
 * 모순이 생길 수 있으므로, 오행 카운트를 ten_gods.ts#calculateTenGodsDistribution의 결과를
 * 오행별로 묶어서 역산한다 — 오행 카운트를 따로 세지 않는다.
 *
 * ten_gods.ts의 기본 calculateTenGodsDistribution은 일간 자신과 일간과 같은 천간을 분포에서
 * 제외한다(비겁이 과소 계상됨). 오행 파이차트는 8글자(또는 시간 미상이면 6글자) 전체가
 * 분모여야 하므로 반드시 { includeDayMaster: true }로 호출한다.
 */

import type { SajuData, TenGod, WuXing } from '../types/index';
import {
  analyzeWuXingBalance,
  getControlledElement,
  getControllingElement,
  getGeneratedElement,
  getGeneratingElement,
} from '../data/wuxing';
import { calculateTenGodsDistribution } from './ten_gods';

export type TenGodGroup = '비겁' | '식상' | '재성' | '관성' | '인성';

export interface ElementGroupInfo {
  group: TenGodGroup;
  /** [양간 쪽 십성, 음간 쪽 십성] — 예: 비겁이면 [비견, 겁재] */
  gods: [TenGod, TenGod];
}

/**
 * 일간 오행 기준 오행 → 육친(비겁/식상/재성/관성/인성) 그룹 매핑.
 * 새 테이블을 만들지 않고 wuxing.ts의 기존 생/극 헬퍼로 구성한다.
 */
export function groupTenGodsByElement(
  dayElement: WuXing,
): Record<WuXing, ElementGroupInfo> {
  const bigyeopEl = dayElement;
  const siksangEl = getGeneratedElement(dayElement); // 일간이 생(生)하는 오행
  const jaeseongEl = getControlledElement(dayElement); // 일간이 극(克)하는 오행
  const gwanseongEl = getControllingElement(dayElement); // 일간을 극(克)하는 오행
  const inseongEl = getGeneratingElement(dayElement); // 일간을 생(生)하는 오행

  return {
    [bigyeopEl]: { group: '비겁', gods: ['비견', '겁재'] },
    [siksangEl]: { group: '식상', gods: ['식신', '상관'] },
    [jaeseongEl]: { group: '재성', gods: ['편재', '정재'] },
    [gwanseongEl]: { group: '관성', gods: ['편관', '정관'] },
    [inseongEl]: { group: '인성', gods: ['편인', '정인'] },
  } as Record<WuXing, ElementGroupInfo>;
}

export interface ElementDistributionResult {
  /**
   * 십성 가중합 그대로의 오행별 카운트. 지장간 세력(calculateJiJangGanStrength)이 절기
   * 근접도에 따라 40~100 사이로 변하므로 합계가 정확히 8(시간 미상이면 6)은 아니고 그
   * 근방의 실수값이다 — pct는 이 total을 분모로 다시 정규화하므로 100%는 항상 보장된다.
   */
  counts: Record<WuXing, number>;
  total: number;
  /** 소수 첫째 자리로 반올림한 0-100 백분율. total===0이면 전부 0 */
  pct: Record<WuXing, number>;
  groups: Record<WuXing, ElementGroupInfo>;
}

export function calculateElementDistribution(
  saju: SajuData,
): ElementDistributionResult {
  const distribution = calculateTenGodsDistribution(saju, {
    includeDayMaster: true,
  });
  const groups = groupTenGodsByElement(saju.day.stemElement);
  const elements = Object.keys(groups) as WuXing[];

  const counts = {} as Record<WuXing, number>;
  let total = 0;
  elements.forEach((el) => {
    const [a, b] = groups[el]!.gods;
    const count = distribution[a] + distribution[b];
    counts[el] = count;
    total += count;
  });

  const pct = {} as Record<WuXing, number>;
  elements.forEach((el) => {
    pct[el] = total > 0 ? Math.round((counts[el]! / total) * 1000) / 10 : 0;
  });

  return { counts, total, pct, groups };
}

export type ElementStatus = '발달' | '부족' | '적정';

/**
 * 오행별 발달/부족/적정 판정. wuxing.ts#analyzeWuXingBalance와 같은 임계값
 * (평균의 1.5배 초과 → strong, 0.5배 미만 → weak)을 그대로 재사용한다 —
 * 판정 기준을 두 곳에 따로 두지 않기 위함.
 */
export function getElementStatusMap(
  counts: Record<WuXing, number>,
): Record<WuXing, ElementStatus> {
  const { strong, weak } = analyzeWuXingBalance(counts);
  const result = {} as Record<WuXing, ElementStatus>;
  (Object.keys(counts) as WuXing[]).forEach((el) => {
    result[el] = strong.includes(el) ? '발달' : weak.includes(el) ? '부족' : '적정';
  });
  return result;
}
