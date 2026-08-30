import { cn } from "@/lib/utils";
import styles from "../saju.module.css";
import type { SinSalCombinedVM, SinSalDetailVM } from "../reading-view-model";
import type { SajuViewModel } from "../view-model";

export interface YongsinSinsalColumnProps {
  viewModel: SajuViewModel;
  /** 풀이(명식 탭)에 있던 신살 상세 — "신살 — 특별한 자리" 카드 옆으로 옮겨와 여기서만 그린다 */
  sinsalDetails: SinSalDetailVM[];
  /** 신살이 2개 이상일 때만 오는 길신/흉신 조합 요약 (sin_sal.ts#interpretBySinSal) */
  sinsalCombined?: SinSalCombinedVM;
}

/**
 * 결과 화면 오른쪽 열의 "용신" + "신살" 2단 카드 내용물 — result-panel.tsx가
 * 왼쪽 열 높이에 맞춰 이 열에 명시적 height를 지정하므로, 그 높이를 받는 부모 div는
 * result-panel.tsx에 남아 있다. fragment를 반환해 motion stagger 컨텍스트를 그대로 통과시킨다.
 */
export function YongsinSinsalColumn({
  viewModel,
  sinsalDetails,
  sinsalCombined,
}: YongsinSinsalColumnProps) {
  return (
    <>
      <div
        className="rounded-[3px] p-5 sm:px-[26px] sm:py-6"
        style={{ border: `1px solid ${viewModel.yongLine}`, background: viewModel.yongBg }}
      >
        <h2 className="mb-3 whitespace-normal font-batang text-card-title font-bold sm:whitespace-nowrap">
          용신 — 필요한 것
        </h2>
        <div
          className="font-myeongjo text-[54px] leading-none font-extrabold"
          style={{ color: viewModel.yong.color, textShadow: `0 0 28px ${viewModel.yong.glow}` }}
        >
          {viewModel.yong.ch}
        </div>
        <div className="mt-3 text-body leading-[1.75] text-dim">{viewModel.yong.desc}</div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 sm:flex-row">
        <div className="flex min-h-0 flex-1 flex-col rounded-[3px] border border-line bg-surface p-5 sm:px-[26px] sm:py-6">
          <h2 className="mb-3.5 shrink-0 whitespace-normal font-batang text-card-title font-bold sm:whitespace-nowrap">
            신살 — 특별한 자리
          </h2>
          <div
            className={cn(
              styles.sinsalScroll,
              "flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1",
            )}
          >
            {viewModel.sinsal.map((s, i) => (
              <div key={i}>
                <div className="font-myeongjo text-subtitle font-bold">{s.name}</div>
                <div className="text-body leading-[1.75] text-dim">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-[3px] border border-line bg-surface p-5 sm:px-[26px] sm:py-6">
          <h2 className="mb-3.5 shrink-0 whitespace-normal font-batang text-card-title font-bold sm:whitespace-nowrap">
            신살 상세
          </h2>
          <div
            className={cn(
              styles.sinsalScroll,
              "flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto pr-1",
            )}
          >
            {/* 예전엔 이 요약 블록이 스크롤 영역 밖(flexShrink: 0)에 별도로 있어서,
                종합 조언 문구가 길어지면 카드 높이를 넘어 아래 콘텐츠와 겹쳐 보였다.
                스크롤 영역 맨 앞 항목으로 옮겨 개별 신살 목록과 함께 스크롤되게 한다. */}
            {sinsalCombined && (
              <div className="border-b border-line pb-3 text-body leading-[1.75] text-dim">
                {sinsalCombined.blessingNames.length > 0 && (
                  <div>
                    <span className="text-mute">길신:</span>{" "}
                    {sinsalCombined.blessingNames.join(", ")}
                  </div>
                )}
                {sinsalCombined.warningNames.length > 0 && (
                  <div>
                    <span className="text-mute">흉신:</span>{" "}
                    {sinsalCombined.warningNames.join(", ")}
                  </div>
                )}
              </div>
            )}
            {sinsalDetails.map((s, i) => (
              <div key={i}>
                <div className="flex flex-wrap items-baseline gap-2 font-myeongjo text-label font-bold">
                  {s.name}({s.hanja})
                  <span className="font-mono-plex text-body text-mute">{s.typeLabel}</span>
                </div>
                <div className="mt-1 text-body leading-[1.75] text-dim">{s.description}</div>
                {s.positive.length > 0 && (
                  <div className="mt-1 text-body leading-[1.75] text-dim">
                    긍정: {s.positive.join(" · ")}
                  </div>
                )}
                {s.negative.length > 0 && (
                  <div className="mt-1 text-body leading-[1.75] text-mute">
                    주의: {s.negative.join(" · ")}
                  </div>
                )}
                <div className="mt-1 text-body leading-[1.75] text-mute">
                  직업: {s.byArea.career}
                </div>
                <div className="mt-1 text-body leading-[1.75] text-mute">
                  연애: {s.byArea.love}
                </div>
                <div className="mt-1 text-body leading-[1.75] text-mute">
                  건강: {s.byArea.health}
                </div>
                {s.advice.length > 0 && (
                  <div className="mt-1 text-body leading-[1.75] text-mute">
                    조언: {s.advice.join(" · ")}
                  </div>
                )}
              </div>
            ))}
            {sinsalDetails.length === 0 && (
              <div className="text-body text-mute">두드러진 신살이 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
