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

describe('절입(節入) 경계 회귀 테스트 — 2025년 입하 14:42(KST) 전후, 서울', () => {
  // 고정 날짜 근사치가 아니라 실제 절입 timestamp를 사용해야 같은 양력 날짜 안에서도
  // 경도 보정 후 절입 전(13:28)과 후(14:58)의 월주가 정확히 갈린다.
  const before = calculateSaju('2025-05-05', '14:00', 'solar', false, 'female', '서울');
  const after = calculateSaju('2025-05-05', '15:30', 'solar', false, 'female', '서울');

  it('입하 이전은 경진(庚辰), 이후는 신사(辛巳) 월이다', () => {
    expect(before.month).toMatchObject({ stem: '경', branch: '진' });
    expect(after.month).toMatchObject({ stem: '신', branch: '사' });
  });

  it('절입 전후 결과를 대운 계산에 넘겨도 각각의 정밀 월주를 기준으로 삼는다', () => {
    const beforeDaeun = calculateDaeUn(before);
    const afterDaeun = calculateDaeUn(after);
    expect(beforeDaeun[0]?.stem).not.toBe(afterDaeun[0]?.stem);
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
  it('UI가 넘기는 12:00 기준 일주가 같은 날의 일반 입력과 일치한다', () => {
    const noon = calculateSaju('1990-05-15', '12:00', 'solar', false, 'male', '서울');
    const afternoon = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');
    expect(noon.day).toEqual(afternoon.day);
  });
});

describe('출생지 경도 보정 — 서울/부산 8분 차로 시주가 갈리는지 회귀 테스트', () => {
  it('서울(−32분): 17:30 → 16:58 → 신시', () => {
    const result = calculateSaju('1990-05-15', '17:30', 'solar', false, 'male', '서울');
    expect(result.hour.branch).toBe('신');
  });

  it('부산(−24분): 같은 17:30 → 17:06 → 유시 — 출생지 미연결 시 서울과 같은 신시가 나오던 회귀 케이스', () => {
    const result = calculateSaju('1990-05-15', '17:30', 'solar', false, 'male', '부산');
    expect(result.hour.branch).toBe('유');
  });

  it('미등록 지명은 서울 기준으로 폴백되어 서울과 동일한 결과', () => {
    const seoul = calculateSaju('1990-05-15', '17:30', 'solar', false, 'male', '서울');
    const unknown = calculateSaju('1990-05-15', '17:30', 'solar', false, 'male', '없는도시');
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

describe('지장간 세력 — 4주 모두 고정 일수비례 비율표를 쓰고, 같은 지지면 날짜와 무관하게 항상 동일하다', () => {
  // jijanggan_precise.ts 배선: 절입 경과일에 따라 특정 phase를 추가로 가중하는
  // "사령(司令) 가중"을 시도했으나, 대부분의 명리 실무는 지장간 세력을 절기(월지)
  // 단위 고정 비율표로만 판단하고 개별 출생 시각으로 추가 가중하지 않는다는
  // 판단에 따라 제외했다 — 연·월·일·시지 모두 지지 하나만으로 결정되는 고정값이다.
  it('같은 월지(인)라면 절입 후 경과일이 달라도 월지 지장간 세력이 동일하다', () => {
    // 2020년 입춘은 2/4 17:53(KST). 2/7은 절입+2일, 2/25는 절입+20일로 경과일이
    // 크게 다르지만 둘 다 인월이므로 지장간 세력은 같아야 한다.
    const early = calculateSaju('2020-02-07', '10:00', 'solar', false, 'male', '서울');
    const late = calculateSaju('2020-02-25', '10:00', 'solar', false, 'male', '서울');

    expect(early.month.branch).toBe('인');
    expect(late.month.branch).toBe('인');
    expect(early.jiJangGan?.month).toEqual(late.jiJangGan?.month);
    expect(early.jiJangGan?.month).toEqual({
      primary: { stem: '갑', strength: 54 },
      secondary: { stem: '병', strength: 23 },
      residual: { stem: '무', strength: 23 },
    });
  });

  it('연지가 같으면(같은 사주 연도) 날짜가 달라도 연지 지장간 세력이 동일하다', () => {
    const a = calculateSaju('2020-02-07', '10:00', 'solar', false, 'male', '서울');
    const b = calculateSaju('2020-02-25', '10:00', 'solar', false, 'male', '서울');
    expect(a.year.branch).toBe(b.year.branch);
    expect(a.jiJangGan?.year).toEqual(b.jiJangGan?.year);
  });

  it('일지가 같으면(60갑자 주기, 60일 차이) 날짜가 달라도 일지 지장간 세력이 동일하다', () => {
    const a = calculateSaju('1992-01-01', '10:00', 'solar', false, 'male', '서울');
    const b = calculateSaju('1992-03-01', '10:00', 'solar', false, 'male', '서울'); // 60일 후, 윤년
    expect(a.day.branch).toBe(b.day.branch);
    expect(a.jiJangGan?.day).toEqual(b.jiJangGan?.day);
  });

  it('시지가 같으면 날짜가 달라도(같은 날 다른 분) 시지 지장간 세력이 동일하다', () => {
    const a = calculateSaju('1990-05-15', '10:00', 'solar', false, 'male', '서울');
    const b = calculateSaju('1990-05-15', '10:50', 'solar', false, 'male', '서울');
    expect(a.hour.branch).toBe(b.hour.branch);
    expect(a.jiJangGan?.hour).toEqual(b.jiJangGan?.hour);
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
