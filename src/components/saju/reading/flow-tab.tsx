"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { DaeUnPeriod } from "@/lib/dae_un";
import { selectIsDark, useThemeStore } from "@/store/theme-store";
import type { SajuData } from "@/types";
import { elementColor } from "../constants";
import {
  buildDaeunDetailViewModel,
  buildSeyunDetailViewModel,
  buildSeyunSpark,
  buildTimingViewModel,
  buildWolunDetailViewModel,
  DECISION_TYPES,
  type ReadingVM,
} from "../reading-view-model";
import { BulletList } from "../ui/bullet-list";
import { SectionCard } from "../ui/section-card";
import { ScoreBar } from "../ui/score-bar";
import { BADGE_BASE, badgeStyle, PILL_BASE, pillStyle } from "./chip-styles";

export interface FlowTabProps {
  saju: SajuData;
  daeUn: DaeUnPeriod[];
  vm: ReadingVM;
}

/**
 * 풀이 패널의 "흐름" 탭 — 대운·세운·월운·시기 조언을 하나의 캐스케이드로 보여준다.
 * 대운 pill 선택이 세운·월운·시기 조언의 기준 시점을 함께 이동시키므로(selectDaeun),
 * 이 탭 하나가 이번 리팩토링에서 유일하게 쪼개지지 않고 남는다 — 파일이 크지만
 * 4개 선택 상태와 6개 파생값이 서로 의존해 나누면 오히려 회귀 위험이 커진다.
 *
 */
export function FlowTab({ saju, daeUn, vm }: FlowTabProps) {
  const dark = useThemeStore(selectIsDark);
  const [selectedStartAge, setSelectedStartAge] = useState(
    vm.flow.selectedDaeun?.startAge ?? vm.flow.daeunOptions[0]?.startAge ?? 0,
  );
  const [selectedYear, setSelectedYear] = useState(vm.flow.selectedSeyun.year);
  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date().getMonth() + 1,
  );
  const [selectedDecision, setSelectedDecision] = useState<
    (typeof DECISION_TYPES)[number] | null
  >(null);

  const selectedDaeunOption =
    vm.flow.daeunOptions.find((o) => o.startAge === selectedStartAge) ?? null;

  // 대운 pill을 고르면 세운·월운·시기 조언이 전부 그 구간을 따라가도록 한 캐스케이드의
  // 시작점 — 대운 → 세운 → 월운 → 시기 조언 순으로 아래 값들이 파생된다.
  function selectDaeun(startAge: number) {
    setSelectedStartAge(startAge);
    const option = vm.flow.daeunOptions.find((o) => o.startAge === startAge);
    if (!option) return;
    setSelectedYear(option.isCurrent ? vm.flow.nowYear : option.startYear);
  }

  const daeunDetail = useMemo(
    () => buildDaeunDetailViewModel(saju, daeUn, selectedStartAge),
    [saju, daeUn, selectedStartAge],
  );
  // 세운 스파크는 선택된 대운의 10년 구간을 그린다 — 대운을 바꾸면 스파크 범위도
  // 함께 이동한다(대운 선택이 세운에 전혀 연결되지 않던 버그 수정).
  const seyunSpark = useMemo(
    () =>
      selectedDaeunOption
        ? buildSeyunSpark(
            saju,
            selectedDaeunOption.startYear,
            selectedDaeunOption.endYear,
            vm.flow.nowYear,
          )
        : vm.flow.seyunSpark,
    [saju, selectedDaeunOption, vm.flow.nowYear, vm.flow.seyunSpark],
  );
  const seyunDetail = useMemo(
    () => buildSeyunDetailViewModel(saju, selectedYear),
    [saju, selectedYear],
  );
  const wolunDetail = useMemo(
    () => buildWolunDetailViewModel(saju, selectedYear, selectedMonth),
    [saju, selectedYear, selectedMonth],
  );
  // 시기 조언의 분석 기준 시점 — 대운/세운/월운에서 고른 시점을 그대로 물려받는다.
  // 예전엔 이 값 없이 항상 "오늘"을 기준으로 계산해, 대운/세운을 바꿔도 시기 조언은
  // 고정돼 있던 버그가 있었다.
  const timingStart = useMemo(
    () => new Date(selectedYear, selectedMonth - 1, 1),
    [selectedYear, selectedMonth],
  );
  // 결정 타입을 고르기 전까지는 계산하지 않는다 — analyzeTimingAdvice가 12개월 예보 +
  // 3년 전망을 매번 새로 계산하는 비교적 무거운 함수라서다.
  const timingVm = useMemo(
    () =>
      selectedDecision
        ? buildTimingViewModel(saju, selectedDecision, timingStart)
        : null,
    [saju, selectedDecision, timingStart],
  );

  return (
    <div className="flex flex-col gap-5.5">
      <SectionCard title="대운 — 10년의 계절">
        <div className="mb-4.5 flex flex-wrap gap-2">
          {vm.flow.daeunOptions.map((o) => (
            <motion.button
              key={o.startAge}
              onClick={() => selectDaeun(o.startAge)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={PILL_BASE}
              style={pillStyle(
                o.startAge === selectedStartAge,
                elementColor(o.element, dark),
              )}
            >
              {o.startAge}–{o.endAge} {o.pillar}
              {o.isCurrent ? " ·현재" : ""}
            </motion.button>
          ))}
        </div>
        {daeunDetail && (
          <div>
            <div className="mb-2.5 flex flex-wrap items-baseline gap-3">
              <span className="font-myeongjo text-section font-extrabold">
                {daeunDetail.pillar}
              </span>
              <span className="font-mono-plex text-small text-mute">
                {daeunDetail.overall} · {daeunDetail.score}점 · 조화도{" "}
                {daeunDetail.harmonyScore}
              </span>
            </div>
            <div className="mb-3.5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <ScoreBar label="직업운" score={daeunDetail.aspects.career} />
              <ScoreBar label="재물운" score={daeunDetail.aspects.wealth} />
              <ScoreBar label="건강운" score={daeunDetail.aspects.health} />
              <ScoreBar
                label="인간관계운"
                score={daeunDetail.aspects.relationship}
              />
            </div>
            <div className="text-body text-dim mb-2.5 leading-[1.75]">
              {daeunDetail.summary}
            </div>
            <BulletList items={daeunDetail.opportunities} tone="positive" />
            <BulletList items={daeunDetail.challenges} tone="negative" />
            <BulletList items={daeunDetail.advice} />
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={
          selectedDaeunOption && !selectedDaeunOption.isCurrent
            ? `세운 — ${selectedDaeunOption.startYear}–${selectedDaeunOption.endYear}년 (선택한 대운)`
            : "세운 — 올해를 중심으로"
        }
      >
        <div className="mb-3 flex h-[72px] items-end gap-1.5">
          {seyunSpark.map((point) => (
            <motion.button
              key={point.year}
              onClick={() => setSelectedYear(point.year)}
              title={`${point.year} ${point.pillar} · ${point.score}점${point.isCurrent ? " · 올해" : ""}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-1 cursor-pointer flex-col items-center justify-end gap-1 border-none bg-transparent p-0"
            >
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full origin-bottom rounded-sm"
                style={{
                  height: Math.max(4, (point.score / 100) * 48),
                  background:
                    point.year === selectedYear ? "var(--fg)" : "var(--track)",
                }}
              />
              <span
                className="font-mono-plex text-micro"
                style={{
                  color:
                    point.year === selectedYear ? "var(--fg)" : "var(--mute)",
                  fontWeight: point.isCurrent ? 700 : 400,
                  textDecoration: point.isCurrent ? "underline" : "none",
                }}
              >
                {point.year}
              </span>
            </motion.button>
          ))}
        </div>

        <div className="mb-2.5 flex flex-wrap items-baseline gap-3">
          <span className="font-myeongjo text-section font-extrabold">
            {seyunDetail.pillar}
          </span>
          <span className="font-mono-plex text-small text-mute">
            {seyunDetail.year}년 · 만 {seyunDetail.age}세 ·{" "}
            {seyunDetail.overall} · {seyunDetail.score}점
          </span>
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <ScoreBar label="사업운" score={seyunDetail.aspects.career} />
          <ScoreBar label="재물운" score={seyunDetail.aspects.wealth} />
          <ScoreBar label="건강운" score={seyunDetail.aspects.health} />
          <ScoreBar
            label="인간관계운"
            score={seyunDetail.aspects.relationship}
          />
        </div>
        <div className="text-body text-dim mb-2.5 leading-[1.75]">
          {seyunDetail.summary}
        </div>
        <BulletList items={seyunDetail.opportunities} tone="positive" />
        <BulletList items={seyunDetail.challenges} tone="negative" />
        <BulletList items={seyunDetail.advice} />

        <div className="mt-3 overflow-x-auto overflow-y-hidden">
          <div className="grid min-w-[420px] grid-cols-12 gap-1">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
              const favorable = seyunDetail.favorableMonths.includes(month);
              const cautious = seyunDetail.cautiousMonths.includes(month);
              const selected = month === selectedMonth;
              return (
                <motion.button
                  key={month}
                  type="button"
                  onClick={() => setSelectedMonth(month)}
                  aria-pressed={selected}
                  title={
                    favorable ? "유리한 달" : cautious ? "주의할 달" : undefined
                  }
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className="font-mono-plex text-micro cursor-pointer rounded-[2px] border py-1.5 text-center"
                  style={{
                    color: favorable
                      ? "var(--fg)"
                      : cautious
                        ? "var(--danger)"
                        : "var(--mute)",
                    background: favorable ? "var(--track)" : "transparent",
                    borderColor: cautious ? "var(--danger)" : "var(--line)",
                    outline: selected ? "2px solid var(--fg)" : "none",
                    outlineOffset: -2,
                  }}
                >
                  {month}월
                </motion.button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="월운 — 이 달의 결">
        <div className="mb-2.5 flex flex-wrap items-baseline gap-3">
          <span className="font-myeongjo text-section font-extrabold">
            {wolunDetail.pillar}
          </span>
          <span className="font-mono-plex text-small text-mute">
            {wolunDetail.year}년 {wolunDetail.month}월 · {wolunDetail.overall} ·{" "}
            {wolunDetail.score}점
          </span>
        </div>
        <p className="text-caption text-mute mb-3">
          {wolunDetail.basisLabel}입니다. 양력 한 달 안에서도 절입 순간 전후로
          월주가 바뀔 수 있습니다.
        </p>
        <div className="mb-3.5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <ScoreBar label="직업운" score={wolunDetail.aspects.career} />
          <ScoreBar label="재물운" score={wolunDetail.aspects.wealth} />
          <ScoreBar label="건강운" score={wolunDetail.aspects.health} />
          <ScoreBar
            label="인간관계운"
            score={wolunDetail.aspects.relationship}
          />
        </div>
        <div className="text-body text-dim mb-3 leading-[1.75]">
          {wolunDetail.balanceDescription}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {wolunDetail.keywords.map((k, i) => (
            <span
              key={i}
              className={BADGE_BASE}
              style={badgeStyle(true, elementColor(wolunDetail.element, dark))}
            >
              {k}
            </span>
          ))}
        </div>

        <div className="font-batang text-small mb-1 font-bold">
          이 달의 기회 · 주의
        </div>
        <BulletList items={wolunDetail.opportunities} tone="positive" />
        <BulletList items={wolunDetail.cautions} tone="negative" />
        <div className="font-batang text-small mt-2.5 mb-1 font-bold">
          하면 좋은 일 · 피할 일
        </div>
        <BulletList items={wolunDetail.doList} tone="positive" />
        <BulletList items={wolunDetail.dontList} tone="negative" />

        <div className="text-body text-mute mt-1">
          유리한 방위 {wolunDetail.direction} · 색 {wolunDetail.color}
        </div>

        {(wolunDetail.luckyDates.length > 0 ||
          wolunDetail.unluckyDates.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {wolunDetail.luckyDates.map((d) => (
              <span
                key={`l-${d}`}
                className={BADGE_BASE}
                style={badgeStyle(true)}
              >
                길일 {d}일
              </span>
            ))}
            {wolunDetail.unluckyDates.map((d) => (
              <span
                key={`u-${d}`}
                className={BADGE_BASE}
                style={badgeStyle(true, "var(--danger)")}
              >
                흉일 {d}일
              </span>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="시기 조언">
        <div className="mb-4.5 flex flex-wrap gap-2">
          {DECISION_TYPES.map((d) => (
            <motion.button
              key={d}
              onClick={() =>
                setSelectedDecision((cur) => (cur === d ? null : d))
              }
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={PILL_BASE}
              style={pillStyle(selectedDecision === d)}
            >
              {d}
            </motion.button>
          ))}
        </div>

        {!timingVm && (
          <div className="text-small text-mute">
            결정 항목을 고르면 {selectedYear}년 {selectedMonth}월부터 3년의
            시기를 분석합니다. 위에서 대운·세운·월을 바꾸면 이 기준 시점도 함께
            이동합니다.
          </div>
        )}

        {timingVm && (
          <div className="flex flex-col gap-4.5">
            <div className="text-caption text-mute">
              기준 시점: {selectedYear}년 {selectedMonth}월
            </div>
            <div className="text-body text-dim leading-[1.75]">
              {timingVm.summary.overallAdvice}
            </div>
            <div className="text-small text-mute">
              {timingVm.summary.recommendationLabel}: {timingVm.summary.bestYear}
              년 {timingVm.summary.bestMonth}월(
              {timingVm.summary.bestSeason}) · 예상 시점{" "}
              {timingVm.summary.urgency}
            </div>
            {timingVm.summary.disclaimer && (
              <div className="border-danger text-caption text-dim border-l-2 pl-3 leading-[1.7]">
                {timingVm.summary.disclaimer}
              </div>
            )}

            <div>
              <div className="font-batang text-small mb-2 font-bold">
                {timingVm.summary.recommendationLabel}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {timingVm.optimalTiming.map((o, i) => (
                  <div key={o.yearMonth} className="border-line rounded-[2px] border p-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono-plex font-bold">
                        {i + 1}. {o.period}
                      </span>
                      <span className="text-caption text-mute">
                        {o.rating} · {o.score}점
                      </span>
                    </div>
                    <div className="text-caption text-mute mt-1">
                      월운 {o.scoreBreakdown.month} · 세운{" "}
                      {o.scoreBreakdown.seyun}
                      {o.scoreBreakdown.daeun !== undefined
                        ? ` · 대운 ${o.scoreBreakdown.daeun}`
                        : ""}
                    </div>
                    {o.yongsinSupport && (
                      <div className="text-small text-dim mt-1">
                        {o.yongsinSupport}
                      </div>
                    )}
                    <BulletList items={o.reasons} tone="positive" />
                    <BulletList items={o.cautions} tone="negative" />
                    {o.specificDates && o.specificDates.length > 0 && (
                      <div className="mt-2.5">
                        <div className="font-batang text-caption mb-1 font-bold">
                          월 안의 참고 날짜
                        </div>
                        {o.specificDates.map((date) => (
                          <div
                            key={date.dateLabel}
                            className="text-caption text-dim mb-1"
                          >
                            <span className="font-mono-plex font-bold">
                              {date.dateLabel}
                            </span>{" "}
                            · {date.dayPillar}일 · {date.score}점
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {timingVm.specificDateNotice && (
                <div className="text-caption text-mute mt-2">
                  {timingVm.specificDateNotice}
                </div>
              )}
            </div>

            <div>
              <div className="font-batang text-small mb-2 font-bold">
                주의 시기
              </div>
              {timingVm.timesToAvoid.length > 0 ? (
                timingVm.timesToAvoid.map((t) => (
                  <div key={t.yearMonth} className="text-small mb-1.5">
                    <span className="text-danger">
                      {t.period} · {t.score}점 ({t.severity})
                    </span>{" "}
                    <span className="text-dim">{t.reason}</span>
                    {t.alternatives.length > 0 && (
                      <span className="text-mute">
                        {" "}
                        — 대안: {t.alternatives.join(", ")}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-small text-mute">
                  분석 기간에 뚜렷한 주의 월이 없습니다.
                </div>
              )}
            </div>

            <div>
              <div className="font-batang text-small mb-2 font-bold">
                연도별 큰 흐름
              </div>
              <div className="grid gap-3.5 md:grid-cols-2">
                {timingVm.longTermOutlook.map((y) => (
                  <div key={y.year}>
                    <div className="font-mono-plex text-small mb-1 font-bold">
                      {y.year}년 · {y.overallRating} · {y.overallScore}점
                    </div>
                    <div className="text-caption text-mute mb-1">
                      상대적으로 좋은 달: {y.keyPeriods.join(", ")}
                    </div>
                    <BulletList items={y.majorOpportunities} tone="positive" />
                    <BulletList items={y.majorChallenges} tone="negative" />
                    {y.daeunInfluence && (
                      <div className="text-caption text-mute">
                        {y.daeunInfluence}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
