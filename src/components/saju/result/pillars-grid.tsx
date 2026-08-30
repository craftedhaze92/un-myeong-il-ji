import { Tooltip } from "radix-ui";
import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import styles from "../saju.module.css";
import type { SajuViewModel } from "../view-model";

const pillarsGridVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.06 },
  },
};
function pillarColumnVariants(emphasize: boolean): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: emphasize ? 0.05 : 0 } },
  };
}
const cardSlotVariants: Variants = {
  hidden: { opacity: 0, scaleY: 0.55 },
  show: {
    opacity: 1,
    scaleY: 1,
    transition: { duration: 0.35, ease: "easeOut", delayChildren: 0.15 },
  },
};
const cardStampVariants: Variants = {
  hidden: { opacity: 0, y: -12, scale: 1.09, filter: "blur(7px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.18, 0.9, 0.24, 1] },
  },
};

export interface PillarsGridProps {
  viewModel: SajuViewModel;
}

/**
 * 결과 화면의 4기둥(연/월/일/시) 그리드 — result-panel.tsx의 revealContainer가 만드는
 * stagger 체인 안에서 pillarsGridVariants → pillarColumnVariants → cardSlotVariants →
 * cardStampVariants 4단으로 다시 쪼개져 기둥별·천간/지지별 등장을 어긋나게 만든다.
 * 이 파일의 루트 요소가 반드시 이 variants를 가진 motion.div여야 stagger 순서가
 * result-panel.tsx에서 뽑아내기 전과 동일하게 유지된다.
 */
export function PillarsGrid({ viewModel }: PillarsGridProps) {
  return (
    <motion.div
      variants={pillarsGridVariants}
      className="grid grid-rows-[auto_auto_auto_auto_auto_auto] gap-2 pt-1 pb-8 sm:gap-4 sm:pb-10"
      style={{ gridTemplateColumns: `repeat(${viewModel.colCount}, minmax(0, 1fr))` }}
    >
      {viewModel.pillars.map((p, i) => (
        <motion.div
          key={i}
          variants={pillarColumnVariants(p.size === 90)}
          className="row-span-6 grid grid-rows-subgrid gap-3"
        >
          <div className="flex items-baseline justify-between border-b border-line pb-2">
            <span className="font-myeongjo text-card-title" style={{ color: p.labelColor }}>
              {p.label}
            </span>
            <span
              className="hidden text-label tracking-[0.02em] sm:inline"
              style={{ color: p.labelColor }}
            >
              {p.labelEn}
            </span>
          </div>

          <motion.div variants={cardSlotVariants} className={styles.slot}>
            <motion.div
              variants={cardStampVariants}
              className={styles.stampCard}
              style={{
                background: p.stem.bg,
                border: `1px solid ${p.stem.line}`,
              }}
            >
              <div
                className={cn(
                  "flex h-16 items-center justify-center text-center font-myeongjo leading-none font-extrabold sm:h-[92px]",
                  p.size === 90 ? "text-ganji-day" : "text-ganji-else",
                )}
                style={{ color: p.stem.color, textShadow: `0 0 32px ${p.stem.glow}` }}
              >
                {p.stem.ch}
              </div>
              <div className="mt-4 flex flex-col items-center gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="font-mono-plex text-body whitespace-nowrap text-dim">
                  {p.stem.ko} {p.stem.el}
                </span>
                <span className="font-batang text-body whitespace-nowrap text-fg">
                  {p.stem.god}
                </span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div variants={cardSlotVariants} className={styles.slot}>
            <motion.div
              variants={cardStampVariants}
              className={styles.stampCard}
              style={{
                background: p.branch.bg,
                border: `1px solid ${p.branch.line}`,
              }}
            >
              <div
                className={cn(
                  "flex h-16 items-center justify-center text-center font-myeongjo leading-none font-extrabold sm:h-[92px]",
                  p.size === 90 ? "text-ganji-day" : "text-ganji-else",
                )}
                style={{ color: p.branch.color, textShadow: `0 0 32px ${p.branch.glow}` }}
              >
                {p.branch.ch}
              </div>
              <div className="mt-4 flex flex-col items-center gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="font-mono-plex text-body whitespace-nowrap text-dim">
                  {p.branch.ko} {p.branch.el}
                </span>
                <span className="font-batang text-body whitespace-nowrap text-fg">
                  {p.branch.god}
                </span>
              </div>
            </motion.div>
          </motion.div>

          <div className="text-center text-body tracking-[0.02em] text-dim">
            지장간{" "}
            <span className="font-myeongjo text-body-lg text-fg">{p.branch.hidden}</span>
          </div>

          {/* 십이운성은 일간 기준(봉법)이라 십이신살과 달리 일주 칸도 값이 있다 — 조건부 렌더
              없이 지장간 바로 아래에 둔다. 값이 없는 십이신살을 이 뒤(마지막 행)로 보내야
              일주 칸에서 빈 줄이 값들 사이에 끼지 않는다. 라벨은 대운·세운 칸(ganji-column.tsx)
              과 맞춰 붙이지 않고 값만 보여준다. */}
          <div className="text-center text-body tracking-[0.02em]">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <span className="cursor-help font-myeongjo text-body-lg text-fg">
                  {p.twelveStage}
                </span>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="top"
                  sideOffset={6}
                  className="z-50 max-w-[220px] rounded-[2px] border border-line bg-surface px-2.5 py-1.5 text-micro text-fg shadow-md"
                >
                  {p.twelveStageDescription}
                  <Tooltip.Arrow className="fill-surface" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>

          {/* 일주 칸은 twelveSinsal이 undefined라 내용만 비운다 — 마지막 행이라 비어도
              카드 맨 끝의 여백일 뿐 다른 값 사이에 끼지 않는다. subgrid 행 정렬을 맞추려면
              이 div 자체는 4개 기둥 모두에 항상 존재해야 한다(조건부로 div까지 없애면 일주 칸의
              이후 행이 한 칸씩 밀려 다른 기둥과 어긋난다 — 지금은 마지막 행이라 해당 없지만,
              뒤에 행이 추가되면 다시 문제가 되므로 이 div는 유지한다). */}
          <div className="text-center text-body tracking-[0.02em]">
            {p.twelveSinsal && (
              <span className="font-myeongjo text-body-lg text-fg">{p.twelveSinsal}</span>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
