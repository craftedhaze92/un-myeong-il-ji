"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion } from "motion/react";
import { Tabs, Tooltip } from "radix-ui";
import type { DaeUnPeriod } from "@/lib/dae_un";
import type { SajuData } from "@/types";
import type { ReadingVM } from "./reading-view-model";
import { CareerTab } from "./reading/career-tab";
import { FlowTab } from "./reading/flow-tab";
import { LifeTab } from "./reading/life-tab";
import { MyeongsikTab } from "./reading/myeongsik-tab";
import { PungsuTab } from "./reading/pungsu-tab";
import { TodayTab } from "./reading/today-tab";

export interface ReadingPanelProps {
  saju: SajuData;
  daeUn: DaeUnPeriod[];
  readingVM: ReadingVM;
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

// 탭은 카드 안의 필터 버튼(PILL_BASE, ./reading/chip-styles)과 형태부터 다르게 —
// 박스가 아닌 밑줄로 표현해 "페이지 내비게이션"과 "이 카드 안에서 고르는 값"을
// 한눈에 구분한다. 이 파일에서만 쓰이므로 chip-styles.ts로 옮기지 않았다.
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

export function ReadingPanel({
  saju,
  daeUn,
  readingVM,
  name,
}: ReadingPanelProps) {
  const [tab, setTab] = useState<TabKey>("myeongsik");
  const tabListRef = useRef<HTMLDivElement>(null);
  const contentStartRef = useRef<HTMLDivElement>(null);
  const [scrollFade, setScrollFade] = useState({ atStart: true, atEnd: false });

  function selectTab(nextTab: TabKey) {
    if (nextTab === tab) return;

    setTab(nextTab);
    // Radix가 새 Tabs.Content를 마운트한 다음 콘텐츠 시작점으로 이동한다.
    // 키보드로 탭을 바꾸는 경우에도 onValueChange를 거치므로 같은 동작을 보장한다.
    window.requestAnimationFrame(() => {
      const reduceMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
        false;
      contentStartRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }

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
        <Tabs.Root value={tab} onValueChange={(v) => selectTab(v as TabKey)}>
          <div className="bg-bg/85 sticky top-0 z-20 -mx-4 mb-5 px-4 backdrop-blur-sm sm:mx-0 sm:px-0">
            <div className="relative">
              <Tabs.List
                ref={tabListRef}
                aria-label="풀이 탭"
                className="border-line flex gap-6 overflow-x-auto overflow-y-hidden border-b sm:gap-7"
              >
                {TABS.map((t) => (
                  <Tabs.Trigger key={t.key} value={t.key} asChild>
                    <button
                      className={TAB_BASE}
                      style={tabStyle(tab === t.key)}
                    >
                      {t.label}
                      {tab === t.key && (
                        <motion.span
                          layoutId="reading-tab-underline"
                          className="bg-fg absolute inset-x-0 -bottom-px h-0.5"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 40,
                          }}
                        />
                      )}
                    </button>
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
              {!scrollFade.atStart && (
                <div className="from-bg pointer-events-none absolute inset-y-0 left-0 w-6 bg-linear-to-r to-transparent" />
              )}
              {!scrollFade.atEnd && (
                <div className="from-bg pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l to-transparent" />
              )}
            </div>
          </div>

          <div ref={contentStartRef} className="scroll-mt-16">
            <Tabs.Content value="myeongsik">
              <TabFadeIn>
                <MyeongsikTab vm={readingVM} saju={saju} name={name} />
              </TabFadeIn>
            </Tabs.Content>
            <Tabs.Content value="life">
              <TabFadeIn>
                <LifeTab vm={readingVM} />
              </TabFadeIn>
            </Tabs.Content>
            <Tabs.Content value="flow">
              <TabFadeIn>
                <FlowTab saju={saju} daeUn={daeUn} vm={readingVM} />
              </TabFadeIn>
            </Tabs.Content>
            <Tabs.Content value="career">
              <TabFadeIn>
                <CareerTab vm={readingVM} />
              </TabFadeIn>
            </Tabs.Content>
            <Tabs.Content value="today">
              <TabFadeIn>
                <TodayTab saju={saju} />
              </TabFadeIn>
            </Tabs.Content>
            <Tabs.Content value="pungsu">
              <TabFadeIn>
                <PungsuTab saju={saju} />
              </TabFadeIn>
            </Tabs.Content>
          </div>
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
