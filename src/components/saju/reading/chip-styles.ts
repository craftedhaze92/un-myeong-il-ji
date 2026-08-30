import type { CSSProperties } from "react";

/**
 * 풀이 탭들이 공유하는 필/배지 스타일. reading-panel.tsx에 두면 각 탭 파일이
 * 부모(reading-panel.tsx)를 다시 임포트하게 되어 순환 임포트가 생기므로 이 파일로 뺐다.
 *
 * - PILL_BASE/pillStyle: 흐름·방위·오늘 탭에서 클릭 가능한 선택지(대운/공간/의사결정 등)에 쓴다.
 * - BADGE_BASE/badgeStyle: 명식·흐름·오늘 탭에서 클릭 불가능한 정보 칩에 쓴다.
 *   (탭 스트립 자체의 TAB_BASE/tabStyle은 부모 전용이라 reading-panel.tsx에 남아 있다 —
 *   "페이지 내비게이션"과 "카드 안에서 고르는 값"을 형태로 구분한다는 원래 의도가 그 파일에 있다.)
 */

export const PILL_BASE =
  "cursor-pointer whitespace-nowrap rounded-[2px] border px-3.5 py-2 font-mono-plex text-body " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg";

export function pillStyle(active: boolean, accent?: string): CSSProperties {
  return {
    background: active ? "var(--track)" : "transparent",
    borderColor: active ? (accent ?? "var(--fg)") : "var(--line)",
    color: active ? (accent ?? "var(--fg)") : "var(--dim)",
  };
}

/** 클릭할 수 없는 정보 칩 — 테두리도 cursor-pointer도 없어 PILL_BASE(컨트롤)와 구분된다. */
export const BADGE_BASE =
  "inline-flex items-center whitespace-nowrap rounded-[2px] px-2.5 py-1 font-mono-plex text-caption";

export function badgeStyle(strong: boolean, accent?: string): CSSProperties {
  return {
    background: "var(--track)",
    color: accent ?? (strong ? "var(--fg)" : "var(--mute)"),
  };
}
