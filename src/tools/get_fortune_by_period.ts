/**
 * get_fortune_by_period 통합 도구
 * 시간대별 운세를 하나의 도구로 통합
 */

import type { CalendarType, Gender } from '../types/index';
import { calculateSaju } from '../lib/saju';
import { analyzeSeUn, getMultipleSeUn, type SeUnYear } from '../lib/se_un';
import { analyzeWolUn, type WolUnMonth } from '../lib/wol_un';
import { analyzeIljin, type IljinAnalysis } from '../lib/iljin_analysis';

export type PeriodType = 'year' | 'month' | 'hour' | 'multi-year';

export interface GetFortuneByPeriodArgs {
  birthDate: string;
  birthTime: string;
  birthCity?: string;
  calendar?: CalendarType;
  isLeapMonth?: boolean;
  gender: Gender;
  periodType: PeriodType;
  target?: string; // YYYY (year), YYYY-MM (month), YYYY-MM-DD HH:mm (hour)
  count?: number; // multi-year용 조회 개수
}

export type GetFortuneByPeriodResult = SeUnYear | { years: SeUnYear[]; count: number } | WolUnMonth | IljinAnalysis;

export function handleGetFortuneByPeriod(args: GetFortuneByPeriodArgs): GetFortuneByPeriodResult {
  const {
    birthDate,
    birthTime,
    birthCity,
    calendar = 'solar',
    isLeapMonth = false,
    gender,
    periodType,
    target,
    count = 5,
  } = args;

  // 사주 계산
  const sajuData = calculateSaju(birthDate, birthTime, calendar, isLeapMonth, gender, birthCity);

  switch (periodType) {
    case 'year': {
      if (!target) {
        throw new Error('year 조회 시 target (YYYY) 필수');
      }
      const year = parseInt(target, 10);
      if (isNaN(year)) {
        throw new Error(`유효하지 않은 연도: ${target}`);
      }
      return analyzeSeUn(sajuData, year);
    }

    case 'multi-year': {
      const startYear = target ? parseInt(target, 10) : new Date().getFullYear();
      if (isNaN(startYear)) {
        throw new Error(`유효하지 않은 연도: ${target}`);
      }
      const seUnList = getMultipleSeUn(sajuData, startYear, count);
      return { years: seUnList, count: seUnList.length };
    }

    case 'month': {
      if (!target) {
        throw new Error('month 조회 시 target (YYYY-MM) 필수');
      }
      const parts = target.split('-');
      if (parts.length !== 2) {
        throw new Error(`잘못된 월 형식: ${target}. YYYY-MM 형식 사용`);
      }
      const year = parseInt(parts[0]!, 10);
      const month = parseInt(parts[1]!, 10);
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        throw new Error(`유효하지 않은 월: ${target}`);
      }
      // 해당 연도의 세운 분석하여 yearStem 가져오기
      const seUn = analyzeSeUn(sajuData, year);
      return analyzeWolUn(sajuData, year, month, seUn.stem);
    }

    case 'hour': {
      if (!target) {
        throw new Error('hour 조회 시 target (YYYY-MM-DD HH:mm) 필수');
      }
      const parts = target.split(' ');
      if (parts.length !== 2) {
        throw new Error(`잘못된 일시 형식: ${target}. YYYY-MM-DD HH:mm 형식 사용`);
      }
      const timePart = parts[1];
      const hour = parseInt(timePart!.split(':')[0]!, 10);
      if (isNaN(hour) || hour < 0 || hour > 23) {
        throw new Error(`유효하지 않은 시간: ${hour}`);
      }
      // analyzeIljin은 Date와 SajuData를 받음
      const targetDate = new Date(target.replace(' ', 'T'));
      return analyzeIljin(targetDate, sajuData);
    }

    default:
      throw new Error(`알 수 없는 periodType: ${periodType}`);
  }
}
