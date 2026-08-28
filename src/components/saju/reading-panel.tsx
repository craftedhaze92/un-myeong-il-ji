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
  buildSeyunDetailViewModel,
  type ReadingVM,
} from "./reading-view-model";
import { SectionCard } from "./ui/section-card";
import { ScoreBar } from "./ui/score-bar";

export interface ReadingPanelProps {
  saju: SajuData;
  daeUn: DaeUnPeriod[];
  readingVM: ReadingVM;
  dark: boolean;
}

type TabKey = "myeongsik" | "life" | "flow" | "career";

const TABS: { key: TabKey; label: string }[] = [
  { key: "myeongsik", label: "명식" },
  { key: "life", label: "인생" },
  { key: "flow", label: "흐름" },
  { key: "career", label: "직업" },
];

function BulletList({
  items,
  tone,
}: {
  items: string[];
  tone?: "positive" | "negative";
}) {
  if (items.length === 0) return null;
  const markColor =
    tone === "positive"
      ? "var(--fg)"
      : tone === "negative"
        ? "var(--danger)"
        : "var(--dim)";
  return (
    <ul style={{ margin: "0 0 12px", padding: 0, listStyle: "none" }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            gap: 8,
            fontSize: FS.body,
            lineHeight: 1.75,
            marginBottom: 6,
            ...dimText,
          }}
        >
          <span style={{ color: markColor, flexShrink: 0 }}>·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

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

      {tab === "myeongsik" && <MyeongsikTab vm={readingVM} />}
      {tab === "life" && <LifeTab vm={readingVM} />}
      {tab === "flow" && (
        <FlowTab saju={saju} daeUn={daeUn} vm={readingVM} dark={dark} />
      )}
      {tab === "career" && <CareerTab vm={readingVM} dark={dark} />}
    </section>
  );
}

// ── 명식 탭 ────────────────────────────────────────────────────────────

function MyeongsikTab({ vm }: { vm: ReadingVM }) {
  const { myeongsik } = vm;
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

  const daeunDetail = useMemo(
    () => buildDaeunDetailViewModel(saju, daeUn, selectedStartAge),
    [saju, daeUn, selectedStartAge],
  );
  const seyunDetail = useMemo(
    () => buildSeyunDetailViewModel(saju, selectedYear),
    [saju, selectedYear],
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
            return (
              <div
                key={month}
                title={
                  favorable ? "유리한 달" : cautious ? "주의할 달" : undefined
                }
                style={{
                  textAlign: "center",
                  fontSize: FS.micro,
                  fontFamily: FONT_MONO,
                  padding: "6px 0",
                  borderRadius: 2,
                  color: favorable
                    ? "var(--fg)"
                    : cautious
                      ? "var(--danger)"
                      : "var(--mute)",
                  background: favorable ? "var(--track)" : "transparent",
                  border: `1px solid ${cautious ? "var(--danger)" : "var(--line)"}`,
                }}
              >
                {month}월
              </div>
            );
          })}
        </div>
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
