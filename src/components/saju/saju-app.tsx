"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { calculateDaeUn, type DaeUnPeriod } from "@/lib/dae_un";
import { formatErrorForUser } from "@/lib/error_handler";
import { calculateSaju } from "@/lib/saju";
import type { Gender, SajuData } from "@/types";
import {
  BirthForm,
  deriveBirthInput,
  EMPTY_BIRTH_FORM_VALUES,
  type BirthFormValues,
} from "./birth-form";
import { dimText, FONT_BATANG, FONT_MYEONGJO, FS, THEMES } from "./constants";
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

  const submitStyle: CSSProperties = {
    background: "var(--fg)",
    color: "var(--bg)",
    border: "none",
    borderRadius: 2,
    padding: "17px 54px",
    fontFamily: FONT_BATANG,
    fontWeight: 700,
    fontSize: FS.subtitle,
    letterSpacing: "0.04em",
    cursor: name.trim() ? "pointer" : "not-allowed",
    opacity: name.trim() ? 1 : 0.4,
  };

  return (
    <div
      className={`${styles.root} ${sajuFontVariables}`}
      style={THEMES[dark ? "dark" : "light"] as CSSProperties}
    >
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--fg)",
          fontFamily: "var(--font-plex-sans), sans-serif",
          fontWeight: 400,
          padding: "0 32px 96px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transition: "background .4s ease, color .4s ease",
        }}
      >
        <header
          style={{
            width: "100%",
            maxWidth: 1100,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 24,
            padding: "28px 0 18px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span
              style={{
                fontFamily: FONT_MYEONGJO,
                fontWeight: 800,
                fontSize: FS.sectionHead,
                letterSpacing: "0.02em",
              }}
            >
              運命日誌
            </span>
            <span
              style={{
                fontSize: FS.body,
                letterSpacing: "0.06em",
                ...dimText,
              }}
            >
              운명일지
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span
              style={{
                fontSize: FS.body,
                letterSpacing: "0.04em",
                ...dimText,
              }}
            >
              {viewModel ? viewModel.headerNote : "사주팔자"}
            </span>
            <button
              onClick={toggleTheme}
              title="배경 전환"
              className={styles.themeToggle}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--fg)",
                  display: "block",
                }}
              />
              {dark ? "먹지" : "한지"}
            </button>
          </div>
        </header>

        {!viewModel && (
          <section
            style={{
              width: "100%",
              maxWidth: 640,
              paddingTop: 68,
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontFamily: FONT_MYEONGJO,
                fontWeight: 800,
                fontSize: 44,
                lineHeight: 1.25,
                margin: "0 0 14px",
                letterSpacing: "-0.01em",
              }}
            >
              태어난 순간을 적어주세요
            </h1>
            <p
              style={{
                margin: "0 0 62px",
                fontSize: FS.label,
                lineHeight: 1.7,
                ...dimText,
              }}
            >
              시(時)를 모르면 시·분을 비워도 됩니다 — 시주 없이 삼주로 봅니다.
            </p>

            <BirthForm values={form} onChange={updateForm} />

            <button onClick={submit} style={submitStyle}>
              운명 일지 보기
            </button>
            {error && (
              <p
                style={{
                  margin: "18px 0 0",
                  fontSize: FS.small,
                  color: "var(--danger)",
                }}
              >
                {error}
              </p>
            )}
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
