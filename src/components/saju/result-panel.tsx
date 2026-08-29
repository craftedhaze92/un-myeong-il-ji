"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import styles from "./saju.module.css";
import { ElementCycle } from "./ui/element-cycle";
import { StrengthGauge } from "./ui/strength-gauge";
import { GanjiColumn } from "./ui/ganji-column";
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

  // 대운 띠에서 클릭한 구간 — 세운 띠는 이 구간의 10년을 그대로 보여준다. 기본값은 현재 대운.
  const [selectedStartAge, setSelectedStartAge] = useState(
    viewModel.luck.find((l) => l.current)?.startAge ?? viewModel.luck[0]?.startAge ?? 0,
  );
  const selectedLuck =
    viewModel.luck.find((l) => l.startAge === selectedStartAge) ?? viewModel.luck[0];

  return (
    <section className="umij-container">
      <div
        className={cn(styles.fadeUp, "flex flex-wrap items-end justify-between gap-8 py-10 pb-8 sm:py-[54px] sm:pb-8")}
        style={{ animationDelay: "1.1s" }}
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
          <button
            onClick={onReset}
            className="cursor-pointer rounded-[2px] border border-line bg-transparent px-4 py-2.5 text-[13px] text-dim hover:text-fg"
          >
            다시 입력
          </button>
        </div>
      </div>

      <div
        className="grid gap-2 pt-1 pb-8 sm:gap-4 sm:pb-10"
        style={{ gridTemplateColumns: `repeat(${viewModel.colCount}, minmax(0, 1fr))` }}
      >
        {viewModel.pillars.map((p, i) => (
          <div key={i} className="flex flex-col gap-3">
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

            <div className={styles.slot} style={{ animationDelay: `${p.slotDelay}ms` }}>
              <div
                className={styles.stampCard}
                style={{
                  background: p.stem.bg,
                  border: `1px solid ${p.stem.line}`,
                  animationDelay: `${p.delayA}ms`,
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
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="font-mono-plex text-body text-dim">
                    {p.stem.ko} {p.stem.el}
                  </span>
                  <span className="font-batang text-body text-fg">{p.stem.god}</span>
                </div>
              </div>
            </div>

            <div className={styles.slot} style={{ animationDelay: `${p.slotDelay}ms` }}>
              <div
                className={styles.stampCard}
                style={{
                  background: p.branch.bg,
                  border: `1px solid ${p.branch.line}`,
                  animationDelay: `${p.delayB}ms`,
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
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="font-mono-plex text-body text-dim">
                    {p.branch.ko} {p.branch.el}
                  </span>
                  <span className="font-batang text-body text-fg">{p.branch.god}</span>
                </div>
              </div>
            </div>

            <div className="text-center text-body tracking-[0.02em] text-dim">
              지장간{" "}
              <span className="font-myeongjo text-body-lg text-fg">{p.branch.hidden}</span>
            </div>
          </div>
        ))}
      </div>

      <div
        className={cn(styles.fadeUp, "flex flex-col gap-5 pb-5 lg:flex-row lg:items-start")}
        style={{ animationDelay: "1.2s" }}
      >
        <div ref={leftColRef} className="flex min-h-0 flex-col gap-5 lg:flex-[1.05]">
          <div className="flex flex-col rounded-[3px] border border-line bg-surface p-5 sm:px-7 sm:pt-[26px] sm:pb-[30px]">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="m-0 font-batang text-card-title font-bold">오행과 십성</h2>
            </div>
            <div className="grid flex-1 grid-cols-1 items-center gap-7 md:[grid-template-columns:minmax(200px,1fr)_1fr]">
              <ElementCycle cycle={viewModel.elementCycle} />
              <div className="flex flex-col gap-3.5">
                {viewModel.elementDetails.map((d) => (
                  <div key={d.key}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex size-[30px] items-center justify-center rounded font-myeongjo text-body font-bold text-bg opacity-85"
                          style={{ background: d.color }}
                        >
                          {d.ch}
                        </span>
                        <span className="font-batang text-body">{d.groupLabel}</span>
                      </div>
                      <span
                        className="rounded-full bg-track px-2 py-0.5 font-mono-plex text-micro"
                        style={{
                          color:
                            d.status === "발달"
                              ? "var(--fg)"
                              : d.status === "부족"
                                ? "var(--danger)"
                                : "var(--mute)",
                        }}
                      >
                        {d.status}
                      </span>
                    </div>
                    <div className="flex justify-end gap-3.5 font-mono-plex text-body text-dim">
                      {d.gods.map((g) => (
                        <span key={g.name}>
                          {g.name} {g.pct}%
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[3px] border border-line bg-surface p-5 sm:px-7 sm:pt-6 sm:pb-[26px]">
            <h2 className="mb-4 font-batang text-card-title font-bold">신강신약</h2>
            {viewModel.strengthGauge && <StrengthGauge gauge={viewModel.strengthGauge} />}
          </div>
        </div>

        <div
          className="flex min-h-0 flex-col gap-5 lg:h-[var(--left-col-h)] lg:flex-1"
          style={{ "--left-col-h": leftColHeight ? `${leftColHeight}px` : undefined } as CSSProperties}
        >
          <div
            className="rounded-[3px] p-5 sm:px-[26px] sm:py-6"
            style={{ border: `1px solid ${viewModel.yongLine}`, background: viewModel.yongBg }}
          >
            <h2 className="mb-3 whitespace-normal font-batang text-card-title font-bold sm:whitespace-nowrap">
              용신 — 필요한 것
            </h2>
            <div
              className="font-myeongjo text-[54px] leading-none font-extrabold"
              style={{ color: viewModel.yong.color, textShadow: `0 0 28px ${viewModel.yong.glow}` }}
            >
              {viewModel.yong.ch}
            </div>
            <div className="mt-3 text-body leading-[1.75] text-dim">{viewModel.yong.desc}</div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-5 sm:flex-row">
            <div className="flex min-h-0 flex-1 flex-col rounded-[3px] border border-line bg-surface p-5 sm:px-[26px] sm:py-6">
              <h2 className="mb-3.5 shrink-0 whitespace-normal font-batang text-card-title font-bold sm:whitespace-nowrap">
                신살 — 특별한 자리
              </h2>
              <div
                className={cn(
                  styles.sinsalScroll,
                  "flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1",
                )}
              >
                {viewModel.sinsal.map((s, i) => (
                  <div key={i}>
                    <div className="font-myeongjo text-subtitle font-bold">{s.name}</div>
                    <div className="text-body leading-[1.75] text-dim">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col rounded-[3px] border border-line bg-surface p-5 sm:px-[26px] sm:py-6">
              <h2 className="mb-3.5 shrink-0 whitespace-normal font-batang text-card-title font-bold sm:whitespace-nowrap">
                신살 상세
              </h2>
              <div
                className={cn(
                  styles.sinsalScroll,
                  "flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto pr-1",
                )}
              >
                {/* 예전엔 이 요약 블록이 스크롤 영역 밖(flexShrink: 0)에 별도로 있어서,
                    종합 조언 문구가 길어지면 카드 높이를 넘어 아래 콘텐츠와 겹쳐 보였다.
                    스크롤 영역 맨 앞 항목으로 옮겨 개별 신살 목록과 함께 스크롤되게 한다. */}
                {sinsalCombined && (
                  <div className="border-b border-line pb-3 text-body leading-[1.75] text-dim">
                    {sinsalCombined.blessingNames.length > 0 && (
                      <div>
                        <span className="text-mute">길신:</span>{" "}
                        {sinsalCombined.blessingNames.join(", ")}
                      </div>
                    )}
                    {sinsalCombined.warningNames.length > 0 && (
                      <div>
                        <span className="text-mute">흉신:</span>{" "}
                        {sinsalCombined.warningNames.join(", ")}
                      </div>
                    )}
                  </div>
                )}
                {sinsalDetails.map((s, i) => (
                  <div key={i}>
                    <div className="flex items-baseline gap-2 font-myeongjo text-label font-bold">
                      {s.name}({s.hanja})
                      <span className="font-mono-plex text-body text-mute">{s.typeLabel}</span>
                    </div>
                    <div className="mt-1 text-body leading-[1.75] text-dim">{s.description}</div>
                    {s.advice.length > 0 && (
                      <div className="mt-1 text-body leading-[1.75] text-mute">
                        조언: {s.advice.join(" · ")}
                      </div>
                    )}
                  </div>
                ))}
                {sinsalDetails.length === 0 && (
                  <div className="text-body text-mute">두드러진 신살이 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(styles.fadeUp, "rounded-[3px] border border-line bg-surface p-5 sm:px-7 sm:pt-[26px] sm:pb-5")}
        style={{ animationDelay: "1.3s" }}
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
            />
          ))}
        </div>
        <div className="flex gap-2 pt-1 font-mono-plex text-body tracking-[0.08em] text-mute">
          {viewModel.luckFoot}
        </div>
      </div>

      <div
        className={cn(styles.fadeUp, "mt-5 rounded-[3px] border border-line bg-surface p-5 sm:px-7 sm:pt-[26px] sm:pb-5")}
        style={{ animationDelay: "1.35s" }}
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
      </div>
    </section>
  );
}
