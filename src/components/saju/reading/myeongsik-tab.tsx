"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { Collapsible } from "radix-ui";
import { cn } from "@/lib/utils";
import { selectIsDark, useThemeStore } from "@/store/theme-store";
import type { SajuData } from "@/types";
import { elementColor } from "../constants";
import { buildNameAnalysisVM, type ReadingVM } from "../reading-view-model";
import styles from "../saju.module.css";
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
  const [iljuOpen, setIljuOpen] = useState(false);
  const [branchGuideOpen, setBranchGuideOpen] = useState(false);
  const nameVm = useMemo(
    () =>
      name.trim()
        ? buildNameAnalysisVM(name.trim(), saju, hanjaInput.trim() || undefined)
        : null,
    [name, saju, hanjaInput],
  );
  return (
    <div className="flex flex-col gap-5.5">
      <Collapsible.Root open={iljuOpen} onOpenChange={setIljuOpen}>
        <SectionCard
          title={`나의 일주 — ${myeongsik.ilju.name} (${myeongsik.ilju.hanja})`}
          titleRight={
            <Collapsible.Trigger asChild>
              <button
                type="button"
                className="text-small text-dim hover:text-fg focus-visible:outline-fg flex cursor-pointer items-center gap-1 rounded-[2px] border-none bg-transparent p-1 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {iljuOpen ? "간단히 보기" : "자세히 보기"}
                <motion.span
                  animate={{ rotate: iljuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex"
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </motion.span>
              </button>
            </Collapsible.Trigger>
          }
        >
          <p className="text-body text-dim leading-[1.75]">
            {myeongsik.ilju.summary}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {myeongsik.ilju.keywords.map((keyword) => (
              <span
                key={keyword}
                className={BADGE_BASE}
                style={badgeStyle(true)}
              >
                {keyword}
              </span>
            ))}
          </div>

          <Collapsible.Content
            className={cn("overflow-hidden", styles.collapsibleContent)}
          >
            <div className="border-line mt-4.5 border-t pt-4.5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-myeongjo text-subtitle mb-1.5 font-bold">
                    일간 · 겉으로 드러나는 기질
                  </h3>
                  <p className="text-body text-dim leading-[1.75]">
                    {myeongsik.ilju.temperament}
                  </p>
                </div>
                <div>
                  <h3 className="font-myeongjo text-subtitle mb-1.5 font-bold">
                    일지 · 내면의 반응 방식
                  </h3>
                  <p className="text-body text-dim leading-[1.75]">
                    {myeongsik.ilju.innerStyle}
                  </p>
                </div>
              </div>

              <div className="bg-track text-body text-dim mt-4 rounded-[2px] px-3.5 py-3 leading-[1.75]">
                {myeongsik.ilju.relation}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-myeongjo text-subtitle mb-2 font-bold">
                    강점으로 쓰일 때
                  </h3>
                  <BulletList
                    items={myeongsik.ilju.strengths}
                    tone="positive"
                  />
                </div>
                <div>
                  <h3 className="font-myeongjo text-subtitle mb-2 font-bold">
                    살펴볼 점
                  </h3>
                  <BulletList items={myeongsik.ilju.cautions} tone="negative" />
                </div>
              </div>

              <p className="border-line text-small text-mute mt-1 border-t pt-3.5 leading-[1.7]">
                일주는 자기 이해의 출발점입니다. 실제 모습은 월령, 일간 강약과
                나머지 기둥의 관계에 따라 다르게 나타날 수 있습니다.
              </p>
            </div>
          </Collapsible.Content>
        </SectionCard>
      </Collapsible.Root>

      <div className="grid grid-cols-1 gap-5.5 md:grid-cols-2">
        <SectionCard title="격국 · 일간 강약">
          {myeongsik.gyeokGuk && (
            <div className="mb-4.5">
              <div className="font-myeongjo text-subtitle font-bold">
                {myeongsik.gyeokGuk.name} ({myeongsik.gyeokGuk.hanja})
              </div>
              <div className="text-body text-dim mt-1 leading-[1.75]">
                {myeongsik.gyeokGuk.description}
              </div>
              {myeongsik.gyeokGuk.quality && (
                <div className="mt-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={BADGE_BASE}
                      style={badgeStyle(
                        true,
                        myeongsik.gyeokGuk.quality.statusLabel.startsWith(
                          "성격",
                        ) ||
                          myeongsik.gyeokGuk.quality.statusLabel.startsWith(
                            "패중유구",
                          )
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
                  <div className="text-small text-mute mt-2 leading-[1.7]">
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
              <div className="font-myeongjo text-subtitle flex flex-wrap items-baseline gap-2 font-bold">
                일간 강약
                <span className="font-mono-plex text-body text-mute">
                  {myeongsik.dayMasterStrength.levelLabel} ·{" "}
                  {myeongsik.dayMasterStrength.score}점
                </span>
              </div>
              <div className="text-body text-dim mt-2.5 leading-[1.75]">
                {myeongsik.dayMasterStrength.analysis}
              </div>
              {myeongsik.dayMasterStrength.deukRyeong !== undefined && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span
                    className={BADGE_BASE}
                    style={badgeStyle(myeongsik.dayMasterStrength.deukRyeong)}
                  >
                    {myeongsik.dayMasterStrength.deukRyeong ? "득령" : "실령"}
                  </span>
                  <span
                    className={BADGE_BASE}
                    style={badgeStyle(!!myeongsik.dayMasterStrength.deukJi)}
                  >
                    {myeongsik.dayMasterStrength.deukJi ? "득지" : "실지"}
                  </span>
                  <span
                    className={BADGE_BASE}
                    style={badgeStyle(!!myeongsik.dayMasterStrength.deukSe)}
                  >
                    {myeongsik.dayMasterStrength.deukSe ? "득세" : "실세"}
                  </span>
                  {myeongsik.dayMasterStrength.rootedAtLabels.length > 0 && (
                    <span className={BADGE_BASE} style={badgeStyle(true)}>
                      {myeongsik.dayMasterStrength.rootedAtLabels.join("·")}지
                      통근
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          {myeongsik.wolRyeong && (
            <div className="text-body text-mute mt-3.5">
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
            <div className="text-body text-dim mb-3 leading-[1.75]">
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
            style={{
              gridTemplateColumns: `repeat(${myeongsik.jiJangGan.length}, minmax(0, 1fr))`,
            }}
          >
            {myeongsik.jiJangGan.map((pillar, i) => (
              <div key={i}>
                <div className="text-body text-mute mb-2">
                  {pillar.pillarLabel}
                </div>
                {pillar.entries.map((entry, j) => (
                  <div key={j} className="mb-2">
                    <div className="text-body text-dim mb-0.5 flex justify-between">
                      <span>
                        {entry.hanja}({entry.stem}) · {entry.roleLabel}
                      </span>
                      <span className="font-mono-plex">{entry.strength}%</span>
                    </div>
                    <div className="bg-track h-1 rounded-sm">
                      <div
                        className="bg-fg h-full rounded-sm opacity-60"
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
        <Collapsible.Root
          open={branchGuideOpen}
          onOpenChange={setBranchGuideOpen}
        >
          <SectionCard
            title="지지 관계"
            subtitle="명식에 함께 놓인 지지의 조합과 자리를 구조적으로 보여드립니다."
            titleRight={
              <Collapsible.Trigger asChild>
                <button
                  type="button"
                  className="text-small text-dim hover:text-fg focus-visible:outline-fg flex cursor-pointer items-center gap-1 rounded-[2px] border-none bg-transparent p-1 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {branchGuideOpen ? "참고표 접기" : "전체 관계 참고표"}
                  <motion.span
                    animate={{ rotate: branchGuideOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex"
                  >
                    <ChevronDown size={16} aria-hidden="true" />
                  </motion.span>
                </button>
              </Collapsible.Trigger>
            }
          >
            <p className="text-body text-dim leading-[1.75]">
              {myeongsik.branchRelations.summary}
            </p>

            {myeongsik.branchRelations.hits.length > 0 ? (
              <div className="mt-3.5 grid grid-cols-1 gap-3 md:grid-cols-2">
                {myeongsik.branchRelations.hits.map((hit, index) => (
                  <article
                    key={`${hit.kind}-${hit.label}-${index}`}
                    className="border-line bg-track rounded-[2px] border px-3.5 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="font-myeongjo text-body font-bold">
                        {hit.kind} <span className="text-mute">{hit.hanja}</span>
                      </h3>
                      {hit.stateLabel && (
                        <span className={BADGE_BASE} style={badgeStyle(true)}>
                          {hit.stateLabel}
                        </span>
                      )}
                      {hit.element && (
                        <span
                          className={BADGE_BASE}
                          style={{
                            ...badgeStyle(true),
                            color: elementColor(hit.element, dark),
                          }}
                        >
                          {hit.element}
                        </span>
                      )}
                    </div>
                    <p className="text-body mt-1.5 font-medium">{hit.label}</p>
                    <p className="text-small text-mute mt-1">
                      {hit.branchesLabel} · {hit.pillarsLabel}
                    </p>
                    {hit.missingBranchesLabel && (
                      <p className="text-small text-mute mt-1">
                        남은 글자: {hit.missingBranchesLabel}
                      </p>
                    )}
                    <p className="text-small text-dim mt-2 leading-[1.65]">
                      {hit.description}
                    </p>
                    <div className="border-line mt-3 border-t pt-3">
                      <h4 className="text-small text-fg font-semibold">
                        관계의 특징
                      </h4>
                      <p className="text-small text-dim mt-1 leading-[1.65]">
                        {hit.feature}
                      </p>
                      <h4 className="text-small text-fg mt-2.5 font-semibold">
                        생활에서 살펴볼 흐름
                      </h4>
                      <ul className="text-small text-dim mt-1.5 space-y-1 leading-[1.65]">
                        {hit.lifeTendencies.map((tendency) => (
                          <li key={tendency} className="flex gap-1.5">
                            <span aria-hidden="true">·</span>
                            <span>{tendency}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-micro text-mute mt-1.5 leading-[1.6]">
                      {hit.readingNote}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-track text-small text-mute mt-3.5 rounded-[2px] px-3.5 py-3 leading-[1.65]">
                현재 명식에서 성립한 관계가 없더라도, 아래 참고표로 각 관계의 기준을 확인할 수 있습니다.
              </div>
            )}

            {saju.unknownHour && (
              <p className="text-small text-mute mt-3 leading-[1.65]">
                출생 시간이 미상이므로 시지는 관계 판정에서 제외했습니다.
              </p>
            )}

            <Collapsible.Content
              className={cn("overflow-hidden", styles.collapsibleContent)}
            >
              <div className="border-line mt-4.5 border-t pt-4.5">
                <h3 className="font-myeongjo text-subtitle mb-3 font-bold">
                  지지 관계 참고표
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {myeongsik.branchRelations.guide.map((guide) => (
                    <article
                      key={guide.kind}
                      className="border-line rounded-[2px] border px-3.5 py-3"
                    >
                      <h4 className="font-myeongjo text-body font-bold">
                        {guide.kind} <span className="text-mute">{guide.hanja}</span>
                        <span className="text-dim"> · {guide.title}</span>
                      </h4>
                      <p className="text-small text-dim mt-1.5 leading-[1.65]">
                        {guide.description}
                      </p>
                      <p className="text-small text-fg mt-2 leading-[1.65]">
                        {guide.groups.join(" / ")}
                      </p>
                      <p className="text-micro text-mute mt-1.5 leading-[1.6]">
                        {guide.readingNote}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </Collapsible.Content>
          </SectionCard>
        </Collapsible.Root>
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
              className="border-line bg-surface font-myeongjo text-body mt-1 block h-10 w-full rounded-[2px] border px-2.5"
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
          <div className="text-body text-dim mt-1">
            {nameVm.harmonyDescription} (조화도 {nameVm.harmonyScore}점)
          </div>
          {nameVm.supplementElements.length > 0 && (
            <div className="text-small text-mute mt-2">
              보완 오행: {nameVm.supplementElements.join(", ")}
            </div>
          )}

          {nameVm.strokeAnalysis ? (
            <div className="border-line mt-4.5 border-t pt-3.5">
              <div className="font-myeongjo text-subtitle mb-2 font-bold">
                성명학 획수(오격)
              </div>
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
                    nameVm.strokeAnalysis.fortune === "흉"
                      ? "var(--danger)"
                      : undefined,
                  )}
                >
                  총격 {nameVm.strokeAnalysis.totalGround} ·{" "}
                  {nameVm.strokeAnalysis.fortune}
                </span>
              </div>
              {nameVm.strokeAnalysis.hasUnverifiedStroke && (
                <div className="text-micro text-mute">
                  ⓘ 일부 글자는 원획 보정을 자체 추정한 값이라 확정도가
                  낮습니다.
                </div>
              )}
            </div>
          ) : (
            hanjaInput.trim() && (
              <div className="text-small text-mute mt-3.5">
                ⓘ {nameVm.strokeUnavailableReason}
              </div>
            )
          )}
        </SectionCard>
      )}
    </div>
  );
}
