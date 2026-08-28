/**
 * 십이운성(十二運星) — 일간이 각 지지 위에서 갖는 생명 주기 12단계.
 *
 * 순서: 장생(長生)·목욕(沐浴)·관대(冠帶)·건록(建祿)·제왕(帝旺)·쇠(衰)·병(病)·사(死)·
 * 묘(墓)·절(絶)·태(胎)·양(養).
 *
 * 산식: 일간별 장생 지지에서 시작해 양간은 지지 순서대로 순행, 음간은 역행한다
 * (무토·기토는 각각 병화·정화와 같은 표를 쓰는 화토동법火土同法).
 *
 * 음간의 순역에는 두 학파가 있다(음간도 순행시키는 학파도 있음). 이 저장소는 벤치마크한
 * 점신(占神) 서비스의 화면을 역산해 검증한 "음간 역행" 학파를 따른다 — 점신 대운 스크린샷의
 * 십성(辛=비견 → 일간 신금, 음간)으로 미루어 신금 기준 자=목욕·해=목욕이 아니라 신금의
 * 장생인 자(子)에서 역행했을 때만 화면의 午 병·未 쇠·申 제왕·酉 건록·戌 관대·亥 목욕과
 * 정확히 일치했다.
 */

import type { EarthlyBranch, HeavenlyStem } from '../types/index';
import { getEarthlyBranchByKorean } from '../data/earthly_branches';
import { getHeavenlyStemByKorean } from '../data/heavenly_stems';

export type TwelveStage =
  | '장생'
  | '목욕'
  | '관대'
  | '건록'
  | '제왕'
  | '쇠'
  | '병'
  | '사'
  | '묘'
  | '절'
  | '태'
  | '양';

export const TWELVE_STAGE_ORDER: TwelveStage[] = [
  '장생',
  '목욕',
  '관대',
  '건록',
  '제왕',
  '쇠',
  '병',
  '사',
  '묘',
  '절',
  '태',
  '양',
];

export const TWELVE_STAGE_INFO: Record<
  TwelveStage,
  { hanja: string; description: string }
> = {
  장생: { hanja: '長生', description: '새로 태어나 뻗어가는 기운. 시작과 성장의 자리.' },
  목욕: { hanja: '沐浴', description: '갓 태어나 씻기는 시기. 불안정하고 유혹에 흔들리기 쉬운 자리.' },
  관대: { hanja: '冠帶', description: '관례를 치르고 세상에 나설 채비를 갖추는 자리.' },
  건록: { hanja: '建祿', description: '스스로 녹을 세우는 전성기 직전. 실력과 지위가 무르익는 자리.' },
  제왕: { hanja: '帝旺', description: '기운이 가장 왕성한 정점. 주도권과 결단력이 최고조에 이르는 자리.' },
  쇠: { hanja: '衰', description: '왕성함이 꺾이기 시작하는 자리. 노련하지만 기세는 한풀 꺾인다.' },
  병: { hanja: '病', description: '기운이 눈에 띄게 약해지는 자리. 돌봄과 절제가 필요하다.' },
  사: { hanja: '死', description: '활동력이 멈추는 자리. 정리와 마무리에 어울린다.' },
  묘: { hanja: '墓', description: '기운을 갈무리해 저장하는 자리. 내성과 축적의 시기.' },
  절: { hanja: '絶', description: '옛 기운이 완전히 끊기는 자리. 다음 순환을 위한 공백기.' },
  태: { hanja: '胎', description: '새 기운이 태동하는 자리. 씨앗이 맺히는 잠재의 시기.' },
  양: { hanja: '養', description: '태동한 기운을 기르는 자리. 다음 장생을 준비하는 시기.' },
};

/** 일간별 장생(長生) 지지. 무토·기토는 각각 병화·정화와 같다(화토동법). */
const START_BRANCH: Record<HeavenlyStem, EarthlyBranch> = {
  갑: '해',
  을: '오',
  병: '인',
  정: '유',
  무: '인',
  기: '유',
  경: '사',
  신: '자',
  임: '신',
  계: '묘',
};

export function getTwelveStage(
  dayStem: HeavenlyStem,
  branch: EarthlyBranch,
): TwelveStage {
  const stemData = getHeavenlyStemByKorean(dayStem)!;
  const startBranch = START_BRANCH[dayStem];
  const startIndex = getEarthlyBranchByKorean(startBranch)!.index;
  const targetIndex = getEarthlyBranchByKorean(branch)!.index;

  const isYang = stemData.yinYang === '양';
  const offset = isYang
    ? (targetIndex - startIndex + 12) % 12
    : (startIndex - targetIndex + 12) % 12;

  return TWELVE_STAGE_ORDER[offset]!;
}
