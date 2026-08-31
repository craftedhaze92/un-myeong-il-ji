/**
 * 인생 탭의 재물·건강·애정·두드러진 십성 해석.
 *
 * 고전은 단일 십성의 개수만으로 결론내리지 않고 일간 강약과 전체 배치를 함께 본다.
 * - 子平真詮 論用神/論財/論食神/論傷官: 배치와 강약, 식상생재 등의 조합
 * - 滴天髓 六親論: 배우자성도 한 별에 고정하지 말고 전체 형세에 따라 활법으로 판단
 *
 * 여기의 점수는 미래 사건의 확률이 아니라 화면에서 서로 다른 자원과 부담을 비교하기
 * 위한 제품 지표다. 건강 해석은 질병·장기 진단을 하지 않고 생활 리듬만 다룬다.
 */
import { TEN_GOD_LIFE_PROFILES } from "../data/ten_god_life_profiles";
import { analyzeWuXingBalance } from "../data/wuxing";
import { TEN_GODS_DATA } from "./ten_gods";
import type { SajuData, TenGod } from "../types";

export type LifeAreaType = "wealth" | "health" | "love";

export interface LifeAreaAnalysis {
  type: LifeAreaType;
  label: string;
  score: number;
  scoreLabel: string;
  summary: string;
  basis: string[];
  strengths: string[];
  cautions: string[];
  actions: string[];
  contextNote?: string;
}

export interface DominantTenGodAnalysis {
  tenGod: TenGod;
  hanja: string;
  count: number;
  sharePct: number;
  intensityLabel: string;
  summary: string;
  strengths: string[];
  cautions: string[];
  actions: string[];
}

type TenGodGroup = "self" | "output" | "wealth" | "power" | "resource";

const TEN_GOD_ORDER: readonly TenGod[] = [
  "비견",
  "겁재",
  "식신",
  "상관",
  "편재",
  "정재",
  "편관",
  "정관",
  "편인",
  "정인",
];

const GROUP_TEN_GODS: Record<TenGodGroup, readonly TenGod[]> = {
  self: ["비견", "겁재"],
  output: ["식신", "상관"],
  wealth: ["편재", "정재"],
  power: ["편관", "정관"],
  resource: ["편인", "정인"],
};

const GROUP_LABEL: Record<TenGodGroup, string> = {
  self: "비겁",
  output: "식상",
  wealth: "재성",
  power: "관성",
  resource: "인성",
};

const PRESENT_SHARE = 0.1;
const STRONG_SHARE = 0.25;
const CONCENTRATED_SHARE = 0.45;

interface DistributionProfile {
  total: number;
  tenGodShares: Record<TenGod, number>;
  groupShares: Record<TenGodGroup, number>;
}

function clampScore(score: number): number {
  return Math.max(35, Math.min(90, Math.round(score)));
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function atLeast(share: number, threshold: number): boolean {
  return share + Number.EPSILON * 10 >= threshold;
}

function buildDistributionProfile(saju: SajuData): DistributionProfile {
  const distribution = saju.tenGodsDistribution;
  const total = distribution
    ? Object.values(distribution).reduce((sum, value) => sum + value, 0)
    : 0;
  const tenGodShares = Object.fromEntries(
    TEN_GOD_ORDER.map((tenGod) => [
      tenGod,
      total > 0 ? (distribution?.[tenGod] ?? 0) / total : 0,
    ]),
  ) as Record<TenGod, number>;
  const groupShares = Object.fromEntries(
    (Object.keys(GROUP_TEN_GODS) as TenGodGroup[]).map((group) => [
      group,
      GROUP_TEN_GODS[group].reduce(
        (sum, tenGod) => sum + tenGodShares[tenGod],
        0,
      ),
    ]),
  ) as Record<TenGodGroup, number>;

  return { total, tenGodShares, groupShares };
}

function groupBasis(groups: TenGodGroup[]): string[] {
  return groups.map((group) => `${GROUP_LABEL[group]}`);
}

function strengthLabel(saju: SajuData): string {
  const labels: Record<
    NonNullable<SajuData["dayMasterStrength"]>["level"],
    string
  > = {
    very_strong: "매우 신강",
    strong: "신강",
    medium: "중화",
    weak: "신약",
    very_weak: "매우 신약",
  };
  return saju.dayMasterStrength
    ? labels[saju.dayMasterStrength.level]
    : "강약 정보 없음";
}

function analyzeWealth(
  saju: SajuData,
  profile: DistributionProfile,
): LifeAreaAnalysis {
  if (profile.total <= 0) {
    return {
      type: "wealth",
      label: "재물",
      score: 55,
      scoreLabel: "재물 운용 지수",
      summary:
        "십성 분포 정보가 없어 재물 성향을 특정하기보다 실제 수입·지출 기록을 기준으로 살펴보는 편이 좋습니다.",
      basis: ["십성 분포 · 정보 없음", `일간 · ${strengthLabel(saju)}`],
      strengths: [
        "현재의 수입 구조와 반복 지출을 확인하면 자신에게 맞는 관리 방식을 찾을 수 있습니다.",
      ],
      cautions: [
        "명식 정보가 부족한 상태에서 재물의 많고 적음이나 투자 성향을 단정하지 않습니다.",
      ],
      actions: [
        "한 달간 수입·고정비·변동비를 기록해 실제 재무 흐름부터 확인하세요.",
        "명리 해석만으로 투자·대출·계약을 결정하지 말고 실제 재무 조건을 별도로 검토하세요.",
      ],
    };
  }

  const { groupShares, tenGodShares } = profile;
  const wealth = groupShares.wealth;
  const output = groupShares.output;
  const self = groupShares.self;
  const direct = tenGodShares.정재;
  const indirect = tenGodShares.편재;
  const weakDayMaster =
    saju.dayMasterStrength?.level === "weak" ||
    saju.dayMasterStrength?.level === "very_weak";
  const hasOutputFlow =
    atLeast(output, PRESENT_SHARE) && atLeast(wealth, PRESENT_SHARE);
  const hasMixedWealth = direct > 0 && indirect > 0;
  const hasHeavyLoad = weakDayMaster && atLeast(wealth, STRONG_SHARE);
  const hasPeerPressure =
    atLeast(self, STRONG_SHARE) && atLeast(wealth, PRESENT_SHARE);

  let score = 60;
  if (atLeast(wealth, PRESENT_SHARE) && !atLeast(wealth, 0.35)) score += 12;
  else if (atLeast(wealth, 0.35)) score += 6;
  if (hasOutputFlow) score += 10;
  if (hasMixedWealth) score += 5;
  if (hasHeavyLoad) score -= 12;
  if (hasPeerPressure) score -= 10;

  let summary =
    "재물 자체보다 다른 역량을 현실적인 수입 구조로 연결하는 과정이 중요합니다.";
  if (direct >= indirect + 0.08) {
    summary =
      "예측 가능한 수입과 지출 기준을 세워 재정을 안정적으로 운영하는 성향이 두드러집니다.";
  } else if (indirect >= direct + 0.08) {
    summary =
      "사람과 정보의 흐름에서 기회를 찾고 여러 수입 가능성을 비교하는 성향이 두드러집니다.";
  } else if (atLeast(wealth, PRESENT_SHARE)) {
    summary =
      "안정적인 관리와 유동적인 기회 탐색을 상황에 맞게 함께 쓰는 재물 성향입니다.";
  }

  const strengths = unique([
    atLeast(direct, PRESENT_SHARE)
      ? "정재의 비중이 있어 예산·저축·반복 수입처럼 관리 가능한 구조를 만드는 데 강점이 있습니다."
      : "",
    atLeast(indirect, PRESENT_SHARE)
      ? "편재의 비중이 있어 관계와 정보 속에서 새로운 기회를 발견하는 감각을 활용할 수 있습니다."
      : "",
    hasOutputFlow
      ? "식상과 재성이 함께 있어 아이디어·기술·표현을 실제 가치로 연결하는 식상생재 흐름이 보입니다."
      : "",
    !atLeast(wealth, PRESENT_SHARE)
      ? "재성의 비중이 낮은 대신 전문성이나 협업 역량을 먼저 키운 뒤 수입 구조로 전환하는 접근이 어울립니다."
      : "",
  ]);
  const cautions = unique([
    hasHeavyLoad
      ? "신약한 일간에 재성의 비중이 높아 기회가 늘수록 책임과 관리 부담도 함께 커질 수 있습니다."
      : "",
    hasPeerPressure
      ? "비겁과 재성이 함께 강해 공동 자금·동업·경쟁 상황에서는 몫과 책임의 경계를 분명히 할 필요가 있습니다."
      : "",
    atLeast(wealth, CONCENTRATED_SHARE)
      ? "재성에 관심이 집중되면 장기 가치보다 당장의 성과와 손익에 판단이 치우칠 수 있습니다."
      : "",
    !atLeast(wealth, PRESENT_SHARE)
      ? "재성의 비중이 낮아도 재물의 부재로 단정하기보다 돈을 관리하는 기술을 의식적으로 보완해야 합니다."
      : "",
  ]);

  return {
    type: "wealth",
    label: "재물",
    score: clampScore(score),
    scoreLabel: "재물 운용 지수",
    summary,
    basis: [
      ...groupBasis(["wealth", "output", "self"]),
      `일간 · ${strengthLabel(saju)}`,
      ...(hasOutputFlow ? ["조합 · 식상생재"] : []),
    ],
    strengths:
      strengths.length > 0
        ? strengths
        : [
            "수입과 지출의 흐름을 기록하면 자신에게 맞는 재물 운용 방식을 찾기 쉽습니다.",
          ],
    cautions:
      cautions.length > 0
        ? cautions
        : [
            "좋은 기회처럼 보여도 생활 자금과 감당 가능한 손실 범위를 먼저 확인하는 편이 안전합니다.",
          ],
    actions: unique([
      direct >= indirect
        ? "고정비·저축·가용 자금을 분리해 반복 가능한 관리 체계를 만드세요."
        : "새 기회마다 투입 한도·검토 기한·중단 조건을 먼저 적으세요.",
      hasOutputFlow
        ? "잘하는 일을 작은 상품이나 서비스로 검증해 가치 전환 과정을 확인하세요."
        : "돈의 결과보다 어떤 역량과 관계가 수입으로 이어졌는지 함께 기록하세요.",
      "명리 해석만으로 투자·대출·계약을 결정하지 말고 실제 재무 조건을 별도로 검토하세요.",
    ]),
  };
}

function analyzeHealth(
  saju: SajuData,
  profile: DistributionProfile,
): LifeAreaAnalysis {
  const balance = analyzeWuXingBalance(saju.wuxingCount);
  const level = saju.dayMasterStrength?.level;
  const support = profile.groupShares.self + profile.groupShares.resource;
  const drain =
    profile.groupShares.output +
    profile.groupShares.wealth +
    profile.groupShares.power;
  const extreme = level === "very_strong" || level === "very_weak";
  const weak = level === "weak" || level === "very_weak";
  const heavyDrain = weak && atLeast(drain, 0.7);
  const heavySupport =
    (level === "strong" || level === "very_strong") && atLeast(support, 0.7);
  const imbalanceCount = balance.strong.length + balance.weak.length;

  let score = 70;
  if (level === "medium") score += 10;
  else if (level === "strong" || level === "weak") score += 3;
  else if (extreme) score -= 10;
  score += balance.balanced ? 8 : -Math.min(16, imbalanceCount * 4);
  if (heavyDrain) score -= 8;
  if (heavySupport) score -= 5;

  let summary =
    "일간의 강약과 오행 배치를 함께 보면 활동과 회복의 속도를 의식적으로 조절하는 일이 중요합니다.";
  if (level === "medium" && balance.balanced) {
    summary =
      "활동과 회복을 오가는 기본 리듬이 비교적 고르게 잡혀 있어 꾸준함을 유지하기 좋은 편입니다.";
  } else if (weak) {
    summary =
      "에너지를 밖으로 쓰는 일정이 길어질수록 회복 시간을 먼저 확보해야 생활 리듬을 지키기 쉽습니다.";
  } else if (level === "strong" || level === "very_strong") {
    summary =
      "버티고 밀어붙이는 힘은 좋지만 긴장이 누적되기 전에 의도적으로 속도를 낮추는 습관이 필요합니다.";
  }

  const strengths = unique([
    level === "medium"
      ? "일간이 중화에 가까워 활동과 휴식 사이의 전환을 비교적 유연하게 가져갈 수 있습니다."
      : "",
    atLeast(support, PRESENT_SHARE * 2)
      ? "인성·비겁의 생조 자원이 있어 학습, 도움 요청, 익숙한 루틴을 회복 수단으로 활용하기 좋습니다."
      : "",
    balance.balanced
      ? "오행이 한쪽에 크게 치우치지 않아 특정 생활 방식만 고집하지 않는 편입니다."
      : "",
  ]);
  const cautions = unique([
    extreme
      ? "일간 강약이 한쪽 끝에 가까워 과도한 활동이나 정체가 반복되지 않는지 살펴볼 필요가 있습니다."
      : "",
    heavyDrain
      ? "식상·재성·관성의 소모 비중이 높아 표현, 성과, 책임이 한꺼번에 몰리면 회복이 뒤처질 수 있습니다."
      : "",
    heavySupport
      ? "생조 자원이 많고 일간도 강해 익숙한 방식에 머물거나 움직임을 미루는 패턴이 생길 수 있습니다."
      : "",
    !balance.balanced
      ? `오행에서 ${[...balance.strong, ...balance.weak].join("·")}의 편차가 보여 생활 루틴을 한 방향에만 치우치지 않게 조절하는 편이 좋습니다.`
      : "",
  ]);

  return {
    type: "health",
    label: "건강",
    score: clampScore(score),
    scoreLabel: "생활 균형 지수",
    summary,
    basis: [
      `일간 · ${strengthLabel(saju)}`,
      balance.balanced
        ? "오행 · 균형"
        : `오행 편차 · ${[...balance.strong, ...balance.weak].join("·")}`,
    ],
    strengths:
      strengths.length > 0
        ? strengths
        : [
            "일정과 컨디션을 함께 기록하면 자신에게 맞는 활동·회복 주기를 찾는 데 도움이 됩니다.",
          ],
    cautions:
      cautions.length > 0
        ? cautions
        : [
            "균형이 좋아도 일정이 몰리는 시기에는 수면과 휴식 시간을 뒤로 미루지 않는 편이 좋습니다.",
          ],
    actions: [
      weak
        ? "중요 일정 사이에 회복 시간을 먼저 배치하고 한 번에 맡는 역할의 수를 제한하세요."
        : "집중 시간이 길어질수록 짧은 휴식과 가벼운 움직임을 일정에 고정하세요.",
      "수면·활동·기분을 짧게 기록해 반복되는 과부하 신호를 실제 생활 자료로 확인하세요.",
      "이 내용은 명리적 생활 경향이며 의학적 진단이 아닙니다. 증상이나 우려가 있으면 의료진과 상담하세요.",
    ],
    contextNote:
      "건강 섹션은 질병이나 특정 장기의 상태를 예측하지 않고 생활 리듬과 회복 부담만 설명합니다.",
  };
}

const RELATIONSHIP_PROFILE: Record<
  TenGodGroup,
  { mode: string; strength: string; caution: string; action: string }
> = {
  self: {
    mode: "각자의 자율성과 동등함을 중시하는 방식",
    strength:
      "비겁은 서로를 동등한 주체로 대하고 각자의 자율성을 존중하는 힘으로 나타납니다.",
    caution:
      "자율성이나 경쟁심이 앞서면 양보가 곧 손해처럼 느껴질 수 있습니다.",
    action: "각자 결정할 영역과 함께 합의할 영역을 구분하세요.",
  },
  output: {
    mode: "감정과 생각을 적극적으로 표현하는 방식",
    strength:
      "식상은 감정과 생각을 말·행동·경험으로 표현해 관계에 생동감을 더합니다.",
    caution: "표현이 앞서면 상대의 반응을 듣기 전에 결론을 내릴 수 있습니다.",
    action: "표현한 뒤에는 상대가 어떻게 받아들였는지 한 번 더 확인하세요.",
  },
  wealth: {
    mode: "시간과 자원을 나누며 현실적으로 돌보는 방식",
    strength:
      "재성은 시간과 자원을 실제로 나누며 관계를 현실적으로 돌보는 힘입니다.",
    caution: "문제를 해결해 주는 행동이 정서적 공감보다 앞설 수 있습니다.",
    action:
      "해결책을 제시하기 전에 공감과 실질적 도움 중 무엇이 필요한지 물어보세요.",
  },
  power: {
    mode: "약속과 책임, 관계의 경계를 분명히 하는 방식",
    strength:
      "관성은 약속과 책임, 관계의 경계를 분명하게 세우는 힘으로 나타납니다.",
    caution: "기준이 높아지면 관계가 평가와 의무 중심으로 굳어질 수 있습니다.",
    action: "지켜야 할 약속과 조정 가능한 기대를 구분해 대화하세요.",
  },
  resource: {
    mode: "상대의 마음을 받아들이고 안정감을 주는 방식",
    strength:
      "인성은 상대의 말과 마음을 받아들이고 안정감을 제공하는 힘으로 나타납니다.",
    caution:
      "생각과 배려가 많아질수록 자신의 욕구를 직접 말하지 않을 수 있습니다.",
    action: "상대를 이해한 내용과 자신의 필요를 한 문장씩 함께 표현하세요.",
  },
};

function traditionalLoveNote(
  saju: SajuData,
  profile: DistributionProfile,
): string {
  const group = saju.gender === "male" ? "wealth" : "power";
  const mainStars = GROUP_TEN_GODS[group];
  const share = profile.groupShares[group];
  const details = mainStars.map((tenGod) => `${tenGod}`).join("·");
  const levelText = atLeast(share, STRONG_SHARE)
    ? "관계와 현실 책임이 반복해서 중요한 주제로 드러날 수 있습니다."
    : atLeast(share, PRESENT_SHARE)
      ? "배우자성이 일정 비중을 이루지만 다른 십성과의 조합을 함께 보아야 합니다."
      : "원국 비중이 낮으므로 인연의 유무를 단정하지 않고 전체 구조와 시기 흐름을 함께 봅니다.";

  return `전통 배우자성 관점에서는 ${saju.gender === "male" ? "남명은 재성" : "여명은 관성"}을 참고합니다(${details}). ${levelText} 이는 전통적 상징 해석이며 관계의 성패나 배우자의 품성을 뜻하지 않습니다.`;
}

function analyzeLove(
  saju: SajuData,
  profile: DistributionProfile,
): LifeAreaAnalysis {
  const ranked = (Object.keys(profile.groupShares) as TenGodGroup[]).sort(
    (a, b) => profile.groupShares[b] - profile.groupShares[a],
  );
  const top = ranked.slice(0, 2);
  const presentCount = ranked.filter((group) =>
    atLeast(profile.groupShares[group], PRESENT_SHARE),
  ).length;
  const concentrated = ranked.some((group) =>
    atLeast(profile.groupShares[group], CONCENTRATED_SHARE),
  );
  const score = clampScore(55 + presentCount * 7 - (concentrated ? 10 : 0));
  const summary =
    profile.total > 0
      ? `${GROUP_LABEL[top[0]!]}의 ${RELATIONSHIP_PROFILE[top[0]!].mode}과 ${GROUP_LABEL[top[1]!]}의 ${RELATIONSHIP_PROFILE[top[1]!].mode}을 함께 사용하는 편입니다.`
      : "십성 분포 정보가 없어 관계 성향을 특정하기보다 실제 대화와 경험을 기준으로 살펴보는 편이 좋습니다.";
  const strongGroups = ranked.filter((group) =>
    atLeast(profile.groupShares[group], STRONG_SHARE),
  );

  return {
    type: "love",
    label: "애정",
    score,
    scoreLabel: "관계 유연성 지수",
    summary,
    basis: top.map((group) => GROUP_LABEL[group]),
    strengths:
      profile.total > 0
        ? top.map((group) => RELATIONSHIP_PROFILE[group].strength)
        : [
            "실제 관계에서 편안했던 소통 방식과 어려웠던 상황을 돌아보는 것이 가장 직접적인 근거가 됩니다.",
          ],
    cautions:
      strongGroups.length > 0
        ? strongGroups.map((group) => RELATIONSHIP_PROFILE[group].caution)
        : [
            "특정 방식이 압도적이지 않은 만큼 상황에 맞추다 자신의 필요를 늦게 알아차리지 않도록 살펴보세요.",
          ],
    actions:
      profile.total > 0
        ? unique([
            ...top.map((group) => RELATIONSHIP_PROFILE[group].action),
            "상대의 성별이나 역할보다 실제 표현 방식·경계·책임 분담을 대화로 확인하세요.",
          ])
        : [
            "상대의 표현 방식·경계·책임 분담을 추측하지 말고 대화로 확인하세요.",
          ],
    contextNote:
      profile.total > 0
        ? traditionalLoveNote(saju, profile)
        : "십성 분포 정보가 없어 전통 배우자성 관점도 표시하지 않습니다.",
  };
}

export function analyzeLifeAreas(saju: SajuData): LifeAreaAnalysis[] {
  const profile = buildDistributionProfile(saju);
  return [
    analyzeWealth(saju, profile),
    analyzeHealth(saju, profile),
    analyzeLove(saju, profile),
  ];
}

function intensityLabel(share: number, prominent: boolean): string {
  if (!prominent) return "상위 비중";
  if (atLeast(share, 0.3)) return "매우 두드러짐";
  if (atLeast(share, 0.2)) return "두드러짐";
  return "뚜렷한 편";
}

export function analyzeDominantTenGods(
  saju: SajuData,
): DominantTenGodAnalysis[] {
  const profile = buildDistributionProfile(saju);
  if (profile.total <= 0) return [];

  const ranked = TEN_GOD_ORDER.filter(
    (tenGod) => profile.tenGodShares[tenGod] > 0,
  ).sort((a, b) => {
    const difference = profile.tenGodShares[b] - profile.tenGodShares[a];
    return difference || TEN_GOD_ORDER.indexOf(a) - TEN_GOD_ORDER.indexOf(b);
  });
  const prominent = ranked
    .filter((tenGod) => atLeast(profile.tenGodShares[tenGod], 0.15))
    .slice(0, 4);
  const selected = prominent.length >= 2 ? prominent : ranked.slice(0, 2);
  const prominentSet = new Set(prominent);

  return selected.map((tenGod) => {
    const share = profile.tenGodShares[tenGod];
    const content = TEN_GOD_LIFE_PROFILES[tenGod];
    return {
      tenGod,
      hanja: TEN_GODS_DATA[tenGod].hanja,
      count: Math.round((saju.tenGodsDistribution?.[tenGod] ?? 0) * 10) / 10,
      sharePct: Math.round(share * 100),
      intensityLabel: intensityLabel(share, prominentSet.has(tenGod)),
      summary: content.summary,
      strengths: [...content.strengths],
      cautions: [...content.cautions],
      actions: [content.action],
    };
  });
}
