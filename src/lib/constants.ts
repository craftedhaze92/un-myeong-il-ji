/**
 * 사주 분석 공통 상수
 *
 * 여러 라이브러리에서 공통으로 사용되는 상수들을 정의
 */

import type {
  BranchRelationKind,
  EarthlyBranch,
  HeavenlyStem,
  WuXing,
} from '../types/index';

export const SIX_HARMONY_PAIRS = [
  ['자', '축'], ['인', '해'], ['묘', '술'], ['진', '유'], ['사', '신'], ['오', '미'],
] as const satisfies readonly (readonly [EarthlyBranch, EarthlyBranch])[];

export const EARTHLY_CONFLICT_PAIRS = [
  ['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해'],
] as const satisfies readonly (readonly [EarthlyBranch, EarthlyBranch])[];

/** 파(破)와 해(害)는 각각 여섯 쌍으로 본다. */
export const EARTHLY_BREAK_PAIRS = [
  ['자', '유'], ['축', '진'], ['인', '해'], ['묘', '오'], ['사', '신'], ['미', '술'],
] as const satisfies readonly (readonly [EarthlyBranch, EarthlyBranch])[];

export const EARTHLY_HARM_PAIRS = [
  ['자', '미'], ['축', '오'], ['인', '사'], ['묘', '진'], ['신', '해'], ['유', '술'],
] as const satisfies readonly (readonly [EarthlyBranch, EarthlyBranch])[];

function toBidirectionalMap(
  pairs: readonly (readonly [EarthlyBranch, EarthlyBranch])[],
): Record<EarthlyBranch, EarthlyBranch> {
  return Object.fromEntries(
    pairs.flatMap(([first, second]) => [[first, second], [second, first]]),
  ) as Record<EarthlyBranch, EarthlyBranch>;
}

/**
 * 육합 (六合) - 지지의 조화
 */
export const SIX_HARMONY: Record<EarthlyBranch, EarthlyBranch> = toBidirectionalMap(SIX_HARMONY_PAIRS);

/**
 * 지지 충 (地支沖) - 지지의 충돌
 */
export const EARTHLY_CONFLICTS: Record<EarthlyBranch, EarthlyBranch> = toBidirectionalMap(EARTHLY_CONFLICT_PAIRS);

/** 삼합 (三合) - 생·왕·묘의 세 지지가 이루는 국(局) */
export const TRIPLE_HARMONY_GROUPS = {
  수국: { branches: ['신', '자', '진'], element: '수', label: '신자진 수국' },
  목국: { branches: ['해', '묘', '미'], element: '목', label: '해묘미 목국' },
  화국: { branches: ['인', '오', '술'], element: '화', label: '인오술 화국' },
  금국: { branches: ['사', '유', '축'], element: '금', label: '사유축 금국' },
} as const satisfies Record<
  string,
  { branches: readonly EarthlyBranch[]; element: WuXing; label: string }
>;

/** 방합·삼회 (方合·三會) - 같은 계절 방위의 세 지지 */
export const DIRECTIONAL_HARMONY_GROUPS = {
  수국: { branches: ['해', '자', '축'], element: '수', label: '해자축 수국' },
  목국: { branches: ['인', '묘', '진'], element: '목', label: '인묘진 목국' },
  화국: { branches: ['사', '오', '미'], element: '화', label: '사오미 화국' },
  금국: { branches: ['신', '유', '술'], element: '금', label: '신유술 금국' },
} as const satisfies Record<
  string,
  { branches: readonly EarthlyBranch[]; element: WuXing; label: string }
>;

/** 형(刑): 인사신·축술미의 삼형, 자묘의 상형, 진오유해의 자형 */
export const EARTHLY_PUNISHMENT_GROUPS = [
  { label: '무은지형', branches: ['인', '사', '신'] },
  { label: '지세지형', branches: ['축', '술', '미'] },
  { label: '무례지형', branches: ['자', '묘'] },
] as const satisfies readonly { label: string; branches: readonly EarthlyBranch[] }[];

export const SELF_PUNISHMENT_BRANCHES = ['진', '오', '유', '해'] as const satisfies readonly EarthlyBranch[];

/**
 * @deprecated 이 값은 방합(삼회) 표다. 올바른 이름인 DIRECTIONAL_HARMONY_GROUPS를 사용한다.
 * 기존 호출자의 런타임 호환성을 위해서만 유지한다.
 */
export const TRIPLE_HARMONY: Record<string, EarthlyBranch[]> = Object.fromEntries(
  Object.entries(DIRECTIONAL_HARMONY_GROUPS).map(([type, data]) => [
    type,
    [...data.branches],
  ]),
);

/**
 * 명식 탭의 지지 관계 참고표 및 관계 카드가 공유하는 단일 설명 원본.
 * 관계는 배치 구조를 읽기 위한 정보이며, 길흉·강약을 독립적으로 확정하지 않는다.
 */
export const BRANCH_RELATION_GUIDE: readonly {
  kind: BranchRelationKind;
  hanja: string;
  title: string;
  description: string;
  feature: string;
  partialFeature?: string;
  lifeTendencies: readonly string[];
  elementFeatures?: Partial<Record<WuXing, {
    feature: string;
    lifeTendencies: readonly string[];
  }>>;
  readingNote: string;
  groups: readonly string[];
}[] = [
  {
    kind: '삼합', hanja: '三合', title: '세 지지가 이루는 국',
    description: '생·왕·묘의 세 지지가 모여 하나의 오행 국으로 분류되는 관계입니다.',
    feature: '세 글자가 이어져 같은 오행의 흐름을 한 축으로 모으는 형태입니다. 관심·자원·활동이 서로 연결되는지 살펴봅니다.',
    partialFeature: '세 글자 가운데 두 글자가 먼저 이어진 부분 삼합입니다. 같은 방향의 연결은 보이지만, 완성된 삼합과 같은 하나의 국으로 단정하지 않습니다.',
    lifeTendencies: [
      '함께하는 사람이나 과제가 한 방향으로 모일 때, 역할 분담과 지속성을 살펴볼 수 있습니다.',
      '한 가지 관심이나 방식에 자원이 집중될 수 있으므로, 다른 선택지와의 균형도 함께 점검합니다.',
    ],
    elementFeatures: {
      목: {
        feature: '목국의 흐름은 성장·연결·확장이라는 주제를 함께 드러냅니다.',
        lifeTendencies: ['배움·기획·관계 확장처럼 시간을 들여 키우는 일에서 일관된 방향을 만들 수 있습니다.'],
      },
      화: {
        feature: '화국의 흐름은 표현·가시성·실행이라는 주제를 함께 드러냅니다.',
        lifeTendencies: ['표현하거나 일을 추진할 때 속도와 열의를 조절해, 시작한 일을 마무리하는 방식을 살펴볼 수 있습니다.'],
      },
      금: {
        feature: '금국의 흐름은 기준·결정·정리라는 주제를 함께 드러냅니다.',
        lifeTendencies: ['기준을 세우고 결과를 정리하는 과정에서, 너무 엄격한 판단으로 흐르지 않는지 살펴볼 수 있습니다.'],
      },
      수: {
        feature: '수국의 흐름은 정보·관찰·소통이라는 주제를 함께 드러냅니다.',
        lifeTendencies: ['정보를 모으고 연결하는 능력이 쓰일 수 있으므로, 생각을 행동으로 옮기는 리듬도 함께 점검합니다.'],
      },
    },
    readingNote: '두 글자만 보이면 부분 삼합으로 표시하며, 완성된 삼합과 구분합니다.',
    groups: ['신·자·진 → 수국', '해·묘·미 → 목국', '인·오·술 → 화국', '사·유·축 → 금국'],
  },
  {
    kind: '방합', hanja: '方合·三會', title: '같은 계절 방위의 결합',
    description: '같은 계절과 방위에 놓인 세 지지가 함께 보이는 관계입니다.',
    feature: '같은 계절·방위의 세 글자가 모여 주변 환경과 일상의 리듬이 한쪽으로 집중되는 형태입니다.',
    lifeTendencies: [
      '익숙한 환경이나 같은 방식의 사람·일에 힘이 모일 수 있어, 지속할 기준을 세우는 데 참고할 수 있습니다.',
      '한 방향이 강해질수록 다른 방식의 의견이나 휴식이 충분히 들어오는지도 함께 살펴봅니다.',
    ],
    elementFeatures: {
      목: { feature: '목국 방합은 성장·관계 확장의 계절 흐름이 한데 모인 모습입니다.', lifeTendencies: ['새로운 시도는 장기 계획과 연결해 키워 가는 방식이 어울릴 수 있습니다.'] },
      화: { feature: '화국 방합은 활동·표현의 계절 흐름이 한데 모인 모습입니다.', lifeTendencies: ['대외 활동이 많아질 때에는 에너지 배분과 회복 시간을 함께 관리해 볼 수 있습니다.'] },
      금: { feature: '금국 방합은 정리·선별의 계절 흐름이 한데 모인 모습입니다.', lifeTendencies: ['결정과 마무리 과정에서 기준을 공유하면 협업의 마찰을 줄이는 데 도움이 될 수 있습니다.'] },
      수: { feature: '수국 방합은 관찰·축적의 계절 흐름이 한데 모인 모습입니다.', lifeTendencies: ['준비와 정보 축적이 길어질 때에는 실행 시점을 정해 보는 것이 도움이 될 수 있습니다.'] },
    },
    readingNote: '삼합과 다른 체계이므로 같은 “국” 표기라도 별도로 확인합니다.',
    groups: ['해·자·축 → 수국', '인·묘·진 → 목국', '사·오·미 → 화국', '신·유·술 → 금국'],
  },
  {
    kind: '육합', hanja: '六合', title: '두 지지의 짝',
    description: '서로 짝을 이루는 여섯 지지 조합입니다.',
    feature: '서로 다른 두 글자가 연결되어 조율·협력·고정이라는 주제를 함께 보이는 형태입니다.',
    lifeTendencies: [
      '관계나 협업에서 서로의 역할을 맞추고 오래 이어 가는 방식을 살펴볼 수 있습니다.',
      '합의가 익숙함이나 의존으로 굳지 않도록, 각자의 선택권과 경계도 함께 확인합니다.',
    ],
    readingNote: '명식에 함께 보이는 두 글자의 배치 관계를 표시합니다.',
    groups: ['자·축', '인·해', '묘·술', '진·유', '사·신', '오·미'],
  },
  {
    kind: '충', hanja: '沖', title: '마주보는 두 지지',
    description: '12지 원형에서 서로 마주보는 여섯 쌍의 관계입니다.',
    feature: '서로 마주보는 두 축이 함께 놓여, 서로 다른 요구·속도·방향을 조정하는 구조입니다.',
    lifeTendencies: [
      '역할이나 생활 리듬이 달라질 때, 변화 자체보다 무엇을 조정해야 하는지 구체적으로 살펴볼 수 있습니다.',
      '대인 관계와 일에서 선택지가 갈릴 때에는 우선순위와 일정의 재배치가 도움이 될 수 있습니다.',
    ],
    readingNote: '변화나 길흉을 단정하지 않고, 함께 놓인 축을 확인하는 정보로 봅니다.',
    groups: ['자·오', '축·미', '인·신', '묘·유', '진·술', '사·해'],
  },
  {
    kind: '형', hanja: '刑', title: '교차·반복의 관계',
    description: '세 지지의 교차, 자묘의 짝, 또는 같은 지지의 반복으로 분류합니다.',
    feature: '교차하거나 반복되는 글자가 있어, 기준·압박·반복 패턴을 세밀하게 살펴보는 구조입니다.',
    lifeTendencies: [
      '같은 갈등이나 부담이 되풀이된다고 느낄 때, 규칙·기대·경계가 분명한지 점검해 볼 수 있습니다.',
      '자기 기준이 높아지는 상황에서는 완성도뿐 아니라 회복과 유연성도 함께 챙기는 편이 좋습니다.',
    ],
    readingNote: '형의 세부 해석은 학파에 따라 다르므로 성립한 글자와 자리만 우선 제시합니다.',
    groups: ['인·사·신', '축·술·미', '자·묘', '진·진 · 오·오 · 유·유 · 해·해'],
  },
  {
    kind: '파', hanja: '破', title: '엇갈리는 두 지지',
    description: '서로 다른 방식으로 맞물리는 여섯 쌍의 관계입니다.',
    feature: '기존의 연결이나 계획이 느슨해지고, 세부 조율이 필요해지는 지점을 살펴보는 구조입니다.',
    lifeTendencies: [
      '약속·일정·역할 분담은 큰 방향보다 세부 조건을 다시 확인해 보는 것이 도움이 될 수 있습니다.',
      '변경이 생겼을 때에는 빠른 결론보다 현재 방식이 여전히 맞는지 재정비하는 과정을 살펴봅니다.',
    ],
    readingNote: '다른 관계와 겹칠 수 있으므로 한 관계만으로 의미를 확정하지 않습니다.',
    groups: ['자·유', '축·진', '인·해', '묘·오', '사·신', '미·술'],
  },
  {
    kind: '해', hanja: '害', title: '서로 끼는 두 지지',
    description: '여섯 쌍으로 정리하는 지지의 배치 관계입니다.',
    feature: '겉으로 드러나지 않는 기대 차이와 역할 부담이 쌓일 수 있는 지점을 살펴보는 구조입니다.',
    lifeTendencies: [
      '관계나 협업에서 말하지 않은 기대가 남지 않도록, 역할과 요청을 구체적으로 확인해 볼 수 있습니다.',
      '불편함이 생길 때에는 상대의 의도를 단정하기보다 필요한 지원과 경계를 먼저 언어로 정리합니다.',
    ],
    readingNote: '관계의 성립 자체와 실제 해석의 비중은 구분해 읽습니다.',
    groups: ['자·미', '축·오', '인·사', '묘·진', '신·해', '유·술'],
  },
];

/**
 * 천간합 (天干合) - 천간의 조화
 */
export const HEAVENLY_HARMONY: Record<HeavenlyStem, HeavenlyStem> = {
  '갑': '기', '을': '경', '병': '신', '정': '임', '무': '계',
  '기': '갑', '경': '을', '신': '병', '임': '정', '계': '무',
} as const;

/**
 * 십이신살 (十二神煞) 이름
 */
export const TWELVE_GODS = [
  '건', '제', '만', '평', '정', '집', '파', '위', '성', '수', '개', '폐'
] as const;

/**
 * 십이신살 설명
 */
export const TWELVE_GODS_INFO: Record<string, { desc: string; lucky: boolean }> = {
  '건': { desc: '만사 시작에 길하나 이사는 불길', lucky: true },
  '제': { desc: '액막이, 청소, 치료에 길함', lucky: true },
  '만': { desc: '모든 일이 가득 차니 새 일은 불길', lucky: false },
  '평': { desc: '평온하여 일상적 일은 무난', lucky: true },
  '정': { desc: '정착, 계약, 혼인에 길함', lucky: true },
  '집': { desc: '집착하니 소송, 싸움 조심', lucky: false },
  '파': { desc: '파괴의 날, 모든 일 불길', lucky: false },
  '위': { desc: '위험한 날, 조심해야 함', lucky: false },
  '성': { desc: '성취, 개업, 취업에 길함', lucky: true },
  '수': { desc: '수확, 거래, 매매에 길함', lucky: true },
  '개': { desc: '개통, 개업, 시작에 대길', lucky: true },
  '폐': { desc: '폐쇄, 마무리에는 좋으나 시작은 불길', lucky: false },
} as const;

/**
 * 지지 배열
 */
export const EARTHLY_BRANCHES: readonly EarthlyBranch[] = [
  '자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'
] as const;

/**
 * 천간 배열
 */
export const HEAVENLY_STEMS: readonly HeavenlyStem[] = [
  '갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'
] as const;

/**
 * 시간대 범위 (12시진)
 */
export const TIME_RANGES = [
  '23:00-01:00', '01:00-03:00', '03:00-05:00', '05:00-07:00',
  '07:00-09:00', '09:00-11:00', '11:00-13:00', '13:00-15:00',
  '15:00-17:00', '17:00-19:00', '19:00-21:00', '21:00-23:00',
] as const;

/**
 * 월별 지지 (입춘 기준)
 */
export const MONTH_BRANCHES: readonly EarthlyBranch[] = [
  '인', '묘', '진', '사', '오', '미',
  '신', '유', '술', '해', '자', '축',
] as const;

/**
 * 운세 등급
 */
export const FORTUNE_RATINGS = {
  EXCELLENT: '대길',
  GOOD: '길',
  NORMAL: '평',
  BAD: '흉',
  TERRIBLE: '대흉',
} as const;

/**
 * 운세 등급(대길/길/평/흉/대흉)을 "~한 해입니다" 같은 서술문에 자연스럽게
 * 넣기 위한 수식어. 등급 문자열을 그대로 어미 앞에 붙이면 "평한 해입니다"처럼
 * 문법이 깨지므로, 문장 조립 시에는 등급 대신 이 라벨을 사용한다.
 */
export const FORTUNE_OVERALL_LABEL: Record<
  (typeof FORTUNE_RATINGS)[keyof typeof FORTUNE_RATINGS],
  string
> = {
  대길: '매우 좋은',
  길: '좋은',
  평: '무난한',
  흉: '어려운',
  대흉: '매우 어려운',
};

/**
 * 일진 등급
 */
export const DAY_RATINGS = {
  EXCELLENT: '대길일',
  GOOD: '길일',
  NORMAL: '평일',
  BAD: '흉일',
  TERRIBLE: '대흉일',
} as const;

/**
 * 기준 년도 (갑자년 계산용)
 */
export const BASE_YEAR = 4;

/**
 * 기준 날짜 (일주 계산용 - 1900년 1월 1일 = 갑술일)
 * 만세력 원전 대조 결과: 1900-01-01 = 甲戌日 (갑술일)
 * (기존 병자(丙子)는 실제 1900-01-03에 해당하므로 2일 오프셋 오류였음)
 * UTC 기반으로 타임존 영향 제거
 */
export const BASE_DATE_UTC = Date.UTC(1900, 0, 1);
export const BASE_DATE = new Date(1900, 0, 1);
export const BASE_DAY_STEM_INDEX = 0; // 갑(甲)
export const BASE_DAY_BRANCH_INDEX = 10; // 술(戌)

/**
 * 점수 범위 상수
 */
export const SCORE_RANGES = {
  MAX: 100,
  MIN: 0,
  EXCELLENT_THRESHOLD: 80,
  GOOD_THRESHOLD: 60,
  NORMAL_THRESHOLD: 40,
  BAD_THRESHOLD: 20,
} as const;
