"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { StrengthGaugeVM } from "../view-model";

export interface StrengthGaugeProps {
  gauge: StrengthGaugeVM;
}

/**
 * 신강신약 270° 아크 게이지. 트랙(회색 전체 호) 위에 점수만큼 진행 호를 덧그리고
 * 끝점에 캡 원을 찍는다. 진행색은 일간 오행 고유색(view-model.ts의 myColor)을 그대로
 * 쓴다 — 점신처럼 신약/중화/신강마다 다른 색을 새로 정하지 않고 기존 팔레트에 맞춘다.
 */
export function StrengthGauge({ gauge }: StrengthGaugeProps) {
  return (
    <div className="flex flex-col items-center gap-4.5">
      <div className="relative aspect-square w-full max-w-[240px]">
        <svg viewBox="0 0 200 200" className="block h-full w-full">
          <path d={gauge.trackD} fill="none" stroke="var(--track)" strokeWidth={14} strokeLinecap="round" />
          {gauge.progressD && (
            <motion.path
              d={gauge.progressD}
              fill="none"
              stroke={gauge.color}
              strokeWidth={14}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          )}
          <circle cx={gauge.capX} cy={gauge.capY} r={9} fill={gauge.color} stroke="var(--bg)" strokeWidth={2} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
          <div className="font-myeongjo text-display font-extrabold leading-none">{gauge.score}</div>
          <div className="text-body text-dim">{gauge.bandLine}</div>
        </div>
      </div>

      <div className="flex gap-4.5">
        {gauge.bands.map((b) => (
          <div key={b.band} className="flex items-center gap-1.5">
            <span
              className="inline-block size-2 rounded-full"
              style={{ background: b.active ? gauge.color : "var(--track)" }}
            />
            <div className="flex flex-col leading-[1.3]">
              <span
                className={cn("text-body", b.active ? "font-bold text-fg" : "font-normal text-dim")}
              >
                {b.label}
              </span>
              <span className="font-mono-plex text-micro text-mute">{b.range}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
