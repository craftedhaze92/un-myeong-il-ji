import { describe, expect, it } from 'vitest';
import { analyzeName } from './jakmeong_analysis';
import type { SajuData } from '../types/index';

/**
 * 이름 오행/성명학 한자 보강(Phase G~I) 회귀 테스트.
 *
 * 예전엔 한자 입력 경로 자체가 없어서 오격(성명학 획수)이 항상 가짜 값(getStrokeCount가
 * 한글 코드포인트를 해싱)이었고, 화면에서도 그래서 숨겨뒀다. 이제 상용 작명 한자 사전
 * (data/naming_hanja_table.ts)에 있는 한자를 입력하면 실제 획수로 오격을 계산한다.
 */

const saju: SajuData = {
  birthDate: '1990-01-01',
  solarBirthDate: '1990-01-01',
  birthTime: '00:00',
  birthCity: '서울',
  calendar: 'solar',
  isLeapMonth: false,
  gender: 'male',
  unknownHour: false,
  year: { stem: '갑', branch: '자', stemElement: '목', branchElement: '수', yinYang: '양' },
  month: { stem: '을', branch: '축', stemElement: '목', branchElement: '토', yinYang: '음' },
  day: { stem: '병', branch: '오', stemElement: '화', branchElement: '화', yinYang: '양' },
  hour: { stem: '정', branch: '사', stemElement: '화', branchElement: '화', yinYang: '음' },
  wuxingCount: { 목: 2, 화: 4, 토: 1, 금: 0, 수: 1 },
  tenGods: [],
};

describe('analyzeName — 한자 없이 호출하면 발음오행만 쓰고 오격은 계산하지 않는다', () => {
  const result = analyzeName('김민준', saju);

  it('모든 글자의 오행이 발음오행(elementSource: 발음)이다', () => {
    result.characters.forEach((c) => {
      expect(c.elementSource).toBe('발음');
      expect(c.strokes).toBeUndefined();
    });
  });

  it('strokeAnalysis.available은 false다', () => {
    expect(result.strokeAnalysis.available).toBe(false);
  });
});

describe('analyzeName — 사전에 있는 한자를 이름 글자 수와 똑같이 입력하면 실제 오격을 계산한다', () => {
  // 金(김, 8획 verified) + 敏(민, 11획 verified) + 俊(준, 9획 verified)
  const result = analyzeName('김민준', saju, '金敏俊');

  it('한자로 매칭된 글자는 자원오행(elementSource: 자원)과 실제 획수를 쓴다', () => {
    expect(result.characters.map((c) => c.elementSource)).toEqual(['자원', '자원', '자원']);
    expect(result.characters.map((c) => c.strokes)).toEqual([8, 11, 9]);
  });

  it('오격(천격/인격/지격/외격/총격)이 손으로 계산한 값과 일치한다', () => {
    expect(result.strokeAnalysis).toMatchObject({
      available: true,
      heavenGround: 9, // 8+1
      personalGround: 19, // 8+11
      earthGround: 20, // 11+9
      outerGround: 18, // 8+9+1
      totalGround: 28, // 8+11+9
      allVerified: true,
    });
  });

  it('81수 길흉표 기준으로 판정된 fortune 문자열이 있다', () => {
    if (result.strokeAnalysis.available) {
      expect(['대길', '길', '평', '흉']).toContain(result.strokeAnalysis.fortune);
    }
  });
});

describe('analyzeName — 한자 길이가 이름과 다르면 조용히 무시하고 발음오행으로 폴백한다', () => {
  it('한자가 이름보다 짧으면 전부 발음오행이다', () => {
    const result = analyzeName('김민준', saju, '金敏'); // 2글자만 입력 — 길이 불일치
    result.characters.forEach((c) => expect(c.elementSource).toBe('발음'));
    expect(result.strokeAnalysis.available).toBe(false);
  });

  it('한자를 아예 빈 문자열로 넘겨도 발음오행으로 폴백한다', () => {
    const result = analyzeName('김민준', saju, '');
    result.characters.forEach((c) => expect(c.elementSource).toBe('발음'));
  });
});

describe('analyzeName — 사전에 없는 한자가 하나라도 섞이면 그 글자만 발음오행으로 대체되고 오격은 계산하지 않는다', () => {
  // 鄭(정, 阝부수라 사전에 의도적으로 없음)을 첫 글자에 섞는다.
  const result = analyzeName('정민준', saju, '鄭敏俊');

  it('사전에 없는 글자만 발음오행으로 대체된다', () => {
    expect(result.characters[0]?.elementSource).toBe('발음');
    expect(result.characters[0]?.strokes).toBeUndefined();
    expect(result.characters[1]?.elementSource).toBe('자원');
    expect(result.characters[2]?.elementSource).toBe('자원');
  });

  it('오격은 부분 성공을 허용하지 않고 available: false에 이유가 담긴다', () => {
    expect(result.strokeAnalysis.available).toBe(false);
    if (!result.strokeAnalysis.available) {
      expect(result.strokeAnalysis.reason).toContain('鄭');
    }
  });
});

describe('analyzeName — 이름이 3글자 미만이면 오격을 계산할 수 없다', () => {
  it('2글자 이름은 한자를 줘도 available: false다', () => {
    const result = analyzeName('김민', saju, '金敏');
    expect(result.strokeAnalysis.available).toBe(false);
  });
});
