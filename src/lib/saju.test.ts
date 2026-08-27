import { describe, expect, it } from 'vitest';
import { calculateSaju } from './saju';
import { calculateDaeUn } from './dae_un';

describe('calculateSaju smoke test', () => {
  const result = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');

  it('computes the year pillar as 경오 (BASE_YEAR=4 arithmetic: (1990-4)%10=6→경, (1990-4)%12=6→오; matches the well-known 1990=경오년(백말띠))', () => {
    expect(result.year.stem).toBe('경');
    expect(result.year.branch).toBe('오');
  });

  it('returns all four pillars with valid, defined stem/branch/element fields', () => {
    for (const pillar of [result.year, result.month, result.day, result.hour]) {
      expect(pillar.stem).toBeTypeOf('string');
      expect(pillar.branch).toBeTypeOf('string');
      expect(pillar.stemElement).toBeTypeOf('string');
      expect(pillar.branchElement).toBeTypeOf('string');
      expect(['음', '양']).toContain(pillar.yinYang);
    }
  });

  it('wuxingCount always sums to exactly 8 (4 pillars × stem + branch)', () => {
    const total = Object.values(result.wuxingCount).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(8);
  });

  it('echoes back the input metadata unchanged', () => {
    expect(result.birthDate).toBe('1990-05-15');
    expect(result.birthTime).toBe('14:30');
    expect(result.calendar).toBe('solar');
    expect(result.gender).toBe('male');
    expect(result.birthCity).toBe('서울');
  });
});

describe('절입(節入) 경계 회귀 테스트 — 1992.05.05 유시(18:00) 남성, 서울', () => {
  // 근사 절기표(SOLAR_TERM_APPROXIMATE_DATES)로는 입하를 5/6로 잘못 취급해
  // 곡우 구간(辰월)으로 오판했던 버그의 회귀 케이스. 실제 1992년 입하는 5/5 15:06(KST)로
  // 출생 시각(경도 보정 후 17:28) 이후이므로 巳월이 맞다.
  const result = calculateSaju('1992-05-05', '18:00', 'solar', false, 'male', '서울');

  it('연주는 임신(壬申)', () => {
    expect(result.year.stem).toBe('임');
    expect(result.year.branch).toBe('신');
  });

  it('월주는 을사(乙巳) — 근사 절기표로는 갑진(甲辰)이 되는 회귀 케이스', () => {
    expect(result.month.stem).toBe('을');
    expect(result.month.branch).toBe('사');
  });

  it('일주는 신사(辛巳)', () => {
    expect(result.day.stem).toBe('신');
    expect(result.day.branch).toBe('사');
  });

  it('시주는 정유(丁酉) — 시진 드롭다운·경도 보정 이중 적용으로 丙申이 되던 회귀 케이스', () => {
    expect(result.hour.stem).toBe('정');
    expect(result.hour.branch).toBe('유');
  });

  it('대운 3구간(30-39세)이 무신(戊申), 절입 기준 대운수 10 — 월주 오류 전파의 회귀 케이스', () => {
    const daeUn = calculateDaeUn(result);
    expect(daeUn[0]?.startAge).toBe(10);
    expect(daeUn[2]).toMatchObject({ stem: '무', branch: '신', startAge: 30, endAge: 39 });
  });
});

describe('절입 직전 경계 — 1992.05.05 10:00 (입하 15:06 이전, 서울)', () => {
  it('월주는 아직 곡우 절기 구간(청명절 기준)이므로 갑진(甲辰)', () => {
    const result = calculateSaju('1992-05-05', '10:00', 'solar', false, 'male', '서울');
    expect(result.month.stem).toBe('갑');
    expect(result.month.branch).toBe('진');
  });
});

describe('입춘 경계 — 1992.02.04 22:47(KST) 전후 연주 회귀 테스트, 서울', () => {
  it('입춘 이전(경도 보정 후 22:28)은 전년도 신미(辛未)년', () => {
    const before = calculateSaju('1992-02-04', '23:00', 'solar', false, 'male', '서울');
    expect(before.year.stem).toBe('신');
    expect(before.year.branch).toBe('미');
  });

  it('입춘 이후(경도 보정 후 22:58)는 임신(壬申)년', () => {
    const after = calculateSaju('1992-02-04', '23:30', 'solar', false, 'male', '서울');
    expect(after.year.stem).toBe('임');
    expect(after.year.branch).toBe('신');
  });
});

describe('시간 미상 — 정오로 계산해 일주가 하루 밀리지 않는지 회귀 테스트', () => {
  it('UI가 넘기는 12:00 기준으로도 일주는 신사(辛巳) 유지 (00:00을 썼다면 경도 보정으로 전날로 밀렸을 것)', () => {
    const result = calculateSaju('1992-05-05', '12:00', 'solar', false, 'male', '서울');
    expect(result.day.stem).toBe('신');
    expect(result.day.branch).toBe('사');
  });
});

describe('출생지 경도 보정 — 서울/부산 8분 차로 시주가 갈리는지 회귀 테스트', () => {
  it('서울(−32분): 17:30 → 16:58 → 병신(丙申)', () => {
    const result = calculateSaju('1992-05-05', '17:30', 'solar', false, 'male', '서울');
    expect(result.hour.stem).toBe('병');
    expect(result.hour.branch).toBe('신');
  });

  it('부산(−24분): 같은 17:30 → 17:06 → 정유(丁酉) — 출생지 미연결 시 서울과 같은 丙申이 나오던 회귀 케이스', () => {
    const result = calculateSaju('1992-05-05', '17:30', 'solar', false, 'male', '부산');
    expect(result.hour.stem).toBe('정');
    expect(result.hour.branch).toBe('유');
  });

  it('미등록 지명은 서울 기준으로 폴백되어 서울과 동일한 결과', () => {
    const seoul = calculateSaju('1992-05-05', '17:30', 'solar', false, 'male', '서울');
    const unknown = calculateSaju('1992-05-05', '17:30', 'solar', false, 'male', '없는도시');
    expect(unknown.hour.stem).toBe(seoul.hour.stem);
    expect(unknown.hour.branch).toBe(seoul.hour.branch);
    expect(unknown.birthCity).toBe('서울');
  });
});
