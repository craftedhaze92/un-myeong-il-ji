/**
 * 여러 명식(받침 조합이 다른 일간·월지 조합)으로 실제 서술 엔진을 돌려
 * 생성된 모든 문자열에 조사 오류가 없는지 확인하는 회귀 테스트.
 *
 * 단위 테스트(korean.test.ts)는 josa() 자체의 규칙을 검증하지만, 이 테스트는
 * "서술 문장을 조립하는 코드가 실제로 josa()를 쓰고 있는지"를 검증한다 —
 * `이(가)` 같은 이중 표기를 남겨두거나 조사를 하드코딩하면 여기서 잡힌다.
 */
import { describe, expect, it } from 'vitest';
import { calculateSaju } from './saju';
import { calculateDaeUn } from './dae_un';
import { analyzeSeyun } from './seyun_analysis';
import { buildReadingViewModel } from '../components/saju/reading-view-model';

// 오행/천간/지지/십성의 받침 유무를 korean.ts 구현과 무관하게 손으로 정리한 정답표.
// (korean.ts에 버그가 생겨도 이 표까지 같이 틀릴 일은 없어야 회귀 테스트로서 의미가 있다)
const BATCHIM_GROUND_TRUTH: Record<string, boolean> = {
  // 오행
  목: true, 화: false, 토: false, 금: true, 수: false,
  // 천간
  갑: true, 을: true, 병: true, 정: true, 무: false,
  기: false, 경: true, 신: true, 임: true, 계: false,
  // 지지
  자: false, 축: true, 인: true, 묘: false, 진: true,
  사: false, 오: false, 미: false, 유: false, 술: true, 해: false,
  // 십성
  비견: true, 겁재: false, 식신: true, 상관: true, 편재: false,
  정재: false, 편관: true, 정관: true, 편인: true, 정인: true,
};

/** 이중 표기(이(가), 을(를) 등)가 하나라도 남아있으면 실패 */
function findDoubleNotation(texts: string[]): string[] {
  const pattern = /[가-힣]+\((이|가|은|는|을|를|과|와)\)/g;
  const hits: string[] = [];
  for (const text of texts) {
    const matches = text.match(pattern);
    if (matches) hits.push(...matches.map((m) => `"${m}" in: ${text}`));
  }
  return hits;
}

/**
 * 정답표에 있는 단어 뒤에 조사가 곧바로 붙은(사이에 공백/괄호 없이) 자리를 찾아
 * 받침 규칙을 어겼는지 확인한다. 다음 글자가 한글이 아닐 때만 매치해
 * "화이팅"처럼 조사가 아닌 부분과 혼동하지 않는다.
 */
function findBatchimViolations(texts: string[]): string[] {
  const violations: string[] = [];

  for (const [word, batchim] of Object.entries(BATCHIM_GROUND_TRUTH)) {
    const wrongIga = batchim ? '가' : '이';
    const wrongEunNeun = batchim ? '는' : '은';
    const wrongEulReul = batchim ? '를' : '을';
    const wrongGwaWa = batchim ? '와' : '과';

    const wrongParticles = [wrongIga, wrongEunNeun, wrongEulReul, wrongGwaWa];

    for (const particle of wrongParticles) {
      // 앞뒤로 한글 음절이 이어지면 "건축가"의 "축가"처럼 단어 중간을 잘못 집는 것이므로
      // 대상 단어가 독립된 토큰일 때만(앞: 한글 아님, 뒤: 한글 아님) 검사한다.
      const re = new RegExp(`(?<![가-힣])${word}${particle}(?![가-힣])`, 'g');
      for (const text of texts) {
        if (re.test(text)) {
          violations.push(`"${word}${particle}" (받침 ${batchim ? '있음' : '없음'}이어야 하는데 반대 조사) in: ${text}`);
        }
      }
    }
  }

  return violations;
}

/** 객체를 재귀적으로 훑어 모든 string leaf를 모은다 */
function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectStrings(v, out));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => collectStrings(v, out));
  }
  return out;
}

// 일간·월지의 받침 조합이 서로 다른 명식들을 골라 검사 범위를 넓힌다.
const SAMPLE_BIRTHS: Array<[string, string, 'male' | 'female']> = [
  ['1992-05-05', '17:50', 'male'],   // 일간 경금(받침 O) — 원본 버그 리포트 명식
  ['1990-03-15', '09:30', 'female'], // 일간 무토(받침 X) 대조군
  ['1988-11-02', '22:10', 'male'],
  ['1985-07-20', '03:45', 'female'],
  ['2001-01-10', '13:00', 'male'],
];

describe('여러 명식에서 생성된 서술 문장에 조사 오류가 없다', () => {
  const allTexts: string[] = [];

  SAMPLE_BIRTHS.forEach(([date, time, gender]) => {
    const saju = calculateSaju(date, time, 'solar', false, gender, '서울');
    const daeUn = calculateDaeUn(saju);
    const vm = buildReadingViewModel({ saju, daeUn, nowYear: 2026 });
    collectStrings(vm, allTexts);

    // 세운은 여러 해를 돌려 년간·년지 조합을 더 넓게 훑는다 (충돌 문구, balanceChange 등).
    for (let year = 2020; year <= 2032; year++) {
      const seyun = analyzeSeyun(saju, year);
      collectStrings(seyun, allTexts);
    }
  });

  it('스모크: 문자열이 실제로 수집되었다', () => {
    expect(allTexts.length).toBeGreaterThan(50);
  });

  it('"이(가)", "을(를)" 같은 이중 표기가 남아있지 않다', () => {
    const hits = findDoubleNotation(allTexts);
    expect(hits).toEqual([]);
  });

  it('오행/천간/지지/십성 뒤에 받침 규칙에 어긋난 조사가 붙지 않는다', () => {
    const hits = findBatchimViolations(allTexts);
    expect(hits).toEqual([]);
  });
});

describe('세운 세부 점수가 결정론적이다 (Math.random/해시 기반 가짜 결정론 회귀 방지 — 십성 기반 계산이므로 항상 동일해야 함)', () => {
  const saju = calculateSaju('1992-05-05', '17:50', 'solar', false, 'male', '서울');

  it('같은 해를 두 번 분석해도 keyAspects가 완전히 동일하다', () => {
    const first = analyzeSeyun(saju, 2026);
    const second = analyzeSeyun(saju, 2026);
    expect(second.fortune.keyAspects).toEqual(first.fortune.keyAspects);
  });
});
