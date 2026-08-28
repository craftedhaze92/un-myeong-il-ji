import { describe, expect, it } from 'vitest';
import { analyzeIljin } from './iljin_analysis';
import { calculateSaju, getPreciseSolarTermMonthIndex } from './saju';
import { getDayPillar } from './helpers';
import { EARTHLY_BRANCHES, TWELVE_GODS, TWELVE_GODS_INFO } from './constants';

describe('analyzeIljin 십이신살 — 절기 기준 월지 회귀 테스트', () => {
  // saju.test.ts의 절입 경계 케이스(1992-05-05)를 재사용한다: 근사 계산(date.getMonth() 기반)으로는
  // 이 날짜를 午월로 오판하지만, 실제 입하 절입은 5/5 15:06(KST)이라 자정 시점은 아직 곡우 구간(辰월)이다.
  // 예전엔 calculateTwelveGods가 date.getMonth()로 월지를 근사해 이런 절입 경계 날짜에서
  // 십이신살이 최대 보름 어긋났다.
  const date = new Date(1992, 4, 5); // 로컬 자정
  const saju = calculateSaju('1990-01-01', '12:00', 'solar', false, 'male', '서울');

  it('date.getMonth() 근사와 절기 기준 월지가 실제로 다른 날짜다 (전제 조건)', () => {
    const approxMonthBranchIndex = (date.getMonth() + 2) % 12;
    const preciseMonthBranchIndex = (getPreciseSolarTermMonthIndex(date) + 2) % 12;
    expect(preciseMonthBranchIndex).not.toBe(approxMonthBranchIndex);
  });

  it('십이신살이 date.getMonth() 근사가 아닌 절기 기준 월지로 계산된다', () => {
    const { branch: dayBranch } = getDayPillar(date);
    const preciseMonthBranchIndex = (getPreciseSolarTermMonthIndex(date) + 2) % 12;
    const dayBranchIndex = EARTHLY_BRANCHES.indexOf(dayBranch);
    const expectedGodIndex = (dayBranchIndex - preciseMonthBranchIndex + 12) % 12;
    const expectedGodName = TWELVE_GODS[expectedGodIndex]!;

    const result = analyzeIljin(date, saju);
    expect(result.twelveGods.name).toBe(expectedGodName);
    expect(result.twelveGods.description).toBe(TWELVE_GODS_INFO[expectedGodName]?.desc);
  });
});

describe('analyzeIljin 생일 판정 — solarBirthDate 파싱 회귀 테스트', () => {
  // 예전엔 saju.year.stem + saju.month.stem + saju.day.stem(한글 간지 문자열, 예: "경오무")를
  // new Date()에 그대로 넘겨 항상 Invalid Date가 되었고, 그 결과 생일 판정 분기가
  // 조용히 한 번도 참이 되지 않았다.
  const saju = calculateSaju('1990-05-15', '12:00', 'solar', false, 'male', '서울');

  it('출생일(양력)과 같은 월/일을 조회하면 생일로 판정한다', () => {
    const result = analyzeIljin(new Date(2030, 4, 15), saju);
    expect(result.specialMeaning?.isSpecialDay).toBe(true);
    expect(result.specialMeaning?.reason).toContain('생일');
  });

  it('출생일과 다른 월/일이면서 일지도 겹치지 않는 날은 특별한 의미로 판정하지 않는다', () => {
    const result = analyzeIljin(new Date(2030, 6, 3), saju);
    expect(result.specialMeaning).toBeUndefined();
  });
});
