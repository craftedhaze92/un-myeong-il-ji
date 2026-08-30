"use client";

import { selectIsDark, useThemeStore } from "@/store/theme-store";
import { elementColor } from "../constants";
import type { ReadingVM } from "../reading-view-model";
import { BulletList } from "../ui/bullet-list";
import { SectionCard } from "../ui/section-card";
import { ScoreBar } from "../ui/score-bar";

export interface CareerTabProps {
  vm: ReadingVM;
}

/** 풀이 패널의 "직업" 탭 — 추천/기피 직업, 오행별 적성, 경력 단계별 조언을 보여준다. */
export function CareerTab({ vm }: CareerTabProps) {
  const dark = useThemeStore(selectIsDark);
  const { career } = vm;
  return (
    <div className="flex flex-col gap-5.5">
      <SectionCard title="직업 적성 총평">
        <div className="text-body leading-[1.75] text-dim">{career.summary}</div>
      </SectionCard>

      <SectionCard title="추천 직업">
        <div className="flex flex-col gap-4">
          {career.recommendations.map((r, i) => (
            <div key={i}>
              <div className="mb-1 flex flex-wrap justify-between gap-1">
                <span className="font-batang text-label font-bold">{r.category}</span>
                <span className="font-mono-plex text-caption text-mute">
                  {r.strengthLabel} · {r.score}점
                </span>
              </div>
              <div className="mb-1 text-small text-dim">{r.specificJobs.join(", ")}</div>
              <div className="text-small leading-[1.75] text-dim">{r.reason}</div>
              <div className="mt-0.5 text-caption text-mute">{r.yongsinAlignment}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-5.5 md:grid-cols-2">
        <SectionCard title="피해야 할 직업">
          <div className="flex flex-col gap-3">
            {career.jobsToAvoid.map((j, i) => (
              <div key={i}>
                <div className="font-batang text-body font-bold">{j.category}</div>
                <div className="text-small leading-[1.75] text-dim">{j.reason}</div>
                <div className="mt-0.5 text-caption text-mute">
                  대안: {j.alternativeSuggestion}
                </div>
              </div>
            ))}
            {career.jobsToAvoid.length === 0 && (
              <div className="text-small text-mute">특별히 피할 직업은 없습니다.</div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="오행별 직업 적성">
          <div className="flex flex-col gap-3.5">
            {career.elementalAffinity.map((e, i) => (
              <div key={i}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-small text-dim">{e.element} 기운</span>
                  <span
                    className="font-mono-plex text-caption"
                    style={{
                      color:
                        e.developedStatus === "발달"
                          ? "var(--fg)"
                          : e.developedStatus === "부족"
                            ? "var(--danger)"
                            : "var(--mute)",
                    }}
                  >
                    {e.developedStatus}
                  </span>
                </div>
                <ScoreBar
                  label={`${e.element} — ${e.careers.slice(0, 3).join(", ")}`}
                  score={e.affinity}
                  color={elementColor(e.element, dark)}
                />
                <div className="mt-1 flex gap-3 font-mono-plex text-caption text-mute">
                  <span>강점(발달) {e.strengthScore}</span>
                  <span>용신 {e.yongsinScore}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="경력 개발 조언">
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-3">
          <div>
            <div className="mb-1.5 font-batang text-body font-bold">초기 경력 (20-30대)</div>
            <BulletList items={career.careerAdvice.earlyCareer} />
          </div>
          <div>
            <div className="mb-1.5 font-batang text-body font-bold">중기 경력 (40-50대)</div>
            <BulletList items={career.careerAdvice.midCareer} />
          </div>
          <div>
            <div className="mb-1.5 font-batang text-body font-bold">후기 경력 (60대 이상)</div>
            <BulletList items={career.careerAdvice.lateCareer} />
          </div>
        </div>
        <div className="mt-3.5 text-small text-mute">
          창업 적성: {career.careerAdvice.entrepreneurship}
        </div>
      </SectionCard>
    </div>
  );
}
