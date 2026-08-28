import type { CSSProperties } from "react";
import type { WuXing } from "@/types";

/** result-panel.tsx·reading-panel.tsx·saju-app.tsx가 공유하는 폰트 패밀리 토큰 */
export const FONT_MYEONGJO = "var(--font-myeongjo), serif";
export const FONT_BATANG = "var(--font-batang), serif";
export const FONT_MONO = "var(--font-plex-mono), monospace";

/**
 * result-panel.tsx·reading-panel.tsx·saju-app.tsx가 공유하는 폰트 크기 스케일.
 * 기존 인라인 리터럴(14/20/24 등) 대비 전반적으로 +2px 상향한 값.
 */
export const FS = {
  micro: 12, // 세운 스파크라인 연도, 월별 셀, 경고 문구 (구 10~11)
  caption: 14, // 직업 점수 라벨, 대안 문구 (구 12)
  small: 15, // ScoreBar 라벨, 직업 상세 (구 13)
  body: 16, // 본문 전반 (구 14)
  bodyLg: 17, // 헤더 보조, 성별 버튼 (구 15)
  label: 18, // 신살명, 십성명, 직업 카테고리 (구 16)
  subtitle: 20, // 제출 버튼, 입력 폼 (구 17~18)
  cardTitle: 23, // SectionCard 제목, 결과 패널 소제목 (구 20)
  sectionHead: 25, // 로고, 대운/세운 간지, mono 입력 (구 22)
  formLabel: 27, // 입력 폼 라벨(名/이름 등) (구 24)
  display: 33, // 결과 패널 대형 수치 (구 30)
} as const;

/** 본문 텍스트 공유 스타일 — --dim/--mute/--danger는 THEMES가 항상 주입하므로 폴백 없이 사용 */
export const dimText: CSSProperties = { color: "var(--dim)" };
export const muteText: CSSProperties = { color: "var(--mute)" };
export const dangerText: CSSProperties = { color: "var(--danger)" };

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
    "--dim": "#B9BAC0",
    "--mute": "#8C8E96",
    "--danger": "#E2705C",
    "--line": "rgba(237,231,219,0.16)",
    "--surface": "rgba(237,231,219,0.03)",
    "--track": "rgba(237,231,219,0.08)",
    "--slot": "rgba(0,0,0,0.3)",
    "--slotShadow": "rgba(0,0,0,0.55)",
  },
  light: {
    "--bg": "#EDE7DB",
    "--fg": "#1A1A18",
    "--dim": "#3E4048",
    "--mute": "#62656F",
    "--danger": "#B23520",
    "--line": "rgba(26,26,24,0.18)",
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

/** 받침 유무에 따라 조사 선택. 실제 구현은 lib/korean.ts로 이동해 서술 엔진과 공유한다. */
export { josa } from "@/lib/korean";

