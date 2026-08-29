/**
 * 사주팔자 관련 타입 정의
 */

// 달력 타입
export type CalendarType = 'solar' | 'lunar';

// 성별
export type Gender = 'male' | 'female';

// 천간 (天干) - 10개
export type HeavenlyStem = '갑' | '을' | '병' | '정' | '무' | '기' | '경' | '신' | '임' | '계';

// 지지 (地支) - 12개
export type EarthlyBranch =
  | '자'
  | '축'
  | '인'
  | '묘'
  | '진'
  | '사'
  | '오'
  | '미'
  | '신'
  | '유'
  | '술'
  | '해';

// 오행 (五行)
export type WuXing = '목' | '화' | '토' | '금' | '수';

// 음양
export type YinYang = '음' | '양';

// 십성 (十星)
export type TenGod =
  | '비견'
  | '겁재'
  | '식신'
  | '상관'
  | '편재'
  | '정재'
  | '편관'
  | '정관'
  | '편인'
  | '정인';

// 사주 기둥 (四柱)
export interface Pillar {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  stemElement: WuXing;
  branchElement: WuXing;
  yinYang: YinYang;
}

// 사주 사기둥 (Four Pillars)
export interface SajuPillars {
  year: Pillar; // 연주 (年柱)
  month: Pillar; // 월주 (月柱)
  day: Pillar; // 일주 (日柱)
  hour: Pillar; // 시주 (時柱)
}

// 사주팔자 전체 데이터
export interface SajuData {
  // 기본 정보
  birthDate: string; // YYYY-MM-DD (사용자가 입력한 원본 — 음력이면 음력 날짜)
  /**
   * 양력으로 환산한 출생일 (YYYY-MM-DD). 양력 입력이면 birthDate와 동일.
   * 절기 거리·만 나이 등 시간축 계산(대운수, 세운 나이 매칭 등)은 반드시 이 값을 써야 한다 —
   * birthDate를 양력으로 가정해 쓰면 음력 입력 시 최대 한 달가량 어긋난다.
   */
  solarBirthDate: string;
  birthTime: string; // HH:MM
  /** 경도 보정에 사용한 시군구명 (longitude_table 키). 미입력 시 서울 */
  birthCity: string;
  calendar: CalendarType;
  isLeapMonth: boolean;
  gender: Gender;
  /** 시(時)를 모르는 명식인지 여부. true면 hour 필드는 표시용으로만 계산되고
   *  오행·십성·신살·격국·용신 등 모든 후속 분석에서 제외된다. */
  unknownHour: boolean;

  // 사주 사기둥
  year: Pillar; // 연주 (年柱)
  month: Pillar; // 월주 (月柱)
  day: Pillar; // 일주 (日柱)
  hour: Pillar; // 시주 (時柱)

  // 오행 분석
  wuxingCount: Record<WuXing, number>;

  // 십성 분석
  tenGods: TenGod[];
  tenGodsDistribution?: Record<TenGod, number>; // 십성 분포

  // 신살
  sinSals?: SinSal[]; // 신살 목록
  /** 신살이 성립한 자리까지 담은 상세 목록. sinSals는 이 목록에서 파생된다 */
  sinSalHits?: SinSalHit[];

  // 지지 관계
  branchRelations?: {
    samHap?: { type: string | null; element: WuXing | null };
    samHyeong?: string[];
    yukHae?: [EarthlyBranch, EarthlyBranch][];
    summary?: string;
  };

  // 지장간(支藏干) 정보
  jiJangGan?: {
    year: {
      primary: { stem: HeavenlyStem; strength: number };
      secondary?: { stem: HeavenlyStem; strength: number };
      residual?: { stem: HeavenlyStem; strength: number };
    };
    month: {
      primary: { stem: HeavenlyStem; strength: number };
      secondary?: { stem: HeavenlyStem; strength: number };
      residual?: { stem: HeavenlyStem; strength: number };
    };
    day: {
      primary: { stem: HeavenlyStem; strength: number };
      secondary?: { stem: HeavenlyStem; strength: number };
      residual?: { stem: HeavenlyStem; strength: number };
    };
    /** 시간 미상(unknownHour) 명식은 시주 지장간을 계산하지 않는다 */
    hour?: {
      primary: { stem: HeavenlyStem; strength: number };
      secondary?: { stem: HeavenlyStem; strength: number };
      residual?: { stem: HeavenlyStem; strength: number };
    };
  };

  // 월령 및 일간 강약
  wolRyeong?: {
    isDeukRyeong: boolean; // 득령 여부
    reason: string;
    strength: 'strong' | 'medium' | 'weak';
  };
  dayMasterStrength?: {
    level: 'very_strong' | 'strong' | 'medium' | 'weak' | 'very_weak';
    score: number; // 0-100
    analysis: string;
    /** 득령(得令) — 월지 지장간 정기가 비겁 또는 인성인가 */
    deukRyeong?: boolean;
    /** 득지(得地) — 일지 지장간에 비겁 또는 인성이 있는가 */
    deukJi?: boolean;
    /** 득세(得勢) — 일간을 뺀 나머지 글자 중 비겁+인성이 3자 이상인가 */
    deukSe?: boolean;
    /** 통근(通根) — 일간과 같은 오행의 천간을 지지(지장간)에 두고 있는 자리들 */
    rootedAt?: ('year' | 'month' | 'day' | 'hour')[];
    /** 아군(비겁+인성) 가중 세력 합 */
    supportScore?: number;
    /** 적군(식상+재성+관성) 가중 세력 합 */
    drainScore?: number;
  };

  // 격국(格局)
  gyeokGuk?: {
    gyeokGuk: string;
    name: string;
    hanja: string;
    description: string;
    /** 자평진전 성격(成格)/파격(破格) 판단. 종격·중화격은 이 판단 체계 대상이 아니라 undefined. */
    quality?: {
      status: '성격' | '파격' | '성중유패' | '패중유구';
      useType: '순용' | '역용';
      sangSin?: TenGod;
      brokenBy: string[];
      rescuedBy: string[];
      explanation: string;
    };
  };

  // 용신(用神)
  yongSin?: {
    primaryYongSin: WuXing;
    secondaryYongSin?: WuXing;
    reasoning: string;
    /** 용신을 어떤 법으로 정했는지 — 전왕(종격) > 조후(극단 계절) > 억부(강약 명확) > 통관(중화) 순 */
    method?: "jeonwang" | "johu" | "eokbu" | "tonggwan";
    /** 0~1. 조후는 조후용신표의 verified 여부를, 나머지는 판정 근거의 명확성을 반영한다 */
    confidence?: number;
  };

  // 특수 요소
  specialMarks?: string[];
  dominantElements?: WuXing[];
  weakElements?: WuXing[];
}

// 십성 해석 결과
export interface TenGodInterpretation {
  tenGod: TenGod;
  count: number;
  intensity: 'very_strong' | 'strong' | 'moderate' | 'weak' | 'very_weak'; // 강도 표현
  strengths: string[];
  weaknesses: string[];
  advice: string[];
}

// 신살(神殺) 타입
export type SinSal =
  | 'cheon_eul_gwi_in' // 천을귀인
  | 'cheon_deok_gwi_in' // 천덕귀인
  | 'wol_deok_gwi_in' // 월덕귀인
  | 'mun_chang_gwi_in' // 문창귀인
  | 'hak_dang_gwi_in' // 학당귀인
  | 'geum_yeo_rok' // 금여록
  | 'geon_rok' // 건록
  | 'am_rok' // 암록
  | 'tae_geuk_gwi_in' // 태극귀인 (미검증 — 단일 출처)
  | 'bok_seong_gwi_in' // 복성귀인 (미검증 — 출처마다 표가 엇갈림)
  | 'cheon_ju_gwi_in' // 천주귀인
  | 'hyeop_rok' // 협록
  | 'hwa_gae_sal' // 화개살
  | 'yang_in_sal' // 양인살
  | 'do_hwa_sal' // 도화살
  | 'baek_ho_sal' // 백호살
  | 'goe_gang_sal' // 괴강살
  | 'hong_yeom_sal' // 홍염살
  | 'go_sin_sal' // 고신살
  | 'yeok_ma_sal' // 역마살
  | 'gwa_suk_sal' // 과숙살
  | 'cheon_ra_ji_mang' // 천라지망
  | 'gong_mang' // 공망
  | 'won_jin_sal' // 원진살
  | 'gwi_mun_gwan_sal' // 귀문관살
  | 'hyeon_chim_sal' // 현침살 (미검증 — 학파별로 산식이 갈림)
  | 'geup_gak_sal' // 급각살
  | 'tang_hwa_sal' // 탕화살 (미검증 — 학파별로 산식이 갈림)
  | 'go_ran_sal'; // 고란살

export interface SinSalInfo {
  sinSal: SinSal;
  name: string;
  hanja: string;
  type: 'lucky' | 'unlucky' | 'neutral';
  description: string;
  effects: string[];
  advice: string[];
  /** 신살에 배속된 오행 (참고 사이트 분류를 따름 — 산식에서 유도되는 값이 아니라 서술용 참고 정보) */
  element: WuXing;
  /** 성립 근거 한 문장. 예: "일간 기준, 지지에 사(巳)가 있을 때" */
  basis: string;
  /** 양면성 — 흉신에도 긍정적 측면이, 길신에도 주의할 점이 있다는 관점을 담는다 */
  positive: string[];
  negative: string[];
  /** 분야별 해석 (직업/연애/건강) */
  byArea: { career: string; love: string; health: string };
  /** 복수 출처로 산식이 실제 일치함을 확인했는가 — false는 학파가 갈리는 산식이라는 내부 표시(화면 노출 없음) */
  verified: boolean;
}

/** 신살이 성립한 자리(연/월/일/시주) */
export interface SinSalHit {
  sinSal: SinSal;
  pillars: ('year' | 'month' | 'day' | 'hour')[];
}

// 운세 분석 타입
export type FortuneAnalysisType = 'general' | 'career' | 'wealth' | 'health' | 'love';

// 운세 분석 결과
export interface FortuneAnalysis {
  type: FortuneAnalysisType;
  targetDate?: string;
  score: number; // 0-100
  summary: string;
  details: {
    positive: string[];
    negative: string[];
    advice: string[];
  };
  luckyElements?: {
    colors?: string[];
    directions?: string[];
    numbers?: number[];
  };
}

// 궁합 분석 결과
export interface CompatibilityAnalysis {
  compatibilityScore: number; // 0-100
  summary: string;
  strengths: string[];
  weaknesses: string[];
  advice: string[];
  elementHarmony: {
    harmony: number; // 0-100
    description: string;
  };
}

// 일일 운세
export interface DailyFortune {
  date: string;
  overallLuck: number; // 0-100
  wealthLuck: number;
  careerLuck: number;
  healthLuck: number;
  loveLuck: number;
  luckyColor: string;
  luckyDirection: string;
  advice: string;
}

// 음양력 변환 결과
export interface CalendarConversion {
  originalDate: string;
  originalCalendar: CalendarType;
  convertedDate: string;
  convertedCalendar: CalendarType;
  isLeapMonth?: boolean;
  solarTerm?: string; // 절기
}

// 24절기
export type SolarTerm =
  | '입춘'
  | '우수'
  | '경칩'
  | '춘분'
  | '청명'
  | '곡우'
  | '입하'
  | '소만'
  | '망종'
  | '하지'
  | '소서'
  | '대서'
  | '입추'
  | '처서'
  | '백로'
  | '추분'
  | '한로'
  | '상강'
  | '입동'
  | '소설'
  | '대설'
  | '동지'
  | '소한'
  | '대한';

// 에러 타입
export class SajuError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SajuError';
  }
}

// 해석 유파 관련 타입
export * from './interpretation';

