/**
 * 신살(神殺) 체계
 * 사주에 나타나는 특수한 길흉신
 *
 * 서술 데이터(SIN_SAL_DATA)와 판정 조회표는 `data/sinsal_table.ts`에 분리돼 있다 — 이 파일은
 * 판정 로직과 공개 API만 담는다(johu.ts/johu_table.ts와 같은 관례).
 *
 * `twelve_sinsal.ts`(십이신살, 별개 체계)·`twelve_stages.ts`(십이운성)에서 이미 검증된 산식을
 * 도화·역마·화개·학당귀인·건록·양인살·암록 판정에 그대로 재사용한다 — 같은 계산을 이 파일에서
 * 다시 구현하면 화면 두 곳(대운 칸의 십이신살/십이운성 표시와 이 신살 카드)이 서로 다른 말을
 * 하게 된다.
 */

import type {
  EarthlyBranch,
  HeavenlyStem,
  Pillar,
  SajuData,
  SinSal,
  SinSalHit,
  SinSalInfo,
} from '../types/index';
import { getHeavenlyStemByKorean } from '../data/heavenly_stems';
import { EARTHLY_BRANCHES, getEarthlyBranchByIndex, getEarthlyBranchByKorean } from '../data/earthly_branches';
import { SIX_HARMONY } from './constants';
import { getTwelveStage } from './twelve_stages';
import { getTwelveSinSal } from './twelve_sinsal';
import {
  BAEK_HO_SAL_PILLARS,
  BOK_SEONG_GWI_IN_TABLE,
  CHEON_DEOK_GWI_IN_TABLE,
  CHEON_EUL_GWI_IN_TABLE,
  CHEON_JU_GWI_IN_TABLE,
  GEUM_YEO_ROK_TABLE,
  GEUP_GAK_SAL_TABLE,
  GOE_GANG_SAL_PILLARS,
  GO_RAN_SAL_PILLARS,
  GO_SIN_GWA_SUK_TABLE,
  GWI_MUN_GWAN_SAL_PAIRS,
  HONG_YEOM_SAL_TABLE,
  HYEON_CHIM_SAL_BRANCHES,
  HYEON_CHIM_SAL_STEMS,
  MUN_CHANG_GWI_IN_TABLE,
  SIN_SAL_DATA,
  TAE_GEUK_GWI_IN_TABLE,
  TANG_HWA_SAL_TABLE,
  WOL_DEOK_GWI_IN_TABLE,
  WON_JIN_SAL_PAIRS,
} from '../data/sinsal_table';

export { SIN_SAL_DATA };

type PillarKey = 'year' | 'month' | 'day' | 'hour';

const YANG_STEMS: HeavenlyStem[] = ['갑', '병', '무', '경', '임'];

const ALL_BRANCHES: EarthlyBranch[] = EARTHLY_BRANCHES.map((b) => b.korean);

/** 신살 표시 순서 — 길신 → 중립 → 흉신. 22종이 한꺼번에 잡히면 순서가 없으면 화면이 읽히지 않는다. */
const SIN_SAL_ORDER: SinSal[] = [
  'cheon_eul_gwi_in',
  'cheon_deok_gwi_in',
  'wol_deok_gwi_in',
  'mun_chang_gwi_in',
  'hak_dang_gwi_in',
  'geum_yeo_rok',
  'geon_rok',
  'am_rok',
  'tae_geuk_gwi_in',
  'bok_seong_gwi_in',
  'cheon_ju_gwi_in',
  'hyeop_rok',
  'hwa_gae_sal',
  'yeok_ma_sal',
  'yang_in_sal',
  'do_hwa_sal',
  'baek_ho_sal',
  'goe_gang_sal',
  'hong_yeom_sal',
  'go_sin_sal',
  'gwa_suk_sal',
  'cheon_ra_ji_mang',
  'gong_mang',
  'won_jin_sal',
  'gwi_mun_gwan_sal',
  'hyeon_chim_sal',
  'geup_gak_sal',
  'tang_hwa_sal',
  'go_ran_sal',
];

/** 일간의 건록지(建祿地) — 십이운성이 '건록'이 되는 지지. 암록·협록 계산에 재사용한다. */
export function findGeonRokBranch(dayStem: HeavenlyStem): EarthlyBranch {
  const found = ALL_BRANCHES.find((branch) => getTwelveStage(dayStem, branch) === '건록');
  if (!found) throw new Error(`건록지를 찾을 수 없습니다: ${dayStem}`);
  return found;
}

/**
 * 일주 60갑자가 속한 순(旬)의 공망 지지 2개.
 * 순수(旬首)지지 = (일지 인덱스 − 일간 인덱스 + 12) % 12, 공망 = 순수지지 다음 두 지지.
 */
function getGongMangBranches(dayStem: HeavenlyStem, dayBranch: EarthlyBranch): EarthlyBranch[] {
  const stemIndex = getHeavenlyStemByKorean(dayStem)!.index;
  const branchIndex = getEarthlyBranchByKorean(dayBranch)!.index;
  const sunStart = ((branchIndex - stemIndex) % 12 + 12) % 12;
  return [getEarthlyBranchByIndex(sunStart + 10).korean, getEarthlyBranchByIndex(sunStart + 11).korean];
}

/**
 * 사주에서 신살을 찾아 성립 자리(연/월/일/시)까지 반환한다.
 */
export function findSinSalHits(sajuData: SajuData): SinSalHit[] {
  const dayStem = sajuData.day.stem;
  const dayBranch = sajuData.day.branch;
  const yearBranch = sajuData.year.branch;
  const monthBranch = sajuData.month.branch;

  // 시간 미상이면 시주는 표시용 가짜 값이므로 모든 신살 판정에서 뺀다(천간 기준 신살도 동일).
  const pillarKeys: PillarKey[] = sajuData.unknownHour
    ? ['year', 'month', 'day']
    : ['year', 'month', 'day', 'hour'];
  const pillars: { key: PillarKey; pillar: Pillar }[] = pillarKeys.map((key) => ({
    key,
    pillar: sajuData[key],
  }));

  const hits = new Map<SinSal, Set<PillarKey>>();
  const add = (sinSal: SinSal, key: PillarKey) => {
    if (!hits.has(sinSal)) hits.set(sinSal, new Set());
    hits.get(sinSal)!.add(key);
  };

  // 천을귀인 (일간 → 지지)
  const cheonEulBranches = CHEON_EUL_GWI_IN_TABLE[dayStem];
  for (const { key, pillar } of pillars) {
    if (cheonEulBranches.includes(pillar.branch)) add('cheon_eul_gwi_in', key);
  }

  // 천덕귀인 (월지 → 천간 또는 지지)
  const cheonDeok = CHEON_DEOK_GWI_IN_TABLE[monthBranch];
  for (const { key, pillar } of pillars) {
    if (cheonDeok.target === 'stem' && pillar.stem === cheonDeok.value) add('cheon_deok_gwi_in', key);
    if (cheonDeok.target === 'branch' && pillar.branch === cheonDeok.value) add('cheon_deok_gwi_in', key);
  }

  // 월덕귀인 (월지 삼합국 → 천간)
  const wolDeokEntry = WOL_DEOK_GWI_IN_TABLE.find(([group]) => group.includes(monthBranch));
  if (wolDeokEntry) {
    const [, stemValue] = wolDeokEntry;
    for (const { key, pillar } of pillars) {
      if (pillar.stem === stemValue) add('wol_deok_gwi_in', key);
    }
  }

  // 문창귀인 (일간 → 지지)
  const munChangBranch = MUN_CHANG_GWI_IN_TABLE[dayStem];
  for (const { key, pillar } of pillars) {
    if (pillar.branch === munChangBranch) add('mun_chang_gwi_in', key);
  }

  // 금여록 (일간 → 지지)
  const geumYeoBranch = GEUM_YEO_ROK_TABLE[dayStem];
  for (const { key, pillar } of pillars) {
    if (pillar.branch === geumYeoBranch) add('geum_yeo_rok', key);
  }

  // 홍염살 (일간 → 지지)
  const hongYeomBranch = HONG_YEOM_SAL_TABLE[dayStem];
  for (const { key, pillar } of pillars) {
    if (pillar.branch === hongYeomBranch) add('hong_yeom_sal', key);
  }

  // 태극귀인 (일간 → 지지, 미검증)
  const taeGeukBranches = TAE_GEUK_GWI_IN_TABLE[dayStem];
  for (const { key, pillar } of pillars) {
    if (taeGeukBranches.includes(pillar.branch)) add('tae_geuk_gwi_in', key);
  }

  // 복성귀인 (일간 → 지지, 미검증)
  const bokSeongBranch = BOK_SEONG_GWI_IN_TABLE[dayStem];
  for (const { key, pillar } of pillars) {
    if (pillar.branch === bokSeongBranch) add('bok_seong_gwi_in', key);
  }

  // 천주귀인 (일간의 식신 천간이 건록을 얻는 지지)
  const cheonJuBranch = CHEON_JU_GWI_IN_TABLE[dayStem];
  for (const { key, pillar } of pillars) {
    if (pillar.branch === cheonJuBranch) add('cheon_ju_gwi_in', key);
  }

  // 협록 (건록지를 사이에 끼는 앞·뒤 지지)
  const geonRokBranchForHyeopRok = findGeonRokBranch(dayStem);
  const geonRokIndex = getEarthlyBranchByKorean(geonRokBranchForHyeopRok)!.index;
  const hyeopRokBranches = [
    getEarthlyBranchByIndex(geonRokIndex - 1).korean,
    getEarthlyBranchByIndex(geonRokIndex + 1).korean,
  ];
  for (const { key, pillar } of pillars) {
    if (hyeopRokBranches.includes(pillar.branch)) add('hyeop_rok', key);
  }

  // 현침살 (천간 갑·신 중 하나 + 지지 묘·오·미·신 중 하나, 미검증)
  const hasHyeonChimStem = pillars.some((p) => HYEON_CHIM_SAL_STEMS.includes(p.pillar.stem));
  if (hasHyeonChimStem) {
    for (const { key, pillar } of pillars) {
      if (HYEON_CHIM_SAL_BRANCHES.includes(pillar.branch)) add('hyeon_chim_sal', key);
    }
  }

  // 급각살 (월지가 속한 계절 기준, 대상은 일지·시지)
  const geupGakEntry = GEUP_GAK_SAL_TABLE.find((e) => e.season.includes(monthBranch));
  if (geupGakEntry) {
    for (const { key, pillar } of pillars) {
      if (key === 'year' || key === 'month') continue;
      if (geupGakEntry.target.includes(pillar.branch)) add('geup_gak_sal', key);
    }
  }

  // 탕화살 (일지가 인·오·축일 때만, 대상은 월지·시지, 미검증)
  const tangHwaTargets = TANG_HWA_SAL_TABLE[dayBranch];
  if (tangHwaTargets) {
    for (const { key, pillar } of pillars) {
      if (key === 'year' || key === 'day') continue;
      if (tangHwaTargets.includes(pillar.branch)) add('tang_hwa_sal', key);
    }
  }

  // 고란살 (일주 전용 — 년/월/시에 같은 간지가 있어도 무관)
  if (GO_RAN_SAL_PILLARS.some(([s, b]) => s === dayStem && b === dayBranch)) {
    add('go_ran_sal', 'day');
  }

  // 학당귀인(장생) · 건록 · 양인살(양간의 제왕) — 십이운성 재사용
  for (const { key, pillar } of pillars) {
    const stage = getTwelveStage(dayStem, pillar.branch);
    if (stage === '장생') add('hak_dang_gwi_in', key);
    if (stage === '건록') add('geon_rok', key);
    if (stage === '제왕' && YANG_STEMS.includes(dayStem)) add('yang_in_sal', key);
  }

  // 암록 — 건록지를 육합(六合)하는 지지
  const geonRokBranch = findGeonRokBranch(dayStem);
  const amRokBranch = SIX_HARMONY[geonRokBranch];
  for (const { key, pillar } of pillars) {
    if (pillar.branch === amRokBranch) add('am_rok', key);
  }

  // 백호살 · 괴강살 — 기둥의 (천간, 지지) 조합이 고정 목록과 일치할 때
  for (const { key, pillar } of pillars) {
    if (BAEK_HO_SAL_PILLARS.some(([s, b]) => s === pillar.stem && b === pillar.branch)) {
      add('baek_ho_sal', key);
    }
    if (GOE_GANG_SAL_PILLARS.some(([s, b]) => s === pillar.stem && b === pillar.branch)) {
      add('goe_gang_sal', key);
    }
  }

  // 고신살 · 과숙살 — 연지가 속한 방합 기준
  const goSinGwaSuk = GO_SIN_GWA_SUK_TABLE.find((e) => e.banghap.includes(yearBranch));
  if (goSinGwaSuk) {
    for (const { key, pillar } of pillars) {
      if (pillar.branch === goSinGwaSuk.goSin) add('go_sin_sal', key);
      if (pillar.branch === goSinGwaSuk.gwaSuk) add('gwa_suk_sal', key);
    }
  }

  // 천라지망 — 술+해가 함께 있으면 천라, 진+사가 함께 있으면 지망
  const branchSet = new Set(pillars.map((p) => p.pillar.branch));
  const hasCheonRa = branchSet.has('술') && branchSet.has('해');
  const hasJiMang = branchSet.has('진') && branchSet.has('사');
  if (hasCheonRa || hasJiMang) {
    for (const { key, pillar } of pillars) {
      if (hasCheonRa && (pillar.branch === '술' || pillar.branch === '해')) add('cheon_ra_ji_mang', key);
      if (hasJiMang && (pillar.branch === '진' || pillar.branch === '사')) add('cheon_ra_ji_mang', key);
    }
  }

  // 도화살(연살) · 역마살 · 화개살 — 일지 기준 십이신살 재사용. 기준 자리인 일지 자신은 제외.
  for (const { key, pillar } of pillars) {
    if (key === 'day') continue;
    const sinsal = getTwelveSinSal(dayBranch, pillar.branch);
    if (sinsal === '연살') add('do_hwa_sal', key);
    if (sinsal === '역마살') add('yeok_ma_sal', key);
    if (sinsal === '화개살') add('hwa_gae_sal', key);
  }

  // 공망 — 일주가 속한 순(旬)의 공망 지지. 년·월·시지가 대상(일지는 구조적으로 절대 해당 안 됨).
  const gongMangBranches = getGongMangBranches(dayStem, dayBranch);
  for (const { key, pillar } of pillars) {
    if (key === 'day') continue;
    if (gongMangBranches.includes(pillar.branch)) add('gong_mang', key);
  }

  // 원진살 · 귀문관살 — 지지 짝
  for (const [a, b] of WON_JIN_SAL_PAIRS) {
    const pa = pillars.filter((p) => p.pillar.branch === a);
    const pb = pillars.filter((p) => p.pillar.branch === b);
    if (pa.length > 0 && pb.length > 0) {
      for (const p of [...pa, ...pb]) add('won_jin_sal', p.key);
    }
  }
  for (const [a, b] of GWI_MUN_GWAN_SAL_PAIRS) {
    const pa = pillars.filter((p) => p.pillar.branch === a);
    const pb = pillars.filter((p) => p.pillar.branch === b);
    if (pa.length > 0 && pb.length > 0) {
      for (const p of [...pa, ...pb]) add('gwi_mun_gwan_sal', p.key);
    }
  }

  const result: SinSalHit[] = [];
  for (const sinSal of SIN_SAL_ORDER) {
    const pillarSet = hits.get(sinSal);
    if (pillarSet && pillarSet.size > 0) {
      result.push({ sinSal, pillars: pillarKeys.filter((k) => pillarSet.has(k)) });
    }
  }
  return result;
}

/**
 * 사주에서 신살 찾기 (기존 시그니처 유지 — findSinSalHits에서 파생)
 */
export function findSinSals(sajuData: SajuData): SinSal[] {
  return findSinSalHits(sajuData).map((hit) => hit.sinSal);
}

/**
 * 신살 정보 조회
 */
export function getSinSalInfo(sinSal: SinSal): SinSalInfo {
  return {
    sinSal,
    ...SIN_SAL_DATA[sinSal],
  };
}

/**
 * 신살 기반 특수 해석
 */
export function interpretBySinSal(
  sinSals: SinSal[]
): {
  /** "이름(한자)" 형태 — 여러 개를 나열하는 문장에 쓴다 */
  blessingNames: string[];
  warningNames: string[];
  /** "이름(한자): 설명" 형태 — 개별 항목을 상세히 보여줄 때 쓴다 */
  blessings: string[];
  warnings: string[];
  specialAdvice: string[];
} {
  const warnings: string[] = [];
  const blessings: string[] = [];
  const blessingNames: string[] = [];
  const warningNames: string[] = [];
  const specialAdvice: string[] = [];

  sinSals.forEach((sinSal) => {
    const info = getSinSalInfo(sinSal);
    const label = `${info.name}(${info.hanja})`;

    if (info.type === 'lucky') {
      blessings.push(`${label}: ${info.description}`);
      blessingNames.push(label);
      specialAdvice.push(...info.advice);
    } else if (info.type === 'unlucky') {
      warnings.push(`${label}: ${info.description}`);
      warningNames.push(label);
      specialAdvice.push(...info.advice);
    } else {
      // neutral
      blessings.push(`${label}: ${info.description}`);
      blessingNames.push(label);
      warnings.push(`${label}의 부정적 측면`);
      warningNames.push(label);
      specialAdvice.push(...info.advice);
    }
  });

  return { warnings, blessings, warningNames, blessingNames, specialAdvice };
}

/**
 * 모든 신살 정보 가져오기
 */
export function getAllSinSalInfo(sinSals: SinSal[]): SinSalInfo[] {
  return sinSals.map(getSinSalInfo);
}
