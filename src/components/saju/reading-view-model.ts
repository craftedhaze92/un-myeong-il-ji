/**
 * 사주 "풀이"(해석 서술) 프레젠테이션 레이어.
 *
 * 계산 로직을 새로 짜지 않고 src/lib의 기존 서술 엔진(analyzeLifeAreas, analyzeLifetime,
 * recommendCareer, analyzeDaeun, analyzeSeyun 등)을 조립해 화면에 바로 쓸 수 있는 VM으로 만든다.
 * view-model.ts와 같은 규약: 순수 함수, SajuData(+대운 목록) → 프레젠테이션 VM.
 */
import { getHeavenlyStemByKorean } from "@/data/heavenly_stems";
import { getIljuInterpretation } from "@/data/ilju_interpretations";
import { recommendCareer } from "@/lib/career_recommendation";
import type { ElementStatus } from "@/lib/element_distribution";
import type { DaeUnPeriod } from "@/lib/dae_un";
import {
  analyzeDaeun,
  type DaeunAnalysis,
  type DaeunPeriod,
} from "@/lib/daeun_analysis";
import {
  analyzeDominantTenGods,
  analyzeLifeAreas,
  type DominantTenGodAnalysis,
  type LifeAreaAnalysis,
} from "@/lib/life_area_analysis";
import {
  analyzeLifetime,
  type LifetimeHighlight,
  type LifetimeOverview,
  type LifetimeStage,
} from "@/lib/lifetime_analysis";
import { analyzeSeyun } from "@/lib/seyun_analysis";
import { analyzeWolun } from "@/lib/wolun_analysis";
import { analyzeTimingAdvice, type DecisionType } from "@/lib/timing_advice";
import { analyzePungsu, type SpaceType } from "@/lib/pungsu_advice";
import { analyzeName } from "@/lib/jakmeong_analysis";
import { getAllSinSalInfo, interpretBySinSal } from "@/lib/sin_sal";
import { getFortuneYearForManAge, getManAgeForFortuneYear } from "@/utils/date";
import { selectYongSin, generateYongSinAdvice } from "@/lib/yong_sin";
import type { HeavenlyStem, SajuData, WuXing } from "@/types";

// ── 공통 라벨 ──────────────────────────────────────────────────────────

const PILLAR_LABEL: Record<"year" | "month" | "day" | "hour", string> = {
  year: "연주",
  month: "월주",
  day: "일주",
  hour: "시주",
};

const STRENGTH_LEVEL_LABEL: Record<string, string> = {
  very_strong: "매우 강함",
  strong: "강함",
  medium: "중간",
  weak: "약함",
  very_weak: "매우 약함",
};

const WOL_RYEONG_LABEL: Record<"strong" | "medium" | "weak", string> = {
  strong: "강",
  medium: "중",
  weak: "약",
};

const YONGSIN_METHOD_LABEL: Record<
  NonNullable<SajuData["yongSin"]>["method"] & string,
  string
> = {
  jeonwang: "전왕용신(종격)",
  johu: "조후용신",
  eokbu: "억부용신",
  tonggwan: "통관용신",
};

const PILLAR_SHORT_LABEL: Record<"year" | "month" | "day" | "hour", string> = {
  year: "년",
  month: "월",
  day: "일",
  hour: "시",
};

const GYEOKGUK_STATUS_LABEL: Record<
  NonNullable<NonNullable<SajuData["gyeokGuk"]>["quality"]>["status"],
  string
> = {
  성격: "성격(成格)",
  파격: "파격(破格)",
  성중유패: "성중유패(成中有敗)",
  패중유구: "패중유구(敗中有救)",
};

const SINSAL_TYPE_LABEL: Record<"lucky" | "unlucky" | "neutral", string> = {
  lucky: "길신",
  unlucky: "흉신",
  neutral: "중립",
};

const JIJANGGAN_ROLE_LABEL: Record<
  "primary" | "secondary" | "residual",
  string
> = {
  primary: "정기",
  secondary: "중기",
  residual: "여기",
};

// ── 블록 1: 명식 기본 해석 ──────────────────────────────────────────────

export interface JiJangGanEntryVM {
  roleLabel: string;
  stem: string;
  hanja: string;
  strength: number;
}

export interface JiJangGanPillarVM {
  pillarLabel: string;
  entries: JiJangGanEntryVM[];
}

export interface BranchRelationsVM {
  summary: string;
  samHap?: string;
  samHyeong: string[];
  yukHae: string[];
}

export interface SinSalDetailVM {
  name: string;
  hanja: string;
  typeLabel: string;
  description: string;
  effects: string[];
  advice: string[];
  positive: string[];
  negative: string[];
  byArea: { career: string; love: string; health: string };
}

/** 신살 개별 카드가 아니라 사주에 있는 신살 전체를 길신/흉신으로 묶어 요약한 조합 해석. */
export interface SinSalCombinedVM {
  blessingNames: string[];
  warningNames: string[];
  specialAdvice: string[];
}

export interface GyeokGukQualityVM {
  statusLabel: string;
  useType: "순용" | "역용";
  sangSinLabel?: string;
  brokenBy: string[];
  rescuedBy: string[];
  explanation: string;
}

export interface IljuInterpretationVM {
  name: string;
  hanja: string;
  summary: string;
  keywords: string[];
  temperament: string;
  innerStyle: string;
  relation: string;
  strengths: string[];
  cautions: string[];
}

export interface MyeongsikVM {
  ilju: IljuInterpretationVM;
  gyeokGuk?: {
    name: string;
    hanja: string;
    description: string;
    quality?: GyeokGukQualityVM;
  };
  dayMasterStrength?: {
    levelLabel: string;
    score: number;
    analysis: string;
    /** 득령·득지·득세 3요소 배지 — undefined면 예전 데이터 등 판정 근거가 없다는 뜻 */
    deukRyeong?: boolean;
    deukJi?: boolean;
    deukSe?: boolean;
    /** 통근한 자리 라벨(예: ["년", "시"]) */
    rootedAtLabels: string[];
  };
  wolRyeong?: { isDeukRyeong: boolean; reason: string; strengthLabel: string };
  jiJangGan: JiJangGanPillarVM[];
  branchRelations?: BranchRelationsVM;
  yongSin?: {
    primary: WuXing;
    secondary?: WuXing;
    reasoning: string;
    advice: string[];
    methodLabel?: string;
  };
  sinsal: SinSalDetailVM[];
  /** 신살이 2개 이상일 때만 채워지는 조합 요약 — 신살 1개 이하는 개별 카드와 중복이라 뺀다. */
  sinsalCombined?: SinSalCombinedVM;
}

function buildJiJangGan(saju: SajuData): JiJangGanPillarVM[] {
  if (!saju.jiJangGan) return [];
  const keys: Array<"year" | "month" | "day" | "hour"> = [
    "year",
    "month",
    "day",
    "hour",
  ];
  return keys
    .map((key) => {
      const info = saju.jiJangGan?.[key];
      if (!info) return null;
      const rawEntries: Array<
        [
          "primary" | "secondary" | "residual",
          { stem: HeavenlyStem; strength: number } | undefined,
        ]
      > = [
        ["primary", info.primary],
        ["secondary", info.secondary],
        ["residual", info.residual],
      ];
      const entries: JiJangGanEntryVM[] = rawEntries
        .filter(
          (
            e,
          ): e is [
            "primary" | "secondary" | "residual",
            { stem: HeavenlyStem; strength: number },
          ] => !!e[1],
        )
        .map(([role, entry]) => ({
          roleLabel: JIJANGGAN_ROLE_LABEL[role],
          stem: entry.stem,
          hanja: getHeavenlyStemByKorean(entry.stem)?.hanja ?? entry.stem,
          strength: Math.round(entry.strength),
        }));
      return { pillarLabel: PILLAR_LABEL[key], entries };
    })
    .filter((v): v is JiJangGanPillarVM => v !== null);
}

function buildBranchRelations(saju: SajuData): BranchRelationsVM | undefined {
  const br = saju.branchRelations;
  if (!br) return undefined;
  return {
    summary: br.summary ?? "",
    samHap: br.samHap?.type
      ? `${br.samHap.type} → ${br.samHap.element}`
      : undefined,
    samHyeong: br.samHyeong ?? [],
    yukHae: (br.yukHae ?? []).map(([a, b]) => `${a}-${b} 육해`),
  };
}

function buildSinsalDetails(saju: SajuData): SinSalDetailVM[] {
  if (!saju.sinSals || saju.sinSals.length === 0) return [];
  return getAllSinSalInfo(saju.sinSals).map((info) => ({
    name: info.name,
    hanja: info.hanja,
    typeLabel: SINSAL_TYPE_LABEL[info.type],
    description: info.description,
    effects: info.effects,
    advice: info.advice,
    positive: info.positive,
    negative: info.negative,
    byArea: info.byArea,
  }));
}

/** 신살 각각의 카드(buildSinsalDetails)와 별개로, 여러 신살을 길신/흉신으로 묶은 조합 요약. */
function buildSinsalCombined(saju: SajuData): SinSalCombinedVM | undefined {
  if (!saju.sinSals || saju.sinSals.length < 2) return undefined;
  const { blessingNames, warningNames, specialAdvice } = interpretBySinSal(
    saju.sinSals,
  );
  return {
    blessingNames,
    warningNames,
    specialAdvice: [...new Set(specialAdvice)],
  };
}

function buildGyeokGukQuality(
  quality: NonNullable<SajuData["gyeokGuk"]>["quality"],
): GyeokGukQualityVM | undefined {
  if (!quality) return undefined;
  return {
    statusLabel: GYEOKGUK_STATUS_LABEL[quality.status],
    useType: quality.useType,
    sangSinLabel: quality.sangSin,
    brokenBy: quality.brokenBy,
    rescuedBy: quality.rescuedBy,
    explanation: quality.explanation,
  };
}

export function buildMyeongsikViewModel(saju: SajuData): MyeongsikVM {
  const yongSinAnalysis = selectYongSin(saju);
  const strength = saju.dayMasterStrength;
  const rootedAtLabels = (strength?.rootedAt ?? []).map(
    (p) => PILLAR_SHORT_LABEL[p],
  );
  const ilju = getIljuInterpretation(saju.day.stem, saju.day.branch);

  return {
    ilju: {
      name: ilju.name,
      hanja: ilju.hanja,
      summary: ilju.summary,
      keywords: ilju.keywords,
      temperament: ilju.temperament,
      innerStyle: ilju.innerStyle,
      relation: ilju.relation,
      strengths: ilju.strengths,
      cautions: ilju.cautions,
    },
    gyeokGuk: saju.gyeokGuk
      ? {
          name: saju.gyeokGuk.name,
          hanja: saju.gyeokGuk.hanja,
          description: saju.gyeokGuk.description,
          quality: buildGyeokGukQuality(saju.gyeokGuk.quality),
        }
      : undefined,
    dayMasterStrength: strength
      ? {
          levelLabel: STRENGTH_LEVEL_LABEL[strength.level] ?? strength.level,
          score: strength.score,
          analysis: strength.analysis,
          deukRyeong: strength.deukRyeong,
          deukJi: strength.deukJi,
          deukSe: strength.deukSe,
          rootedAtLabels,
        }
      : undefined,
    wolRyeong: saju.wolRyeong
      ? {
          isDeukRyeong: saju.wolRyeong.isDeukRyeong,
          reason: saju.wolRyeong.reason,
          strengthLabel: WOL_RYEONG_LABEL[saju.wolRyeong.strength],
        }
      : undefined,
    jiJangGan: buildJiJangGan(saju),
    branchRelations: buildBranchRelations(saju),
    yongSin: saju.yongSin
      ? {
          primary: saju.yongSin.primaryYongSin,
          secondary: saju.yongSin.secondaryYongSin,
          reasoning: saju.yongSin.reasoning,
          advice: generateYongSinAdvice(yongSinAnalysis),
          methodLabel: saju.yongSin.method
            ? YONGSIN_METHOD_LABEL[saju.yongSin.method]
            : undefined,
        }
      : undefined,
    sinsal: buildSinsalDetails(saju),
    sinsalCombined: buildSinsalCombined(saju),
  };
}

// ── 블록 2: 총평·성격·재물·건강·애정 ─────────────────────────────────────

export type FortuneBlockVM = LifeAreaAnalysis;

export type PersonalityAxisVM = DominantTenGodAnalysis;

export interface LifeVM {
  overview: LifetimeOverview;
  stages: LifetimeStage[];
  highlights: LifetimeHighlight[];
  precisionNote?: string;
  /** 총평은 overview가 담당하므로 영역별 운세 3개만 둔다. */
  fortunes: FortuneBlockVM[];
  personality: PersonalityAxisVM[];
}

export function buildLifeViewModel(
  saju: SajuData,
  daeUn: DaeUnPeriod[],
): LifeVM {
  // 'career'는 career_recommendation.ts 기반 CareerVM(블록 4)이 이미 더 상세히 다루므로 여기서는 뺀다.
  // 'general'은 대운까지 조합하는 평생 총평으로 확장해 별도 overview에 둔다.
  const fortunes = analyzeLifeAreas(saju);
  const lifetime = analyzeLifetime(saju, daeUn);
  const personality = analyzeDominantTenGods(saju);

  return {
    overview: lifetime.overview,
    stages: lifetime.stages,
    highlights: lifetime.highlights,
    precisionNote: lifetime.precisionNote,
    fortunes,
    personality,
  };
}

// ── 블록 3: 대운·세운 흐름 ─────────────────────────────────────────────

export interface DaeunOptionVM {
  startAge: number;
  endAge: number;
  /** 이 대운 구간이 시작/끝나는 세운 연도 — getFortuneYearForManAge(생년+나이)로 역산. */
  startYear: number;
  endYear: number;
  pillar: string;
  element: WuXing;
  isCurrent: boolean;
}

export interface DaeunDetailVM {
  startAge: number;
  endAge: number;
  pillar: string;
  harmonyScore: number;
  overall: DaeunAnalysis["fortune"]["overall"];
  score: number;
  aspects: DaeunAnalysis["fortune"]["aspects"];
  summary: string;
  opportunities: string[];
  challenges: string[];
  advice: string[];
}

export interface SeyunPointVM {
  year: number;
  age: number;
  pillar: string;
  score: number;
  isCurrent: boolean;
}

export interface SeyunDetailVM {
  year: number;
  age: number;
  pillar: string;
  overall: string;
  score: number;
  aspects: {
    career: number;
    wealth: number;
    health: number;
    relationship: number;
  };
  summary: string;
  opportunities: string[];
  challenges: string[];
  advice: string[];
  favorableMonths: number[];
  cautiousMonths: number[];
}

export interface FlowVM {
  daeunOptions: DaeunOptionVM[];
  selectedDaeun: DaeunDetailVM | null;
  seyunSpark: SeyunPointVM[];
  selectedSeyun: SeyunDetailVM;
  /** 실제 "올해" — FlowTab이 세운 스파크를 대운 구간별로 다시 그릴 때 isCurrent 기준으로 쓴다. */
  nowYear: number;
}

/** dae_un.ts#DaeUnPeriod → daeun_analysis.ts#analyzeDaeun이 기대하는 형태로 어댑트 */
function toAnalysisPeriod(period: DaeUnPeriod): DaeunPeriod {
  return {
    startAge: period.startAge,
    endAge: period.endAge,
    stem: period.stem,
    branch: period.branch,
    pillar: `${period.stem}${period.branch}`,
    element: period.stemElement,
  };
}

export function buildDaeunOptions(
  daeUn: DaeUnPeriod[],
  nowAge: number,
  birthDateStr: string,
): DaeunOptionVM[] {
  return daeUn.slice(0, 9).map((period) => ({
    startAge: period.startAge,
    endAge: period.endAge,
    startYear: getFortuneYearForManAge(birthDateStr, period.startAge),
    endYear: getFortuneYearForManAge(birthDateStr, period.endAge),
    pillar: `${period.stem}${period.branch}`,
    element: period.stemElement,
    isCurrent: nowAge >= period.startAge && nowAge <= period.endAge,
  }));
}

export function buildDaeunDetailViewModel(
  saju: SajuData,
  daeUn: DaeUnPeriod[],
  startAge: number,
): DaeunDetailVM | null {
  const period = daeUn.find((p) => p.startAge === startAge);
  if (!period) return null;
  const analysis = analyzeDaeun(saju, toAnalysisPeriod(period));
  return {
    startAge: period.startAge,
    endAge: period.endAge,
    pillar: `${period.stem}${period.branch}`,
    harmonyScore: analysis.sajuRelation.harmonyScore,
    overall: analysis.fortune.overall,
    score: analysis.fortune.score,
    aspects: analysis.fortune.aspects,
    summary: analysis.interpretation.summary,
    opportunities: analysis.interpretation.opportunities,
    challenges: analysis.interpretation.challenges,
    advice: analysis.interpretation.advice,
  };
}

/**
 * 세운 스파크 — [startYear, endYear] 구간(보통 선택된 대운의 10년)을 그린다.
 * isCurrent는 실제 "올해"(nowYear)를 가리키므로, 구간이 올해를 포함하지 않으면
 * 어떤 막대도 isCurrent가 되지 않는다 — 흐름 탭이 "지금이 아닌 시점을 보는 중"임을
 * 스파크만으로도 드러내기 위함이다.
 */
export function buildSeyunSpark(
  saju: SajuData,
  startYear: number,
  endYear: number,
  nowYear: number,
): SeyunPointVM[] {
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  return years.map((year) => {
    const analysis = analyzeSeyun(saju, year);
    return {
      year,
      age: getManAgeForFortuneYear(saju.solarBirthDate, year),
      pillar: analysis.yearPillar,
      score: analysis.fortune.score,
      isCurrent: year === nowYear,
    };
  });
}

export function buildSeyunDetailViewModel(
  saju: SajuData,
  year: number,
): SeyunDetailVM {
  const analysis = analyzeSeyun(saju, year);
  return {
    year,
    age: getManAgeForFortuneYear(saju.solarBirthDate, year),
    pillar: analysis.yearPillar,
    overall: analysis.fortune.overall,
    score: analysis.fortune.score,
    aspects: analysis.fortune.keyAspects,
    summary: analysis.interpretation.summary,
    opportunities: analysis.interpretation.opportunities,
    challenges: analysis.interpretation.challenges,
    advice: analysis.interpretation.advice,
    favorableMonths: analysis.importantPeriods.favorableMonths,
    cautiousMonths: analysis.importantPeriods.cautiousMonths,
  };
}

export interface WolunDetailVM {
  year: number;
  month: number;
  pillar: string;
  element: WuXing;
  overall: string;
  score: number;
  aspects: {
    career: number;
    wealth: number;
    health: number;
    relationship: number;
  };
  balanceDescription: string;
  isFavorable: boolean;
  keywords: string[];
  opportunities: string[];
  cautions: string[];
  doList: string[];
  dontList: string[];
  direction: string;
  color: string;
  luckyDates: number[];
  unluckyDates: number[];
}

export function buildWolunDetailViewModel(
  saju: SajuData,
  year: number,
  month: number,
): WolunDetailVM {
  const analysis = analyzeWolun(saju, year, month);
  return {
    year,
    month,
    pillar: analysis.monthPillar,
    element: analysis.element,
    overall: analysis.fortune.overall,
    score: analysis.fortune.score,
    // 세운(analyzeSeyun)의 fortune.keyAspects와 달리 월운은 fortune 바로 아래 평평하게 있다.
    aspects: {
      career: analysis.fortune.career,
      wealth: analysis.fortune.wealth,
      health: analysis.fortune.health,
      relationship: analysis.fortune.relationship,
    },
    balanceDescription: analysis.elementBalance.description,
    isFavorable: analysis.elementBalance.isFavorable,
    keywords: analysis.characteristics.keywords,
    opportunities: analysis.characteristics.opportunities,
    cautions: analysis.characteristics.cautions,
    doList: analysis.advice.doList,
    dontList: analysis.advice.dontList,
    direction: analysis.advice.direction,
    color: analysis.advice.color,
    luckyDates: analysis.specialDays.luckyDates,
    unluckyDates: analysis.specialDays.unluckyDates,
  };
}

function buildFlowViewModel(
  saju: SajuData,
  daeUn: DaeUnPeriod[],
  nowYear: number,
): FlowVM {
  const nowAge = getManAgeForFortuneYear(saju.solarBirthDate, nowYear);
  const daeunOptions = buildDaeunOptions(daeUn, nowAge, saju.solarBirthDate);
  const current = daeunOptions.find((o) => o.isCurrent) ?? daeunOptions[0];
  const selectedDaeun = current
    ? buildDaeunDetailViewModel(saju, daeUn, current.startAge)
    : null;
  // 초기 스파크는 현재 대운의 10년 구간을 보여준다 — 대운이 없으면(초고령 등) 예전 기본값
  // (올해 -2 ~ +6)으로 폴백.
  const sparkStart = current?.startYear ?? nowYear - 2;
  const sparkEnd = current?.endYear ?? nowYear + 6;

  return {
    daeunOptions,
    selectedDaeun,
    seyunSpark: buildSeyunSpark(saju, sparkStart, sparkEnd, nowYear),
    selectedSeyun: buildSeyunDetailViewModel(saju, nowYear),
    nowYear,
  };
}

// ── 블록 3.5: 시기 조언 (결정 타입을 고를 때만 계산) ──────────────────────

/** 화면에서 선택 가능한 결정 타입 10종 — timing_advice.ts#DecisionType과 동일 순서. */
export const DECISION_TYPES: DecisionType[] = [
  "결혼",
  "이직",
  "창업",
  "투자",
  "이사",
  "수술",
  "계약",
  "학업",
  "출산",
  "여행",
];

export interface TimingOptimalVM {
  period: string;
  rating: string;
  score: number;
  reasons: string[];
  yongsinSupport: string;
  cautions: string[];
}

export interface TimingAvoidVM {
  period: string;
  reason: string;
  severity: string;
  alternatives: string[];
}

export interface TimingMonthVM {
  yearMonth: string;
  rating: string;
  score: number;
  briefAdvice: string;
}

export interface TimingOutlookVM {
  year: number;
  overallRating: string;
  overallScore: number;
  keyPeriods: string[];
  majorOpportunities: string[];
  majorChallenges: string[];
  daeunInfluence?: string;
}

export interface TimingVM {
  decisionType: DecisionType;
  optimalTiming: TimingOptimalVM[];
  timesToAvoid: TimingAvoidVM[];
  monthlyForecast: TimingMonthVM[];
  longTermOutlook: TimingOutlookVM[];
  summary: {
    bestYear: number;
    bestMonth: number;
    bestSeason: string;
    overallAdvice: string;
    urgency: string;
  };
}

/**
 * timing_advice.ts#analyzeTimingAdvice는 대운/세운 기반이라(daeun_analysis.ts 참고)
 * si_un/iljin_analysis 같은 근사 함정이 없다 — 결과를 얇게 VM으로만 옮긴다.
 * buildReadingViewModel에는 합류시키지 않는다 — 결정 타입을 고르기 전까지는 계산할 필요가 없다.
 */
export function buildTimingViewModel(
  saju: SajuData,
  decisionType: DecisionType,
  startDate: Date = new Date(),
): TimingVM {
  const advice = analyzeTimingAdvice(saju, decisionType, startDate, 3);
  return {
    decisionType,
    optimalTiming: advice.optimalTiming.map((o) => ({
      period: o.period,
      rating: o.rating,
      score: o.score,
      reasons: o.reasons,
      yongsinSupport: o.yongsinSupport,
      cautions: o.cautions,
    })),
    timesToAvoid: advice.timesToAvoid.map((t) => ({
      period: t.period,
      reason: t.reason,
      severity: t.severity,
      alternatives: t.alternatives,
    })),
    monthlyForecast: advice.monthlyForecast.map((m) => ({
      yearMonth: m.yearMonth,
      rating: m.rating,
      score: m.score,
      briefAdvice: m.briefAdvice,
    })),
    longTermOutlook: advice.longTermOutlook.map((y) => ({
      year: y.year,
      overallRating: y.overallRating,
      overallScore: y.overallScore,
      keyPeriods: y.keyPeriods,
      majorOpportunities: y.majorOpportunities,
      majorChallenges: y.majorChallenges,
      daeunInfluence: y.daeunInfluence,
    })),
    summary: advice.summary,
  };
}

// ── 블록 4: 직업 적성 ──────────────────────────────────────────────────

export interface CareerRecommendationVM {
  category: string;
  score: number;
  specificJobs: string[];
  reason: string;
  yongsinAlignment: string;
  strengthLabel: string;
}

export interface CareerVM {
  recommendations: CareerRecommendationVM[];
  jobsToAvoid: {
    category: string;
    reason: string;
    alternativeSuggestion: string;
  }[];
  elementalAffinity: {
    element: WuXing;
    affinity: number;
    strengthScore: number;
    yongsinScore: number;
    developedStatus: ElementStatus;
    careers: string[];
  }[];
  careerAdvice: {
    earlyCareer: string[];
    midCareer: string[];
    lateCareer: string[];
    entrepreneurship: string;
  };
  summary: string;
}

export function buildCareerViewModel(saju: SajuData): CareerVM {
  const result = recommendCareer(saju);
  return {
    recommendations: result.recommendations.slice(0, 5).map((r) => ({
      category: r.category,
      score: r.score,
      specificJobs: r.specificJobs,
      reason: r.reason,
      yongsinAlignment: r.yongsinAlignment,
      strengthLabel: r.strength,
    })),
    jobsToAvoid: result.jobsToAvoid,
    elementalAffinity: result.elementalAffinity,
    careerAdvice: result.careerAdvice,
    summary: result.summary,
  };
}

// ── 블록 6: 이름 오행 분석 ─────────────────────────────────────────────

export interface NameCharacterVM {
  char: string;
  element: WuXing;
  /** 이 글자의 오행을 한자(자원오행)로 정했는지 발음(초성)으로 정했는지 */
  elementSourceLabel: "자원오행" | "발음오행";
  /** elementSourceLabel이 자원오행이면서 부수 근거가 약할 때만 표시 */
  lowConfidenceElement: boolean;
  meaning?: string;
}

export interface NameStrokeAnalysisVM {
  heavenGround: number;
  personalGround: number;
  earthGround: number;
  outerGround: number;
  totalGround: number;
  fortune: string;
  /** 획수 중 하나라도 사전 미검증(보정 추정치)이면 true — 화면에 신뢰도 caveat용 */
  hasUnverifiedStroke: boolean;
}

export interface NameAnalysisVM {
  name: string;
  characters: NameCharacterVM[];
  wuxingBalanceLabel: string;
  isFavorable: boolean;
  harmonyScore: number;
  harmonyDescription: string;
  supplementElements: WuXing[];
  /** 한자를 입력했고 사전에 모두 있어야만 존재한다 — 없으면 오격을 아예 표시하지 않는다. */
  strokeAnalysis?: NameStrokeAnalysisVM;
  /** strokeAnalysis가 없을 때, 왜 없는지(한자 미입력/사전에 없음 등) 사용자에게 보여줄 문구 */
  strokeUnavailableReason?: string;
}

/**
 * jakmeong_analysis.ts#analyzeName은 오행 구성(초성오행, 훈민정음 오행 원리 기반)과
 * 사주와의 조화(부족한 오행 보완 여부)는 한자 없이도 근거가 있다. 반면 strokeAnalysis
 * (천격/인격/지격/외격/총격)는 실제 한자 획수가 있어야만 의미가 있는데, 예전엔 한자 입력
 * 경로 자체가 없어서 `getStrokeCount`가 한글 코드포인트를 해싱한 가짜 값을 냈다 —
 * 그래서 이전 버전은 strokeAnalysis를 통째로 숨겼다.
 *
 * 지금은 `hanja` 파라미터로 실제 한자를 받아 `analyzeName`에 그대로 넘긴다. `analyzeName`이
 * `data/naming_hanja_table.ts`에서 세 글자(성+이름 두 자) 모두를 찾았을 때만
 * `strokeAnalysis.available: true`를 주므로, 그 경우에만 오격을 노출한다 — 부분 성공은
 * 없다(하나라도 사전에 없으면 통째로 숨김, `available: false`의 `reason`을 그대로 보여준다).
 *
 * overall(종합 점수·등급)·pronunciation은 여전히 노출하지 않는다 — `overall.score`가
 * 아직 `pronunciation.easyToWrite`(한글 기반 가짜 획수로 판정)를 섞어 쓰고 있어서다.
 */
export function buildNameAnalysisVM(
  fullName: string,
  saju: SajuData,
  hanja?: string,
): NameAnalysisVM {
  const analysis = analyzeName(fullName, saju, hanja);
  const strokeAnalysis = analysis.strokeAnalysis;

  return {
    name: analysis.name,
    characters: analysis.characters.map((c) => ({
      char: c.char,
      element: c.element,
      elementSourceLabel: c.elementSource === "자원" ? "자원오행" : "발음오행",
      lowConfidenceElement:
        c.elementSource === "자원" && c.elementVerified === false,
      meaning: c.meaning,
    })),
    wuxingBalanceLabel: analysis.wuxingComposition.balance,
    isFavorable: analysis.wuxingComposition.isFavorable,
    harmonyScore: analysis.harmonyWithSaju.score,
    harmonyDescription: analysis.harmonyWithSaju.description,
    supplementElements: analysis.harmonyWithSaju.補益Elements,
    strokeAnalysis: strokeAnalysis.available
      ? {
          heavenGround: strokeAnalysis.heavenGround,
          personalGround: strokeAnalysis.personalGround,
          earthGround: strokeAnalysis.earthGround,
          outerGround: strokeAnalysis.outerGround,
          totalGround: strokeAnalysis.totalGround,
          fortune: strokeAnalysis.fortune,
          hasUnverifiedStroke: !strokeAnalysis.allVerified,
        }
      : undefined,
    strokeUnavailableReason: strokeAnalysis.available
      ? undefined
      : strokeAnalysis.reason,
  };
}

// ── 블록 5: 방위(풍수) ─────────────────────────────────────────────────

export interface PungsuDirectionVM {
  direction: string;
  detail: string;
  tags: string[];
}

export interface PungsuSpaceVM {
  spaceType: SpaceType;
  bestDirection: string;
  layout: string;
  colors: string[];
  furniture: string[];
  plants?: string[];
  avoid: string[];
}

export interface PungsuElementalDecorVM {
  element: WuXing;
  colors: string[];
  materials: string[];
  shapes: string[];
  items: string[];
}

export interface PungsuVM {
  luckyDirections: PungsuDirectionVM[];
  unluckyDirections: { direction: string; reason: string; avoid: string[] }[];
  spaceAdvice: PungsuSpaceVM[];
  yearlyDirections: {
    year: number;
    luckyDirection: string;
    unluckyDirection: string;
    description: string;
  };
  elementalDecor: PungsuElementalDecorVM[];
  generalAdvice: {
    priority: string[];
    warnings: string[];
    enhancements: string[];
  };
}

/** pungsu_advice.ts#analyzePungsu는 saju+year만으로 결정되는 순수 함수라 무겁지 않다 —
 * 그래도 방위 탭이 선택됐을 때만 계산해 다른 탭 렌더에 영향 주지 않는다. */
export function buildPungsuViewModel(
  saju: SajuData,
  currentYear: number,
): PungsuVM {
  const analysis = analyzePungsu(saju, currentYear);
  return {
    luckyDirections: analysis.luckyDirections.map((d) => ({
      direction: d.direction,
      detail: d.fortune,
      tags: d.uses,
    })),
    unluckyDirections: analysis.unluckyDirections,
    spaceAdvice: analysis.spaceAdvice,
    yearlyDirections: analysis.yearlyDirections,
    elementalDecor: analysis.elementalDecor,
    generalAdvice: analysis.generalAdvice,
  };
}

// ── 최상위 조립 ────────────────────────────────────────────────────────

export interface ReadingVM {
  myeongsik: MyeongsikVM;
  life: LifeVM;
  flow: FlowVM;
  career: CareerVM;
}

export interface BuildReadingViewModelParams {
  saju: SajuData;
  daeUn: DaeUnPeriod[];
  nowYear: number;
}

/**
 * 풀이 전체를 한 번에 조립한다. 대운·세운 선택지를 사용자가 바꿀 때는 이 함수 전체를
 * 다시 부르지 말고 buildDaeunDetailViewModel / buildSeyunDetailViewModel을 직접 호출한다 —
 * 이 함수는 인생 영역 분석 + recommendCareer + 세운 9개년 분석까지 포함해 비교적 무겁다.
 */
export function buildReadingViewModel({
  saju,
  daeUn,
  nowYear,
}: BuildReadingViewModelParams): ReadingVM {
  return {
    myeongsik: buildMyeongsikViewModel(saju),
    life: buildLifeViewModel(saju, daeUn),
    flow: buildFlowViewModel(saju, daeUn, nowYear),
    career: buildCareerViewModel(saju),
  };
}
