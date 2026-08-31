/**
 * 평생 총평과 생애 구간 해석.
 *
 * 명식·대운을 새로 계산하지 않고 calculateSaju/calculateDaeUn 결과와 기존 해석기를
 * 조합한다. 인생 탭과 흐름 탭이 같은 대운을 두고 서로 다른 말을 하지 않게 하기 위함이다.
 */
import { getIljuInterpretation } from "../data/ilju_interpretations";
import { analyzeWuXingBalance } from "../data/wuxing";
import type { DaeUnPeriod } from "./dae_un";
import {
  analyzeDaeun,
  type DaeunAnalysis,
  type DaeunPeriod,
} from "./daeun_analysis";
import { analyzeFortune } from "./fortune";
import { josa } from "./korean";
import { interpretAllTenGods } from "./ten_gods";
import type { SajuData, TenGod } from "../types";

export type LifetimeOverall = DaeunAnalysis["fortune"]["overall"];

export interface LifetimeOverview {
  score: number;
  paragraphs: string[];
  basis: string[];
  strengths: string[];
  cautions: string[];
  advice: string[];
}

export interface LifetimeStage {
  id: "early" | "middle" | "late";
  label: string;
  ageLabel: string;
  overall: LifetimeOverall;
  score: number;
  summary: string;
  opportunity: string;
  caution: string;
  basis: string[];
}

export interface LifetimeHighlight {
  kind: "support" | "pace";
  title: string;
  ageLabel: string;
  pillar: string;
  overall: LifetimeOverall;
  score: number;
  summary: string;
  basis: string[];
}

export interface LifetimeAnalysis {
  overview: LifetimeOverview;
  stages: LifetimeStage[];
  highlights: LifetimeHighlight[];
  /** 시간 미상일 때 대운 시작 시각을 정오 기준으로 본다는 안내. */
  precisionNote?: string;
}

const STRENGTH_LABEL: Record<
  NonNullable<SajuData["dayMasterStrength"]>["level"],
  string
> = {
  very_strong: "매우 신강",
  strong: "신강",
  medium: "중화",
  weak: "신약",
  very_weak: "매우 신약",
};

const YONGSIN_METHOD_LABEL: Record<
  NonNullable<NonNullable<SajuData["yongSin"]>["method"]>,
  string
> = {
  jeonwang: "전왕",
  johu: "조후",
  eokbu: "억부",
  tonggwan: "통관",
};

const DOMAIN_LABEL: Record<keyof DaeunAnalysis["fortune"]["aspects"], string> =
  {
    career: "일과 역할",
    wealth: "재물과 현실 감각",
    health: "생활 리듬과 회복",
    relationship: "관계와 협력",
  };

const STAGE_DEFINITIONS = [
  { id: "early", label: "초년", ageLabel: "0–20세", startAge: 0, endAge: 20 },
  {
    id: "middle",
    label: "중년",
    ageLabel: "21–50세",
    startAge: 21,
    endAge: 50,
  },
  {
    id: "late",
    label: "말년",
    ageLabel: "51세 이후",
    startAge: 51,
    endAge: null,
  },
] as const;

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

function overallFromScore(score: number): LifetimeOverall {
  if (score >= 80) return "대길";
  if (score >= 65) return "길";
  if (score >= 45) return "평";
  if (score >= 30) return "흉";
  return "대흉";
}

function unique(items: string[], limit: number): string[] {
  return [...new Set(items.filter(Boolean))].slice(0, limit);
}

function topTenGods(
  saju: SajuData,
): Array<{ tenGod: TenGod; count: number; strength?: string }> {
  if (!saju.tenGodsDistribution) return [];
  return interpretAllTenGods(saju.tenGodsDistribution)
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2)
    .map((item) => ({
      tenGod: item.tenGod,
      count: item.count,
      strength: item.strengths[0],
    }));
}

function buildOverview(saju: SajuData): LifetimeOverview {
  const generalFortune = analyzeFortune(saju, "general");
  const ilju = getIljuInterpretation(saju.day.stem, saju.day.branch);
  const balance = analyzeWuXingBalance(saju.wuxingCount);
  const tenGods = topTenGods(saju);
  const strength = saju.dayMasterStrength;
  const yongSin = saju.yongSin;

  const firstParagraph = [
    ilju.summary,
    strength
      ? `${josa(STRENGTH_LABEL[strength.level], "으로/로")} 판정된 일간은 ${strength.analysis}`
      : "일간의 성향은 전체 오행의 배치와 함께 살펴보는 것이 좋습니다.",
  ].join(" ");

  const tenGodText = tenGods.length
    ? `${tenGods.map((item) => item.tenGod).join("·")}의 비중이 두드러집니다. ${tenGods
        .map((item) => item.strength)
        .filter(Boolean)
        .join(" 또한 ")}`
    : "특정 십성 하나보다 여러 역할을 상황에 맞게 조율하는 성향이 나타납니다.";
  const secondParagraph = `${tenGodText} 이 장점은 한 가지 방식만 고집하기보다 맡은 역할과 환경에 맞춰 사용할 때 더 안정적으로 드러날 가능성이 큽니다.`;

  let balanceText =
    "오행이 비교적 고르게 놓여 있어 한쪽 성향에만 기대지 않는 편입니다.";
  if (!balance.balanced) {
    const strongText = balance.strong.length
      ? `${balance.strong.join("·")} 기운은 충분히 발달했고`
      : "강하게 치우친 오행은 적고";
    const weakText = balance.weak.length
      ? `${balance.weak.join("·")} 기운은 의식적으로 보완할 필요가 있습니다`
      : "뚜렷하게 비어 있는 오행은 적습니다";
    balanceText = `${strongText}, ${weakText}.`;
  }
  const yongSinText = yongSin
    ? `${YONGSIN_METHOD_LABEL[yongSin.method ?? "eokbu"]} 관점에서 ${yongSin.primaryYongSin} 기운을 보완축으로 삼으면 선택의 균형을 잡는 데 도움이 됩니다.`
    : "부족한 부분을 생활 습관과 환경으로 보완하는 접근이 도움이 됩니다.";
  const thirdParagraph = `${balanceText} ${yongSinText} 이는 미래를 단정하는 결론이라기보다, 반복되기 쉬운 선택 패턴을 점검하는 기준으로 활용하는 편이 좋습니다.`;

  const basis = unique(
    [
      `${ilju.name} (${ilju.hanja})`,
      strength ? `일간 강약 · ${STRENGTH_LABEL[strength.level]}` : "",
      saju.gyeokGuk?.name ? `격국 · ${saju.gyeokGuk.name}` : "",
      yongSin ? `용신 · ${yongSin.primaryYongSin}` : "",
      tenGods.length
        ? `상위 십성 · ${tenGods.map((item) => item.tenGod).join("·")}`
        : "",
    ],
    5,
  );

  return {
    score: generalFortune.score,
    paragraphs: [firstParagraph, secondParagraph, thirdParagraph],
    basis,
    strengths: unique(
      [...ilju.strengths, ...generalFortune.details.positive],
      4,
    ),
    cautions: unique([...ilju.cautions, ...generalFortune.details.negative], 4),
    advice: unique(generalFortune.details.advice, 4),
  };
}

interface AnalyzedPeriod {
  period: DaeUnPeriod;
  analysis: DaeunAnalysis;
}

function overlapYears(
  period: DaeUnPeriod,
  startAge: number,
  endAge: number,
): number {
  const start = Math.max(period.startAge, startAge);
  const end = Math.min(period.endAge, endAge);
  return Math.max(0, end - start + 1);
}

function weightedAverage(
  periods: AnalyzedPeriod[],
  startAge: number,
  endAge: number,
  pick: (analysis: DaeunAnalysis) => number,
  fallback: number,
): number {
  let total = 0;
  let weight = 0;
  for (const item of periods) {
    const years = overlapYears(item.period, startAge, endAge);
    if (!years) continue;
    total += pick(item.analysis) * years;
    weight += years;
  }
  return Math.round(weight ? total / weight : fallback);
}

function buildStages(
  periods: AnalyzedPeriod[],
  fallbackScore: number,
): LifetimeStage[] {
  const visibleEndAge = periods.at(-1)?.period.endAge ?? 90;

  return STAGE_DEFINITIONS.map((definition) => {
    const endAge = definition.endAge ?? visibleEndAge;
    const relevant = periods.filter(
      ({ period }) => overlapYears(period, definition.startAge, endAge) > 0,
    );
    const score = weightedAverage(
      relevant,
      definition.startAge,
      endAge,
      (analysis) => analysis.fortune.score,
      fallbackScore,
    );
    const aspectScores = (
      Object.keys(DOMAIN_LABEL) as Array<keyof typeof DOMAIN_LABEL>
    ).map((domain) => ({
      domain,
      score: weightedAverage(
        relevant,
        definition.startAge,
        endAge,
        (analysis) => analysis.fortune.aspects[domain],
        score,
      ),
    }));
    const strongest = [...aspectScores].sort((a, b) => b.score - a.score)[0]!;
    const weakest = [...aspectScores].sort((a, b) => a.score - b.score)[0]!;
    const pillars = relevant.map(
      ({ period }) => `${period.stem}${period.branch}`,
    );
    const hasPreDaeunGap =
      definition.id === "early" &&
      periods.length > 0 &&
      periods[0]!.period.startAge > definition.startAge;

    return {
      id: definition.id,
      label: definition.label,
      ageLabel: definition.ageLabel,
      overall: overallFromScore(score),
      score,
      summary: `${definition.label}의 큰 흐름은 ${overallFromScore(score)}에 가깝습니다. ${DOMAIN_LABEL[strongest.domain]}에서 힘을 쓰기 쉬운 반면, 시기마다 속도와 우선순위를 조절하는 태도가 중요합니다.`,
      opportunity: `${DOMAIN_LABEL[strongest.domain]}의 평균 흐름이 상대적으로 높아, 이 영역의 경험과 기반을 쌓는 선택이 유리할 수 있습니다.`,
      caution: `${josa(DOMAIN_LABEL[weakest.domain], "은/는")} 다른 영역보다 변동을 세심하게 살피고 무리한 결정을 줄이는 편이 좋습니다.`,
      basis: unique(
        [
          pillars.length ? `대운 · ${pillars.join(" · ")}` : "원국 중심 해석",
          hasPreDaeunGap ? "첫 대운 이전은 원국 중심" : "",
        ],
        3,
      ),
    };
  });
}

function periodBasis(item: AnalyzedPeriod, positive: boolean): string[] {
  const sources = positive
    ? item.analysis.wuxingAnalysis.favorable
    : item.analysis.wuxingAnalysis.unfavorable;
  return unique(
    [
      ...sources,
      item.analysis.wuxingAnalysis.balanceChange,
      `대운 평가 · ${item.analysis.fortune.overall} ${item.analysis.fortune.score}점`,
    ],
    3,
  );
}

function buildHighlights(periods: AnalyzedPeriod[]): LifetimeHighlight[] {
  if (!periods.length) return [];

  // strict 비교를 사용해 동점이면 입력 순서상 더 이른 대운을 유지한다.
  const strongest = periods.reduce((best, item) =>
    item.analysis.fortune.score > best.analysis.fortune.score ? item : best,
  );
  const weakest = periods.reduce((worst, item) =>
    item.analysis.fortune.score < worst.analysis.fortune.score ? item : worst,
  );

  return [
    {
      kind: "support",
      title: "힘이 잘 모이는 시기",
      ageLabel: `${strongest.period.startAge}–${strongest.period.endAge}세`,
      pillar: `${strongest.period.stem}${strongest.period.branch}`,
      overall: strongest.analysis.fortune.overall,
      score: strongest.analysis.fortune.score,
      summary:
        "명식의 보완 방향과 대운의 기운이 비교적 잘 맞물리는 구간입니다. 준비해 온 일을 확장하되 성과를 확정된 것으로 여기기보다 선택지를 넓히는 시기로 활용해 보세요.",
      basis: periodBasis(strongest, true),
    },
    {
      kind: "pace",
      title: "속도를 조절할 시기",
      ageLabel: `${weakest.period.startAge}–${weakest.period.endAge}세`,
      pillar: `${weakest.period.stem}${weakest.period.branch}`,
      overall: weakest.analysis.fortune.overall,
      score: weakest.analysis.fortune.score,
      summary:
        "다른 대운보다 보완이 필요한 요소가 두드러지는 구간입니다. 결과를 서두르기보다 자원과 관계, 생활 리듬을 점검하며 손실을 줄이는 선택이 도움이 될 수 있습니다.",
      basis: periodBasis(weakest, false),
    },
  ];
}

/** 같은 입력이면 언제나 같은 평생 총평과 생애 흐름을 반환한다. */
export function analyzeLifetime(
  saju: SajuData,
  daeUn: DaeUnPeriod[],
): LifetimeAnalysis {
  // 흐름 탭이 노출하는 범위와 같게 맞춰 극단적인 100세 이후 예측을 강조하지 않는다.
  const analyzedPeriods = daeUn.slice(0, 9).map((period) => ({
    period,
    analysis: analyzeDaeun(saju, toAnalysisPeriod(period)),
  }));
  const overview = buildOverview(saju);

  return {
    overview,
    stages: buildStages(analyzedPeriods, overview.score),
    highlights: buildHighlights(analyzedPeriods),
    precisionNote: saju.unknownHour
      ? "태어난 시간을 몰라 대운 시작 나이는 정오 기준의 근사치입니다. 시주에 기대는 말년 해석은 포함하지 않았습니다."
      : undefined,
  };
}
