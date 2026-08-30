"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { selectIsDark, useThemeStore } from "@/store/theme-store";
import type { SajuData } from "@/types";
import { elementColor } from "../constants";
import { buildPungsuViewModel } from "../reading-view-model";
import { BulletList } from "../ui/bullet-list";
import { SectionCard } from "../ui/section-card";
import { PILL_BASE, pillStyle } from "./chip-styles";

export interface PungsuTabProps {
  saju: SajuData;
}

/** 풀이 패널의 "방위" 탭 — 길한/주의 방위, 공간별 조언, 오행별 인테리어를 보여준다. */
export function PungsuTab({ saju }: PungsuTabProps) {
  const dark = useThemeStore(selectIsDark);
  const nowYear = useMemo(() => new Date().getFullYear(), []);
  const vm = useMemo(
    () => buildPungsuViewModel(saju, nowYear),
    [saju, nowYear],
  );
  // pungsu_advice.ts#generateSpaceAdvice는 SpaceType 9종 중 5종(침실/거실/부엌/서재/사무실)만
  // 실제 콘텐츠가 있다 — 나머지는 getDetailedSpaceAdvice가 통용 문구로 대체하므로, 여기서는
  // 실제 콘텐츠가 있는 항목만 보여준다(고정 SpaceType 목록을 돌리지 않는다).
  const [selectedSpace, setSelectedSpace] = useState(
    vm.spaceAdvice[0]?.spaceType,
  );
  const space = vm.spaceAdvice.find((s) => s.spaceType === selectedSpace);

  return (
    <div className="flex flex-col gap-5.5">
      <div className="grid grid-cols-1 gap-5.5 md:grid-cols-2">
        <SectionCard title="길한 방위">
          <div className="flex flex-col gap-3">
            {vm.luckyDirections.map((d, i) => (
              <div key={i}>
                <div className="font-mono-plex font-bold">{d.direction}</div>
                <div className="text-small text-dim">{d.detail}</div>
                <div className="text-caption text-mute">{d.tags.join(", ")}</div>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="주의할 방위">
          <div className="flex flex-col gap-3">
            {vm.unluckyDirections.map((d, i) => (
              <div key={i}>
                <div className="font-mono-plex font-bold text-danger">{d.direction}</div>
                <div className="text-small text-dim">{d.reason}</div>
                <div className="text-caption text-mute">피할 배치: {d.avoid.join(", ")}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="공간별 조언"
        subtitle={`${vm.yearlyDirections.year}년 길한 방위 ${vm.yearlyDirections.luckyDirection} · 주의 방위 ${vm.yearlyDirections.unluckyDirection}`}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {vm.spaceAdvice.map((s) => (
            <motion.button
              key={s.spaceType}
              onClick={() => setSelectedSpace(s.spaceType)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={PILL_BASE}
              style={pillStyle(selectedSpace === s.spaceType)}
            >
              {s.spaceType}
            </motion.button>
          ))}
        </div>
        {space && (
          <div>
            <div className="mb-1.5 text-body text-dim">
              최적 방향: {space.bestDirection} · {space.layout}
            </div>
            <div className="mb-1 text-small text-mute">색상: {space.colors.join(", ")}</div>
            <div className="mb-1 text-small text-mute">가구: {space.furniture.join(", ")}</div>
            {space.plants && (
              <div className="mb-1 text-small text-mute">식물: {space.plants.join(", ")}</div>
            )}
            <div className="text-small text-danger">피할 것: {space.avoid.join(", ")}</div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="오행별 인테리어">
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-5">
          {vm.elementalDecor.map((e) => (
            <div key={e.element}>
              <div
                className="mb-1 font-myeongjo font-bold"
                style={{ color: elementColor(e.element, dark) }}
              >
                {e.element}
              </div>
              <div className="text-caption text-dim">{e.colors.join(", ")}</div>
              <div className="text-caption text-mute">{e.items.join(", ")}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="종합 조언">
        <BulletList items={vm.generalAdvice.priority} tone="positive" />
        <BulletList items={vm.generalAdvice.warnings} tone="negative" />
        <BulletList items={vm.generalAdvice.enhancements} />
      </SectionCard>
    </div>
  );
}
