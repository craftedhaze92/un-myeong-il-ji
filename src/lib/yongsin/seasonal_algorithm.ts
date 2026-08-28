/**
 * 조후용신(調候用神) 알고리즘
 * Seasonal/Climate-Based YongSin Selection
 *
 * 사주의 한난조습(寒暖燥濕)을 조절하는 오행을 용신으로 선택
 * - 춘하(春夏): 따뜻하고 건조 → 수(水), 금(金)으로 한습(寒濕) 조절
 * - 추동(秋冬): 차갑고 습함 → 화(火), 목(木)으로 온조(溫燥) 조절
 * - 계절별 세밀한 조율 필요
 */

import type { SajuData, WuXing } from '../../types/index';
import type { YongSinAlgorithm, YongSinResult } from './base';
import { WuXingRelations } from './base';
import { getHeavenlyStemByKorean } from '../../data/heavenly_stems';
import { selectJohuYongSin } from '../johu';

/**
 * 계절별 기후 특성
 */
interface SeasonClimate {
  /** 계절 이름 */
  name: string;
  /** 온도: hot(뜨거움), warm(따뜻함), cool(서늘함), cold(추움) */
  temperature: 'hot' | 'warm' | 'cool' | 'cold';
  /** 습도: dry(건조), moderate(적당), humid(습함) */
  humidity: 'dry' | 'moderate' | 'humid';
  /** 필요한 조절: 차갑게, 따뜻하게, 습하게, 건조하게 */
  neededAdjustment: '한습' | '온조' | '청량' | '자윤';
  /** 우선 용신 */
  preferredYongSin: WuXing[];
  /** 기신 */
  avoidElements: WuXing[];
}

/**
 * 월지(月支) 기준 계절 판단
 */
const SEASON_MAP: Record<string, SeasonClimate> = {
  // 인월(寅月, 입춘~경칩): 초봄, 여전히 춥고 건조
  인: {
    name: '초봄(寅月)',
    temperature: 'cold',
    humidity: 'dry',
    neededAdjustment: '온조',
    preferredYongSin: ['화', '목'],
    avoidElements: ['수', '금'],
  },
  // 묘월(卯月, 경칩~청명): 중봄, 따뜻해지고 건조
  묘: {
    name: '중봄(卯月)',
    temperature: 'warm',
    humidity: 'dry',
    neededAdjustment: '자윤',
    preferredYongSin: ['수'],
    avoidElements: ['화'],
  },
  // 진월(辰月, 청명~입하): 늦봄, 따뜻하고 습해짐
  진: {
    name: '늦봄(辰月)',
    temperature: 'warm',
    humidity: 'humid',
    neededAdjustment: '청량',
    preferredYongSin: ['금', '수'],
    avoidElements: ['토'],
  },
  // 사월(巳月, 입하~망종): 초여름, 더워지고 건조
  사: {
    name: '초여름(巳月)',
    temperature: 'hot',
    humidity: 'dry',
    neededAdjustment: '한습',
    preferredYongSin: ['수', '금'],
    avoidElements: ['화'],
  },
  // 오월(午月, 망종~소서): 한여름, 매우 덥고 건조
  오: {
    name: '한여름(午月)',
    temperature: 'hot',
    humidity: 'dry',
    neededAdjustment: '한습',
    preferredYongSin: ['수'],
    avoidElements: ['화', '목'],
  },
  // 미월(未月, 소서~입추): 늦여름, 덥고 습함
  미: {
    name: '늦여름(未月)',
    temperature: 'hot',
    humidity: 'humid',
    neededAdjustment: '청량',
    preferredYongSin: ['금', '수'],
    avoidElements: ['토', '화'],
  },
  // 신월(申月, 입추~백로): 초가을, 서늘하고 건조
  신: {
    name: '초가을(申月)',
    temperature: 'cool',
    humidity: 'dry',
    neededAdjustment: '자윤',
    preferredYongSin: ['수', '목'],
    avoidElements: ['금'],
  },
  // 유월(酉月, 백로~한로): 중가을, 서늘하고 건조
  유: {
    name: '중가을(酉月)',
    temperature: 'cool',
    humidity: 'dry',
    neededAdjustment: '온조',
    preferredYongSin: ['화', '목'],
    avoidElements: ['금'],
  },
  // 술월(戌月, 한로~입동): 늦가을, 차가워지고 건조
  술: {
    name: '늦가을(戌月)',
    temperature: 'cool',
    humidity: 'dry',
    neededAdjustment: '온조',
    preferredYongSin: ['화'],
    avoidElements: ['수', '금'],
  },
  // 해월(亥月, 입동~대설): 초겨울, 춥고 습함
  해: {
    name: '초겨울(亥月)',
    temperature: 'cold',
    humidity: 'humid',
    neededAdjustment: '온조',
    preferredYongSin: ['화', '목'],
    avoidElements: ['수'],
  },
  // 자월(子月, 대설~소한): 한겨울, 매우 춥고 습함
  자: {
    name: '한겨울(子月)',
    temperature: 'cold',
    humidity: 'humid',
    neededAdjustment: '온조',
    preferredYongSin: ['화'],
    avoidElements: ['수', '금'],
  },
  // 축월(丑月, 소한~입춘): 늦겨울, 춥고 건조
  축: {
    name: '늦겨울(丑月)',
    temperature: 'cold',
    humidity: 'dry',
    neededAdjustment: '온조',
    preferredYongSin: ['화', '목'],
    avoidElements: ['수', '토'],
  },
};

export class SeasonalYongSinAlgorithm implements YongSinAlgorithm {
  readonly name = '조후용신';
  readonly method = 'seasonal' as const;
  readonly description = '사주의 한난조습(寒暖燥濕)을 조절하는 오행을 용신으로 선택합니다. 계절적 균형과 건강 분석에 유용합니다.';

  select(sajuData: SajuData): YongSinResult {
    const monthBranch = sajuData.month.branch;

    // SEASON_MAP은 이제 한난조습 서술 문구(계절 이름·avoidElements)에만 쓴다.
    // 용신 자체는 johu.ts#selectJohuYongSin(궁통보감 조후용신표, 일간×월지 120칸)이
    // 정한다 — SEASON_MAP은 월지 12칸만 보고 일간을 무시해서, 같은 子月이라도
    // 甲木과 庚金에게 서로 다른 조후용신이 필요하다는 궁통보감의 핵심을 반영하지 못했다.
    const season = SEASON_MAP[monthBranch];
    if (!season) {
      throw new Error(`Unknown month branch: ${monthBranch}`);
    }

    const johu = selectJohuYongSin(sajuData);
    const primaryYongSin = johu.yongSinElement;
    const secondaryYongSin = johu.assistStems
      .map((stem) => getHeavenlyStemByKorean(stem)?.element)
      .find((element): element is WuXing => element !== undefined && element !== primaryYongSin);

    // 희신: 용신과 용신을 돕는 오행
    const xiSin: WuXing[] = [primaryYongSin];
    if (secondaryYongSin) xiSin.push(secondaryYongSin);
    xiSin.push(WuXingRelations.getShengMeElement(primaryYongSin));

    // 기신: 피해야 할 오행 (SEASON_MAP의 한난조습 반대 극단)
    const jiSin: WuXing[] = season.avoidElements;

    // 수신: 용신을 극하는 오행
    const chouSin: WuXing[] = [WuXingRelations.getKeMeElement(primaryYongSin)];

    return {
      primaryYongSin,
      secondaryYongSin,
      xiSin: [...new Set(xiSin)],
      jiSin: [...new Set(jiSin)],
      chouSin: [...new Set(chouSin)],
      reasoning: johu.reasoning,
      method: this.method,
      confidence: johu.confidence,
    };
  }

  calculateApplicability(sajuData: SajuData): number {
    const monthBranch = sajuData.month.branch;
    const season = SEASON_MAP[monthBranch];
    if (!season) return 0.0;

    // urgency(조후 시급도)를 그대로 적합도로 쓴다 — 극단 계절(亥子丑·巳午未)이고
    // 조후 글자가 원국에 없으면(high) 조후용신이 매우 적합하고, 원국에 이미 조후
    // 글자가 있으면(medium) 상대적으로 덜 급하며, 중간 계절(low)이면 억부가 우선이다.
    const { urgency } = selectJohuYongSin(sajuData);
    if (urgency === 'high') return 0.95;
    if (urgency === 'medium') return 0.7;
    return 0.4;
  }
}
