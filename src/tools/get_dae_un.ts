/**
 * get_dae_un 도구 핸들러
 * 대운(大運) 조회 기능
 */

import { calculateSaju } from '../lib/saju';
import { calculateDaeUn, getDaeUnAtAge, type DaeUnPeriod } from '../lib/dae_un';
import type { CalendarType, Gender } from '../types/index';
import { getManAgeForFortuneYear } from '../utils/date';

export interface GetDaeUnArgs {
  birthDate: string;
  birthTime: string;
  birthCity?: string;
  calendar?: CalendarType;
  isLeapMonth?: boolean;
  gender: Gender;
  /** 특정 만 나이의 대운 조회 (targetYear와 동시에 주면 targetYear 우선) */
  age?: number;
  /** 운이 들어오는 양력 연도 — 해당 연도 말 기준 만 나이로 대운 구간 조회 */
  targetYear?: number;
  limit?: number;
}

export interface GetDaeUnResult {
  daeUnList: DaeUnPeriod[];
  /** age 또는 targetYear가 주어졌을 때만 존재 */
  resolvedAge?: number;
  /** resolvedAge에 해당하는 대운. 해당 나이의 대운을 찾지 못하면 null */
  current?: DaeUnPeriod | null;
}

export function handleGetDaeUn(args: GetDaeUnArgs): GetDaeUnResult {
  const {
    birthDate,
    birthTime,
    birthCity,
    calendar = 'solar',
    isLeapMonth = false,
    gender,
    age,
    targetYear,
    limit = 10,
  } = args;

  // 1. 사주 계산
  const sajuData = calculateSaju(birthDate, birthTime, calendar, isLeapMonth, gender, birthCity);

  // 2. 대운 계산
  const daeUnPeriods = calculateDaeUn(sajuData);

  const resolvedAge =
    targetYear !== undefined ? getManAgeForFortuneYear(birthDate, targetYear) : age;

  const result: GetDaeUnResult = {
    daeUnList: daeUnPeriods.slice(0, limit),
  };

  // 3. 특정 만 나이(또는 운 연도 기준 만 나이)의 대운 조회
  if (resolvedAge !== undefined) {
    result.resolvedAge = resolvedAge;
    result.current = getDaeUnAtAge(sajuData, resolvedAge);
  }

  return result;
}
