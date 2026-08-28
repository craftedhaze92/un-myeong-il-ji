/**
 * 자평진전(子平眞詮) 성격(成格)/파격(破格)/상신(相神) 판단.
 *
 * gyeok_guk.ts#determineGyeokGuk는 격 *이름*만 정한다(월지 지장간 투출법). 하지만 이름이
 * 같아도 그 격이 잘 짜였는지(성격) 깨졌는지(파격)는 전혀 다른 문제다 — 예를 들어 정관격이라도
 * 상관이 함께 투출해 정관을 극하면(상관견관) 파격이다. 이 파일은 그 판단을 전담한다
 * (단일 책임 원칙 — gyeok_guk.ts를 더 무겁게 만들지 않는다).
 *
 * 순용(順用)/역용(逆用): 자평진전의 핵심 구분. 재관인식(財官印食)은 길신이라 생조해서
 * 쓰고(순용), 살상겁인(殺傷劫刃)은 흉신이라 극제해서 쓴다(역용).
 * 참고: https://www.firstname.kr/gnuboard/bbs/board.php?bo_table=notice&wr_id=121&page=2
 *
 * 범위 밖: 합거(合去 — 육합으로 글자가 묶여 기능을 잃는 것)와 형충(刑沖)의 정밀 판정은
 * sajuData.branchRelations의 삼합/삼형/육해 정보가 격 판단에 필요한 "일간·시간과 관련된
 * 천간합" 정보까지는 담고 있지 않아 이번 범위에서는 반영하지 않는다 — 십성 분포(개수)
 * 기준의 혼잡·과다·부재만으로 판단한다. 그래서 brokenBy/rescuedBy는 "근거가 명확한 것만"
 * 담고, 판단이 애매한 경계는 성중유패/패중유구로 완화해 확정처럼 말하지 않는다.
 */

import type { SajuData, TenGod } from '../types/index';
import type { GyeokGuk } from './gyeok_guk';

export interface GyeokGukQualityResult {
  status: '성격' | '파격' | '성중유패' | '패중유구';
  useType: '순용' | '역용';
  /** 상신(相神) — 격을 이루게 하는 핵심 십성 */
  sangSin?: TenGod;
  brokenBy: string[];
  rescuedBy: string[];
  explanation: string;
}

const PRESENCE_THRESHOLD = 0.5; // 지장간 세력까지 반영된 분포값이라 정수 1 미만도 "있음"으로 본다
const EXCESS_THRESHOLD = 2; // 이 이상이면 "과다·혼잡"으로 본다

function count(dist: Record<TenGod, number>, ...gods: TenGod[]): number {
  return gods.reduce((sum, g) => sum + (dist[g] ?? 0), 0);
}
function has(dist: Record<TenGod, number>, god: TenGod): boolean {
  return (dist[god] ?? 0) >= PRESENCE_THRESHOLD;
}

function decideStatus(brokenBy: string[], rescuedBy: string[]): GyeokGukQualityResult['status'] {
  if (brokenBy.length === 0) return '성격';
  if (rescuedBy.length >= brokenBy.length) return '패중유구'; // 파격 요소가 있었지만 구신으로 온전히 구제
  if (rescuedBy.length > 0) return '성중유패'; // 대체로 성격이나 일부 흠이 남음
  return '파격';
}

function isWeakDayMaster(saju: SajuData): boolean {
  const level = saju.dayMasterStrength?.level ?? 'medium';
  return level === 'weak' || level === 'very_weak';
}

/**
 * 격국별 성격/파격 판단. 종격(jong_wang/jong_sal/jong_jae)과 중화격(balanced)은
 * 순용/역용 구분 자체가 적용되지 않는 별개의 판단 체계라 여기서 다루지 않는다
 * (gyeok_guk.ts#checkSpecialGyeokGuk가 이미 종격 여부를 별도로 걸러낸다).
 */
export function analyzeGyeokGukQuality(
  saju: SajuData,
  gyeokGuk: GyeokGuk,
): GyeokGukQualityResult | null {
  const dist = saju.tenGodsDistribution;
  if (!dist) return null;
  if (gyeokGuk === 'jong_wang' || gyeokGuk === 'jong_sal' || gyeokGuk === 'jong_jae' || gyeokGuk === 'balanced') {
    return null;
  }

  const weak = isWeakDayMaster(saju);
  const brokenBy: string[] = [];
  const rescuedBy: string[] = [];
  let useType: '순용' | '역용' = '순용';
  let sangSin: TenGod | undefined;

  switch (gyeokGuk) {
    case 'jeong_gwan': {
      useType = '순용';
      const hasWealthOrResource = count(dist, '정재', '편재') >= PRESENCE_THRESHOLD || count(dist, '정인', '편인') >= PRESENCE_THRESHOLD;
      sangSin = count(dist, '정재', '편재') >= PRESENCE_THRESHOLD ? '정재' : '정인';
      if (has(dist, '상관')) {
        brokenBy.push('상관이 투출해 정관을 극합니다(상관견관)');
        if (count(dist, '정재', '편재') >= PRESENCE_THRESHOLD) rescuedBy.push('재성이 상관의 기운을 정관으로 통관시켜 구제합니다');
        else if (count(dist, '정인', '편인') >= PRESENCE_THRESHOLD) rescuedBy.push('인수가 상관을 제압해 구제합니다');
      }
      if (has(dist, '편관')) brokenBy.push('편관(칠살)이 섞여 관살혼잡을 이룹니다');
      if (weak) brokenBy.push('일간이 약해 정관의 무게를 감당하지 못합니다(신약)');
      if (!hasWealthOrResource) brokenBy.push('재성·인성의 뒷받침이 없어 정관이 고립됩니다');
      break;
    }

    case 'jeong_jae':
    case 'pyeon_jae': {
      useType = '순용';
      const strong = !weak;
      sangSin = strong ? '식신' : '정인';
      const bigeopCount = count(dist, '비견', '겁재');
      if (bigeopCount >= EXCESS_THRESHOLD) brokenBy.push('비겁이 과다해 재성을 다투어 빼앗습니다(군겁쟁재)');
      if (has(dist, '편관') && weak) brokenBy.push('칠살까지 겹쳐 신약한 일간을 더 압박합니다');
      if (strong && count(dist, '식신', '상관') < PRESENCE_THRESHOLD && count(dist, '정관', '편관') < PRESENCE_THRESHOLD) {
        brokenBy.push('일간이 강한데 재성을 생조·보호할 식상이나 관성이 없습니다');
      }
      if (bigeopCount >= EXCESS_THRESHOLD && count(dist, '정관', '편관') >= PRESENCE_THRESHOLD) {
        rescuedBy.push('관성이 비겁을 제압해 재성을 지켜줍니다');
      }
      break;
    }

    case 'jeong_in':
    case 'pyeon_in': {
      useType = '순용';
      // 정인격의 특징: 신약해도 파격이 아니다(유일한 예외) — 오히려 인성이 일간을 도와 자연스럽다.
      sangSin = count(dist, '정관', '편관') >= PRESENCE_THRESHOLD ? '정관' : undefined;
      const wealthCount = count(dist, '정재', '편재');
      if (wealthCount >= EXCESS_THRESHOLD) {
        brokenBy.push('재성이 과다해 인수를 파괴합니다(재파인)');
        if (count(dist, '비견', '겁재') >= PRESENCE_THRESHOLD) rescuedBy.push('비겁이 재성의 힘을 나누어 인수를 지켜줍니다');
        if (count(dist, '정관', '편관') >= PRESENCE_THRESHOLD) rescuedBy.push('관성이 재성의 기운을 인수로 통관시켜 구제합니다');
      }
      if (count(dist, '정인', '편인') >= EXCESS_THRESHOLD + 1 && !weak) {
        brokenBy.push('인성이 지나치게 많아 일간이 오히려 게을러지고 답답해집니다(인성과다)');
      }
      break;
    }

    case 'sig_sin': {
      useType = '순용';
      const hasJae = count(dist, '정재', '편재') >= PRESENCE_THRESHOLD;
      const hasChilSal = has(dist, '편관');
      sangSin = hasJae ? '편재' : hasChilSal ? '편관' : undefined;
      if (!hasJae && !hasChilSal) brokenBy.push('식신을 재성이나 칠살로 이어주지 못해 결실이 없습니다(설기만 하고 거둠이 없음)');
      if (hasJae && hasChilSal) brokenBy.push('재성과 칠살이 동시에 투출해 식신이 감당하기 버겁습니다');
      if (has(dist, '편인')) {
        brokenBy.push('편인(효신)이 식신을 극합니다(효신탈식)');
        if (hasJae) rescuedBy.push('편재가 편인을 견제해 식신을 지켜줍니다');
      }
      break;
    }

    case 'chil_sal': {
      useType = '역용';
      const hasSikSang = count(dist, '식신', '상관') >= PRESENCE_THRESHOLD;
      const hasInseong = count(dist, '정인', '편인') >= PRESENCE_THRESHOLD;
      sangSin = hasSikSang ? '식신' : hasInseong ? '편인' : undefined;
      if (!hasSikSang && !hasInseong) brokenBy.push('칠살을 제압할 식상도, 화(化)할 인성도 없어 칠살이 방치됩니다');
      if (weak && count(dist, '정재', '편재') >= PRESENCE_THRESHOLD) {
        brokenBy.push('일간이 약한데 재성까지 칠살을 도와 신약해집니다(재다신약)');
      }
      break;
    }

    case 'sang_gwan': {
      useType = '역용'; // 상관 자체는 흉신이라 재로 흘리거나(순용적 활용) 인성으로 제압해야(역용) 쓸모가 생긴다
      const hasJae = count(dist, '정재', '편재') >= PRESENCE_THRESHOLD;
      const hasInseong = count(dist, '정인', '편인') >= PRESENCE_THRESHOLD;
      sangSin = hasJae ? '정재' : hasInseong ? '정인' : undefined;
      if (!hasJae && !hasInseong) brokenBy.push('상관생재(재로 설기)도 상관패인(인성으로 제압)도 이루지 못합니다');
      if (has(dist, '정관')) brokenBy.push('정관이 투출해 상관과 정면으로 충돌합니다(상관견관)');
      if (count(dist, '비견', '겁재') >= EXCESS_THRESHOLD) brokenBy.push('비겁이 과다해 상관을 더 부추깁니다');
      break;
    }

    case 'bi_gyeon':
    case 'geob_jae': {
      // 자평진전의 양인격에 해당하는 자리 — 비겁이 강한 격은 반드시 관살로 제압해야 격이 선다.
      useType = '역용';
      const hasGwanSal = count(dist, '정관', '편관') >= PRESENCE_THRESHOLD;
      sangSin = hasGwanSal ? '편관' : undefined;
      if (!hasGwanSal) brokenBy.push('비겁을 제압할 관살이 없어 비겁이 방자해집니다');
      if (count(dist, '비견', '겁재') >= EXCESS_THRESHOLD + 2) brokenBy.push('비겁이 지나치게 많아 관살 하나로는 감당하기 어렵습니다');
      break;
    }

    default:
      return null;
  }

  const status = decideStatus(brokenBy, rescuedBy);
  const statusLabel = { 성격: '성격(成格)', 파격: '파격(破格)', 성중유패: '성중유패(成中有敗)', 패중유구: '패중유구(敗中有救)' }[status];
  const explanation =
    brokenBy.length === 0
      ? `${useType}(${useType === '순용' ? '順用' : '逆用'})의 원리대로 짜임이 좋아 ${statusLabel}입니다.`
      : `${statusLabel} — ${brokenBy.join('; ')}.${rescuedBy.length > 0 ? ` 다만 ${rescuedBy.join('; ')}.` : ''}`;

  return { status, useType, sangSin, brokenBy, rescuedBy, explanation };
}
