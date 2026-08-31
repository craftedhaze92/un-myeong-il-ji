"use client";

import { selectIsDark, useThemeStore } from "@/store/theme-store";
import { elementColor } from "../constants";
import type { ReadingVM } from "../reading-view-model";
import { BulletList } from "../ui/bullet-list";
import { ScoreBar } from "../ui/score-bar";
import { SectionCard } from "../ui/section-card";
import { BADGE_BASE, badgeStyle } from "./chip-styles";

export interface CareerTabProps {
  vm: ReadingVM;
}

function BasisBadges({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label={label}>
      {items.map((item) => (
        <span key={item} className={BADGE_BASE} style={badgeStyle(false)}>
          {item}
        </span>
      ))}
    </div>
  );
}

const ENVIRONMENT_ITEMS = [
  { key: "preferredSize", label: "조직 규모" },
  { key: "workStyle", label: "일하는 방식" },
  { key: "leadership", label: "역할 성향" },
  { key: "stability", label: "변화 선호" },
] as const;

/** 풀이 패널의 "직업" 탭 — 역할·역량·업무 환경을 함께 보여주는 적성 탐색 안내다. */
export function CareerTab({ vm }: CareerTabProps) {
  const dark = useThemeStore(selectIsDark);
  const { career } = vm;

  return (
    <div className="flex flex-col gap-5.5">
      <SectionCard title="직업 적성 안내">
        <p className="text-body text-dim leading-[1.8]">{career.summary}</p>
        <p
          className="text-small text-mute mt-4 border-l-2 pl-3 leading-[1.7]"
          style={{ borderColor: "var(--line-strong)" }}
        >
          아래 내용은 명식 안의 강점·보완 방향·십성을 비교한 탐색 지표입니다.
          채용, 소득, 성과를 예측하거나 보장하지 않으므로 실제 직무 내용과 자격 요건을
          함께 확인하세요.
        </p>
      </SectionCard>

      <SectionCard
        title="추천 진로 방향"
        subtitle="직업명 하나를 정하기보다, 반복해서 잘 쓸 수 있는 역할·역량·업무 조건을 함께 살펴보세요."
      >
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          {career.recommendations.map((recommendation) => (
            <article
              key={recommendation.category}
              className="rounded-[3px] border p-4"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-batang text-section font-extrabold">
                  {recommendation.categoryLabel}
                </h3>
                <span className="text-small text-mute">
                  {recommendation.strengthLabel}
                </span>
              </div>
              <p className="text-body text-dim mb-3 leading-[1.75]">
                {recommendation.roleSummary}
              </p>
              <BasisBadges
                label={`${recommendation.categoryLabel} 해석 근거`}
                items={recommendation.basis}
              />
              <div className="mt-4 space-y-3">
                <div>
                  <h4 className="font-batang text-small mb-1 font-bold">대표 역할</h4>
                  <p className="text-small text-dim">
                    {recommendation.specificJobs.join(" · ")}
                  </p>
                </div>
                <div>
                  <h4 className="font-batang text-small mb-1 font-bold">준비할 역량</h4>
                  <p className="text-small text-dim">
                    {recommendation.requiredSkills.join(" · ")}
                  </p>
                </div>
                <div>
                  <h4 className="font-batang text-small mb-1 font-bold">어울리는 업무 조건</h4>
                  <p className="text-small text-dim">
                    {recommendation.workConditions.join(" · ")}
                  </p>
                </div>
              </div>
              <p className="text-small text-mute mt-4 leading-[1.7]">
                {recommendation.reason}
              </p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="일하기 좋은 환경"
        subtitle="높고 낮음의 평가가 아니라, 에너지를 덜 소모하며 강점을 쓰기 쉬운 조건입니다."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ENVIRONMENT_ITEMS.map(({ key, label }) => (
            <div
              key={key}
              className="rounded-[3px] border p-3"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="text-caption text-mute">{label}</div>
              <div className="font-batang text-body mt-1 font-bold">
                {career.workEnvironment[key]}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-2">
        <SectionCard
          title="살펴볼 업무 조건"
          subtitle="피해야 할 직업이라는 뜻이 아니라, 오래 지속될 때 부담을 점검하면 좋은 조건입니다."
        >
          <div className="flex flex-col gap-4">
            {career.workConditionsToConsider.map((condition) => (
              <article key={condition.condition}>
                <h3 className="font-batang text-body mb-1 font-bold">
                  {condition.condition}
                </h3>
                <p className="text-small text-dim leading-[1.7]">
                  {condition.reason}
                </p>
                <p className="text-caption text-mute mt-1.5 leading-[1.7]">
                  비교해 볼 방향: {condition.alternativeSuggestion}
                </p>
                <div className="mt-2">
                  <BasisBadges
                    label={`${condition.condition} 해석 근거`}
                    items={condition.basis}
                  />
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="오행별 직업 적성">
          <div className="flex flex-col gap-3.5">
            {career.elementalAffinity.map((element) => (
              <div key={element.element}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-small text-dim">
                    {element.element} 기운 · {element.careers.slice(0, 3).join(", ")}
                  </span>
                  <span
                    className="font-mono-plex text-caption"
                    style={{
                      color:
                        element.developedStatus === "발달"
                          ? "var(--fg)"
                          : element.developedStatus === "부족"
                            ? "var(--danger)"
                            : "var(--mute)",
                    }}
                  >
                    {element.developedStatus}
                  </span>
                </div>
                <ScoreBar
                  label={`${element.element} 기운 적성 지표`}
                  score={element.affinity}
                  color={elementColor(element.element, dark)}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="경력 개발 가이드">
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-3">
          <div>
            <h3 className="font-batang text-body mb-1.5 font-bold">탐색</h3>
            <BulletList items={career.careerAdvice.explore} />
          </div>
          <div>
            <h3 className="font-batang text-body mb-1.5 font-bold">역량 축적</h3>
            <BulletList items={career.careerAdvice.grow} />
          </div>
          <div>
            <h3 className="font-batang text-body mb-1.5 font-bold">전환·확장</h3>
            <BulletList items={career.careerAdvice.expand} />
          </div>
        </div>
        <p className="text-small text-mute mt-4 border-t pt-3 leading-[1.7]" style={{ borderColor: "var(--line)" }}>
          독립·창업 관점: {career.careerAdvice.entrepreneurship}
        </p>
      </SectionCard>
    </div>
  );
}
