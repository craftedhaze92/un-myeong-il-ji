/**
 * get_daily_fortune 도구 구현
 */

import { getDailyFortune } from '../lib/fortune';
import { calculateSaju } from '../lib/saju';
import { isValidDate } from '../lib/calendar';
import type { CalendarType, DailyFortune, Gender } from '../types/index';

export interface GetDailyFortuneArgs {
  birthDate: string;
  birthTime: string;
  birthCity?: string;
  calendar?: CalendarType;
  isLeapMonth?: boolean;
  gender: Gender;
  targetDate: string;
}

export function handleGetDailyFortune(args: GetDailyFortuneArgs): DailyFortune {
  const {
    birthDate,
    birthTime,
    birthCity,
    calendar = 'solar',
    isLeapMonth = false,
    gender,
    targetDate,
  } = args;

  // 입력 검증
  if (!isValidDate(targetDate)) {
    throw new Error(`유효하지 않은 날짜 형식입니다: ${targetDate}. YYYY-MM-DD 형식을 사용하세요.`);
  }

  // 사주 계산
  const sajuData = calculateSaju(birthDate, birthTime, calendar, isLeapMonth, gender, birthCity);

  // 일일 운세 생성
  return getDailyFortune(sajuData, targetDate);
}

