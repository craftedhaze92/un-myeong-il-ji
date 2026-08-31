/**
 * 지장간 세력 정밀 계산 라이브러리
 *
 * 지지별 지장간(여기·중기·정기) 세력을 data/jijanggan_strength_table.ts의 고정
 * 일수비례 비율표로 계산한다. saju.ts가 이 파일을 통해 4주 지장간 세력을 구하며,
 * 연·월·일·시지 모두 같은 방식(고정 비율)을 쓴다 — 출생 시각에 따라 특정 지지의
 * 세력을 추가로 가중하는 절차(사령司令 가중)는 시도했으나 표준 명리 실무와 맞지
 * 않아 제외했다. "정밀"은 개별 출생 시각이 아니라, 임의 문지방값을 쓰던 예전
 * earthly_branches.ts#calculateJiJangGanStrength(삭제됨) 대신 실제 지장간 분일
 * (分日) 비율표와 정확한 JI_JANG_GAN 순서를 쓴다는 뜻이다.
 */

import type { EarthlyBranch, HeavenlyStem } from '../types/index';
import { JIJANGGAN_STRENGTH_DETAILED } from '../data/jijanggan_strength_table';

/**
 * 지장간 정밀 세력 정보
 */
export interface JiJangGanPreciseStrength {
  stem: HeavenlyStem;
  strength: number; // 0-100 범위의 세력 (한 지지의 전체 phase 합 = 100)
  role: '여기' | '중기' | '정기'; // 해당 천간의 역할
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
 * 지지의 지장간 세력을 고정 일수비례 비율표(JIJANGGAN_STRENGTH_DETAILED)에서 그대로
 * 가져와 role을 붙인다. 테이블 자체가 이미 phase 합 100인 고정 비율이라 추가 정규화가
 * 필요 없다.
 */
export function calculateJiJangGanStrengthPrecise(
  branch: EarthlyBranch
): JiJangGanPreciseStrength[] {
  const phases = JIJANGGAN_STRENGTH_DETAILED[branch];
  if (!phases) {
    throw new Error(`지지 ${branch}에 대한 지장간 세력 테이블을 찾을 수 없습니다.`);
  }

  return phases.map((phase, index) => ({
    stem: phase.stem,
    strength: phase.strength,
    role: roleOf(index, phases.length),
  }));
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
export function calculateJiJangGanSlot(branch: EarthlyBranch): JiJangGanSlot {
  return toJiJangGanSlot(calculateJiJangGanStrengthPrecise(branch));
}
