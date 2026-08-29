import {
  getEarthlyBranchByKorean,
  extractJiJangGan,
} from "@/data/earthly_branches";
import { getHeavenlyStemByKorean } from "@/data/heavenly_stems";
import { getLongitudeOffsetMinutesForSaju } from "@/data/longitude_table";
import {
  STRENGTH_BAND_THRESHOLDS,
} from "@/lib/day_master_strength";
import {
  calculateElementDistribution,
  getElementStatusMap,
  type ElementDistributionResult,
  type ElementStatus,
} from "@/lib/element_distribution";
import { convertCalendar } from "@/lib/calendar";
import { getYearGanJi } from "@/lib/se_un";
import { SIN_SAL_DATA } from "@/lib/sin_sal";
import { calculateTenGod, calculateTenGodsDistribution } from "@/lib/ten_gods";
import {
  getTwelveStage,
  TWELVE_STAGE_INFO,
  type TwelveStage,
} from "@/lib/twelve_stages";
import { getTwelveSinSal, type TwelveSinSal } from "@/lib/twelve_sinsal";
import type { DaeUnPeriod } from "@/lib/dae_un";
import type {
  EarthlyBranch,
  Gender,
  HeavenlyStem,
  Pillar,
  SajuData,
  TenGod,
  WuXing,
} from "@/types";
import { ELEMENTS, elementColor, elementIndex, josa, rgba } from "./constants";

const SINSAL_TYPE_LABEL: Record<"lucky" | "unlucky" | "neutral", string> = {
  lucky: "길신",
  unlucky: "흉신",
  neutral: "중립",
};

/** 진태양시 보정값(분)을 "−32분" 형태로 표기. 마이너스는 하이픈이 아닌 U+2212(음수 기호) 사용. */
function formatLongitudeOffset(offsetMinutes: number): string {
  if (offsetMinutes === 0) return "0분";
  return offsetMinutes < 0
    ? `−${Math.abs(offsetMinutes)}분`
    : `+${offsetMinutes}분`;
}

/**
 * 생년월일 줄에 반대쪽 달력 날짜를 괄호로 병기한다.
 * - 음력 입력이면 이미 계산된 양력 환산일(saju.solarBirthDate)을 그대로 쓴다(재변환 불필요).
 * - 양력 입력이면 calendar.ts#convertCalendar로 음력을 구한다. 1900~2200 범위 밖 등으로
 *   변환이 실패하면 병기를 생략한다(다른 표시는 그대로 정상 동작해야 하므로).
 */
function buildCalendarPairLabel(saju: SajuData): string {
  if (saju.calendar === "lunar") {
    return ` (양력 ${saju.solarBirthDate.replace(/-/g, ".")})`;
  }
  try {
    const conversion = convertCalendar(saju.birthDate, "solar", "lunar");
    const leapTag = conversion.isLeapMonth ? "(윤)" : "";
    return ` (음력${leapTag} ${conversion.convertedDate.replace(/-/g, ".")})`;
  } catch {
    return "";
  }
}

export interface PillarCellVM {
  ch: string;
  ko: string;
  el: string;
  color: string;
  bg: string;
  line: string;
  glow: string;
  god: string;
  hidden: string;
}

export interface PillarVM {
  label: string;
  labelEn: string;
  labelColor: string;
  /** 90이면 일주(day column) — 등장 애니메이션에서 강조 대상 판별에도 재사용한다. */
  size: number;
  stem: PillarCellVM;
  branch: PillarCellVM;
  /** 일지 기준 십이신살(twelve_sinsal.ts). 일주 칸은 자기 자신과의 관계라 계산이 성립하지 않아 undefined. */
  twelveSinsal?: TwelveSinSal;
}

// ── 오행과 십성 — 상생상극 오각형 ────────────────────────────────────────

export interface ElementNodeVM {
  key: WuXing;
  ch: string;
  ko: string;
  color: string;
  pct: number;
  status: ElementStatus;
  cx: number;
  cy: number;
  r: number;
  /** clipPath rect의 y좌표 — 아래에서 pct%만큼 차오르는 "물결" 채움의 상단 경계 */
  fillY: number;
  clipId: string;
}

export interface ElementArrowVM {
  d: string;
}

export interface ElementCycleVM {
  nodes: ElementNodeVM[];
  /** 인접 오행 사이의 상생(生) 화살표 — 목→화→토→금→수→목 */
  sheng: ElementArrowVM[];
  /** 두 칸 건너 오행 사이의 상극(克) 화살표 — 목→토→수→화→금→목(오각별) */
  ke: ElementArrowVM[];
}

export interface ElementDetailVM {
  key: WuXing;
  ch: string;
  ko: string;
  color: string;
  groupLabel: string; // 예: "목(재성)"
  status: ElementStatus;
  gods: { name: TenGod; pct: number }[];
}

export interface StrengthGaugeBandVM {
  band: "신약" | "중화" | "신강";
  label: string;
  range: string;
  active: boolean;
}

export interface StrengthGaugeVM {
  score: number;
  band: "신약" | "중화" | "신강";
  bandLine: string; // "신약한 사주입니다." 형태
  color: string;
  trackD: string;
  progressD: string;
  capX: number;
  capY: number;
  bands: StrengthGaugeBandVM[];
  analysis: string;
}

export interface SinSalVM {
  name: string;
  desc: string;
  typeLabel: string;
}

/** 대운/세운 칸에서 공유하는 간지 한 글자(천간 또는 지지) 표시 정보 */
export interface GanjiCharVM {
  ch: string;
  ko: string;
  color: string;
  bg: string;
}

/** 대운/세운 한 구간의 십성·십이운성·십이신살 등 상세 표시 정보 (ui/ganji-column.tsx가 그린다) */
export interface GanjiCellVM {
  stem: GanjiCharVM;
  stemGod: TenGod;
  branch: GanjiCharVM;
  branchGod: TenGod;
  stage: TwelveStage;
  /** 십이운성 한 줄 설명 (twelve_stages.ts#TWELVE_STAGE_INFO) — 칸에 마우스오버 시 툴팁으로 표시 */
  stageDescription: string;
  sinsal: TwelveSinSal;
}

export interface LuckVM extends GanjiCellVM {
  age: string;
  startAge: number;
  endAge: number;
  gz: string;
  color: string;
  bg: string;
  line: string;
  bar: string;
  current: boolean;
  /** 이 대운 10년치 세운 — result-panel.tsx가 대운 칸 클릭 시 이 목록으로 세운 띠를 갈아 끼운다. */
  seun: SeunCellVM[];
}

export interface SeunCellVM extends GanjiCellVM {
  year: number;
  gz: string;
  color: string;
  bg: string;
  line: string;
  bar: string;
  current: boolean;
}

export interface SajuViewModel {
  pillars: PillarVM[];
  elementCycle: ElementCycleVM;
  elementDetails: ElementDetailVM[];
  strengthGauge: StrengthGaugeVM | null;
  sinsal: SinSalVM[];
  luck: LuckVM[];
  colCount: number;
  myColor: string;
  headline: string;
  headlineSub: string;
  birthLine: string;
  yong: { ch: string; color: string; glow: string; desc: string };
  yongLine: string;
  yongBg: string;
  luckNote: string;
  luckFoot: string;
  headerNote: string;
}

/**
 * 지지 칸의 십성 판정에 쓸 대표 천간(본기/정기).
 * saju.jiJangGan은 절기 기준 정밀 세력이 있으면 그걸 쓰고, 없을 때만
 * extractJiJangGan의 첫 원소(JI_JANG_GAN.primary = 정기)로 폴백한다.
 */
function primaryHiddenStem(
  saju: SajuData,
  key: "hour" | "day" | "month" | "year",
  branch: EarthlyBranch,
) {
  return saju.jiJangGan?.[key]?.primary.stem ?? extractJiJangGan(branch)[0]!;
}

function formatHidden(branch: EarthlyBranch): string {
  const stems = extractJiJangGan(branch);
  const hanja = stems.map((s) => getHeavenlyStemByKorean(s)!.hanja).join("");
  const korean = stems.join("");
  return `${hanja} (${korean})`;
}

/**
 * 십성은 여기서 다시 계산하지 않고 ten_gods.ts#calculateTenGod로 통일한다.
 * 예전 구현(지지 오행·음양으로 직접 판정)은 지지 본기와 다른 답을 낼 수 있었다
 * (예: 子는 12지 순서상 양이지만 본기는 계수(음)) — 카드 표시와 saju.tenGodsDistribution이
 * 서로 다른 명식을 말하던 회귀.
 */
function buildCell(
  korean: string,
  hanja: string,
  el: WuXing,
  isStem: boolean,
  god: string,
  dark: boolean,
  branchForHidden?: EarthlyBranch,
): PillarCellVM {
  const elIdx = elementIndex(el);
  const hex = elementColor(el, dark);
  return {
    ch: hanja,
    ko: korean,
    el: ELEMENTS[elIdx]!.ch,
    color: hex,
    bg: `linear-gradient(168deg,${rgba(hex, dark ? 0.16 : 0.14)},${rgba(hex, 0.02)})`,
    line: rgba(hex, dark ? 0.34 : 0.42),
    glow: rgba(hex, dark ? 0.35 : 0.14),
    god,
    hidden: isStem ? "—" : formatHidden(branchForHidden!),
  };
}

const PILLAR_META: Record<
  "hour" | "day" | "month" | "year",
  { label: string; labelEn: string }
> = {
  hour: { label: "時", labelEn: "시주" },
  day: { label: "日", labelEn: "일주" },
  month: { label: "月", labelEn: "월주" },
  year: { label: "年", labelEn: "연주" },
};

// ── 오행과 십성 — 상생상극 오각형 빌더 ────────────────────────────────────

/**
 * ELEMENTS(목화토금수) 순서로 -90°(정북)에서 시작해 시계방향으로 배치하면 인접 오행이
 * 곧 상생(生) 순서가 된다(목→화→토→금→수→목) — 별도 순서 테이블 없이 배열 인덱스만으로
 * 상생 관계가 성립한다. 상극(克)은 인덱스를 2칸 건너뛴 관계(i → i+2)로, 기존 오각별
 * (별 모양 레이더의 [0,2,4,1,3] 폴리곤)과 정확히 같은 경로다.
 */
function pentaPoint(i: number, r: number): [number, number] {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  return [100 + Math.cos(a) * r, 100 + Math.sin(a) * r];
}

/** from → to 방향 직선에서 to쪽 끝을 trim만큼 당겨, 화살촉이 원 안으로 파고들지 않게 한다 */
function trimToward(
  from: [number, number],
  to: [number, number],
  trim: number,
): [number, number] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ratio = Math.max(0, (len - trim) / len);
  return [from[0] + dx * ratio, from[1] + dy * ratio];
}

const NODE_R = 24;
const NODE_RING_R = 80;
const CYCLE_ARROW_TRIM = NODE_R + 6;

/** SVG clipPath id에 한글을 그대로 쓰면 일부 환경에서 url(#…) 참조가 깨질 수 있어 ASCII로 매핑 */
const ELEMENT_SLUG: Record<WuXing, string> = {
  목: "wood",
  화: "fire",
  토: "earth",
  금: "metal",
  수: "water",
};

function buildElementCycle(
  dist: ElementDistributionResult,
  statusMap: Record<WuXing, ElementStatus>,
  dark: boolean,
): ElementCycleVM {
  const order = ELEMENTS.map((e) => e.key); // 목화토금수 = 상생 순서
  const centers = order.map((_, i) => pentaPoint(i, NODE_RING_R));

  const nodes: ElementNodeVM[] = order.map((key, i) => {
    const el = ELEMENTS[i]!;
    const pct = dist.pct[key] ?? 0;
    const [cx, cy] = centers[i]!;
    const fillRatio = Math.max(0, Math.min(1, pct / 100));
    return {
      key,
      ch: el.ch,
      ko: el.ko,
      color: pct > 0 ? elementColor(key, dark) : "var(--mute, rgba(237,231,219,0.35))",
      pct: Math.round(pct * 10) / 10,
      status: statusMap[key] ?? "적정",
      cx,
      cy,
      r: NODE_R,
      fillY: cy + NODE_R - fillRatio * NODE_R * 2,
      clipId: `elFill-${ELEMENT_SLUG[key]}`,
    };
  });

  const sheng: ElementArrowVM[] = order.map((_, i) => {
    const from = centers[i]!;
    const to = centers[(i + 1) % 5]!;
    // 바깥으로 살짝 부푼 2차 베지어 — 인접 노드를 원호로 잇는다
    const midAngle =
      -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / 5;
    const bow = NODE_RING_R * 1.32;
    const control: [number, number] = [
      100 + Math.cos(midAngle) * bow,
      100 + Math.sin(midAngle) * bow,
    ];
    const start = trimToward(control, from, CYCLE_ARROW_TRIM - 4);
    const end = trimToward(control, to, CYCLE_ARROW_TRIM);
    return {
      d: `M ${start[0].toFixed(1)},${start[1].toFixed(1)} Q ${control[0].toFixed(1)},${control[1].toFixed(1)} ${end[0].toFixed(1)},${end[1].toFixed(1)}`,
    };
  });

  const ke: ElementArrowVM[] = order.map((_, i) => {
    const from = centers[i]!;
    const to = centers[(i + 2) % 5]!;
    // trimToward(a, b, trim)은 "b에서 trim만큼 떨어진 점"을 돌려준다 — from쪽 끝은
    // to를 기준점으로 삼아 거꾸로 불러야 from 노드 근처에서 시작한다. (이전 버전은 두 인자
    // 순서를 그대로 써서 시작점·끝점이 둘 다 to 노드 바로 옆에 모여 선이 사실상 안 보였다.)
    const start = trimToward(to, from, CYCLE_ARROW_TRIM);
    const end = trimToward(from, to, CYCLE_ARROW_TRIM);
    return {
      d: `M ${start[0].toFixed(1)},${start[1].toFixed(1)} L ${end[0].toFixed(1)},${end[1].toFixed(1)}`,
    };
  });

  return { nodes, sheng, ke };
}

/**
 * 오행별 십성 2개의 정확한 pct. element_distribution.ts#calculateElementDistribution은
 * 오행 단위로 합쳐서만 반환하므로, 개별 십성 값은 같은 옵션({ includeDayMaster: true })으로
 * calculateTenGodsDistribution을 한 번 더 불러 같은 total로 나눈다 — 두 숫자의 분모가
 * 어긋나지 않는지는 element_distribution.test.ts에서 검증한다.
 */
function buildElementDetails(
  saju: SajuData,
  dist: ElementDistributionResult,
  statusMap: Record<WuXing, ElementStatus>,
  dark: boolean,
): ElementDetailVM[] {
  const distribution = calculateTenGodsDistribution(saju, {
    includeDayMaster: true,
  });
  const total = dist.total;

  return ELEMENTS.map((el) => {
    const key = el.key;
    const info = dist.groups[key]!;
    const gods = info.gods.map((god) => {
      const raw = distribution[god];
      const pct = total > 0 ? Math.round((raw / total) * 1000) / 10 : 0;
      return { name: god, pct };
    });
    return {
      key,
      ch: el.ch,
      ko: el.ko,
      color: elementColor(key, dark),
      groupLabel: `${el.ko}(${info.group})`,
      status: statusMap[key] ?? "적정",
      gods,
    };
  });
}

// ── 신강신약 게이지 ────────────────────────────────────────────────────

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

/** 135°에서 시작해 시계방향으로 270° 돌아 45°(=405°)에서 끝나는 원호 — 아래쪽이 열린 게이지 */
const GAUGE_START = 135;
const GAUGE_SWEEP = 270;

function describeGaugeArc(cx: number, cy: number, r: number, sweepDeg: number): string {
  const [sx, sy] = polarToCartesian(cx, cy, r, GAUGE_START);
  const [ex, ey] = polarToCartesian(cx, cy, r, GAUGE_START + sweepDeg);
  const largeArc = sweepDeg > 180 ? 1 : 0;
  return `M ${sx.toFixed(1)},${sy.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${ex.toFixed(1)},${ey.toFixed(1)}`;
}

function buildStrengthGauge(
  saju: SajuData,
  myColor: string,
): StrengthGaugeVM | null {
  if (!saju.dayMasterStrength) return null;
  const { score, analysis } = saju.dayMasterStrength;
  const { medium, strong } = STRENGTH_BAND_THRESHOLDS;

  const band: StrengthGaugeVM["band"] =
    score >= strong ? "신강" : score >= medium ? "중화" : "신약";
  const bandLine =
    band === "신강"
      ? "신강한 사주입니다."
      : band === "중화"
        ? "중화된 사주입니다."
        : "신약한 사주입니다.";

  const cx = 100;
  const cy = 100;
  const r = 70;
  const clamped = Math.max(0, Math.min(100, score));
  const progressSweep = (clamped / 100) * GAUGE_SWEEP;
  const [capX, capY] = polarToCartesian(cx, cy, r, GAUGE_START + progressSweep);

  return {
    score: clamped,
    band,
    bandLine,
    color: myColor,
    trackD: describeGaugeArc(cx, cy, r, GAUGE_SWEEP),
    progressD:
      progressSweep > 0 ? describeGaugeArc(cx, cy, r, progressSweep) : "",
    capX,
    capY,
    bands: [
      { band: "신약", label: "신약", range: `0~${medium - 1}`, active: band === "신약" },
      {
        band: "중화",
        label: "중화",
        range: `${medium}~${strong - 1}`,
        active: band === "중화",
      },
      { band: "신강", label: "신강", range: `${strong}~`, active: band === "신강" },
    ],
    analysis,
  };
}

// ── 대운/세운 공유 — 간지 셀 상세 정보 ────────────────────────────────────

function buildGanjiChar(
  korean: string,
  hanja: string,
  el: WuXing,
  dark: boolean,
): GanjiCharVM {
  const hex = elementColor(el, dark);
  return { ch: hanja, ko: korean, color: hex, bg: rgba(hex, dark ? 0.16 : 0.12) };
}

/**
 * 대운/세운 한 구간의 십성·십이운성·십이신살을 계산한다.
 * - 천간 십성: calculateTenGod(일간, 구간 천간) — 명식 카드와 동일한 함수.
 * - 지지 십성: 지장간 본기(정기) 기준. 대운/세운 지지는 saju.jiJangGan(출생 사주 전용)에
 *   들어있지 않으므로 extractJiJangGan의 첫 원소(JI_JANG_GAN.primary)를 직접 쓴다 —
 *   점신 벤치마크 화면을 역산해도 본기 기준으로 정확히 일치했다.
 * - 십이운성: 일간 기준 getTwelveStage.
 * - 십이신살: 일지 기준 getTwelveSinSal (현대 명리에서 연지보다 일지 기준이 대세).
 */
function buildGanjiCell(
  saju: SajuData,
  stem: HeavenlyStem,
  branch: EarthlyBranch,
  dark: boolean,
): GanjiCellVM {
  const dayStem = saju.day.stem;
  const stemData = getHeavenlyStemByKorean(stem)!;
  const branchData = getEarthlyBranchByKorean(branch)!;
  const hiddenStem = extractJiJangGan(branch)[0]!;
  const stage = getTwelveStage(dayStem, branch);

  return {
    stem: buildGanjiChar(stem, stemData.hanja, stemData.element, dark),
    stemGod: calculateTenGod(dayStem, stem),
    branch: buildGanjiChar(branch, branchData.hanja, branchData.element, dark),
    branchGod: calculateTenGod(dayStem, hiddenStem),
    stage,
    stageDescription: TWELVE_STAGE_INFO[stage].description,
    sinsal: getTwelveSinSal(saju.day.branch, branch),
  };
}

/**
 * startYear~endYear(포함) 구간의 세운 칸을 만든다. nowYear는 그중 "실제 올해"가 몇 년인지
 * 표시하는 기준일 뿐 구간 자체와는 무관하다 — buildSajuViewModel이 대운 구간별로 이 함수를
 * 호출하므로, 구간이 실제 올해를 포함하지 않으면 어떤 칸도 current로 표시되지 않는다.
 */
function buildSeunCells(
  saju: SajuData,
  startYear: number,
  endYear: number,
  nowYear: number,
  dark: boolean,
): SeunCellVM[] {
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  return years.map((year) => {
    const { stem, branch } = getYearGanJi(year);
    const stemData = getHeavenlyStemByKorean(stem)!;
    const hex = elementColor(stemData.element, dark);
    const current = year === nowYear;
    const cell = buildGanjiCell(saju, stem, branch, dark);
    return {
      ...cell,
      year,
      gz: `${cell.stem.ch}${cell.branch.ch}`,
      color: current ? hex : "var(--dim, rgba(237,231,219,0.55))",
      bg: current ? rgba(hex, dark ? 0.14 : 0.12) : "transparent",
      line: current ? rgba(hex, 0.45) : "var(--line, rgba(237,231,219,0.1))",
      bar: current ? hex : "var(--track, rgba(237,231,219,0.08))",
      current,
    };
  });
}

export interface BuildViewModelParams {
  name: string;
  saju: SajuData;
  daeUn: DaeUnPeriod[];
  hasHour: boolean;
  gender: Gender;
  dark: boolean;
  nowYear: number;
}

export function buildSajuViewModel({
  name,
  saju,
  daeUn,
  hasHour,
  gender,
  dark,
  nowYear,
}: BuildViewModelParams): SajuViewModel {
  const order: Array<"hour" | "day" | "month" | "year"> = hasHour
    ? ["hour", "day", "month", "year"]
    : ["day", "month", "year"];

  const pillars: PillarVM[] = order.map((key) => {
    const pillar: Pillar = saju[key];
    const meta = PILLAR_META[key];
    const stemHanja = getHeavenlyStemByKorean(pillar.stem)!.hanja;
    const branchData = getEarthlyBranchByKorean(pillar.branch)!;
    const isDay = key === "day";

    const stemGod = calculateTenGod(saju.day.stem, pillar.stem);
    const stemCell = buildCell(
      pillar.stem,
      stemHanja,
      pillar.stemElement,
      true,
      stemGod,
      dark,
    );
    if (isDay) stemCell.god = "나";

    const hiddenStem = primaryHiddenStem(saju, key, pillar.branch);
    const branchGod = calculateTenGod(saju.day.stem, hiddenStem);
    const branchCell = buildCell(
      pillar.branch,
      branchData.hanja,
      pillar.branchElement,
      false,
      branchGod,
      dark,
      pillar.branch,
    );

    return {
      label: meta.label,
      labelEn: meta.labelEn,
      labelColor: isDay
        ? elementColor(pillar.stemElement, dark)
        : "var(--dim, rgba(237,231,219,0.55))",
      size: isDay ? 90 : 76,
      stem: stemCell,
      branch: branchCell,
      // 일주 자신은 일지 기준 계산이 성립하지 않아 표시하지 않는다(기준 자리라 무의미).
      twelveSinsal: isDay ? undefined : getTwelveSinSal(saju.day.branch, pillar.branch),
    };
  });

  // 오행 분포: 지장간 세력 가중치를 반영한 element_distribution.ts로 통일한다.
  // (예전엔 화면에 보이는 기둥의 천간·지지 얼굴값만 단순 카운트했다 — 오행 파이차트와
  // 오른쪽 십성 상세 리스트가 서로 다른 분모를 쓰던 문제를 여기서 없앤다.)
  const elementDist = calculateElementDistribution(saju);
  const statusMap = getElementStatusMap(elementDist.counts);
  const elementCycle = buildElementCycle(elementDist, statusMap, dark);
  const elementDetails: ElementDetailVM[] = buildElementDetails(
    saju,
    elementDist,
    statusMap,
    dark,
  );

  const strengthGauge = buildStrengthGauge(
    saju,
    elementColor(saju.day.stemElement, dark),
  );

  const sinsal: SinSalVM[] =
    saju.sinSals && saju.sinSals.length > 0
      ? saju.sinSals.map((s) => {
          const info = SIN_SAL_DATA[s];
          return {
            name: `${info.name}(${info.hanja})`,
            desc: info.description,
            typeLabel: SINSAL_TYPE_LABEL[info.type],
          };
        })
      : [
          {
            name: "무신살(無神煞)",
            desc: "두드러진 신살 없이 고르게 놓인 명식입니다.",
            typeLabel: "",
          },
        ];

  // 만 나이 계산은 양력 환산일 기준 — 음력 입력이면 birthDate는 음력 날짜라 그대로 쓰면 어긋난다.
  const birthYear = parseInt(saju.solarBirthDate.slice(0, 4), 10);
  const nowAge = nowYear - birthYear;
  const forward =
    (saju.year.yinYang === "양" && gender === "male") ||
    (saju.year.yinYang === "음" && gender === "female");

  const luck: LuckVM[] = daeUn.slice(0, 9).map((period) => {
    const hex = elementColor(period.stemElement, dark);
    const current = nowAge >= period.startAge && nowAge <= period.endAge;
    const cell = buildGanjiCell(saju, period.stem, period.branch, dark);
    return {
      ...cell,
      age: `${period.startAge}–${period.endAge}`,
      startAge: period.startAge,
      endAge: period.endAge,
      gz: `${cell.stem.ch}${cell.branch.ch}`,
      color: current ? hex : "var(--dim, rgba(237,231,219,0.55))",
      bg: current ? rgba(hex, dark ? 0.14 : 0.12) : "transparent",
      line: current ? rgba(hex, 0.45) : "var(--line, rgba(237,231,219,0.1))",
      bar: current ? hex : "var(--track, rgba(237,231,219,0.08))",
      current,
      seun: buildSeunCells(
        saju,
        birthYear + period.startAge,
        birthYear + period.endAge,
        nowYear,
        dark,
      ),
    };
  });
  const curLuck = luck.find((l) => l.current);

  const myColor = elementColor(saju.day.stemElement, dark);

  const maxKey = (Object.keys(elementDist.pct) as WuXing[]).reduce((a, b) =>
    elementDist.pct[a]! >= elementDist.pct[b]! ? a : b,
  );
  const minKey = (Object.keys(elementDist.pct) as WuXing[]).reduce((a, b) =>
    elementDist.pct[a]! <= elementDist.pct[b]! ? a : b,
  );
  const maxEl = ELEMENTS[elementIndex(maxKey)]!;
  const minEl = ELEMENTS[elementIndex(minKey)]!;
  const maxPct = elementDist.pct[maxKey]!;
  const minPct = elementDist.pct[minKey]!;

  return {
    pillars,
    elementCycle,
    elementDetails,
    strengthGauge,
    sinsal,
    luck,
    colCount: pillars.length,
    myColor,
    headline: name.trim(),
    headlineSub: `${josa(maxEl.ko, "이/가")} ${maxPct}%로 가장 많고, ${josa(minEl.ko, "이/가")} ${
      minPct === 0 ? "없습니다" : `${minPct}%로 적습니다`
    }.`,
    birthLine: `${saju.calendar === "lunar" ? `음력${saju.isLeapMonth ? "(윤)" : ""}` : "양력"} ${saju.birthDate.replace(/-/g, ".")}${
      hasHour ? " " + saju.birthTime : " 시간 미상"
    }${buildCalendarPairLabel(saju)} · ${saju.birthCity}(${formatLongitudeOffset(getLongitudeOffsetMinutesForSaju(saju.birthCity))}) · ${gender === "male" ? "남" : "여"}`,
    yong: saju.yongSin
      ? {
          ch: ELEMENTS[elementIndex(saju.yongSin.primaryYongSin)]!.ch,
          color: elementColor(saju.yongSin.primaryYongSin, dark),
          glow: rgba(
            elementColor(saju.yongSin.primaryYongSin, dark),
            dark ? 0.4 : 0.15,
          ),
          desc: saju.yongSin.reasoning,
        }
      : { ch: "", color: "var(--fg)", glow: "transparent", desc: "" },
    yongLine: saju.yongSin
      ? rgba(elementColor(saju.yongSin.primaryYongSin, dark), 0.4)
      : "var(--line)",
    yongBg: saju.yongSin
      ? `linear-gradient(168deg,${rgba(elementColor(saju.yongSin.primaryYongSin, dark), dark ? 0.12 : 0.1)},var(--surface, rgba(237,231,219,0.02)))`
      : "var(--surface)",
    luckNote: curLuck ? `지금은 ${curLuck.gz} 대운` : "大運 · 60년",
    luckFoot: `${forward ? "순행" : "역행"} · 만 ${nowAge}세 기준 · 절입 기준 대운수 ${daeUn[0]?.startAge ?? 4}`,
    headerNote: `${maxEl.ch} ${maxPct}%`,
  };
}
