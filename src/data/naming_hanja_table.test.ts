import { describe, expect, it } from 'vitest';
import { NAMING_HANJA_TABLE } from './naming_hanja_table';

/**
 * 상용 작명 한자 사전 스팟체크 — 웹 검색으로 직접 대조한 원획(原劃) 총획수만 고정한다.
 * 참고: https://www.knaming.org/05_2.html (원획/필획 차이), https://kimtaku.com/news/6125
 */
describe('NAMING_HANJA_TABLE — 직접 대조한 원획 총획수 회귀 고정', () => {
  it('河(물 하)는 삼수변을 水(4획)로 보는 원획법으로 9획이다(필획으로는 8획)', () => {
    expect(NAMING_HANJA_TABLE['河']?.strokes).toBe(9);
    expect(NAMING_HANJA_TABLE['河']?.strokesVerified).toBe(true);
  });

  it('潤(윤택할 윤)은 원획법으로 16획이다', () => {
    expect(NAMING_HANJA_TABLE['潤']?.strokes).toBe(16);
  });

  it('敏·俊·賢·榮은 부수 대체가 필요 없어 필획=원획으로 11·9·15·15획이다', () => {
    expect(NAMING_HANJA_TABLE['敏']?.strokes).toBe(11);
    expect(NAMING_HANJA_TABLE['俊']?.strokes).toBe(9);
    expect(NAMING_HANJA_TABLE['賢']?.strokes).toBe(15);
    expect(NAMING_HANJA_TABLE['榮']?.strokes).toBe(15);
  });
});

describe('NAMING_HANJA_TABLE — 자원오행 신뢰도(elementVerified)는 부수가 오행에 직접 대응할 때만 true', () => {
  it('金(성씨 김/쇠 금)은 금속 부수라 elementVerified: true다', () => {
    expect(NAMING_HANJA_TABLE['金']).toMatchObject({ element: '금', elementVerified: true });
  });

  it('民(백성 민)은 부수(氏)가 오행에 대응하지 않아 elementVerified: false다', () => {
    expect(NAMING_HANJA_TABLE['民']?.elementVerified).toBe(false);
  });

  it('河(물 하)는 삼수변이 오행(수)에 직접 대응해 elementVerified: true다', () => {
    expect(NAMING_HANJA_TABLE['河']).toMatchObject({ element: '수', elementVerified: true });
  });
});

describe('NAMING_HANJA_TABLE — 원획 보정이 복잡한 부수(阝·辶·罒)가 든 한자는 의도적으로 뺐다', () => {
  it('鄭·陳·進·蓮·遠·道는 사전에 없다', () => {
    for (const hanja of ['鄭', '陳', '進', '蓮', '遠', '道']) {
      expect(NAMING_HANJA_TABLE[hanja]).toBeUndefined();
    }
  });
});
