import type { WuXing } from "@/types";

/** design 파일의 오행 순서(목화토금수)를 그대로 따르는 인덱스 기준 */
export const ELEMENT_ORDER: WuXing[] = ["목", "화", "토", "금", "수"];

export interface ElementPalette {
  key: WuXing;
  ch: string;
  ko: string;
  colorDark: string;
  colorLight: string;
  need: string;
}

export const ELEMENTS: ElementPalette[] = [
  { key: "목", ch: "木", ko: "목", colorDark: "#2E8467", colorLight: "#1F6B50", need: "뻗어나갈 방향과 새로 시작할 일" },
  { key: "화", ch: "火", ko: "화", colorDark: "#C8412C", colorLight: "#B23520", need: "드러내는 자리와 사람들의 시선" },
  { key: "토", ch: "土", ko: "토", colorDark: "#B4823A", colorLight: "#8E6222", need: "머물 자리와 지켜야 할 약속" },
  { key: "금", ch: "金", ko: "금", colorDark: "#D8D3C4", colorLight: "#8A8271", need: "끊어내는 결단과 다듬는 규율" },
  { key: "수", ch: "水", ko: "수", colorDark: "#4A6E99", colorLight: "#27405E", need: "흘려보내는 시간과 배움의 통로" },
];

export function elementIndex(key: WuXing): number {
  return ELEMENT_ORDER.indexOf(key);
}

export function elementColor(key: WuXing, dark: boolean): string {
  const el = ELEMENTS[elementIndex(key)];
  return dark ? el.colorDark : el.colorLight;
}

export type ThemeVars = Record<string, string>;

export const THEMES: { dark: ThemeVars; light: ThemeVars } = {
  dark: {
    "--bg": "#0F1116",
    "--fg": "#EDE7DB",
    "--dim": "rgba(237,231,219,0.55)",
    "--mute": "rgba(237,231,219,0.32)",
    "--line": "rgba(237,231,219,0.13)",
    "--surface": "rgba(237,231,219,0.03)",
    "--track": "rgba(237,231,219,0.08)",
    "--slot": "rgba(0,0,0,0.3)",
    "--slotShadow": "rgba(0,0,0,0.55)",
  },
  light: {
    "--bg": "#EDE7DB",
    "--fg": "#1A1A18",
    "--dim": "rgba(26,26,24,0.6)",
    "--mute": "rgba(26,26,24,0.4)",
    "--line": "rgba(26,26,24,0.16)",
    "--surface": "rgba(255,255,255,0.35)",
    "--track": "rgba(26,26,24,0.1)",
    "--slot": "rgba(26,26,24,0.07)",
    "--slotShadow": "rgba(26,26,24,0.18)",
  },
};

export const rgba = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const mod = (n: number, m: number): number => ((n % m) + m) % m;

/** 받침 유무에 따라 조사 선택 (이/가, 은/는, 을/를) */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const c = word.charCodeAt(word.length - 1);
  const hasFinal = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : false;
  return word + (hasFinal ? withFinal : withoutFinal);
}

