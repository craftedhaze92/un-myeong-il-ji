"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import { Tooltip } from "radix-ui";
import { ElementsColumn } from "./result/elements-column";
import { PillarsGrid } from "./result/pillars-grid";
import { revealContainer, revealItem } from "./result/reveal-variants";
import { LuckBands } from "./result/luck-bands";
import { YongsinSinsalColumn } from "./result/yongsin-sinsal-column";
import type { SinSalCombinedVM, SinSalDetailVM } from "./reading-view-model";
import type { SajuViewModel } from "./view-model";

export interface ResultPanelProps {
  viewModel: SajuViewModel;
  /** 풀이(명식 탭)에 있던 신살 상세 — "신살 — 특별한 자리" 카드 옆으로 옮겨와 여기서만 그린다 */
  sinsalDetails: SinSalDetailVM[];
  /** 신살이 2개 이상일 때만 오는 길신/흉신 조합 요약 (sin_sal.ts#interpretBySinSal) */
  sinsalCombined?: SinSalCombinedVM;
  onReset: () => void;
}

/**
 * 명식 카드·오행 레이더·십성·신살·용신·대운 띠 — saju-app.tsx에 있던 결과 화면을
 * 그대로 옮긴 것. 입력 폼(saju-app.tsx)과 풀이 패널(reading-panel.tsx)에서 분리해
 * 파일 하나가 3000줄을 넘기지 않게 한다.
 */
export function ResultPanel({
  viewModel,
  sinsalDetails,
  sinsalCombined,
  onReset,
}: ResultPanelProps) {
  // 오른쪽 열(용신 + 신살 카드)의 높이를 왼쪽 열(오행과 십성 + 신강신약)에 맞춘다.
  // 순수 CSS(flex:1 + min-height:0 + overflow:auto)만으로는 "형제 컬럼 높이만큼만
  // 채우고 넘치면 스크롤"을 만들 수 없다 — 이 섹션 전체가 페이지 흐름 속 auto-height라
  // 어느 쪽도 기준이 될 '정해진 높이'가 없기 때문에(flex-grow가 채울 대상이 없으면
  // 그냥 내용 높이만큼 늘어난다), ResizeObserver로 왼쪽 열의 실제 렌더 높이를 재서
  // 오른쪽 열에 명시적 height로 지정해줘야 그 안의 overflow:auto가 실제로 작동한다.
  // lg 미만에서는 두 열이 세로로 쌓이므로 이 높이를 적용하지 않는다(아래 lg: 접두사).
  const leftColRef = useRef<HTMLDivElement>(null);
  const [leftColHeight, setLeftColHeight] = useState<number>();

  useLayoutEffect(() => {
    const el = leftColRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (height) setLeftColHeight(height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tooltip.Provider delayDuration={200}>
      <motion.section
        className="umij-container"
        variants={revealContainer}
        initial="hidden"
        animate="show"
      >
      <motion.div
        variants={revealItem}
        className="flex flex-wrap items-end justify-between gap-8 py-10 pb-8 sm:py-[54px] sm:pb-8"
      >
        <div>
          <h1
            className="mb-2.5 font-myeongjo text-hero font-extrabold tracking-[-0.01em]"
            style={{ color: viewModel.myColor }}
          >
            {viewModel.headline}
          </h1>
          <p className="m-0 text-body-lg text-dim">{viewModel.headlineSub}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono-plex text-body tracking-[0.13em] text-dim">
            {viewModel.birthLine}
          </span>
          <motion.button
            onClick={onReset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="cursor-pointer rounded-[2px] border border-line bg-transparent px-4 py-2.5 text-[13px] text-dim hover:text-fg"
          >
            다시 입력
          </motion.button>
        </div>
      </motion.div>

      <PillarsGrid viewModel={viewModel} />

      <motion.div
        variants={revealItem}
        className="flex flex-col gap-5 pb-5 lg:flex-row lg:items-start"
      >
        <div ref={leftColRef} className="flex min-h-0 flex-col gap-5 lg:flex-[1.05]">
          <ElementsColumn viewModel={viewModel} />
        </div>

        <div
          className="flex min-h-0 flex-col gap-5 lg:h-[var(--left-col-h)] lg:flex-1"
          style={{ "--left-col-h": leftColHeight ? `${leftColHeight}px` : undefined } as CSSProperties}
        >
          <YongsinSinsalColumn
            viewModel={viewModel}
            sinsalDetails={sinsalDetails}
            sinsalCombined={sinsalCombined}
          />
        </div>
      </motion.div>

      <LuckBands viewModel={viewModel} />
      </motion.section>
    </Tooltip.Provider>
  );
}
