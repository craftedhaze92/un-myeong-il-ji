import { describe, expect, it } from "vitest";
import { ILJU_SEEDS, getIljuInterpretation } from "./ilju_interpretations";
import { HEAVENLY_STEMS } from "./heavenly_stems";
import { EARTHLY_BRANCHES } from "./earthly_branches";

describe("일주 해석 데이터 — 60갑자 전체성·결정론", () => {
  it("유효한 60갑자 조합만 빠짐없이 한 번씩 담는다", () => {
    const expected = Array.from({ length: 60 }, (_, index) => {
      const stem = HEAVENLY_STEMS[index % HEAVENLY_STEMS.length]!.korean;
      const branch = EARTHLY_BRANCHES[index % EARTHLY_BRANCHES.length]!.korean;
      return `${stem}${branch}`;
    });

    expect(Object.keys(ILJU_SEEDS)).toHaveLength(60);
    expect(Object.keys(ILJU_SEEDS).sort()).toEqual(expected.sort());
  });

  it.each([
    ["갑", "자"],
    ["신", "사"],
    ["계", "해"],
  ] as const)(
    "%s%s일주는 요약·키워드·상세 설명이 모두 채워진다",
    (stem, branch) => {
      const ilju = getIljuInterpretation(stem, branch);

      expect(ilju.name).toBe(`${stem}${branch}일주`);
      expect(ilju.hanja).toHaveLength(2);
      expect(ilju.summary.length).toBeGreaterThan(0);
      expect(ilju.keywords).toHaveLength(3);
      expect(ilju.temperament.length).toBeGreaterThan(0);
      expect(ilju.innerStyle.length).toBeGreaterThan(0);
      expect(ilju.relation).toMatch(/생\(生\)|극\(剋\)|같은 오행/);
      expect(ilju.strengths).toHaveLength(3);
      expect(ilju.cautions).toHaveLength(3);
    },
  );

  it("같은 일주 입력은 매번 같은 내용을 반환한다", () => {
    expect(getIljuInterpretation("신", "사")).toEqual(
      getIljuInterpretation("신", "사"),
    );
  });
});
