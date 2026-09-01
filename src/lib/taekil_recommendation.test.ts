import { describe, expect, it } from "vitest";
import { analyzeIljin, type IljinAnalysis } from "./iljin_analysis";
import { calculateSaju } from "./saju";
import { recommendTaekil } from "./taekil_recommendation";

const saju = calculateSaju(
  "1990-05-15",
  "14:30",
  "solar",
  false,
  "male",
  "서울",
);

function findDateForGod(god: string): Date {
  for (let offset = 0; offset < 90; offset++) {
    const date = new Date(2026, 0, 1 + offset);
    if (analyzeIljin(date, saju).twelveGods.name === god) return date;
  }
  throw new Error(`${god}일을 찾지 못했습니다.`);
}

function expectedScore(iljin: IljinAnalysis, purposeDelta: number): number {
  let score = iljin.score + purposeDelta;
  if (iljin.relationWithSaju.harmony) score += 15;
  if (iljin.relationWithSaju.conflict) score -= 20;
  return Math.min(100, Math.max(0, score));
}

describe("취업/이직 택일 — 지원·면접·계약·첫 출근 전체 과정 기준", () => {
  it.each(["정", "성", "개"])(
    "%s일은 계약·성취·새 출발 근거로 20점을 우대한다",
    (god) => {
      const date = findDateForGod(god);
      const iljin = analyzeIljin(date, saju);
      const result = recommendTaekil(saju, "취업/이직", date, date, 1);

      expect(result.recommendations[0]!.score).toBe(expectedScore(iljin, 20));
    },
  );

  it.each(["건", "만", "평", "파", "수", "폐"])(
    "%s일은 《성력고원》의 월건십이신·상관부임 기준에 따라 20점을 감점한다",
    (god) => {
      const date = findDateForGod(god);
      const iljin = analyzeIljin(date, saju);
      const result = recommendTaekil(saju, "취업/이직", date, date, 1);

      expect(result.recommendations[0]!.score).toBe(expectedScore(iljin, -20));
    },
  );

  it("추천 이유와 종합 조언은 채용 현실 조건을 우선하는 전용 문구를 쓴다", () => {
    const result = recommendTaekil(
      saju,
      "취업/이직",
      new Date(2026, 0, 1),
      new Date(2026, 0, 31),
      5,
    );

    expect(result.recommendations[0]!.reasons).toContain(
      "취업·이직 과정에 적합한 날",
    );
    expect(result.generalAdvice).toContain("채용 일정과 근로조건을 우선");
    expect(result.generalAdvice).toContain("조정 가능한 일정에 참고");
  });

  it("달력의 최고점 날짜와 추천 문구의 로컬 날짜·점수가 일치한다", () => {
    const result = recommendTaekil(
      saju,
      "취업/이직",
      new Date(2026, 8, 1),
      new Date(2026, 8, 30),
      30,
    );
    const best = result.recommendations[0]!;
    const localDate = `${best.date.getFullYear()}-${String(best.date.getMonth() + 1).padStart(2, "0")}-${String(best.date.getDate()).padStart(2, "0")}`;
    const highestScore = Math.max(
      ...result.recommendations.map((recommendation) => recommendation.score),
    );

    expect(best.score).toBe(highestScore);
    expect(result.generalAdvice).toContain(`추천 날짜는 ${localDate}`);
    expect(result.generalAdvice).toContain(`${best.score}점`);
  });

  it("입학 목적의 추천 이유는 취업과 중복되지 않는다", () => {
    const result = recommendTaekil(
      saju,
      "입학",
      new Date(2026, 0, 1),
      new Date(2026, 0, 31),
      5,
    );

    expect(result.recommendations[0]!.reasons).toContain(
      "입학과 새로운 배움에 좋음",
    );
    expect(result.recommendations[0]!.reasons).not.toContain(
      "입학과 취업에 좋음",
    );
  });
});
