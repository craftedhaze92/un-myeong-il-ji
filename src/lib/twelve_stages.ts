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
 *
 * 해석 방법에도 여러 갈래가 있다 — 봉법(逢法, 일간이 다른 자리의 지지를 만나는 관계)·
 * 거법(居法, 각 기둥의 천간이 그 기둥 자신의 지지를 만나는 관계, 자좌운성)·좌법(坐法,
 * 일지와 일지 속 지장간의 관계) 등. `getTwelveStage`는 **봉법만** 구현한다 — 첫 인자는
 * 항상 일간이고, 대운·세운 칸(`ui/ganji-column.tsx`)과 명식 4기둥(`result-panel.tsx`)
 * 모두 이 함수 하나로 "일간 기준" 값을 낸다. 화면 전체가 한 기준으로 통일돼 있다는 뜻이니,
 * 다른 기준(거법 등)을 새로 넣을 때는 별도 함수로 분리할 것 — 이 함수의 시그니처를
 * 재해석해서 쓰지 말 것.
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

/** 통설 3분류 — 장생·관대·건록·제왕(왕) / 목욕·쇠·태·양(평) / 병·사·묘·절(쇠). */
export type TwelveStageBand = '왕' | '평' | '쇠';

export interface TwelveStageInfo {
  hanja: string;
  /** 별칭 — 건록=임관(臨官), 목욕=패(敗), 절=포(胞) 등 다른 문헌에서 쓰는 이름. 없으면 생략. */
  alias?: { name: string; hanja: string };
  /** 인생 12단계 비유 — 태(잉태)부터 절(공백)까지 생로병사 서사에서 이 단계가 맡는 대목. */
  lifeStage: string;
  /**
   * 기운 지수 1(절, 가장 약함)~12(제왕, 가장 왕성). 명리 이론의 정량 수치가 아니라
   * 12단계를 세기로 정렬·표시하기 위한 상대 순위이며, band와 아래처럼 구간이 맞물린다:
   * 9~12=왕, 5~8=평, 1~4=쇠.
   */
  energy: number;
  band: TwelveStageBand;
  keywords: string[];
  description: string;
  /** 이 자리가 잘 쓰일 때 드러나는 면 */
  positive: string;
  /** 이 자리에서 조심해야 할 면 */
  caution: string;
}

export const TWELVE_STAGE_INFO: Record<TwelveStage, TwelveStageInfo> = {
  장생: {
    hanja: '長生',
    lifeStage: '출생 — 갓 태어나 세상에 나옴',
    energy: 9,
    band: '왕',
    keywords: ['시작', '성장', '순수'],
    description: '새로 태어나 뻗어가는 기운. 시작과 성장의 자리.',
    positive: '새로운 시작에 강하고 배움이 빠르며 주변의 지지를 받는다.',
    caution: '경험이 부족해 성급히 나서면 미숙함이 드러날 수 있다.',
  },
  목욕: {
    hanja: '沐浴',
    alias: { name: '패', hanja: '敗' },
    lifeStage: '유년기 — 갓 태어나 씻기고 꾸미는 시기',
    energy: 7,
    band: '평',
    keywords: ['변화', '매력', '불안정'],
    description: '갓 태어나 씻기는 시기. 불안정하고 유혹에 흔들리기 쉬운 자리.',
    positive: '감각이 뛰어나고 사람을 끄는 매력이 있다.',
    caution: '유혹에 흔들리거나 변덕이 심해질 수 있다.',
  },
  관대: {
    hanja: '冠帶',
    lifeStage: '소년기 — 관례를 치르고 세상에 나설 채비',
    energy: 10,
    band: '왕',
    keywords: ['도약', '포부', '미숙'],
    description: '관례를 치르고 세상에 나설 채비를 갖추는 자리.',
    positive: '포부가 크고 앞으로 나아가려는 의지가 강하다.',
    caution: '아직 다듬어지지 않아 자만하거나 성급할 수 있다.',
  },
  건록: {
    hanja: '建祿',
    alias: { name: '임관', hanja: '臨官' },
    lifeStage: '청년기 — 스스로 녹을 세우는 자립기',
    energy: 11,
    band: '왕',
    keywords: ['자립', '실력', '책임'],
    description: '스스로 녹을 세우는 전성기 직전. 실력과 지위가 무르익는 자리.',
    positive: '실력과 지위가 무르익어 스스로 벌어 쓰는 자립심이 강하다.',
    caution: '자기 힘을 과신해 주변과의 협력을 소홀히 할 수 있다.',
  },
  제왕: {
    hanja: '帝旺',
    lifeStage: '장년기 — 인생의 정점',
    energy: 12,
    band: '왕',
    keywords: ['정점', '주도권', '고독'],
    description: '기운이 가장 왕성한 정점. 주도권과 결단력이 최고조에 이르는 자리.',
    positive: '주도권과 결단력이 최고조에 달해 리더십을 발휘한다.',
    caution: '기세가 지나쳐 독선적이거나 고집이 세질 수 있다.',
  },
  쇠: {
    hanja: '衰',
    lifeStage: '장년 후반 — 왕성함이 꺾이기 시작',
    energy: 8,
    band: '평',
    keywords: ['원숙', '보수', '퇴조'],
    description: '왕성함이 꺾이기 시작하는 자리. 노련하지만 기세는 한풀 꺾인다.',
    positive: '노련하고 신중해 무리하지 않는 안정감이 있다.',
    caution: '새로운 도전보다 안주하려는 경향이 강해진다.',
  },
  병: {
    hanja: '病',
    lifeStage: '노년기 — 기운이 눈에 띄게 약해짐',
    energy: 4,
    band: '쇠',
    keywords: ['돌봄', '예민', '성찰'],
    description: '기운이 눈에 띄게 약해지는 자리. 돌봄과 절제가 필요하다.',
    positive: '섬세하고 사려 깊어 남을 살피는 데 능하다.',
    caution: '체력과 의지가 약해져 건강·마음 관리가 필요하다.',
  },
  사: {
    hanja: '死',
    lifeStage: '활동력이 멈추는 자리',
    energy: 3,
    band: '쇠',
    keywords: ['정리', '내면', '단절'],
    description: '활동력이 멈추는 자리. 정리와 마무리에 어울린다.',
    positive: '정리와 마무리에 강하고 한 가지에 몰두하는 집중력이 있다.',
    caution: '활동력이 떨어져 소극적이거나 우울해지기 쉽다.',
  },
  묘: {
    hanja: '墓',
    lifeStage: '기운을 갈무리해 저장하는 자리',
    energy: 2,
    band: '쇠',
    keywords: ['저장', '축적', '은둔'],
    description: '기운을 갈무리해 저장하는 자리. 내성과 축적의 시기.',
    positive: '내실을 다지고 재물·지식을 갈무리하는 능력이 있다.',
    caution: '지나치게 움츠러들거나 집착으로 흐를 수 있다.',
  },
  절: {
    hanja: '絶',
    alias: { name: '포', hanja: '胞' },
    lifeStage: '옛 기운이 완전히 끊기는 공백기',
    energy: 1,
    band: '쇠',
    keywords: ['단절', '전환', '공허'],
    description: '옛 기운이 완전히 끊기는 자리. 다음 순환을 위한 공백기.',
    positive: '묵은 것을 끊고 완전히 새로 시작하는 결단력이 있다.',
    caution: '인연이나 기반이 끊겨 허무함·불안정을 겪기 쉽다.',
  },
  태: {
    hanja: '胎',
    lifeStage: '새 기운이 태동하는 잠재의 시기',
    energy: 5,
    band: '평',
    keywords: ['잠재', '구상', '의존'],
    description: '새 기운이 태동하는 자리. 씨앗이 맺히는 잠재의 시기.',
    positive: '아이디어가 풍부하고 새 가능성을 품는 힘이 있다.',
    caution: '아직 여물지 않아 남에게 기대려는 마음이 강하다.',
  },
  양: {
    hanja: '養',
    lifeStage: '태동한 기운을 기르는 준비기',
    energy: 6,
    band: '평',
    keywords: ['양육', '준비', '보호'],
    description: '태동한 기운을 기르는 자리. 다음 장생을 준비하는 시기.',
    positive: '차분히 힘을 기르며 다음 도약을 준비하는 안정감이 있다.',
    caution: '보호막 안에 머물러 독립이 늦어질 수 있다.',
  },
};

/** `TWELVE_STAGE_INFO[stage].band` 조회 헬퍼. */
export function getTwelveStageBand(stage: TwelveStage): TwelveStageBand {
  return TWELVE_STAGE_INFO[stage].band;
}

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
