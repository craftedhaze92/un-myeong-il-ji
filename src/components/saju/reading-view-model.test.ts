import { describe, expect, it } from "vitest";
import { calculateSaju } from "@/lib/saju";
import { calculateDaeUn } from "@/lib/dae_un";
import {
  buildReadingViewModel,
  buildDaeunDetailViewModel,
  buildSeyunDetailViewModel,
  buildSeyunSpark,
  buildWolunDetailViewModel,
  buildTimingViewModel,
  buildPungsuViewModel,
  buildNameAnalysisVM,
  DECISION_TYPES,
} from "./reading-view-model";

describe("buildReadingViewModel — 4블록이 빈 값 없이 채워지는지 스모크 테스트", () => {
  const saju = calculateSaju(
    "1990-05-15",
    "14:30",
    "solar",
    false,
    "male",
    "서울",
  );
  const daeUn = calculateDaeUn(saju);
  const vm = buildReadingViewModel({ saju, daeUn, nowYear: 2024 });

  it("명식 기본 해석(myeongsik) 블록이 채워진다", () => {
    expect(vm.myeongsik.ilju.name).toBe(
      `${saju.day.stem}${saju.day.branch}일주`,
    );
    expect(vm.myeongsik.ilju.hanja).toHaveLength(2);
    expect(vm.myeongsik.ilju.keywords).toHaveLength(3);
    expect(vm.myeongsik.gyeokGuk).toBeDefined();
    expect(vm.myeongsik.dayMasterStrength).toBeDefined();
    expect(vm.myeongsik.wolRyeong).toBeDefined();
    expect(vm.myeongsik.jiJangGan.length).toBe(4); // 4주 모두 계산됨
    expect(vm.myeongsik.yongSin).toBeDefined();
    expect(vm.myeongsik.yongSin?.advice.length).toBeGreaterThan(0);
  });

  it("지지 관계 VM은 실제 성립 자리와 전체 참고표를 함께 제공한다", () => {
    const relations = vm.myeongsik.branchRelations;

    expect(relations).toBeDefined();
    expect(relations?.guide.map((guide) => guide.kind)).toEqual([
      "삼합",
      "방합",
      "육합",
      "충",
      "형",
      "파",
      "해",
    ]);
    relations?.hits.forEach((hit) => {
      expect(hit.pillarsLabel).toMatch(/(년|월|일|시)지/);
      expect(hit.description.length).toBeGreaterThan(0);
      expect(hit.feature.length).toBeGreaterThan(0);
      expect(hit.lifeTendencies.length).toBeGreaterThan(0);
      expect(hit.readingNote.length).toBeGreaterThan(0);
    });
  });

  // Phase F(사주 계산 코어 정밀화) — day_master_strength.ts/johu.ts/gyeok_guk_quality.ts에서
  // 새로 계산되는 근거(득령·득지·득세, 용신 선정 방식, 격국 성격/파격)가 VM까지 배선됐는지 확인.
  it("일간 강약 VM에 득령·득지·득세 3요소 판정이 함께 담긴다", () => {
    const strength = vm.myeongsik.dayMasterStrength;
    expect(strength).toBeDefined();
    expect(typeof strength?.deukRyeong).toBe("boolean");
    expect(typeof strength?.deukJi).toBe("boolean");
    expect(typeof strength?.deukSe).toBe("boolean");
    expect(Array.isArray(strength?.rootedAtLabels)).toBe(true);
  });

  it("용신 VM에 선정 방식(전왕/조후/억부/통관) 라벨이 담긴다", () => {
    expect(vm.myeongsik.yongSin?.methodLabel).toBeDefined();
    expect(["전왕용신(종격)", "조후용신", "억부용신", "통관용신"]).toContain(
      vm.myeongsik.yongSin?.methodLabel,
    );
  });

  it("격국 VM에 자평진전 성격/파격 판정(quality)이 담긴다(종격이 아닌 한)", () => {
    // 1990-05-15는 종격이 아니므로 quality가 채워져야 한다.
    expect(vm.myeongsik.gyeokGuk?.quality).toBeDefined();
    expect(vm.myeongsik.gyeokGuk?.quality?.statusLabel).toMatch(
      /成格|破格|成中有敗|敗中有救/,
    );
    expect(["순용", "역용"]).toContain(vm.myeongsik.gyeokGuk?.quality?.useType);
  });

  it("인생(life) 블록이 장문 총평·생애 흐름과 재물/건강/애정 운세를 담는다", () => {
    expect(vm.life.fortunes.map((f) => f.type).sort()).toEqual(
      ["health", "love", "wealth"].sort(),
    );
    expect(vm.life.overview.paragraphs).toHaveLength(3);
    expect(vm.life.stages.map((stage) => stage.id)).toEqual([
      "early",
      "middle",
      "late",
    ]);
    expect(vm.life.highlights).toHaveLength(2);
    vm.life.fortunes.forEach((f) => {
      expect(f.score).toBeGreaterThanOrEqual(0);
      expect(f.score).toBeLessThanOrEqual(100);
      expect(f.summary.length).toBeGreaterThan(0);
      expect(f.scoreLabel.length).toBeGreaterThan(0);
      expect(f.basis.length).toBeGreaterThan(0);
      expect(f.strengths.length).toBeGreaterThan(0);
      expect(f.cautions.length).toBeGreaterThan(0);
      expect(f.actions.length).toBeGreaterThan(0);
    });
    expect(vm.life.personality.length).toBeGreaterThan(0);
    vm.life.personality.forEach((personality) => {
      expect(personality.sharePct).toBeGreaterThan(0);
      expect(personality.summary.length).toBeGreaterThan(0);
      expect(personality.strengths.length).toBeGreaterThan(0);
      expect(personality.cautions.length).toBeGreaterThan(0);
      expect(personality.actions.length).toBeGreaterThan(0);
    });
  });

  it("흐름(flow) 블록에 대운 옵션과 현재 선택된 대운·세운이 있다", () => {
    expect(vm.flow.daeunOptions.length).toBeGreaterThan(0);
    expect(vm.flow.selectedDaeun).not.toBeNull();
    // 초기 세운 스파크는 "현재 대운"의 10년 구간을 그린다(예전엔 항상 올해 -2~+6년
    // 고정이라 대운을 바꿔도 스파크가 따라가지 않는 버그가 있었다).
    const currentOption = vm.flow.daeunOptions.find((o) => o.isCurrent)!;
    expect(currentOption).toBeDefined();
    expect(vm.flow.seyunSpark.length).toBe(
      currentOption.endYear - currentOption.startYear + 1,
    );
    expect(vm.flow.seyunSpark[0]!.year).toBe(currentOption.startYear);
    expect(vm.flow.seyunSpark.at(-1)!.year).toBe(currentOption.endYear);
    expect(vm.flow.selectedSeyun.year).toBe(2024);
    expect(vm.flow.nowYear).toBe(2024);
  });

  it("대운 옵션의 startYear/endYear가 만 나이↔연도 역산과 일치한다", () => {
    vm.flow.daeunOptions.forEach((o) => {
      expect(o.startYear).toBeLessThanOrEqual(o.endYear);
      expect(o.endYear - o.startYear).toBe(o.endAge - o.startAge);
    });
  });

  it("직업(career) 블록에 추천 목록이 있다", () => {
    expect(vm.career.recommendations.length).toBeGreaterThan(0);
    expect(vm.career.summary.length).toBeGreaterThan(0);
  });

  it("buildDaeunDetailViewModel/buildSeyunDetailViewModel을 개별 호출해도 동일한 결과를 낸다", () => {
    const firstOption = vm.flow.daeunOptions[0]!;
    const detail = buildDaeunDetailViewModel(saju, daeUn, firstOption.startAge);
    expect(detail?.pillar).toBe(firstOption.pillar);

    const seyunDetail = buildSeyunDetailViewModel(saju, 2030);
    expect(seyunDetail.year).toBe(2030);
  });

  it("buildWolunDetailViewModel이 흐름 탭의 월운 카드에 필요한 필드를 빈 값 없이 채운다", () => {
    const wolunDetail = buildWolunDetailViewModel(saju, 2024, 5);
    expect(wolunDetail.year).toBe(2024);
    expect(wolunDetail.month).toBe(5);
    expect(wolunDetail.pillar.length).toBe(2);
    expect(wolunDetail.score).toBeGreaterThanOrEqual(0);
    expect(wolunDetail.score).toBeLessThanOrEqual(100);
    expect(wolunDetail.keywords.length).toBeGreaterThan(0);
    expect(wolunDetail.doList.length).toBeGreaterThan(0);
    expect(wolunDetail.dontList.length).toBeGreaterThan(0);
  });

  it("신살이 2개 이상이면 길신/흉신 조합 요약(sinsalCombined)이 채워진다", () => {
    // 1990-05-15 명식은 천을귀인·도화살·역마살·화개살 4개가 나온다(saju.sinSals).
    expect(saju.sinSals?.length).toBeGreaterThanOrEqual(2);
    expect(vm.myeongsik.sinsalCombined).toBeDefined();
    const combined = vm.myeongsik.sinsalCombined!;
    expect(
      combined.blessingNames.length + combined.warningNames.length,
    ).toBeGreaterThan(0);
  });
});

describe("buildTimingViewModel — 결정 타입 10종 모두 36개월 시기 조언을 낸다", () => {
  const saju = calculateSaju(
    "1990-05-15",
    "14:30",
    "solar",
    false,
    "male",
    "서울",
  );

  it.each(DECISION_TYPES)(
    "%s: 36개월 예보·연도별 전망·요약이 채워진다",
    (decisionType) => {
      const vm = buildTimingViewModel(saju, decisionType, new Date(2024, 0, 1));
      expect(vm.decisionType).toBe(decisionType);
      expect(vm.monthlyForecast.length).toBe(36);
      expect(vm.longTermOutlook.length).toBe(3);
      expect(vm.summary.overallAdvice.length).toBeGreaterThan(0);
      vm.monthlyForecast.forEach((m) => {
        expect(m.score).toBeGreaterThanOrEqual(0);
        expect(m.score).toBeLessThanOrEqual(100);
      });
    },
  );

  // 흐름 탭에서 대운/세운을 바꿔도 "시기 조언"이 항상 오늘 기준으로 고정되던 회귀 —
  // startDate를 바꾸면 36개월 예보 창과 연도별 전망이 함께 이동해야 한다.
  it("startDate를 바꾸면 monthlyForecast/longTermOutlook의 연도가 그 시점을 따라간다", () => {
    const near = buildTimingViewModel(saju, "결혼", new Date(2024, 0, 1));
    const far = buildTimingViewModel(saju, "결혼", new Date(2044, 0, 1));

    expect(near.monthlyForecast[0]!.yearMonth).toBe("2024-01");
    expect(far.monthlyForecast[0]!.yearMonth).toBe("2044-01");
    expect(near.longTermOutlook.map((o) => o.year)).toEqual([2024, 2025, 2026]);
    expect(far.longTermOutlook.map((o) => o.year)).toEqual([2044, 2045, 2046]);
    expect(near.summary.bestYear).not.toBe(far.summary.bestYear);
  });
});

describe("buildSeyunSpark — 지정한 연도 구간을 그리고 isCurrent는 nowYear에만 붙는다", () => {
  const saju = calculateSaju(
    "1990-05-15",
    "14:30",
    "solar",
    false,
    "male",
    "서울",
  );

  it("startYear~endYear 10칸을 낸다 (대운 pill 선택 시 흐름 탭이 넘기는 구간)", () => {
    const spark = buildSeyunSpark(saju, 2044, 2053, 2024);
    expect(spark.length).toBe(10);
    expect(spark[0]!.year).toBe(2044);
    expect(spark.at(-1)!.year).toBe(2053);
  });

  it("구간이 nowYear를 포함하지 않으면 어떤 막대도 isCurrent가 아니다", () => {
    const spark = buildSeyunSpark(saju, 2044, 2053, 2024);
    expect(spark.every((p) => !p.isCurrent)).toBe(true);
  });

  it("구간이 nowYear를 포함하면 그 해만 isCurrent다", () => {
    const spark = buildSeyunSpark(saju, 2022, 2031, 2024);
    const current = spark.filter((p) => p.isCurrent);
    expect(current.length).toBe(1);
    expect(current[0]!.year).toBe(2024);
  });
});

describe("buildPungsuViewModel — 방위 탭에 필요한 필드가 빈 값 없이 채워진다", () => {
  const saju = calculateSaju(
    "1990-05-15",
    "14:30",
    "solar",
    false,
    "male",
    "서울",
  );
  const vm = buildPungsuViewModel(saju, 2024);

  it("길한/주의 방위가 있다", () => {
    expect(vm.luckyDirections.length).toBeGreaterThan(0);
    expect(vm.unluckyDirections.length).toBeGreaterThan(0);
  });

  it("실제 콘텐츠가 있는 공간(침실/거실/부엌/서재/사무실) 5종만 spaceAdvice에 담긴다", () => {
    expect(vm.spaceAdvice.map((s) => s.spaceType).sort()).toEqual(
      ["거실", "부엌", "사무실", "서재", "침실"].sort(),
    );
  });

  it("오행 5개 인테리어 조언이 모두 있다", () => {
    expect(vm.elementalDecor.length).toBe(5);
  });

  it("연도별 방위와 종합 조언이 채워진다", () => {
    expect(vm.yearlyDirections.year).toBe(2024);
    expect(vm.generalAdvice.priority.length).toBeGreaterThan(0);
  });
});

describe("buildNameAnalysisVM — 한자 없이는 발음오행만, overall·pronunciation은 계속 뺀다", () => {
  const saju = calculateSaju(
    "1990-05-15",
    "14:30",
    "solar",
    false,
    "male",
    "서울",
  );
  const vm = buildNameAnalysisVM("홍길동", saju);

  it("이름 글자 수만큼 characters가 있고 각 글자에 오행이 있다", () => {
    expect(vm.characters.length).toBe(3);
    vm.characters.forEach((c) => {
      expect(["목", "화", "토", "금", "수"]).toContain(c.element);
      expect(c.elementSourceLabel).toBe("발음오행"); // 한자를 안 줬으니 전부 발음오행
    });
  });

  it("오행 구성·조화 필드가 채워진다", () => {
    expect(["균형잡힘", "불균형"]).toContain(vm.wuxingBalanceLabel);
    expect(vm.harmonyScore).toBeGreaterThan(0);
    expect(vm.harmonyDescription.length).toBeGreaterThan(0);
  });

  it("한자가 없으면 strokeAnalysis는 undefined이고 이유가 담긴다", () => {
    expect(vm.strokeAnalysis).toBeUndefined();
    expect(vm.strokeUnavailableReason).toBeDefined();
  });

  it("가짜 획수 기반 필드(overall·pronunciation)는 여전히 VM에 없다 — 아직 정리 안 된 범위", () => {
    expect(vm).not.toHaveProperty("overall");
    expect(vm).not.toHaveProperty("pronunciation");
  });
});

describe("buildNameAnalysisVM — 사전에 있는 한자를 이름과 같은 길이로 주면 오격을 노출한다", () => {
  const saju = calculateSaju(
    "1990-05-15",
    "14:30",
    "solar",
    false,
    "male",
    "서울",
  );
  // 黃度現(황도현) — 셋 다 naming_hanja_table.ts에 있는 한자
  const vm = buildNameAnalysisVM("황도현", saju, "黃度現");

  it("세 글자 모두 자원오행을 쓴다", () => {
    expect(vm.characters.map((c) => c.elementSourceLabel)).toEqual([
      "자원오행",
      "자원오행",
      "자원오행",
    ]);
  });

  it("실제 획수로 계산한 오격이 노출된다", () => {
    expect(vm.strokeAnalysis).toMatchObject({
      heavenGround: 13, // 黃12+1
      personalGround: 21, // 黃12+度9
      earthGround: 20, // 度9+現11
      outerGround: 24, // 黃12+現11+1
      totalGround: 32, // 黃12+度9+現11
    });
    expect(vm.strokeUnavailableReason).toBeUndefined();
  });
});

describe("시간 미상 명식으로도 4블록이 정상 생성된다", () => {
  const saju = calculateSaju(
    "1990-05-15",
    "12:00",
    "solar",
    false,
    "female",
    "서울",
    {
      unknownHour: true,
    },
  );
  const daeUn = calculateDaeUn(saju);
  const vm = buildReadingViewModel({ saju, daeUn, nowYear: 2024 });

  it("시주가 빠진 상태에서도 지장간은 3주만 나온다", () => {
    expect(vm.myeongsik.jiJangGan.length).toBe(3);
  });

  it("시간 미상이어도 계산된 일주에 해당하는 설명은 정상 제공한다", () => {
    expect(vm.myeongsik.ilju.name).toBe(
      `${saju.day.stem}${saju.day.branch}일주`,
    );
    expect(vm.myeongsik.ilju.summary.length).toBeGreaterThan(0);
  });

  it("나머지 블록도 예외 없이 채워진다", () => {
    expect(vm.life.fortunes.length).toBe(3);
    expect(vm.life.overview.paragraphs).toHaveLength(3);
    expect(vm.life.precisionNote).toMatch(/근사치/);
    expect(vm.flow.daeunOptions.length).toBeGreaterThan(0);
    expect(vm.career.recommendations.length).toBeGreaterThan(0);
  });
});
