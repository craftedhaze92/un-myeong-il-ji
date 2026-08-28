/**
 * 사주 "풀이"(해석 서술) 프레젠테이션 레이어.
 *
 * 계산 로직을 새로 짜지 않고 src/lib의 기존 서술 엔진(analyzeFortune, interpretAllTenGods,
 * recommendCareer, analyzeDaeun, analyzeSeyun 등)을 조립해 화면에 바로 쓸 수 있는 VM으로 만든다.
 * view-model.ts와 같은 규약: 순수 함수, SajuData(+대운 목록) → 프레젠테이션 VM.
 */
import { getHeavenlyStemByKorean } from "@/data/heavenly_stems";
import { recommendCareer } from "@/lib/career_recommendation";
import type { ElementStatus } from "@/lib/element_distribution";
import type { DaeUnPeriod } from "@/lib/dae_un";
import {
  analyzeDaeun,
  type DaeunAnalysis,
  type DaeunPeriod,
} from "@/lib/daeun_analysis";
import { analyzeFortune } from "@/lib/fortune";
import { analyzeSeyun } from "@/lib/seyun_analysis";
import { getAllSinSalInfo } from "@/lib/sin_sal";
import { interpretAllTenGods } from "@/lib/ten_gods";
import { getManAgeForFortuneYear } from "@/utils/date";
import { selectYongSin, generateYongSinAdvice } from "@/lib/yong_sin";
import type {
  FortuneAnalysis,
  FortuneAnalysisType,
  HeavenlyStem,
  SajuData,
  TenGod,
  WuXing,
} from "@/types";

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

const INTENSITY_LABEL: Record<string, string> = {
  very_strong: "매우 강함",
  strong: "강함",
  moderate: "보통",
  weak: "약함",
  very_weak: "매우 약함",
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
}

export interface MyeongsikVM {
  gyeokGuk?: { name: string; hanja: string; description: string };
  dayMasterStrength?: { levelLabel: string; score: number; analysis: string };
  wolRyeong?: { isDeukRyeong: boolean; reason: string; strengthLabel: string };
  jiJangGan: JiJangGanPillarVM[];
  branchRelations?: BranchRelationsVM;
  yongSin?: {
    primary: WuXing;
    secondary?: WuXing;
    reasoning: string;
    advice: string[];
  };
  sinsal: SinSalDetailVM[];
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
  }));
}

export function buildMyeongsikViewModel(saju: SajuData): MyeongsikVM {
  const yongSinAnalysis = selectYongSin(saju);

  return {
    gyeokGuk: saju.gyeokGuk
      ? {
          name: saju.gyeokGuk.name,
          hanja: saju.gyeokGuk.hanja,
          description: saju.gyeokGuk.description,
        }
      : undefined,
    dayMasterStrength: saju.dayMasterStrength
      ? {
          levelLabel:
            STRENGTH_LEVEL_LABEL[saju.dayMasterStrength.level] ??
            saju.dayMasterStrength.level,
          score: saju.dayMasterStrength.score,
          analysis: saju.dayMasterStrength.analysis,
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
        }
      : undefined,
    sinsal: buildSinsalDetails(saju),
  };
}

// ── 블록 2: 총평·성격·재물·건강·애정 ─────────────────────────────────────

export interface FortuneBlockVM {
  type: FortuneAnalysisType;
  label: string;
  score: number;
  summary: string;
  positive: string[];
  negative: string[];
  advice: string[];
  luckyColors: string[];
  luckyDirections: string[];
  luckyNumbers: number[];
}

export interface PersonalityAxisVM {
  tenGod: TenGod;
  count: number;
  intensityLabel: string;
  strengths: string[];
  weaknesses: string[];
  advice: string[];
}

export interface LifeVM {
  fortunes: FortuneBlockVM[];
  personality: PersonalityAxisVM[];
}

const FORTUNE_LABEL: Record<FortuneAnalysisType, string> = {
  general: "총평",
  career: "직업",
  wealth: "재물",
  health: "건강",
  love: "애정",
};

function buildFortuneBlock(
  saju: SajuData,
  type: FortuneAnalysisType,
): FortuneBlockVM {
  const result: FortuneAnalysis = analyzeFortune(saju, type);
  return {
    type,
    label: FORTUNE_LABEL[type],
    score: result.score,
    summary: result.summary,
    positive: result.details.positive,
    negative: result.details.negative,
    advice: result.details.advice,
    luckyColors: result.luckyElements?.colors ?? [],
    luckyDirections: result.luckyElements?.directions ?? [],
    luckyNumbers: result.luckyElements?.numbers ?? [],
  };
}

export function buildLifeViewModel(saju: SajuData): LifeVM {
  // 'career'는 career_recommendation.ts 기반 CareerVM(블록 4)이 이미 더 상세히 다루므로 여기서는 뺀다.
  const fortunes = (["general", "wealth", "health", "love"] as const).map(
    (type) => buildFortuneBlock(saju, type),
  );

  const personality: PersonalityAxisVM[] = saju.tenGodsDistribution
    ? interpretAllTenGods(saju.tenGodsDistribution)
        .filter((t) => t.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
        .map((t) => ({
          tenGod: t.tenGod,
          count: Math.round(t.count * 10) / 10,
          intensityLabel: INTENSITY_LABEL[t.intensity] ?? t.intensity,
          strengths: t.strengths,
          weaknesses: t.weaknesses,
          advice: t.advice,
        }))
    : [];

  return { fortunes, personality };
}

// ── 블록 3: 대운·세운 흐름 ─────────────────────────────────────────────

export interface DaeunOptionVM {
  startAge: number;
  endAge: number;
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
): DaeunOptionVM[] {
  return daeUn.slice(0, 9).map((period) => ({
    startAge: period.startAge,
    endAge: period.endAge,
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

export function buildSeyunSpark(
  saju: SajuData,
  nowYear: number,
  pastYears: number = 2,
  futureYears: number = 6,
): SeyunPointVM[] {
  const years: number[] = [];
  for (let y = nowYear - pastYears; y <= nowYear + futureYears; y++)
    years.push(y);

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

function buildFlowViewModel(
  saju: SajuData,
  daeUn: DaeUnPeriod[],
  nowYear: number,
): FlowVM {
  const nowAge = getManAgeForFortuneYear(saju.solarBirthDate, nowYear);
  const daeunOptions = buildDaeunOptions(daeUn, nowAge);
  const current = daeunOptions.find((o) => o.isCurrent) ?? daeunOptions[0];
  const selectedDaeun = current
    ? buildDaeunDetailViewModel(saju, daeUn, current.startAge)
    : null;

  return {
    daeunOptions,
    selectedDaeun,
    seyunSpark: buildSeyunSpark(saju, nowYear),
    selectedSeyun: buildSeyunDetailViewModel(saju, nowYear),
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
 * 이 함수는 analyzeFortune 4회 + recommendCareer + 세운 9개년 분석까지 포함해 비교적 무겁다.
 */
export function buildReadingViewModel({
  saju,
  daeUn,
  nowYear,
}: BuildReadingViewModelParams): ReadingVM {
  return {
    myeongsik: buildMyeongsikViewModel(saju),
    life: buildLifeViewModel(saju),
    flow: buildFlowViewModel(saju, daeUn, nowYear),
    career: buildCareerViewModel(saju),
  };
}
