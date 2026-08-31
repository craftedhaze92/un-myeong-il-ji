"use client";

import { motion } from "motion/react";
import { Toggle, ToggleGroup } from "radix-ui";
import { KOREA_CITY_LONGITUDE } from "@/data/longitude_table";
import {
  SajuError,
  SajuErrorType,
  validateLunarDay,
  validateLunarMonth,
  validateTime,
  validateYearRange,
} from "@/lib/error_handler";
import { cn } from "@/lib/utils";
import type { CalendarType, Gender } from "@/types";

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

const BIRTH_TIME_OPTIONS = [
  { value: "자", label: "子(23:00~00:59)", hh: "00", mi: "00" },
  { value: "축", label: "丑(01:00~02:59)", hh: "02", mi: "00" },
  { value: "인", label: "寅(03:00~04:59)", hh: "04", mi: "00" },
  { value: "묘", label: "卯(05:00~06:59)", hh: "06", mi: "00" },
  { value: "진", label: "辰(07:00~08:59)", hh: "08", mi: "00" },
  { value: "사", label: "巳(09:00~10:59)", hh: "10", mi: "00" },
  { value: "오", label: "午(11:00~12:59)", hh: "12", mi: "00" },
  { value: "미", label: "未(13:00~14:59)", hh: "14", mi: "00" },
  { value: "신", label: "申(15:00~16:59)", hh: "16", mi: "00" },
  { value: "유", label: "酉(17:00~18:59)", hh: "18", mi: "00" },
  { value: "술", label: "戌(19:00~20:59)", hh: "20", mi: "00" },
  { value: "해", label: "亥(21:00~22:59)", hh: "22", mi: "00" },
] as const;

function getBirthTimeBranch(hour: string): string {
  if (hour === "") return "";
  const hourNum = Number(hour);
  if (!Number.isInteger(hourNum) || hourNum < 0 || hourNum > 23) return "";
  if (hourNum >= 23 || hourNum < 1) return "자";
  return BIRTH_TIME_OPTIONS[Math.floor((hourNum + 1) / 2)]?.value ?? "";
}

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

const FIELD_LABEL = "flex flex-col items-center gap-2.5";
const INPUT_BASE =
  "w-full rounded-[2px] border border-line bg-surface text-center font-myeongjo text-card-title tracking-[0.04em] h-14 px-3 sm:h-[62px]";
const MONO_INPUT =
  "w-full rounded-[2px] border border-line bg-surface text-center font-mono-plex text-section tracking-[0.04em] h-14 px-2 sm:h-[62px]";

function pillBtnClass(active: boolean) {
  return cn(
    "cursor-pointer rounded-[2px] border px-6 py-2.5 font-myeongjo text-body-lg transition-all duration-200",
    active
      ? "border-fg bg-track text-fg"
      : "border-line bg-transparent text-dim",
  );
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
  const selectedTimeBranch = getBirthTimeBranch(hh);

  const numericField =
    (key: "y" | "m" | "d" | "hh" | "mi") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ [key]: e.target.value.replace(/[^0-9]/g, "") });
    };

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={FIELD_LABEL}>
          <span className="flex items-baseline gap-1.5">
            <span className="font-myeongjo text-form-label text-dim">
              {nameLabelHanja}
            </span>
            <span className="text-form-label text-dim">{nameLabel}</span>
          </span>
          <input
            value={name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={nameLabel}
            maxLength={12}
            className={INPUT_BASE}
          />
        </label>

        <label className={FIELD_LABEL}>
          <span className="flex items-baseline gap-1.5">
            <span className="font-myeongjo text-form-label text-dim">
              出生地
            </span>
            <span className="text-form-label text-dim">출생지</span>
          </span>
          <input
            list={cityListId}
            value={city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="서울"
            maxLength={12}
            className={INPUT_BASE}
          />
          <datalist id={cityListId}>
            {Object.keys(KOREA_CITY_LONGITUDE).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {city.trim() !== "" &&
            KOREA_CITY_LONGITUDE[city.trim()] === undefined && (
              <span className="text-micro text-mute">
                등록되지 않은 지명 — 서울 기준으로 계산됩니다
              </span>
            )}
        </label>
      </div>

      <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_0.62fr_0.62fr] lg:grid-cols-[1fr_0.62fr_0.62fr_250px]">
        <label className={FIELD_LABEL}>
          <span className="flex items-baseline gap-1.5">
            <span className="font-myeongjo text-form-label text-dim">年</span>
            <span className="text-form-label text-dim">년도</span>
          </span>
          <input
            value={y}
            onChange={numericField("y")}
            placeholder="4자리 년도"
            inputMode="numeric"
            maxLength={4}
            className={MONO_INPUT}
          />
        </label>
        <label className={FIELD_LABEL}>
          <span className="flex items-baseline gap-1.5">
            <span className="font-myeongjo text-form-label text-dim">月</span>
            <span className="text-form-label text-dim">월</span>
          </span>
          <input
            value={m}
            onChange={numericField("m")}
            placeholder="월"
            inputMode="numeric"
            maxLength={2}
            className={MONO_INPUT}
          />
        </label>
        <label className={FIELD_LABEL}>
          <span className="flex items-baseline gap-1.5">
            <span className="font-myeongjo text-form-label text-dim">日</span>
            <span className="text-form-label text-dim">일</span>
          </span>
          <input
            value={d}
            onChange={numericField("d")}
            placeholder="일"
            inputMode="numeric"
            maxLength={2}
            className={MONO_INPUT}
          />
        </label>
        <label className={FIELD_LABEL}>
          <span className="flex items-baseline gap-1.5">
            <span className="font-myeongjo text-form-label text-dim">時分</span>
            <span className="text-form-label text-dim">시·분</span>
          </span>
          <select
            aria-label="시진 선택"
            value={selectedTimeBranch}
            onChange={(e) => {
              const option = BIRTH_TIME_OPTIONS.find(
                ({ value }) => value === e.target.value,
              );
              onChange(option ? { hh: option.hh, mi: option.mi } : { hh: "", mi: "" });
            }}
            className={cn(MONO_INPUT, "cursor-pointer appearance-auto")}
          >
            <option value="">선택</option>
            {BIRTH_TIME_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="flex w-full items-center gap-1.5">
            <input
              value={hh}
              onChange={numericField("hh")}
              placeholder="시"
              inputMode="numeric"
              maxLength={2}
              className={cn(MONO_INPUT, "w-auto min-w-0 flex-1 px-0")}
            />
            <span className="font-mono-plex text-card-title text-mute">:</span>
            <input
              value={mi}
              onChange={numericField("mi")}
              placeholder="분"
              inputMode="numeric"
              maxLength={2}
              className={cn(MONO_INPUT, "w-auto min-w-0 flex-1 px-0")}
            />
          </span>
          <span className="text-subtitle text-dim">비워두면 시간 미상</span>
        </label>
      </div>

      <div className="mb-6 flex flex-wrap justify-center gap-2">
        <ToggleGroup.Root
          type="single"
          value={calendarType}
          onValueChange={(v) =>
            v && onChange({ calendarType: v as CalendarType })
          }
          className="flex flex-wrap justify-center gap-2"
        >
          <ToggleGroup.Item value="solar" asChild>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className={pillBtnClass(calendarType === "solar")}
            >
              양력
            </motion.button>
          </ToggleGroup.Item>
          <ToggleGroup.Item value="lunar" asChild>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className={pillBtnClass(calendarType === "lunar")}
            >
              음력
            </motion.button>
          </ToggleGroup.Item>
        </ToggleGroup.Root>
        {calendarType === "lunar" && (
          <Toggle.Root
            pressed={isLeapMonth}
            onPressedChange={(v) => onChange({ isLeapMonth: v })}
            asChild
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              className={cn(pillBtnClass(isLeapMonth), "text-small")}
            >
              윤달
            </motion.button>
          </Toggle.Root>
        )}
      </div>

      <ToggleGroup.Root
        type="single"
        value={gender}
        onValueChange={(v) => v && onChange({ gender: v as Gender })}
        className="mb-12 flex justify-center gap-2 sm:mb-[54px]"
      >
        <ToggleGroup.Item value="male" asChild>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className={pillBtnClass(gender === "male")}
          >
            남
          </motion.button>
        </ToggleGroup.Item>
        <ToggleGroup.Item value="female" asChild>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className={pillBtnClass(gender === "female")}
          >
            여
          </motion.button>
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </>
  );
}
