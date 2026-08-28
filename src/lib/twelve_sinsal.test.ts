import { describe, expect, it } from 'vitest';
import { getTwelveSinSal } from './twelve_sinsal';
import type { EarthlyBranch } from '../types/index';

const BRANCHES: EarthlyBranch[] = [
  '자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해',
];

describe('인오술(화국) 기준 — 지살=인·장성살=오·화개살=술·역마살=신', () => {
  // 화국(인오술)의 묘고는 술, 그 다음 지지인 해가 겁살 시작.
  // 겁살재살천살지살연살월살망신살장성살반안살역마살육해살화개살 순으로
  // 해자축인묘진사오미신유술 → 인=지살, 오=장성살, 술=화개살, 신=역마살
  it('지살=인', () => {
    expect(getTwelveSinSal('인', '인')).toBe('지살');
  });
  it('장성살=오', () => {
    expect(getTwelveSinSal('인', '오')).toBe('장성살');
  });
  it('화개살=술', () => {
    expect(getTwelveSinSal('인', '술')).toBe('화개살');
  });
  it('역마살=신', () => {
    expect(getTwelveSinSal('인', '신')).toBe('역마살');
  });
  it('겁살=해 (화국의 묘고 술 바로 다음 지지)', () => {
    expect(getTwelveSinSal('인', '해')).toBe('겁살');
  });
});

describe.each([
  ['신', '자', '진'] as const, // 수국 — 겁살=사
  ['해', '묘', '미'] as const, // 목국 — 겁살=신
  ['인', '오', '술'] as const, // 화국 — 겁살=해
  ['사', '유', '축'] as const, // 금국 — 겁살=인
])('삼합국 %s-%s-%s 기준으로 12지지에 12신살이 중복 없이 모두 채워진다', (a, b, c) => {
  it('12개 지지가 서로 다른 12신살을 정확히 한 번씩 채운다', () => {
    const results = BRANCHES.map((br) => getTwelveSinSal(a, br));
    expect(new Set(results).size).toBe(12);
  });

  it('같은 삼합국 소속 지지 셋 중 어느 것을 기준으로 넘겨도 결과가 같다 (겁살 시작점이 같으므로)', () => {
    const fromA = BRANCHES.map((br) => getTwelveSinSal(a, br));
    const fromB = BRANCHES.map((br) => getTwelveSinSal(b, br));
    const fromC = BRANCHES.map((br) => getTwelveSinSal(c, br));
    expect(fromB).toEqual(fromA);
    expect(fromC).toEqual(fromA);
  });
});
