import type { ReadingVM } from "../reading-view-model";
import { BulletList } from "../ui/bullet-list";
import { SectionCard } from "../ui/section-card";
import { ScoreBar } from "../ui/score-bar";
import { BADGE_BASE, badgeStyle } from "./chip-styles";

export interface LifeTabProps {
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

function InsightGroup({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "positive" | "negative";
}) {
  return (
    <div>
      <h3 className="font-batang text-label mb-2 font-bold">{title}</h3>
      <BulletList items={items} tone={tone} />
    </div>
  );
}

/** 풀이 패널의 "인생" 탭 — 연애/재물/건강 등 인생 영역별 총운과 성격(두드러진 십성)을 보여준다. */
export function LifeTab({ vm }: LifeTabProps) {
  return (
    <div className="flex flex-col gap-5.5">
      <SectionCard title="평생 총평">
        {/* <ScoreBar score={vm.life.overview.score} /> */}

        <div
          className="my-4 flex flex-wrap gap-2"
          aria-label="총평의 명식 근거"
        >
          {vm.life.overview.basis.map((item) => (
            <span key={item} className={BADGE_BASE} style={badgeStyle(false)}>
              {item}
            </span>
          ))}
        </div>

        <div className="text-body text-dim space-y-3 leading-[1.85]">
          {vm.life.overview.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div
          className="mt-5 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-3"
          style={{ borderColor: "var(--line)" }}
        >
          <div>
            <h3 className="font-batang text-label mb-2 font-bold">강점</h3>
            <BulletList items={vm.life.overview.strengths} tone="positive" />
          </div>
          <div>
            <h3 className="font-batang text-label mb-2 font-bold">살펴볼 점</h3>
            <BulletList items={vm.life.overview.cautions} tone="negative" />
          </div>
          <div>
            <h3 className="font-batang text-label mb-2 font-bold">생활 조언</h3>
            <BulletList items={vm.life.overview.advice} />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="삶의 큰 흐름"
        subtitle="원국과 화면에 표시되는 대운을 함께 보아 생애 구간별 경향을 정리했습니다."
      >
        {vm.life.precisionNote && (
          <p
            className="text-small text-mute mb-4 border-l-2 pl-3 leading-[1.7]"
            style={{ borderColor: "var(--line-strong)" }}
          >
            {vm.life.precisionNote}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {vm.life.stages.map((stage) => (
            <article
              key={stage.id}
              className="rounded-[3px] border p-4"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="font-batang text-section font-extrabold">
                  {stage.label}
                </h3>
                <span className="font-mono-plex text-small text-mute">
                  {stage.ageLabel} · {stage.overall}
                </span>
              </div>
              <p className="text-body text-dim mb-3 leading-[1.75]">
                {stage.summary}
              </p>
              <BulletList items={[stage.opportunity]} tone="positive" />
              <BulletList items={[stage.caution]} tone="negative" />
              <div
                className="mt-3 flex flex-wrap gap-1.5"
                aria-label={`${stage.label} 해석 근거`}
              >
                {stage.basis.map((item) => (
                  <span
                    key={item}
                    className={BADGE_BASE}
                    style={badgeStyle(false)}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {vm.life.highlights.map((highlight) => (
            <article
              key={highlight.kind}
              className="rounded-[3px] border p-4"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-batang text-section font-extrabold">
                  {highlight.title}
                </h3>
                <span className="font-mono-plex text-small text-mute">
                  {highlight.ageLabel} · {highlight.pillar} ·{" "}
                  {highlight.overall}
                </span>
              </div>
              <p className="text-body text-dim mb-3 leading-[1.75]">
                {highlight.summary}
              </p>
              <div
                className="flex flex-wrap gap-1.5"
                aria-label={`${highlight.title} 근거`}
              >
                {highlight.basis.map((item) => (
                  <span
                    key={item}
                    className={BADGE_BASE}
                    style={badgeStyle(false)}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <div>
        <p className="text-small text-mute mb-3 leading-[1.7]">
          아래 점수는 미래 사건의 확률이 아니라 명식 안의 자원과 부담을 비교한
          해석 지표입니다.
        </p>
        <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-3">
          {vm.life.fortunes.map((fortune) => (
            <SectionCard key={fortune.type} title={fortune.label}>
              <ScoreBar label={fortune.scoreLabel} score={fortune.score} />
              <p className="text-body text-dim my-4 leading-[1.8]">
                {fortune.summary}
              </p>

              <BasisBadges
                label={`${fortune.label} 해석 근거`}
                items={fortune.basis}
              />

              {fortune.contextNote && (
                <p
                  className="text-small text-mute mt-4 border-l-2 pl-3 leading-[1.7]"
                  style={{ borderColor: "var(--line-strong)" }}
                >
                  {fortune.contextNote}
                </p>
              )}

              <div
                className="mt-5 space-y-4 border-t pt-4"
                style={{ borderColor: "var(--line)" }}
              >
                <InsightGroup
                  title="잘 쓰일 때"
                  items={fortune.strengths}
                  tone="positive"
                />
                <InsightGroup
                  title="살펴볼 점"
                  items={fortune.cautions}
                  tone="negative"
                />
                <InsightGroup title="실천 팁" items={fortune.actions} />
              </div>
            </SectionCard>
          ))}
        </div>
      </div>

      <SectionCard
        title="성격 — 두드러진 십성"
        subtitle="십성의 비중은 자주 사용하는 역할과 반응 방식을 보여주며, 높고 낮음 자체가 길흉을 뜻하지 않습니다."
      >
        <div className="grid grid-cols-1 gap-4.5 md:grid-cols-2">
          {vm.life.personality.map((personality) => (
            <article
              key={personality.tenGod}
              className="rounded-[3px] border p-4"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="font-batang text-label mb-2 flex flex-wrap justify-between gap-2 font-bold">
                <span>
                  {personality.tenGod} ({personality.hanja})
                </span>
                {/* <span className="font-mono-plex text-body text-mute">
                  {personality.intensityLabel}
                </span> */}
              </div>
              <p className="text-body text-dim mb-4 leading-[1.75]">
                {personality.summary}
              </p>
              <div className="space-y-4">
                <InsightGroup
                  title="잘 쓰일 때"
                  items={personality.strengths}
                  tone="positive"
                />
                <InsightGroup
                  title="과해질 때"
                  items={personality.cautions}
                  tone="negative"
                />
                <InsightGroup title="균형 팁" items={personality.actions} />
              </div>
            </article>
          ))}
          {vm.life.personality.length === 0 && (
            <div className="text-body text-mute">
              표시할 십성 분포가 없습니다.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
