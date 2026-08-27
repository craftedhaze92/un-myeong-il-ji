/**
 * analyze_saju 통합 도구
 * 모든 사주 분석 기능을 하나로 통합
 */

import type { CalendarType, Gender, FortuneAnalysisType, SajuData, FortuneAnalysis } from '../types/index';
import type { SchoolCode, YongSinMethod, UserInterpretationSettings, SchoolComparisonResult } from '../types/interpretation';
import type { YongSinAnalysis } from '../lib/yong_sin';
import type { YongSinResult } from '../lib/yongsin/base';
import { calculateSaju } from '../lib/saju';
import { analyzeFortune } from '../lib/fortune';
import { selectYongSin as selectYongSinOrig } from '../lib/yong_sin';
import { SchoolComparator } from '../lib/school_comparator';
import { selectYongSin } from '../lib/yongsin/selector';

export type AnalysisType = 
  | 'basic'           // 기본 사주팔자 계산
  | 'fortune'         // 운세 분석
  | 'yongsin'         // 용신 분석
  | 'school_compare'  // 유파 비교
  | 'yongsin_method'; // 용신 방법론

export interface AnalyzeSajuArgs {
  birthDate: string;
  birthTime: string;
  /** 출생 시군구 (longitude_table 키: 서울, 부산, 제주 등). 생략 시 서울 */
  birthCity?: string;
  calendar?: CalendarType;
  isLeapMonth?: boolean;
  gender: Gender;
  analysisType: AnalysisType;
  
  // fortune용
  fortuneType?: FortuneAnalysisType;

  // school_compare용
  schools?: Array<'ziping' | 'dts' | 'qtbj' | 'modern' | 'shensha'>;
  /** school_compare 시 필수. 호출부(Route Handler)가 결정한 해석 설정값을 그대로 전달한다. */
  settings?: UserInterpretationSettings;

  // yongsin_method용
  method?: 'strength' | 'seasonal' | 'mediation' | 'disease';
}

export type AnalyzeSajuResult =
  | SajuData
  | FortuneAnalysis
  | YongSinAnalysis
  | SchoolComparisonResult
  | YongSinResult;

export async function handleAnalyzeSaju(args: AnalyzeSajuArgs): Promise<AnalyzeSajuResult> {
  const {
    birthDate,
    birthTime,
    birthCity,
    calendar = 'solar',
    isLeapMonth = false,
    gender,
    analysisType,
    fortuneType,
    schools,
    settings,
    method,
  } = args;

  // 사주 계산
  const sajuData = calculateSaju(birthDate, birthTime, calendar, isLeapMonth, gender, birthCity);

  switch (analysisType) {
    case 'basic':
      // 기본 사주팔자만 반환
      return sajuData;

    case 'fortune': {
      if (!fortuneType) {
        throw new Error('fortune 분석 시 fortuneType 필수');
      }
      return analyzeFortune(sajuData, fortuneType);
    }

    case 'yongsin':
      return selectYongSinOrig(sajuData);

    case 'school_compare': {
      if (!settings) {
        throw new Error('school_compare 분석 시 settings 필수');
      }
      const schoolList: SchoolCode[] = schools || ['ziping', 'dts', 'qtbj', 'modern', 'shensha'];
      return SchoolComparator.compareSchools(sajuData, schoolList, settings);
    }

    case 'yongsin_method': {
      if (!method) {
        throw new Error('yongsin_method 분석 시 method 필수');
      }
      return selectYongSin(sajuData, method as YongSinMethod);
    }

    default:
      throw new Error(`알 수 없는 analysisType: ${analysisType}`);
  }
}
