"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { calculateDaeUn, type DaeUnPeriod } from "@/lib/dae_un";
import { formatErrorForUser } from "@/lib/error_handler";
import { calculateSaju } from "@/lib/saju";
import { cn } from "@/lib/utils";
import { selectIsDark, useThemeStore } from "@/store/theme-store";
import type { Gender, SajuData } from "@/types";
import {
  BirthForm,
  deriveBirthInput,
  EMPTY_BIRTH_FORM_VALUES,
  type BirthFormValues,
} from "./birth-form";
import { CompatibilitySection } from "./compatibility-section";
import { sajuFontVariables } from "./fonts";
import { ReadingPanel } from "./reading-panel";
import { buildReadingViewModel } from "./reading-view-model";
import { ResultPanel } from "./result-panel";
import { SavedProfiles } from "./saved-profiles";
import { saveProfile } from "./local-data";
import { Glossary } from "./glossary";
import styles from "./saju.module.css";
import { buildSajuViewModel } from "./view-model";

interface ResultState {
  saju: SajuData;
  daeUn: DaeUnPeriod[];
  hasHour: boolean;
  name: string;
  gender: Gender;
  nowYear: number;
}

// PDF/인쇄 내보내기는 추후 제공할 수 있도록 구현을 유지하되 현재 UI에서는 숨긴다.
const ENABLE_PRINT_EXPORT = false;

function scrollToPageTop() {
  // 결과 화면이 커밋되는 다음 프레임에 이동해, 입력 폼의 스크롤 위치가 결과 화면에
  // 그대로 남지 않게 한다. 모션 감소 설정은 MotionConfig와 동일하게 존중한다.
  window.requestAnimationFrame(() => {
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  });
}

export function SajuApp() {
  const [form, setForm] = useState<BirthFormValues>(EMPTY_BIRTH_FORM_VALUES);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const { name, city, y, m, d, calendarType, gender } = form;
  const updateForm = (patch: Partial<BirthFormValues>) =>
    setForm((v) => ({ ...v, ...patch }));

  const setTheme = useThemeStore((s) => s.setTheme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("umij.theme");
      // 마운트 시 1회, 저장된 테마를 서버 렌더 이후 반영(FOUC 방지를 위해 lazy init 대신 의도적으로 effect 사용)
      if (stored === "light" || stored === "dark") setTheme(stored);
    } catch {
      // localStorage 접근 불가 환경(프라이빗 모드 등) - 기본 테마 유지
    }
  }, [setTheme]);

  const resetAll = () => {
    setResult(null);
    setForm(EMPTY_BIRTH_FORM_VALUES);
    setError(null);
    setActionNotice(null);
  };

  const saveCurrentProfile = () => {
    try {
      saveProfile(localStorage, form);
      setActionNotice("이 브라우저에 명식을 저장했습니다.");
    } catch {
      setActionNotice("브라우저 저장소를 사용할 수 없습니다.");
    }
  };

  const submit = () => {
    if (!name.trim() || !y || !m || !d) return;
    setError(null);

    try {
      const { birthDate, birthTime, unknownHour } = deriveBirthInput(form);
      const saju = calculateSaju(
        birthDate,
        birthTime,
        calendarType,
        calendarType === "lunar" ? form.isLeapMonth : false,
        gender,
        city.trim(),
        { unknownHour },
      );
      const daeUn = calculateDaeUn(saju);
      setResult({
        saju,
        daeUn,
        hasHour: !unknownHour,
        name,
        gender,
        nowYear: new Date().getFullYear(),
      });
      scrollToPageTop();
    } catch (e) {
      setError(formatErrorForUser(e).error.message);
    }
  };

  const dark = useThemeStore(selectIsDark);
  const viewModel = useMemo(
    () =>
      result
        ? buildSajuViewModel({
            name: result.name,
            saju: result.saju,
            daeUn: result.daeUn,
            hasHour: result.hasHour,
            gender: result.gender,
            dark,
            nowYear: result.nowYear,
          })
        : null,
    [result, dark],
  );

  // analyzeFortune 4회 + recommendCareer + 9개년 세운 분석까지 포함해 비교적 무거우므로
  // 테마 토글 등으로 리렌더될 때 다시 계산하지 않도록 result에만 의존시킨다.
  const readingViewModel = useMemo(
    () =>
      result
        ? buildReadingViewModel({
            saju: result.saju,
            daeUn: result.daeUn,
            nowYear: result.nowYear,
          })
        : null,
    [result],
  );

  const shareSummary = async () => {
    if (!viewModel || !readingViewModel || !result) return;
    const text = `${result.name}님의 운명일지 · ${viewModel.headerNote}\n${readingViewModel.life.overview.paragraphs[0] ?? ""}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "운명일지",
          text,
          url: window.location.href,
        });
        setActionNotice("공유했습니다.");
      } else {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        setActionNotice("요약을 클립보드에 복사했습니다.");
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        setActionNotice("공유하지 못했습니다. 다시 시도해 주세요.");
      }
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn(styles.root, sajuFontVariables, dark && "dark")}>
        <div
          className={cn(
            "bg-bg text-fg flex min-h-screen flex-col items-center px-4 pb-24 font-sans font-normal",
            "transition-colors duration-[400ms] ease-in-out sm:px-6 lg:px-8",
          )}
          style={{ fontFamily: "var(--font-plex-sans), sans-serif" }}
        >
          <header className="umij-container border-line flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-b py-6 pb-[18px] sm:pt-7">
            <div className="flex items-baseline gap-3">
              <span className="font-myeongjo text-section font-extrabold tracking-[0.02em]">
                運命日誌
              </span>
              <span className="text-body text-dim tracking-[0.06em]">
                운명일지
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-body text-dim hidden tracking-[0.04em] sm:inline">
                {viewModel ? viewModel.headerNote : "사주팔자"}
              </span>
              <motion.button
                onClick={toggleTheme}
                title="배경 전환"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className="border-line font-myeongjo text-dim hover:text-fg flex cursor-pointer items-center gap-1.5 rounded-[2px] border bg-transparent px-2.5 py-1.5 text-[13px]"
              >
                <span className="bg-fg block size-2 rounded-full" />
                {dark ? "먹지" : "한지"}
              </motion.button>
            </div>
          </header>

          <AnimatePresence mode="wait" initial={false}>
            {!viewModel && (
              <motion.section
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full max-w-[640px] pt-10 text-center sm:pt-[68px]"
              >
                <h1 className="font-myeongjo text-hero mb-3.5 leading-[1.25] font-extrabold tracking-[-0.01em]">
                  태어난 순간을 적어주세요
                </h1>
                <p className="text-label text-dim mb-12 leading-[1.7] sm:mb-[62px]">
                  시(時)를 모르면 시·분을 비워도 됩니다 — 시주 없이 삼주로
                  봅니다.
                </p>

                <BirthForm values={form} onChange={updateForm} />

                <SavedProfiles onSelect={(values) => setForm(values)} />

                <motion.button
                  onClick={submit}
                  disabled={!name.trim()}
                  whileHover={name.trim() ? { scale: 1.02 } : undefined}
                  whileTap={name.trim() ? { scale: 0.98 } : undefined}
                  className={cn(
                    "bg-fg font-batang text-subtitle text-bg w-full rounded-[2px] border-none px-8 py-3.5 font-bold tracking-[0.04em] sm:w-auto sm:px-[54px] sm:py-[17px]",
                    name.trim()
                      ? "cursor-pointer opacity-100"
                      : "cursor-not-allowed opacity-40",
                  )}
                >
                  운명 일지 보기
                </motion.button>
                {error && (
                  <p className="text-small text-danger mt-[18px]">{error}</p>
                )}
              </motion.section>
            )}

            {result && viewModel && readingViewModel && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex w-full flex-col items-center"
              >
                <ResultPanel
                  viewModel={viewModel}
                  sinsalDetails={readingViewModel.myeongsik.sinsal}
                  sinsalCombined={readingViewModel.myeongsik.sinsalCombined}
                  onReset={resetAll}
                />
                <div className="umij-container mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={saveCurrentProfile}
                    className="border-line text-body text-dim hover:text-fg cursor-pointer rounded-[2px] border bg-transparent px-4 py-2"
                  >
                    명식 저장
                  </button>
                  <button
                    type="button"
                    onClick={shareSummary}
                    className="border-line text-body text-dim hover:text-fg cursor-pointer rounded-[2px] border bg-transparent px-4 py-2"
                  >
                    요약 공유
                  </button>
                  {ENABLE_PRINT_EXPORT ? (
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="border-line text-body text-dim hover:text-fg cursor-pointer rounded-[2px] border bg-transparent px-4 py-2"
                    >
                      인쇄 · PDF 저장
                    </button>
                  ) : null}
                  {actionNotice && (
                    <span className="text-small text-mute">{actionNotice}</span>
                  )}
                </div>
                <ReadingPanel
                  saju={result.saju}
                  daeUn={result.daeUn}
                  readingVM={readingViewModel}
                  name={result.name}
                />
                <CompatibilitySection
                  mySaju={result.saju}
                  myName={result.name}
                />
                <Glossary />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}
