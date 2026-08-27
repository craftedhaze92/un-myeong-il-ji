/**
 * convert_calendar 도구 구현
 * 로컬 테이블 기반 음양력 변환 (1900-2200)
 */

import { convertCalendar, isValidDate } from '../lib/calendar';
import type { CalendarConversion, CalendarType } from '../types/index';

export interface ConvertCalendarArgs {
  date: string;
  fromCalendar: CalendarType;
  toCalendar: CalendarType;
}

export function handleConvertCalendar(args: ConvertCalendarArgs): CalendarConversion {
  // 입력 검증
  if (!isValidDate(args.date)) {
    throw new Error(`유효하지 않은 날짜 형식입니다: ${args.date}. YYYY-MM-DD 형식을 사용하세요.`);
  }

  // 달력 변환 (로컬 테이블 사용). fromCalendar === toCalendar인 경우도
  // convertCalendar()가 자체적으로 처리한다.
  return convertCalendar(args.date, args.fromCalendar, args.toCalendar);
}
