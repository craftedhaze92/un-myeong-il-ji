"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { SajuData } from "@/types";
import { buildTodayViewModel } from "../today-view-model";
import { SectionCard } from "../ui/section-card";
import { ScoreBar } from "../ui/score-bar";
import { BADGE_BASE, badgeStyle, PILL_BASE, pillStyle } from "./chip-styles";

export interface TodayTabProps {
  saju: SajuData;
}

/** dayOffset(0=오늘, -1=어제, +1=내일)만큼 옮긴 로컬 자정 Date. */
function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** 풀이 패널의 "오늘" 탭 — 오늘/어제/내일 일진, 길한/주의 시간대, 12시진을 보여준다. */
export function TodayTab({ saju }: TodayTabProps) {
  const [dayOffset, setDayOffset] = useState(0);

  // buildReadingViewModel과 달리 탭이 선택됐을 때만, dayOffset이 바뀔 때만 다시 계산한다 —
  // analyzeIljin·getDailyFortune·getDailySiUn을 매 렌더 다시 부르지 않는다.
  const vm = useMemo(
    () => buildTodayViewModel(saju, addDays(new Date(), dayOffset)),
    [saju, dayOffset],
  );

  return (
    <div className="flex flex-col gap-5.5">
      <SectionCard
        title={`${vm.dayPillar}일 · ${vm.ratingLabel}`}
        subtitle={vm.dateLabel}
        titleRight={
          <div className="flex gap-2">
            <motion.button
              onClick={() => setDayOffset((v) => v - 1)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={PILL_BASE}
              style={pillStyle(false)}
            >
              ← 어제
            </motion.button>
            <motion.button
              onClick={() => setDayOffset(0)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={PILL_BASE}
              style={pillStyle(dayOffset === 0)}
            >
              오늘
            </motion.button>
            <motion.button
              onClick={() => setDayOffset((v) => v + 1)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={PILL_BASE}
              style={pillStyle(false)}
            >
              내일 →
            </motion.button>
          </div>
        }
      >
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {vm.scores.map((s) => (
            <ScoreBar key={s.label} label={s.label} score={s.score} />
          ))}
        </div>
        <div className="text-body leading-[1.75] text-dim">{vm.dailyAdvice}</div>
        <div className="mt-2 text-small text-mute">
          {vm.twelveGodLabel} · {vm.twelveGodDescription}
        </div>
        <div className="mt-1 text-small text-mute">{vm.relationDescription}</div>
        {vm.specialMeaning && <div className="mt-1 text-small text-fg">✦ {vm.specialMeaning}</div>}
        <div className="mt-3 text-small text-mute">
          길한 방향: {vm.luckyDirection} · 행운의 색: {vm.luckyColor}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-5.5 md:grid-cols-2">
        <SectionCard title="길한 시간대">
          <div className="flex flex-col gap-2">
            {vm.luckyHours.map((h, i) => (
              <div key={i} className="text-body text-dim">
                {h.hour} — {h.reason}
              </div>
            ))}
            {vm.luckyHours.length === 0 && (
              <div className="text-small text-mute">오늘은 특별히 길한 시간대가 없습니다.</div>
            )}
          </div>
        </SectionCard>
        <SectionCard title="주의할 시간대">
          <div className="flex flex-col gap-2">
            {vm.cautiousHours.map((h, i) => (
              <div key={i} className="text-body text-danger">
                {h.hour} — {h.reason}
              </div>
            ))}
            {vm.cautiousHours.length === 0 && (
              <div className="text-small text-mute">오늘은 특별히 주의할 시간대가 없습니다.</div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="적합한 활동 · 피해야 할 활동">
        <div className="mb-3 flex flex-wrap gap-2">
          {vm.suitableActivities.map((a, i) => (
            <span key={`s-${i}`} className={BADGE_BASE} style={badgeStyle(true)}>
              {a}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {vm.unsuitableActivities.map((a, i) => (
            <span key={`u-${i}`} className={BADGE_BASE} style={badgeStyle(true, "var(--danger)")}>
              {a}
            </span>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="운세 항목별">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {vm.aspects.map((a) => (
            <div key={a.label} className="text-small text-dim">
              <span className="text-mute">{a.label}:</span> {a.text}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="오늘의 12시진">
        <div className={cn("flex gap-2 overflow-x-auto overflow-y-hidden pb-1")}>
          {vm.hours.map((h, i) => (
            <div
              key={i}
              className="flex-[0_0_132px] rounded px-3 py-2.5"
              style={{
                border: `1px solid ${h.isNow ? "var(--fg)" : "var(--line)"}`,
                background: h.isNow ? "color-mix(in srgb, var(--fg) 8%, transparent)" : "transparent",
              }}
            >
              <div className={cn("font-mono-plex text-small", h.isNow ? "font-bold" : "font-normal")}>
                {h.branchName} {h.hourRange}
              </div>
              <div className="mt-1 text-caption text-mute">{h.ganjiName}</div>
              {h.luckyActivity && (
                <div className="mt-1 text-caption text-dim">추천: {h.luckyActivity}</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
