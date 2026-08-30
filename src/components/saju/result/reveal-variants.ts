import type { Variants } from "motion/react";

/**
 * 결과 화면 등장 연출 — 예전엔 saju.module.css의 키프레임(stamp/slotIn/fadeUp)과
 * result-panel.tsx 곳곳의 하드코딩된 1.1s~1.35s가 서로 암묵적으로만 맞춰져 있었다. motion의
 * staggerChildren으로 통합해 순서를 배열 인덱스에서 자동 계산하게 한다.
 *
 * result-panel.tsx와 result/pillars-grid.tsx가 공유한다.
 */
export const revealContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
export const revealItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
