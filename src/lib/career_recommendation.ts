/**
 * 직업 추천 시스템 (Career Recommendation)
 *
 * 용신, 오행 균형, 십성 분석을 기반으로 적합한 직업을 추천합니다.
 */

import type { SajuData, WuXing, HeavenlyStem, TenGod } from '../types/index';
import { josa } from './korean';
import {
  calculateElementDistribution,
  getElementStatusMap,
  type ElementStatus,
} from './element_distribution';
import { CareerMatcher, type CareerMatch } from './career_matcher';
import {
  CAREER_CATEGORY_INFO,
  type CareerCategory as ModernCareerCategory,
} from '../data/modern_careers';
import { DEFAULT_PRESETS } from '../data/school_presets';

/**
 * 직업 카테고리
 */
export type CareerCategory = ModernCareerCategory;

/**
 * 직업 추천 결과
 */
export interface CareerRecommendation {
  /** 추천 직업 목록 (우선순위 순) */
  recommendations: {
    category: CareerCategory;
    categoryLabel: string;
    score: number; // 0-100
    specificJobs: string[];
    roleSummary: string;
    requiredSkills: string[];
    workConditions: string[];
    basis: string[];
    reason: string;
    yongsinAlignment: string;
    strength: '매우 적합' | '적합' | '보통' | '부적합';
  }[];

  /** 절대 배제가 아닌, 부담이 될 수 있어 살펴볼 업무 조건 */
  workConditionsToConsider: {
    condition: string;
    reason: string;
    alternativeSuggestion: string;
    basis: string[];
  }[];

  /** 오행별 직업 적성 — 발달 오행(타고난 강점)과 용신(보완 방향) 두 관점을 블렌드한다 */
  elementalAffinity: {
    element: WuXing;
    affinity: number; // 0-100, (strengthScore + yongsinScore) / 2
    /** 명식에서 이 오행이 얼마나 발달했는지 (element_distribution.ts와 동일 소스) */
    strengthScore: number; // 0-100
    /** 용신과의 관계(일치/생조/상극) */
    yongsinScore: number; // 0-100
    developedStatus: ElementStatus; // '발달' | '적정' | '부족'
    careers: string[];
  }[];

  /** 경력 개발 조언 */
  careerAdvice: {
    explore: string[];
    grow: string[];
    expand: string[];
    entrepreneurship: string;
  };

  /** 직장 환경 선호도 */
  workEnvironment: {
    preferredSize: '대기업' | '중견기업' | '중소기업' | '스타트업' | '자영업';
    workStyle: '독립형' | '협업형' | '혼합형';
    leadership: '리더십 강함' | '리더십 보통' | '팔로워십 강함';
    stability: '안정 추구형' | '도전 추구형' | '균형형';
  };

  /** 종합 평가 */
  summary: string;
}

/**
 * 오행별 직업 매핑 — 카테고리별로 직업을 명시적으로 매핑한다.
 *
 * 예전에는 오행마다 `jobs: string[]` 평평한 배열 하나를 두고, jobsForCategory가 이 배열을
 * categories.length만큼 기계적으로 등분(chunk)해서 카테고리에 배정했다. 원 배열의 직업 순서가
 * categories 순서와 미리 정확히 안 맞으면 엉뚱한 직업이 엉뚱한 카테고리에 배정됐다 — 실제로
 * 5개 오행 전부에서 어긋나 있었다(예: 화 오행의 "예술/문화" 슬롯에 "프로그래머"가, "IT/기술"
 * 슬롯에 "영업사원·강사·MC"가 배정되던 회귀). 카테고리를 키로 직접 매핑하면 배열 순서에
 * 의존하지 않으므로 이런 어긋남이 구조적으로 불가능해진다.
 */
// 테스트(career_recommendation.test.ts)에서 5개 오행 × 카테고리 매핑을 직접 순회 검증하려고 export한다.
export const ELEMENT_CAREERS: Record<
  WuXing,
  { categories: CareerCategory[]; jobsByCategory: Partial<Record<CareerCategory, string[]>> }
> = {
  '목': {
    categories: ['교육/연구', '예술/문화', '의료/보건', '농업/환경'],
    jobsByCategory: {
      '교육/연구': ['교사', '교수', '연구원', '출판 편집자'],
      '예술/문화': ['작가', '예술가', '디자이너', '큐레이터'],
      '의료/보건': ['한의사', '약사', '상담사'],
      '농업/환경': ['조경사', '농부', '환경운동가', '원예사', '산림 관리자'],
    },
  },
  '화': {
    categories: ['언론/미디어', '예술/문화', 'IT/기술', '서비스/영업'],
    jobsByCategory: {
      '언론/미디어': ['방송인', '기자', 'MC', '홍보 담당자'],
      '예술/문화': ['배우', '가수', '유튜버'],
      'IT/기술': ['프로그래머', '디지털 마케터'],
      '서비스/영업': ['마케터', '광고 기획자', '영업사원', '강사', '인플루언서', '이벤트 기획자'],
    },
  },
  '토': {
    categories: ['건설/부동산', '경영/관리', '금융/재무', '농업/환경'],
    jobsByCategory: {
      '건설/부동산': ['부동산 중개인', '건축가', '토목 기사', '부동산 개발자', '도시 계획가'],
      '경영/관리': ['CEO', '경영 컨설턴트', '물류 관리자'],
      '금융/재무': ['회계사', '세무사', '은행원', '자산 관리사', '감정평가사'],
      '농업/환경': ['농업 경영인'],
    },
  },
  '금': {
    categories: ['금융/재무', '법률/행정', '안전/보안', '제조/생산'],
    jobsByCategory: {
      '금융/재무': ['금융 애널리스트', '투자 전문가', '회계사', '감사'],
      '법률/행정': ['변호사', '검사', '판사', '공무원', '법무사'],
      '안전/보안': ['경찰', '군인', '보안 전문가'],
      '제조/생산': ['기계 기술자', '금속 가공업자', '품질 관리자'],
    },
  },
  '수': {
    categories: ['IT/기술', '의료/보건', '종교/상담', '서비스/영업'],
    jobsByCategory: {
      'IT/기술': ['IT 개발자', '데이터 과학자', '연구원'],
      '의료/보건': ['의사', '간호사', '약사', '수의사'],
      '종교/상담': ['심리 상담사', '철학자', '종교인', '명리학자'],
      '서비스/영업': ['물류 관리자', '작가', '번역가', '수산업자', '바리스타'],
    },
  },
} as const;

/**
/**
 * 십성별 직업 특성 및 적합 직군
 */
interface TenGodCareerProfile {
  // 기본 특성 (0-100)
  leadership: number; // 리더십
  independence: number; // 독립성
  creativity: number; // 창의성
  stability: number; // 안정성 추구
  communication: number; // 소통능력
  analytical: number; // 분석력
  execution: number; // 실행력
  innovation: number; // 혁신성

  // 적합 직군
  suitableCategories: CareerCategory[];

  // 직업 스타일
  workStyle: '독립형' | '협업형' | '혼합형';

  // 창업 적성 (0-100)
  entrepreneurship: number;

  // 특징
  characteristics: string[];
}

const TEN_GODS_CAREER_PROFILES: Record<TenGod, TenGodCareerProfile> = {
  '비견': {
    leadership: 60,
    independence: 85,
    creativity: 50,
    stability: 60,
    communication: 55,
    analytical: 60,
    execution: 75,
    innovation: 50,
    suitableCategories: ['경영/관리', '제조/생산', '건설/부동산', '서비스/영업'],
    workStyle: '독립형',
    entrepreneurship: 75,
    characteristics: [
      '자립심이 강하고 독립적',
      '경쟁 상황에서 능력 발휘',
      '동업보다는 단독 경영 선호',
      '자영업 성공 가능성 높음'
    ],
  },
  '겁재': {
    leadership: 70,
    independence: 90,
    creativity: 60,
    stability: 40,
    communication: 65,
    analytical: 55,
    execution: 85,
    innovation: 65,
    suitableCategories: ['경영/관리', '서비스/영업', '언론/미디어', 'IT/기술'],
    workStyle: '혼합형',
    entrepreneurship: 85,
    characteristics: [
      '추진력과 행동력이 뛰어남',
      '빠른 의사결정과 실행',
      '위험 감수하는 성향',
      '동업은 신중하게 접근 필요'
    ],
  },
  '식신': {
    leadership: 40,
    independence: 70,
    creativity: 90,
    stability: 50,
    communication: 80,
    analytical: 60,
    execution: 65,
    innovation: 75,
    suitableCategories: ['예술/문화', '교육/연구', '서비스/영업', '언론/미디어'],
    workStyle: '독립형',
    entrepreneurship: 70,
    characteristics: [
      '창의력과 표현력이 뛰어남',
      '예술적 감각 우수',
      '여유롭고 안정적인 성향',
      '인간관계 원만'
    ],
  },
  '상관': {
    leadership: 50,
    independence: 85,
    creativity: 95,
    stability: 30,
    communication: 85,
    analytical: 75,
    execution: 70,
    innovation: 95,
    suitableCategories: ['예술/문화', 'IT/기술', '언론/미디어', '교육/연구'],
    workStyle: '독립형',
    entrepreneurship: 80,
    characteristics: [
      '탁월한 창의성과 기술력',
      '독특하고 혁신적인 아이디어',
      '기존 틀을 깨는 성향',
      '전문 기술직 적합'
    ],
  },
  '편재': {
    leadership: 70,
    independence: 65,
    creativity: 60,
    stability: 50,
    communication: 85,
    analytical: 70,
    execution: 80,
    innovation: 65,
    suitableCategories: ['금융/재무', '서비스/영업', '경영/관리', '건설/부동산'],
    workStyle: '혼합형',
    entrepreneurship: 90,
    characteristics: [
      '사교성과 활동성이 뛰어남',
      '재물 운용 능력 우수',
      '다양한 사업 기회 포착',
      '유동적 재산 관리 능력'
    ],
  },
  '정재': {
    leadership: 50,
    independence: 40,
    creativity: 40,
    stability: 90,
    communication: 60,
    analytical: 75,
    execution: 85,
    innovation: 40,
    suitableCategories: ['금융/재무', '경영/관리', '법률/행정', '제조/생산'],
    workStyle: '협업형',
    entrepreneurship: 50,
    characteristics: [
      '성실하고 근면함',
      '안정적 재산 축적',
      '체계적이고 계획적',
      '정규직 근무 적합'
    ],
  },
  '편관': {
    leadership: 90,
    independence: 75,
    creativity: 50,
    stability: 60,
    communication: 70,
    analytical: 80,
    execution: 90,
    innovation: 60,
    suitableCategories: ['법률/행정', '안전/보안', '경영/관리'],
    workStyle: '혼합형',
    entrepreneurship: 75,
    characteristics: [
      '강력한 추진력과 결단력',
      '권력과 명예 지향',
      '도전적이고 과감함',
      '경쟁 환경에서 강점 발휘'
    ],
  },
  '정관': {
    leadership: 80,
    independence: 50,
    creativity: 40,
    stability: 85,
    communication: 75,
    analytical: 85,
    execution: 80,
    innovation: 45,
    suitableCategories: ['법률/행정', '경영/관리', '교육/연구', '의료/보건'],
    workStyle: '협업형',
    entrepreneurship: 45,
    characteristics: [
      '책임감이 강하고 정직함',
      '규칙과 원칙 준수',
      '명예와 지위 중시',
      '조직 생활 적합'
    ],
  },
  '편인': {
    leadership: 40,
    independence: 65,
    creativity: 85,
    stability: 70,
    communication: 55,
    analytical: 90,
    execution: 60,
    innovation: 85,
    suitableCategories: ['교육/연구', 'IT/기술', '종교/상담', '예술/문화'],
    workStyle: '독립형',
    entrepreneurship: 60,
    characteristics: [
      '독특하고 깊이 있는 사고',
      '비주류 학문과 기술',
      '직관력과 영감 뛰어남',
      '전문 연구직 적합'
    ],
  },
  '정인': {
    leadership: 50,
    independence: 50,
    creativity: 70,
    stability: 90,
    communication: 70,
    analytical: 85,
    execution: 70,
    innovation: 60,
    suitableCategories: ['교육/연구', '의료/보건', '법률/행정', '경영/관리'],
    workStyle: '협업형',
    entrepreneurship: 40,
    characteristics: [
      '학습 능력과 지적 능력 우수',
      '안정적이고 신중함',
      '보호와 양육 성향',
      '학문과 교육 분야 적합'
    ],
  },
} as const;

/**
 * 십성 직업 분석 결과
 */
interface TenGodsCareerAnalysis {
  dominantTenGod: TenGod; // 가장 강한 십성
  dominantProfile: TenGodCareerProfile;
  averageTraits: {
    leadership: number;
    independence: number;
    creativity: number;
    stability: number;
    communication: number;
    analytical: number;
    execution: number;
    innovation: number;
  };
  workStyle: '독립형' | '협업형' | '혼합형';
  entrepreneurship: number;
  suitableCategories: CareerCategory[];
}

/**
 * 사주의 십성 분포를 분석하여 직업 특성 도출
 */
function analyzeTenGodsCareer(saju: SajuData): TenGodsCareerAnalysis {
  const distribution = saju.tenGodsDistribution || {
    비견: 0, 겁재: 0, 식신: 0, 상관: 0, 편재: 0,
    정재: 0, 편관: 0, 정관: 0, 편인: 0, 정인: 0,
  };

  // 가장 강한 십성 찾기
  let maxCount = 0;
  let dominantTenGod: TenGod = '비견';

  (Object.keys(distribution) as TenGod[]).forEach((tenGod) => {
    if (distribution[tenGod] > maxCount) {
      maxCount = distribution[tenGod];
      dominantTenGod = tenGod;
    }
  });

  const dominantProfile = TEN_GODS_CAREER_PROFILES[dominantTenGod];

  // 모든 십성의 가중 평균 계산
  let totalCount = 0;
  const avgTraits = {
    leadership: 0,
    independence: 0,
    creativity: 0,
    stability: 0,
    communication: 0,
    analytical: 0,
    execution: 0,
    innovation: 0,
  };

  (Object.keys(distribution) as TenGod[]).forEach((tenGod) => {
    const count = distribution[tenGod];
    if (count > 0) {
      const profile = TEN_GODS_CAREER_PROFILES[tenGod];
      totalCount += count;
      avgTraits.leadership += profile.leadership * count;
      avgTraits.independence += profile.independence * count;
      avgTraits.creativity += profile.creativity * count;
      avgTraits.stability += profile.stability * count;
      avgTraits.communication += profile.communication * count;
      avgTraits.analytical += profile.analytical * count;
      avgTraits.execution += profile.execution * count;
      avgTraits.innovation += profile.innovation * count;
    }
  });

  if (totalCount > 0) {
    Object.keys(avgTraits).forEach((key) => {
      avgTraits[key as keyof typeof avgTraits] /= totalCount;
    });
  }

  // 업무 스타일 결정
  let workStyle: '독립형' | '협업형' | '혼합형';
  if (avgTraits.independence > 70) {
    workStyle = '독립형';
  } else if (avgTraits.independence < 50) {
    workStyle = '협업형';
  } else {
    workStyle = '혼합형';
  }

  // 창업 적성 계산
  let entrepreneurship = 0;
  (Object.keys(distribution) as TenGod[]).forEach((tenGod) => {
    const count = distribution[tenGod];
    if (count > 0) {
      entrepreneurship += TEN_GODS_CAREER_PROFILES[tenGod].entrepreneurship * count;
    }
  });
  entrepreneurship = totalCount > 0 ? entrepreneurship / totalCount : 50;

  // 적합 직군 수집 (빈도순)
  const categoryCount: Record<string, number> = {};
  (Object.keys(distribution) as TenGod[]).forEach((tenGod) => {
    const count = distribution[tenGod];
    if (count > 0) {
      TEN_GODS_CAREER_PROFILES[tenGod].suitableCategories.forEach((category) => {
        categoryCount[category] = (categoryCount[category] || 0) + count;
      });
    }
  });

  const suitableCategories = (Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category]) => category) as CareerCategory[]);

  return {
    dominantTenGod,
    dominantProfile,
    averageTraits: avgTraits,
    workStyle,
    entrepreneurship,
    suitableCategories,
  };
}

/**
 * 직업 추천 생성 (십성 분석 통합)
 */
export function recommendCareer(saju: SajuData): CareerRecommendation {
  const yongsin = saju.yongSin?.primaryYongSin || '목';

  // 1. 십성 분석
  const tenGodsAnalysis = analyzeTenGodsCareer(saju);

  // 2. 오행별 적성 계산
  const elementalAffinity = calculateElementalAffinity(saju, yongsin);

  // 2-1. modern_careers.ts의 실제 직업 DB(career_matcher.ts)에서 개별 직업 매칭 —
  // 오행 강도는 element_distribution.ts(지장간 가중, 오행과 십성 카드와 동일 소스)로
  // 맞추기 위해 wuxingCount만 얕게 바꿔치기해서 넘긴다. 용신은 saju.yongSin(화면에 이미
  // 표시 중인 값, saju.ts가 실제로 쓰는 legacy yong_sin.ts 결과)을 그대로 넘겨서
  // CareerMatcher가 내부 YongSinSelector(4-알고리즘 레지스트리, 별개 구현)로 다시 계산해
  // 다른 용신을 내는 불일치를 막는다. saju.yongSin이 없으면 override 없이 기존 동작 유지.
  const modernMatches = CareerMatcher.matchCareers(
    { ...saju, wuxingCount: calculateElementDistribution(saju).counts },
    DEFAULT_PRESETS.modern_professional,
    {
      minScore: 0,
      maxResults: 100,
      yongSinOverride: saju.yongSin
        ? {
            primaryYongSin: saju.yongSin.primaryYongSin,
            secondaryYongSin: saju.yongSin.secondaryYongSin,
          }
        : undefined,
    }
  );

  // 3. 직업 추천 생성 (십성 + 오행 + modern DB 통합)
  const recommendations = generateRecommendations(
    saju,
    yongsin,
    elementalAffinity,
    tenGodsAnalysis,
    modernMatches
  );

  // 4. 부담이 될 수 있어 살펴볼 업무 조건 — 직업을 금지하지 않는다.
  const workConditionsToConsider = identifyWorkConditionsToConsider(yongsin);

  // 5. 경력 조언
  const careerAdvice = generateCareerAdvice(saju, yongsin, recommendations);

  // 6. 직장 환경 선호도 (십성 기반)
  const workEnvironment = analyzeWorkEnvironment(saju, tenGodsAnalysis);

  // 7. 종합 평가
  const summary = generateSummary(recommendations, workEnvironment);

  return {
    recommendations,
    workConditionsToConsider,
    elementalAffinity,
    careerAdvice,
    workEnvironment,
    summary,
  };
}

/**
 * 오행별 적성 계산 — "타고난 강점"(발달 오행)과 "보완이 필요한 방향"(용신) 두 관점을
 * 독립적으로 점수화한 뒤 평균해서 블렌드한다.
 *
 * 예전에는 용신 점수만 쓰면서 오행이 강할수록(발달할수록) 오히려 -10을 주는 억부용신
 * 단일 기준이었다 — 실제로 그 오행이 발달해 잘 다루는 사람에게도 "이 분야는 안 맞다"는
 * 결과가 나오는 문제가 있었다. strengthScore는 오행과 십성 카드(pentagon)와 동일한
 * element_distribution.ts#calculateElementDistribution(지장간 가중 %)를 그대로 써서,
 * 화면에 보이는 발달/부족 배지와 여기 점수가 항상 같은 명식을 말하게 한다.
 */
function calculateElementalAffinity(
  saju: SajuData,
  yongsin: WuXing
): CareerRecommendation['elementalAffinity'] {
  const elements: WuXing[] = ['목', '화', '토', '금', '수'];
  const dist = calculateElementDistribution(saju);
  const statusMap = getElementStatusMap(dist.counts);

  return elements.map((element) => {
    // 발달 오행(강점) 점수 — 평균 20%를 기준으로 스케일. 40%면 만점, 0%면 0점.
    const strengthScore = Math.max(
      0,
      Math.min(100, Math.round((dist.pct[element] ?? 0) * 2.5))
    );

    // 용신(보완 방향) 점수 — 일치/생조/상극 관계
    let yongsinScore = 50;
    if (element === yongsin) {
      yongsinScore += 40;
    } else if (generates(element, yongsin)) {
      yongsinScore += 20;
    } else if (controls(element, yongsin)) {
      yongsinScore -= 30;
    }
    yongsinScore = Math.max(0, Math.min(100, yongsinScore));

    const affinity = Math.round((strengthScore + yongsinScore) / 2);

    return {
      element,
      affinity,
      strengthScore,
      yongsinScore,
      developedStatus: statusMap[element],
      careers: Object.values(ELEMENT_CAREERS[element].jobsByCategory).flat().slice(0, 5),
    };
  }).sort((a, b) => b.affinity - a.affinity);
}

/**
 * 직업 추천 생성 (십성 + 오행 + modern DB 통합)
 */
/**
 * 카테고리별 구체적 직업 3개를 고른다. 현대 카탈로그와 기존 오행 폴백을 섞되, 현대
 * 카탈로그에 저장된 역할·역량·업무 조건은 추천 카드의 설명에도 사용한다.
 */
function pickSpecificJobs(
  category: CareerCategory,
  elementData: { jobsByCategory: Partial<Record<CareerCategory, string[]>> },
  modernMatches: CareerMatch[]
): {
  jobs: string[];
  modernReason?: string;
  requiredSkills: string[];
  workConditions: string[];
} {
  const sortedModernMatches = modernMatches
    .filter((m) => m.career.category === category)
    .sort((a, b) => b.matchScore - a.matchScore);

  const modernJobs = sortedModernMatches.map((m) => m.career.name);
  const fallbackJobs = elementData.jobsByCategory[category] ?? [];
  const jobs = Array.from(new Set([...modernJobs, ...fallbackJobs])).slice(0, 3);

  const matchedCareers = sortedModernMatches.slice(0, 3).map((match) => match.career);
  const categoryInfo = CAREER_CATEGORY_INFO[category];
  return {
    jobs,
    modernReason: sortedModernMatches[0]?.career.recommendationReason,
    requiredSkills: Array.from(
      new Set(matchedCareers.flatMap((career) => career.requiredSkills))
    ).slice(0, 4),
    workConditions: Array.from(
      new Set([
        ...matchedCareers.flatMap((career) => career.workConditions),
        ...categoryInfo.workConditions,
      ])
    ).slice(0, 3),
  };
}

function generateRecommendations(
  _saju: SajuData,
  yongsin: WuXing,
  elementalAffinity: CareerRecommendation['elementalAffinity'],
  tenGodsAnalysis: TenGodsCareerAnalysis,
  modernMatches: CareerMatch[]
): CareerRecommendation['recommendations'] {
  const byCategory = new Map<
    CareerCategory,
    CareerRecommendation['recommendations'][number]
  >();

  // 십성 기반 직군에 가점 부여
  const tenGodsCategoryBonus: Record<string, number> = {};
  tenGodsAnalysis.suitableCategories.forEach((category, index) => {
    tenGodsCategoryBonus[category] = 20 - (index * 3); // 20, 17, 14, 11, 8, 5
  });

  // 상위 3개 오행의 직업 카테고리 추천
  elementalAffinity.slice(0, 3).forEach((affinity, index) => {
    const element = affinity.element;
    const elementData = ELEMENT_CAREERS[element];

    elementData.categories.forEach((category) => {
      let score = affinity.affinity - (index * 5); // 순위에 따라 점수 조정

      // 십성 기반 가점
      if (tenGodsCategoryBonus[category]) {
        score += tenGodsCategoryBonus[category];
      }

      const isYongsin = element === yongsin;
      const isTenGodsMatch = tenGodsAnalysis.suitableCategories.includes(category);
      const {
        jobs: specificJobs,
        modernReason,
        requiredSkills,
        workConditions,
      } = pickSpecificJobs(category, elementData, modernMatches);
      const categoryInfo = CAREER_CATEGORY_INFO[category];

      // 발달 오행(타고난 강점)과 용신(보완 방향) 두 관점을 각각 문장으로 만들어 이어붙인다 —
      // 조합마다 문장을 따로 쓰면 경우의 수가 폭발하므로, 해당하는 절만 골라 join한다.
      const reasonClauses: string[] = [];
      if (affinity.developedStatus === '발달') {
        reasonClauses.push(`${element} 기운이 명식에서 발달해 타고난 강점입니다`);
      } else if (affinity.developedStatus === '부족') {
        reasonClauses.push(`${element} 기운은 명식에서 부족한 편입니다`);
      }
      if (isYongsin) {
        reasonClauses.push(`${josa(`용신(${yongsin})`, "과/와")} 일치해 보완 방향으로도 유리합니다`);
      } else if (generates(element, yongsin)) {
        reasonClauses.push(`${josa(`용신(${yongsin})`, "을/를")} 생조해 도움이 됩니다`);
      } else if (controls(element, yongsin)) {
        reasonClauses.push(`${josa(`용신(${yongsin})`, "을/를")} 극해 다소 불리할 수 있습니다`);
      }
      if (isTenGodsMatch) {
        reasonClauses.push(`십성(${tenGodsAnalysis.dominantTenGod}) 특성에도 잘 맞습니다`);
      }
      if (modernReason) {
        reasonClauses.push(modernReason);
      }
      const reason =
        reasonClauses.length > 0
          ? `${reasonClauses.join(". ")}.`
          : `${element} 기운이 적성에 맞습니다.`;

      const basis = [
        element + ' ' + (
          affinity.developedStatus === '발달'
            ? '강점'
            : affinity.developedStatus === '부족'
              ? '보완 방향'
              : '균형'
        ),
        isYongsin
          ? '용신 ' + yongsin + ' 일치'
          : generates(element, yongsin)
            ? '용신 ' + yongsin + ' 생조'
            : '십성 ' + tenGodsAnalysis.dominantTenGod,
      ];
      const candidate: CareerRecommendation['recommendations'][number] = {
        category,
        categoryLabel: categoryInfo.label,
        score: Math.max(0, Math.min(100, score)),
        specificJobs,
        roleSummary: categoryInfo.roleSummary,
        requiredSkills,
        workConditions,
        basis,
        reason,
        yongsinAlignment: isYongsin ? '용신 일치' : generates(element, yongsin) ? '용신 생조' : '보통',
        strength: score >= 80 ? '매우 적합' : score >= 60 ? '적합' : score >= 40 ? '보통' : '부적합',
      };

      // 여러 오행이 같은 직군을 가리킬 수 있다. 카드 하나로 합쳐야 직군이 중복되지
      // 않고, 근거도 누락되지 않는다.
      const existing = byCategory.get(category);
      if (!existing) {
        byCategory.set(category, candidate);
        return;
      }

      const best = candidate.score > existing.score ? candidate : existing;
      byCategory.set(category, {
        ...best,
        specificJobs: Array.from(
          new Set([...existing.specificJobs, ...candidate.specificJobs])
        ).slice(0, 3),
        requiredSkills: Array.from(
          new Set([...existing.requiredSkills, ...candidate.requiredSkills])
        ).slice(0, 4),
        workConditions: Array.from(
          new Set([...existing.workConditions, ...candidate.workConditions])
        ).slice(0, 3),
        basis: Array.from(new Set([...existing.basis, ...candidate.basis])),
      });
    });
  });

  // 점수순 정렬 및 상위 10개 반환
  return [...byCategory.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

/**
 * 특정 직업을 금지하지 않고, 용신과 충돌하는 오행이 강하게 요구되는 업무 조건을
 * “살펴볼 점”으로만 정리한다.
 */
function identifyWorkConditionsToConsider(
  yongsin: WuXing
): CareerRecommendation['workConditionsToConsider'] {
  const conditions: CareerRecommendation['workConditionsToConsider'] = [];

  const elements: WuXing[] = ['목', '화', '토', '금', '수'];
  const harmfulElements = elements.filter((el) => controls(el, yongsin));

  harmfulElements.forEach((element) => {
    const elementData = ELEMENT_CAREERS[element];
    elementData.categories.forEach((category) => {
      conditions.push({
        condition: CAREER_CATEGORY_INFO[category].label,
        reason:
          element +
          ' 기운이 ' +
          josa('용신(' + yongsin + ')', '을/를') +
          ' 극하는 방향이라, 이 직군의 업무 조건이 오래 지속될 때 부담으로 느껴질 수 있습니다.',
        alternativeSuggestion:
          '대신 ' +
          CAREER_CATEGORY_INFO[ELEMENT_CAREERS[yongsin].categories[0]].label +
          '처럼 ' +
          yongsin +
          ' 기운을 활용하는 역할도 함께 비교해 보세요.',
        basis: ['용신 ' + yongsin, element + ' 기운의 업무 조건'],
      });
    });
  });

  return conditions.slice(0, 4);
}

/**
 * 경력 조언 생성
 */
function generateCareerAdvice(
  saju: SajuData,
  yongsin: WuXing,
  recommendations: CareerRecommendation['recommendations']
): CareerRecommendation['careerAdvice'] {
  const topRecommendation = recommendations[0];
  const skills = topRecommendation?.requiredSkills.slice(0, 2) ?? [];
  const skillLabel = skills.length > 0 ? skills.join('·') : yongsin + ' 관련 역량';

  return {
    explore: [
      (topRecommendation?.categoryLabel ?? yongsin + ' 관련 분야') + '의 실제 업무를 인터뷰·프로젝트·체험으로 비교해 보세요.',
      skillLabel + ' 같은 역량을 작게라도 직접 써 보는 경험을 만드세요.',
      '흥미뿐 아니라 업무 조건과 자격·경력 요건을 함께 확인하세요.',
    ],
    grow: [
      '반복해서 성과를 낸 역할을 골라 전문성과 포트폴리오를 쌓으세요.',
      '나에게 맞는 협업 방식과 책임 범위를 문서화해 다음 역할 선택에 활용하세요.',
      '직군의 핵심 역량을 보완할 교육·자격·멘토링을 계획하세요.',
    ],
    expand: [
      '쌓은 전문성을 프로젝트 리드·교육·자문처럼 더 넓은 역할로 연결해 보세요.',
      '직무 전환 시에는 공통 역량과 이전 성과를 먼저 정리하세요.',
      '환경 변화에 맞춰 도구와 지식을 갱신하는 루틴을 유지하세요.',
    ],
    entrepreneurship: isEntrepreneurshipSuitable(saju)
      ? '독립적으로 주도하는 일에도 강점이 있을 수 있습니다. 작은 검증과 수지 계획을 먼저 세워 보세요.'
      : '조직 안에서 전문성을 쌓는 경로도 잘 맞을 수 있습니다. 독립 프로젝트는 작은 범위에서 검증해 보세요.',
  };
}

/**
 * 직장 환경 분석 (십성 기반)
 */
function analyzeWorkEnvironment(
  _saju: SajuData,
  tenGodsAnalysis: TenGodsCareerAnalysis
): CareerRecommendation['workEnvironment'] {
  const traits = tenGodsAnalysis.averageTraits;

  // 회사 규모 선호도
  let preferredSize: '대기업' | '중견기업' | '중소기업' | '스타트업' | '자영업';
  if (traits.stability > 75) {
    preferredSize = '대기업';
  } else if (traits.independence > 75 && tenGodsAnalysis.entrepreneurship > 70) {
    preferredSize = '자영업';
  } else if (traits.innovation > 70 && traits.independence > 60) {
    preferredSize = '스타트업';
  } else if (traits.stability > 55) {
    preferredSize = '중견기업';
  } else {
    preferredSize = '중소기업';
  }

  // 업무 스타일은 십성 분석에서 가져옴
  const workStyle = tenGodsAnalysis.workStyle;

  // 리더십
  let leadership: '리더십 강함' | '리더십 보통' | '팔로워십 강함';
  if (traits.leadership > 70) {
    leadership = '리더십 강함';
  } else if (traits.leadership < 50) {
    leadership = '팔로워십 강함';
  } else {
    leadership = '리더십 보통';
  }

  // 안정성 vs 도전
  let stabilityPreference: '안정 추구형' | '도전 추구형' | '균형형';
  if (traits.stability > 70) {
    stabilityPreference = '안정 추구형';
  } else if (traits.innovation > 70 && traits.stability < 50) {
    stabilityPreference = '도전 추구형';
  } else {
    stabilityPreference = '균형형';
  }

  return {
    preferredSize,
    workStyle,
    leadership,
    stability: stabilityPreference,
  };
}

/**
 * 창업 적성 판단
 */
function isEntrepreneurshipSuitable(saju: SajuData): boolean {
  // 비견, 겁재, 편재가 강하면 창업 적성
  // 간단한 버전: 일간이 강하면 창업 적성으로 판단
  const dayStem = saju.day.stem;
  const yangStems: HeavenlyStem[] = ['갑', '병', '무', '경', '임'];
  return yangStems.includes(dayStem);
}

/**
 * 종합 평가 생성
 */
function generateSummary(
  recommendations: CareerRecommendation['recommendations'],
  workEnvironment: CareerRecommendation['workEnvironment']
): string {
  const topCategory = recommendations[0]?.categoryLabel || '다양한 분야';
  const preferredSize = workEnvironment.preferredSize;
  const workStyle = workEnvironment.workStyle;

  return (
    topCategory +
    '에서 쓰기 좋은 역할 자원이 두드러집니다. ' +
    preferredSize +
    '처럼 느껴지는 환경에서 ' +
    workStyle +
    ' 방식으로 일할 때 강점을 살펴볼 수 있습니다.'
  );
}

// ==================== 헬퍼 함수 ====================

/**
 * 오행 상생 관계 (A generates B)
 */
function generates(from: WuXing, to: WuXing): boolean {
  const cycle: Record<WuXing, WuXing> = {
    '목': '화',
    '화': '토',
    '토': '금',
    '금': '수',
    '수': '목',
  };
  return cycle[from] === to;
}

/**
 * 오행 상극 관계 (A controls B)
 */
function controls(from: WuXing, to: WuXing): boolean {
  const cycle: Record<WuXing, WuXing> = {
    '목': '토',
    '토': '수',
    '수': '화',
    '화': '금',
    '금': '목',
  };
  return cycle[from] === to;
}
