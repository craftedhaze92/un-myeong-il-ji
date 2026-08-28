import { describe, expect, it } from 'vitest';
import { findSinSals } from './sin_sal';
import type { EarthlyBranch, SajuData } from '../types/index';

/**
 * 네 지지만 지정해 최소한의 합성 SajuData를 만든다. 천간·오행 등은 신살 판정과
 * 무관한 필드라 임의값을 채운다.
 */
function makeSaju(branches: [EarthlyBranch, EarthlyBranch, EarthlyBranch, EarthlyBranch]): SajuData {
  const [yearBranch, monthBranch, dayBranch, hourBranch] = branches;
  return {
    birthDate: '1990-01-01',
    solarBirthDate: '1990-01-01',
    birthTime: '00:00',
    birthCity: '서울',
    calendar: 'solar',
    isLeapMonth: false,
    gender: 'male',
    unknownHour: false,
    year: { stem: '갑', branch: yearBranch, stemElement: '목', branchElement: '목', yinYang: '양' },
    month: { stem: '을', branch: monthBranch, stemElement: '목', branchElement: '목', yinYang: '음' },
    day: { stem: '병', branch: dayBranch, stemElement: '화', branchElement: '화', yinYang: '양' },
    hour: { stem: '정', branch: hourBranch, stemElement: '화', branchElement: '화', yinYang: '음' },
    wuxingCount: { 목: 2, 화: 2, 토: 2, 금: 1, 수: 1 },
    tenGods: [],
  };
}

describe('귀문관살은 지정된 6개 짝 조합일 때만 성립한다 — 인·신·사·해 중 2개 이상이면 성립하던 오판정 회귀', () => {
  const validPairs: [EarthlyBranch, EarthlyBranch][] = [
    ['진', '해'],
    ['오', '축'],
    ['사', '술'],
    ['묘', '신'],
    ['인', '미'],
    ['자', '유'],
  ];

  it.each(validPairs)('%s-%s 조합이 있으면 귀문관살이 성립한다', (a, b) => {
    // 나머지 두 지지는 어떤 조합과도 겹치지 않는 '축'/'미' 등으로 채우면 오탐 우려가 있으니
    // 조합과 무관한 지지(여기서는 짝에 없는 지지 중 하나)로 채운다.
    const filler = (['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as EarthlyBranch[]).find(
      (br) => br !== a && br !== b
    )!;
    const saju = makeSaju([a, b, filler, filler]);
    expect(findSinSals(saju)).toContain('gwi_mun_gwan_sal');
  });

  it('예전 버그 조합(인+신, 2개 이상이면 성립하던 규칙)은 더 이상 성립하지 않는다 — 인신은 유효한 짝이 아님', () => {
    const saju = makeSaju(['인', '신', '자', '축']);
    expect(findSinSals(saju)).not.toContain('gwi_mun_gwan_sal');
  });

  it('예전 버그 조합(사+해)도 유효한 짝이 아니므로 성립하지 않는다', () => {
    const saju = makeSaju(['사', '해', '자', '축']);
    expect(findSinSals(saju)).not.toContain('gwi_mun_gwan_sal');
  });

  it('관련 지지가 하나도 없으면 성립하지 않는다', () => {
    const saju = makeSaju(['자', '축', '자', '축']);
    expect(findSinSals(saju)).not.toContain('gwi_mun_gwan_sal');
  });
});
