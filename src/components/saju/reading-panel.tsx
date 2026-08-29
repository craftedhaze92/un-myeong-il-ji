"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion } from "motion/react";
import { Tabs, Tooltip } from "radix-ui";
import type { DaeUnPeriod } from "@/lib/dae_un";
import { cn } from "@/lib/utils";
import type { SajuData } from "@/types";
import { elementColor } from "./constants";
import {
  buildDaeunDetailViewModel,
  buildNameAnalysisVM,
  buildPungsuViewModel,
  buildSeyunDetailViewModel,
  buildSeyunSpark,
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

// 탭은 카드 안의 필터 버튼(PILL_BASE)과 형태부터 다르게 — 박스가 아닌 밑줄로 표현해
// "페이지 내비게이션"과 "이 카드 안에서 고르는 값"을 한눈에 구분한다.
const TAB_BASE =
  "relative shrink-0 cursor-pointer border-none bg-transparent px-1 pt-1 pb-2.5 " +
  "font-myeongjo text-body-lg transition-colors duration-200 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg";

function tabStyle(active: boolean): CSSProperties {
  return {
    color: active ? "var(--fg)" : "var(--mute)",
    fontWeight: active ? 700 : 400,
  };
}

const PILL_BASE =
  "cursor-pointer whitespace-nowrap rounded-[2px] border px-3.5 py-2 font-mono-plex text-body " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg";

function pillStyle(active: boolean, accent?: string): CSSProperties {
  return {
    background: active ? "var(--track)" : "transparent",
    borderColor: active ? (accent ?? "var(--fg)") : "var(--line)",
    color: active ? (accent ?? "var(--fg)") : "var(--dim)",
  };
}

/** 클릭할 수 없는 정보 칩 — 테두리도 cursor-pointer도 없어 PILL_BASE(컨트롤)와 구분된다. */
const BADGE_BASE =
  "inline-flex items-center whitespace-nowrap rounded-[2px] px-2.5 py-1 font-mono-plex text-caption";

function badgeStyle(strong: boolean, accent?: string): CSSProperties {
  return {
    background: "var(--track)",
    color: accent ?? (strong ? "var(--fg)" : "var(--mute)"),
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
  const tabListRef = useRef<HTMLDivElement>(null);
  const [scrollFade, setScrollFade] = useState({ atStart: true, atEnd: false });

  // 밑줄형 탭은 폭이 좁아 대부분 화면에서 스크롤이 아예 안 생기지만, 좁은 화면에서
  // 넘칠 때만 좌/우 페이드로 "더 있음"을 알려준다.
  useEffect(() => {
    const el = tabListRef.current;
    if (!el) return;
    const update = () => {
      setScrollFade({
        atStart: el.scrollLeft <= 0,
        atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
      });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <Tooltip.Provider delayDuration={200}>
    <section className="umij-container pt-5">
      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="sticky top-0 z-20 -mx-4 mb-5 bg-bg/85 px-4 backdrop-blur-sm sm:mx-0 sm:px-0">
          <div className="relative">
            <Tabs.List
              ref={tabListRef}
              aria-label="풀이 탭"
              className="flex gap-6 overflow-x-auto overflow-y-hidden border-b border-line sm:gap-7"
            >
              {TABS.map((t) => (
                <Tabs.Trigger key={t.key} value={t.key} asChild>
                  <button className={TAB_BASE} style={tabStyle(tab === t.key)}>
                    {t.label}
                    {tab === t.key && (
                      <motion.span
                        layoutId="reading-tab-underline"
                        className="absolute inset-x-0 -bottom-px h-0.5 bg-fg"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                  </button>
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {!scrollFade.atStart && (
              <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-linear-to-r from-bg to-transparent" />
            )}
            {!scrollFade.atEnd && (
              <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-bg to-transparent" />
            )}
          </div>
        </div>

        <Tabs.Content value="myeongsik">
          <TabFadeIn>
            <MyeongsikTab vm={readingVM} saju={saju} name={name} dark={dark} />
          </TabFadeIn>
        </Tabs.Content>
        <Tabs.Content value="life">
          <TabFadeIn>
            <LifeTab vm={readingVM} />
          </TabFadeIn>
        </Tabs.Content>
        <Tabs.Content value="flow">
          <TabFadeIn>
            <FlowTab saju={saju} daeUn={daeUn} vm={readingVM} dark={dark} />
          </TabFadeIn>
        </Tabs.Content>
        <Tabs.Content value="career">
          <TabFadeIn>
            <CareerTab vm={readingVM} dark={dark} />
          </TabFadeIn>
        </Tabs.Content>
        <Tabs.Content value="today">
          <TabFadeIn>
            <TodayTab saju={saju} />
          </TabFadeIn>
        </Tabs.Content>
        <Tabs.Content value="pungsu">
          <TabFadeIn>
            <PungsuTab saju={saju} dark={dark} />
          </TabFadeIn>
        </Tabs.Content>
      </Tabs.Root>
    </section>
    </Tooltip.Provider>
  );
}

/** 탭 콘텐츠가 마운트될 때마다(=탭 전환마다) 살짝 떠오르는 진입 연출. */
function TabFadeIn({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
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

// ── 인생 탭 ────────────────────────────────────────────────────────────

function LifeTab({ vm }: { vm: ReadingVM }) {
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

  const selectedDaeunOption =
    vm.flow.daeunOptions.find((o) => o.startAge === selectedStartAge) ?? null;

  // 대운 pill을 고르면 세운·월운·시기 조언이 전부 그 구간을 따라가도록 한 캐스케이드의
  // 시작점 — 대운 → 세운 → 월운 → 시기 조언 순으로 아래 값들이 파생된다.
  function selectDaeun(startAge: number) {
    setSelectedStartAge(startAge);
    const option = vm.flow.daeunOptions.find((o) => o.startAge === startAge);
    if (!option) return;
    setSelectedYear(option.isCurrent ? vm.flow.nowYear : option.startYear);
  }

  const daeunDetail = useMemo(
    () => buildDaeunDetailViewModel(saju, daeUn, selectedStartAge),
    [saju, daeUn, selectedStartAge],
  );
  // 세운 스파크는 선택된 대운의 10년 구간을 그린다 — 대운을 바꾸면 스파크 범위도
  // 함께 이동한다(대운 선택이 세운에 전혀 연결되지 않던 버그 수정).
  const seyunSpark = useMemo(
    () =>
      selectedDaeunOption
        ? buildSeyunSpark(
            saju,
            selectedDaeunOption.startYear,
            selectedDaeunOption.endYear,
            vm.flow.nowYear,
          )
        : vm.flow.seyunSpark,
    [saju, selectedDaeunOption, vm.flow.nowYear, vm.flow.seyunSpark],
  );
  const seyunDetail = useMemo(
    () => buildSeyunDetailViewModel(saju, selectedYear),
    [saju, selectedYear],
  );
  const wolunDetail = useMemo(
    () => buildWolunDetailViewModel(saju, selectedYear, selectedMonth),
    [saju, selectedYear, selectedMonth],
  );
  // 시기 조언의 분석 기준 시점 — 대운/세운/월운에서 고른 시점을 그대로 물려받는다.
  // 예전엔 이 값 없이 항상 "오늘"을 기준으로 계산해, 대운/세운을 바꿔도 시기 조언은
  // 고정돼 있던 버그가 있었다.
  const timingStart = useMemo(
    () => new Date(selectedYear, selectedMonth - 1, 1),
    [selectedYear, selectedMonth],
  );
  // 결정 타입을 고르기 전까지는 계산하지 않는다 — analyzeTimingAdvice가 12개월 예보 +
  // 3년 전망을 매번 새로 계산하는 비교적 무거운 함수라서다.
  const timingVm = useMemo(
    () =>
      selectedDecision
        ? buildTimingViewModel(saju, selectedDecision, timingStart)
        : null,
    [saju, selectedDecision, timingStart],
  );

  return (
    <div className="flex flex-col gap-5.5">
      <SectionCard title="대운 — 10년의 계절">
        <div className="mb-4.5 flex flex-wrap gap-2">
          {vm.flow.daeunOptions.map((o) => (
            <motion.button
              key={o.startAge}
              onClick={() => selectDaeun(o.startAge)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={PILL_BASE}
              style={pillStyle(o.startAge === selectedStartAge, elementColor(o.element, dark))}
            >
              {o.startAge}–{o.endAge} {o.pillar}
              {o.isCurrent ? " ·현재" : ""}
            </motion.button>
          ))}
        </div>
        {daeunDetail && (
          <div>
            <div className="mb-2.5 flex flex-wrap items-baseline gap-3">
              <span className="font-myeongjo text-section font-extrabold">{daeunDetail.pillar}</span>
              <span className="font-mono-plex text-small text-mute">
                {daeunDetail.overall} · {daeunDetail.score}점 · 조화도{" "}
                {daeunDetail.harmonyScore}
              </span>
            </div>
            <div className="mb-3.5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <ScoreBar label="직업운" score={daeunDetail.aspects.career} />
              <ScoreBar label="재물운" score={daeunDetail.aspects.wealth} />
              <ScoreBar label="건강운" score={daeunDetail.aspects.health} />
              <ScoreBar label="인간관계운" score={daeunDetail.aspects.relationship} />
            </div>
            <div className="mb-2.5 text-body leading-[1.75] text-dim">{daeunDetail.summary}</div>
            <BulletList items={daeunDetail.opportunities} tone="positive" />
            <BulletList items={daeunDetail.challenges} tone="negative" />
            <BulletList items={daeunDetail.advice} />
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={
          selectedDaeunOption && !selectedDaeunOption.isCurrent
            ? `세운 — ${selectedDaeunOption.startYear}–${selectedDaeunOption.endYear}년 (선택한 대운)`
            : "세운 — 올해를 중심으로"
        }
      >
        <div className="mb-3 flex h-[72px] items-end gap-1.5">
          {seyunSpark.map((point) => (
            <motion.button
              key={point.year}
              onClick={() => setSelectedYear(point.year)}
              title={`${point.year} ${point.pillar} · ${point.score}점${point.isCurrent ? " · 올해" : ""}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-1 cursor-pointer flex-col items-center justify-end gap-1 border-none bg-transparent p-0"
            >
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full origin-bottom rounded-sm"
                style={{
                  height: Math.max(4, (point.score / 100) * 48),
                  background: point.year === selectedYear ? "var(--fg)" : "var(--track)",
                }}
              />
              <span
                className="font-mono-plex text-micro"
                style={{
                  color: point.year === selectedYear ? "var(--fg)" : "var(--mute)",
                  fontWeight: point.isCurrent ? 700 : 400,
                  textDecoration: point.isCurrent ? "underline" : "none",
                }}
              >
                {point.year}
              </span>
            </motion.button>
          ))}
        </div>

        <div className="mb-2.5 flex flex-wrap items-baseline gap-3">
          <span className="font-myeongjo text-section font-extrabold">{seyunDetail.pillar}</span>
          <span className="font-mono-plex text-small text-mute">
            {seyunDetail.year}년 · 만 {seyunDetail.age}세 ·{" "}
            {seyunDetail.overall} · {seyunDetail.score}점
          </span>
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <ScoreBar label="사업운" score={seyunDetail.aspects.career} />
          <ScoreBar label="재물운" score={seyunDetail.aspects.wealth} />
          <ScoreBar label="건강운" score={seyunDetail.aspects.health} />
          <ScoreBar label="인간관계운" score={seyunDetail.aspects.relationship} />
        </div>
        <div className="mb-2.5 text-body leading-[1.75] text-dim">{seyunDetail.summary}</div>
        <BulletList items={seyunDetail.opportunities} tone="positive" />
        <BulletList items={seyunDetail.challenges} tone="negative" />
        <BulletList items={seyunDetail.advice} />

        <div className="mt-3 overflow-x-auto overflow-y-hidden">
          <div className="grid min-w-[420px] grid-cols-12 gap-1">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
              const favorable = seyunDetail.favorableMonths.includes(month);
              const cautious = seyunDetail.cautiousMonths.includes(month);
              const selected = month === selectedMonth;
              return (
                <motion.button
                  key={month}
                  type="button"
                  onClick={() => setSelectedMonth(month)}
                  aria-pressed={selected}
                  title={favorable ? "유리한 달" : cautious ? "주의할 달" : undefined}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className="cursor-pointer rounded-[2px] border py-1.5 text-center font-mono-plex text-micro"
                  style={{
                    color: favorable ? "var(--fg)" : cautious ? "var(--danger)" : "var(--mute)",
                    background: favorable ? "var(--track)" : "transparent",
                    borderColor: cautious ? "var(--danger)" : "var(--line)",
                    outline: selected ? "2px solid var(--fg)" : "none",
                    outlineOffset: -2,
                  }}
                >
                  {month}월
                </motion.button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="월운 — 이 달의 결">
        <div className="mb-2.5 flex flex-wrap items-baseline gap-3">
          <span className="font-myeongjo text-section font-extrabold">{wolunDetail.pillar}</span>
          <span className="font-mono-plex text-small text-mute">
            {wolunDetail.year}년 {wolunDetail.month}월 · {wolunDetail.overall}{" "}
            · {wolunDetail.score}점
          </span>
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <ScoreBar label="직업운" score={wolunDetail.aspects.career} />
          <ScoreBar label="재물운" score={wolunDetail.aspects.wealth} />
          <ScoreBar label="건강운" score={wolunDetail.aspects.health} />
          <ScoreBar label="인간관계운" score={wolunDetail.aspects.relationship} />
        </div>
        <div className="mb-3 text-body leading-[1.75] text-dim">
          {wolunDetail.balanceDescription}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {wolunDetail.keywords.map((k, i) => (
            <span
              key={i}
              className={BADGE_BASE}
              style={badgeStyle(true, elementColor(wolunDetail.element, dark))}
            >
              {k}
            </span>
          ))}
        </div>

        <div className="mb-1 font-batang text-small font-bold">이 달의 기회 · 주의</div>
        <BulletList items={wolunDetail.opportunities} tone="positive" />
        <BulletList items={wolunDetail.cautions} tone="negative" />
        <div className="mt-2.5 mb-1 font-batang text-small font-bold">하면 좋은 일 · 피할 일</div>
        <BulletList items={wolunDetail.doList} tone="positive" />
        <BulletList items={wolunDetail.dontList} tone="negative" />

        <div className="mt-1 text-body text-mute">
          유리한 방위 {wolunDetail.direction} · 색 {wolunDetail.color}
        </div>

        {(wolunDetail.luckyDates.length > 0 || wolunDetail.unluckyDates.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {wolunDetail.luckyDates.map((d) => (
              <span key={`l-${d}`} className={BADGE_BASE} style={badgeStyle(true)}>
                길일 {d}일
              </span>
            ))}
            {wolunDetail.unluckyDates.map((d) => (
              <span key={`u-${d}`} className={BADGE_BASE} style={badgeStyle(true, "var(--danger)")}>
                흉일 {d}일
              </span>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="시기 조언">
        <div className="mb-4.5 flex flex-wrap gap-2">
          {DECISION_TYPES.map((d) => (
            <motion.button
              key={d}
              onClick={() => setSelectedDecision((cur) => (cur === d ? null : d))}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={PILL_BASE}
              style={pillStyle(selectedDecision === d)}
            >
              {d}
            </motion.button>
          ))}
        </div>

        {!timingVm && (
          <div className="text-small text-mute">
            결정 항목을 고르면 {selectedYear}년 {selectedMonth}월부터 3년의 시기를
            분석합니다. 위에서 대운·세운·월을 바꾸면 이 기준 시점도 함께 이동합니다.
          </div>
        )}

        {timingVm && (
          <div className="flex flex-col gap-4.5">
            <div className="text-caption text-mute">
              기준 시점: {selectedYear}년 {selectedMonth}월
            </div>
            <div className="text-body leading-[1.75] text-dim">{timingVm.summary.overallAdvice}</div>
            <div className="text-small text-mute">
              적기: {timingVm.summary.bestYear}년 {timingVm.summary.bestMonth}
              월({timingVm.summary.bestSeason}) · 시급도{" "}
              {timingVm.summary.urgency}
            </div>

            <div>
              <div className="mb-2 font-batang text-small font-bold">최적 시기</div>
              <div className="flex flex-col gap-2.5">
                {timingVm.optimalTiming.map((o, i) => (
                  <div key={i}>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono-plex font-bold">{o.period}</span>
                      <span className="text-caption text-mute">
                        {o.rating} · {o.score}점
                      </span>
                    </div>
                    <div className="text-small text-dim">{o.yongsinSupport}</div>
                    <BulletList items={o.reasons} tone="positive" />
                    <BulletList items={o.cautions} tone="negative" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 font-batang text-small font-bold">12개월 예보</div>
              <div className="flex h-[60px] items-end gap-1">
                {timingVm.monthlyForecast.map((m, i) => (
                  <Tooltip.Root key={i}>
                    <Tooltip.Trigger asChild>
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.3, delay: i * 0.02, ease: "easeOut" }}
                        className="flex-1 origin-bottom rounded-sm"
                        style={{
                          height: `${Math.max(6, m.score)}%`,
                          background:
                            m.rating === "최적기" || m.rating === "좋음"
                              ? "var(--fg)"
                              : m.rating === "불가" || m.rating === "주의"
                                ? "var(--danger)"
                                : "var(--track)",
                        }}
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="top"
                        sideOffset={6}
                        className="z-50 max-w-[220px] rounded-[2px] border border-line bg-surface px-2.5 py-1.5 text-micro text-fg shadow-md"
                      >
                        {`${m.yearMonth} ${m.rating} · ${m.briefAdvice}`}
                        <Tooltip.Arrow className="fill-surface" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                ))}
              </div>
            </div>

            {timingVm.timesToAvoid.length > 0 && (
              <div>
                <div className="mb-2 font-batang text-small font-bold">피해야 할 시기</div>
                {timingVm.timesToAvoid.map((t, i) => (
                  <div key={i} className="mb-1.5 text-small">
                    <span className="text-danger">
                      {t.period} ({t.severity})
                    </span>{" "}
                    <span className="text-dim">{t.reason}</span>
                    {t.alternatives.length > 0 && (
                      <span className="text-mute"> — 대안: {t.alternatives.join(", ")}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div>
              <div className="mb-2 font-batang text-small font-bold">3년 장기 전망</div>
              <div
                className="grid gap-3.5"
                style={{ gridTemplateColumns: `repeat(${timingVm.longTermOutlook.length}, minmax(0, 1fr))` }}
              >
                {timingVm.longTermOutlook.map((y) => (
                  <div key={y.year}>
                    <div className="mb-1 font-mono-plex text-small font-bold">
                      {y.year}년 · {y.overallRating}
                    </div>
                    <BulletList items={y.majorOpportunities} tone="positive" />
                    <BulletList items={y.majorChallenges} tone="negative" />
                    {y.daeunInfluence && (
                      <div className="text-caption text-mute">{y.daeunInfluence}</div>
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
    <div className="flex flex-col gap-5.5">
      <div className="grid grid-cols-1 gap-5.5 md:grid-cols-2">
        <SectionCard title="길한 방위">
          <div className="flex flex-col gap-3">
            {vm.luckyDirections.map((d, i) => (
              <div key={i}>
                <div className="font-mono-plex font-bold">{d.direction}</div>
                <div className="text-small text-dim">{d.detail}</div>
                <div className="text-caption text-mute">{d.tags.join(", ")}</div>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="주의할 방위">
          <div className="flex flex-col gap-3">
            {vm.unluckyDirections.map((d, i) => (
              <div key={i}>
                <div className="font-mono-plex font-bold text-danger">{d.direction}</div>
                <div className="text-small text-dim">{d.reason}</div>
                <div className="text-caption text-mute">피할 배치: {d.avoid.join(", ")}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="공간별 조언"
        subtitle={`${vm.yearlyDirections.year}년 길한 방위 ${vm.yearlyDirections.luckyDirection} · 주의 방위 ${vm.yearlyDirections.unluckyDirection}`}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {vm.spaceAdvice.map((s) => (
            <motion.button
              key={s.spaceType}
              onClick={() => setSelectedSpace(s.spaceType)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={PILL_BASE}
              style={pillStyle(selectedSpace === s.spaceType)}
            >
              {s.spaceType}
            </motion.button>
          ))}
        </div>
        {space && (
          <div>
            <div className="mb-1.5 text-body text-dim">
              최적 방향: {space.bestDirection} · {space.layout}
            </div>
            <div className="mb-1 text-small text-mute">색상: {space.colors.join(", ")}</div>
            <div className="mb-1 text-small text-mute">가구: {space.furniture.join(", ")}</div>
            {space.plants && (
              <div className="mb-1 text-small text-mute">식물: {space.plants.join(", ")}</div>
            )}
            <div className="text-small text-danger">피할 것: {space.avoid.join(", ")}</div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="오행별 인테리어">
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-5">
          {vm.elementalDecor.map((e) => (
            <div key={e.element}>
              <div
                className="mb-1 font-myeongjo font-bold"
                style={{ color: elementColor(e.element, dark) }}
              >
                {e.element}
              </div>
              <div className="text-caption text-dim">{e.colors.join(", ")}</div>
              <div className="text-caption text-mute">{e.items.join(", ")}</div>
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
    <div className="flex flex-col gap-5.5">
      <SectionCard
        title={`${vm.dayPillar}일 · ${vm.ratingLabel}`}
        subtitle={vm.dateLabel}
        titleRight={
          <div className="flex gap-2">
            <motion.button
              onClick={() => setDayOffset((v) => v - 1)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={PILL_BASE}
              style={pillStyle(false)}
            >
              ← 어제
            </motion.button>
            <motion.button
              onClick={() => setDayOffset(0)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={PILL_BASE}
              style={pillStyle(dayOffset === 0)}
            >
              오늘
            </motion.button>
            <motion.button
              onClick={() => setDayOffset((v) => v + 1)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={PILL_BASE}
              style={pillStyle(false)}
            >
              내일 →
            </motion.button>
          </div>
        }
      >
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {vm.scores.map((s) => (
            <ScoreBar key={s.label} label={s.label} score={s.score} />
          ))}
        </div>
        <div className="text-body leading-[1.75] text-dim">{vm.dailyAdvice}</div>
        <div className="mt-2 text-small text-mute">
          {vm.twelveGodLabel} · {vm.twelveGodDescription}
        </div>
        <div className="mt-1 text-small text-mute">{vm.relationDescription}</div>
        {vm.specialMeaning && <div className="mt-1 text-small text-fg">✦ {vm.specialMeaning}</div>}
        <div className="mt-3 text-small text-mute">
          길한 방향: {vm.luckyDirection} · 행운의 색: {vm.luckyColor}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-5.5 md:grid-cols-2">
        <SectionCard title="길한 시간대">
          <div className="flex flex-col gap-2">
            {vm.luckyHours.map((h, i) => (
              <div key={i} className="text-body text-dim">
                {h.hour} — {h.reason}
              </div>
            ))}
            {vm.luckyHours.length === 0 && (
              <div className="text-small text-mute">오늘은 특별히 길한 시간대가 없습니다.</div>
            )}
          </div>
        </SectionCard>
        <SectionCard title="주의할 시간대">
          <div className="flex flex-col gap-2">
            {vm.cautiousHours.map((h, i) => (
              <div key={i} className="text-body text-danger">
                {h.hour} — {h.reason}
              </div>
            ))}
            {vm.cautiousHours.length === 0 && (
              <div className="text-small text-mute">오늘은 특별히 주의할 시간대가 없습니다.</div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="적합한 활동 · 피해야 할 활동">
        <div className="mb-3 flex flex-wrap gap-2">
          {vm.suitableActivities.map((a, i) => (
            <span key={`s-${i}`} className={BADGE_BASE} style={badgeStyle(true)}>
              {a}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {vm.unsuitableActivities.map((a, i) => (
            <span key={`u-${i}`} className={BADGE_BASE} style={badgeStyle(true, "var(--danger)")}>
              {a}
            </span>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="운세 항목별">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {vm.aspects.map((a) => (
            <div key={a.label} className="text-small text-dim">
              <span className="text-mute">{a.label}:</span> {a.text}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="오늘의 12시진">
        <div className={cn("flex gap-2 overflow-x-auto overflow-y-hidden pb-1")}>
          {vm.hours.map((h, i) => (
            <div
              key={i}
              className="flex-[0_0_132px] rounded px-3 py-2.5"
              style={{
                border: `1px solid ${h.isNow ? "var(--fg)" : "var(--line)"}`,
                background: h.isNow ? "color-mix(in srgb, var(--fg) 8%, transparent)" : "transparent",
              }}
            >
              <div className={cn("font-mono-plex text-small", h.isNow ? "font-bold" : "font-normal")}>
                {h.branchName} {h.hourRange}
              </div>
              <div className="mt-1 text-caption text-mute">{h.ganjiName}</div>
              {h.luckyActivity && (
                <div className="mt-1 text-caption text-dim">추천: {h.luckyActivity}</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
