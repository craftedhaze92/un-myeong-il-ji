import { describe, expect, it } from "vitest";
import { analyzeDaeun, calculateDaeunList } from "./daeun_analysis";
import { calculateSaju } from "./saju";

describe("대운 해석 — 실제 도전 근거가 없을 때 단정적인 기본 문구를 만들지 않는다", () => {
  const saju = calculateSaju(
    "1990-05-15",
    "14:30",
    "solar",
    false,
    "male",
    "서울",
  );

  it("불리 오행과 충돌이 모두 없는 대운은 도전 과제를 빈 목록으로 반환한다", () => {
    const calmPeriod = calculateDaeunList(saju).find(
      (period) => analyzeDaeun(saju, period).interpretation.challenges.length === 0,
    );

    expect(calmPeriod).toBeDefined();
    expect(
      calmPeriod
        ? analyzeDaeun(saju, calmPeriod).interpretation.challenges
        : undefined,
    ).toEqual([]);
  });

  it("모든 대운 결과에서 특별한 도전과제가 없다는 기본 문구를 생성하지 않는다", () => {
    const challenges = calculateDaeunList(saju).flatMap(
      (period) => analyzeDaeun(saju, period).interpretation.challenges,
    );

    expect(challenges).not.toContain("특별한 도전과제는 없습니다.");
  });
});
