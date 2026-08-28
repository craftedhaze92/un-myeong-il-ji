/**
 * 일간(日干) 강약 판단 시스템
 * 사주의 가장 중요한 분석 요소인 일간의 강약을 종합적으로 판단
 *
 * 자평명리 통설의 득령(得令)·득지(得地)·득세(得勢) + 통근(通根) 3요소 판정을 따른다.
 * 참고: https://m.cafe.daum.net/I.W/hQcw/23?svc=cafeapi (득령/득지/득세 구분)
 *
 * 예전 구현은 `sajuData.tenGodsDistribution.비견`을 그대로 신강신약 점수에 썼는데,
 * ten_gods.ts#calculateTenGodsDistribution의 옛 버그(연간·지장간 정기가 일간과 같은
 * 천간이면 무조건 제외)로 비견이 구조적으로 0에 가까웠다 — 그 버그는 Phase A에서 고쳤지만,
 * 그 값을 그대로 재사용해도 "월지 > 일지 > 시지 > 년지" 같은 자리 가중치나 통근 개념이
 * 없어서 여전히 얕은 판정이었다. 이 파일은 8글자(시간 미상이면 6글자)를 직접 순회해
 * 자리 가중치를 곱한 아군/적군 세력비로 다시 계산한다.
 */

import type { HeavenlyStem, SajuData, WuXing } from '../types/index';
import { getHeavenlyStemByKorean } from '../data/heavenly_stems';
import { extractJiJangGan, checkWolRyeong } from '../data/earthly_branches';
import { WUXING_GENERATION, WUXING_DESTRUCTION } from '../data/wuxing';

/**
 * 신강신약 게이지(신약/중화/신강 3구간)의 경계값. 아래 analyzeDayMasterStrength의 레벨 판정
 * (medium >= 40, strong >= 65)과 반드시 같은 값을 써야 한다 — 게이지 밴드 라벨과
 * dayMasterStrength.level이 서로 다른 말을 하는 걸 막기 위한 단일 출처.
 */
export const STRENGTH_BAND_THRESHOLDS = { weak: 0, medium: 40, strong: 65 } as const;

type Pillar = 'year' | 'month' | 'day' | 'hour';

/** jiJangGan 한 자리(정기/중기/여기)의 타입 — SajuData['jiJangGan']['year'|'month'|'day'|'hour']와 동일 구조 */
interface JiJangGanSlot {
  primary: { stem: HeavenlyStem; strength: number };
  secondary?: { stem: HeavenlyStem; strength: number };
  residual?: { stem: HeavenlyStem; strength: number };
}

/** 자리 가중치 — 월령이 가장 크고(월령을 얻으면 반은 먹고 들어간다는 통설), 그다음 일지, 시지/월간, 년주 순. */
const POSITION_WEIGHT: Record<'stem' | 'branch', Record<Pillar, number>> = {
  stem: { year: 1.0, month: 1.5, day: 0, hour: 1.0 }, // 일간 자신은 세력 계산에서 제외
  branch: { year: 1.0, month: 3.0, day: 2.0, hour: 1.5 },
};

export interface DayMasterStrengthResult {
  level: 'very_strong' | 'strong' | 'medium' | 'weak' | 'very_weak';
  score: number; // 0-100
  analysis: string;
  /** 득령(得令) — 월지 지장간 정기가 비겁 또는 인성인가 */
  deukRyeong: boolean;
  /** 득지(得地) — 일지 지장간에 비겁 또는 인성이 있는가 */
  deukJi: boolean;
  /** 득세(得勢) — 일간을 뺀 나머지 글자 중 비겁+인성이 3자 이상인가 */
  deukSe: boolean;
  /** 통근(通根) — 일간과 같은 오행의 천간을 지지(지장간)에 두고 있는 자리들 */
  rootedAt: Pillar[];
  /** 아군(비겁+인성) 가중 세력 합 */
  supportScore: number;
  /** 적군(식상+재성+관성) 가중 세력 합 */
  drainScore: number;
}

/** 일간을 돕는 오행(비겁: 같은 오행, 인성: 나를 생하는 오행)인지 판정 */
function isSupportingElement(dayElement: WuXing, targetElement: WuXing): boolean {
  return targetElement === dayElement || WUXING_GENERATION[targetElement] === dayElement;
}

/** 일간의 힘을 빼는 오행(식상: 내가 생, 재성: 내가 극, 관성: 나를 극)인지 판정 */
function isDrainingElement(dayElement: WuXing, targetElement: WuXing): boolean {
  return (
    WUXING_GENERATION[dayElement] === targetElement ||
    WUXING_DESTRUCTION[dayElement] === targetElement ||
    WUXING_DESTRUCTION[targetElement] === dayElement
  );
}

function elementOf(stem: HeavenlyStem): WuXing | undefined {
  return getHeavenlyStemByKorean(stem)?.element;
}

/**
 * 지지 한 글자의 지장간(정기/중기/여기)을 순회하며 아군/적군 세력을 자리 가중치만큼 누적한다.
 * 절기 기준 정밀 지장간 세력(sajuData.jiJangGan)이 있으면 그걸 우선 쓰고, 없으면
 * extractJiJangGan의 정적 테이블로 폴백한다(view-model.ts#primaryHiddenStem과 같은 패턴).
 */
function accumulateBranchForce(
  branch: SajuData['year']['branch'],
  dayElement: WuXing,
  precise: JiJangGanSlot | undefined,
  weight: number,
  acc: { support: number; drain: number },
): boolean {
  let hasRootStem = false;

  let entries: { stem: HeavenlyStem; strength: number }[];
  if (precise) {
    entries = [precise.primary, precise.secondary, precise.residual].filter(
      (e): e is { stem: HeavenlyStem; strength: number } => e !== undefined,
    );
  } else {
    const fallbackStems = extractJiJangGan(branch);
    entries = fallbackStems.map((stem) => ({ stem, strength: 100 / fallbackStems.length }));
  }

  for (const { stem, strength } of entries) {
    const element = elementOf(stem);
    if (!element) continue;
    const share = weight * (strength / 100);

    if (element === dayElement) hasRootStem = true;
    if (isSupportingElement(dayElement, element)) acc.support += share;
    else if (isDrainingElement(dayElement, element)) acc.drain += share;
  }

  return hasRootStem;
}

/**
 * 일간 강약 종합 분석
 *
 * 절차: 8글자(시간 미상이면 6글자)를 일간 기준 아군(비겁·인성)/적군(식상·재성·관성)으로
 * 분류하고, 자리 가중치(월지 > 일지 > 시지/월간 > 년주)를 곱해 아군 세력 비율을 낸다.
 * score = 아군세력 / (아군세력 + 적군세력) × 100.
 *
 * 범위 밖: 합충(合沖)이 세력에 미치는 영향은 반영하지 않는다. sajuData.branchRelations에
 * 삼합·육합·충 정보가 이미 있지만, 합충으로 인한 오행 변화(예: 합화)나 세력 가감은
 * 유파마다 결론이 갈려 단일 규칙으로 못 박으면 오히려 정확도가 떨어진다 — 여기서는
 * 원국 그대로의 글자 세력만 본다.
 */
export function analyzeDayMasterStrength(sajuData: SajuData): DayMasterStrengthResult {
  const dayStem = sajuData.day.stem;
  const dayElement = elementOf(dayStem);
  if (!dayElement) {
    return {
      level: 'medium',
      score: 50,
      analysis: '일간 정보를 확인할 수 없어 중화로 처리합니다.',
      deukRyeong: false,
      deukJi: false,
      deukSe: false,
      rootedAt: [],
      supportScore: 0,
      drainScore: 0,
    };
  }

  const pillars: Pillar[] = sajuData.unknownHour ? ['year', 'month', 'day'] : ['year', 'month', 'day', 'hour'];
  const acc = { support: 0, drain: 0 };
  const rootedAt: Pillar[] = [];

  for (const pillar of pillars) {
    if (pillar === 'day') continue; // 일간 자신은 천간 세력 계산에서 제외 (통근은 일지에서 별도 확인)

    const stem = sajuData[pillar].stem;
    const element = elementOf(stem);
    if (element) {
      const weight = POSITION_WEIGHT.stem[pillar];
      if (isSupportingElement(dayElement, element)) acc.support += weight;
      else if (isDrainingElement(dayElement, element)) acc.drain += weight;
    }
  }

  for (const pillar of pillars) {
    const branch = sajuData[pillar].branch;
    const weight = POSITION_WEIGHT.branch[pillar];
    const precise = sajuData.jiJangGan?.[pillar];
    const rooted = accumulateBranchForce(branch, dayElement, precise, weight, acc);
    if (rooted) rootedAt.push(pillar);
  }

  const total = acc.support + acc.drain;
  const score = total > 0 ? Math.round((acc.support / total) * 100) : 50;

  // 득령: 월지 지장간 정기가 비겁 또는 인성. checkWolRyeong이 정확히 이 기준으로
  // 판정한다(같은 오행=비겁, 월지가 일간을 생=인성 → isDeukRyeong: true) — 새로
  // 만들지 않고 재사용한다.
  const deukRyeong = checkWolRyeong(dayStem, sajuData.month.branch).isDeukRyeong;

  // 득지: 일지 지장간(정기·중기·여기 어느 것이든)에 비겁 또는 인성이 있는가
  const dayBranchStems = sajuData.jiJangGan?.day
    ? [sajuData.jiJangGan.day.primary, sajuData.jiJangGan.day.secondary, sajuData.jiJangGan.day.residual]
        .filter((e): e is { stem: HeavenlyStem; strength: number } => e !== undefined)
        .map((e) => e.stem)
    : extractJiJangGan(sajuData.day.branch);
  const deukJi = dayBranchStems.some((stem) => {
    const element = elementOf(stem);
    return element ? isSupportingElement(dayElement, element) : false;
  });

  // 득세: 일간을 뺀 나머지 글자(천간+지장간 정기) 중 비겁+인성 개수가 3자 이상
  const allOtherPrimaryStems: HeavenlyStem[] = pillars
    .filter((p) => p !== 'day')
    .map((p) => sajuData[p].stem)
    .concat(
      pillars
        .map((p) => sajuData.jiJangGan?.[p]?.primary.stem ?? extractJiJangGan(sajuData[p].branch)[0])
        .filter((s): s is HeavenlyStem => s !== undefined),
    );
  const deukSeCount = allOtherPrimaryStems.filter((stem) => {
    const element = elementOf(stem);
    return element ? isSupportingElement(dayElement, element) : false;
  }).length;
  const deukSe = deukSeCount >= 3;

  // 레벨 결정 — STRENGTH_BAND_THRESHOLDS와 반드시 같은 경계값을 쓴다
  let level: DayMasterStrengthResult['level'];
  if (score >= 80) level = 'very_strong';
  else if (score >= STRENGTH_BAND_THRESHOLDS.strong) level = 'strong';
  else if (score >= STRENGTH_BAND_THRESHOLDS.medium) level = 'medium';
  else if (score >= 25) level = 'weak';
  else level = 'very_weak';

  const reasons: string[] = [];
  reasons.push(deukRyeong ? '월령을 득하여(득령)' : '월령을 얻지 못하여(실령)');
  reasons.push(deukJi ? '일지에도 뿌리를 두어(득지)' : '일지에 뿌리가 없어(실지)');
  reasons.push(deukSe ? `비겁·인성 세력이 ${deukSeCount}자로 넓어(득세)` : `비겁·인성 세력이 ${deukSeCount}자로 좁아(실세)`);
  if (rootedAt.length > 0) {
    const pillarLabel: Record<Pillar, string> = { year: '년', month: '월', day: '일', hour: '시' };
    reasons.push(`${rootedAt.map((p) => pillarLabel[p]).join('·')}지에 통근`);
  }
  const analysis = `${reasons.join(', ')} 일간이 ${level === 'very_strong' ? '매우 강합니다' : level === 'strong' ? '강한 편입니다' : level === 'medium' ? '중화에 가깝습니다' : level === 'weak' ? '약한 편입니다' : '매우 약합니다'}.`;

  return {
    level,
    score,
    analysis,
    deukRyeong,
    deukJi,
    deukSe,
    rootedAt,
    supportScore: acc.support,
    drainScore: acc.drain,
  };
}

/**
 * 일간 강약에 따른 용신(用神) 추천
 */
export function recommendYongSin(
  dayMasterStrength: 'very_strong' | 'strong' | 'medium' | 'weak' | 'very_weak'
): {
  yongSin: string[];
  advice: string;
} {
  switch (dayMasterStrength) {
    case 'very_strong':
    case 'strong':
      return {
        yongSin: ['재성(財星)', '관성(官星)', '식상(食傷)'],
        advice: '일간이 강하므로 설기하는 재관식상을 용신으로 삼아야 합니다. 재물운과 직업운을 키우세요.',
      };

    case 'weak':
    case 'very_weak':
      return {
        yongSin: ['인성(印星)', '비겁(比劫)'],
        advice: '일간이 약하므로 돕는 인성과 비겁을 용신으로 삼아야 합니다. 협력자와 멘토의 도움을 받으세요.',
      };

    case 'medium':
    default:
      return {
        yongSin: ['상황에 따라 변동'],
        advice:
          '일간이 중화되어 있습니다. 유연하게 대처하며 균형을 유지하세요.',
      };
  }
}
