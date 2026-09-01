import { describe, expect, it } from "vitest";
import { calculateSaju } from "./saju";
import { analyzeTimingAdvice, toTimingRating } from "./timing_advice";

const saju = calculateSaju(
  "1990-05-15",
  "14:30",
  "solar",
  false,
  "male",
  "서울",
);

describe("analyzeTimingAdvice — 표시하는 3년과 추천 후보가 같은 36개월 창을 사용한다", () => {
  it("선택한 시작 월부터 연도 경계를 지나 정확히 36개월을 만든다", () => {
    const advice = analyzeTimingAdvice(saju, "이직", new Date(2024, 3, 27), 3);

    expect(advice.monthlyForecast).toHaveLength(36);
    expect(advice.monthlyForecast[0]?.yearMonth).toBe("2024-04");
    expect(advice.monthlyForecast[35]?.yearMonth).toBe("2027-03");
    expect(advice.period.start).toEqual(new Date(2024, 3, 1));
    expect(advice.period.end).toEqual(new Date(2027, 3, 0));
  });

  it("추천 상위 3개를 첫 12개월이 아니라 36개월 전체에서 점수순으로 고른다", () => {
    const advice = analyzeTimingAdvice(saju, "창업", new Date(2024, 0, 1), 3);
    const expected = [...advice.monthlyForecast]
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.year - b.year ||
          a.month - b.month,
      )
      .slice(0, 3)
      .map((month) => month.yearMonth);

    expect(advice.optimalTiming.map((month) => month.yearMonth)).toEqual(expected);
  });
});

describe("analyzeTimingAdvice — 실제 목적별 월운·세운·대운 점수를 한 번만 블렌드한다", () => {
  const advice = analyzeTimingAdvice(saju, "계약", new Date(2024, 0, 1), 3);

  it("대운이 있으면 월운 70%·세운 18%·대운 12% 산식과 등급이 모든 월에서 일치한다", () => {
    advice.monthlyForecast.forEach((month) => {
      const { month: wolun, seyun, daeun } = month.scoreBreakdown;
      const expected =
        daeun === undefined
          ? Math.round(wolun * 0.7 + seyun * 0.3)
          : Math.round(wolun * 0.7 + seyun * 0.18 + daeun * 0.12);
      expect(month.score).toBe(expected);
      expect(month.rating).toBe(toTimingRating(expected));
    });
  });

  it("추천·월별 차트·주의 목록이 서로 다른 점수를 다시 계산하지 않는다", () => {
    advice.optimalTiming.forEach((recommended) => {
      expect(
        advice.monthlyForecast.find(
          (month) => month.yearMonth === recommended.yearMonth,
        )?.score,
      ).toBe(recommended.score);
    });
    advice.timesToAvoid.forEach((avoided) => {
      expect(avoided.score).toBeLessThan(45);
      expect(
        advice.monthlyForecast.find(
          (month) => month.yearMonth === avoided.yearMonth,
        )?.score,
      ).toBe(avoided.score);
    });
  });

  it("연도별 큰 흐름도 해당 연도 월별 최종 점수의 평균이다", () => {
    advice.longTermOutlook.forEach((year) => {
      const scores = advice.monthlyForecast
        .filter((month) => month.year === year.year)
        .map((month) => month.score);
      const expected = Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length,
      );
      expect(year.overallScore).toBe(expected);
      expect(year.overallRating).toBe(toTimingRating(expected));
    });
  });

  it("실제 분석 근거가 아닌 '특별한 도전과제는 없습니다' 기본 문구는 표시 데이터에서 제외한다", () => {
    const challenges = advice.longTermOutlook.flatMap(
      (year) => year.majorChallenges,
    );

    expect(challenges).not.toContain("특별한 도전과제는 없습니다.");
  });
});

describe("analyzeTimingAdvice — 근거 문구와 택일 범위를 실제 계산 지원 여부에 맞춘다", () => {
  it("용신 지원 문구는 해당 월 오행이 실제 용신과 일치할 때만 나온다", () => {
    const advice = analyzeTimingAdvice(saju, "결혼", new Date(2024, 0, 1), 3);
    advice.optimalTiming.forEach((month) => {
      expect(Boolean(month.yongsinSupport)).toBe(month.yongsinMatched);
      if (month.yongsinSupport) {
        expect(month.yongsinSupport).not.toMatch(/월 오행 ([목화토금수])\1/);
      }
    });
  });

  it("이직은 추천 월 안의 상위 택일 3일을 로컬 달력 월 그대로 제공한다", () => {
    const advice = analyzeTimingAdvice(saju, "이직", new Date(2024, 0, 1), 3);
    advice.optimalTiming.forEach((month) => {
      expect(month.specificDates).toHaveLength(3);
      month.specificDates?.forEach((date) => {
        expect(date.date.getFullYear()).toBe(month.year);
        expect(date.date.getMonth() + 1).toBe(month.month);
      });
    });
  });

  it("검증된 일 단위 규칙이 없는 투자·출산은 월 단위 제한을 명시한다", () => {
    for (const decision of ["투자", "출산"] as const) {
      const advice = analyzeTimingAdvice(saju, decision, new Date(2024, 0, 1), 3);
      expect(advice.specificDateNotice).toContain("월 단위");
      expect(
        advice.optimalTiming.every((month) => month.specificDates === undefined),
      ).toBe(true);
    }
  });
});

describe("analyzeTimingAdvice — 요약은 문자열 재파싱 없이 구조화된 최상위 월을 따른다", () => {
  it("최상위 월과 계절·예상 시점이 선택한 시작 월로부터의 거리에 맞는다", () => {
    const start = new Date(2046, 0, 1);
    const advice = analyzeTimingAdvice(saju, "결혼", start, 3);
    const best = advice.optimalTiming[0]!;
    const offset = (best.year - 2046) * 12 + best.month - 1;
    const expectedUrgency =
      offset <= 2
        ? "가까운 시기"
        : offset <= 11
          ? "1년 이내"
          : offset <= 23
            ? "1~2년 후"
            : "2~3년 후";

    expect(advice.summary.bestYear).toBe(best.year);
    expect(advice.summary.bestMonth).toBe(best.month);
    expect(advice.summary.urgency).toBe(expectedUrgency);
  });
});
