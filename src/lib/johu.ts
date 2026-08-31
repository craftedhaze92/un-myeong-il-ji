/**
 * 조후용신(調候用神) 조회 — 궁통보감(난강망) 〈희용제요〉 120칸(data/johu_table.ts) 기반.
 *
 * 억부용신(yong_sin.ts)과 달리 일간의 강약을 보지 않는다 — 조후는 "이 계절에 이 일간이
 * 타고난 한난조습을 조절하는 데 무엇이 필요한가"를 묻는, 억부와 독립된 별개의 축이다.
 * yong_sin.ts#selectYongSin이 이 결과를 억부보다 우선할지(urgency: 'high')를 판단하는 데 쓴다.
 */

import type { EarthlyBranch, HeavenlyStem, SajuData, WuXing } from '../types/index';
import { getHeavenlyStemByKorean } from '../data/heavenly_stems';
import { COLD_BRANCHES, HOT_BRANCHES, JOHU_TABLE, type JohuEntry } from '../data/johu_table';
import { josa } from './korean';

export interface JohuYongSinResult {
  /** 주 조후용신 (천간 단위) */
  yongSinStems: HeavenlyStem[];
  /** 억부·통관과 비교할 수 있도록 오행으로도 환산한 대표 용신 오행 (primary[0] 기준) */
  yongSinElement: WuXing;
  /** 보조용신 */
  assistStems: HeavenlyStem[];
  /** 조후가 억부보다 앞서야 하는 정도 */
  urgency: 'high' | 'medium' | 'low';
  /** 조후용신 글자(주+보조)가 원국 8자(지장간 포함)에 이미 있는가 */
  hasInChart: boolean;
  reasoning: string;
  /** 0~1. verified: false인 칸이면 낮춘다 */
  confidence: number;
}

function stemsInChart(saju: SajuData): Set<HeavenlyStem> {
  const stems = new Set<HeavenlyStem>();
  stems.add(saju.year.stem);
  stems.add(saju.month.stem);
  stems.add(saju.day.stem);
  if (!saju.unknownHour) stems.add(saju.hour.stem);

  const pillars = (['year', 'month', 'day', 'hour'] as const).filter(
    (p) => !(p === 'hour' && saju.unknownHour),
  );
  for (const p of pillars) {
    const jjg = saju.jiJangGan?.[p];
    if (!jjg) continue;
    stems.add(jjg.primary.stem);
    if (jjg.secondary) stems.add(jjg.secondary.stem);
    if (jjg.residual) stems.add(jjg.residual.stem);
  }
  return stems;
}

function isExtremeSeason(branch: EarthlyBranch): boolean {
  return COLD_BRANCHES.includes(branch) || HOT_BRANCHES.includes(branch);
}

/**
 * 궁통보감 조후용신 선정.
 *
 * urgency 판단 기준:
 * - high: 월지가 극단 계절(亥子丑 한랭 / 巳午未 염열)이고, 조후용신 글자가 원국에 없음
 * - medium: 극단 계절이지만 조후 글자가 이미 원국에 있음(자체적으로 어느 정도 조절됨)
 * - low: 寅卯辰·申酉戌(중간 계절) — 조후 필요성이 상대적으로 낮음
 */
export function selectJohuYongSin(saju: SajuData): JohuYongSinResult {
  const dayStem = saju.day.stem;
  const monthBranch = saju.month.branch;
  const entry: JohuEntry = JOHU_TABLE[dayStem][monthBranch];

  const primaryElement = getHeavenlyStemByKorean(entry.primary[0]!)?.element;
  if (!primaryElement) {
    throw new Error(`조후용신표에 일간(${dayStem})·월지(${monthBranch}) 항목이 없습니다`);
  }

  const chartStems = stemsInChart(saju);
  const johuStems = [...entry.primary, ...entry.secondary];
  const hasInChart = johuStems.some((stem) => chartStems.has(stem));

  let urgency: JohuYongSinResult['urgency'];
  if (!isExtremeSeason(monthBranch)) {
    urgency = 'low';
  } else if (!hasInChart) {
    urgency = 'high';
  } else {
    urgency = 'medium';
  }

  const seasonLabel = COLD_BRANCHES.includes(monthBranch)
    ? '한랭한 계절'
    : HOT_BRANCHES.includes(monthBranch)
      ? '무더운 계절'
      : '온화한 계절';
  const yongSinPhrase = `${entry.primary.join('·')}${entry.secondary.length ? `(보조 ${entry.secondary.join('·')})` : ''}`;
  const reasoning =
    `${saju.day.stem}(${dayStem}) 일간이 ${monthBranch}월(${seasonLabel})에 태어나, ` +
    `궁통보감 조후용신표에 따라 ${josa(yongSinPhrase, '이/가')} 필요합니다.` +
    (entry.note ? ` ${entry.note}` : '') +
    (hasInChart ? ' 원국에 이미 해당 글자가 있어 조절이 어느 정도 되어 있습니다.' : ' 원국에 해당 글자가 없어 대운·세운에서 만나야 합니다.');

  // verified: false는 미확정 칸 — johu_table.ts의 원칙대로 확정처럼 취급하지 않고 신뢰도를 낮춘다.
  const confidence = entry.verified ? (urgency === 'high' ? 0.9 : 0.75) : (urgency === 'high' ? 0.55 : 0.45);

  return {
    yongSinStems: entry.primary,
    yongSinElement: primaryElement,
    assistStems: entry.secondary,
    urgency,
    hasInChart,
    reasoning,
    confidence,
  };
}
