import { describe, expect, it } from 'vitest';
import { calculateSaju } from './saju';
import { recommendCareer, ELEMENT_CAREERS } from './career_recommendation';
import { calculateElementDistribution } from './element_distribution';
import {
  CAREER_CATEGORY_INFO,
  MODERN_CAREERS_DB,
} from '../data/modern_careers';
import type { WuXing } from '../types/index';

describe('추천 직업의 specificJobs는 카테고리마다 달라야 한다 — 같은 오행의 카테고리가 모두 동일한 3개 직업을 반환하던 회귀', () => {
  // 예전 generateRecommendations()는 `elementData.jobs.filter((_job) => elementData.categories.includes(category))`로
  // specificJobs를 골랐는데, 이 조건이 category에만 의존하고 job 자체는 보지 않아 사실상 상수(true/false)였다.
  // 그 결과 같은 오행에서 파생된 여러 카테고리(예: 목 → 교육/연구, 예술/문화, 의료/보건, 농업/환경)가
  // 전부 jobs 배열의 앞 3개(예: "교사, 교수, 연구원")를 그대로 반환했다.
  const saju = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');
  const { recommendations } = recommendCareer(saju);

  it('같은 오행에서 나온 서로 다른 카테고리 추천은 서로 다른 specificJobs를 가진다', () => {
    const byCategory = new Map(recommendations.map((r) => [r.category, r.specificJobs.join(',')]));
    const distinctJobLists = new Set(byCategory.values());
    // 카테고리 수보다 고유 직업 목록 수가 현저히 적다면(예: 전부 동일) 회귀가 재발한 것
    expect(distinctJobLists.size).toBeGreaterThan(1);
  });

  it('각 추천은 specificJobs를 3개 이하로, 비어있지 않게 가진다', () => {
    recommendations.forEach((r) => {
      expect(r.specificJobs.length).toBeGreaterThan(0);
      expect(r.specificJobs.length).toBeLessThanOrEqual(3);
    });
  });
});

describe('오행별 직업 적성 — 발달 오행(strengthScore)이 용신(yongsinScore)과 별개로 계산되고, 발달할수록 감점이 아니라 가점된다', () => {
  // 1992-05-05 17:50 양력 남성: 금(비겁)이 오행과 십성 카드에서도 "발달"로 뜨는 명식
  // (element_distribution.ts와 동일 소스를 쓰므로 pct가 정확히 일치해야 한다).
  // 예전 구현(getElementStrength, 천간 4개만 셈)은 강한 오행에 -10을 줘서 발달할수록
  // 오히려 감점됐다 — 이 테스트는 그 방향이 뒤집혔는지 확인하는 회귀 테스트다.
  const saju = calculateSaju('1992-05-05', '17:50', 'solar', false, 'male', '서울');
  const { elementalAffinity } = recommendCareer(saju);
  const dist = calculateElementDistribution(saju);

  it('strengthScore는 element_distribution.ts의 pct와 같은 방향으로 움직인다(발달 오행이 가장 높다)', () => {
    const maxPctElement = (Object.keys(dist.pct) as WuXing[]).reduce((a, b) =>
      dist.pct[a]! >= dist.pct[b]! ? a : b,
    );
    const scoresByElement = new Map(elementalAffinity.map((e) => [e.element, e.strengthScore]));
    const maxStrengthScore = Math.max(...elementalAffinity.map((e) => e.strengthScore));
    expect(scoresByElement.get(maxPctElement)).toBe(maxStrengthScore);
  });

  it('developedStatus가 "발달"인 오행의 strengthScore가 "부족"인 오행보다 높다', () => {
    const developed = elementalAffinity.filter((e) => e.developedStatus === '발달');
    const lacking = elementalAffinity.filter((e) => e.developedStatus === '부족');
    expect(developed.length).toBeGreaterThan(0);
    expect(lacking.length).toBeGreaterThan(0);
    const minDeveloped = Math.min(...developed.map((e) => e.strengthScore));
    const maxLacking = Math.max(...lacking.map((e) => e.strengthScore));
    expect(minDeveloped).toBeGreaterThan(maxLacking);
  });

  it('affinity는 strengthScore와 yongsinScore의 평균(반올림)이다', () => {
    elementalAffinity.forEach((e) => {
      expect(e.affinity).toBe(Math.round((e.strengthScore + e.yongsinScore) / 2));
    });
  });

  it('developedStatus는 element_distribution.ts#getElementStatusMap과 같은 값을 낸다 (단일 소스 검증)', () => {
    elementalAffinity.forEach((e) => {
      // pct가 평균(20%)의 1.5배를 넘으면 발달, 0.5배 미만이면 부족 — wuxing.ts#analyzeWuXingBalance 기준
      const pct = dist.pct[e.element]!;
      if (e.developedStatus === '발달') expect(pct).toBeGreaterThan(30);
      if (e.developedStatus === '부족') expect(pct).toBeLessThan(10);
    });
  });
});

describe('ELEMENT_CAREERS — 카테고리마다 실제로 그 카테고리에 맞는 직업만 매핑돼 있다 (chunk 방식이 어긋나던 회귀)', () => {
  // 예전에는 오행마다 jobs 평평한 배열 하나를 categories.length로 기계적으로 4등분해서
  // 카테고리에 배정했다 — 화 오행의 "예술/문화" 슬롯에 "프로그래머"가, "IT/기술" 슬롯에
  // "영업사원·강사·MC"가 배정되는 등 5개 오행 전부에서 어긋나 있었다. jobsByCategory로
  // 카테고리를 키 삼아 명시적으로 매핑하면서 이런 어긋남을 구조적으로 없앴다.

  it('화(火)의 "예술/문화"에는 프로그래머가 없고, "IT/기술"에는 영업사원·강사·MC가 없다', () => {
    expect(ELEMENT_CAREERS.화.jobsByCategory['예술/문화']).not.toContain('프로그래머');
    expect(ELEMENT_CAREERS.화.jobsByCategory['IT/기술']).not.toContain('영업사원');
    expect(ELEMENT_CAREERS.화.jobsByCategory['IT/기술']).not.toContain('강사');
    expect(ELEMENT_CAREERS.화.jobsByCategory['IT/기술']).not.toContain('MC');
  });

  it('목(木)의 "의료/보건"에는 조경사·농부가 없다', () => {
    expect(ELEMENT_CAREERS.목.jobsByCategory['의료/보건']).not.toContain('조경사');
    expect(ELEMENT_CAREERS.목.jobsByCategory['의료/보건']).not.toContain('농부');
  });

  it('금(金)의 "금융/재무"에는 변호사·검사·판사가 없다(법률/행정 소속이어야 한다)', () => {
    expect(ELEMENT_CAREERS.금.jobsByCategory['금융/재무']).not.toContain('변호사');
    expect(ELEMENT_CAREERS.금.jobsByCategory['금융/재무']).not.toContain('검사');
    expect(ELEMENT_CAREERS.금.jobsByCategory['금융/재무']).not.toContain('판사');
  });

  it('수(水)의 "IT/기술"에는 의사·간호사가 없다(의료/보건 소속이어야 한다)', () => {
    expect(ELEMENT_CAREERS.수.jobsByCategory['IT/기술']).not.toContain('의사');
    expect(ELEMENT_CAREERS.수.jobsByCategory['IT/기술']).not.toContain('간호사');
  });

  it('토(土)의 "금융/재무"에는 농업 경영인·부동산 개발자가 없다', () => {
    expect(ELEMENT_CAREERS.토.jobsByCategory['금융/재무']).not.toContain('농업 경영인');
    expect(ELEMENT_CAREERS.토.jobsByCategory['금융/재무']).not.toContain('부동산 개발자');
  });

  it('5개 오행 전부, categories에 나열된 카테고리는 jobsByCategory에 최소 1개 이상의 직업이 있다', () => {
    (Object.keys(ELEMENT_CAREERS) as WuXing[]).forEach((element) => {
      const data = ELEMENT_CAREERS[element];
      data.categories.forEach((category) => {
        expect(data.jobsByCategory[category]?.length ?? 0).toBeGreaterThan(0);
      });
    });
  });
});

describe('직업 탭이 career_matcher.ts(modern_careers.ts)를 실제로 반영한다', () => {
  // 1992-05-05 17:50 양력 남성은 화(火) 기운이 발달한 명식이고, 화의 ELEMENT_CAREERS는
  // 'IT/기술' 카테고리를 갖는다. 현대 직업 카탈로그도 같은 단일 직군 키를 쓰므로,
  // career_matcher.ts#CareerMatcher가 실제 IT 직업을 specificJobs에 끼워넣어야 한다.
  // 이 테스트는 매칭 엔진이 죽은 코드로 남아 있지 않은지를 검증한다.
  const saju = calculateSaju('1992-05-05', '17:50', 'solar', false, 'male', '서울');
  const { recommendations } = recommendCareer(saju);
  const itModernJobNames = new Set(
    MODERN_CAREERS_DB.filter((career) => career.category === 'IT/기술').map(
      (career) => career.name,
    ),
  );

  it('IT/기술 카테고리 추천이 존재하고, 그 specificJobs 중 하나 이상이 modern_careers.ts의 실제 직업이다', () => {
    const itRecommendation = recommendations.find((r) => r.category === 'IT/기술');
    expect(itRecommendation).toBeDefined();
    const hasModernJob = itRecommendation!.specificJobs.some((job) => itModernJobNames.has(job));
    expect(hasModernJob).toBe(true);
  });
});

describe('현대 직업 카탈로그와 직업 추천은 전 직군을 역할·역량·업무 조건으로 연결한다', () => {
  const saju = calculateSaju('1992-05-05', '17:50', 'solar', false, 'male', '서울');
  const { recommendations, workConditionsToConsider } = recommendCareer(saju);

  it('현재 추천에 쓰는 14개 직군은 모두 대표 직무와 분류 설명을 가진다', () => {
    for (const category of Object.keys(CAREER_CATEGORY_INFO)) {
      const careers = MODERN_CAREERS_DB.filter((career) => career.category === category);
      expect(careers.length).toBeGreaterThanOrEqual(4);
      careers.forEach((career) => {
        expect(career.requiredSkills.length).toBeGreaterThan(0);
        expect(career.workConditions.length).toBeGreaterThan(0);
      });
    }
  });

  it('여러 오행이 같은 직군을 가리켜도 추천 카드가 중복되지 않고, 역할·근거·역량을 함께 준다', () => {
    expect(new Set(recommendations.map((recommendation) => recommendation.category)).size)
      .toBe(recommendations.length);
    recommendations.forEach((recommendation) => {
      expect(recommendation.categoryLabel).toBeTruthy();
      expect(recommendation.basis.length).toBeGreaterThan(0);
      expect(recommendation.requiredSkills.length).toBeGreaterThan(0);
      expect(recommendation.workConditions.length).toBeGreaterThan(0);
    });
  });

  it('용신 상극 직군을 직업 금지가 아닌 살펴볼 업무 조건으로 안내한다', () => {
    expect(workConditionsToConsider.length).toBeGreaterThan(0);
    workConditionsToConsider.forEach((condition) => {
      expect(condition.condition).toBeTruthy();
      expect(condition.reason).toContain('부담');
      expect(condition.alternativeSuggestion).toContain('비교');
    });
  });
});
