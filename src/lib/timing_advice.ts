/**
 * 시기 조언 시스템 (Timing Advice)
 *
 * 기존 월운·세운·대운 분석기의 실제 점수를 목적별로 조합한다. 별도의 명리 공식을
 * 만들거나 등급을 점수로 역산하지 않으며, 화면의 추천/주의/차트가 같은 최종 점수를 쓴다.
 */
import type { SajuData, WuXing } from "../types/index";
import {
  analyzeDaeun,
  getDaeunByYear,
  type DaeunAnalysis,
} from "./daeun_analysis";
import { josa } from "./korean";
import { analyzeSeyun, type SeyunAnalysis } from "./seyun_analysis";
import {
  findLuckyDaysInMonth,
  type TaekilPurpose,
} from "./taekil_recommendation";
import { analyzeWolun } from "./wolun_analysis";

export type DecisionType =
  | "결혼"
  | "이직"
  | "창업"
  | "투자"
  | "이사"
  | "수술"
  | "계약"
  | "학업"
  | "출산"
  | "여행";
export type TimingRating = "최적기" | "좋음" | "보통" | "주의" | "불가";
export type TimingUrgency =
  "가까운 시기" | "1년 이내" | "1~2년 후" | "2~3년 후";

type FortuneAspects = {
  career: number;
  wealth: number;
  health: number;
  relationship: number;
};

export interface TimingScoreBreakdown {
  month: number;
  seyun: number;
  daeun?: number;
  purposeLabel: string;
}

export interface TimingSpecificDate {
  date: Date;
  score: number;
  dayPillar: string;
  reasons: string[];
  cautions: string[];
}

export interface TimingMonth {
  year: number;
  month: number;
  yearMonth: string;
  period: string;
  rating: TimingRating;
  /** 추천·주의·차트가 함께 쓰는 최종 점수 */
  score: number;
  scoreBreakdown: TimingScoreBreakdown;
  element: WuXing;
  yongsinMatched: boolean;
  briefAdvice: string;
  reasons: string[];
  cautions: string[];
}

export interface TimingAdvice {
  decisionType: DecisionType;
  period: { start: Date; end: Date };
  optimalTiming: Array<
    TimingMonth & {
      specificDates?: TimingSpecificDate[];
      yongsinSupport?: string;
    }
  >;
  timesToAvoid: Array<{
    year: number;
    month: number;
    yearMonth: string;
    period: string;
    rating: TimingRating;
    score: number;
    reason: string;
    severity: "높음" | "중간" | "낮음";
    alternatives: string[];
  }>;
  /** 선택한 기준 월부터 이어지는 향후 N×12개월 */
  monthlyForecast: TimingMonth[];
  /** 월별 최종 점수를 실제 달력 연도별로 집계한 큰 흐름 */
  longTermOutlook: Array<{
    year: number;
    overallRating: TimingRating;
    overallScore: number;
    keyPeriods: string[];
    majorOpportunities: string[];
    majorChallenges: string[];
    daeunInfluence?: string;
  }>;
  summary: {
    bestYear: number;
    bestMonth: number;
    bestSeason: "봄" | "여름" | "가을" | "겨울";
    overallAdvice: string;
    urgency: TimingUrgency;
    recommendationLabel: "추천 시기" | "상대적으로 나은 시기";
    disclaimer?: string;
  };
  specificDateNotice?: string;
}

const PURPOSE_DOMAIN: Record<
  DecisionType,
  { label: string; domains: Array<keyof FortuneAspects> }
> = {
  결혼: { label: "관계운", domains: ["relationship"] },
  이직: { label: "진로운", domains: ["career"] },
  창업: { label: "진로·재물운", domains: ["career", "wealth"] },
  투자: { label: "재물운", domains: ["wealth"] },
  이사: { label: "전체 흐름", domains: [] },
  수술: { label: "건강운", domains: ["health"] },
  계약: { label: "진로·재물운", domains: ["career", "wealth"] },
  학업: { label: "진로·성취운", domains: ["career"] },
  출산: { label: "건강·관계운", domains: ["health", "relationship"] },
  여행: { label: "전체 흐름", domains: [] },
};

const TAEKIL_PURPOSE: Partial<Record<DecisionType, TaekilPurpose>> = {
  결혼: "혼인",
  이직: "취업/이직",
  창업: "개업",
  이사: "이사",
  수술: "수술",
  계약: "계약",
  학업: "입학",
  여행: "여행",
};

const DECISION_DISCLAIMER: Partial<Record<DecisionType, string>> = {
  수술: "수술 일정은 의료진의 판단과 건강 상태를 가장 먼저 따르세요.",
  투자: "투자 결정은 자금 사정·손실 가능성·전문가 검토를 가장 먼저 따르세요.",
  출산: "출산 일정은 산모와 아이의 안전 및 의료진 판단을 가장 먼저 따르세요.",
};

export function toTimingRating(score: number): TimingRating {
  return score >= 80
    ? "최적기"
    : score >= 65
      ? "좋음"
      : score >= 45
        ? "보통"
        : score >= 30
          ? "주의"
          : "불가";
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** 전체 흐름과 목적 영역을 동일 비중으로 반영한다. */
function getPurposeLayerScore(
  overall: number,
  aspects: FortuneAspects,
  decisionType: DecisionType,
): number {
  const domains = PURPOSE_DOMAIN[decisionType].domains;
  if (domains.length === 0) return overall;
  const domainScore = average(domains.map((domain) => aspects[domain]));
  return Math.round((overall + domainScore) / 2);
}

function blendLayerScores(
  month: number,
  seyun: number,
  daeun?: number,
): number {
  return daeun === undefined
    ? Math.round(month * 0.7 + seyun * 0.3)
    : Math.round(month * 0.7 + seyun * 0.18 + daeun * 0.12);
}

function monthAt(
  startDate: Date,
  offset: number,
): { year: number; month: number } {
  const anchor = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + offset,
    1,
  );
  return { year: anchor.getFullYear(), month: anchor.getMonth() + 1 };
}

function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function generateBriefAdvice(
  decisionType: DecisionType,
  rating: TimingRating,
): string {
  if (rating === "최적기") return `${decisionType}에 매우 유리한 흐름입니다.`;
  if (rating === "좋음")
    return `${decisionType} 진행을 검토하기 좋은 흐름입니다.`;
  if (rating === "보통") return "현실 조건을 함께 살피며 신중히 진행하세요.";
  if (rating === "주의")
    return `${josa(decisionType, "은/는")} 서두르지 않는 편이 좋습니다.`;
  return `${josa(decisionType, "은/는")} 가능하면 다른 시기를 검토하세요.`;
}

function buildMonthlyForecast(
  saju: SajuData,
  decisionType: DecisionType,
  startDate: Date,
  monthCount: number,
): {
  months: TimingMonth[];
  seyunByYear: Map<number, SeyunAnalysis>;
  daeunByYear: Map<number, DaeunAnalysis | null>;
} {
  const seyunByYear = new Map<number, SeyunAnalysis>();
  const daeunByYear = new Map<number, DaeunAnalysis | null>();
  const primaryYongsin = saju.yongSin?.primaryYongSin;
  const purposeLabel = PURPOSE_DOMAIN[decisionType].label;

  const months = Array.from({ length: monthCount }, (_, index) => {
    const { year, month } = monthAt(startDate, index);
    let seyun = seyunByYear.get(year);
    if (!seyun) {
      seyun = analyzeSeyun(saju, year);
      seyunByYear.set(year, seyun);
    }
    let daeun = daeunByYear.get(year);
    if (daeun === undefined) {
      const period = getDaeunByYear(saju, year);
      daeun = period ? analyzeDaeun(saju, period) : null;
      daeunByYear.set(year, daeun);
    }

    const wolun = analyzeWolun(saju, year, month);
    const monthScore = getPurposeLayerScore(
      wolun.fortune.score,
      wolun.fortune,
      decisionType,
    );
    const seyunScore = getPurposeLayerScore(
      seyun.fortune.score,
      seyun.fortune.keyAspects,
      decisionType,
    );
    const daeunScore = daeun
      ? getPurposeLayerScore(
          daeun.fortune.score,
          daeun.fortune.aspects,
          decisionType,
        )
      : undefined;
    const score = blendLayerScores(monthScore, seyunScore, daeunScore);
    const rating = toTimingRating(score);
    const yongsinMatched = primaryYongsin === wolun.element;
    const reasons = [
      `${purposeLabel} 관점의 월운이 ${monthScore}점입니다.`,
      `${year}년 세운 흐름이 ${seyunScore}점입니다.`,
    ];
    if (daeunScore !== undefined)
      reasons.push(`대운의 장기 흐름이 ${daeunScore}점입니다.`);
    if (yongsinMatched)
      reasons.push(
        `월의 오행 ${josa(wolun.element, "이/가")} 명식의 용신과 일치합니다.`,
      );

    return {
      year,
      month,
      yearMonth: formatYearMonth(year, month),
      period: `${year}년 ${month}월`,
      rating,
      score,
      scoreBreakdown: {
        month: monthScore,
        seyun: seyunScore,
        daeun: daeunScore,
        purposeLabel,
      },
      element: wolun.element,
      yongsinMatched,
      briefAdvice: generateBriefAdvice(decisionType, rating),
      reasons,
      cautions: [
        ...wolun.characteristics.cautions.slice(0, 1),
        ...seyun.interpretation.challenges.slice(0, 1),
      ],
    } satisfies TimingMonth;
  });
  return { months, seyunByYear, daeunByYear };
}

function buildSpecificDates(
  saju: SajuData,
  decisionType: DecisionType,
  candidate: TimingMonth,
): TimingSpecificDate[] | undefined {
  const purpose = TAEKIL_PURPOSE[decisionType];
  if (!purpose) return undefined;
  return findLuckyDaysInMonth(saju, candidate.year, candidate.month, purpose)
    .recommendations.slice(0, 3)
    .map((item) => ({
      date: item.date,
      score: item.score,
      dayPillar: item.dayPillar,
      reasons: item.reasons,
      cautions: item.cautions,
    }));
}

function buildLongTermOutlook(
  months: TimingMonth[],
  seyunByYear: Map<number, SeyunAnalysis>,
  daeunByYear: Map<number, DaeunAnalysis | null>,
): TimingAdvice["longTermOutlook"] {
  const years = [...new Set(months.map((month) => month.year))];
  return years.map((year) => {
    const yearMonths = months.filter((month) => month.year === year);
    const overallScore = Math.round(
      average(yearMonths.map((month) => month.score)),
    );
    const topMonths = [...yearMonths]
      .sort((a, b) => b.score - a.score || a.month - b.month)
      .slice(0, 2);
    const seyun = seyunByYear.get(year);
    const daeun = daeunByYear.get(year) ?? null;
    return {
      year,
      overallRating: toTimingRating(overallScore),
      overallScore,
      keyPeriods: topMonths.map((month) => month.period),
      majorOpportunities: [
        ...(seyun?.interpretation.opportunities.slice(0, 1) ?? []),
        ...(daeun?.interpretation.opportunities.slice(0, 1) ?? []),
      ],
      majorChallenges: [
        ...(seyun?.interpretation.challenges.slice(0, 1) ?? []),
        ...(daeun?.interpretation.challenges.slice(0, 1) ?? []),
      ],
      daeunInfluence: daeun
        ? `대운 ${daeun.period.pillar} (${daeun.period.startAge}-${daeun.period.endAge}세) · ${daeun.fortune.overall}`
        : undefined,
    };
  });
}

function getSeason(month: number): TimingAdvice["summary"]["bestSeason"] {
  if (month >= 3 && month <= 5) return "봄";
  if (month >= 6 && month <= 8) return "여름";
  if (month >= 9 && month <= 11) return "가을";
  return "겨울";
}

function getUrgency(offset: number): TimingUrgency {
  if (offset <= 2) return "가까운 시기";
  if (offset <= 11) return "1년 이내";
  if (offset <= 23) return "1~2년 후";
  return "2~3년 후";
}

export function analyzeTimingAdvice(
  saju: SajuData,
  decisionType: DecisionType,
  startDate: Date = new Date(),
  yearsAhead: number = 3,
): TimingAdvice {
  const monthCount = Math.max(1, Math.round(yearsAhead * 12));
  const normalizedStart = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    1,
  );
  const { year: endYear, month: endMonth } = monthAt(
    normalizedStart,
    monthCount - 1,
  );
  const endDate = new Date(endYear, endMonth, 0);
  const { months, seyunByYear, daeunByYear } = buildMonthlyForecast(
    saju,
    decisionType,
    normalizedStart,
    monthCount,
  );

  const optimalTiming = months
    .map((month, index) => ({ month, index }))
    .sort((a, b) => b.month.score - a.month.score || a.index - b.index)
    .slice(0, 3)
    .map(({ month }) => ({
      ...month,
      specificDates: buildSpecificDates(saju, decisionType, month),
      yongsinSupport: month.yongsinMatched
        ? `월 오행 ${josa(month.element, "이/가")} 용신과 일치`
        : undefined,
    }));

  const timesToAvoid = months
    .filter((month) => month.score < 45)
    .sort((a, b) => a.score - b.score || a.year - b.year || a.month - b.month)
    .slice(0, 3)
    .map((month) => ({
      year: month.year,
      month: month.month,
      yearMonth: month.yearMonth,
      period: month.period,
      rating: month.rating,
      score: month.score,
      reason: month.cautions[0] ?? "목적별 종합 흐름이 낮은 시기입니다.",
      severity: (month.score < 30 ? "높음" : "중간") as "높음" | "중간",
      alternatives: ["추천 월과 비교", "현실 조건과 전문가 판단을 함께 검토"],
    }));

  const best = optimalTiming[0]!;
  const offset =
    (best.year - normalizedStart.getFullYear()) * 12 +
    best.month -
    (normalizedStart.getMonth() + 1);
  const strong = best.score >= 65;
  const overallAdvice = strong
    ? `${josa(best.period, "이/가")} ${decisionType}에 가장 유리한 흐름입니다.`
    : `강한 적기는 없지만 ${josa(best.period, "이/가")} 분석 기간 중 ${decisionType}에 상대적으로 낫습니다.`;

  return {
    decisionType,
    period: { start: normalizedStart, end: endDate },
    optimalTiming,
    timesToAvoid,
    monthlyForecast: months,
    longTermOutlook: buildLongTermOutlook(months, seyunByYear, daeunByYear),
    summary: {
      bestYear: best.year,
      bestMonth: best.month,
      bestSeason: getSeason(best.month),
      overallAdvice,
      urgency: getUrgency(offset),
      recommendationLabel: strong ? "추천 시기" : "상대적으로 나은 시기",
      disclaimer: DECISION_DISCLAIMER[decisionType],
    },
    specificDateNotice:
      decisionType === "투자" || decisionType === "출산"
        ? "검증된 일 단위 택일 기준이 없어 월 단위 시기 조언만 제공합니다."
        : undefined,
  };
}

export function analyzeMultipleDecisions(
  saju: SajuData,
  decisions: DecisionType[],
  startDate: Date = new Date(),
  yearsAhead: number = 3,
): Record<DecisionType, TimingAdvice> {
  return Object.fromEntries(
    decisions.map((decision) => [
      decision,
      analyzeTimingAdvice(saju, decision, startDate, yearsAhead),
    ]),
  ) as Record<DecisionType, TimingAdvice>;
}

/** 공개 호환 API. 날짜가 속한 월의 통합 적합도를 평가한다. */
export function evaluateSpecificDate(
  saju: SajuData,
  decisionType: DecisionType,
  targetDate: Date,
): {
  score: number;
  rating: TimingRating;
  recommendation: string;
  reasons: string[];
} {
  const month = buildMonthlyForecast(saju, decisionType, targetDate, 1)
    .months[0]!;
  return {
    score: month.score,
    rating: month.rating,
    recommendation:
      month.rating === "최적기" || month.rating === "좋음"
        ? `${josa(decisionType, "을/를")} 진행하기 좋은 달입니다.`
        : month.rating === "보통"
          ? "현실 조건을 함께 살피며 신중히 검토하세요."
          : `${josa(decisionType, "을/를")} 다른 달로 조정하는 편이 좋습니다.`,
    reasons: month.reasons,
  };
}
