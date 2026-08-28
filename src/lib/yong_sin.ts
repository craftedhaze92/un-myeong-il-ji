/**
 * 용신(用神) 선정 시스템
 * 사주의 불균형을 조절하고 운을 개선하는 핵심 오행 분석
 */

import type { SajuData, WuXing } from "../types/index";
import { analyzeLeapMonthBirth } from "./leap_month_analysis";
import { josa } from "./korean";
import { checkSpecialGyeokGuk, type GyeokGuk } from "./gyeok_guk";
import { selectJohuYongSin } from "./johu";
import { WuXingRelations } from "./yongsin/base";
import { getHeavenlyStemByKorean } from "../data/heavenly_stems";

export interface YongSinAnalysis {
  primaryYongSin: WuXing; // 주 용신
  secondaryYongSin?: WuXing; // 보조 용신 (희신의 일부)
  xiSin: WuXing[]; // 희신(喜神) - 용신을 돕는 오행
  jiSin: WuXing[]; // 기신(忌神) - 피해야 할 오행
  chouSin: WuXing[]; // 수신(仇神) - 용신을 극하는 오행
  dayMasterStrength: "very_strong" | "strong" | "medium" | "weak" | "very_weak";
  /** 용신을 어떤 법으로 정했는지 — 전왕(종격) > 조후(극단 계절) > 억부(강약 명확) > 통관(중화) 순 */
  method: "jeonwang" | "johu" | "eokbu" | "tonggwan";
  /** 0~1. 조후는 조후용신표의 verified 여부를, 나머지는 판정 근거의 명확성을 반영한다 */
  confidence: number;
  reasoning: string; // 용신 선정 이유
  leapMonthAnalysis?: {
    isLeapMonth: boolean;
    specialCharacteristics: string[];
    elementAdjustments: {
      element: WuXing;
      originalStrength: number;
      adjustedStrength: number;
      reason: string;
    }[];
    lifePathInterpretation: string;
    recommendations: string[];
    warnings: string[];
  };
  recommendations: {
    colors: string[];
    directions: string[];
    careers: string[];
    activities: string[];
    cautions: string[];
  };
}

/**
 * 오행별 색상, 방위, 직업 매핑
 */
const WU_XING_ATTRIBUTES: Record<
  WuXing,
  {
    colors: string[];
    directions: string[];
    careers: string[];
    activities: string[];
  }
> = {
  목: {
    colors: ["초록색", "청록색", "연두색"],
    directions: ["동쪽"],
    careers: [
      "교육",
      "출판",
      "섬유",
      "목재",
      "종이",
      "인쇄",
      "꽃/식물 사업",
      "환경",
    ],
    activities: ["산책", "등산", "원예", "독서", "글쓰기", "학습"],
  },
  화: {
    colors: ["빨간색", "주황색", "보라색", "분홍색"],
    directions: ["남쪽"],
    careers: [
      "요리",
      "전기",
      "광고",
      "방송",
      "예술",
      "연예",
      "IT",
      "교육",
      "에너지",
    ],
    activities: ["운동", "사교 활동", "공연 관람", "창작 활동", "여행"],
  },
  토: {
    colors: ["노란색", "갈색", "황토색", "베이지"],
    directions: ["중앙", "남서", "북동"],
    careers: [
      "건설",
      "부동산",
      "농업",
      "도자기",
      "중개",
      "물류",
      "보관",
      "컨설팅",
    ],
    activities: ["명상", "요가", "전통 문화", "농사", "부동산 투자", "중재"],
  },
  금: {
    colors: ["흰색", "금색", "은색", "회색"],
    directions: ["서쪽"],
    careers: [
      "금융",
      "은행",
      "회계",
      "법조",
      "금속",
      "기계",
      "자동차",
      "정밀 산업",
    ],
    activities: [
      "금융 투자",
      "골프",
      "등산",
      "정리 정돈",
      "법률 공부",
      "계획 수립",
    ],
  },
  수: {
    colors: ["검은색", "남색", "파란색"],
    directions: ["북쪽"],
    careers: [
      "물류",
      "유통",
      "무역",
      "수산",
      "음료",
      "화학",
      "연구",
      "의료",
      "정보통신",
    ],
    activities: ["수영", "낚시", "여행", "연구", "학습", "명상", "휴식"],
  },
};

interface YongSinCore {
  primaryYongSin: WuXing;
  secondaryYongSin?: WuXing;
  xiSin: WuXing[];
  jiSin: WuXing[];
  chouSin: WuXing[];
  method: YongSinAnalysis["method"];
  confidence: number;
  reasoning: string;
}

/** 종격(從格)일 때 왕한 세력을 그대로 따르는 전왕용신 */
function selectJeonwangYongSin(dayStemElement: WuXing, gyeokGuk: GyeokGuk): YongSinCore {
  let dominant: WuXing; // 따라야 할 왕한 오행
  let supportGenerator: WuXing; // 그 오행을 생조하는 오행(희신)
  let opposing: [WuXing, WuXing]; // 종격의 흐름을 거스르는 오행들(기신)
  let gyeokGukLabel: string;

  if (gyeokGuk === "jong_wang") {
    // 비겁이 5개 이상·60% 이상 → 일간 자신의 오행을 그대로 따른다
    dominant = dayStemElement;
    supportGenerator = getShengMeElement(dayStemElement); // 인성이 비겁을 생조
    opposing = [getKeMeElement(dayStemElement), getKeElement(dayStemElement)]; // 관살·재성이 거스름
    gyeokGukLabel = "종왕격";
  } else if (gyeokGuk === "jong_sal") {
    // 관살이 5개 이상·60% 이상 → 일간을 극하는 오행을 따른다
    dominant = getKeMeElement(dayStemElement);
    supportGenerator = getKeElement(dayStemElement); // 재성이 관살을 생조
    opposing = [dayStemElement, getShengMeElement(dayStemElement)]; // 비겁·인성이 거스름
    gyeokGukLabel = "종살격";
  } else {
    // jong_jae: 재성이 5개 이상·60% 이상 → 일간이 극하는 오행을 따른다
    dominant = getKeElement(dayStemElement);
    supportGenerator = getShengElement(dayStemElement); // 식상이 재성을 생조
    opposing = [dayStemElement, getShengMeElement(dayStemElement)]; // 비겁·인성이 거스름
    gyeokGukLabel = "종재격";
  }

  return {
    primaryYongSin: dominant,
    secondaryYongSin: supportGenerator,
    xiSin: [dominant, supportGenerator],
    jiSin: opposing,
    chouSin: [getKeMeElement(dominant)],
    method: "jeonwang",
    confidence: 0.85,
    reasoning: `사주에 특정 세력이 압도적으로 강해 종격(從格, ${gyeokGukLabel})을 이루므로, 억부를 거스르지 않고 그 왕한 세력(${dominant})을 그대로 따르는 전왕용신을 씁니다.`,
  };
}

/** 궁통보감 조후용신 — 한난조습이 극단(urgency: 'high')일 때 억부보다 앞세운다 */
function selectJohuAsYongSin(sajuData: SajuData): YongSinCore {
  const johu = selectJohuYongSin(sajuData);
  const secondaryElement = johu.assistStems
    .map((stem) => getHeavenlyStemByKorean(stem)?.element)
    .find((element): element is WuXing => element !== undefined && element !== johu.yongSinElement);

  return {
    primaryYongSin: johu.yongSinElement,
    secondaryYongSin: secondaryElement,
    xiSin: [johu.yongSinElement, secondaryElement, getShengMeElement(johu.yongSinElement)].filter(
      (e): e is WuXing => e !== undefined,
    ),
    jiSin: [getKeMeElement(johu.yongSinElement)],
    chouSin: [getKeMeElement(johu.yongSinElement)],
    method: "johu",
    confidence: johu.confidence,
    reasoning: `${johu.reasoning} 한난조습이 극단적이라 억부보다 조후를 앞세웁니다.`,
  };
}

/** 억부용신 — 강하면 설기·극하는 오행, 약하면 생조·동조하는 오행 */
function selectEokbuYongSin(
  dayStemElement: WuXing,
  strengthLevel: "very_strong" | "strong" | "weak" | "very_weak",
): YongSinCore {
  if (strengthLevel === "very_strong" || strengthLevel === "strong") {
    // 일간이 강하면: 식상(설), 재성(극), 관살(극)을 용신 후보로 — 관살 누락 보완
    const shengElement = getShengElement(dayStemElement); // 식상
    const keElement = getKeElement(dayStemElement); // 재성
    const keMeElement = getKeMeElement(dayStemElement); // 관살

    return {
      primaryYongSin: shengElement,
      secondaryYongSin: keElement,
      xiSin: [shengElement, keElement, keMeElement],
      jiSin: [dayStemElement, getShengMeElement(dayStemElement)], // 비겁, 인성은 기신
      chouSin: [getShengMeElement(dayStemElement)],
      method: "eokbu",
      confidence: 0.75,
      reasoning: `${josa(`일간(${dayStemElement})`, "이/가")} ${strengthLevel === "very_strong" ? "매우 " : ""}강하므로, 일간의 힘을 설(洩)하거나 소모시키는 ${josa(`${shengElement}(식상)`, "과/와")} ${josa(`${keElement}(재성)`, "을/를")} 용신으로 삼습니다.`,
    };
  }

  // 일간이 약하면: 인성(생), 비겁(동조)을 용신으로
  const shengMeElement = getShengMeElement(dayStemElement);

  return {
    primaryYongSin: shengMeElement,
    secondaryYongSin: dayStemElement,
    xiSin: [shengMeElement, dayStemElement],
    jiSin: [getKeElement(dayStemElement), getKeMeElement(dayStemElement)], // 재성, 관살은 기신
    chouSin: [getKeElement(dayStemElement)],
    method: "eokbu",
    confidence: 0.75,
    reasoning: `${josa(`일간(${dayStemElement})`, "이/가")} ${strengthLevel === "very_weak" ? "매우 " : ""}약하므로, 일간을 생(生)하는 ${josa(`${shengMeElement}(인성)`, "과/와")} 일간과 같은 ${josa(`${dayStemElement}(비겁)`, "을/를")} 용신으로 삼습니다.`,
  };
}

/**
 * 통관용신 — 중화(medium)일 때, 사주 안에서 서로 상극하며 팽팽히 맞선 두 오행 사이를
 * 이어주는 오행을 찾는다. 상극하는 두 세력이 뚜렷하지 않으면 조후용신으로 폴백한다
 * (예전의 "가장 적은 오행" 폴백은 명리학적 근거가 없어 제거했다).
 */
function findTonggwanCandidate(wuxingCount: Record<WuXing, number>): WuXing | null {
  const elements: WuXing[] = ["목", "화", "토", "금", "수"];
  let best: { mediator: WuXing; combinedCount: number } | null = null;

  for (const attacker of elements) {
    const target = WuXingRelations.getKeElement(attacker);
    // 둘 다 세력이 뚜렷해야(2개 이상) 팽팽히 맞섰다고 본다
    if ((wuxingCount[attacker] ?? 0) >= 2 && (wuxingCount[target] ?? 0) >= 2) {
      const mediator = WuXingRelations.getMediationElement(attacker, target);
      if (!mediator) continue;
      const combinedCount = (wuxingCount[attacker] ?? 0) + (wuxingCount[target] ?? 0);
      if (!best || combinedCount > best.combinedCount) {
        best = { mediator, combinedCount };
      }
    }
  }

  return best?.mediator ?? null;
}

function selectTonggwanYongSin(sajuData: SajuData): YongSinCore {
  const mediator = findTonggwanCandidate(sajuData.wuxingCount);
  if (mediator) {
    return {
      primaryYongSin: mediator,
      xiSin: [mediator, getShengMeElement(mediator)],
      jiSin: [],
      chouSin: [getKeMeElement(mediator)],
      method: "tonggwan",
      confidence: 0.7,
      reasoning: `사주가 중화(中和)되어 있으나 오행 간 상극이 팽팽하여, 그 사이를 이어주는 ${josa(mediator, "을/를")} 통관용신으로 삼아 흐름을 원활하게 합니다.`,
    };
  }

  // 뚜렷하게 맞선 세력이 없으면 조후용신으로 폴백 (urgency가 낮아도 계절 조율은 항상 유효한 참고값)
  const johu = selectJohuAsYongSin(sajuData);
  return {
    ...johu,
    method: "johu",
    confidence: johu.confidence * 0.8,
    reasoning: `사주가 중화(中和)되어 뚜렷하게 상극하는 세력이 없어, 계절 조후를 참고해 ${johu.reasoning}`,
  };
}

/**
 * 용신 선정 메인 함수.
 *
 * 우선순위(궁통보감·자평명리·적천수의 통설): 종격(전왕) > 조후(한난조습 극단) > 억부(강약 명확) >
 * 통관(중화). CLAUDE.md가 경고하는 "경쟁하는 두 용신 구현" 함정을 늘리지 않기 위해, 종격 판정은
 * gyeok_guk.ts#checkSpecialGyeokGuk을, 조후는 johu.ts#selectJohuYongSin을 그대로 재사용한다.
 */
export function selectYongSin(sajuData: SajuData): YongSinAnalysis {
  const strengthLevel = sajuData.dayMasterStrength?.level || "medium";
  const dayStemElement = sajuData.day.stemElement;

  let core: YongSinCore;

  const specialGyeokGuk = checkSpecialGyeokGuk(sajuData);
  if (specialGyeokGuk) {
    core = selectJeonwangYongSin(dayStemElement, specialGyeokGuk);
  } else {
    const johuUrgency = selectJohuYongSin(sajuData).urgency;
    if (johuUrgency === "high") {
      core = selectJohuAsYongSin(sajuData);
    } else if (strengthLevel === "very_strong" || strengthLevel === "strong" || strengthLevel === "weak" || strengthLevel === "very_weak") {
      core = selectEokbuYongSin(dayStemElement, strengthLevel);
    } else {
      core = selectTonggwanYongSin(sajuData);
    }
  }

  // 윤달 출생자 특수 분석
  const leapMonthAnalysis = analyzeLeapMonthBirth(sajuData);

  // 용신 기반 조언 생성 (윤달 분석 반영)
  const recommendations = generateRecommendations(
    core.primaryYongSin,
    core.secondaryYongSin,
    core.jiSin,
    leapMonthAnalysis,
  );

  return {
    primaryYongSin: core.primaryYongSin,
    secondaryYongSin: core.secondaryYongSin,
    xiSin: [...new Set(core.xiSin)],
    jiSin: [...new Set(core.jiSin)],
    chouSin: [...new Set(core.chouSin)],
    dayMasterStrength: strengthLevel,
    method: core.method,
    confidence: core.confidence,
    reasoning: core.reasoning,
    leapMonthAnalysis: leapMonthAnalysis || undefined,
    recommendations,
  };
}

/**
 * 오행 상생 관계: A가 B를 생(生)함
 * 목생화, 화생토, 토생금, 금생수, 수생목
 */
function getShengElement(element: WuXing): WuXing {
  const shengMap: Record<WuXing, WuXing> = {
    목: "화",
    화: "토",
    토: "금",
    금: "수",
    수: "목",
  };
  return shengMap[element];
}

/**
 * 나를 생(生)하는 오행
 */
function getShengMeElement(element: WuXing): WuXing {
  const shengMeMap: Record<WuXing, WuXing> = {
    목: "수", // 수생목
    화: "목", // 목생화
    토: "화", // 화생토
    금: "토", // 토생금
    수: "금", // 금생수
  };
  return shengMeMap[element];
}

/**
 * 오행 상극 관계: A가 B를 극(克)함
 * 목극토, 토극수, 수극화, 화극금, 금극목
 */
function getKeElement(element: WuXing): WuXing {
  const keMap: Record<WuXing, WuXing> = {
    목: "토",
    화: "금",
    토: "수",
    금: "목",
    수: "화",
  };
  return keMap[element];
}

/**
 * 나를 극(克)하는 오행
 */
function getKeMeElement(element: WuXing): WuXing {
  const keMeMap: Record<WuXing, WuXing> = {
    목: "금", // 금극목
    화: "수", // 수극화
    토: "목", // 목극토
    금: "화", // 화극금
    수: "토", // 토극수
  };
  return keMeMap[element];
}

/**
 * 용신 기반 조언 생성 (윤달 분석 반영)
 */
function generateRecommendations(
  primaryYongSin: WuXing,
  secondaryYongSin: WuXing | undefined,
  jiSin: WuXing[],
  leapMonthAnalysis?: {
    isLeapMonth: boolean;
    specialCharacteristics: string[];
    elementAdjustments: {
      element: WuXing;
      originalStrength: number;
      adjustedStrength: number;
      reason: string;
    }[];
    lifePathInterpretation: string;
    recommendations: string[];
    warnings: string[];
  } | null,
): YongSinAnalysis["recommendations"] {
  const primary = WU_XING_ATTRIBUTES[primaryYongSin];
  const secondary = secondaryYongSin
    ? WU_XING_ATTRIBUTES[secondaryYongSin]
    : null;

  // 기신(피해야 할 오행)의 속성
  const cautionAttributes = jiSin.map((element) => WU_XING_ATTRIBUTES[element]);

  const colors = [...primary.colors];
  const directions = [...primary.directions];
  const careers = [...primary.careers];
  const activities = [...primary.activities];

  if (secondary) {
    colors.push(...secondary.colors.slice(0, 2));
    directions.push(...secondary.directions.slice(0, 1));
    careers.push(...secondary.careers.slice(0, 3));
    activities.push(...secondary.activities.slice(0, 2));
  }

  // 기신 속성으로 주의사항 생성
  const cautions: string[] = [];

  cautionAttributes.forEach((attr, index) => {
    cautions.push(`${jiSin[index]} 오행(${attr.colors.join(", ")})은 피하세요`);
    cautions.push(`${attr.directions.join(", ")} 방향 이동은 신중하게`);
  });

  // 윤달 출생자인 경우 추가 주의사항
  if (leapMonthAnalysis && leapMonthAnalysis.isLeapMonth) {
    cautions.push(...leapMonthAnalysis.warnings.slice(0, 2));
  }

  return {
    colors: [...new Set(colors)].slice(0, 5),
    directions: [...new Set(directions)].slice(0, 3),
    careers: [...new Set(careers)].slice(0, 8),
    activities: [...new Set(activities)].slice(0, 6),
    cautions: cautions.slice(0, 6),
  };
}

/**
 * 용신 기반 조언 텍스트 생성 (윤달 분석 포함)
 */
export function generateYongSinAdvice(yongSin: YongSinAnalysis): string[] {
  const advice: string[] = [];

  advice.push(
    `주 용신은 ${yongSin.primaryYongSin} 오행입니다. ${yongSin.reasoning}`,
  );

  // 윤달 출생자 특성 추가
  if (yongSin.leapMonthAnalysis && yongSin.leapMonthAnalysis.isLeapMonth) {
    advice.push(`\n🌙 윤달 출생자 특성:`);
    advice.push(yongSin.leapMonthAnalysis.lifePathInterpretation);

    if (yongSin.leapMonthAnalysis.specialCharacteristics.length > 0) {
      advice.push(
        `특별한 성향: ${yongSin.leapMonthAnalysis.specialCharacteristics.slice(0, 2).join(". ")}`,
      );
    }

    if (yongSin.leapMonthAnalysis.elementAdjustments.length > 0) {
      const adjustment = yongSin.leapMonthAnalysis.elementAdjustments[0];
      if (adjustment) {
        advice.push(
          `오행 조정: ${adjustment.element} ${adjustment.originalStrength} → ${adjustment.adjustedStrength} (${adjustment.reason})`,
        );
      }
    }
  }

  if (yongSin.recommendations.colors.length > 0) {
    const colorsText = yongSin.recommendations.colors.slice(0, 3).join(", ");
    advice.push(`길한 색상: ${josa(colorsText, "을/를")} 활용하세요`);
  }

  if (yongSin.recommendations.directions.length > 0) {
    advice.push(
      `유리한 방향: ${yongSin.recommendations.directions.join(", ")} 방향이 길합니다`,
    );
  }

  // if (yongSin.recommendations.careers.length > 0) {
  //   advice.push(
  //     `적합한 직업: ${yongSin.recommendations.careers.slice(0, 4).join(', ')} 등`
  //   );
  // }

  if (yongSin.recommendations.activities.length > 0) {
    advice.push(
      `권장 활동: ${yongSin.recommendations.activities.slice(0, 3).join(", ")} 등`,
    );
  }

  if (yongSin.recommendations.cautions.length > 0) {
    advice.push(`주의사항: ${yongSin.recommendations.cautions[0]}`);
  }

  // 윤달 출생자 권장사항 추가
  if (yongSin.leapMonthAnalysis && yongSin.leapMonthAnalysis.isLeapMonth) {
    if (yongSin.leapMonthAnalysis.recommendations.length > 0) {
      advice.push(
        `윤달 특별 권장: ${yongSin.leapMonthAnalysis.recommendations.slice(0, 2).join(". ")}`,
      );
    }
  }

  return advice;
}
