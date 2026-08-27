/**
 * 사주 오케스트레이션 핸들러 통합 export
 * Tool Handlers Index
 *
 * 원래 MCP 서버 도구 핸들러였던 함수들을 Next.js Route Handler에서
 * 재사용하기 위한 배럴 파일. 각 핸들러는 lib/의 계산 함수를 조합할 뿐,
 * MCP 프로토콜이나 특정 실행 환경에 대한 의존성은 없다.
 */

// 통합 도구
export { handleAnalyzeSaju } from './analyze_saju';
export { handleManageSettings } from './manage_settings';

// 개별 도구
export { handleCheckCompatibility } from './check_compatibility';
export { handleConvertCalendar } from './convert_calendar';
export { handleGetDailyFortune } from './get_daily_fortune';
export { handleGetDaeUn } from './get_dae_un';
export { handleGetFortuneByPeriod } from './get_fortune_by_period';
