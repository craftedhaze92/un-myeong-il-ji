import { describe, expect, it } from "vitest";
import { calculateSaju } from "./saju";
import { analyzeDominantTenGods, analyzeLifeAreas } from "./life_area_analysis";
import type { SajuData, TenGod } from "../types";

const TEN_GODS: TenGod[] = [
  "비견",
  "겁재",
  "식신",
  "상관",
  "편재",
  "정재",
  "편관",
  "정관",
  "편인",
  "정인",
];

const baseSaju = calculateSaju(
  "1992-05-05",
  "17:50",
  "solar",
  false,
  "male",
  "서울",
);

function distribution(
  values: Partial<Record<TenGod, number>>,
): Record<TenGod, number> {
  return Object.fromEntries(
    TEN_GODS.map((tenGod) => [tenGod, values[tenGod] ?? 0]),
  ) as Record<TenGod, number>;
}

function sajuWith(
  values: Partial<Record<TenGod, number>>,
  overrides: Partial<SajuData> = {},
): SajuData {
  return {
    ...baseSaju,
    tenGodsDistribution: distribution(values),
    ...overrides,
  };
}

function area(saju: SajuData, type: "wealth" | "health" | "love") {
  return analyzeLifeAreas(saju).find((item) => item.type === type)!;
}

describe("analyzeLifeAreas — 절대 개수가 아니라 정규화된 십성 비율로 인생 영역을 해석한다", () => {
  const proportions = {
    비견: 1,
    식신: 1,
    정재: 1,
    정관: 1,
    정인: 1,
  } as const;

  it("같은 비율을 7글자·5글자 규모로 바꿔도 점수와 문장이 같다 — 시간 미상 분모 차이 회귀", () => {
    const full = sajuWith(proportions);
    const reduced = sajuWith(
      Object.fromEntries(
        Object.entries(proportions).map(([key, value]) => [key, value * 0.6]),
      ),
      { unknownHour: true },
    );

    expect(analyzeLifeAreas(reduced)).toEqual(analyzeLifeAreas(full));
    expect(
      analyzeDominantTenGods(reduced).map(({ count: _count, ...item }) => item),
    ).toEqual(
      analyzeDominantTenGods(full).map(({ count: _count, ...item }) => item),
    );
  });

  it("모든 영역 점수는 과도한 확정값을 피하는 35–90 범위이며 같은 입력에 결정론적이다", () => {
    const first = analyzeLifeAreas(baseSaju);
    const second = analyzeLifeAreas(baseSaju);

    expect(second).toEqual(first);
    expect(first.map((item) => item.type)).toEqual([
      "wealth",
      "health",
      "love",
    ]);
    first.forEach((item) => {
      expect(item.score).toBeGreaterThanOrEqual(35);
      expect(item.score).toBeLessThanOrEqual(90);
      expect(item.basis.length).toBeGreaterThan(0);
      expect(item.strengths.length).toBeGreaterThan(0);
      expect(item.cautions.length).toBeGreaterThan(0);
      expect(item.actions.length).toBeGreaterThan(0);
    });
  });

  it("십성 분포가 없으면 임의 성향을 만들지 않고 정보 부족 폴백을 표시한다", () => {
    const saju = { ...baseSaju, tenGodsDistribution: undefined };
    const results = analyzeLifeAreas(saju);

    expect(analyzeDominantTenGods(saju)).toEqual([]);
    expect(area(saju, "wealth").basis).toContain("십성 분포 · 정보 없음");
    expect(area(saju, "love").contextNote).toContain(
      "전통 배우자성 관점도 표시하지 않습니다",
    );
    expect(results).toHaveLength(3);
  });
});

describe("재물 — 식상생재·재다신약·비겁 경쟁을 단일 재성 개수보다 함께 본다", () => {
  it("같은 재성 비중이면 식상이 함께 있는 명식의 재물 운용 지수가 더 높다", () => {
    const withOutput = area(sajuWith({ 식신: 2, 정재: 2, 정인: 1 }), "wealth");
    const withoutOutput = area(sajuWith({ 정재: 2, 정인: 3 }), "wealth");

    expect(withOutput.score).toBeGreaterThan(withoutOutput.score);
    expect(withOutput.basis).toContain("조합 · 식상생재");
    expect(withOutput.strengths.join(" ")).toContain("식상생재");
  });

  it("신약한 일간에 재성이 강하면 성공을 단정하지 않고 관리 부담을 드러낸다", () => {
    const weakStrength = {
      ...baseSaju.dayMasterStrength!,
      level: "very_weak" as const,
    };
    const result = area(
      sajuWith(
        { 편재: 2, 정재: 2, 식신: 1 },
        { dayMasterStrength: weakStrength },
      ),
      "wealth",
    );

    expect(result.cautions.join(" ")).toContain("책임과 관리 부담");
    expect(result.actions.join(" ")).not.toMatch(/투자.*도전|수익.*보장/);
  });

  it("재성이 낮아도 가난·수입 부재로 단정하지 않고 운용 기술을 제안한다", () => {
    const result = area(sajuWith({ 비견: 2, 정인: 2, 식신: 1 }), "wealth");
    const text = [result.summary, ...result.cautions].join(" ");

    expect(text).toContain("재성의 비중이 낮");
    expect(text).not.toMatch(/가난|재물이 없다|수입원을 확보.*어려움/);
  });
});

describe("건강 — 명리적 생활 리듬만 설명하고 질병·장기를 진단하지 않는다", () => {
  it("본문 전체에 특정 장기나 질병 예측이 없고 의료 한계를 명시한다", () => {
    const result = area(baseSaju, "health");
    const text = [
      result.summary,
      ...result.strengths,
      ...result.cautions,
      ...result.actions,
      result.contextNote,
    ].join(" ");

    expect(text).not.toMatch(/간과 눈|심장|비장|폐|신장|방광|질병.*가능/);
    expect(text).toContain("의학적 진단이 아닙니다");
    expect(text).toContain("의료진과 상담");
  });

  it("매우 신약하면서 소모 자원이 집중되면 회복 부담을 구체적으로 설명한다", () => {
    const result = area(
      sajuWith(
        { 식신: 2, 편재: 2, 편관: 2, 정인: 1 },
        {
          dayMasterStrength: {
            ...baseSaju.dayMasterStrength!,
            level: "very_weak",
          },
        },
      ),
      "health",
    );

    expect(result.cautions.join(" ")).toContain("회복이 뒤처질 수");
  });
});

describe("애정 — 현대 관계 해석은 성중립이고 전통 배우자성만 별도 병기한다", () => {
  const values = { 비견: 1, 식신: 1, 정재: 1, 정관: 1, 정인: 1 };

  it("같은 명식 분포의 남녀는 현대 요약·점수가 같고 전통 메모만 달라진다", () => {
    const male = area(sajuWith(values, { gender: "male" }), "love");
    const female = area(sajuWith(values, { gender: "female" }), "love");

    expect(female.score).toBe(male.score);
    expect(female.summary).toBe(male.summary);
    expect(female.strengths).toEqual(male.strengths);
    expect(male.contextNote).toContain("남명은 재성");
    expect(female.contextNote).toContain("여명은 관성");
  });

  it("전통 배우자성이 낮아도 인연 부재·결혼 지연·배우자 품성을 단정하지 않는다", () => {
    const result = area(
      sajuWith({ 비견: 2, 식신: 2, 정인: 1 }, { gender: "male" }),
      "love",
    );

    expect(result.contextNote).toContain("인연의 유무를 단정하지 않고");
    expect(result.contextNote).not.toMatch(/인연이 약|결혼.*늦|좋은 배우자/);
  });
});

describe("analyzeDominantTenGods — 비율 경계와 모든 십성 콘텐츠를 안정적으로 제공한다", () => {
  it("15% 이상을 최대 4개 고르고 동률은 고정 십성 순서를 따른다", () => {
    const result = analyzeDominantTenGods(
      sajuWith({ 비견: 2, 겁재: 2, 식신: 1.5, 상관: 1, 정재: 3.5 }),
    );

    expect(result.map((item) => item.tenGod)).toEqual([
      "정재",
      "비견",
      "겁재",
      "식신",
    ]);
    expect(result.map((item) => item.sharePct)).toEqual([35, 20, 20, 15]);
  });

  it.each(TEN_GODS)(
    "%s 하나가 두드러져도 장문 프로필이 빠짐없이 채워진다",
    (tenGod) => {
      const [result] = analyzeDominantTenGods(sajuWith({ [tenGod]: 5 }));

      expect(result).toMatchObject({
        tenGod,
        sharePct: 100,
        intensityLabel: "매우 두드러짐",
      });
      expect(result?.hanja.length).toBeGreaterThan(0);
      expect(result?.summary.length).toBeGreaterThan(30);
      expect(result?.strengths).toHaveLength(2);
      expect(result?.cautions).toHaveLength(2);
      expect(result?.actions).toHaveLength(1);
    },
  );
});
