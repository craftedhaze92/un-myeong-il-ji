import { describe, expect, it } from "vitest";
import { calculateSaju } from "./saju";
import { analyzeTimingAdvice } from "./timing_advice";

describe("analyzeTimingAdvice — startDate가 12개월 예보·3년 전망의 실제 기준이 된다", () => {
  const saju = calculateSaju(
    "1990-05-15",
    "14:30",
    "solar",
    false,
    "male",
    "서울",
  );

  it("startDate를 바꾸면 monthlyForecast 창과 longTermOutlook 연도가 함께 이동한다 (오늘 고정 회귀 방지)", () => {
    const near = analyzeTimingAdvice(saju, "이직", new Date(2024, 3, 1), 3);
    const far = analyzeTimingAdvice(saju, "이직", new Date(2044, 3, 1), 3);

    expect(near.monthlyForecast[0]!.yearMonth).toBe("2024-04");
    expect(far.monthlyForecast[0]!.yearMonth).toBe("2044-04");
    expect(near.longTermOutlook.map((o) => o.year)).toEqual([2024, 2025, 2026]);
    expect(far.longTermOutlook.map((o) => o.year)).toEqual([2044, 2045, 2046]);
  });
});

describe("analyzeTimingAdvice — 최적 시기 점수가 월운 원점수와 대운·세운 블렌드를 반영한다", () => {
  const saju = calculateSaju(
    "1990-05-15",
    "14:30",
    "solar",
    false,
    "male",
    "서울",
  );
  const advice = analyzeTimingAdvice(saju, "창업", new Date(2024, 0, 1), 3);

  it("optimalTiming이 있으면 각 항목의 등급이 자기 점수와 일관된다(재계산된 등급)", () => {
    expect(advice.optimalTiming.length).toBeGreaterThan(0);
    advice.optimalTiming.forEach((o) => {
      const expectedRating =
        o.score >= 80
          ? "최적기"
          : o.score >= 65
            ? "좋음"
            : o.score >= 45
              ? "보통"
              : o.score >= 30
                ? "주의"
                : "불가";
      expect(o.rating).toBe(expectedRating);
    });
  });

  it("optimalTiming 점수는 같은 달의 monthlyForecast 원점수와 다를 수 있다 — 대운·세운이 블렌드됐다는 뜻", () => {
    const anyBlended = advice.optimalTiming.some((o) => {
      const match = o.period.match(/(\d+)년\s*(\d+)월/);
      if (!match) return false;
      const yearMonth = `${match[1]}-${String(match[2]).padStart(2, "0")}`;
      const monthEntry = advice.monthlyForecast.find(
        (m) => m.yearMonth === yearMonth,
      );
      return monthEntry !== undefined && monthEntry.score !== o.score;
    });
    expect(anyBlended).toBe(true);
  });
});

describe("analyzeTimingAdvice — longTermOutlook.overallScore가 대운·세운 통합 점수로 채워진다", () => {
  const saju = calculateSaju(
    "1990-05-15",
    "14:30",
    "solar",
    false,
    "male",
    "서울",
  );
  const advice = analyzeTimingAdvice(saju, "투자", new Date(2024, 0, 1), 3);

  it("연도별 overallScore가 0-100 범위이고, 대운이 있는 연도는 daeunInfluence도 함께 채워진다", () => {
    advice.longTermOutlook.forEach((o) => {
      expect(o.overallScore).toBeGreaterThanOrEqual(0);
      expect(o.overallScore).toBeLessThanOrEqual(100);
    });
    // 성인 명식(1990-05-15)은 분석 구간(2024-2026) 내내 대운이 존재한다.
    expect(advice.longTermOutlook.every((o) => !!o.daeunInfluence)).toBe(true);
  });
});

describe("analyzeTimingAdvice — summary.urgency는 점수가 아니라 startDate로부터의 개월 수를 따른다", () => {
  const saju = calculateSaju(
    "1990-05-15",
    "14:30",
    "solar",
    false,
    "male",
    "서울",
  );

  it("먼 미래를 기준으로 잡아도 최적 월과 기준 월의 실제 간격에 맞는 시급도를 낸다", () => {
    const startDate = new Date(2046, 0, 1);
    const advice = analyzeTimingAdvice(saju, "결혼", startDate, 3);
    if (advice.optimalTiming.length > 0) {
      const months =
        (advice.summary.bestYear - startDate.getFullYear()) * 12 +
        (advice.summary.bestMonth - (startDate.getMonth() + 1));
      const expected =
        months <= 2
          ? "즉시 가능"
          : months <= 12
            ? "1년 내"
            : months <= 36
              ? "2-3년 후"
              : "장기 계획";
      expect(advice.summary.urgency).toBe(expected);
    }
  });

  it('startDate와 같은 달이 최적 시기면 "즉시 가능"이 나올 수 있다', () => {
    // 여러 결정 타입을 시도해 startDate 인접 달이 optimalTiming 1순위로 뽑히는 경우를 찾는다.
    const decisionTypes = [
      "결혼",
      "이직",
      "창업",
      "투자",
      "이사",
      "수술",
      "계약",
      "학업",
      "출산",
      "여행",
    ] as const;
    const found = decisionTypes
      .map((d) => analyzeTimingAdvice(saju, d, new Date(2024, 0, 1), 3))
      .find(
        (advice) =>
          advice.summary.bestYear === 2024 && advice.summary.bestMonth <= 3,
      );
    // 명식·연도 조합에 따라 없을 수도 있으니, 있으면 urgency가 즉시 가능이어야 한다는 것만 확인.
    if (found) {
      expect(found.summary.urgency).toBe("즉시 가능");
    }
  });
});
