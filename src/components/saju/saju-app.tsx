"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateDaeUn, type DaeUnPeriod } from "@/lib/dae_un";
import { formatErrorForUser } from "@/lib/error_handler";
import { calculateSaju } from "@/lib/saju";
import { cn } from "@/lib/utils";
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

export function SajuApp() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [form, setForm] = useState<BirthFormValues>(EMPTY_BIRTH_FORM_VALUES);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { name, city, y, m, d, calendarType, gender } = form;
  const updateForm = (patch: Partial<BirthFormValues>) =>
    setForm((v) => ({ ...v, ...patch }));

  useEffect(() => {
    try {
      const stored = localStorage.getItem("umij.theme");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 1회, 저장된 테마를 서버 렌더 이후 반영(FOUC 방지를 위해 lazy init 대신 의도적으로 effect 사용)
      if (stored === "light" || stored === "dark") setTheme(stored);
    } catch {
      // localStorage 접근 불가 환경(프라이빗 모드 등) - 기본 테마 유지
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("umij.theme", next);
    } catch {
      // 저장 실패 시에도 화면 전환은 진행
    }
    setTheme(next);
  };

  const resetAll = () => {
    setResult(null);
    setForm(EMPTY_BIRTH_FORM_VALUES);
    setError(null);
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
    } catch (e) {
      setError(formatErrorForUser(e).error.message);
    }
  };

  const dark = theme === "dark";
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

  return (
    <div className={cn(styles.root, sajuFontVariables, dark && "dark")}>
      <div
        className={cn(
          "flex min-h-screen flex-col items-center bg-bg px-4 pb-24 font-sans font-normal text-fg",
          "transition-colors duration-[400ms] ease-in-out sm:px-6 lg:px-8",
        )}
        style={{ fontFamily: "var(--font-plex-sans), sans-serif" }}
      >
        <header className="umij-container flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-b border-line py-6 pb-[18px] sm:pt-7">
          <div className="flex items-baseline gap-3">
            <span className="font-myeongjo text-section font-extrabold tracking-[0.02em]">
              運命日誌
            </span>
            <span className="text-body tracking-[0.06em] text-dim">운명일지</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-body tracking-[0.04em] text-dim sm:inline">
              {viewModel ? viewModel.headerNote : "사주팔자"}
            </span>
            <button
              onClick={toggleTheme}
              title="배경 전환"
              className="flex cursor-pointer items-center gap-1.5 rounded-[2px] border border-line bg-transparent px-2.5 py-1.5 font-myeongjo text-[13px] text-dim hover:text-fg"
            >
              <span className="block size-2 rounded-full bg-fg" />
              {dark ? "먹지" : "한지"}
            </button>
          </div>
        </header>

        {!viewModel && (
          <section className="w-full max-w-[640px] pt-10 text-center sm:pt-[68px]">
            <h1 className="mb-3.5 font-myeongjo text-hero leading-[1.25] font-extrabold tracking-[-0.01em]">
              태어난 순간을 적어주세요
            </h1>
            <p className="mb-12 text-label leading-[1.7] text-dim sm:mb-[62px]">
              시(時)를 모르면 시·분을 비워도 됩니다 — 시주 없이 삼주로 봅니다.
            </p>

            <BirthForm values={form} onChange={updateForm} />

            <button
              onClick={submit}
              disabled={!name.trim()}
              className={cn(
                "w-full rounded-[2px] border-none bg-fg px-8 py-3.5 font-batang text-subtitle font-bold tracking-[0.04em] text-bg sm:w-auto sm:px-[54px] sm:py-[17px]",
                name.trim() ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-40",
              )}
            >
              운명 일지 보기
            </button>
            {error && <p className="mt-[18px] text-small text-danger">{error}</p>}
          </section>
        )}

        {result && viewModel && readingViewModel && (
          <>
            <ResultPanel
              viewModel={viewModel}
              sinsalDetails={readingViewModel.myeongsik.sinsal}
              sinsalCombined={readingViewModel.myeongsik.sinsalCombined}
              onReset={resetAll}
            />
            <ReadingPanel
              saju={result.saju}
              daeUn={result.daeUn}
              readingVM={readingViewModel}
              dark={dark}
              name={result.name}
            />
            <CompatibilitySection mySaju={result.saju} myName={result.name} />
          </>
        )}
      </div>
    </div>
  );
}
