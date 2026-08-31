import { describe, expect, it } from 'vitest';
import {
  calculateJiJangGanStrengthPrecise,
  calculateJiJangGanSlot,
  toJiJangGanSlot,
} from './jijanggan_precise';
import { findSaRyeongPhaseIndex } from '../data/jijanggan_strength_table';
import { getSolarTermsForYear } from '../data/solar_terms';
import type { EarthlyBranch } from '../types/index';

const DAY_MS = 24 * 60 * 60 * 1000;

// 2020년 입춘(2/4 17:53 KST) — 인월(寅月) 지장간 사령 테스트의 기준 시각.
// 인월 phases: 무(여기, 0~6일) → 병(중기, 7~13일) → 갑(정기, 14~29일).
const IPCHUN_2020 = getSolarTermsForYear(2020).find((t) => t.term === '입춘')!;

function daysAfterIpchun(days: number, extraHours = 12): Date {
  return new Date(IPCHUN_2020.timestamp + days * DAY_MS + extraHours * 60 * 60 * 1000);
}

describe('절입 후 경과일에 따라 인월 사령이 여기→중기→정기로 바뀌고 세력도 따라 움직인다', () => {
  it('절입 +3일(여기 구간)은 여기 무(戊)가 사령이다', () => {
    const analysis = calculateJiJangGanStrengthPrecise('인', daysAfterIpchun(3), {
      applySaRyeong: true,
    });
    expect(analysis.solarTerm).toBe('입춘');
    expect(analysis.daysSinceTermStart).toBe(3);
    // 여기(무)가 사령이라도 원래 세력(23)이 작아 2배 가중해도 정기(갑)의 세력을 넘지 못한다.
    expect(analysis.dominantStem).toBe('갑');

    const byStem = Object.fromEntries(analysis.strengths.map((s) => [s.stem, s]));
    expect(byStem['무']!.role).toBe('여기');
    expect(byStem['무']!.isSaRyeong).toBe(true);
    expect(byStem['병']!.isSaRyeong).toBe(false);
    expect(byStem['갑']!.isSaRyeong).toBe(false);
    // 원래 일수 비례 세력(23/23/54)에서 여기가 사령으로 가중되어 정기보다는 낮지만
    // 원래 세력보다는 커진다.
    expect(byStem['무']!.strength).toBe(37);
    expect(byStem['병']!.strength).toBe(19);
    expect(byStem['갑']!.strength).toBe(44);
  });

  it('절입 +10일(중기 구간)은 중기 병(丙)이 사령이다', () => {
    const analysis = calculateJiJangGanStrengthPrecise('인', daysAfterIpchun(10), {
      applySaRyeong: true,
    });
    expect(analysis.daysSinceTermStart).toBe(10);
    expect(analysis.dominantStem).toBe('갑'); // 정기가 여전히 최대값이지만

    const byStem = Object.fromEntries(analysis.strengths.map((s) => [s.stem, s]));
    expect(byStem['병']!.isSaRyeong).toBe(true);
    expect(byStem['무']!.strength).toBe(19);
    expect(byStem['병']!.strength).toBe(37);
    expect(byStem['갑']!.strength).toBe(44);
  });

  it('절입 +20일(정기 구간)은 정기 갑(甲)이 사령이며 세력이 가장 크게 가중된다', () => {
    const analysis = calculateJiJangGanStrengthPrecise('인', daysAfterIpchun(20), {
      applySaRyeong: true,
    });
    expect(analysis.daysSinceTermStart).toBe(20);
    expect(analysis.dominantStem).toBe('갑');

    const byStem = Object.fromEntries(analysis.strengths.map((s) => [s.stem, s]));
    expect(byStem['갑']!.isSaRyeong).toBe(true);
    expect(byStem['무']!.strength).toBe(15);
    expect(byStem['병']!.strength).toBe(15);
    expect(byStem['갑']!.strength).toBe(70);
  });

  it('applySaRyeong을 켜지 않으면 경과일과 무관하게 일수 비례 고정 세력(23/23/54)만 쓴다', () => {
    const early = calculateJiJangGanStrengthPrecise('인', daysAfterIpchun(3));
    const late = calculateJiJangGanStrengthPrecise('인', daysAfterIpchun(20));
    const strengthsOf = (a: ReturnType<typeof calculateJiJangGanStrengthPrecise>) =>
      Object.fromEntries(a.strengths.map((s) => [s.stem, s.strength]));

    expect(strengthsOf(early)).toEqual({ 무: 23, 병: 23, 갑: 54 });
    expect(strengthsOf(late)).toEqual({ 무: 23, 병: 23, 갑: 54 });
    expect(early.strengths.every((s) => !s.isSaRyeong)).toBe(true);
  });
});

describe('인월 2/25 출생은 우수가 아니라 입춘 기준으로 절입 경과일이 계산된다 (중기 절기 오염 회귀)', () => {
  // 우수(2020-02-19)는 절(節)이 아니라 기(氣)라서 월건 기준 절입이 아니다.
  // getUnifiedCurrentSolarTerm처럼 24절기 전체를 보는 함수를 쓰면 우수를 절입으로
  // 오인해 daysSinceTermStart가 6일로 리셋되는 버그가 있었다.
  const birthDate = new Date('2020-02-25T09:00:00+09:00');

  it('절기는 입춘이고, 경과일은 우수(2/19) 기준이 아니라 입춘(2/4) 기준으로 20일이다', () => {
    const analysis = calculateJiJangGanStrengthPrecise('인', birthDate, { applySaRyeong: true });
    expect(analysis.solarTerm).toBe('입춘');
    expect(analysis.daysSinceTermStart).toBe(20);
    expect(analysis.dominantStem).toBe('갑'); // 정기 구간(14~29일) — 우수 기준이면 여기로 잘못 잡힌다
  });
});

describe('절입 당일 정각 출생은 경과일이 0이고 여기가 사령이다', () => {
  it('daysSinceTermStart === 0, 사령 플래그는 여기 무(戊)에 선다', () => {
    const analysis = calculateJiJangGanStrengthPrecise('인', new Date(IPCHUN_2020.timestamp), {
      applySaRyeong: true,
    });
    expect(analysis.daysSinceTermStart).toBe(0);
    const byStem = Object.fromEntries(analysis.strengths.map((s) => [s.stem, s]));
    expect(byStem['무']!.isSaRyeong).toBe(true);
    expect(byStem['병']!.isSaRyeong).toBe(false);
    expect(byStem['갑']!.isSaRyeong).toBe(false);
  });
});

describe('findSaRyeongPhaseIndex 경계 처리 — 월말(총 일수 초과) 출생은 여기가 아니라 정기로 clamp된다', () => {
  // 예전 calculateJiJangGanStrengthByDays는 daysSinceTermStart가 총 일수를 넘으면
  // for 루프가 break 없이 끝나 currentPhaseIndex가 초기값 0(여기)에 머무르는 버그가
  // 있었다 — 월말 출생이 "여기 사령"으로 잘못 계산됐다.
  it('인월(3단계, 총 30일) — 35일 경과는 정기(index2)로 clamp', () => {
    expect(findSaRyeongPhaseIndex('인', 35)).toBe(2);
  });

  it('자월(2단계, 총 30일) — 35일 경과는 정기(index1)로 clamp', () => {
    expect(findSaRyeongPhaseIndex('자', 35)).toBe(1);
  });

  it('절입 이전(음수 경과일)은 여기(index0)로 clamp', () => {
    expect(findSaRyeongPhaseIndex('인', -1)).toBe(0);
  });
});

describe('모든 지지에서 지장간 세력 합이 정확히 100이다', () => {
  const branches: EarthlyBranch[] = [
    '자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해',
  ];
  const someDate = daysAfterIpchun(9); // 임의의 날짜(어느 지지든 적용 가능)

  it.each(branches)('%s지 — applySaRyeong: false', (branch) => {
    const analysis = calculateJiJangGanStrengthPrecise(branch, someDate);
    const total = analysis.strengths.reduce((sum, s) => sum + s.strength, 0);
    expect(total).toBe(100);
  });

  it.each(branches)('%s지 — applySaRyeong: true', (branch) => {
    const analysis = calculateJiJangGanStrengthPrecise(branch, someDate, { applySaRyeong: true });
    const total = analysis.strengths.reduce((sum, s) => sum + s.strength, 0);
    expect(total).toBe(100);
  });
});

describe('절기 데이터 범위 밖(1900년 이전) 생년월일은 throw 없이 고정 비율로 폴백한다', () => {
  const outOfRangeDate = new Date(Date.UTC(1850, 0, 1));

  it('solarTerm/daysSinceTermStart는 null이고, 세력은 테이블 원본 비율 그대로다', () => {
    expect(() =>
      calculateJiJangGanStrengthPrecise('인', outOfRangeDate, { applySaRyeong: true })
    ).not.toThrow();

    const analysis = calculateJiJangGanStrengthPrecise('인', outOfRangeDate, {
      applySaRyeong: true,
    });
    expect(analysis.solarTerm).toBeNull();
    expect(analysis.daysSinceTermStart).toBeNull();
    const byStem = Object.fromEntries(analysis.strengths.map((s) => [s.stem, s.strength]));
    expect(byStem).toEqual({ 무: 23, 병: 23, 갑: 54 });
  });
});

describe('toJiJangGanSlot / calculateJiJangGanSlot — role 기준 슬롯 매핑(정기→primary, 중기→secondary, 여기→residual)', () => {
  it('3단계 지지(인)는 primary/secondary/residual이 모두 채워진다', () => {
    const slot = calculateJiJangGanSlot('인', daysAfterIpchun(20), { applySaRyeong: true });
    expect(slot.primary).toEqual({ stem: '갑', strength: 70 });
    expect(slot.secondary).toEqual({ stem: '병', strength: 15 });
    expect(slot.residual).toEqual({ stem: '무', strength: 15 });
  });

  it('2단계 지지(자)는 secondary가 없고 primary(정기)·residual(여기)만 채워진다', () => {
    const slot = calculateJiJangGanSlot('자', daysAfterIpchun(20));
    expect(slot.primary.stem).toBe('계');
    expect(slot.secondary).toBeUndefined();
    expect(slot.residual?.stem).toBe('임');
  });

  it('toJiJangGanSlot은 calculateJiJangGanStrengthPrecise의 strengths를 그대로 슬롯화한다', () => {
    const analysis = calculateJiJangGanStrengthPrecise('사', daysAfterIpchun(20));
    const slot = toJiJangGanSlot(analysis.strengths);
    expect(slot.primary.stem).toBe('병'); // 정기
    expect(slot.secondary?.stem).toBe('경'); // 중기 — 예전 JI_JANG_GAN에서 여기와 뒤바뀌어 있었다
    expect(slot.residual?.stem).toBe('무'); // 여기
  });
});
