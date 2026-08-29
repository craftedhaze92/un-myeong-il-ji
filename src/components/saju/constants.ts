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

export const rgba = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const mod = (n: number, m: number): number => ((n % m) + m) % m;

/** 받침 유무에 따라 조사 선택. 실제 구현은 lib/korean.ts로 이동해 서술 엔진과 공유한다. */
export { josa } from "@/lib/korean";

