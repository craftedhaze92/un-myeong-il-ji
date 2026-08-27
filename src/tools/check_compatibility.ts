/**
 * check_compatibility 도구 구현
 */

import { checkCompatibility } from '../lib/compatibility';
import { calculateSaju } from '../lib/saju';
import type { CalendarType, CompatibilityAnalysis, Gender } from '../types/index';

export interface PersonInfo {
  birthDate: string;
  birthTime: string;
  birthCity?: string;
  calendar?: CalendarType;
  isLeapMonth?: boolean;
  gender: Gender;
}

export interface CheckCompatibilityArgs {
  person1: PersonInfo;
  person2: PersonInfo;
}

export function handleCheckCompatibility(args: CheckCompatibilityArgs): CompatibilityAnalysis {
  const { person1, person2 } = args;

  // 각 사람의 사주 계산
  const sajuData1 = calculateSaju(
    person1.birthDate,
    person1.birthTime,
    person1.calendar || 'solar',
    person1.isLeapMonth || false,
    person1.gender,
    person1.birthCity
  );

  const sajuData2 = calculateSaju(
    person2.birthDate,
    person2.birthTime,
    person2.calendar || 'solar',
    person2.isLeapMonth || false,
    person2.gender,
    person2.birthCity
  );

  // 궁합 분석
  return checkCompatibility(sajuData1, sajuData2);
}

