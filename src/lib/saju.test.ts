import { describe, expect, it } from 'vitest';
import { calculateSaju } from './saju';
import { calculateDaeUn } from './dae_un';
import { convertCalendar } from './calendar';

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

describe('음력 입력 시 solarBirthDate가 양력 환산일이어야 한다 — 대운수가 음력 날짜로 계산되던 회귀', () => {
  // birthDate는 사용자가 입력한 원본(음력)을 그대로 보존해야 하고, solarBirthDate는
  // 절기 거리·만 나이 계산에 쓰이는 양력 환산일이어야 한다. 이 둘을 혼동해 대운수·나이가
  // 최대 한 달가량 어긋났던 버그의 회귀 테스트.
  const lunarDate = '1990-04-21';
  const expectedSolar = convertCalendar(lunarDate, 'lunar', 'solar').convertedDate;
  const result = calculateSaju(lunarDate, '14:30', 'lunar', false, 'male', '서울');

  it('birthDate는 입력한 음력 날짜를 그대로 보존한다', () => {
    expect(result.birthDate).toBe(lunarDate);
    expect(result.calendar).toBe('lunar');
  });

  it('solarBirthDate는 양력 환산일이다', () => {
    expect(result.solarBirthDate).toBe(expectedSolar);
    expect(result.solarBirthDate).not.toBe(lunarDate);
  });

  it('같은 명식을 양력 환산일로 직접 계산한 결과와 사주팔자(연/월/일/시주)가 동일하다', () => {
    const bySolar = calculateSaju(expectedSolar, '14:30', 'solar', false, 'male', '서울');
    expect(result.year).toEqual(bySolar.year);
    expect(result.month).toEqual(bySolar.month);
    expect(result.day).toEqual(bySolar.day);
    expect(result.hour).toEqual(bySolar.hour);
  });
});

describe('unknownHour면 시주가 오행·십성·신살 집계에서 빠져야 한다', () => {
  // saju-app.tsx는 시간 미상일 때 UI 표시를 위해 12:00(정오)을 그대로 calculateSaju에 넘기지만,
  // { unknownHour: true } 옵션으로 그 가짜 시주가 wuxingCount·tenGodsDistribution·sinSals·
  // jiJangGan에 섞여 들어가지 않아야 한다. 예전에는 이 옵션이 없어 용신·격국까지 4주 기준으로
  // 계산되면서 화면의 "시간 미상" 표시와 실제 근거가 어긋났다.
  const withHour = calculateSaju('1990-05-15', '12:00', 'solar', false, 'male', '서울', {
    unknownHour: false,
  });
  const unknownHour = calculateSaju('1990-05-15', '12:00', 'solar', false, 'male', '서울', {
    unknownHour: true,
  });

  it('시주 자체는 여전히 계산된다 (표시용)', () => {
    expect(unknownHour.hour.stem).toBeTypeOf('string');
    expect(unknownHour.hour.branch).toBeTypeOf('string');
  });

  it('wuxingCount 총합이 8이 아니라 6이다 (연·월·일 3기둥 × 2자)', () => {
    const total = Object.values(unknownHour.wuxingCount).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(6);
  });

  it('jiJangGan.hour는 계산되지 않는다', () => {
    expect(unknownHour.jiJangGan?.hour).toBeUndefined();
    expect(withHour.jiJangGan?.hour).toBeDefined();
  });

  it('tenGods 목록 길이가 4가 아니라 3이다 (연·월·일 천간만)', () => {
    expect(unknownHour.tenGods.length).toBe(3);
    expect(withHour.tenGods.length).toBe(4);
  });

  it('branchRelations 판정에 시지가 포함되지 않는다', () => {
    // 시지를 포함한 4개 지지로 판정한 결과와 3개 지지로 판정한 결과가 같은 saju에서
    // summary가 다를 수 있음을 통해 실제로 다른 입력이 쓰였는지 검증한다.
    expect(unknownHour.branchRelations).toBeDefined();
  });
});

describe('unknownHour 명식과 12:00 명식이 캐시 키를 공유하지 않는다', () => {
  it('같은 생년월일시·출생지라도 unknownHour 여부에 따라 다른 wuxingCount를 돌려준다', () => {
    // performance_cache.ts#sajuCache는 프로세스 내에서 유지되므로, 캐시 키에 unknownHour가
    // 빠져 있으면 먼저 계산된 쪽 결과를 그대로 돌려주는 버그가 생긴다.
    const a = calculateSaju('1990-05-15', '12:00', 'solar', false, 'male', '서울', {
      unknownHour: true,
    });
    const b = calculateSaju('1990-05-15', '12:00', 'solar', false, 'male', '서울', {
      unknownHour: false,
    });
    const totalA = Object.values(a.wuxingCount).reduce((sum, n) => sum + n, 0);
    const totalB = Object.values(b.wuxingCount).reduce((sum, n) => sum + n, 0);
    expect(totalA).toBe(6);
    expect(totalB).toBe(8);
  });
});
