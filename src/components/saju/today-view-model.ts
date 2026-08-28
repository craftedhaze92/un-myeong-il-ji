/**
 * "오늘" 탭 프레젠테이션 레이어 — reading-view-model.ts와 같은 규약(순수 함수,
 * 입력 → 프레젠테이션 VM)을 따르되, buildReadingViewModel에는 합류하지 않는다.
 * 그 함수는 이미 analyzeFortune 4회 + recommendCareer + 세운 9개년 분석까지 포함해
 * 무겁다(reading-view-model.ts 주석 참고) — "오늘" 탭이 선택됐을 때만 이 함수를
 * 따로 호출한다(saju-app.tsx가 useMemo로 감싼다).
 *
 * iljin_analysis.ts#IljinAnalysis.constellation(28수)은 화면에 노출하지 않는다 —
 * 기준일 검증 없이 epoch % 28로 계산하는 근거 없는 값이라서다(iljin_analysis.ts 주석 참고).
 */
import { formatInTimeZone } from "date-fns-tz";
import { analyzeIljin } from "@/lib/iljin_analysis";
import { getDailyFortune } from "@/lib/fortune";
import { getDailySiUn } from "@/lib/si_un";
import type { SajuData } from "@/types";

const SEOUL_TZ = "Asia/Seoul";
const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export interface TodayScoreVM {
  label: string;
  score: number;
}

export interface TodayHourVM {
  hourRange: string;
  branchName: string;
  ganjiName: string;
  /** 오늘(서울 기준 실제 오늘)을 조회 중일 때만, 지금 이 시진이면 true */
  isNow: boolean;
  advice: string;
  luckyActivity?: string;
}

export interface TodayVM {
  dateLabel: string;
  dayPillar: string;
  ratingLabel: string;
  score: number;
  twelveGodLabel: string;
  twelveGodDescription: string;
  relationDescription: string;
  specialMeaning?: string;
  scores: TodayScoreVM[];
  luckyColor: string;
  luckyDirection: string;
  dailyAdvice: string;
  luckyHours: { hour: string; reason: string }[];
  cautiousHours: { hour: string; reason: string }[];
  suitableActivities: string[];
  unsuitableActivities: string[];
  aspects: { label: string; text: string }[];
  hours: TodayHourVM[];
}

const ASPECT_LABEL: Record<
  keyof ReturnType<typeof analyzeIljin>["aspects"],
  string
> = {
  general: "종합운",
  career: "사업/직장운",
  money: "재물운",
  health: "건강운",
  relationship: "대인관계운",
  study: "학업운",
  travel: "이동/여행운",
};

/** date의 로컬 캘린더 날짜(연/월/일)를 'YYYY-MM-DD'로 직렬화한다 — analyzeIljin이 받는
 * 같은 date 인스턴스의 로컬 구성요소를 그대로 써야 하루 어긋나지 않는다. */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildTodayViewModel(saju: SajuData, date: Date): TodayVM {
  const iljin = analyzeIljin(date, saju);
  const dateStr = toDateString(date);
  const daily = getDailyFortune(saju, dateStr);
  const hoursRaw = getDailySiUn(saju, dateStr);

  // "지금" 강조는 조회 중인 날짜가 서울 기준 실제 오늘일 때만 의미가 있다 — 어제/내일을
  // 보고 있으면 어떤 시진도 강조하지 않는다.
  const nowSeoulDateStr = formatInTimeZone(new Date(), SEOUL_TZ, "yyyy-MM-dd");
  const isToday = dateStr === nowSeoulDateStr;
  const nowHour = isToday
    ? parseInt(formatInTimeZone(new Date(), SEOUL_TZ, "H"), 10)
    : -1;

  const hours: TodayHourVM[] = hoursRaw.map((h) => ({
    hourRange: h.hourRange,
    branchName: h.branchName,
    ganjiName: h.ganjiName,
    // 각 시진은 h.hour와 그 다음 시(24시간제, 자시만 23→0으로 넘어감) 두 시간을 덮는다.
    isNow: isToday && (nowHour === h.hour || nowHour === (h.hour + 1) % 24),
    advice: h.advice,
    luckyActivity: h.luckyActivity,
  }));

  const aspects = (
    Object.keys(ASPECT_LABEL) as Array<keyof typeof ASPECT_LABEL>
  ).map((key) => ({ label: ASPECT_LABEL[key], text: iljin.aspects[key] }));

  return {
    dateLabel: `${dateStr.replace(/-/g, ".")} (${WEEKDAY_KO[date.getDay()]})`,
    dayPillar: iljin.dayPillar,
    ratingLabel: iljin.rating,
    score: iljin.score,
    twelveGodLabel: `${iljin.twelveGods.name}(${iljin.twelveGods.isAuspicious ? "길" : "흉"})`,
    twelveGodDescription: iljin.twelveGods.description,
    relationDescription: iljin.relationWithSaju.description,
    specialMeaning: iljin.specialMeaning?.reason,
    scores: [
      { label: "종합", score: daily.overallLuck },
      { label: "재물", score: daily.wealthLuck },
      { label: "직업", score: daily.careerLuck },
      { label: "건강", score: daily.healthLuck },
      { label: "애정", score: daily.loveLuck },
    ],
    luckyColor: daily.luckyColor,
    luckyDirection: daily.luckyDirection,
    dailyAdvice: daily.advice,
    luckyHours: iljin.luckyHours.map((h) => ({ hour: h.hour, reason: h.reason })),
    cautiousHours: iljin.cautiousHours.map((h) => ({
      hour: h.hour,
      reason: h.reason,
    })),
    suitableActivities: iljin.suitableActivities,
    unsuitableActivities: iljin.unsuitableActivities,
    aspects,
    hours,
  };
}
