import { StrengthGauge } from "../ui/strength-gauge";
import { ElementCycle } from "../ui/element-cycle";
import type { SajuViewModel } from "../view-model";

export interface ElementsColumnProps {
  viewModel: SajuViewModel;
}

/**
 * 결과 화면 왼쪽 열의 "오행과 십성" + "신강신약" 카드 내용물 — result-panel.tsx가
 * 이 열의 실제 렌더 높이를 ResizeObserver로 재서 오른쪽 열에 넘겨주므로, 그 ref가
 * 달린 부모 div는 result-panel.tsx에 남아 있다. 이 컴포넌트는 fragment를 반환해
 * motion의 stagger 컨텍스트를 그대로 통과시킨다(추가 DOM 노드를 만들지 않는다).
 */
export function ElementsColumn({ viewModel }: ElementsColumnProps) {
  return (
    <>
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
    </>
  );
}
