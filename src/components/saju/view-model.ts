import { getEarthlyBranchByKorean, extractJiJangGan } from "@/data/earthly_branches";
import { getHeavenlyStemByKorean } from "@/data/heavenly_stems";
import { getLongitudeOffsetMinutesForSaju } from "@/data/longitude_table";
import { SIN_SAL_DATA } from "@/lib/sin_sal";
import type { DaeUnPeriod } from "@/lib/dae_un";
import type { EarthlyBranch, Gender, Pillar, SajuData, TenGod, WuXing } from "@/types";
import { ELEMENTS, elementColor, elementIndex, josa, mod, rgba } from "./constants";

/** 진태양시 보정값(분)을 "−32분" 형태로 표기. 마이너스는 하이픈이 아닌 U+2212(음수 기호) 사용. */
function formatLongitudeOffset(offsetMinutes: number): string {
  if (offsetMinutes === 0) return "0분";
  return offsetMinutes < 0 ? `−${Math.abs(offsetMinutes)}분` : `+${offsetMinutes}분`;
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
  size: number;
  slotDelay: number;
  delayA: number;
  delayB: number;
  stem: PillarCellVM;
  branch: PillarCellVM;
}

export interface ElementBarVM {
  ch: string;
  ko: string;
  color: string;
  count: number;
  pct: number;
}

export interface RingDotVM {
  cx: string;
  cy: string;
  r: string;
  color: string;
}

export interface RingLabelVM {
  left: string;
  top: string;
  ch: string;
  sub: string;
  color: string;
}

export interface RingVM {
  grid: string;
  mid: string;
  star: string;
  shape: string;
  fill: string;
  dots: RingDotVM[];
  labels: RingLabelVM[];
}

export interface GodChipVM {
  name: string;
  count: number;
}

export interface SinSalVM {
  name: string;
  desc: string;
}

export interface LuckVM {
  age: string;
  gz: string;
  color: string;
  bg: string;
  line: string;
  bar: string;
  current: boolean;
}

export interface SajuViewModel {
  pillars: PillarVM[];
  elements: ElementBarVM[];
  ring: RingVM;
  gods: GodChipVM[];
  sinsal: SinSalVM[];
  luck: LuckVM[];
  colCount: number;
  accent: string;
  headline: string;
  headlineSub: string;
  birthLine: string;
  godsNote: string;
  yong: { ch: string; color: string; glow: string; desc: string };
  yongLine: string;
  yongBg: string;
  luckNote: string;
  luckFoot: string;
  headerNote: string;
}

function tenGodFromElement(
  dayElIdx: number,
  dayYang: boolean,
  elIdx: number,
  yang: boolean
): TenGod {
  const rel = mod(elIdx - dayElIdx, 5);
  const same = dayYang === yang;
  if (rel === 0) return same ? "비견" : "겁재";
  if (rel === 1) return same ? "식신" : "상관";
  if (rel === 2) return same ? "편재" : "정재";
  if (rel === 3) return same ? "편관" : "정관";
  return same ? "편인" : "정인";
}

function formatHidden(branch: EarthlyBranch): string {
  const stems = extractJiJangGan(branch);
  const hanja = stems.map((s) => getHeavenlyStemByKorean(s)!.hanja).join("");
  const korean = stems.join("");
  return `${hanja} (${korean})`;
}

function buildCell(
  korean: string,
  hanja: string,
  el: WuXing,
  yang: boolean,
  isStem: boolean,
  dayElIdx: number,
  dayYang: boolean,
  dark: boolean,
  branchForHidden?: EarthlyBranch
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
    god: tenGodFromElement(dayElIdx, dayYang, elIdx, yang),
    hidden: isStem ? "—" : formatHidden(branchForHidden!),
  };
}

const PILLAR_META: Record<"hour" | "day" | "month" | "year", { label: string; labelEn: string }> = {
  hour: { label: "時", labelEn: "시주" },
  day: { label: "日", labelEn: "일주" },
  month: { label: "月", labelEn: "월주" },
  year: { label: "年", labelEn: "연주" },
};

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
  const dayElIdx = elementIndex(saju.day.stemElement);
  const dayYang = saju.day.yinYang === "양";

  const order: Array<"hour" | "day" | "month" | "year"> = hasHour
    ? ["hour", "day", "month", "year"]
    : ["day", "month", "year"];

  const pillars: PillarVM[] = order.map((key, i) => {
    const pillar: Pillar = saju[key];
    const meta = PILLAR_META[key];
    const stemHanja = getHeavenlyStemByKorean(pillar.stem)!.hanja;
    const branchData = getEarthlyBranchByKorean(pillar.branch)!;
    const isDay = key === "day";

    const stemCell = buildCell(
      pillar.stem,
      stemHanja,
      pillar.stemElement,
      pillar.yinYang === "양",
      true,
      dayElIdx,
      dayYang,
      dark
    );
    if (isDay) stemCell.god = "나";

    const branchCell = buildCell(
      pillar.branch,
      branchData.hanja,
      pillar.branchElement,
      branchData.yinYang === "양",
      false,
      dayElIdx,
      dayYang,
      dark,
      pillar.branch
    );

    return {
      label: meta.label,
      labelEn: meta.labelEn,
      labelColor: isDay ? elementColor(pillar.stemElement, dark) : "var(--dim, rgba(237,231,219,0.55))",
      size: isDay ? 90 : 76,
      slotDelay: 40 + i * 30,
      delayA: 190 + i * 70 + (isDay ? 20 : 0),
      delayB: 230 + i * 70 + (isDay ? 20 : 0),
      stem: stemCell,
      branch: branchCell,
    };
  });

  // 오행 개수: 화면에 실제로 표시되는 기둥(시간 미상이면 3주)만 집계한다.
  const counts = [0, 0, 0, 0, 0];
  order.forEach((key) => {
    const pillar: Pillar = saju[key];
    counts[elementIndex(pillar.stemElement)]!++;
    counts[elementIndex(pillar.branchElement)]!++;
  });
  const total = counts.reduce((a, b) => a + b, 0);
  const maxC = Math.max(...counts);
  const minC = Math.min(...counts);
  const maxI = counts.indexOf(maxC);
  const minI = counts.indexOf(minC);

  const elements: ElementBarVM[] = ELEMENTS.map((el, i) => ({
    ch: el.ch,
    ko: el.ko,
    color: counts[i] ? elementColor(el.key, dark) : "var(--mute, rgba(237,231,219,0.3))",
    count: counts[i]!,
    pct: Math.round((counts[i]! / maxC) * 100),
  }));

  const R = 72;
  const pt = (i: number, r: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [100 + Math.cos(a) * r, 100 + Math.sin(a) * r];
  };
  const fmtPts = (pts: [number, number][]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const shape = counts.map((c, i) => pt(i, 14 + (c / maxC) * (R - 14)));

  const ring: RingVM = {
    grid: fmtPts([0, 1, 2, 3, 4].map((i) => pt(i, R))),
    mid: fmtPts([0, 1, 2, 3, 4].map((i) => pt(i, R * 0.52))),
    star: fmtPts([0, 2, 4, 1, 3].map((i) => pt(i, R))),
    shape: fmtPts(shape),
    fill: rgba(elementColor(ELEMENTS[maxI]!.key, dark), dark ? 0.18 : 0.14),
    dots: shape.map((p, i) => ({
      cx: p[0].toFixed(1),
      cy: p[1].toFixed(1),
      r: (2.5 + counts[i]! * 1.5).toFixed(1),
      color: counts[i] ? elementColor(ELEMENTS[i]!.key, dark) : "var(--line)",
    })),
    labels: [0, 1, 2, 3, 4].map((i) => {
      const p = pt(i, R + 26);
      return {
        left: (((p[0] + 24) / 248) * 100).toFixed(2),
        top: (((p[1] + 24) / 248) * 100).toFixed(2),
        ch: ELEMENTS[i]!.ch,
        sub: `${ELEMENTS[i]!.ko} ${counts[i]}`,
        color: counts[i] ? elementColor(ELEMENTS[i]!.key, dark) : "var(--mute, rgba(237,231,219,0.35))",
      };
    }),
  };

  const godMap: Record<string, number> = {};
  pillars.forEach((p) => {
    if (p.stem.god !== "나") godMap[p.stem.god] = (godMap[p.stem.god] ?? 0) + 1;
    godMap[p.branch.god] = (godMap[p.branch.god] ?? 0) + 1;
  });
  const gods: GodChipVM[] = Object.entries(godMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const sinsal: SinSalVM[] =
    saju.sinSals && saju.sinSals.length > 0
      ? saju.sinSals.map((s) => {
          const info = SIN_SAL_DATA[s];
          return { name: `${info.name}(${info.hanja})`, desc: info.description };
        })
      : [{ name: "무신살(無神煞)", desc: "두드러진 신살 없이 고르게 놓인 명식입니다." }];

  const birthYear = parseInt(saju.birthDate.slice(0, 4), 10);
  const nowAge = nowYear - birthYear;
  const forward =
    (saju.year.yinYang === "양" && gender === "male") ||
    (saju.year.yinYang === "음" && gender === "female");

  const luck: LuckVM[] = daeUn.slice(0, 9).map((period) => {
    const hex = elementColor(period.stemElement, dark);
    const stemHanja = getHeavenlyStemByKorean(period.stem)!.hanja;
    const branchHanja = getEarthlyBranchByKorean(period.branch)!.hanja;
    const current = nowAge >= period.startAge && nowAge <= period.endAge;
    return {
      age: `${period.startAge}–${period.endAge}`,
      gz: `${stemHanja}${branchHanja}`,
      color: current ? hex : "var(--dim, rgba(237,231,219,0.55))",
      bg: current ? rgba(hex, dark ? 0.14 : 0.12) : "transparent",
      line: current ? rgba(hex, 0.45) : "var(--line, rgba(237,231,219,0.1))",
      bar: current ? hex : "var(--track, rgba(237,231,219,0.08))",
      current,
    };
  });
  const curLuck = luck.find((l) => l.current);

  const maxEl = ELEMENTS[maxI]!;
  const minEl = ELEMENTS[minI]!;
  const accent = elementColor(maxEl.key, dark);
  const dayStemHanja = getHeavenlyStemByKorean(saju.day.stem)!.hanja;

  return {
    pillars,
    elements,
    ring,
    gods,
    sinsal,
    luck,
    colCount: pillars.length,
    accent,
    headline: name.trim() || `${dayStemHanja}${ELEMENTS[dayElIdx]!.ch}의 사람`,
    headlineSub: `${josa(maxEl.ko, "이", "가")} ${maxC}자로 가장 두텁고, ${josa(minEl.ko, "이", "가")} ${
      minC === 0 ? "없습니다" : `${minC}자로 얕습니다`
    }.`,
    birthLine: `${saju.calendar === "lunar" ? `음력${saju.isLeapMonth ? "(윤)" : ""}` : "양력"} ${saju.birthDate.replace(/-/g, ".")}${
      hasHour ? " " + saju.birthTime : " 시간 미상"
    } · ${saju.birthCity}(${formatLongitudeOffset(getLongitudeOffsetMinutesForSaju(saju.birthCity))}) · ${gender === "male" ? "남" : "여"}`,
    godsNote: gods.length ? `${josa(gods[0]!.name, "이", "가")} 가장 강하게 작동합니다.` : "",
    yong: saju.yongSin
      ? {
          ch: ELEMENTS[elementIndex(saju.yongSin.primaryYongSin)]!.ch,
          color: elementColor(saju.yongSin.primaryYongSin, dark),
          glow: rgba(elementColor(saju.yongSin.primaryYongSin, dark), dark ? 0.4 : 0.15),
          desc: saju.yongSin.reasoning,
        }
      : { ch: "", color: "var(--fg)", glow: "transparent", desc: "" },
    yongLine: saju.yongSin ? rgba(elementColor(saju.yongSin.primaryYongSin, dark), 0.4) : "var(--line)",
    yongBg: saju.yongSin
      ? `linear-gradient(168deg,${rgba(elementColor(saju.yongSin.primaryYongSin, dark), dark ? 0.12 : 0.1)},var(--surface, rgba(237,231,219,0.02)))`
      : "var(--surface)",
    luckNote: curLuck ? `지금은 ${curLuck.gz} 대운` : "大運 · 60년",
    luckFoot: `${forward ? "순행" : "역행"} · 만 ${nowAge}세 기준 · 절입 기준 대운수 ${daeUn[0]?.startAge ?? 4}`,
    headerNote: `${total}자 중 ${maxEl.ch} ${maxC}`,
  };
}
