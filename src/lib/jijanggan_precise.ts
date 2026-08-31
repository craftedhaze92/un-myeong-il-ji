/**
 * 지장간 세력 정밀 계산 라이브러리
 *
 * 절입(節入)으로부터의 경과일을 기반으로 사령(司令) 천간의 세력을 가중해 계산한다.
 * saju.ts가 이 파일을 통해 4주 지장간 세력을 구하며, 월지에만 사령 가중을 적용한다
 * (사령은 월령용사月令用事 개념이라 연지·일지·시지에는 명리학적으로 적용되지 않는다).
 */

import type { EarthlyBranch, HeavenlyStem, SolarTerm } from '../types/index';
import {
  JIJANGGAN_STRENGTH_DETAILED,
  BRANCH_TOTAL_DAYS,
  findSaRyeongPhaseIndex,
  type JiJangGanStrengthPhase,
} from '../data/jijanggan_strength_table';
import { getPreviousJieSolarTermByInstant } from '../data/solar_terms';

/** 사령(司令) phase의 세력을 몇 배로 키운 뒤 100으로 재정규화할지 — 단일 출처 상수 */
const SARYEONG_MULTIPLIER = 2;

/**
 * 지장간 정밀 세력 정보
 */
export interface JiJangGanPreciseStrength {
  stem: HeavenlyStem;
  strength: number; // 0-100 범위의 세력 (한 지지의 전체 phase 합 = 100)
  role: '여기' | '중기' | '정기'; // 해당 천간의 역할
  isSaRyeong: boolean; // 현재 사령(당령) 중인 phase인가
}

/**
 * 지장간 정밀 세력 분석 결과
 *
 * solarTerm/daysSinceTermStart는 절기 데이터 범위(1900~2200년) 밖이면 null이 된다 —
 * 이 경우 사령 가중을 적용하지 않고 테이블의 일수 비례 고정 세력만 반환한다.
 */
export interface JiJangGanAnalysis {
  branch: EarthlyBranch;
  birthDate: Date;
  solarTerm: SolarTerm | null;
  daysSinceTermStart: number | null;
  totalDays: number;
  strengths: JiJangGanPreciseStrength[];
  dominantStem: HeavenlyStem;
  dominantStrength: number;
}

/** saju.ts의 SajuData['jiJangGan']['year'|'month'|'day'|'hour']와 동일한 슬롯 구조 */
export interface JiJangGanSlot {
  primary: { stem: HeavenlyStem; strength: number };
  secondary?: { stem: HeavenlyStem; strength: number };
  residual?: { stem: HeavenlyStem; strength: number };
}

function roleOf(index: number, length: number): '여기' | '중기' | '정기' {
  if (index === length - 1) return '정기';
  if (index === 0) return '여기';
  return '중기';
}

/**
 * 사령 가중이 적용된 phase별 세력(합 100)을 계산한다.
 *
 * 사령 phase의 원래 세력에 SARYEONG_MULTIPLIER를 곱한 뒤 전체 합으로 나눠 100으로
 * 재정규화한다. 반올림 잔차는 항상 정기(마지막 phase)에 몰아 총합이 정확히 100이
 * 되도록 한다.
 *
 * 예: 인월 입춘+16일(甲 정기 사령) → [무 15, 병 15, 갑 70] (원래 23/23/54).
 * 인월 입춘+3일(戊 여기 사령) → [무 37, 병 19, 갑 44] (원래 23/23/54).
 */
function computeSaRyeongAdjustedStrengths(
  phases: JiJangGanStrengthPhase[],
  saRyeongIndex: number
): number[] {
  const lastIndex = phases.length - 1;
  const raw = phases.map((phase, i) =>
    i === saRyeongIndex ? phase.strength * SARYEONG_MULTIPLIER : phase.strength
  );
  const total = raw.reduce((sum, v) => sum + v, 0);

  const adjusted = raw.map((v, i) => (i === lastIndex ? 0 : Math.round((v / total) * 100)));
  const sumOfOthers = adjusted.reduce((sum, v, i) => (i === lastIndex ? sum : sum + v), 0);
  adjusted[lastIndex] = 100 - sumOfOthers;

  return adjusted;
}

/**
 * 지장간 세력 정밀 계산
 *
 * @param branch 지지 (年/月/日/時 어느 지지든 가능)
 * @param birthDate 생년월일시
 * @param options.applySaRyeong true면 절입 후 경과일에 따라 사령 phase의 세력을 가중한다.
 *   기본값 false — 일수 비례 고정 세력(테이블 원본 그대로)만 쓴다.
 * @returns 지장간 정밀 세력 분석 결과
 */
export function calculateJiJangGanStrengthPrecise(
  branch: EarthlyBranch,
  birthDate: Date,
  options?: { applySaRyeong?: boolean }
): JiJangGanAnalysis {
  const phases = JIJANGGAN_STRENGTH_DETAILED[branch];
  if (!phases) {
    throw new Error(`지지 ${branch}에 대한 지장간 세력 테이블을 찾을 수 없습니다.`);
  }
  const totalDays = BRANCH_TOTAL_DAYS[branch]!;
  const applySaRyeong = options?.applySaRyeong ?? false;

  // 절(節)만 본다 — getUnifiedCurrentSolarTerm 같은 24절기 전체 조회는 우수·춘분 등
  // 중기(中氣)도 절입으로 오인해 경과일이 중간에 리셋되는 버그가 있다. saju.ts의
  // 월주 계산과 동일한 기준(getPreviousJieSolarTermByInstant)을 써야 한다.
  const prevJie = getPreviousJieSolarTermByInstant(birthDate);

  let solarTerm: SolarTerm | null = null;
  let daysSinceTermStart: number | null = null;
  let saRyeongIndex = -1;

  if (prevJie) {
    solarTerm = prevJie.term;
    daysSinceTermStart = Math.floor(
      (birthDate.getTime() - prevJie.timestamp) / (1000 * 60 * 60 * 24)
    );
    if (applySaRyeong) {
      saRyeongIndex = findSaRyeongPhaseIndex(branch, daysSinceTermStart);
    }
  }
  // prevJie가 null이면(절기 데이터 범위 밖, 1900년 이전 등) 사령 가중 없이
  // 테이블의 일수 비례 고정 세력으로 폴백한다 — throw하지 않아 saju.ts가 항상
  // 결과를 받는다.

  const strengthValues =
    saRyeongIndex >= 0
      ? computeSaRyeongAdjustedStrengths(phases, saRyeongIndex)
      : phases.map((phase) => phase.strength);

  const strengths: JiJangGanPreciseStrength[] = phases.map((phase, index) => ({
    stem: phase.stem,
    strength: strengthValues[index]!,
    role: roleOf(index, phases.length),
    isSaRyeong: index === saRyeongIndex,
  }));

  const dominant = strengths.reduce((max, s) => (s.strength > max.strength ? s : max), strengths[0]!);

  return {
    branch,
    birthDate,
    solarTerm,
    daysSinceTermStart,
    totalDays,
    strengths,
    dominantStem: dominant.stem,
    dominantStrength: dominant.strength,
  };
}

/**
 * JiJangGanPreciseStrength[]를 SajuData.jiJangGan이 쓰는 슬롯 구조로 변환한다.
 * 역할(role) 기준 매핑: 정기→primary, 중기→secondary, 여기→residual.
 * ten_gods.ts/day_master_strength.ts/gyeok_guk.ts/johu.ts/view-model.ts 등 모든
 * 소비자가 "primary = 정기(본기)"를 전제하므로 이 매핑을 바꾸면 안 된다.
 */
export function toJiJangGanSlot(strengths: JiJangGanPreciseStrength[]): JiJangGanSlot {
  const primary = strengths.find((s) => s.role === '정기')!;
  const secondary = strengths.find((s) => s.role === '중기');
  const residual = strengths.find((s) => s.role === '여기');

  const slot: JiJangGanSlot = {
    primary: { stem: primary.stem, strength: primary.strength },
  };
  if (secondary) slot.secondary = { stem: secondary.stem, strength: secondary.strength };
  if (residual) slot.residual = { stem: residual.stem, strength: residual.strength };
  return slot;
}

/**
 * 지지의 지장간 세력을 saju.ts가 바로 쓸 수 있는 슬롯 구조로 계산한다.
 * calculateJiJangGanStrengthPrecise + toJiJangGanSlot을 합친 편의 함수.
 */
export function calculateJiJangGanSlot(
  branch: EarthlyBranch,
  birthDate: Date,
  options?: { applySaRyeong?: boolean }
): JiJangGanSlot {
  const analysis = calculateJiJangGanStrengthPrecise(branch, birthDate, options);
  return toJiJangGanSlot(analysis.strengths);
}
