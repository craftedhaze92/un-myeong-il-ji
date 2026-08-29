"use client";

import { motion } from "motion/react";
import { Tooltip } from "radix-ui";
import { cn } from "@/lib/utils";
import type { GanjiCellVM } from "../view-model";

export interface GanjiColumnProps {
  /** 대운이면 시작 나이("10"), 세운이면 연도("2026") */
  topLabel: string;
  cell: GanjiCellVM;
  current: boolean;
  /** 현재 구간 강조에 쓸 색 (오행 고유색) */
  accentColor: string;
  /** 클릭 가능하게 하려면 넘긴다 — result-panel.tsx의 대운 띠처럼 사용자가 구간을 고를 때만. */
  onClick?: () => void;
  /** onClick과 함께 써서 "지금 보고 있는" 구간을 아웃라인으로 표시한다 (current와는 별개 개념). */
  selected?: boolean;
  /**
   * 같은 그룹(예: 대운 띠) 안의 GanjiColumn들이 공유하는 motion layoutId. 넘기면 selected가
   * 옮겨갈 때 아웃라인이 즉시 점프하지 않고 motion이 FLIP으로 슬라이드시킨다. 표시 전용
   * 인스턴스(onClick 없음, 예: 세운 띠)에는 넘기지 않는다.
   */
  selectionLayoutId?: string;
}

/**
 * 대운·세운이 공유하는 칸 — 위에서부터
 * [나이/연도] → [천간 십성] → [천간] → [지지] → [지지 십성] → [십이운성] → [십이신살].
 * result-panel.tsx의 대운 띠·세운 띠가 이 컴포넌트를 그대로 반복해 쓴다.
 *
 * 루트는 항상 button이다 — onClick을 안 넘기면 그냥 클릭해도 아무 일 없는 표시 전용 칸이 된다
 * (div/button 분기 대신 이 방식을 택해 태그별 prop 타입 불일치를 피했다). 클릭 불가능한 인스턴스는
 * tabIndex=-1로 탭 순서에서 뺀다.
 */
export function GanjiColumn({
  topLabel,
  cell,
  current,
  accentColor,
  onClick,
  selected,
  selectionLayoutId,
}: GanjiColumnProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={onClick ? selected : undefined}
      tabIndex={onClick ? undefined : -1}
      whileHover={onClick ? { scale: 1.03 } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      className={cn(
        "relative flex flex-[0_0_84px] flex-col items-center gap-1.5 rounded px-2 pt-3 pb-3.5 sm:flex-[0_0_108px]",
        onClick ? "cursor-pointer" : "cursor-default",
      )}
      style={{
        border: current ? `1px dashed ${accentColor}` : "1px solid var(--line)",
        background: current ? `color-mix(in srgb, ${accentColor} 10%, transparent)` : "transparent",
      }}
    >
      {selected && (
        <motion.div
          layoutId={selectionLayoutId}
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
          className="pointer-events-none absolute inset-0 rounded"
          style={{ outline: "2px solid var(--fg)", outlineOffset: -2 }}
        />
      )}

      <div
        className="font-mono-plex text-subtitle font-bold"
        style={{ color: current ? accentColor : "var(--fg)" }}
      >
        {topLabel}
      </div>

      <div className="text-micro text-dim">{cell.stemGod}</div>
      <GanjiChip ch={cell.stem.ch} ko={cell.stem.ko} color={cell.stem.color} bg={cell.stem.bg} />
      <GanjiChip ch={cell.branch.ch} ko={cell.branch.ko} color={cell.branch.color} bg={cell.branch.bg} />
      <div className="text-micro text-dim">{cell.branchGod}</div>

      <div className="mt-1 flex flex-col items-center gap-0.5">
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span className="font-myeongjo text-micro text-fg">{cell.stage}</span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              side="top"
              sideOffset={6}
              className="z-50 max-w-[220px] rounded-[2px] border border-line bg-surface px-2.5 py-1.5 text-micro text-fg shadow-md"
            >
              {cell.stageDescription}
              <Tooltip.Arrow className="fill-surface" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
        <span className="text-micro text-mute">{cell.sinsal}</span>
      </div>
    </motion.button>
  );
}

function GanjiChip({
  ch,
  ko,
  color,
  bg,
}: {
  ch: string;
  ko: string;
  color: string;
  bg: string;
}) {
  return (
    <div
      className="flex size-9 flex-col items-center justify-center rounded leading-none sm:size-11"
      style={{ background: bg, border: `1px solid ${color}` }}
    >
      <span className="font-myeongjo text-[18px] font-extrabold sm:text-[22px]" style={{ color }}>
        {ch}
      </span>
      <span className="mt-0.5 text-[9px] opacity-85 sm:text-[10px]" style={{ color }}>
        {ko}
      </span>
    </div>
  );
}
