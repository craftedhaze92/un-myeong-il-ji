/**
 * 작명(命名) 분석 라이브러리
 *
 * 이름의 오행 분석 및 추천
 */

import type {
  HeavenlyStem,
  SajuData,
  WuXing
} from '../types/index';
import { NAMING_HANJA_TABLE, type NamingHanjaEntry } from '../data/naming_hanja_table';

/**
 * 한글 자음의 오행 분류
 */
const CONSONANT_WUXING: Record<string, WuXing> = {
  // 목(木)
  'ㄱ': '목', 'ㅋ': '목',
  // 화(火)
  'ㄴ': '화', 'ㄷ': '화', 'ㄹ': '화', 'ㅌ': '화',
  // 토(土)
  'ㅁ': '토', 'ㅂ': '토', 'ㅍ': '토',
  // 금(金)
  'ㅅ': '금', 'ㅈ': '금', 'ㅊ': '금',
  // 수(水)
  'ㅇ': '수', 'ㅎ': '수',
};

/**
 * 이름 분석 결과
 */
export interface JakmeongAnalysis {
  name: string;
  characters: {
    char: string;
    /** 사용자가 입력한 한자(있을 때만) */
    hanja?: string;
    /** 사전에서 찾은 실제 획수(원획). 한자가 없거나 사전에 없으면 undefined — 가짜 값을 채우지 않는다. */
    strokes?: number;
    element: WuXing;
    /** element가 자원오행(한자 기반)인지 발음오행(초성 기반)인지 — 두 체계를 섞어 쓰지 않고 글자 단위로 명시한다. */
    elementSource: '자원' | '발음';
    /** elementSource === '자원'일 때만 의미 있음: 부수가 오행에 직접 대응하는 등 근거가 명확한지 */
    elementVerified?: boolean;
    meaning?: string;
  }[];

  // 오행 구성
  wuxingComposition: {
    elements: WuXing[];
    balance: string;
    isFavorable: boolean;
  };

  // 사주와의 조화
  harmonyWithSaju: {
    score: number; // 0-100
    description: string;
    補益Elements: WuXing[]; // 보완하는 오행
  };

  /**
   * 획수 분석(오격 성명학: 천격/인격/지격/외격/총격). 성(1글자)+이름(2글자) 총 3글자 모두
   * 한자가 주어지고 사전에 있어야 계산한다 — 하나라도 없으면 가짜 숫자를 채우는 대신
   * available: false로 그 이유를 밝힌다. 복성(2음절 성)은 지원하지 않는다(첫 글자를 성으로 간주).
   */
  strokeAnalysis:
    | {
        available: true;
        heavenGround: number; // 천격
        personalGround: number; // 인격
        earthGround: number; // 지격
        outerGround: number; // 외격
        totalGround: number; // 총격
        fortune: string;
        /** 세 글자 모두 확실한(strokesVerified) 획수인지 — 하나라도 아니면 보정치가 섞인 것 */
        allVerified: boolean;
      }
    | { available: false; reason: string };

  // 발음 분석
  pronunciation: {
    rhythm: string; // 음률
    easyToPronounce: boolean;
    easyToWrite: boolean;
  };

  // 종합 평가
  overall: {
    score: number; // 0-100
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
    strengths: string[];
    weaknesses: string[];
  };
}

/**
 * 이름 추천 조건
 */
export interface NameRecommendationRequest {
  surname: string; // 성
  gender: 'male' | 'female';
  saju: SajuData;
  preferredElements?: WuXing[]; // 선호 오행
  avoidElements?: WuXing[]; // 피할 오행
  meaningPreference?: string[]; // 의미 선호 (예: '밝다', '크다')
}

/**
 * 이름 추천 결과
 */
export interface NameRecommendation {
  recommendations: {
    fullName: string;
    givenName: string; // 이름
    analysis: JakmeongAnalysis;
    meanings: string[];
  }[];
  criteria: {
    lackedElements: WuXing[]; // 부족한 오행
    excessElements: WuXing[]; // 과한 오행
    targetElements: WuXing[]; // 목표 오행
  };
}

/**
 * 이름 분석
 *
 * @param hanja fullName과 정확히 같은 글자 수일 때만 사용한다(선택). 부분 입력이나 길이가
 * 다른 입력은 조용히 무시하고 발음오행 경로로 전부 폴백한다 — 섞어 쓰면 오격 계산이 애매해진다.
 */
export function analyzeName(
  fullName: string,
  saju: SajuData,
  hanja?: string,
): JakmeongAnalysis {
  const chars = fullName.split('');
  const hanjaChars = hanja && hanja.length === chars.length ? hanja.split('') : null;

  // 1. 각 글자 분석 — 한자가 주어지고 사전에 있으면 자원오행(실제 획수 포함), 아니면 발음오행.
  const characters = chars.map((char, i) => {
    const hanjaChar = hanjaChars?.[i];
    const hanjaEntry: NamingHanjaEntry | undefined = hanjaChar ? NAMING_HANJA_TABLE[hanjaChar] : undefined;

    if (hanjaChar && hanjaEntry) {
      return {
        char,
        hanja: hanjaChar,
        strokes: hanjaEntry.strokes,
        element: hanjaEntry.element,
        elementSource: '자원' as const,
        elementVerified: hanjaEntry.elementVerified,
        meaning: hanjaEntry.meaning,
      };
    }
    return {
      char,
      hanja: hanjaChar,
      // 사전에 없으면 획수는 undefined로 둔다 — 예전처럼 getStrokeCount로 가짜 값을 채우지 않는다.
      strokes: undefined,
      element: getCharacterElement(char),
      elementSource: '발음' as const,
      meaning: getCharacterMeaning(char),
    };
  });

  // 2. 오행 구성
  const elements = characters.map(c => c.element);
  const wuxingComposition = analyzeWuxingComposition(elements, saju);

  // 3. 사주와의 조화
  const harmonyWithSaju = analyzeHarmonyWithSaju(elements, saju);

  // 4. 획수 분석(오격) — 실제 한자 획수가 있을 때만 계산
  const strokeAnalysis = analyzeStrokes(characters);

  // 5. 발음 분석
  const pronunciation = analyzePronunciation(fullName);

  // 6. 종합 평가
  const overall = evaluateOverall(
    wuxingComposition,
    harmonyWithSaju,
    strokeAnalysis,
    pronunciation
  );

  return {
    name: fullName,
    characters,
    wuxingComposition,
    harmonyWithSaju,
    strokeAnalysis,
    pronunciation,
    overall,
  };
}

/**
 * 이름 추천
 */
export function recommendNames(
  request: NameRecommendationRequest,
  count: number = 10
): NameRecommendation {
  // 1. 사주 오행 분석
  const sajuElements = analyzeSajuElements(request.saju);
  const lackedElements = findLackedElements(sajuElements);
  const excessElements = findExcessElements(sajuElements);

  // 2. 목표 오행 결정
  const targetElements = request.preferredElements || lackedElements;

  // 3. 후보 이름 생성
  const candidates = generateNameCandidates(
    request.surname,
    targetElements,
    request.gender,
    count * 3 // 필터링을 위해 더 많이 생성
  );

  // 4. 각 후보 분석 및 점수화
  const scored = candidates.map(name => ({
    fullName: `${request.surname}${name.givenName}`,
    givenName: name.givenName,
    analysis: analyzeName(`${request.surname}${name.givenName}`, request.saju),
    meanings: name.meanings,
  })).sort((a, b) => b.analysis.overall.score - a.analysis.overall.score);

  // 5. 상위 N개 반환
  return {
    recommendations: scored.slice(0, count),
    criteria: {
      lackedElements,
      excessElements,
      targetElements,
    },
  };
}

/**
 * 글자의 획수 구하기 (간단화 - 실제로는 한자 획수 DB 필요)
 */
function getStrokeCount(char: string): number {
  // 간단한 근사치 (실제로는 정확한 한자 획수 데이터 필요)
  const code = char.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) {
    // 한글
    return ((code - 0xAC00) % 28) + 3; // 3-30 사이
  }
  // 한자나 기타 - 임의값
  return 10;
}

/**
 * 글자의 오행 구하기
 */
function getCharacterElement(char: string): WuXing {
  // 한글 초성 기준
  const chosung = extractChosung(char);
  return CONSONANT_WUXING[chosung] || '토';
}

/**
 * 한글 초성 추출
 */
function extractChosung(char: string): string {
  const chosungs = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const code = char.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return 'ㅇ';
  return chosungs[Math.floor(code / 588)] || 'ㅇ';
}

/**
 * 글자 의미 (간단한 예시)
 */
function getCharacterMeaning(char: string): string | undefined {
  const meanings: Record<string, string> = {
    '민': '민첩, 백성',
    '준': '준수, 뛰어남',
    '서': '서쪽, 책',
    '우': '비, 은혜',
    '지': '지혜',
    '윤': '윤택, 빛',
    '은': '은혜',
    '하': '크다',
    '아': '아름답다',
    '영': '꽃, 영롱',
  };
  return meanings[char];
}

/**
 * 오행 구성 분석
 */
function analyzeWuxingComposition(
  elements: WuXing[],
  saju: SajuData
): JakmeongAnalysis['wuxingComposition'] {
  const sajuElements = analyzeSajuElements(saju);
  const combined = [...sajuElements, ...elements];

  const counts = countElements(combined);
  const isBalanced = Object.values(counts).every(count =>
    count >= 1 && count <= 3
  );

  return {
    elements,
    balance: isBalanced ? '균형잡힘' : '불균형',
    isFavorable: isBalanced,
  };
}

/**
 * 사주 오행 분석
 */
function analyzeSajuElements(saju: SajuData): WuXing[] {
  const stemToElement: Record<HeavenlyStem, WuXing> = {
    '갑': '목', '을': '목',
    '병': '화', '정': '화',
    '무': '토', '기': '토',
    '경': '금', '신': '금',
    '임': '수', '계': '수',
  };

  return [
    stemToElement[saju.year.stem],
    stemToElement[saju.month.stem],
    stemToElement[saju.day.stem],
    stemToElement[saju.hour.stem],
  ];
}

/**
 * 오행 개수 세기
 */
function countElements(elements: WuXing[]): Record<WuXing, number> {
  return elements.reduce((acc, elem) => {
    acc[elem] = (acc[elem] || 0) + 1;
    return acc;
  }, {} as Record<WuXing, number>);
}

/**
 * 부족한 오행 찾기
 */
function findLackedElements(sajuElements: WuXing[]): WuXing[] {
  const counts = countElements(sajuElements);
  const allElements: WuXing[] = ['목', '화', '토', '금', '수'];

  return allElements.filter(elem => (counts[elem] || 0) === 0);
}

/**
 * 과한 오행 찾기
 */
function findExcessElements(sajuElements: WuXing[]): WuXing[] {
  const counts = countElements(sajuElements);

  return Object.entries(counts)
    .filter(([_, count]) => count >= 3)
    .map(([elem, _]) => elem as WuXing);
}

/**
 * 사주와의 조화 분석
 */
function analyzeHarmonyWithSaju(
  nameElements: WuXing[],
  saju: SajuData
): JakmeongAnalysis['harmonyWithSaju'] {
  const sajuElements = analyzeSajuElements(saju);
  const lackedElements = findLackedElements(sajuElements);

  // 같은 오행 글자가 이름에 두 번 나오면(예: 도·현이 둘 다 토) 중복 없이 한 번만 센다 —
  // 그대로 두면 "부족한 토, 토 오행을 보완하여 좋음"처럼 문구가 중복된다.
  const beneficialElements = [
    ...new Set(nameElements.filter(elem => lackedElements.includes(elem))),
  ];

  const score = beneficialElements.length > 0 ? 80 : 50;

  let description = '';
  if (beneficialElements.length > 0) {
    description = `부족한 ${beneficialElements.join(', ')} 오행을 보완하여 좋음`;
  } else {
    description = '사주와 무난한 관계';
  }

  return {
    score,
    description,
    補益Elements: beneficialElements,
  };
}

/**
 * 획수 분석 (성명학)
 */
function analyzeStrokes(
  characters: JakmeongAnalysis['characters'],
): JakmeongAnalysis['strokeAnalysis'] {
  if (characters.length < 3) {
    return { available: false, reason: '이름이 3글자 미만이라 오격(성명학 획수)을 계산할 수 없습니다.' };
  }

  // 오격 공식은 성(1글자) + 이름 첫 두 글자만 쓴다(복성·4글자 이상 이름은 지원하지 않음).
  const first3 = characters.slice(0, 3);
  const missing = first3.filter((c) => c.strokes === undefined);
  if (missing.length > 0) {
    const missingChars = missing.map((c) => c.hanja ?? c.char).join(', ');
    return {
      available: false,
      reason: `'${missingChars}'의 한자 획수 정보가 없어 계산할 수 없습니다. 상용 작명 한자 사전에 있는 한자를 입력해 주세요.`,
    };
  }

  const [s1, s2, s3] = first3.map((c) => c.strokes as number);

  const heavenGround = s1 + 1; // 천격 (성 + 1)
  const personalGround = s1 + s2; // 인격 (성 + 이름 첫자)
  const earthGround = s2 + s3; // 지격 (이름 두 자)
  const outerGround = s1 + s3 + 1; // 외격
  const totalGround = s1 + s2 + s3; // 총격

  // 81수리 길흉표 — 기존 값을 그대로 쓴다(이번 작업 범위 밖: 이 표 자체의 검증은 하지 않음)
  const isGood = (n: number) => [1, 3, 5, 7, 8, 11, 13, 15, 16, 21, 23, 24, 25, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 81].includes(n % 81);

  const goods = [heavenGround, personalGround, earthGround, outerGround, totalGround]
    .filter(isGood).length;

  let fortune = '';
  if (goods >= 4) fortune = '대길';
  else if (goods >= 3) fortune = '길';
  else if (goods >= 2) fortune = '평';
  else fortune = '흉';

  const allVerified = first3.every(
    (c) => c.hanja !== undefined && NAMING_HANJA_TABLE[c.hanja]?.strokesVerified === true,
  );

  return {
    available: true,
    heavenGround,
    personalGround,
    earthGround,
    outerGround,
    totalGround,
    fortune,
    allVerified,
  };
}

/**
 * 발음 분석
 */
function analyzePronunciation(name: string): JakmeongAnalysis['pronunciation'] {
  const chars = name.split('');

  // 간단한 발음 평가
  const hasHardConsonants = chars.some(c =>
    ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'].includes(extractChosung(c))
  );

  return {
    rhythm: '자연스러움',
    easyToPronounce: !hasHardConsonants && chars.length <= 4,
    easyToWrite: chars.every(c => getStrokeCount(c) <= 15),
  };
}

/**
 * 종합 평가
 */
function evaluateOverall(
  wuxing: JakmeongAnalysis['wuxingComposition'],
  harmony: JakmeongAnalysis['harmonyWithSaju'],
  strokes: JakmeongAnalysis['strokeAnalysis'],
  pronunciation: JakmeongAnalysis['pronunciation']
): JakmeongAnalysis['overall'] {
  let score = 50;

  if (wuxing.isFavorable) score += 20;
  score += harmony.score * 0.3;

  if (strokes.available) {
    if (strokes.fortune === '대길') score += 15;
    else if (strokes.fortune === '길') score += 10;
    else if (strokes.fortune === '흉') score -= 10;
  }

  if (pronunciation.easyToPronounce) score += 5;
  if (pronunciation.easyToWrite) score += 5;

  score = Math.min(100, Math.max(0, score));

  let grade: JakmeongAnalysis['overall']['grade'];
  if (score >= 95) grade = 'A+';
  else if (score >= 90) grade = 'A';
  else if (score >= 85) grade = 'B+';
  else if (score >= 80) grade = 'B';
  else if (score >= 75) grade = 'C+';
  else if (score >= 70) grade = 'C';
  else grade = 'D';

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (wuxing.isFavorable) strengths.push('오행 균형');
  if (harmony.score >= 70) strengths.push('사주 보완');
  if (strokes.available && (strokes.fortune === '대길' || strokes.fortune === '길')) strengths.push('획수 길함');
  if (pronunciation.easyToPronounce) strengths.push('발음 좋음');

  if (!wuxing.isFavorable) weaknesses.push('오행 불균형');
  if (harmony.score < 50) weaknesses.push('사주와 무관');
  if (strokes.available && strokes.fortune === '흉') weaknesses.push('획수 흉');
  if (!pronunciation.easyToPronounce) weaknesses.push('발음 어려움');

  return {
    score,
    grade,
    strengths: strengths.length > 0 ? strengths : ['보통'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['없음'],
  };
}

/**
 * 이름 후보 생성 (간단한 예시)
 */
function generateNameCandidates(
  _surname: string,
  targetElements: WuXing[],
  gender: 'male' | 'female',
  count: number
): { givenName: string; meanings: string[] }[] {
  // 오행별 한글 글자 풀 (간단한 예시)
  const elementChars: Record<WuXing, string[]> = {
    '목': ['경', '규', '근', '기', '건'],
    '화': ['나', '단', '동', '태', '대'],
    '토': ['미', '만', '민', '명', '무'],
    '금': ['서', '성', '소', '수', '승'],
    '수': ['우', '원', '윤', '은', '영'],
  };

  const genderChars = {
    male: ['준', '민', '우', '진', '현', '성', '호', '규', '승'],
    female: ['서', '지', '은', '아', '윤', '하', '유', '예', '나'],
  };

  const candidates: { givenName: string; meanings: string[] }[] = [];

  // 간단하게 조합 생성
  for (let i = 0; i < count; i++) {
    const elem1 = targetElements[i % targetElements.length];

    const char1Pool = elementChars[elem1 || '목'] || genderChars[gender];
    const char2Pool = genderChars[gender];

    const char1 = char1Pool[i % char1Pool.length] || '미';
    const char2 = char2Pool[(i + 1) % char2Pool.length] || '소';

    candidates.push({
      givenName: `${char1}${char2}`,
      meanings: [
        getCharacterMeaning(char1) || '좋은 의미',
        getCharacterMeaning(char2) || '훌륭한 의미',
      ],
    });
  }

  return candidates;
}
