"use client";

import { useMemo, useState } from "react";
import { selectIsDark, useThemeStore } from "@/store/theme-store";
import type { SajuData } from "@/types";
import { elementColor } from "../constants";
import { buildNameAnalysisVM, type ReadingVM } from "../reading-view-model";
import { BulletList } from "../ui/bullet-list";
import { SectionCard } from "../ui/section-card";
import { BADGE_BASE, badgeStyle } from "./chip-styles";

export interface MyeongsikTabProps {
  vm: ReadingVM;
  saju: SajuData;
  name: string;
}

/** 풀이 패널의 "명식" 탭 — 격국·일간 강약, 용신, 지장간 세력, 지지 관계, 이름 오행을 보여준다. */
export function MyeongsikTab({ vm, saju, name }: MyeongsikTabProps) {
  const dark = useThemeStore(selectIsDark);
  const { myeongsik } = vm;
  // 한자는 명식 계산에 쓰이지 않는 부가 정보라 메인 입력 폼(BirthFormValues)에는 넣지 않고
  // 이 탭 안에서만 로컬로 들고 있는다 — 캐시 키에 영향을 주지 않기 위함.
  const [hanjaInput, setHanjaInput] = useState("");
  const nameVm = useMemo(
    () =>
      name.trim() ? buildNameAnalysisVM(name.trim(), saju, hanjaInput.trim() || undefined) : null,
    [name, saju, hanjaInput],
  );
  return (
    <div className="flex flex-col gap-5.5">
      <div className="grid grid-cols-1 gap-5.5 md:grid-cols-2">
        <SectionCard title="격국 · 일간 강약">
          {myeongsik.gyeokGuk && (
            <div className="mb-4.5">
              <div className="font-myeongjo text-subtitle font-bold">
                {myeongsik.gyeokGuk.name} ({myeongsik.gyeokGuk.hanja})
              </div>
              <div className="mt-1 text-body leading-[1.75] text-dim">
                {myeongsik.gyeokGuk.description}
              </div>
              {myeongsik.gyeokGuk.quality && (
                <div className="mt-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={BADGE_BASE}
                      style={badgeStyle(
                        true,
                        myeongsik.gyeokGuk.quality.statusLabel.startsWith("성격") ||
                          myeongsik.gyeokGuk.quality.statusLabel.startsWith("패중유구")
                          ? undefined
                          : "var(--danger)",
                      )}
                    >
                      {myeongsik.gyeokGuk.quality.statusLabel}
                    </span>
                    <span className={BADGE_BASE} style={badgeStyle(false)}>
                      {myeongsik.gyeokGuk.quality.useType}
                    </span>
                    {myeongsik.gyeokGuk.quality.sangSinLabel && (
                      <span className={BADGE_BASE} style={badgeStyle(false)}>
                        상신 {myeongsik.gyeokGuk.quality.sangSinLabel}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-small leading-[1.7] text-mute">
                    {myeongsik.gyeokGuk.quality.explanation}
                  </div>
                </div>
              )}
            </div>
          )}
          {myeongsik.dayMasterStrength && (
            // 게이지 시각화는 결과 패널 "신강신약" 카드로 옮겼다 — 여기서는 중복 표시하지
            // 않고 근거 서술(analysis)만 보여준다.
            <div>
              <div className="flex flex-wrap items-baseline gap-2 font-myeongjo text-subtitle font-bold">
                일간 강약
                <span className="font-mono-plex text-body text-mute">
                  {myeongsik.dayMasterStrength.levelLabel} ·{" "}
                  {myeongsik.dayMasterStrength.score}점
                </span>
              </div>
              <div className="mt-2.5 text-body leading-[1.75] text-dim">
                {myeongsik.dayMasterStrength.analysis}
              </div>
              {myeongsik.dayMasterStrength.deukRyeong !== undefined && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className={BADGE_BASE} style={badgeStyle(myeongsik.dayMasterStrength.deukRyeong)}>
                    {myeongsik.dayMasterStrength.deukRyeong ? "득령" : "실령"}
                  </span>
                  <span className={BADGE_BASE} style={badgeStyle(!!myeongsik.dayMasterStrength.deukJi)}>
                    {myeongsik.dayMasterStrength.deukJi ? "득지" : "실지"}
                  </span>
                  <span className={BADGE_BASE} style={badgeStyle(!!myeongsik.dayMasterStrength.deukSe)}>
                    {myeongsik.dayMasterStrength.deukSe ? "득세" : "실세"}
                  </span>
                  {myeongsik.dayMasterStrength.rootedAtLabels.length > 0 && (
                    <span className={BADGE_BASE} style={badgeStyle(true)}>
                      {myeongsik.dayMasterStrength.rootedAtLabels.join("·")}지 통근
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          {myeongsik.wolRyeong && (
            <div className="mt-3.5 text-body text-mute">
              월령: {myeongsik.wolRyeong.isDeukRyeong ? "득령" : "실령"} (
              {myeongsik.wolRyeong.strengthLabel}) —{" "}
              {myeongsik.wolRyeong.reason}
            </div>
          )}
        </SectionCard>

        {myeongsik.yongSin && (
          <SectionCard title="용신 실천 조언">
            {myeongsik.yongSin.methodLabel && (
              <div className="mb-2.5">
                <span className={BADGE_BASE} style={badgeStyle(true)}>
                  {myeongsik.yongSin.methodLabel}
                </span>
              </div>
            )}
            <div className="mb-3 text-body leading-[1.75] text-dim">
              {myeongsik.yongSin.reasoning}
            </div>
            <BulletList items={myeongsik.yongSin.advice} />
          </SectionCard>
        )}
      </div>

      {myeongsik.jiJangGan.length > 0 && (
        <SectionCard title="지장간 세력">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${myeongsik.jiJangGan.length}, minmax(0, 1fr))` }}
          >
            {myeongsik.jiJangGan.map((pillar, i) => (
              <div key={i}>
                <div className="mb-2 text-body text-mute">{pillar.pillarLabel}</div>
                {pillar.entries.map((entry, j) => (
                  <div key={j} className="mb-2">
                    <div className="mb-0.5 flex justify-between text-body text-dim">
                      <span>
                        {entry.hanja}({entry.stem}) · {entry.roleLabel}
                      </span>
                      <span className="font-mono-plex">{entry.strength}%</span>
                    </div>
                    <div className="h-1 rounded-sm bg-track">
                      <div
                        className="h-full rounded-sm bg-fg opacity-60"
                        style={{ width: `${entry.strength}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* 신살 상세는 result-panel.tsx의 "신살 — 특별한 자리" 카드 옆으로 옮겼다 —
          이 탭에서는 지지 관계만 단독 카드로 남긴다. */}
      {myeongsik.branchRelations && (
        <SectionCard title="지지 관계">
          <div className="mb-2.5 text-body leading-[1.75] text-dim">
            {myeongsik.branchRelations.summary}
          </div>
          <div className="flex flex-wrap gap-2">
            {myeongsik.branchRelations.samHap && (
              <span className={BADGE_BASE} style={badgeStyle(true)}>
                삼합 {myeongsik.branchRelations.samHap}
              </span>
            )}
            {myeongsik.branchRelations.samHyeong.map((s, i) => (
              <span key={`h-${i}`} className={BADGE_BASE} style={badgeStyle(true)}>
                {s}
              </span>
            ))}
            {myeongsik.branchRelations.yukHae.map((s, i) => (
              <span key={`y-${i}`} className={BADGE_BASE} style={badgeStyle(true)}>
                {s}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {nameVm && (
        <SectionCard
          title={`이름 오행 — ${nameVm.name}`}
          subtitle="초성(자음)의 발음오행이 기본입니다. 한자를 입력하면 그 글자의 자원오행과 실제 획수 성명학(오격)도 함께 봅니다."
        >
          <label className="mb-3.5 block">
            <span className="text-small text-mute">
              한자 입력(선택, {nameVm.name.length}자와 같은 글자 수로)
            </span>
            <input
              value={hanjaInput}
              onChange={(e) => setHanjaInput(e.target.value)}
              placeholder={"예: " + "金敏俊".slice(0, nameVm.name.length)}
              className="mt-1 block h-10 w-full rounded-[2px] border border-line bg-surface px-2.5 font-myeongjo text-body"
            />
          </label>

          <div className="mb-3.5 flex flex-wrap gap-4">
            {nameVm.characters.map((c, i) => (
              <div key={i} className="text-center">
                <div
                  className="font-myeongjo text-section font-extrabold"
                  style={{ color: elementColor(c.element, dark) }}
                >
                  {c.char}
                </div>
                <div className="text-caption text-mute">
                  {c.element}
                  {c.meaning ? ` · ${c.meaning}` : ""}
                </div>
                <div className="text-micro text-mute">
                  {c.elementSourceLabel}
                  {c.lowConfidenceElement ? "(근거 약함)" : ""}
                </div>
              </div>
            ))}
          </div>
          <div className="text-body text-dim">
            오행 구성: {nameVm.wuxingBalanceLabel}
            {nameVm.isFavorable ? " (사주와 함께 무난한 균형)" : ""}
          </div>
          <div className="mt-1 text-body text-dim">
            {nameVm.harmonyDescription} (조화도 {nameVm.harmonyScore}점)
          </div>
          {nameVm.supplementElements.length > 0 && (
            <div className="mt-2 text-small text-mute">
              보완 오행: {nameVm.supplementElements.join(", ")}
            </div>
          )}

          {nameVm.strokeAnalysis ? (
            <div className="mt-4.5 border-t border-line pt-3.5">
              <div className="mb-2 font-myeongjo text-subtitle font-bold">성명학 획수(오격)</div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                <span className={BADGE_BASE} style={badgeStyle(true)}>
                  천격 {nameVm.strokeAnalysis.heavenGround}
                </span>
                <span className={BADGE_BASE} style={badgeStyle(true)}>
                  인격 {nameVm.strokeAnalysis.personalGround}
                </span>
                <span className={BADGE_BASE} style={badgeStyle(true)}>
                  지격 {nameVm.strokeAnalysis.earthGround}
                </span>
                <span className={BADGE_BASE} style={badgeStyle(true)}>
                  외격 {nameVm.strokeAnalysis.outerGround}
                </span>
                <span
                  className={BADGE_BASE}
                  style={badgeStyle(
                    true,
                    nameVm.strokeAnalysis.fortune === "흉" ? "var(--danger)" : undefined,
                  )}
                >
                  총격 {nameVm.strokeAnalysis.totalGround} · {nameVm.strokeAnalysis.fortune}
                </span>
              </div>
              {nameVm.strokeAnalysis.hasUnverifiedStroke && (
                <div className="text-micro text-mute">
                  ⓘ 일부 글자는 원획 보정을 자체 추정한 값이라 확정도가 낮습니다.
                </div>
              )}
            </div>
          ) : (
            hanjaInput.trim() && (
              <div className="mt-3.5 text-small text-mute">
                ⓘ {nameVm.strokeUnavailableReason}
              </div>
            )
          )}
        </SectionCard>
      )}
    </div>
  );
}
