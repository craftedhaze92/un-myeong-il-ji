"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import styles from "../saju.module.css";
import { GanjiColumn } from "../ui/ganji-column";
import { revealItem } from "./reveal-variants";
import type { SajuViewModel } from "../view-model";

export interface LuckBandsProps {
  viewModel: SajuViewModel;
}

/**
 * 결과 화면의 대운 띠 + 세운 띠. 대운 클릭 시 그 10년의 세운을 보여주는 selectedStartAge를
 * 여기서 소유한다 — 이 값을 쓰는 곳이 두 띠뿐이라 자연스러운 컴포넌트 경계다.
 * 주의: 풀이 패널(reading/flow-tab.tsx)의 대운 선택은 이것과 완전히 별개의 로컬 상태다 —
 * 하나로 합치면 두 패널의 대운 선택이 서로를 움직이게 되어 동작이 바뀐다.
 */
export function LuckBands({ viewModel }: LuckBandsProps) {
  const [selectedStartAge, setSelectedStartAge] = useState(
    viewModel.luck.find((l) => l.current)?.startAge ?? viewModel.luck[0]?.startAge ?? 0,
  );
  const selectedLuck =
    viewModel.luck.find((l) => l.startAge === selectedStartAge) ?? viewModel.luck[0];

  return (
    <>
      <motion.div
        variants={revealItem}
        className="rounded-[3px] border border-line bg-surface p-5 sm:px-7 sm:pt-[26px] sm:pb-5"
      >
        <div className="mb-4.5 flex flex-wrap items-baseline justify-between gap-5">
          <h2 className="m-0 font-batang text-card-title font-bold">대운 — 10년의 계절</h2>
          <span className="font-mono-plex text-body tracking-[0.12em] text-dim">
            {viewModel.luckNote}
          </span>
        </div>
        <div className={cn(styles.luckScroll, "flex gap-2.5 overflow-x-auto pb-3")}>
          {viewModel.luck.map((l, i) => (
            <GanjiColumn
              key={i}
              topLabel={String(l.startAge)}
              cell={l}
              current={l.current}
              selected={l.startAge === selectedStartAge}
              onClick={() => setSelectedStartAge(l.startAge)}
              accentColor={l.color}
              selectionLayoutId="daeun-selected"
            />
          ))}
        </div>
        <div className="flex gap-2 pt-1 font-mono-plex text-body tracking-[0.08em] text-mute">
          {viewModel.luckFoot}
        </div>
      </motion.div>

      <motion.div
        variants={revealItem}
        className="mt-5 rounded-[3px] border border-line bg-surface p-5 sm:px-7 sm:pt-[26px] sm:pb-5"
      >
        <div className="mb-4.5 flex flex-wrap items-baseline justify-between gap-5">
          <h2 className="m-0 font-batang text-card-title font-bold">세운 — 올해를 중심으로</h2>
          {selectedLuck && (
            <span className="font-mono-plex text-body tracking-[0.12em] text-dim">
              {selectedLuck.gz} 대운 · {selectedLuck.startAge}–{selectedLuck.endAge}세 ·{" "}
              {selectedLuck.seun[0]?.year}–{selectedLuck.seun.at(-1)?.year}년
            </span>
          )}
        </div>
        <div className={cn(styles.luckScroll, "flex gap-2.5 overflow-x-auto pb-3")}>
          {(selectedLuck?.seun ?? []).map((s, i) => (
            <GanjiColumn
              key={i}
              topLabel={String(s.year)}
              cell={s}
              current={s.current}
              accentColor={s.color}
            />
          ))}
        </div>
      </motion.div>
    </>
  );
}
