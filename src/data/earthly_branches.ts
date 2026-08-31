/**
 * 지지(地支) 데이터
 * 12개의 지지와 관련 정보
 */

import type {
  BranchRelationAnalysis,
  BranchRelationHit,
  BranchRelationKind,
  BranchRelationPillar,
  EarthlyBranch,
  HeavenlyStem,
  WuXing,
  YinYang,
} from '../types/index';
import { HEAVENLY_STEMS } from './heavenly_stems';
import { josa } from '../lib/korean';
import { JIJANGGAN_STRENGTH_DETAILED } from './jijanggan_strength_table';
import {
  BRANCH_RELATION_GUIDE,
  DIRECTIONAL_HARMONY_GROUPS,
  EARTHLY_BREAK_PAIRS,
  EARTHLY_CONFLICT_PAIRS,
  EARTHLY_HARM_PAIRS,
  EARTHLY_PUNISHMENT_GROUPS,
  SELF_PUNISHMENT_BRANCHES,
  SIX_HARMONY_PAIRS,
  TRIPLE_HARMONY_GROUPS,
} from '../lib/constants';

export interface EarthlyBranchData {
  korean: EarthlyBranch;
  hanja: string;
  element: WuXing;
  yinYang: YinYang;
  animal: string; // 띠
  month: number; // 해당 월 (1-12)
  direction: string; // 방향
  index: number;
}

export const EARTHLY_BRANCHES: EarthlyBranchData[] = [
  {
    korean: '자',
    hanja: '子',
    element: '수',
    yinYang: '양',
    animal: '쥐',
    month: 11,
    direction: '북',
    index: 0,
  },
  {
    korean: '축',
    hanja: '丑',
    element: '토',
    yinYang: '음',
    animal: '소',
    month: 12,
    direction: '북북동',
    index: 1,
  },
  {
    korean: '인',
    hanja: '寅',
    element: '목',
    yinYang: '양',
    animal: '호랑이',
    month: 1,
    direction: '동북동',
    index: 2,
  },
  {
    korean: '묘',
    hanja: '卯',
    element: '목',
    yinYang: '음',
    animal: '토끼',
    month: 2,
    direction: '동',
    index: 3,
  },
  {
    korean: '진',
    hanja: '辰',
    element: '토',
    yinYang: '양',
    animal: '용',
    month: 3,
    direction: '동남동',
    index: 4,
  },
  {
    korean: '사',
    hanja: '巳',
    element: '화',
    yinYang: '음',
    animal: '뱀',
    month: 4,
    direction: '남남동',
    index: 5,
  },
  {
    korean: '오',
    hanja: '午',
    element: '화',
    yinYang: '양',
    animal: '말',
    month: 5,
    direction: '남',
    index: 6,
  },
  {
    korean: '미',
    hanja: '未',
    element: '토',
    yinYang: '음',
    animal: '양',
    month: 6,
    direction: '남남서',
    index: 7,
  },
  {
    korean: '신',
    hanja: '申',
    element: '금',
    yinYang: '양',
    animal: '원숭이',
    month: 7,
    direction: '서남서',
    index: 8,
  },
  {
    korean: '유',
    hanja: '酉',
    element: '금',
    yinYang: '음',
    animal: '닭',
    month: 8,
    direction: '서',
    index: 9,
  },
  {
    korean: '술',
    hanja: '戌',
    element: '토',
    yinYang: '양',
    animal: '개',
    month: 9,
    direction: '서북서',
    index: 10,
  },
  {
    korean: '해',
    hanja: '亥',
    element: '수',
    yinYang: '음',
    animal: '돼지',
    month: 10,
    direction: '북북서',
    index: 11,
  },
];

/**
 * 지지 인덱스로 지지 데이터 가져오기
 */
export function getEarthlyBranchByIndex(index: number): EarthlyBranchData {
  const normalizedIndex = ((index % 12) + 12) % 12;
  return EARTHLY_BRANCHES[normalizedIndex]!;
}

/**
 * 지지 한글명으로 지지 데이터 가져오기
 */
export function getEarthlyBranchByKorean(
  korean: EarthlyBranch
): EarthlyBranchData | undefined {
  return EARTHLY_BRANCHES.find((branch) => branch.korean === korean);
}

/**
 * 지지 한자로 지지 데이터 가져오기
 */
export function getEarthlyBranchByHanja(hanja: string): EarthlyBranchData | undefined {
  return EARTHLY_BRANCHES.find((branch) => branch.hanja === hanja);
}

/**
 * 연도로 띠(지지) 계산하기
 */
export function getAnimalSignByYear(year: number): EarthlyBranchData {
  // 1900년은 자(쥐)년 기준
  const baseYear = 1900;
  const index = (year - baseYear) % 12;
  return getEarthlyBranchByIndex(index);
}

/**
 * 지지 관계의 판정표는 lib/constants.ts가 단일 원본이다.
 * 아래 세 export는 기존 데이터 모듈의 호환용 조회 표다.
 */
export const SAM_HAP: Record<
  string,
  { branches: EarthlyBranch[]; element: WuXing; name: string }
> = Object.fromEntries(
  Object.entries(TRIPLE_HARMONY_GROUPS).map(([type, data]) => [
    type,
    { branches: [...data.branches], element: data.element, name: data.label },
  ]),
);

/**
 * 삼합 체크 함수
 */
export function checkSamHap(branches: EarthlyBranch[]): { type: string | null; element: WuXing | null } {
  const branchSet = new Set(branches);

  for (const [type, data] of Object.entries(SAM_HAP)) {
    const hasAll = data.branches.every((b) => branchSet.has(b));
    if (hasAll) {
      return { type, element: data.element };
    }

    // 부분 삼합 (2개만 있어도 약한 영향)
    const count = data.branches.filter((b) => branchSet.has(b)).length;
    if (count >= 2) {
      return { type: `반${type}`, element: data.element };
    }
  }

  return { type: null, element: null };
}

/**
 * 삼형(三刑) - 3개 지지의 형벌 관계
 */
export const SAM_HYEONG: Record<string, EarthlyBranch[]> = {
  무은지형: ['인', '사', '신'], // 恩義之刑
  지세지형: ['축', '술', '미'], // 持勢之刑
  무례지형_1: ['자', '묘'], // 無禮之刑
  자형: ['진', '진'], // 自刑 (같은 지지끼리)
  자형_2: ['오', '오'],
  자형_3: ['유', '유'],
  자형_4: ['해', '해'],
};

/**
 * 삼형 체크 함수
 */
export function checkSamHyeong(branches: EarthlyBranch[]): string[] {
  const branchSet = new Set(branches);
  const hyeongList: string[] = [];

  // 무은지형 체크
  if (branchSet.has('인') && branchSet.has('사') && branchSet.has('신')) {
    hyeongList.push('무은지형(인사신)');
  }

  // 지세지형 체크
  if (branchSet.has('축') && branchSet.has('술') && branchSet.has('미')) {
    hyeongList.push('지세지형(축술미)');
  }

  // 무례지형 체크
  if (branchSet.has('자') && branchSet.has('묘')) {
    hyeongList.push('무례지형(자묘)');
  }

  // 자형 체크 (같은 지지가 2개 이상)
  const branchCounts: Record<string, number> = {};
  branches.forEach((b) => {
    branchCounts[b] = (branchCounts[b] || 0) + 1;
  });

  ['진', '오', '유', '해'].forEach((b) => {
    if (branchCounts[b] && branchCounts[b] >= 2) {
      hyeongList.push(`자형(${b}${b})`);
    }
  });

  return hyeongList;
}

/**
 * 육해(六害) - 6쌍의 해를 끼치는 관계
 */
export const YUK_HAE: [EarthlyBranch, EarthlyBranch][] = EARTHLY_HARM_PAIRS.map(
  ([first, second]) => [first, second],
);

/**
 * 육해 체크 함수
 */
export function checkYukHae(branches: EarthlyBranch[]): [EarthlyBranch, EarthlyBranch][] {
  const branchSet = new Set(branches);
  const haeList: [EarthlyBranch, EarthlyBranch][] = [];

  YUK_HAE.forEach(([b1, b2]) => {
    if (branchSet.has(b1) && branchSet.has(b2)) {
      haeList.push([b1, b2]);
    }
  });

  return haeList;
}

/** 명식에 표시되는 지지와 그 자리. 시간 미상 명식은 시지를 넣지 않는다. */
export interface BranchRelationInput {
  pillar: BranchRelationPillar;
  branch: EarthlyBranch;
}

const RELATION_ORDER: BranchRelationKind[] = ['삼합', '방합', '육합', '충', '형', '파', '해'];

function guideFor(kind: BranchRelationKind) {
  return BRANCH_RELATION_GUIDE.find((guide) => guide.kind === kind)!;
}

function matchingEntries(
  entries: BranchRelationInput[],
  branches: readonly EarthlyBranch[],
): BranchRelationInput[] {
  return entries.filter((entry) => branches.includes(entry.branch));
}

function createHit(
  kind: BranchRelationKind,
  label: string,
  branches: EarthlyBranch[],
  entries: BranchRelationInput[],
  options: Pick<BranchRelationHit, 'element' | 'state' | 'missingBranches'> = {},
): BranchRelationHit {
  const guide = guideFor(kind);
  const elementFeature = options.element
    ? guide.elementFeatures?.[options.element]
    : undefined;
  return {
    kind,
    hanja: guide.hanja,
    label,
    branches,
    pillars: entries.map((entry) => entry.pillar),
    description: guide.description,
    feature: options.state === 'partial'
      ? guide.partialFeature ?? guide.feature
      : elementFeature?.feature ?? guide.feature,
    lifeTendencies: [
      ...guide.lifeTendencies,
      ...(elementFeature?.lifeTendencies ?? []),
    ],
    readingNote: guide.readingNote,
    ...options,
  };
}

/**
 * 지지 관계 종합 분석.
 *
 * 이 함수는 명식에 실제로 보이는 지지의 조합과 자리를 반환한다. 합·충 등의 세력
 * 가감은 학파별 차이가 크므로 day_master_strength나 용신 계산에는 반영하지 않는다.
 */
export function analyzeBranchRelations(
  inputs: BranchRelationInput[],
): BranchRelationAnalysis {
  const visible = new Set(inputs.map((input) => input.branch));
  const hits: BranchRelationHit[] = [];

  for (const data of Object.values(TRIPLE_HARMONY_GROUPS)) {
    const present = data.branches.filter((branch) => visible.has(branch));
    if (present.length === data.branches.length) {
      hits.push(createHit(
        '삼합', data.label, [...data.branches], matchingEntries(inputs, data.branches),
        { element: data.element, state: 'complete' },
      ));
    } else if (present.length === 2) {
      const missingBranches = data.branches.filter((branch) => !visible.has(branch));
      hits.push(createHit(
        '삼합', `${present.join('')} 반합 (${data.element})`, [...present], matchingEntries(inputs, present),
        { element: data.element, state: 'partial', missingBranches: [...missingBranches] },
      ));
    }
  }

  for (const data of Object.values(DIRECTIONAL_HARMONY_GROUPS)) {
    if (data.branches.every((branch) => visible.has(branch))) {
      hits.push(createHit(
        '방합', data.label, [...data.branches], matchingEntries(inputs, data.branches),
        { element: data.element },
      ));
    }
  }

  const pairRelations: Array<{
    kind: Extract<BranchRelationKind, '육합' | '충' | '파' | '해'>;
    pairs: readonly (readonly [EarthlyBranch, EarthlyBranch])[];
  }> = [
    { kind: '육합', pairs: SIX_HARMONY_PAIRS },
    { kind: '충', pairs: EARTHLY_CONFLICT_PAIRS },
    { kind: '파', pairs: EARTHLY_BREAK_PAIRS },
    { kind: '해', pairs: EARTHLY_HARM_PAIRS },
  ];
  for (const relation of pairRelations) {
    for (const pair of relation.pairs) {
      if (pair.every((branch) => visible.has(branch))) {
        hits.push(createHit(
          relation.kind, `${pair.join('')} ${relation.kind}`, [...pair], matchingEntries(inputs, pair),
        ));
      }
    }
  }

  for (const punishment of EARTHLY_PUNISHMENT_GROUPS) {
    if (punishment.branches.every((branch) => visible.has(branch))) {
      hits.push(createHit(
        '형', `${punishment.label}(${punishment.branches.join('')})`, [...punishment.branches],
        matchingEntries(inputs, punishment.branches),
      ));
    }
  }
  for (const branch of SELF_PUNISHMENT_BRANCHES) {
    const matched = inputs.filter((input) => input.branch === branch);
    if (matched.length >= 2) {
      hits.push(createHit('형', `자형(${branch}${branch})`, [branch, branch], matched));
    }
  }

  hits.sort((left, right) => {
    const kindOrder = RELATION_ORDER.indexOf(left.kind) - RELATION_ORDER.indexOf(right.kind);
    if (kindOrder !== 0) return kindOrder;
    if (left.state !== right.state) return left.state === 'complete' ? -1 : 1;
    return left.label.localeCompare(right.label, 'ko');
  });

  return {
    hits,
    summary: hits.length > 0
      ? `명식에서 ${hits.length}개의 지지 관계가 확인됩니다. 각 관계는 글자의 배치 정보이며, 하나만으로 길흉이나 강약을 확정하지 않습니다.`
      : '표시된 지지 사이에서 삼합·방합·육합·충·형·파·해의 성립 조합은 확인되지 않습니다.',
  };
}

/**
 * data/jijanggan_strength_table.ts의 세력 분배 테이블(JIJANGGAN_STRENGTH_DETAILED,
 * [여기?, 중기?, 정기] 순서)에서 JI_JANG_GAN 한 지지분을 파생한다.
 */
function deriveJiJangGan(branch: EarthlyBranch): {
  primary: HeavenlyStem;
  secondary?: HeavenlyStem;
  residual?: HeavenlyStem;
} {
  const phases = JIJANGGAN_STRENGTH_DETAILED[branch];
  const lastIndex = phases.length - 1;
  return {
    primary: phases[lastIndex]!.stem, // 정기(正氣) - 마지막 phase
    secondary: phases.length === 3 ? phases[1]!.stem : undefined, // 중기(中氣) - 3단계일 때만
    residual: phases[0]!.stem, // 여기(餘氣) - 첫 phase
  };
}

/**
 * 지장간(支藏干) - 각 지지 안에 숨어있는 천간들
 *
 * 예전엔 이 테이블과 별개로 손으로 채운 상수였는데, 사(巳)는 중기/여기가 뒤바뀌어
 * 있었고(정확히는 여기 戊·중기 庚인데 secondary: 무/residual: 경으로 반대였다)
 * 자/묘/유의 여기(壬/甲/庚)가 통째로 빠져 있었다. data/jijanggan_strength_table.ts를
 * 단일 출처로 삼아 파생시켜 그 불일치를 없앤다.
 */
export const JI_JANG_GAN: Record<
  EarthlyBranch,
  {
    primary: HeavenlyStem; // 정기(正氣)
    secondary?: HeavenlyStem; // 중기(中氣)
    residual?: HeavenlyStem; // 여기(餘氣)
  }
> = {
  자: deriveJiJangGan('자'),
  축: deriveJiJangGan('축'),
  인: deriveJiJangGan('인'),
  묘: deriveJiJangGan('묘'),
  진: deriveJiJangGan('진'),
  사: deriveJiJangGan('사'),
  오: deriveJiJangGan('오'),
  미: deriveJiJangGan('미'),
  신: deriveJiJangGan('신'),
  유: deriveJiJangGan('유'),
  술: deriveJiJangGan('술'),
  해: deriveJiJangGan('해'),
};

/**
 * 지장간 추출 - 지지에서 숨은 천간들을 모두 반환
 */
export function extractJiJangGan(branch: EarthlyBranch): HeavenlyStem[] {
  const jiJang = JI_JANG_GAN[branch];
  const stems: HeavenlyStem[] = [jiJang.primary];
  if (jiJang.secondary) stems.push(jiJang.secondary);
  if (jiJang.residual) stems.push(jiJang.residual);
  return stems;
}

/**
 * 월령 득실 판단
 * 일간이 월지의 지장간으로부터 생을 받거나 같으면 득령(得令)
 * 극을 받으면 실령(失令)
 */
export function checkWolRyeong(
  dayStem: HeavenlyStem,
  monthBranch: EarthlyBranch
): {
  isDeukRyeong: boolean; // 득령 여부
  reason: string;
  strength: 'strong' | 'medium' | 'weak';
} {
  const jiJangStems = extractJiJangGan(monthBranch);
  const dayStemData = HEAVENLY_STEMS.find((s) => s.korean === dayStem);
  if (!dayStemData) {
    return { isDeukRyeong: false, reason: '일간 정보 없음', strength: 'medium' };
  }

  const dayStemElement = dayStemData.element;

  // 정기(primary) 천간의 오행 확인
  const primaryStemData = HEAVENLY_STEMS.find((s) => s.korean === jiJangStems[0]);
  if (!primaryStemData) {
    return { isDeukRyeong: false, reason: '지장간 정보 없음', strength: 'medium' };
  }

  const primaryElement = primaryStemData.element;

  // 일간과 월지 지장간 정기의 관계
  if (dayStemElement === primaryElement) {
    return {
      isDeukRyeong: true,
      reason: `월지 지장간과 일간이 같은 ${dayStemElement} 오행이므로 득령입니다`,
      strength: 'strong',
    };
  }

  // 상생 관계 체크 (월지가 일간을 생)
  const generationMap: Record<WuXing, WuXing> = {
    목: '화',
    화: '토',
    토: '금',
    금: '수',
    수: '목',
  };

  if (generationMap[primaryElement] === dayStemElement) {
    return {
      isDeukRyeong: true,
      reason: `월지 ${josa(primaryElement, "이/가")} 일간 ${josa(dayStemElement, "을/를")} 생하므로 득령입니다`,
      strength: 'medium',
    };
  }

  // 상극 관계 체크 (월지가 일간을 극)
  const destructionMap: Record<WuXing, WuXing> = {
    목: '토',
    화: '금',
    토: '수',
    금: '목',
    수: '화',
  };

  if (destructionMap[primaryElement] === dayStemElement) {
    return {
      isDeukRyeong: false,
      reason: `월지 ${josa(primaryElement, "이/가")} 일간 ${josa(dayStemElement, "을/를")} 극하므로 실령입니다`,
      strength: 'weak',
    };
  }

  return {
    isDeukRyeong: false,
    reason: '월지와 일간의 관계가 중립적입니다',
    strength: 'medium',
  };
}
