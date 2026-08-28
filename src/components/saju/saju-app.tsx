"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { KOREA_CITY_LONGITUDE } from "@/data/longitude_table";
import { calculateDaeUn, type DaeUnPeriod } from "@/lib/dae_un";
import { calculateSaju } from "@/lib/saju";
import type { CalendarType, Gender, SajuData } from "@/types";
import {
  dimText,
  FONT_BATANG,
  FONT_MONO,
  FONT_MYEONGJO,
  FS,
  muteText,
  THEMES,
} from "./constants";
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
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [y, setY] = useState("");
  const [m, setM] = useState("");
  const [d, setD] = useState("");
  const [hh, setHh] = useState("");
  const [mi, setMi] = useState("");
  const [calendarType, setCalendarType] = useState<CalendarType>("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [gender, setGender] = useState<Gender>("male");
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const numericField =
    (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value.replace(/[^0-9]/g, ""));
    };

  const resetAll = () => {
    setResult(null);
    setName("");
    setCity("");
    setY("");
    setM("");
    setD("");
    setHh("");
    setMi("");
    setCalendarType("solar");
    setIsLeapMonth(false);
    setGender("male");
    setError(null);
  };

  const submit = () => {
    if (!name.trim() || !y || !m || !d) return;
    setError(null);
    const yy = parseInt(y, 10);
    const mm = Math.min(12, Math.max(1, parseInt(m, 10)));
    const dd = Math.min(31, Math.max(1, parseInt(d, 10)));
    const hasHour = hh !== "";
    const hourNum = Math.min(23, Math.max(0, parseInt(hh || "0", 10)));
    const minuteNum = Math.min(59, Math.max(0, parseInt(mi || "0", 10)));
    const birthDate = `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    // 시간 미상일 땐 정오로 넘겨 경도(진태양시) 보정이 날짜를 넘기지 않게 한다.
    const birthTime = hasHour
      ? `${String(hourNum).padStart(2, "0")}:${String(minuteNum).padStart(2, "0")}`
      : "12:00";
    try {
      const saju = calculateSaju(
        birthDate,
        birthTime,
        calendarType,
        calendarType === "lunar" ? isLeapMonth : false,
        gender,
        city.trim(),
        { unknownHour: !hasHour },
      );
      const daeUn = calculateDaeUn(saju);
      setResult({
        saju,
        daeUn,
        hasHour,
        name,
        gender,
        nowYear: new Date().getFullYear(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "명식을 계산할 수 없습니다.");
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

  const genderBtnStyle = (active: boolean): CSSProperties => ({
    background: active ? "var(--track)" : "transparent",
    border: `1px solid ${active ? "var(--fg)" : "var(--line)"}`,
    color: active ? "var(--fg)" : "var(--dim)",
    fontFamily: FONT_MYEONGJO,
    fontSize: FS.bodyLg,
    padding: "9px 24px",
    borderRadius: 2,
    cursor: "pointer",
    transition: "all .2s",
  });

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

  const inputBase: CSSProperties = {
    width: "100%",
    textAlign: "center",
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 2,
    height: 62,
    padding: "0 12px",
    fontFamily: FONT_BATANG,
    fontSize: FS.cardTitle,
    letterSpacing: "0.04em",
  };

  const monoInput: CSSProperties = {
    width: "100%",
    textAlign: "center",
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 2,
    height: 62,
    padding: "0 8px",
    fontFamily: FONT_MONO,
    fontSize: FS.sectionHead,
    letterSpacing: "0.04em",
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  alignItems: "center",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "baseline", gap: 6 }}
                >
                  <span
                    style={{
                      fontFamily: FONT_MYEONGJO,
                      fontSize: FS.formLabel,
                      ...dimText,
                    }}
                  >
                    名
                  </span>
                  <span
                    style={{
                      fontSize: FS.formLabel,
                      ...dimText,
                    }}
                  >
                    이름
                  </span>
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름"
                  maxLength={12}
                  style={inputBase}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  alignItems: "center",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "baseline", gap: 6 }}
                >
                  <span
                    style={{
                      fontFamily: FONT_MYEONGJO,
                      fontSize: FS.formLabel,
                      ...dimText,
                    }}
                  >
                    出生地
                  </span>
                  <span
                    style={{
                      fontSize: FS.formLabel,
                      ...dimText,
                    }}
                  >
                    출생지
                  </span>
                </span>
                <input
                  list="birth-city-list"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="서울"
                  maxLength={12}
                  style={inputBase}
                />
                <datalist id="birth-city-list">
                  {Object.keys(KOREA_CITY_LONGITUDE).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {city.trim() !== "" &&
                  KOREA_CITY_LONGITUDE[city.trim()] === undefined && (
                    <span
                      style={{
                        fontSize: FS.micro,
                        ...muteText,
                      }}
                    >
                      등록되지 않은 지명 — 서울 기준으로 계산됩니다
                    </span>
                  )}
              </label>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 0.62fr 0.62fr 250px",
                gap: 12,
                marginBottom: 30,
              }}
            >
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  alignItems: "center",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "baseline", gap: 6 }}
                >
                  <span
                    style={{
                      fontFamily: FONT_MYEONGJO,
                      fontSize: FS.formLabel,
                      ...dimText,
                    }}
                  >
                    年
                  </span>
                  <span
                    style={{
                      fontSize: FS.formLabel,
                      ...dimText,
                    }}
                  >
                    년도
                  </span>
                </span>
                <input
                  value={y}
                  onChange={numericField(setY)}
                  placeholder="년도"
                  inputMode="numeric"
                  maxLength={4}
                  style={monoInput}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  alignItems: "center",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "baseline", gap: 6 }}
                >
                  <span
                    style={{
                      fontFamily: FONT_MYEONGJO,
                      fontSize: FS.formLabel,
                      ...dimText,
                    }}
                  >
                    月
                  </span>
                  <span
                    style={{
                      fontSize: FS.formLabel,
                      ...dimText,
                    }}
                  >
                    월
                  </span>
                </span>
                <input
                  value={m}
                  onChange={numericField(setM)}
                  placeholder="월"
                  inputMode="numeric"
                  maxLength={2}
                  style={monoInput}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  alignItems: "center",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "baseline", gap: 6 }}
                >
                  <span
                    style={{
                      fontFamily: FONT_MYEONGJO,
                      fontSize: FS.formLabel,
                      ...dimText,
                    }}
                  >
                    日
                  </span>
                  <span
                    style={{
                      fontSize: FS.formLabel,
                      ...dimText,
                    }}
                  >
                    일
                  </span>
                </span>
                <input
                  value={d}
                  onChange={numericField(setD)}
                  placeholder="일"
                  inputMode="numeric"
                  maxLength={2}
                  style={monoInput}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  alignItems: "center",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "baseline", gap: 6 }}
                >
                  <span
                    style={{
                      fontFamily: FONT_MYEONGJO,
                      fontSize: FS.formLabel,
                      ...dimText,
                    }}
                  >
                    時分
                  </span>
                  <span
                    style={{
                      fontSize: FS.formLabel,
                      ...dimText,
                    }}
                  >
                    시·분
                  </span>
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                  }}
                >
                  <input
                    value={hh}
                    onChange={numericField(setHh)}
                    placeholder="시"
                    inputMode="numeric"
                    maxLength={2}
                    style={{
                      ...monoInput,
                      width: "auto",
                      flex: 1,
                      minWidth: 0,
                      padding: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: FS.cardTitle,
                      ...muteText,
                    }}
                  >
                    :
                  </span>
                  <input
                    value={mi}
                    onChange={numericField(setMi)}
                    placeholder="분"
                    inputMode="numeric"
                    maxLength={2}
                    style={{
                      ...monoInput,
                      width: "auto",
                      flex: 1,
                      minWidth: 0,
                      padding: 0,
                    }}
                  />
                </span>
                <span
                  style={{
                    fontSize: FS.subtitle,
                    ...dimText,
                  }}
                >
                  비워두면 시간 미상
                </span>
              </label>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginBottom: 22,
              }}
            >
              <button
                onClick={() => setCalendarType("solar")}
                style={genderBtnStyle(calendarType === "solar")}
              >
                양력
              </button>
              <button
                onClick={() => setCalendarType("lunar")}
                style={genderBtnStyle(calendarType === "lunar")}
              >
                음력
              </button>
              {calendarType === "lunar" && (
                <button
                  onClick={() => setIsLeapMonth((v) => !v)}
                  style={{ ...genderBtnStyle(isLeapMonth), fontSize: FS.small }}
                >
                  윤달
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginBottom: 54,
              }}
            >
              <button
                onClick={() => setGender("male")}
                style={genderBtnStyle(gender === "male")}
              >
                남
              </button>
              <button
                onClick={() => setGender("female")}
                style={genderBtnStyle(gender === "female")}
              >
                여
              </button>
            </div>

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
              onReset={resetAll}
            />
            <ReadingPanel
              saju={result.saju}
              daeUn={result.daeUn}
              readingVM={readingViewModel}
              dark={dark}
            />
          </>
        )}
      </div>
    </div>
  );
}
