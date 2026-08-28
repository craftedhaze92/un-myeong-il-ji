import { describe, expect, it } from 'vitest';
import { analyzeSiUn, getDailySiUn } from './si_un';
import { calculateSaju } from './saju';
import { getDayPillar } from './helpers';

// 오자시두법(五子時頭法): 일간에 따른 자시(子時) 천간. si_un.ts 내부의 firstHourStems와 동일한
// 고정 표 — 이 표 자체의 정확성은 이 테스트의 검증 대상이 아니라, "어느 날짜의 일간에 표를
// 적용하는지"가 검증 대상이다.
const FIRST_HOUR_STEM: Record<string, string> = {
  갑: '갑', 을: '병', 병: '무', 정: '경', 무: '임',
  기: '갑', 경: '병', 신: '무', 임: '경', 계: '임',
};

describe('analyzeSiUn — targetDate의 일간으로 시두법을 적용해야 하는 회귀 테스트', () => {
  // 과거엔 analyzeSiUn이 sajuData.day.stem(출생일 일간)을 그대로 시두법에 넘겨서,
  // targetDate를 아무리 바꿔도 항상 출생일 기준 시운이 나오는 버그가 있었다.
  const saju = calculateSaju('1985-03-10', '10:00', 'solar', false, 'male', '서울');
  const targetDate = '2024-06-20';
  const targetDayPillar = getDayPillar(new Date(2024, 5, 20));

  it('출생일과 조회 날짜의 일간이 다른 표본을 쓴다 (전제 조건)', () => {
    expect(saju.day.stem).toBe('무');
    expect(targetDayPillar.stem).toBe('을');
  });

  it('자시(23:00) 시두법이 조회 날짜(targetDate)의 일간을 기준으로 계산된다', () => {
    const result = analyzeSiUn(saju, targetDate, 23);
    expect(result.stem).toBe(FIRST_HOUR_STEM[targetDayPillar.stem]);
    // 회귀 시 나왔을 값(출생일 일간 기준)과는 달라야 한다.
    expect(result.stem).not.toBe(FIRST_HOUR_STEM[saju.day.stem]);
  });

  it('getDailySiUn으로 하루 12시진을 조회해도 모두 targetDate 기준 일간을 쓴다', () => {
    const hours = getDailySiUn(saju, targetDate);
    const ziHour = hours.find((h) => h.branchName === '자시');
    expect(ziHour?.stem).toBe(FIRST_HOUR_STEM[targetDayPillar.stem]);
  });
});
