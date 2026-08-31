import { describe, expect, it } from "vitest";
import type { EarthlyBranch } from "@/types";
import {
  analyzeBranchRelations,
  type BranchRelationInput,
} from "./earthly_branches";

const PILLARS: BranchRelationInput["pillar"][] = [
  "year",
  "month",
  "day",
  "hour",
];

function inputs(...branches: EarthlyBranch[]): BranchRelationInput[] {
  return branches.map((branch, index) => ({
    pillar: PILLARS[index]!,
    branch,
  }));
}

describe("analyzeBranchRelations", () => {
  it("삼합과 방합을 서로 다른 규칙으로 판정하고, 삼합의 오행을 함께 반환한다", () => {
    const samHap = analyzeBranchRelations(inputs("신", "자", "진"));
    const bangHap = analyzeBranchRelations(inputs("인", "묘", "진"));

    expect(samHap.hits).toContainEqual(expect.objectContaining({
      kind: "삼합",
      label: "신자진 수국",
      element: "수",
      state: "complete",
      pillars: ["year", "month", "day"],
    }));
    const completeSamHap = samHap.hits.find((hit) => hit.kind === "삼합")!;
    expect(completeSamHap.feature).toContain("수국");
    expect(completeSamHap.lifeTendencies.length).toBeGreaterThanOrEqual(3);
    expect(samHap.hits.some((hit) => hit.kind === "방합")).toBe(false);

    expect(bangHap.hits).toContainEqual(expect.objectContaining({
      kind: "방합",
      label: "인묘진 목국",
      element: "목",
      pillars: ["year", "month", "day"],
    }));
    expect(bangHap.hits.some((hit) => hit.kind === "삼합")).toBe(false);
  });

  it("두 글자만 있는 삼합은 부분 삼합과 빠진 글자로 구분한다", () => {
    const result = analyzeBranchRelations(inputs("신", "자", "오"));

    expect(result.hits).toContainEqual(expect.objectContaining({
      kind: "삼합",
      label: "신자 반합 (수)",
      state: "partial",
      missingBranches: ["진"],
      pillars: ["year", "month"],
    }));
    const partialSamHap = result.hits.find((hit) => hit.kind === "삼합")!;
    expect(partialSamHap.feature).toContain("부분 삼합");
  });

  it("육합·충·형·파·해의 성립 조합과 실제 자리를 모두 반환한다", () => {
    const result = analyzeBranchRelations(inputs("자", "축", "오", "유"));

    expect(result.hits).toContainEqual(expect.objectContaining({
      kind: "육합", label: "자축 육합", pillars: ["year", "month"],
    }));
    expect(result.hits).toContainEqual(expect.objectContaining({
      kind: "충", label: "자오 충", pillars: ["year", "day"],
    }));
    expect(result.hits).toContainEqual(expect.objectContaining({
      kind: "파", label: "자유 파", pillars: ["year", "hour"],
    }));

    const punishment = analyzeBranchRelations(inputs("자", "묘", "진", "진"));
    expect(punishment.hits).toContainEqual(expect.objectContaining({
      kind: "형", label: "무례지형(자묘)", pillars: ["year", "month"],
    }));
    expect(punishment.hits).toContainEqual(expect.objectContaining({
      kind: "형", label: "자형(진진)", pillars: ["day", "hour"],
    }));

    const harm = analyzeBranchRelations(inputs("자", "미"));
    expect(harm.hits).toContainEqual(expect.objectContaining({
      kind: "해", label: "자미 해", pillars: ["year", "month"],
    }));

    for (const hit of [...result.hits, ...punishment.hits, ...harm.hits]) {
      expect(hit.feature.length).toBeGreaterThan(0);
      expect(hit.lifeTendencies.length).toBeGreaterThan(0);
    }
  });

  it("관계가 없으면 중립적인 빈 상태 설명을 반환한다", () => {
    const result = analyzeBranchRelations(inputs("자"));

    expect(result.hits).toEqual([]);
    expect(result.summary).toContain("성립 조합은 확인되지 않습니다");
  });
});
