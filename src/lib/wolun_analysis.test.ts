import { describe, expect, it } from 'vitest';
import { calculateSaju } from './saju';
import { getDayPillar } from './helpers';
import { analyzeWolun, analyzeYearlyWolun } from './wolun_analysis';

describe('월지·월간 계산이 절기 기준(양력 2월=인월)과 어긋나던 회귀 — 예전엔 1월=인월로 한 달 당겨져 있었다', () => {
  const saju = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');

  it('2026년(병오년) 3월은 경인월 다음인 신묘월이다', () => {
    // 오호둔: 병(또는 신)년은 인월이 경인월부터 시작 → 3월(묘월)은 그 다음 천간인 신
    expect(analyzeWolun(saju, 2026, 3).monthPillar).toBe('신묘');
  });

  it('2024년(갑진년) 2월은 갑기년 규칙의 정월인 병인월이다', () => {
    expect(analyzeWolun(saju, 2024, 2).monthPillar).toBe('병인');
  });

  it('양력 1월은 절기상 아직 인월이 아니라 전년도 마지막 절기월인 축월이다', () => {
    expect(analyzeWolun(saju, 2024, 1).monthBranch).toBe('축');
  });

  it('analyzeYearlyWolun은 1~12월 12개를 절기 기준 월지 순서(축 다음 인)로 낸다', () => {
    const months = analyzeYearlyWolun(saju, 2024);
    expect(months.map((m) => m.month)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
    expect(months[0]!.monthBranch).toBe('축'); // 1월
    expect(months[1]!.monthBranch).toBe('인'); // 2월
    expect(months[11]!.monthBranch).toBe('자'); // 12월
  });
});

describe('월운 길일/흉일은 가짜 순환(day % 12)이 아니라 실제 일진을 써야 한다', () => {
  const saju = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');

  it('specialDays.luckyDates로 나온 날짜는 실제로 일지가 일간과 육합인 날이다', () => {
    const analysis = analyzeWolun(saju, 2024, 5);
    const sixHarmony: Record<string, string> = {
      자: '축', 축: '자', 인: '해', 해: '인', 묘: '술', 술: '묘',
      진: '유', 유: '진', 사: '신', 신: '사', 오: '미', 미: '오',
    };

    expect(analysis.specialDays.luckyDates.length).toBeGreaterThan(0);
    analysis.specialDays.luckyDates.forEach((day) => {
      const { branch } = getDayPillar(new Date(2024, 4, day)); // month=5 → index 4
      expect(sixHarmony[branch]).toBe(saju.day.branch);
    });
  });

  it('specialDays.unluckyDates로 나온 날짜는 실제로 일지가 일간과 충인 날이다', () => {
    const analysis = analyzeWolun(saju, 2024, 5);
    const conflicts: Record<string, string> = {
      자: '오', 오: '자', 축: '미', 미: '축', 인: '신', 신: '인',
      묘: '유', 유: '묘', 진: '술', 술: '진', 사: '해', 해: '사',
    };

    analysis.specialDays.unluckyDates.forEach((day) => {
      const { branch } = getDayPillar(new Date(2024, 4, day));
      expect(conflicts[branch]).toBe(saju.day.branch);
    });
  });
});
