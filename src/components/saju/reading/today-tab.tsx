"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { SajuData } from "@/types";
import {
  recommendTaekil,
  type TaekilPurpose,
} from "@/lib/taekil_recommendation";
import { buildTodayViewModel } from "../today-view-model";
import { loadJournalEntry, saveJournalEntry } from "../local-data";
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

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const PURPOSES: TaekilPurpose[] = [
  "계약",
  "이사",
  "개업",
  "혼인",
  "여행",
  "입학",
  "수술",
];
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 풀이 패널의 "오늘" 탭 — 오늘/어제/내일 일진, 길한/주의 시간대, 12시진을 보여준다. */
export function TodayTab({ saju }: TodayTabProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [purpose, setPurpose] = useState<TaekilPurpose>("계약");
  const [journal, setJournal] = useState("");
  const [journalNotice, setJournalNotice] = useState("");
  const selectedKey = dateKey(selectedDate);
  const profileKey = saju.solarBirthDate;

  // buildReadingViewModel과 달리 탭이 선택됐을 때만, dayOffset이 바뀔 때만 다시 계산한다 —
  // analyzeIljin·getDailyFortune·getDailySiUn을 매 렌더 다시 부르지 않는다.
  const vm = useMemo(
    () => buildTodayViewModel(saju, selectedDate),
    [saju, selectedDate],
  );

  const calendar = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const recommendation = recommendTaekil(
      saju,
      purpose,
      start,
      end,
      end.getDate(),
    );
    const scores = new Map(
      recommendation.recommendations.map((item) => [dateKey(item.date), item]),
    );
    const gridStart = addDays(start, -start.getDay());
    const days = Array.from({ length: 42 }, (_, index) =>
      addDays(gridStart, index),
    );
    return { year, month, days, scores, advice: recommendation.generalAdvice };
  }, [calendarMonth, purpose, saju]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setJournal(
          loadJournalEntry(localStorage, profileKey, selectedKey)?.text ?? "",
        );
      } catch {
        setJournal("");
      }
      setJournalNotice("");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [profileKey, selectedKey]);

  const moveSelected = (days: number) => {
    const next = addDays(selectedDate, days);
    setSelectedDate(next);
    setCalendarMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  return (
    <div className="flex flex-col gap-5.5">
      <SectionCard
        title={`${vm.dayPillar}일 · ${vm.ratingLabel}`}
        subtitle={vm.dateLabel}
        titleRight={
          <div className="flex gap-2">
            <motion.button
              onClick={() => moveSelected(-1)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={PILL_BASE}
              style={pillStyle(false)}
            >
              ← 어제
            </motion.button>
            <motion.button
              onClick={() => {
                const today = new Date();
                setSelectedDate(today);
                setCalendarMonth(
                  new Date(today.getFullYear(), today.getMonth(), 1),
                );
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={PILL_BASE}
              style={pillStyle(dateKey(selectedDate) === dateKey(new Date()))}
            >
              오늘
            </motion.button>
            <motion.button
              onClick={() => moveSelected(1)}
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
        <div className="text-body text-dim leading-[1.75]">
          {vm.dailyAdvice}
        </div>
        <div className="text-small text-mute mt-2">
          {vm.twelveGodLabel} · {vm.twelveGodDescription}
        </div>
        <div className="text-small text-mute mt-1">
          {vm.relationDescription}
        </div>
        {vm.specialMeaning && (
          <div className="text-small text-fg mt-1">✦ {vm.specialMeaning}</div>
        )}
        <div className="text-small text-mute mt-3">
          길한 방향: {vm.luckyDirection} · 행운의 색: {vm.luckyColor}
        </div>
      </SectionCard>

      <SectionCard
        title="월간 운세 달력 · 목적별 길일"
        subtitle="검증된 절기 기준 십이신과 내 일지의 합·충을 바탕으로 비교합니다. 중요한 결정은 현실 조건과 전문가 판단을 함께 확인하세요."
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="이전 달"
              onClick={() =>
                setCalendarMonth(
                  (value) =>
                    new Date(value.getFullYear(), value.getMonth() - 1, 1),
                )
              }
              className={PILL_BASE}
              style={pillStyle(false)}
            >
              ←
            </button>
            <strong className="font-mono-plex text-body">
              {calendar.year}.{String(calendar.month + 1).padStart(2, "0")}
            </strong>
            <button
              type="button"
              aria-label="다음 달"
              onClick={() =>
                setCalendarMonth(
                  (value) =>
                    new Date(value.getFullYear(), value.getMonth() + 1, 1),
                )
              }
              className={PILL_BASE}
              style={pillStyle(false)}
            >
              →
            </button>
          </div>
          <label className="text-small text-mute flex items-center gap-2">
            목적
            <select
              value={purpose}
              onChange={(event) =>
                setPurpose(event.target.value as TaekilPurpose)
              }
              className="border-line bg-surface text-fg rounded-[2px] border px-3 py-2"
            >
              {PURPOSES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="grid grid-cols-7 gap-1"
          role="grid"
          aria-label={`${calendar.year}년 ${calendar.month + 1}월`}
        >
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="text-caption text-mute py-1 text-center"
            >
              {weekday}
            </div>
          ))}
          {calendar.days.map((date) => {
            const key = dateKey(date);
            const item = calendar.scores.get(key);
            const inMonth = date.getMonth() === calendar.month;
            const selected = key === selectedKey;
            return (
              <button
                type="button"
                role="gridcell"
                aria-selected={selected}
                key={key}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "border-line min-h-14 cursor-pointer rounded-[2px] border p-1 text-left transition-colors",
                  selected ? "border-fg bg-track" : "bg-transparent",
                  !inMonth && "opacity-30",
                )}
              >
                <span className="text-small block">{date.getDate()}</span>
                {inMonth && item && (
                  <span
                    className={cn(
                      "text-micro",
                      item.score >= 70
                        ? "text-fg"
                        : item.score < 40
                          ? "text-danger"
                          : "text-mute",
                    )}
                  >
                    {item.score}점
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-small text-mute mt-3 leading-[1.7]">
          {calendar.advice}
        </p>
        {purpose === "수술" && (
          <p className="text-small text-danger mt-2">
            수술 날짜는 의료진의 판단과 치료 시급성이 우선입니다. 이 달력은 의료
            조언이 아닙니다.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title={`${vm.dateLabel} 나의 기록`}
        subtitle="운세와 실제 하루를 함께 적어두면 내게 맞는 패턴을 돌아볼 수 있습니다. 기록은 이 브라우저에만 저장됩니다."
      >
        <textarea
          value={journal}
          onChange={(event) => setJournal(event.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="예정, 선택, 실제로 느낀 점을 적어보세요."
          className="border-line bg-surface text-body text-fg w-full resize-y rounded-[2px] border p-3 leading-[1.7]"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              try {
                saveJournalEntry(
                  localStorage,
                  profileKey,
                  selectedKey,
                  journal,
                );
                setJournalNotice(
                  journal.trim() ? "저장했습니다." : "기록을 삭제했습니다.",
                );
              } catch {
                setJournalNotice("브라우저 저장소를 사용할 수 없습니다.");
              }
            }}
            className={PILL_BASE}
            style={pillStyle(true)}
          >
            기록 저장
          </button>
          {journalNotice && (
            <span className="text-small text-mute">{journalNotice}</span>
          )}
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
              <div className="text-small text-mute">
                오늘은 특별히 길한 시간대가 없습니다.
              </div>
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
              <div className="text-small text-mute">
                오늘은 특별히 주의할 시간대가 없습니다.
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="적합한 활동 · 피해야 할 활동">
        <div className="mb-3 flex flex-wrap gap-2">
          {vm.suitableActivities.map((a, i) => (
            <span
              key={`s-${i}`}
              className={BADGE_BASE}
              style={badgeStyle(true)}
            >
              {a}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {vm.unsuitableActivities.map((a, i) => (
            <span
              key={`u-${i}`}
              className={BADGE_BASE}
              style={badgeStyle(true, "var(--danger)")}
            >
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
        <div
          className={cn("flex gap-2 overflow-x-auto overflow-y-hidden pb-1")}
        >
          {vm.hours.map((h, i) => (
            <div
              key={i}
              className="flex-[0_0_132px] rounded px-3 py-2.5"
              style={{
                border: `1px solid ${h.isNow ? "var(--fg)" : "var(--line)"}`,
                background: h.isNow
                  ? "color-mix(in srgb, var(--fg) 8%, transparent)"
                  : "transparent",
              }}
            >
              <div
                className={cn(
                  "font-mono-plex text-small",
                  h.isNow ? "font-bold" : "font-normal",
                )}
              >
                {h.branchName} {h.hourRange}
              </div>
              <div className="text-caption text-mute mt-1">{h.ganjiName}</div>
              {h.luckyActivity && (
                <div className="text-caption text-dim mt-1">
                  추천: {h.luckyActivity}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
