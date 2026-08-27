"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { KOREA_CITY_LONGITUDE } from "@/data/longitude_table";
import { calculateDaeUn, type DaeUnPeriod } from "@/lib/dae_un";
import { calculateSaju } from "@/lib/saju";
import type { CalendarType, Gender, SajuData } from "@/types";
import { THEMES } from "./constants";
import { sajuFontVariables } from "./fonts";
import styles from "./saju.module.css";
import { buildSajuViewModel } from "./view-model";

const FONT_MYEONGJO = "var(--font-myeongjo), serif";
const FONT_BATANG = "var(--font-batang), serif";
const FONT_MONO = "var(--font-plex-mono), monospace";

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
  const viewModel = result
    ? buildSajuViewModel({
        name: result.name,
        saju: result.saju,
        daeUn: result.daeUn,
        hasHour: result.hasHour,
        gender: result.gender,
        dark,
        nowYear: result.nowYear,
      })
    : null;

  const genderBtnStyle = (active: boolean): CSSProperties => ({
    background: active ? "var(--track)" : "transparent",
    border: `1px solid ${active ? "var(--fg)" : "var(--line)"}`,
    color: active ? "var(--fg)" : "var(--dim)",
    fontFamily: FONT_MYEONGJO,
    fontSize: 15,
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
    fontSize: 17,
    letterSpacing: "0.04em",
    cursor: name.trim() ? "pointer" : "not-allowed",
    opacity: name.trim() ? 1 : 0.4,
  };

  const inputBase: CSSProperties = {
    width: "100%",
    textAlign: "center",
    background: "var(--surface, rgba(237,231,219,0.04))",
    border: "1px solid var(--line, rgba(237,231,219,0.14))",
    borderRadius: 2,
    height: 62,
    padding: "0 12px",
    fontFamily: FONT_BATANG,
    fontSize: 20,
    letterSpacing: "0.04em",
  };

  const monoInput: CSSProperties = {
    width: "100%",
    textAlign: "center",
    background: "var(--surface, rgba(237,231,219,0.04))",
    border: "1px solid var(--line, rgba(237,231,219,0.14))",
    borderRadius: 2,
    height: 62,
    padding: "0 8px",
    fontFamily: FONT_MONO,
    fontSize: 22,
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
          background: "var(--bg, #0F1116)",
          color: "var(--fg, #EDE7DB)",
          fontFamily: "var(--font-plex-sans), sans-serif",
          fontWeight: 300,
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
            borderBottom: "1px solid var(--line, rgba(237,231,219,0.1))",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span
              style={{
                fontFamily: FONT_MYEONGJO,
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: "0.02em",
              }}
            >
              運命日誌
            </span>
            <span
              style={{
                fontSize: 13,
                letterSpacing: "0.06em",
                color: "var(--dim, rgba(237,231,219,0.4))",
              }}
            >
              운명일지
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span
              style={{
                fontSize: 13,
                letterSpacing: "0.04em",
                color: "var(--dim, rgba(237,231,219,0.4))",
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
                  background: "var(--fg, #EDE7DB)",
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
              paddingTop: 118,
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
                fontSize: 16,
                lineHeight: 1.7,
                color: "var(--dim, rgba(237,231,219,0.5))",
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
                      fontSize: 24,
                      color: "var(--dim, rgba(237,231,219,0.55))",
                    }}
                  >
                    名
                  </span>
                  <span
                    style={{
                      fontSize: 24,
                      color: "var(--dim, rgba(237,231,219,0.55))",
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
                      fontSize: 24,
                      color: "var(--dim, rgba(237,231,219,0.55))",
                    }}
                  >
                    出生地
                  </span>
                  <span
                    style={{
                      fontSize: 24,
                      color: "var(--dim, rgba(237,231,219,0.55))",
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
                        fontSize: 11,
                        color: "var(--mute, rgba(237,231,219,0.4))",
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
                      fontSize: 24,
                      color: "var(--dim, rgba(237,231,219,0.55))",
                    }}
                  >
                    年
                  </span>
                  <span
                    style={{
                      fontSize: 24,
                      color: "var(--dim, rgba(237,231,219,0.55))",
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
                      fontSize: 24,
                      color: "var(--dim, rgba(237,231,219,0.55))",
                    }}
                  >
                    月
                  </span>
                  <span
                    style={{
                      fontSize: 24,
                      color: "var(--dim, rgba(237,231,219,0.55))",
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
                      fontSize: 24,
                      color: "var(--dim, rgba(237,231,219,0.55))",
                    }}
                  >
                    日
                  </span>
                  <span
                    style={{
                      fontSize: 24,
                      color: "var(--dim, rgba(237,231,219,0.55))",
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
                      fontSize: 24,
                      color: "var(--dim, rgba(237,231,219,0.55))",
                    }}
                  >
                    時分
                  </span>
                  <span
                    style={{
                      fontSize: 24,
                      color: "var(--dim, rgba(237,231,219,0.55))",
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
                      fontSize: 20,
                      color: "var(--mute, rgba(237,231,219,0.4))",
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
                    fontSize: 18,
                    color: "var(--dim, rgba(237,231,219,0.55))",
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
                  style={{ ...genderBtnStyle(isLeapMonth), fontSize: 13 }}
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
                  fontSize: 13,
                  color: "#C8412C",
                }}
              >
                {error}
              </p>
            )}
          </section>
        )}

        {viewModel && (
          <section style={{ width: "100%", maxWidth: 1100 }}>
            <div
              className={styles.fadeUp}
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 32,
                padding: "54px 0 32px",
                flexWrap: "wrap",
                animationDelay: "1.1s",
              }}
            >
              <div>
                <h1
                  style={{
                    fontFamily: FONT_MYEONGJO,
                    fontWeight: 800,
                    fontSize: 46,
                    margin: "0 0 10px",
                    letterSpacing: "-0.01em",
                    color: viewModel.accent,
                  }}
                >
                  {viewModel.headline}
                </h1>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    color: "var(--dim, rgba(237,231,219,0.55))",
                  }}
                >
                  {viewModel.headlineSub}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    letterSpacing: "0.13em",
                    color: "var(--dim, rgba(237,231,219,0.42))",
                  }}
                >
                  {viewModel.birthLine}
                </span>
                <button
                  onClick={() => setResult(null)}
                  className={styles.resetButton}
                >
                  다시 입력
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${viewModel.colCount}, 1fr)`,
                gap: 16,
                padding: "4px 0 42px",
              }}
            >
              {viewModel.pillars.map((p, i) => (
                <div
                  key={i}
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      paddingBottom: 8,
                      borderBottom:
                        "1px solid var(--line, rgba(237,231,219,0.12))",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONT_MYEONGJO,
                        fontSize: 20,
                        color: p.labelColor,
                      }}
                    >
                      {p.label}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        letterSpacing: "0.02em",
                        color: "var(--mute, rgba(237,231,219,0.35))",
                      }}
                    >
                      {p.labelEn}
                    </span>
                  </div>

                  <div
                    className={styles.slot}
                    style={{ animationDelay: `${p.slotDelay}ms` }}
                  >
                    <div
                      className={styles.stampCard}
                      style={{
                        background: p.stem.bg,
                        border: `1px solid ${p.stem.line}`,
                        animationDelay: `${p.delayA}ms`,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: FONT_MYEONGJO,
                          fontWeight: 800,
                          fontSize: p.size,
                          height: 92,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                          textAlign: "center",
                          color: p.stem.color,
                          textShadow: `0 0 32px ${p.stem.glow}`,
                        }}
                      >
                        {p.stem.ch}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginTop: 16,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: FONT_MONO,
                            fontSize: 11,
                            color: "var(--dim, rgba(237,231,219,0.45))",
                          }}
                        >
                          {p.stem.ko} {p.stem.el}
                        </span>
                        <span
                          style={{
                            fontFamily: FONT_BATANG,
                            fontSize: 13,
                            color: "var(--fg, rgba(237,231,219,0.85))",
                          }}
                        >
                          {p.stem.god}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={styles.slot}
                    style={{ animationDelay: `${p.slotDelay}ms` }}
                  >
                    <div
                      className={styles.stampCard}
                      style={{
                        background: p.branch.bg,
                        border: `1px solid ${p.branch.line}`,
                        animationDelay: `${p.delayB}ms`,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: FONT_MYEONGJO,
                          fontWeight: 800,
                          fontSize: p.size,
                          height: 92,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                          textAlign: "center",
                          color: p.branch.color,
                          textShadow: `0 0 32px ${p.branch.glow}`,
                        }}
                      >
                        {p.branch.ch}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginTop: 16,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: FONT_MONO,
                            fontSize: 11,
                            color: "var(--dim, rgba(237,231,219,0.45))",
                          }}
                        >
                          {p.branch.ko} {p.branch.el}
                        </span>
                        <span
                          style={{
                            fontFamily: FONT_BATANG,
                            fontSize: 13,
                            color: "var(--fg, rgba(237,231,219,0.85))",
                          }}
                        >
                          {p.branch.god}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      letterSpacing: "0.02em",
                      color: "var(--dim, rgba(237,231,219,0.5))",
                      textAlign: "center",
                    }}
                  >
                    지장간{" "}
                    <span
                      style={{
                        fontFamily: FONT_MYEONGJO,
                        fontSize: 15,
                        color: "var(--fg, #EDE7DB)",
                      }}
                    >
                      {p.branch.hidden}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div
              className={styles.fadeUp}
              style={{
                display: "grid",
                gridTemplateColumns: "1.05fr 1fr",
                gap: 22,
                alignItems: "stretch",
                paddingBottom: 22,
                animationDelay: "1.2s",
              }}
            >
              <div
                style={{
                  border: "1px solid var(--line, rgba(237,231,219,0.12))",
                  borderRadius: 3,
                  padding: "26px 28px 30px",
                  background: "var(--surface, rgba(237,231,219,0.02))",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  <h2
                    style={{
                      fontFamily: FONT_BATANG,
                      fontWeight: 700,
                      fontSize: 17,
                      margin: 0,
                    }}
                  >
                    오행 분포
                  </h2>
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      color: "var(--mute, rgba(237,231,219,0.35))",
                    }}
                  >
                    五行環
                  </span>
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "grid",
                    gridTemplateColumns: "minmax(180px, 1fr) 1fr",
                    gap: 28,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1 / 1",
                      maxHeight: "100%",
                      margin: "0 auto",
                    }}
                  >
                    <svg
                      viewBox="-24 -24 248 248"
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        overflow: "visible",
                      }}
                    >
                      <polygon
                        points={viewModel.ring.grid}
                        fill="none"
                        stroke="var(--line, rgba(237,231,219,0.12))"
                        strokeWidth={1}
                      />
                      <polygon
                        points={viewModel.ring.mid}
                        fill="none"
                        stroke="var(--line, rgba(237,231,219,0.08))"
                        strokeWidth={1}
                      />
                      <polygon
                        points={viewModel.ring.star}
                        fill="none"
                        stroke="var(--line, rgba(237,231,219,0.14))"
                        strokeWidth={1}
                        strokeDasharray="3 4"
                      />
                      <polygon
                        className={styles.ringShape}
                        points={viewModel.ring.shape}
                        fill={viewModel.ring.fill}
                        stroke={viewModel.accent}
                        strokeWidth={1.5}
                        pathLength={1}
                        strokeDasharray={1}
                      />
                      {viewModel.ring.dots.map((dot, i) => (
                        <circle
                          key={i}
                          cx={dot.cx}
                          cy={dot.cy}
                          r={dot.r}
                          fill={dot.color}
                          stroke="var(--bg, #0F1116)"
                          strokeWidth={1.5}
                        />
                      ))}
                    </svg>
                    {viewModel.ring.labels.map((lb, i) => (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          left: `${lb.left}%`,
                          top: `${lb.top}%`,
                          transform: "translate(-50%, -50%)",
                          textAlign: "center",
                          lineHeight: 1.25,
                          color: lb.color,
                          pointerEvents: "none",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: FONT_MYEONGJO,
                            fontSize: 17,
                            fontWeight: 700,
                          }}
                        >
                          {lb.ch}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {lb.sub}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {viewModel.elements.map((e, i) => (
                      <div
                        key={i}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "52px 1fr 22px",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: FONT_MYEONGJO,
                            fontSize: 14,
                            color: e.color,
                          }}
                        >
                          {e.ch} {e.ko}
                        </span>
                        <span
                          style={{
                            height: 6,
                            borderRadius: 3,
                            background: "var(--track, rgba(237,231,219,0.08))",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              top: 0,
                              bottom: 0,
                              left: 0,
                              width: `${e.pct}%`,
                              background: e.color,
                              borderRadius: 3,
                            }}
                          />
                        </span>
                        <span
                          style={{
                            fontFamily: FONT_MONO,
                            fontSize: 11,
                            color: "var(--dim, rgba(237,231,219,0.5))",
                            textAlign: "right",
                          }}
                        >
                          {e.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateRows: "auto 1fr",
                  gap: 22,
                }}
              >
                <div
                  style={{
                    border: "1px solid var(--line, rgba(237,231,219,0.12))",
                    borderRadius: 3,
                    padding: "24px 28px 26px",
                    background: "var(--surface, rgba(237,231,219,0.02))",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: FONT_BATANG,
                      fontWeight: 700,
                      fontSize: 17,
                      margin: "0 0 6px",
                    }}
                  >
                    십성 — 관계의 형태
                  </h2>
                  <p
                    style={{
                      margin: "0 0 16px",
                      fontSize: 13,
                      color: "var(--dim, rgba(237,231,219,0.45))",
                    }}
                  >
                    {viewModel.godsNote}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {viewModel.gods.map((g, i) => (
                      <span
                        key={i}
                        style={{
                          display: "inline-flex",
                          alignItems: "baseline",
                          gap: 7,
                          border:
                            "1px solid var(--line, rgba(237,231,219,0.16))",
                          borderRadius: 2,
                          padding: "7px 11px",
                        }}
                      >
                        <span style={{ fontFamily: FONT_BATANG, fontSize: 14 }}>
                          {g.name}
                        </span>
                        <span
                          style={{
                            fontFamily: FONT_MONO,
                            fontSize: 11,
                            color: "var(--dim, rgba(237,231,219,0.45))",
                          }}
                        >
                          {g.count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 22,
                  }}
                >
                  <div
                    style={{
                      border: "1px solid var(--line, rgba(237,231,219,0.12))",
                      borderRadius: 3,
                      padding: "24px 26px",
                      background: "var(--surface, rgba(237,231,219,0.02))",
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: FONT_BATANG,
                        fontWeight: 700,
                        fontSize: 15,
                        margin: "0 0 14px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      신살 — 특별한 자리
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 11,
                      }}
                    >
                      {viewModel.sinsal.map((s, i) => (
                        <div key={i}>
                          <div
                            style={{
                              fontFamily: FONT_MYEONGJO,
                              fontSize: 15,
                              fontWeight: 700,
                            }}
                          >
                            {s.name}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--dim, rgba(237,231,219,0.45))",
                              lineHeight: 1.55,
                            }}
                          >
                            {s.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      border: `1px solid ${viewModel.yongLine}`,
                      borderRadius: 3,
                      padding: "24px 26px",
                      background: viewModel.yongBg,
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: FONT_BATANG,
                        fontWeight: 700,
                        fontSize: 15,
                        margin: "0 0 12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      용신 — 필요한 것
                    </h2>
                    <div
                      style={{
                        fontFamily: FONT_MYEONGJO,
                        fontWeight: 800,
                        fontSize: 54,
                        lineHeight: 1,
                        color: viewModel.yong.color,
                        textShadow: `0 0 28px ${viewModel.yong.glow}`,
                      }}
                    >
                      {viewModel.yong.ch}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--dim, rgba(237,231,219,0.5))",
                        lineHeight: 1.6,
                        marginTop: 12,
                      }}
                    >
                      {viewModel.yong.desc}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={styles.fadeUp}
              style={{
                border: "1px solid var(--line, rgba(237,231,219,0.12))",
                borderRadius: 3,
                padding: "26px 28px 20px",
                background: "var(--surface, rgba(237,231,219,0.02))",
                animationDelay: "1.3s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 20,
                  marginBottom: 18,
                }}
              >
                <h2
                  style={{
                    fontFamily: FONT_BATANG,
                    fontWeight: 700,
                    fontSize: 17,
                    margin: 0,
                  }}
                >
                  대운 — 10년의 계절
                </h2>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    color: "var(--dim, rgba(237,231,219,0.45))",
                  }}
                >
                  {viewModel.luckNote}
                </span>
              </div>
              <div
                className={styles.luckScroll}
                style={{
                  display: "flex",
                  gap: 10,
                  overflowX: "auto",
                  paddingBottom: 12,
                }}
              >
                {viewModel.luck.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      flex: "0 0 112px",
                      border: `1px solid ${l.line}`,
                      borderRadius: 3,
                      background: l.bg,
                      padding: "13px 12px 11px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        color: "var(--dim, rgba(237,231,219,0.42))",
                        marginBottom: 8,
                      }}
                    >
                      {l.age}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_MYEONGJO,
                        fontWeight: 800,
                        fontSize: 30,
                        lineHeight: 1.1,
                        color: l.color,
                      }}
                    >
                      {l.gz}
                    </div>
                    <div
                      style={{
                        height: 3,
                        marginTop: 11,
                        borderRadius: 2,
                        background: l.bar,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "baseline",
                  fontSize: 12,
                  color: "var(--mute, rgba(237,231,219,0.35))",
                  fontFamily: FONT_MONO,
                  letterSpacing: "0.08em",
                  paddingTop: 4,
                }}
              >
                {viewModel.luckFoot}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
