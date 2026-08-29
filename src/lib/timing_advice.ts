/**
 * 시기 조언 시스템 (Timing Advice)
 *
 * 사주, 대운, 세운, 월운을 종합하여 중요한 결정의 최적 시기를 조언합니다.
 */

import type { SajuData, WuXing } from '../types/index';
import { analyzeSeyun } from './seyun_analysis';
import { analyzeWolun } from './wolun_analysis';
import { getDaeunByYear, analyzeDaeun, type DaeunAnalysis } from './daeun_analysis';
import { josa } from './korean';

/**
 * 결정 타입
 */
export type DecisionType =
  | '결혼' // 혼인
  | '이직' // 직장 변경
  | '창업' // 사업 시작
  | '투자' // 재무 투자
  | '이사' // 주거 이전
  | '수술' // 의료 시술
  | '계약' // 중요 계약
  | '학업' // 진학/유학
  | '출산' // 자녀 계획
  | '여행'; // 중요 여행

/**
 * 시기 등급
 */
export type TimingRating = '최적기' | '좋음' | '보통' | '주의' | '불가';

/**
 * 시기 조언 결과
 */
export interface TimingAdvice {
  /** 결정 타입 */
  decisionType: DecisionType;

  /** 분석 기간 */
  period: {
    start: Date;
    end: Date;
  };

  /** 최적 시기 (상위 3개) */
  optimalTiming: {
    period: string; // "2025년 3월", "2025년 봄" 등
    rating: TimingRating;
    score: number; // 0-100
    specificDates?: Date[]; // 구체적 날짜 (있는 경우)
    reasons: string[];
    yongsinSupport: string; // 용신 지원 설명
    cautions: string[];
  }[];

  /** 피해야 할 시기 */
  timesToAvoid: {
    period: string;
    reason: string;
    severity: '높음' | '중간' | '낮음';
    alternatives: string[];
  }[];

  /** 월별 운세 요약 (향후 12개월) */
  monthlyForecast: {
    yearMonth: string; // "2025-03"
    rating: TimingRating;
    score: number;
    briefAdvice: string;
  }[];

  /** 장기 전망 (향후 3년) */
  longTermOutlook: {
    year: number;
    overallRating: TimingRating;
    /** 대운이 있으면 세운×0.6+대운×0.4, 없으면 세운 점수 그대로 (0-100). */
    overallScore: number;
    keyPeriods: string[];
    majorOpportunities: string[];
    majorChallenges: string[];
    daeunInfluence?: string; // 대운 영향
  }[];

  /** 종합 조언 */
  summary: {
    bestYear: number;
    bestMonth: number;
    bestSeason: '봄' | '여름' | '가을' | '겨울';
    overallAdvice: string;
    urgency: '즉시 가능' | '1년 내' | '2-3년 후' | '장기 계획';
  };
}

/**
 * 결정별 중요 요소
 */
const DECISION_FACTORS: Record<DecisionType, {
  yongsinWeight: number; // 용신 중요도 (0-100)
  harmonyWeight: number; // 조화 중요도
  stabilityWeight: number; // 안정성 중요도
  opportunityWeight: number; // 기회 중요도
  favorableElements: WuXing[]; // 유리한 오행들
}> = {
  '결혼': {
    yongsinWeight: 70,
    harmonyWeight: 90,
    stabilityWeight: 80,
    opportunityWeight: 50,
    favorableElements: ['토', '금'], // 안정, 의리
  },
  '이직': {
    yongsinWeight: 60,
    harmonyWeight: 50,
    stabilityWeight: 40,
    opportunityWeight: 90,
    favorableElements: ['목', '화'], // 성장, 활동
  },
  '창업': {
    yongsinWeight: 80,
    harmonyWeight: 60,
    stabilityWeight: 50,
    opportunityWeight: 95,
    favorableElements: ['화', '토'], // 확장, 기반
  },
  '투자': {
    yongsinWeight: 70,
    harmonyWeight: 40,
    stabilityWeight: 60,
    opportunityWeight: 85,
    favorableElements: ['금', '수'], // 재물, 지혜
  },
  '이사': {
    yongsinWeight: 50,
    harmonyWeight: 70,
    stabilityWeight: 90,
    opportunityWeight: 40,
    favorableElements: ['토', '목'], // 안정, 성장
  },
  '수술': {
    yongsinWeight: 60,
    harmonyWeight: 80,
    stabilityWeight: 95,
    opportunityWeight: 30,
    favorableElements: ['금', '수'], // 정밀, 치유
  },
  '계약': {
    yongsinWeight: 70,
    harmonyWeight: 75,
    stabilityWeight: 70,
    opportunityWeight: 80,
    favorableElements: ['금', '토'], // 신의, 기반
  },
  '학업': {
    yongsinWeight: 60,
    harmonyWeight: 60,
    stabilityWeight: 50,
    opportunityWeight: 75,
    favorableElements: ['목', '수'], // 성장, 지혜
  },
  '출산': {
    yongsinWeight: 70,
    harmonyWeight: 85,
    stabilityWeight: 90,
    opportunityWeight: 50,
    favorableElements: ['목', '수'], // 생명, 양육
  },
  '여행': {
    yongsinWeight: 40,
    harmonyWeight: 60,
    stabilityWeight: 30,
    opportunityWeight: 70,
    favorableElements: ['수', '목'], // 자유, 이동
  },
};

/**
 * 점수(0-100) → 시기 등급. generateMonthlyForecast/generateLongTermOutlook/
 * evaluateSpecificDate에 흩어져 있던 동일한 >=80/65/45/30 사다리를 한 곳으로 모았다 —
 * selectOptimalTiming이 월운·대운·세운 블렌드 점수로 등급을 다시 매길 때도 이 기준을 쓴다.
 */
function toTimingRating(score: number): TimingRating {
  return score >= 80 ? '최적기'
    : score >= 65 ? '좋음'
    : score >= 45 ? '보통'
    : score >= 30 ? '주의'
    : '불가';
}

/**
 * 시기 조언 생성
 */
export function analyzeTimingAdvice(
  saju: SajuData,
  decisionType: DecisionType,
  startDate: Date = new Date(),
  yearsAhead: number = 3
): TimingAdvice {
  const yongsin = saju.yongSin?.primaryYongSin || '목';
  const factors = DECISION_FACTORS[decisionType];

  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + yearsAhead);

  // 1. 월별 운세 분석 (향후 12개월)
  const monthlyForecast = generateMonthlyForecast(
    saju,
    yongsin,
    decisionType,
    factors,
    startDate
  );

  // 2. 장기 전망 (향후 3년)
  const longTermOutlook = generateLongTermOutlook(
    saju,
    yongsin,
    decisionType,
    factors,
    startDate,
    yearsAhead
  );

  // 3. 최적 시기 선정
  const optimalTiming = selectOptimalTiming(
    monthlyForecast,
    longTermOutlook,
    factors
  );

  // 4. 피해야 할 시기
  const timesToAvoid = identifyTimesToAvoid(
    monthlyForecast,
    longTermOutlook
  );

  // 5. 종합 조언
  const summary = generateTimingSummary(
    optimalTiming,
    longTermOutlook,
    decisionType,
    startDate
  );

  return {
    decisionType,
    period: { start: startDate, end: endDate },
    optimalTiming,
    timesToAvoid,
    monthlyForecast,
    longTermOutlook,
    summary,
  };
}

/**
 * 월별 운세 예측 (향후 12개월)
 */
function generateMonthlyForecast(
  saju: SajuData,
  yongsin: WuXing,
  decisionType: DecisionType,
  factors: typeof DECISION_FACTORS[DecisionType],
  startDate: Date
): TimingAdvice['monthlyForecast'] {
  const forecast: TimingAdvice['monthlyForecast'] = [];

  for (let i = 0; i < 12; i++) {
    const targetDate = new Date(startDate);
    targetDate.setMonth(targetDate.getMonth() + i);

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;

    // 월운 분석
    const wolunAnalysis = analyzeWolun(saju, year, month);

    // 점수 계산
    let score = wolunAnalysis.fortune.overall === '대길' ? 90
      : wolunAnalysis.fortune.overall === '길' ? 75
      : wolunAnalysis.fortune.overall === '평' ? 50
      : wolunAnalysis.fortune.overall === '흉' ? 30
      : 15;

    // 용신 지원도 반영
    if (wolunAnalysis.element === yongsin) {
      score += 10;
    }

    // 유리한 오행 반영
    if (factors.favorableElements.includes(wolunAnalysis.element)) {
      score += 5;
    }

    score = Math.min(100, Math.max(0, score));

    const rating: TimingRating = toTimingRating(score);

    forecast.push({
      yearMonth: `${year}-${String(month).padStart(2, '0')}`,
      rating,
      score,
      briefAdvice: generateBriefAdvice(decisionType, rating, wolunAnalysis.element),
    });
  }

  return forecast;
}

/**
 * 장기 전망 생성 (향후 N년) - 대운 통합
 */
function generateLongTermOutlook(
  saju: SajuData,
  _yongsin: WuXing,
  _decisionType: DecisionType,
  _factors: typeof DECISION_FACTORS[DecisionType],
  startDate: Date,
  yearsAhead: number
): TimingAdvice['longTermOutlook'] {
  const outlook: TimingAdvice['longTermOutlook'] = [];

  for (let i = 0; i < yearsAhead; i++) {
    const targetYear = startDate.getFullYear() + i;
    const seyunAnalysis = analyzeSeyun(saju, targetYear);

    // 대운 분석 추가
    const daeunPeriod = getDaeunByYear(saju, targetYear);
    let daeunAnalysis: DaeunAnalysis | null = null;
    let daeunInfluence = '';

    if (daeunPeriod) {
      daeunAnalysis = analyzeDaeun(saju, daeunPeriod);

      // 대운 점수를 세운 점수에 반영 (가중 평균: 세운 60%, 대운 40%)
      const combinedScore = Math.round(
        seyunAnalysis.fortune.score * 0.6 + daeunAnalysis.fortune.score * 0.4
      );

      daeunInfluence = `대운 ${daeunPeriod.pillar} (${daeunPeriod.startAge}-${daeunPeriod.endAge}세) 영향: ${daeunAnalysis.fortune.overall}`;

      // 대운과 세운 점수 통합
      const overallScore = combinedScore;
      const overallRating: TimingRating = toTimingRating(overallScore);

      // 주요 시기
      const keyPeriods = seyunAnalysis.importantPeriods.favorableMonths.map(
        (m) => `${targetYear}년 ${m}월`
      );

      // 기회 요소 (대운 + 세운)
      const majorOpportunities = [
        ...seyunAnalysis.interpretation.opportunities.slice(0, 1),
        ...daeunAnalysis.interpretation.opportunities.slice(0, 1),
      ];

      // 도전 과제 (대운 + 세운)
      const majorChallenges = [
        ...seyunAnalysis.interpretation.challenges.slice(0, 1),
        ...daeunAnalysis.interpretation.challenges.slice(0, 1),
      ];

      outlook.push({
        year: targetYear,
        overallRating,
        overallScore,
        keyPeriods,
        majorOpportunities,
        majorChallenges,
        daeunInfluence,
      });
    } else {
      // 대운 정보 없을 때는 세운만 사용
      const overallScore = seyunAnalysis.fortune.score;
      const overallRating: TimingRating = toTimingRating(overallScore);

      const keyPeriods = seyunAnalysis.importantPeriods.favorableMonths.map(
        (m) => `${targetYear}년 ${m}월`
      );

      const majorOpportunities = seyunAnalysis.interpretation.opportunities.slice(0, 2);
      const majorChallenges = seyunAnalysis.interpretation.challenges.slice(0, 2);

      outlook.push({
        year: targetYear,
        overallRating,
        overallScore,
        keyPeriods,
        majorOpportunities,
        majorChallenges,
      });
    }
  }

  return outlook;
}

/**
 * 최적 시기 선정 (상위 3개)
 *
 * 월운 점수만으로 순위를 매기던 기존 로직은 대운/세운이 아무리 흉해도 반영되지
 * 않는 버그가 있었다(흐름 탭에서 대운/세운을 바꿔도 "시기 조언"이 고정되던 문제의
 * 원인 중 하나). longTermOutlook의 해당 연도 overallScore(세운×0.6+대운×0.4, 대운
 * 없으면 세운 점수)를 30% 가중치로 블렌드해 대운·세운 강약이 실제로 순위에 반영되게
 * 한다. _factors(결정별 4개 가중치)는 이번 범위에서 계속 미사용이다 —
 * favorableElements는 이미 generateMonthlyForecast의 월운 점수에 반영돼 있고,
 * yongsinWeight 등 나머지를 어떻게 섞을지는 별도 명리 설계가 필요해 임의로 넣지 않는다.
 */
function selectOptimalTiming(
  monthlyForecast: TimingAdvice['monthlyForecast'],
  longTermOutlook: TimingAdvice['longTermOutlook'],
  _factors: typeof DECISION_FACTORS[DecisionType]
): TimingAdvice['optimalTiming'] {
  const outlookByYear = new Map(longTermOutlook.map((o) => [o.year, o]));

  const blended = monthlyForecast.map((candidate) => {
    const [year] = candidate.yearMonth.split('-').map(Number);
    const outlook = year !== undefined ? outlookByYear.get(year) : undefined;
    const score = outlook
      ? Math.round(candidate.score * 0.7 + outlook.overallScore * 0.3)
      : candidate.score;
    return { candidate, score, outlook };
  });

  const candidates = blended
    .filter((b) => b.score >= 65)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return candidates.map(({ candidate, score, outlook }) => {
    const [year, month] = candidate.yearMonth.split('-').map(Number);
    const monthName = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'][month ?? 1] || '?월';
    const rating = toTimingRating(score);

    const reasons = [
      `월운·대운·세운을 종합한 점수가 ${score}점으로 매우 양호합니다.`,
      score >= 80
        ? '용신의 힘이 강한 시기입니다.'
        : '전반적으로 안정적인 시기입니다.',
    ];
    if (outlook?.daeunInfluence) {
      reasons.push(outlook.daeunInfluence);
    }

    return {
      period: `${year}년 ${monthName}`,
      rating,
      score,
      reasons,
      yongsinSupport: score >= 75
        ? '용신이 강력히 지원하는 시기'
        : '용신 지원이 있는 시기',
      cautions: score < 80
        ? ['중요한 결정은 신중히 검토하세요.']
        : [],
    };
  });
}

/**
 * 피해야 할 시기 식별
 */
function identifyTimesToAvoid(
  monthlyForecast: TimingAdvice['monthlyForecast'],
  _longTermOutlook: TimingAdvice['longTermOutlook']
): TimingAdvice['timesToAvoid'] {
  const avoid: TimingAdvice['timesToAvoid'] = [];

  // 점수가 30 이하인 월 찾기
  const badMonths = monthlyForecast.filter((m) => m.score <= 30);

  badMonths.forEach((month) => {
    const [year, monthNum] = month.yearMonth.split('-').map(Number);
    const monthName = `${year}년 ${monthNum}월`;

    avoid.push({
      period: monthName,
      reason: '운세가 매우 불안정한 시기입니다.',
      severity: month.score <= 20 ? '높음' : '중간',
      alternatives: ['다음 달로 연기', '전문가와 상담'],
    });
  });

  return avoid.slice(0, 3); // 최대 3개만 반환
}

/**
 * 종합 조언 생성
 *
 * urgency는 점수가 아니라 startDate(분석 기준 시점)로부터 최적 시기까지의 개월 수로
 * 정한다 — 예전엔 점수만 봐서, 흐름 탭에서 먼 미래 대운(예: 2046년)을 골라도 점수가
 * 높으면 "즉시 가능"이라고 나오는 명백한 오표시가 있었다.
 */
function generateTimingSummary(
  optimalTiming: TimingAdvice['optimalTiming'],
  _longTermOutlook: TimingAdvice['longTermOutlook'],
  decisionType: DecisionType,
  startDate: Date
): TimingAdvice['summary'] {
  const bestTiming = optimalTiming[0];
  if (!bestTiming) {
    return {
      bestYear: startDate.getFullYear(),
      bestMonth: startDate.getMonth() + 1,
      bestSeason: '봄',
      overallAdvice: '현재 적절한 시기를 찾기 어렵습니다. 전문가와 상담하세요.',
      urgency: '장기 계획',
    };
  }

  const match = bestTiming.period.match(/(\d+)년\s*(\d+)월/);
  const year = match ? Number(match[1]) : startDate.getFullYear();
  const month = match ? Number(match[2]) : 1;

  const season = month >= 3 && month <= 5 ? '봄'
    : month >= 6 && month <= 8 ? '여름'
    : month >= 9 && month <= 11 ? '가을'
    : '겨울';

  const monthsFromAnchor =
    (year - startDate.getFullYear()) * 12 + (month - (startDate.getMonth() + 1));

  const urgency = monthsFromAnchor <= 2 ? '즉시 가능'
    : monthsFromAnchor <= 12 ? '1년 내'
    : monthsFromAnchor <= 36 ? '2-3년 후'
    : '장기 계획';

  return {
    bestYear: year,
    bestMonth: month,
    bestSeason: season,
    overallAdvice: `${josa(bestTiming.period, "이/가")} ${decisionType}에 가장 적합한 시기입니다. ${bestTiming.yongsinSupport}.`,
    urgency,
  };
}

/**
 * 간단한 조언 생성
 */
function generateBriefAdvice(
  decisionType: DecisionType,
  rating: TimingRating,
  _element: WuXing
): string {
  if (rating === '최적기') {
    return `${decisionType}에 최적의 시기입니다.`;
  } else if (rating === '좋음') {
    return `${decisionType} 진행 가능한 시기입니다.`;
  } else if (rating === '보통') {
    return `신중한 검토 후 진행하세요.`;
  } else if (rating === '주의') {
    return `${josa(decisionType, "은/는")} 연기하는 것이 좋습니다.`;
  } else {
    return `${josa(decisionType, "을/를")} 피해야 하는 시기입니다.`;
  }
}

/**
 * 다중 결정 시기 분석
 */
export function analyzeMultipleDecisions(
  saju: SajuData,
  decisions: DecisionType[],
  startDate: Date = new Date(),
  yearsAhead: number = 3
): Record<DecisionType, TimingAdvice> {
  const results: Record<string, TimingAdvice> = {};

  decisions.forEach((decision) => {
    results[decision] = analyzeTimingAdvice(saju, decision, startDate, yearsAhead);
  });

  return results as Record<DecisionType, TimingAdvice>;
}

/**
 * 특정 날짜의 적합도 평가
 */
export function evaluateSpecificDate(
  saju: SajuData,
  decisionType: DecisionType,
  targetDate: Date
): {
  score: number;
  rating: TimingRating;
  recommendation: string;
  reasons: string[];
} {
  const yongsin = saju.yongSin?.primaryYongSin || '목';
  const factors = DECISION_FACTORS[decisionType];

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;

  const wolunAnalysis = analyzeWolun(saju, year, month);

  let score = wolunAnalysis.fortune.score;

  // 용신 지원도 반영
  if (wolunAnalysis.element === yongsin) {
    score += 10;
  }

  // 유리한 오행 반영
  if (factors.favorableElements.includes(wolunAnalysis.element)) {
    score += 5;
  }

  score = Math.min(100, Math.max(0, score));

  const rating: TimingRating = toTimingRating(score);

  return {
    score,
    rating,
    recommendation: rating === '최적기' || rating === '좋음'
      ? `${josa(decisionType, "을/를")} 진행하기 좋은 날입니다.`
      : rating === '보통'
      ? '가능하지만 신중히 검토하세요.'
      : `${josa(decisionType, "을/를")} 연기하는 것이 좋습니다.`,
    reasons: [
      `월운 점수: ${score}점`,
      wolunAnalysis.element === yongsin ? '용신 지원' : '보통',
      `전반적 운세: ${wolunAnalysis.fortune.overall}`,
    ],
  };
}
