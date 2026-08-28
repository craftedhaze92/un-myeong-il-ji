"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { DaeUnPeriod } from "@/lib/dae_un";
import type { SajuData } from "@/types";
import {
  dimText,
  elementColor,
  FONT_BATANG,
  FONT_MONO,
  FONT_MYEONGJO,
  FS,
  muteText,
} from "./constants";
import {
  buildDaeunDetailViewModel,
  buildNameAnalysisVM,
  buildPungsuViewModel,
  buildSeyunDetailViewModel,
  buildTimingViewModel,
  buildWolunDetailViewModel,
  DECISION_TYPES,
  type ReadingVM,
} from "./reading-view-model";
import { buildTodayViewModel } from "./today-view-model";
import { BulletList } from "./ui/bullet-list";
import { SectionCard } from "./ui/section-card";
import { ScoreBar } from "./ui/score-bar";

export interface ReadingPanelProps {
  saju: SajuData;
  daeUn: DaeUnPeriod[];
  readingVM: ReadingVM;
  dark: boolean;
  /** 이름 오행 분석(명식 탭)에 쓰는, 사용자가 입력 폼에 적은 성명 */
  name: string;
}

type TabKey = "myeongsik" | "life" | "flow" | "career" | "today" | "pungsu";

const TABS: { key: TabKey; label: string }[] = [
  { key: "myeongsik", label: "명식" },
  { key: "life", label: "인생" },
  { key: "flow", label: "흐름" },
  { key: "career", label: "직업" },
  { key: "today", label: "오늘" },
  { key: "pungsu", label: "방위" },
];

function tabBtnStyle(active: boolean): CSSProperties {
  return {
    background: active ? "var(--track)" : "transparent",
    border: `1px solid ${active ? "var(--fg)" : "var(--line)"}`,
    color: active ? "var(--fg)" : "var(--dim)",
    fontFamily: FONT_MYEONGJO,
    fontSize: FS.body,
    padding: "8px 20px",
    borderRadius: 2,
    cursor: "pointer",
    transition: "all .2s",
  };
}

function pillBtnStyle(active: boolean, accent?: string): CSSProperties {
  return {
    background: active ? "var(--track)" : "transparent",
    border: `1px solid ${active ? (accent ?? "var(--fg)") : "var(--line)"}`,
    color: active ? (accent ?? "var(--fg)") : "var(--dim)",
    fontFamily: FONT_MONO,
    fontSize: FS.body,
    padding: "8px 14px",
    borderRadius: 2,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

export function ReadingPanel({
  saju,
  daeUn,
  readingVM,
  dark,
  name,
}: ReadingPanelProps) {
  const [tab, setTab] = useState<TabKey>("myeongsik");

  return (
    <section
      style={{
        width: "100%",
        maxWidth: 1100,
        paddingTop: 20,
      }}
    >
      <div
        role="tablist"
        aria-label="풀이 탭"
        style={{ display: "flex", gap: 8, marginBottom: 22 }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            style={tabBtnStyle(tab === t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "myeongsik" && (
        <MyeongsikTab vm={readingVM} saju={saju} name={name} dark={dark} />
      )}
      {tab === "life" && <LifeTab vm={readingVM} />}
      {tab === "flow" && (
        <FlowTab saju={saju} daeUn={daeUn} vm={readingVM} dark={dark} />
      )}
      {tab === "career" && <CareerTab vm={readingVM} dark={dark} />}
      {tab === "today" && <TodayTab saju={saju} />}
      {tab === "pungsu" && <PungsuTab saju={saju} dark={dark} />}
    </section>
  );
}

// ── 명식 탭 ────────────────────────────────────────────────────────────

function MyeongsikTab({
  vm,
  saju,
  name,
  dark,
}: {
  vm: ReadingVM;
  saju: SajuData;
  name: string;
  dark: boolean;
}) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <SectionCard title="격국 · 일간 강약">
          {myeongsik.gyeokGuk && (
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontFamily: FONT_MYEONGJO,
                  fontSize: FS.subtitle,
                  fontWeight: 700,
                }}
              >
                {myeongsik.gyeokGuk.name} ({myeongsik.gyeokGuk.hanja})
              </div>
              <div
                style={{
                  fontSize: FS.body,
                  lineHeight: 1.75,
                  marginTop: 4,
                  ...dimText,
                }}
              >
                {myeongsik.gyeokGuk.description}
              </div>
              {myeongsik.gyeokGuk.quality && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span
                      style={pillBtnStyle(
                        true,
                        myeongsik.gyeokGuk.quality.statusLabel.startsWith("성격") ||
                          myeongsik.gyeokGuk.quality.statusLabel.startsWith("패중유구")
                          ? undefined
                          : "var(--danger)",
                      )}
                    >
                      {myeongsik.gyeokGuk.quality.statusLabel}
                    </span>
                    <span style={pillBtnStyle(false)}>{myeongsik.gyeokGuk.quality.useType}</span>
                    {myeongsik.gyeokGuk.quality.sangSinLabel && (
                      <span style={pillBtnStyle(false)}>상신 {myeongsik.gyeokGuk.quality.sangSinLabel}</span>
                    )}
                  </div>
                  <div style={{ fontSize: FS.small, lineHeight: 1.7, marginTop: 8, ...muteText }}>
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
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  fontFamily: FONT_MYEONGJO,
                  fontSize: FS.subtitle,
                  fontWeight: 700,
                }}
              >
                일간 강약
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: FS.body,
                    ...muteText,
                  }}
                >
                  {myeongsik.dayMasterStrength.levelLabel} ·{" "}
                  {myeongsik.dayMasterStrength.score}점
                </span>
              </div>
              <div
                style={{
                  fontSize: FS.body,
                  lineHeight: 1.75,
                  marginTop: 10,
                  ...dimText,
                }}
              >
                {myeongsik.dayMasterStrength.analysis}
              </div>
              {myeongsik.dayMasterStrength.deukRyeong !== undefined && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  <span style={pillBtnStyle(myeongsik.dayMasterStrength.deukRyeong)}>
                    {myeongsik.dayMasterStrength.deukRyeong ? "득령" : "실령"}
                  </span>
                  <span style={pillBtnStyle(!!myeongsik.dayMasterStrength.deukJi)}>
                    {myeongsik.dayMasterStrength.deukJi ? "득지" : "실지"}
                  </span>
                  <span style={pillBtnStyle(!!myeongsik.dayMasterStrength.deukSe)}>
                    {myeongsik.dayMasterStrength.deukSe ? "득세" : "실세"}
                  </span>
                  {myeongsik.dayMasterStrength.rootedAtLabels.length > 0 && (
                    <span style={pillBtnStyle(true)}>
                      {myeongsik.dayMasterStrength.rootedAtLabels.join("·")}지 통근
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          {myeongsik.wolRyeong && (
            <div style={{ marginTop: 14, fontSize: FS.body, ...muteText }}>
              월령: {myeongsik.wolRyeong.isDeukRyeong ? "득령" : "실령"} (
              {myeongsik.wolRyeong.strengthLabel}) —{" "}
              {myeongsik.wolRyeong.reason}
            </div>
          )}
        </SectionCard>

        {myeongsik.yongSin && (
          <SectionCard title="용신 실천 조언">
            {myeongsik.yongSin.methodLabel && (
              <div style={{ marginBottom: 10 }}>
                <span style={pillBtnStyle(true)}>{myeongsik.yongSin.methodLabel}</span>
              </div>
            )}
            <div
              style={{
                fontSize: FS.body,
                lineHeight: 1.75,
                marginBottom: 12,
                ...dimText,
              }}
            >
              {myeongsik.yongSin.reasoning}
            </div>
            {myeongsik.yongSin.lowConfidenceNote && (
              <div style={{ fontSize: FS.small, lineHeight: 1.6, marginBottom: 12, ...muteText }}>
                ⓘ {myeongsik.yongSin.lowConfidenceNote}
              </div>
            )}
            <BulletList items={myeongsik.yongSin.advice} />
          </SectionCard>
        )}
      </div>

      {myeongsik.jiJangGan.length > 0 && (
        <SectionCard title="지장간 세력">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${myeongsik.jiJangGan.length}, 1fr)`,
              gap: 16,
            }}
          >
            {myeongsik.jiJangGan.map((pillar, i) => (
              <div key={i}>
                <div
                  style={{ fontSize: FS.body, marginBottom: 8, ...muteText }}
                >
                  {pillar.pillarLabel}
                </div>
                {pillar.entries.map((entry, j) => (
                  <div key={j} style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: FS.body,
                        marginBottom: 3,
                        ...dimText,
                      }}
                    >
                      <span>
                        {entry.hanja}({entry.stem}) · {entry.roleLabel}
                      </span>
                      <span style={{ fontFamily: FONT_MONO }}>
                        {entry.strength}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        borderRadius: 2,
                        background: "var(--track)",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${entry.strength}%`,
                          background: "var(--fg)",
                          opacity: 0.6,
                          borderRadius: 2,
                        }}
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
          <div
            style={{
              fontSize: FS.body,
              lineHeight: 1.75,
              marginBottom: 10,
              ...dimText,
            }}
          >
            {myeongsik.branchRelations.summary}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {myeongsik.branchRelations.samHap && (
              <span style={pillBtnStyle(true)}>
                삼합 {myeongsik.branchRelations.samHap}
              </span>
            )}
            {myeongsik.branchRelations.samHyeong.map((s, i) => (
              <span key={`h-${i}`} style={pillBtnStyle(true)}>
                {s}
              </span>
            ))}
            {myeongsik.branchRelations.yukHae.map((s, i) => (
              <span key={`y-${i}`} style={pillBtnStyle(true)}>
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
          <label style={{ display: "block", marginBottom: 14 }}>
            <span style={{ fontSize: FS.small, ...muteText }}>
              한자 입력(선택, {nameVm.name.length}자와 같은 글자 수로)
            </span>
            <input
              value={hanjaInput}
              onChange={(e) => setHanjaInput(e.target.value)}
              placeholder={"예: " + "金敏俊".slice(0, nameVm.name.length)}
              style={{
                display: "block",
                width: "100%",
                marginTop: 4,
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 2,
                height: 40,
                padding: "0 10px",
                fontFamily: FONT_MYEONGJO,
                fontSize: FS.body,
              }}
            />
          </label>

          <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
            {nameVm.characters.map((c, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: FONT_MYEONGJO,
                    fontSize: FS.sectionHead,
                    fontWeight: 800,
                    color: elementColor(c.element, dark),
                  }}
                >
                  {c.char}
                </div>
                <div style={{ fontSize: FS.caption, ...muteText }}>
                  {c.element}
                  {c.meaning ? ` · ${c.meaning}` : ""}
                </div>
                <div style={{ fontSize: FS.micro, ...muteText }}>
                  {c.elementSourceLabel}
                  {c.lowConfidenceElement ? "(근거 약함)" : ""}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: FS.body, ...dimText }}>
            오행 구성: {nameVm.wuxingBalanceLabel}
            {nameVm.isFavorable ? " (사주와 함께 무난한 균형)" : ""}
          </div>
          <div style={{ fontSize: FS.body, marginTop: 4, ...dimText }}>
            {nameVm.harmonyDescription} (조화도 {nameVm.harmonyScore}점)
          </div>
          {nameVm.supplementElements.length > 0 && (
            <div style={{ fontSize: FS.small, marginTop: 8, ...muteText }}>
              보완 오행: {nameVm.supplementElements.join(", ")}
            </div>
          )}

          {nameVm.strokeAnalysis ? (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
              <div
                style={{
                  fontFamily: FONT_MYEONGJO,
                  fontSize: FS.subtitle,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                성명학 획수(오격)
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                <span style={pillBtnStyle(true)}>천격 {nameVm.strokeAnalysis.heavenGround}</span>
                <span style={pillBtnStyle(true)}>인격 {nameVm.strokeAnalysis.personalGround}</span>
                <span style={pillBtnStyle(true)}>지격 {nameVm.strokeAnalysis.earthGround}</span>
                <span style={pillBtnStyle(true)}>외격 {nameVm.strokeAnalysis.outerGround}</span>
                <span
                  style={pillBtnStyle(
                    true,
                    nameVm.strokeAnalysis.fortune === "흉" ? "var(--danger)" : undefined,
                  )}
                >
                  총격 {nameVm.strokeAnalysis.totalGround} · {nameVm.strokeAnalysis.fortune}
                </span>
              </div>
              {nameVm.strokeAnalysis.hasUnverifiedStroke && (
                <div style={{ fontSize: FS.micro, ...muteText }}>
                  ⓘ 일부 글자는 원획 보정을 자체 추정한 값이라 확정도가 낮습니다.
                </div>
              )}
            </div>
          ) : (
            hanjaInput.trim() && (
              <div style={{ fontSize: FS.small, marginTop: 14, ...muteText }}>
                ⓘ {nameVm.strokeUnavailableReason}
              </div>
            )
          )}
        </SectionCard>
      )}
    </div>
  );
}

// ── 인생 탭 ────────────────────────────────────────────────────────────

function LifeTab({ vm }: { vm: ReadingVM }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        {vm.life.fortunes.map((f) => (
          <SectionCard key={f.type} title={f.label}>
            <ScoreBar score={f.score} />
            <div
              style={{
                fontSize: FS.body,
                lineHeight: 1.75,
                margin: "12px 0",
                ...dimText,
              }}
            >
              {f.summary}
            </div>
            <BulletList items={f.positive} tone="positive" />
            <BulletList items={f.negative} tone="negative" />
            <BulletList items={f.advice} />
            {(f.luckyColors.length > 0 || f.luckyDirections.length > 0) && (
              <div style={{ fontSize: FS.body, marginTop: 4, ...muteText }}>
                {f.luckyColors.length > 0 && (
                  <>길한 색: {f.luckyColors.join(", ")} </>
                )}
                {f.luckyDirections.length > 0 && (
                  <>· 길한 방향: {f.luckyDirections.join(", ")}</>
                )}
              </div>
            )}
          </SectionCard>
        ))}
      </div>

      <SectionCard title="성격 — 두드러진 십성">
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}
        >
          {vm.life.personality.map((p, i) => (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: FONT_BATANG,
                  fontSize: FS.label,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                <span>{p.tenGod}</span>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: FS.body,
                    ...muteText,
                  }}
                >
                  {p.intensityLabel}
                </span>
              </div>
              <BulletList items={p.strengths} tone="positive" />
              <BulletList items={p.weaknesses} tone="negative" />
              <BulletList items={p.advice} />
            </div>
          ))}
          {vm.life.personality.length === 0 && (
            <div style={{ fontSize: FS.body, ...muteText }}>
              표시할 십성 분포가 없습니다.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// ── 흐름 탭 ────────────────────────────────────────────────────────────

function FlowTab({
  saju,
  daeUn,
  vm,
  dark,
}: {
  saju: SajuData;
  daeUn: DaeUnPeriod[];
  vm: ReadingVM;
  dark: boolean;
}) {
  const [selectedStartAge, setSelectedStartAge] = useState(
    vm.flow.selectedDaeun?.startAge ?? vm.flow.daeunOptions[0]?.startAge ?? 0,
  );
  const [selectedYear, setSelectedYear] = useState(vm.flow.selectedSeyun.year);
  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date().getMonth() + 1,
  );
  const [selectedDecision, setSelectedDecision] = useState<
    (typeof DECISION_TYPES)[number] | null
  >(null);

  const daeunDetail = useMemo(
    () => buildDaeunDetailViewModel(saju, daeUn, selectedStartAge),
    [saju, daeUn, selectedStartAge],
  );
  const seyunDetail = useMemo(
    () => buildSeyunDetailViewModel(saju, selectedYear),
    [saju, selectedYear],
  );
  const wolunDetail = useMemo(
    () => buildWolunDetailViewModel(saju, selectedYear, selectedMonth),
    [saju, selectedYear, selectedMonth],
  );
  // 결정 타입을 고르기 전까지는 계산하지 않는다 — analyzeTimingAdvice가 12개월 예보 +
  // 3년 전망을 매번 새로 계산하는 비교적 무거운 함수라서다.
  const timingVm = useMemo(
    () => (selectedDecision ? buildTimingViewModel(saju, selectedDecision) : null),
    [saju, selectedDecision],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionCard title="대운 — 10년의 계절">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 18,
          }}
        >
          {vm.flow.daeunOptions.map((o) => (
            <button
              key={o.startAge}
              onClick={() => setSelectedStartAge(o.startAge)}
              style={pillBtnStyle(
                o.startAge === selectedStartAge,
                elementColor(o.element, dark),
              )}
            >
              {o.startAge}–{o.endAge} {o.pillar}
              {o.isCurrent ? " ·현재" : ""}
            </button>
          ))}
        </div>
        {daeunDetail && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontFamily: FONT_MYEONGJO,
                  fontSize: FS.sectionHead,
                  fontWeight: 800,
                }}
              >
                {daeunDetail.pillar}
              </span>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: FS.small,
                  ...muteText,
                }}
              >
                {daeunDetail.overall} · {daeunDetail.score}점 · 조화도{" "}
                {daeunDetail.harmonyScore}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <ScoreBar label="직업운" score={daeunDetail.aspects.career} />
              <ScoreBar label="재물운" score={daeunDetail.aspects.wealth} />
              <ScoreBar label="건강운" score={daeunDetail.aspects.health} />
              <ScoreBar
                label="인간관계운"
                score={daeunDetail.aspects.relationship}
              />
            </div>
            <div
              style={{
                fontSize: FS.body,
                lineHeight: 1.75,
                marginBottom: 10,
                ...dimText,
              }}
            >
              {daeunDetail.summary}
            </div>
            <BulletList items={daeunDetail.opportunities} tone="positive" />
            <BulletList items={daeunDetail.challenges} tone="negative" />
            <BulletList items={daeunDetail.advice} />
          </div>
        )}
      </SectionCard>

      <SectionCard title="세운 — 올해를 중심으로">
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            height: 72,
            marginBottom: 12,
          }}
        >
          {vm.flow.seyunSpark.map((point) => (
            <button
              key={point.year}
              onClick={() => setSelectedYear(point.year)}
              title={`${point.year} ${point.pillar} · ${point.score}점`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 4,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: Math.max(4, (point.score / 100) * 48),
                  borderRadius: 2,
                  background:
                    point.year === selectedYear ? "var(--fg)" : "var(--track)",
                }}
              />
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: FS.micro,
                  color:
                    point.year === selectedYear ? "var(--fg)" : "var(--mute)",
                }}
              >
                {point.year}
              </span>
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontFamily: FONT_MYEONGJO,
              fontSize: FS.sectionHead,
              fontWeight: 800,
            }}
          >
            {seyunDetail.pillar}
          </span>
          <span
            style={{ fontFamily: FONT_MONO, fontSize: FS.small, ...muteText }}
          >
            {seyunDetail.year}년 · 만 {seyunDetail.age}세 ·{" "}
            {seyunDetail.overall} · {seyunDetail.score}점
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <ScoreBar label="사업운" score={seyunDetail.aspects.career} />
          <ScoreBar label="재물운" score={seyunDetail.aspects.wealth} />
          <ScoreBar label="건강운" score={seyunDetail.aspects.health} />
          <ScoreBar
            label="인간관계운"
            score={seyunDetail.aspects.relationship}
          />
        </div>
        <div
          style={{
            fontSize: FS.body,
            lineHeight: 1.75,
            marginBottom: 10,
            ...dimText,
          }}
        >
          {seyunDetail.summary}
        </div>
        <BulletList items={seyunDetail.opportunities} tone="positive" />
        <BulletList items={seyunDetail.challenges} tone="negative" />
        <BulletList items={seyunDetail.advice} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: 4,
            marginTop: 12,
          }}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
            const favorable = seyunDetail.favorableMonths.includes(month);
            const cautious = seyunDetail.cautiousMonths.includes(month);
            const selected = month === selectedMonth;
            return (
              <button
                key={month}
                type="button"
                onClick={() => setSelectedMonth(month)}
                aria-pressed={selected}
                title={
                  favorable ? "유리한 달" : cautious ? "주의할 달" : undefined
                }
                style={{
                  textAlign: "center",
                  fontSize: FS.micro,
                  fontFamily: FONT_MONO,
                  padding: "6px 0",
                  borderRadius: 2,
                  cursor: "pointer",
                  color: favorable
                    ? "var(--fg)"
                    : cautious
                      ? "var(--danger)"
                      : "var(--mute)",
                  background: favorable ? "var(--track)" : "transparent",
                  border: `1px solid ${cautious ? "var(--danger)" : "var(--line)"}`,
                  outline: selected ? "2px solid var(--fg)" : "none",
                  outlineOffset: -2,
                }}
              >
                {month}월
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="월운 — 이 달의 결">
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontFamily: FONT_MYEONGJO,
              fontSize: FS.sectionHead,
              fontWeight: 800,
            }}
          >
            {wolunDetail.pillar}
          </span>
          <span
            style={{ fontFamily: FONT_MONO, fontSize: FS.small, ...muteText }}
          >
            {wolunDetail.year}년 {wolunDetail.month}월 · {wolunDetail.overall}{" "}
            · {wolunDetail.score}점
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <ScoreBar label="직업운" score={wolunDetail.aspects.career} />
          <ScoreBar label="재물운" score={wolunDetail.aspects.wealth} />
          <ScoreBar label="건강운" score={wolunDetail.aspects.health} />
          <ScoreBar
            label="인간관계운"
            score={wolunDetail.aspects.relationship}
          />
        </div>
        <div
          style={{
            fontSize: FS.body,
            lineHeight: 1.75,
            marginBottom: 12,
            ...dimText,
          }}
        >
          {wolunDetail.balanceDescription}
        </div>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}
        >
          {wolunDetail.keywords.map((k, i) => (
            <span
              key={i}
              style={pillBtnStyle(true, elementColor(wolunDetail.element, dark))}
            >
              {k}
            </span>
          ))}
        </div>

        <div
          style={{
            fontFamily: FONT_BATANG,
            fontWeight: 700,
            fontSize: FS.small,
            marginBottom: 4,
          }}
        >
          이 달의 기회 · 주의
        </div>
        <BulletList items={wolunDetail.opportunities} tone="positive" />
        <BulletList items={wolunDetail.cautions} tone="negative" />
        <div
          style={{
            fontFamily: FONT_BATANG,
            fontWeight: 700,
            fontSize: FS.small,
            margin: "10px 0 4px",
          }}
        >
          하면 좋은 일 · 피할 일
        </div>
        <BulletList items={wolunDetail.doList} tone="positive" />
        <BulletList items={wolunDetail.dontList} tone="negative" />

        <div style={{ fontSize: FS.body, marginTop: 4, ...muteText }}>
          유리한 방위 {wolunDetail.direction} · 색 {wolunDetail.color}
        </div>

        {(wolunDetail.luckyDates.length > 0 ||
          wolunDetail.unluckyDates.length > 0) && (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}
          >
            {wolunDetail.luckyDates.map((d) => (
              <span key={`l-${d}`} style={pillBtnStyle(true)}>
                길일 {d}일
              </span>
            ))}
            {wolunDetail.unluckyDates.map((d) => (
              <span
                key={`u-${d}`}
                style={pillBtnStyle(true, "var(--danger)")}
              >
                흉일 {d}일
              </span>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="시기 조언">
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}
        >
          {DECISION_TYPES.map((d) => (
            <button
              key={d}
              onClick={() =>
                setSelectedDecision((cur) => (cur === d ? null : d))
              }
              style={pillBtnStyle(selectedDecision === d)}
            >
              {d}
            </button>
          ))}
        </div>

        {!timingVm && (
          <div style={{ fontSize: FS.small, ...muteText }}>
            결정 항목을 고르면 향후 3년의 시기를 분석합니다.
          </div>
        )}

        {timingVm && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: FS.body, lineHeight: 1.75, ...dimText }}>
              {timingVm.summary.overallAdvice}
            </div>
            <div style={{ fontSize: FS.small, ...muteText }}>
              적기: {timingVm.summary.bestYear}년 {timingVm.summary.bestMonth}
              월({timingVm.summary.bestSeason}) · 시급도{" "}
              {timingVm.summary.urgency}
            </div>

            <div>
              <div
                style={{
                  fontFamily: FONT_BATANG,
                  fontWeight: 700,
                  fontSize: FS.small,
                  marginBottom: 8,
                }}
              >
                최적 시기
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {timingVm.optimalTiming.map((o, i) => (
                  <div key={i}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontFamily: FONT_MONO, fontWeight: 700 }}>
                        {o.period}
                      </span>
                      <span style={{ fontSize: FS.caption, ...muteText }}>
                        {o.rating} · {o.score}점
                      </span>
                    </div>
                    <div style={{ fontSize: FS.small, ...dimText }}>
                      {o.yongsinSupport}
                    </div>
                    <BulletList items={o.reasons} tone="positive" />
                    <BulletList items={o.cautions} tone="negative" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: FONT_BATANG,
                  fontWeight: 700,
                  fontSize: FS.small,
                  marginBottom: 8,
                }}
              >
                12개월 예보
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 4,
                  height: 60,
                }}
              >
                {timingVm.monthlyForecast.map((m, i) => (
                  <div
                    key={i}
                    title={`${m.yearMonth} ${m.rating} · ${m.briefAdvice}`}
                    style={{
                      flex: 1,
                      height: `${Math.max(6, m.score)}%`,
                      background:
                        m.rating === "최적기" || m.rating === "좋음"
                          ? "var(--fg)"
                          : m.rating === "불가" || m.rating === "주의"
                            ? "var(--danger)"
                            : "var(--track)",
                      borderRadius: 2,
                    }}
                  />
                ))}
              </div>
            </div>

            {timingVm.timesToAvoid.length > 0 && (
              <div>
                <div
                  style={{
                    fontFamily: FONT_BATANG,
                    fontWeight: 700,
                    fontSize: FS.small,
                    marginBottom: 8,
                  }}
                >
                  피해야 할 시기
                </div>
                {timingVm.timesToAvoid.map((t, i) => (
                  <div key={i} style={{ fontSize: FS.small, marginBottom: 6 }}>
                    <span style={{ color: "var(--danger)" }}>
                      {t.period} ({t.severity})
                    </span>{" "}
                    <span style={{ ...dimText }}>{t.reason}</span>
                    {t.alternatives.length > 0 && (
                      <span style={{ ...muteText }}>
                        {" "}
                        — 대안: {t.alternatives.join(", ")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div>
              <div
                style={{
                  fontFamily: FONT_BATANG,
                  fontWeight: 700,
                  fontSize: FS.small,
                  marginBottom: 8,
                }}
              >
                3년 장기 전망
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${timingVm.longTermOutlook.length}, 1fr)`,
                  gap: 14,
                }}
              >
                {timingVm.longTermOutlook.map((y) => (
                  <div key={y.year}>
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: FS.small,
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      {y.year}년 · {y.overallRating}
                    </div>
                    <BulletList items={y.majorOpportunities} tone="positive" />
                    <BulletList items={y.majorChallenges} tone="negative" />
                    {y.daeunInfluence && (
                      <div style={{ fontSize: FS.caption, ...muteText }}>
                        {y.daeunInfluence}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── 방위 탭 ────────────────────────────────────────────────────────────

function PungsuTab({ saju, dark }: { saju: SajuData; dark: boolean }) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <SectionCard title="길한 방위">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {vm.luckyDirections.map((d, i) => (
              <div key={i}>
                <div style={{ fontFamily: FONT_MONO, fontWeight: 700 }}>
                  {d.direction}
                </div>
                <div style={{ fontSize: FS.small, ...dimText }}>{d.detail}</div>
                <div style={{ fontSize: FS.caption, ...muteText }}>
                  {d.tags.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="주의할 방위">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {vm.unluckyDirections.map((d, i) => (
              <div key={i}>
                <div style={{ fontFamily: FONT_MONO, fontWeight: 700, color: "var(--danger)" }}>
                  {d.direction}
                </div>
                <div style={{ fontSize: FS.small, ...dimText }}>{d.reason}</div>
                <div style={{ fontSize: FS.caption, ...muteText }}>
                  피할 배치: {d.avoid.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="공간별 조언"
        subtitle={`${vm.yearlyDirections.year}년 길한 방위 ${vm.yearlyDirections.luckyDirection} · 주의 방위 ${vm.yearlyDirections.unluckyDirection}`}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {vm.spaceAdvice.map((s) => (
            <button
              key={s.spaceType}
              onClick={() => setSelectedSpace(s.spaceType)}
              style={pillBtnStyle(selectedSpace === s.spaceType)}
            >
              {s.spaceType}
            </button>
          ))}
        </div>
        {space && (
          <div>
            <div style={{ fontSize: FS.body, marginBottom: 6, ...dimText }}>
              최적 방향: {space.bestDirection} · {space.layout}
            </div>
            <div style={{ fontSize: FS.small, marginBottom: 4, ...muteText }}>
              색상: {space.colors.join(", ")}
            </div>
            <div style={{ fontSize: FS.small, marginBottom: 4, ...muteText }}>
              가구: {space.furniture.join(", ")}
            </div>
            {space.plants && (
              <div style={{ fontSize: FS.small, marginBottom: 4, ...muteText }}>
                식물: {space.plants.join(", ")}
              </div>
            )}
            <div style={{ fontSize: FS.small, color: "var(--danger)" }}>
              피할 것: {space.avoid.join(", ")}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="오행별 인테리어">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
          {vm.elementalDecor.map((e) => (
            <div key={e.element}>
              <div
                style={{
                  fontFamily: FONT_MYEONGJO,
                  fontWeight: 700,
                  color: elementColor(e.element, dark),
                  marginBottom: 4,
                }}
              >
                {e.element}
              </div>
              <div style={{ fontSize: FS.caption, ...dimText }}>
                {e.colors.join(", ")}
              </div>
              <div style={{ fontSize: FS.caption, ...muteText }}>
                {e.items.join(", ")}
              </div>
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

// ── 직업 탭 ────────────────────────────────────────────────────────────

function CareerTab({ vm, dark }: { vm: ReadingVM; dark: boolean }) {
  const { career } = vm;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionCard title="직업 적성 총평">
        <div style={{ fontSize: FS.body, lineHeight: 1.75, ...dimText }}>
          {career.summary}
        </div>
      </SectionCard>

      <SectionCard title="추천 직업">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {career.recommendations.map((r, i) => (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_BATANG,
                    fontSize: FS.label,
                    fontWeight: 700,
                  }}
                >
                  {r.category}
                </span>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: FS.caption,
                    ...muteText,
                  }}
                >
                  {r.strengthLabel} · {r.score}점
                </span>
              </div>
              <div style={{ fontSize: FS.small, marginBottom: 4, ...dimText }}>
                {r.specificJobs.join(", ")}
              </div>
              <div style={{ fontSize: FS.small, lineHeight: 1.75, ...dimText }}>
                {r.reason}
              </div>
              <div style={{ fontSize: FS.caption, marginTop: 2, ...muteText }}>
                {r.yongsinAlignment}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <SectionCard title="피해야 할 직업">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {career.jobsToAvoid.map((j, i) => (
              <div key={i}>
                <div
                  style={{
                    fontFamily: FONT_BATANG,
                    fontSize: FS.body,
                    fontWeight: 700,
                  }}
                >
                  {j.category}
                </div>
                <div
                  style={{ fontSize: FS.small, lineHeight: 1.75, ...dimText }}
                >
                  {j.reason}
                </div>
                <div
                  style={{ fontSize: FS.caption, marginTop: 2, ...muteText }}
                >
                  대안: {j.alternativeSuggestion}
                </div>
              </div>
            ))}
            {career.jobsToAvoid.length === 0 && (
              <div style={{ fontSize: FS.small, ...muteText }}>
                특별히 피할 직업은 없습니다.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="오행별 직업 적성">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {career.elementalAffinity.map((e, i) => (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: FS.small, ...dimText }}>
                    {e.element} 기운
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: FS.caption,
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
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 4,
                    fontFamily: FONT_MONO,
                    fontSize: FS.caption,
                    ...muteText,
                  }}
                >
                  <span>강점(발달) {e.strengthScore}</span>
                  <span>용신 {e.yongsinScore}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="경력 개발 조언">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 18,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONT_BATANG,
                fontSize: FS.body,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              초기 경력 (20-30대)
            </div>
            <BulletList items={career.careerAdvice.earlyCareer} />
          </div>
          <div>
            <div
              style={{
                fontFamily: FONT_BATANG,
                fontSize: FS.body,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              중기 경력 (40-50대)
            </div>
            <BulletList items={career.careerAdvice.midCareer} />
          </div>
          <div>
            <div
              style={{
                fontFamily: FONT_BATANG,
                fontSize: FS.body,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              후기 경력 (60대 이상)
            </div>
            <BulletList items={career.careerAdvice.lateCareer} />
          </div>
        </div>
        <div style={{ fontSize: FS.small, marginTop: 14, ...muteText }}>
          창업 적성: {career.careerAdvice.entrepreneurship}
        </div>
      </SectionCard>
    </div>
  );
}

// ── 오늘 탭 ────────────────────────────────────────────────────────────

/** dayOffset(0=오늘, -1=어제, +1=내일)만큼 옮긴 로컬 자정 Date. */
function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function TodayTab({ saju }: { saju: SajuData }) {
  const [dayOffset, setDayOffset] = useState(0);

  // buildReadingViewModel과 달리 탭이 선택됐을 때만, dayOffset이 바뀔 때만 다시 계산한다 —
  // analyzeIljin·getDailyFortune·getDailySiUn을 매 렌더 다시 부르지 않는다.
  const vm = useMemo(
    () => buildTodayViewModel(saju, addDays(new Date(), dayOffset)),
    [saju, dayOffset],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionCard
        title={`${vm.dayPillar}일 · ${vm.ratingLabel}`}
        subtitle={vm.dateLabel}
        titleRight={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setDayOffset((v) => v - 1)}
              style={pillBtnStyle(false)}
            >
              ← 어제
            </button>
            <button
              onClick={() => setDayOffset(0)}
              style={pillBtnStyle(dayOffset === 0)}
            >
              오늘
            </button>
            <button
              onClick={() => setDayOffset((v) => v + 1)}
              style={pillBtnStyle(false)}
            >
              내일 →
            </button>
          </div>
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {vm.scores.map((s) => (
            <ScoreBar key={s.label} label={s.label} score={s.score} />
          ))}
        </div>
        <div style={{ fontSize: FS.body, lineHeight: 1.75, ...dimText }}>
          {vm.dailyAdvice}
        </div>
        <div style={{ fontSize: FS.small, marginTop: 8, ...muteText }}>
          {vm.twelveGodLabel} · {vm.twelveGodDescription}
        </div>
        <div style={{ fontSize: FS.small, marginTop: 4, ...muteText }}>
          {vm.relationDescription}
        </div>
        {vm.specialMeaning && (
          <div style={{ fontSize: FS.small, marginTop: 4, color: "var(--fg)" }}>
            ✦ {vm.specialMeaning}
          </div>
        )}
        <div style={{ fontSize: FS.small, marginTop: 12, ...muteText }}>
          길한 방향: {vm.luckyDirection} · 행운의 색: {vm.luckyColor}
        </div>
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <SectionCard title="길한 시간대">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {vm.luckyHours.map((h, i) => (
              <div key={i} style={{ fontSize: FS.body, ...dimText }}>
                {h.hour} — {h.reason}
              </div>
            ))}
            {vm.luckyHours.length === 0 && (
              <div style={{ fontSize: FS.small, ...muteText }}>
                오늘은 특별히 길한 시간대가 없습니다.
              </div>
            )}
          </div>
        </SectionCard>
        <SectionCard title="주의할 시간대">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {vm.cautiousHours.map((h, i) => (
              <div key={i} style={{ fontSize: FS.body, color: "var(--danger)" }}>
                {h.hour} — {h.reason}
              </div>
            ))}
            {vm.cautiousHours.length === 0 && (
              <div style={{ fontSize: FS.small, ...muteText }}>
                오늘은 특별히 주의할 시간대가 없습니다.
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="적합한 활동 · 피해야 할 활동">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {vm.suitableActivities.map((a, i) => (
            <span key={`s-${i}`} style={pillBtnStyle(true)}>
              {a}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {vm.unsuitableActivities.map((a, i) => (
            <span key={`u-${i}`} style={pillBtnStyle(true, "var(--danger)")}>
              {a}
            </span>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="운세 항목별">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {vm.aspects.map((a) => (
            <div key={a.label} style={{ fontSize: FS.small, ...dimText }}>
              <span style={{ ...muteText }}>{a.label}:</span> {a.text}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="오늘의 12시진">
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          {vm.hours.map((h, i) => (
            <div
              key={i}
              style={{
                flex: "0 0 132px",
                border: `1px solid ${h.isNow ? "var(--fg)" : "var(--line)"}`,
                borderRadius: 4,
                padding: "10px 12px",
                background: h.isNow
                  ? "color-mix(in srgb, var(--fg) 8%, transparent)"
                  : "transparent",
              }}
            >
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: FS.small,
                  fontWeight: h.isNow ? 700 : 400,
                }}
              >
                {h.branchName} {h.hourRange}
              </div>
              <div style={{ fontSize: FS.caption, marginTop: 4, ...muteText }}>
                {h.ganjiName}
              </div>
              {h.luckyActivity && (
                <div style={{ fontSize: FS.caption, marginTop: 4, ...dimText }}>
                  추천: {h.luckyActivity}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
