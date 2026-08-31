import { describe, expect, it } from 'vitest';
import {
  calculateJiJangGanStrengthPrecise,
  calculateJiJangGanSlot,
  toJiJangGanSlot,
} from './jijanggan_precise';
import { JIJANGGAN_STRENGTH_DETAILED, BRANCH_TOTAL_DAYS } from '../data/jijanggan_strength_table';
import type { EarthlyBranch } from '../types/index';

const ALL_BRANCHES: EarthlyBranch[] = [
  '자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해',
];

describe('지장간 세력은 지지별 고정 일수비례 비율표를 그대로 쓴다 (사령 가중 없음)', () => {
  it.each(ALL_BRANCHES)('%s지 — 세력 합이 정확히 100이다', (branch) => {
    const strengths = calculateJiJangGanStrengthPrecise(branch);
    const total = strengths.reduce((sum, s) => sum + s.strength, 0);
    expect(total).toBe(100);
  });

  it.each(ALL_BRANCHES)('%s지 — JIJANGGAN_STRENGTH_DETAILED의 phase.days 합이 BRANCH_TOTAL_DAYS와 일치한다', (branch) => {
    // 데이터 무결성 검증: 여기+중기+정기 일수가 그 지지의 절기 총 일수와 어긋나면
    // 비율표 자체가 잘못됐다는 뜻이다.
    const totalPhaseDays = JIJANGGAN_STRENGTH_DETAILED[branch].reduce((sum, p) => sum + p.days, 0);
    expect(totalPhaseDays).toBe(BRANCH_TOTAL_DAYS[branch]);
  });

  it('같은 지지는 몇 번을 계산해도 항상 같은 값이다 (날짜 입력이 없으므로 당연히 결정론적)', () => {
    const a = calculateJiJangGanStrengthPrecise('인');
    const b = calculateJiJangGanStrengthPrecise('인');
    expect(a).toEqual(b);
  });
});

describe('사(巳)의 정기/중기/여기 순서 — 예전 JI_JANG_GAN 버그의 회귀 테스트', () => {
  // 예전 earthly_branches.ts#JI_JANG_GAN은 사(巳)의 중기/여기가 뒤바뀌어 있었다
  // (secondary: 무, residual: 경 — 실제로는 정기 丙·중기 庚·여기 戊가 맞다).
  // 지금은 JIJANGGAN_STRENGTH_DETAILED에서 파생하므로 순서가 맞아야 한다.
  it('정기는 병(丙), 중기는 경(庚), 여기는 무(戊)다', () => {
    const strengths = calculateJiJangGanStrengthPrecise('사');
    const byRole = Object.fromEntries(strengths.map((s) => [s.role, s.stem]));
    expect(byRole['정기']).toBe('병');
    expect(byRole['중기']).toBe('경');
    expect(byRole['여기']).toBe('무');
  });

  it('toJiJangGanSlot으로 변환해도 같은 순서가 유지된다 (primary=병, secondary=경, residual=무)', () => {
    const slot = calculateJiJangGanSlot('사');
    expect(slot.primary).toEqual({ stem: '병', strength: 48 });
    expect(slot.secondary).toEqual({ stem: '경', strength: 29 });
    expect(slot.residual).toEqual({ stem: '무', strength: 23 });
  });
});

describe('toJiJangGanSlot / calculateJiJangGanSlot — role 기준 슬롯 매핑(정기→primary, 중기→secondary, 여기→residual)', () => {
  it('3단계 지지(인)는 primary/secondary/residual이 모두 채워진다', () => {
    const slot = calculateJiJangGanSlot('인');
    expect(slot.primary).toEqual({ stem: '갑', strength: 54 });
    expect(slot.secondary).toEqual({ stem: '병', strength: 23 });
    expect(slot.residual).toEqual({ stem: '무', strength: 23 });
  });

  it('2단계 지지(자·묘·유)는 secondary가 없고 primary(정기)·residual(여기)만 채워진다', () => {
    // 예전 JI_JANG_GAN은 자·묘·유의 여기(壬·甲·庚)가 통째로 빠져 있었다.
    const ja = calculateJiJangGanSlot('자');
    expect(ja.primary).toEqual({ stem: '계', strength: 67 });
    expect(ja.secondary).toBeUndefined();
    expect(ja.residual).toEqual({ stem: '임', strength: 33 });

    const myo = calculateJiJangGanSlot('묘');
    expect(myo.primary.stem).toBe('을');
    expect(myo.secondary).toBeUndefined();
    expect(myo.residual?.stem).toBe('갑');

    const yu = calculateJiJangGanSlot('유');
    expect(yu.primary.stem).toBe('신');
    expect(yu.secondary).toBeUndefined();
    expect(yu.residual?.stem).toBe('경');
  });

  it('toJiJangGanSlot은 calculateJiJangGanStrengthPrecise의 결과를 그대로 슬롯화한다', () => {
    const strengths = calculateJiJangGanStrengthPrecise('진');
    const slot = toJiJangGanSlot(strengths);
    expect(slot.primary.stem).toBe('무'); // 정기
    expect(slot.secondary?.stem).toBe('계'); // 중기
    expect(slot.residual?.stem).toBe('을'); // 여기
  });
});
