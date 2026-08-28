"use client";

import type { CSSProperties } from "react";
import { KOREA_CITY_LONGITUDE } from "@/data/longitude_table";
import {
  SajuError,
  SajuErrorType,
  validateLunarDay,
  validateLunarMonth,
  validateTime,
  validateYearRange,
} from "@/lib/error_handler";
import type { CalendarType, Gender } from "@/types";
import { dimText, FONT_MONO, FONT_MYEONGJO, FS, muteText } from "./constants";

export interface BirthFormValues {
  name: string;
  city: string;
  y: string;
  m: string;
  d: string;
  hh: string;
  mi: string;
  calendarType: CalendarType;
  isLeapMonth: boolean;
  gender: Gender;
}

export const EMPTY_BIRTH_FORM_VALUES: BirthFormValues = {
  name: "",
  city: "",
  y: "",
  m: "",
  d: "",
  hh: "",
  mi: "",
  calendarType: "solar",
  isLeapMonth: false,
  gender: "male",
};

/**
 * BirthFormValues를 calculateSaju가 받는 (birthDate, birthTime, unknownHour)로 검증·변환한다.
 * saju-app.tsx#submit과 compatibility-section.tsx(상대방 입력) 둘 다 같은 검증을 거쳐야 하므로
 * 여기 한 곳에 모았다 — 예전엔 이 로직이 submit() 안에만 있어서, 궁합 상대방 입력처럼 두 번째
 * 사람이 필요해지면 그대로 복붙하며 2월 31일 검증 같은 로직이 어긋날 위험이 있었다.
 */
export function deriveBirthInput(values: BirthFormValues): {
  birthDate: string;
  birthTime: string;
  unknownHour: boolean;
} {
  const { y, m, d, hh, mi, calendarType, isLeapMonth } = values;
  const yy = parseInt(y, 10);
  const mm = parseInt(m, 10);
  const dd = parseInt(d, 10);
  const hasHour = hh !== "";
  const hourNum = hasHour ? parseInt(hh, 10) : 12;
  const minuteNum = hasHour ? parseInt(mi || "0", 10) : 0;

  validateYearRange(yy, "생년월일");
  validateTime(hourNum, minuteNum);

  if (calendarType === "lunar") {
    validateLunarMonth(yy, mm, isLeapMonth);
    validateLunarDay(dd);
  } else if (mm < 1 || mm > 12) {
    throw new SajuError(
      SajuErrorType.INVALID_MONTH,
      `월은 1부터 12 사이여야 합니다. 입력: ${mm}월`,
      { month: mm },
    );
  } else {
    // new Date(y, m-1, d)는 2월 31일처럼 존재하지 않는 날짜를 3월 3일로 조용히
    // 넘겨버리는(rollover) JS 기본 동작이 있어, 구성요소를 되짚어 비교해야
    // 실제로 잘못된 날짜를 잡아낼 수 있다.
    const rolledOver = new Date(yy, mm - 1, dd);
    if (rolledOver.getMonth() !== mm - 1 || rolledOver.getDate() !== dd) {
      throw new SajuError(
        SajuErrorType.INVALID_DAY,
        `${mm}월에는 ${dd}일이 없습니다.`,
        { year: yy, month: mm, day: dd },
      );
    }
  }

  const birthDate = `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  // 시간 미상일 땐 정오로 넘겨 경도(진태양시) 보정이 날짜를 넘기지 않게 한다.
  const birthTime = `${String(hourNum).padStart(2, "0")}:${String(minuteNum).padStart(2, "0")}`;
  return { birthDate, birthTime, unknownHour: !hasHour };
}

export interface BirthFormProps {
  values: BirthFormValues;
  onChange: (patch: Partial<BirthFormValues>) => void;
  /** 궁합 탭의 상대방 입력처럼 "이름" 대신 다른 라벨을 쓸 때 */
  nameLabel?: string;
  nameLabelHanja?: string;
  /** 폼 두 개(본인/상대방)가 한 화면에 있을 때 datalist id가 겹치지 않게 한다 */
  cityListId?: string;
}

/**
 * 생년월일시 입력 폼. saju-app.tsx의 메인 입력에서 쓰던 JSX를 그대로 옮긴 것 —
 * 궁합 탭에서 상대방 생년월일시를 물어볼 때도 복붙하지 않고 이 컴포넌트를 재사용한다.
 */
export function BirthForm({
  values,
  onChange,
  nameLabel = "이름",
  nameLabelHanja = "名",
  cityListId = "birth-city-list",
}: BirthFormProps) {
  const { name, city, y, m, d, hh, mi, calendarType, isLeapMonth, gender } =
    values;

  const numericField =
    (key: "y" | "m" | "d" | "hh" | "mi") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ [key]: e.target.value.replace(/[^0-9]/g, "") });
    };

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

  const inputBase: CSSProperties = {
    width: "100%",
    textAlign: "center",
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 2,
    height: 62,
    padding: "0 12px",
    fontFamily: FONT_MYEONGJO,
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

  const fieldLabelStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    alignItems: "center",
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <label style={fieldLabelStyle}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{ fontFamily: FONT_MYEONGJO, fontSize: FS.formLabel, ...dimText }}
            >
              {nameLabelHanja}
            </span>
            <span style={{ fontSize: FS.formLabel, ...dimText }}>
              {nameLabel}
            </span>
          </span>
          <input
            value={name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={nameLabel}
            maxLength={12}
            style={inputBase}
          />
        </label>

        <label style={fieldLabelStyle}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{ fontFamily: FONT_MYEONGJO, fontSize: FS.formLabel, ...dimText }}
            >
              出生地
            </span>
            <span style={{ fontSize: FS.formLabel, ...dimText }}>출생지</span>
          </span>
          <input
            list={cityListId}
            value={city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="서울"
            maxLength={12}
            style={inputBase}
          />
          <datalist id={cityListId}>
            {Object.keys(KOREA_CITY_LONGITUDE).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {city.trim() !== "" && KOREA_CITY_LONGITUDE[city.trim()] === undefined && (
            <span style={{ fontSize: FS.micro, ...muteText }}>
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
        <label style={fieldLabelStyle}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{ fontFamily: FONT_MYEONGJO, fontSize: FS.formLabel, ...dimText }}
            >
              年
            </span>
            <span style={{ fontSize: FS.formLabel, ...dimText }}>년도</span>
          </span>
          <input
            value={y}
            onChange={numericField("y")}
            placeholder="년도"
            inputMode="numeric"
            maxLength={4}
            style={monoInput}
          />
        </label>
        <label style={fieldLabelStyle}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{ fontFamily: FONT_MYEONGJO, fontSize: FS.formLabel, ...dimText }}
            >
              月
            </span>
            <span style={{ fontSize: FS.formLabel, ...dimText }}>월</span>
          </span>
          <input
            value={m}
            onChange={numericField("m")}
            placeholder="월"
            inputMode="numeric"
            maxLength={2}
            style={monoInput}
          />
        </label>
        <label style={fieldLabelStyle}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{ fontFamily: FONT_MYEONGJO, fontSize: FS.formLabel, ...dimText }}
            >
              日
            </span>
            <span style={{ fontSize: FS.formLabel, ...dimText }}>일</span>
          </span>
          <input
            value={d}
            onChange={numericField("d")}
            placeholder="일"
            inputMode="numeric"
            maxLength={2}
            style={monoInput}
          />
        </label>
        <label style={fieldLabelStyle}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{ fontFamily: FONT_MYEONGJO, fontSize: FS.formLabel, ...dimText }}
            >
              時分
            </span>
            <span style={{ fontSize: FS.formLabel, ...dimText }}>시·분</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
            <input
              value={hh}
              onChange={numericField("hh")}
              placeholder="시"
              inputMode="numeric"
              maxLength={2}
              style={{ ...monoInput, width: "auto", flex: 1, minWidth: 0, padding: 0 }}
            />
            <span style={{ fontFamily: FONT_MONO, fontSize: FS.cardTitle, ...muteText }}>
              :
            </span>
            <input
              value={mi}
              onChange={numericField("mi")}
              placeholder="분"
              inputMode="numeric"
              maxLength={2}
              style={{ ...monoInput, width: "auto", flex: 1, minWidth: 0, padding: 0 }}
            />
          </span>
          <span style={{ fontSize: FS.subtitle, ...dimText }}>
            비워두면 시간 미상
          </span>
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 22 }}>
        <button
          onClick={() => onChange({ calendarType: "solar" })}
          style={genderBtnStyle(calendarType === "solar")}
        >
          양력
        </button>
        <button
          onClick={() => onChange({ calendarType: "lunar" })}
          style={genderBtnStyle(calendarType === "lunar")}
        >
          음력
        </button>
        {calendarType === "lunar" && (
          <button
            onClick={() => onChange({ isLeapMonth: !isLeapMonth })}
            style={{ ...genderBtnStyle(isLeapMonth), fontSize: FS.small }}
          >
            윤달
          </button>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 54 }}>
        <button
          onClick={() => onChange({ gender: "male" })}
          style={genderBtnStyle(gender === "male")}
        >
          남
        </button>
        <button
          onClick={() => onChange({ gender: "female" })}
          style={genderBtnStyle(gender === "female")}
        >
          여
        </button>
      </div>
    </>
  );
}
