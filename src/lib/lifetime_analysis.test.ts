import { describe, expect, it } from "vitest";
import { calculateSaju } from "./saju";
import { calculateDaeUn, type DaeUnPeriod } from "./dae_un";
import { analyzeDaeun } from "./daeun_analysis";
import { analyzeLifetime } from "./lifetime_analysis";

function sampleSaju(unknownHour = false) {
  return calculateSaju(
    "1992-05-05",
    unknownHour ? "12:00" : "17:50",
    "solar",
    false,
    "male",
    "서울",
    { unknownHour },
  );
}

function score(saju: ReturnType<typeof sampleSaju>, period: DaeUnPeriod) {
  return analyzeDaeun(saju, {
    startAge: period.startAge,
    endAge: period.endAge,
    stem: period.stem,
    branch: period.branch,
    pillar: `${period.stem}${period.branch}`,
    element: period.stemElement,
  }).fortune.score;
}

describe("analyzeLifetime — 1992-05-05 17:50 양력 남성 대표 명식", () => {
  const saju = sampleSaju();
  const daeUn = calculateDaeUn(saju);

  it("한 줄 총평 대신 근거가 있는 3문단과 초년·중년·말년을 만든다", () => {
    const result = analyzeLifetime(saju, daeUn);

    expect(result.overview.paragraphs).toHaveLength(3);
    result.overview.paragraphs.forEach((paragraph) => {
      expect(paragraph.length).toBeGreaterThan(40);
    });
    expect(result.overview.basis.length).toBeGreaterThanOrEqual(3);
    expect(result.stages.map((stage) => stage.id)).toEqual([
      "early",
      "middle",
      "late",
    ]);
    expect(result.stages.map((stage) => stage.ageLabel)).toEqual([
      "0–20세",
      "21–50세",
      "51세 이후",
    ]);
  });

  it("주요 시기는 흐름 탭과 같은 첫 9개 대운 점수의 최고·최저 구간을 고른다", () => {
    const visible = daeUn.slice(0, 9);
    const scores = visible.map((period) => ({
      period,
      score: score(saju, period),
    }));
    const highest = scores.reduce((best, item) =>
      item.score > best.score ? item : best,
    );
    const lowest = scores.reduce((worst, item) =>
      item.score < worst.score ? item : worst,
    );
    const result = analyzeLifetime(saju, daeUn);

    expect(result.highlights[0]).toMatchObject({
      kind: "support",
      ageLabel: `${highest.period.startAge}–${highest.period.endAge}세`,
      score: highest.score,
    });
    expect(result.highlights[1]).toMatchObject({
      kind: "pace",
      ageLabel: `${lowest.period.startAge}–${lowest.period.endAge}세`,
      score: lowest.score,
    });
  });

  it("동점 대운은 사용자가 먼저 맞이하는 이른 구간을 선택한다", () => {
    const first = daeUn[0]!;
    const tiedLater: DaeUnPeriod = {
      ...first,
      startAge: first.startAge + 10,
      endAge: first.endAge + 10,
      pillarIndex: first.pillarIndex + 1,
    };
    const result = analyzeLifetime(saju, [first, tiedLater]);

    expect(result.highlights[0]?.ageLabel).toBe(
      `${first.startAge}–${first.endAge}세`,
    );
    expect(result.highlights[1]?.ageLabel).toBe(
      `${first.startAge}–${first.endAge}세`,
    );
  });

  it("생애 경계를 가로지르는 대운은 겹치는 연수만큼 가중한다", () => {
    const earlyPeriod: DaeUnPeriod = {
      ...daeUn[0]!,
      startAge: 18,
      endAge: 27,
    };
    const middlePeriod: DaeUnPeriod = {
      ...daeUn[1]!,
      startAge: 28,
      endAge: 37,
    };
    const earlyScore = score(saju, earlyPeriod);
    const middleScore = score(saju, middlePeriod);
    const result = analyzeLifetime(saju, [earlyPeriod, middlePeriod]);

    expect(result.stages[0]?.score).toBe(earlyScore);
    expect(result.stages[1]?.score).toBe(
      Math.round((earlyScore * 7 + middleScore * 10) / 17),
    );
  });

  it("같은 입력을 반복해도 문장과 시기 선택이 완전히 같다", () => {
    expect(analyzeLifetime(saju, daeUn)).toEqual(analyzeLifetime(saju, daeUn));
  });

  it.each([
    ["very_strong", "매우 신강으로"],
    ["strong", "신강으로"],
    ["medium", "중화로"],
    ["weak", "신약으로"],
    ["very_weak", "매우 신약으로"],
  ] as const)(
    "일간 강약 %s에 받침에 맞는 으로/로 조사를 붙인다",
    (level, expected) => {
      const strength = saju.dayMasterStrength!;
      const result = analyzeLifetime(
        {
          ...saju,
          dayMasterStrength: { ...strength, level },
        },
        daeUn,
      );
      const firstParagraph = result.overview.paragraphs[0]!;

      expect(firstParagraph).toContain(`${expected} 판정된 일간은`);
      expect(firstParagraph).not.toContain("중화으로");
    },
  );
});

describe("analyzeLifetime — 시간 미상은 대운 시작 나이의 정밀도 한계를 드러낸다", () => {
  it("정오 기준 근사 안내를 내고 시주를 근거로 단정하지 않는다", () => {
    const saju = sampleSaju(true);
    const result = analyzeLifetime(saju, calculateDaeUn(saju));

    expect(result.precisionNote).toMatch(/정오 기준의 근사치/);
    expect(result.overview.paragraphs.join(" ")).not.toContain("시주");
  });
});
