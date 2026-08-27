/**
 * manage_settings 도구
 * 프리셋 이름 → 해석 설정값(UserInterpretationSettings) 변환
 *
 * 원래는 프로세스 전역 InterpretationSettings 싱글턴에 "현재 설정"을 저장하고
 * action: 'get' | 'set'으로 조회/변경하는 구조였다. Route Handler처럼 요청마다
 * 별도로 처리되는 서버에서는 그 인메모리 상태가 동시 요청 간에 새어나가므로
 * (한 사용자의 설정 변경이 다른 사용자의 analyze_saju 결과에 영향을 줌) 그대로
 * 옮길 수 없다.
 *
 * 이 함수는 아무 상태도 갖지 않는다: presetName을 UserInterpretationSettings로
 * 변환만 하고, 그 결과를 호출부(Route Handler)가 들고 있다가 analyze_saju의
 * school_compare 등에 매 요청 인자로 전달해야 한다. action: 'get'은 서버가
 * 상태를 안 가지므로 조회할 대상이 없어 제거했고, custom(세부 가중치 직접 지정)
 * 필드는 기존 구현에서도 실제로는 쓰이지 않던 죽은 필드라 함께 제거했다.
 */

import { DEFAULT_PRESETS } from '../data/school_presets';
import type { UserInterpretationSettings } from '../types/interpretation';

export interface ManageSettingsArgs {
  preset: string;
}

export function handleManageSettings(args: ManageSettingsArgs): UserInterpretationSettings {
  const preset = (DEFAULT_PRESETS as Record<string, UserInterpretationSettings>)[args.preset];

  if (!preset) {
    const validPresets = Object.keys(DEFAULT_PRESETS).join(', ');
    throw new Error(`알 수 없는 preset: ${args.preset}. 사용 가능한 값: ${validPresets}`);
  }

  return preset;
}
