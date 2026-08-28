/**
 * 십이신살(十二神煞) — 기준 지지(연지 또는 일지)의 삼합국을 기준으로 12지지 각각에
 * 붙는 자리. 겁살·재살·천살·지살·연살·월살·망신살·장성살·반안살·역마살·육해살·화개살
 * 순서로, 삼합국의 마지막 글자(묘고) 다음 지지부터 순행한다.
 *
 * sin_sal.ts의 SinSal(천을귀인·도화살 등 15종)과는 계산 방식이 전혀 다른 별개 체계라
 * 이 파일로 분리한다. 전통적으로는 연지를 기준으로 삼았으나, 현대 명리에서는 일지를
 * 기준으로 보는 쪽이 대세이므로 이 모듈은 일지를 기본값으로 한다(호출부에서 연지를
 * 넘기면 연지 기준도 그대로 계산 가능).
 */

import type { EarthlyBranch } from '../types/index';
import { getEarthlyBranchByKorean } from '../data/earthly_branches';

export type TwelveSinSal =
  | '겁살'
  | '재살'
  | '천살'
  | '지살'
  | '연살'
  | '월살'
  | '망신살'
  | '장성살'
  | '반안살'
  | '역마살'
  | '육해살'
  | '화개살';

const TWELVE_SINSAL_ORDER: TwelveSinSal[] = [
  '겁살',
  '재살',
  '천살',
  '지살',
  '연살',
  '월살',
  '망신살',
  '장성살',
  '반안살',
  '역마살',
  '육해살',
  '화개살',
];

/**
 * 삼합국별 겁살 시작 지지 — 삼합의 마지막 글자(묘고) 바로 다음 지지.
 * 신자진(수국, 묘고=진) → 사, 해묘미(목국, 묘고=미) → 신,
 * 인오술(화국, 묘고=술) → 해, 사유축(금국, 묘고=축) → 인
 */
const SAM_HAP_GROUPS: [EarthlyBranch, EarthlyBranch, EarthlyBranch, EarthlyBranch][] = [
  ['신', '자', '진', '사'],
  ['해', '묘', '미', '신'],
  ['인', '오', '술', '해'],
  ['사', '유', '축', '인'],
];

function getGeopsalStartBranch(baseBranch: EarthlyBranch): EarthlyBranch {
  const group = SAM_HAP_GROUPS.find(([a, b, c]) => a === baseBranch || b === baseBranch || c === baseBranch);
  if (!group) throw new Error(`알 수 없는 지지: ${baseBranch}`);
  return group[3];
}

/**
 * @param baseBranch 기준 지지 (기본적으로 일지를 넘기는 것을 권장. 연지 기준도 동일 함수로 계산 가능)
 * @param target 신살을 판정할 대상 지지
 */
export function getTwelveSinSal(
  baseBranch: EarthlyBranch,
  target: EarthlyBranch,
): TwelveSinSal {
  const startBranch = getGeopsalStartBranch(baseBranch);
  const startIndex = getEarthlyBranchByKorean(startBranch)!.index;
  const targetIndex = getEarthlyBranchByKorean(target)!.index;
  const offset = (targetIndex - startIndex + 12) % 12;
  return TWELVE_SINSAL_ORDER[offset]!;
}
