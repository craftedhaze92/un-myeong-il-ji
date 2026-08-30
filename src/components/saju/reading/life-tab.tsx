import type { ReadingVM } from "../reading-view-model";
import { BulletList } from "../ui/bullet-list";
import { SectionCard } from "../ui/section-card";
import { ScoreBar } from "../ui/score-bar";

export interface LifeTabProps {
  vm: ReadingVM;
}

/** 풀이 패널의 "인생" 탭 — 연애/재물/건강 등 인생 영역별 총운과 성격(두드러진 십성)을 보여준다. */
export function LifeTab({ vm }: LifeTabProps) {
  return (
    <div className="flex flex-col gap-5.5">
      <div className="grid grid-cols-1 gap-5.5 md:grid-cols-2">
        {vm.life.fortunes.map((f) => (
          <SectionCard key={f.type} title={f.label}>
            <ScoreBar score={f.score} />
            <div className="my-3 text-body leading-[1.75] text-dim">{f.summary}</div>
            <BulletList items={f.positive} tone="positive" />
            <BulletList items={f.negative} tone="negative" />
            <BulletList items={f.advice} />
            {(f.luckyColors.length > 0 || f.luckyDirections.length > 0) && (
              <div className="mt-1 text-body text-mute">
                {f.luckyColors.length > 0 && <>길한 색: {f.luckyColors.join(", ")} </>}
                {f.luckyDirections.length > 0 && <>· 길한 방향: {f.luckyDirections.join(", ")}</>}
              </div>
            )}
          </SectionCard>
        ))}
      </div>

      <SectionCard title="성격 — 두드러진 십성">
        <div className="grid grid-cols-1 gap-4.5 md:grid-cols-2">
          {vm.life.personality.map((p, i) => (
            <div key={i}>
              <div className="mb-1.5 flex justify-between font-batang text-label font-bold">
                <span>{p.tenGod}</span>
                <span className="font-mono-plex text-body text-mute">{p.intensityLabel}</span>
              </div>
              <BulletList items={p.strengths} tone="positive" />
              <BulletList items={p.weaknesses} tone="negative" />
              <BulletList items={p.advice} />
            </div>
          ))}
          {vm.life.personality.length === 0 && (
            <div className="text-body text-mute">표시할 십성 분포가 없습니다.</div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
