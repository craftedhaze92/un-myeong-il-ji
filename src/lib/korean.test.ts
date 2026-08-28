import { describe, expect, it } from 'vitest';
import { hasBatchim, josa, joinKoreanList, pickJosa } from './korean';

describe('hasBatchim — 한글 음절의 받침 유무 판정', () => {
  it('받침이 있는 오행/천간/지지는 true를 반환한다 (목, 금, 갑, 인, 술)', () => {
    expect(hasBatchim('목')).toBe(true);
    expect(hasBatchim('금')).toBe(true);
    expect(hasBatchim('갑')).toBe(true);
    expect(hasBatchim('인')).toBe(true);
    expect(hasBatchim('술')).toBe(true); // ㄹ받침도 "받침 있음"으로 취급 (로/으로 처리는 별도)
  });

  it('받침이 없는 오행/천간/지지는 false를 반환한다 (화, 토, 수, 무, 계, 사)', () => {
    expect(hasBatchim('화')).toBe(false);
    expect(hasBatchim('토')).toBe(false);
    expect(hasBatchim('수')).toBe(false);
    expect(hasBatchim('무')).toBe(false);
    expect(hasBatchim('계')).toBe(false);
    expect(hasBatchim('사')).toBe(false);
  });

  it('마지막 글자가 한글 음절이 아니면(숫자/영문) 받침 있음으로 간주한다', () => {
    // "3개"는 마지막 글자 "개"가 정상적인 한글 음절(받침 없음)이므로 이 규칙과 무관하다.
    expect(hasBatchim('AI')).toBe(true);
    expect(hasBatchim('100')).toBe(true);
  });
});

describe('pickJosa — 조사 쌍에서 올바른 조사를 고른다', () => {
  it('이/가', () => {
    expect(pickJosa('목', '이/가')).toBe('이');
    expect(pickJosa('화', '이/가')).toBe('가');
  });

  it('을/를', () => {
    expect(pickJosa('금', '을/를')).toBe('을');
    expect(pickJosa('토', '을/를')).toBe('를');
  });

  it('은/는', () => {
    expect(pickJosa('갑', '은/는')).toBe('은');
    expect(pickJosa('무', '은/는')).toBe('는');
  });

  it('과/와', () => {
    expect(pickJosa('경', '과/와')).toBe('과');
    expect(pickJosa('계', '과/와')).toBe('와');
  });

  it('이나/나, 이라/라도 동일한 규칙을 따른다', () => {
    expect(pickJosa('목', '이나/나')).toBe('이나');
    expect(pickJosa('화', '이나/나')).toBe('나');
    expect(pickJosa('목', '이라/라')).toBe('이라');
    expect(pickJosa('화', '이라/라')).toBe('라');
  });
});

describe('josa — 으로/로는 ㄹ받침 예외를 따른다', () => {
  it('받침이 없으면 "로"를 쓴다', () => {
    expect(josa('화', '으로/로')).toBe('화로');
  });

  it('일반 받침이 있으면 "으로"를 쓴다 (목, 금)', () => {
    expect(josa('목', '으로/로')).toBe('목으로');
    expect(josa('금', '으로/로')).toBe('금으로');
  });

  it('ㄹ받침(을, 술)은 받침이 있어도 "로"를 쓴다 — "을으로"가 아니라 "을로"', () => {
    expect(josa('을', '으로/로')).toBe('을로');
    expect(josa('술', '으로/로')).toBe('술로');
  });
});

describe('josa — "용신(토)" 같은 괄호 표기는 괄호 안 마지막 글자를 기준으로 조사를 고른다', () => {
  // 명식 탭/직업 탭에서 실제로 쓰이는 표기 형태. 사용자가 확정한 규칙:
  // "용신(토)"는 "토"의 받침을 본다 — "용신"만 보고 조사를 고르면
  // 안에 든 오행이 바뀌어도 조사가 안 바뀌어 부자연스럽다.
  it('받침 없는 오행이 괄호 안에 있으면 와/를/가를 쓴다', () => {
    expect(josa('용신(토)', '과/와')).toBe('용신(토)와');
    expect(josa('용신(토)', '을/를')).toBe('용신(토)를');
    expect(josa('용신(화)', '이/가')).toBe('용신(화)가');
  });

  it('받침 있는 오행이 괄호 안에 있으면 과/을/이를 쓴다', () => {
    expect(josa('용신(목)', '과/와')).toBe('용신(목)과');
    expect(josa('용신(금)', '을/를')).toBe('용신(금)을');
    expect(josa('용신(목)', '이/가')).toBe('용신(목)이');
  });

  it('"십성(상관)"처럼 2음절 이상의 괄호 내용도 마지막 글자만 본다', () => {
    // 상관(傷官)의 마지막 글자 "관"은 받침이 있다
    expect(josa('십성(상관)', '과/와')).toBe('십성(상관)과');
  });
});

describe('joinKoreanList — 여러 구절을 자연스러운 한국어 나열로 합친다', () => {
  it('구절이 하나면 그대로 반환한다', () => {
    expect(joinKoreanList(['목 기운의 강한 영향으로 나타나는 특성'])).toBe(
      '목 기운의 강한 영향으로 나타나는 특성'
    );
  });

  it('구절이 여럿이면 쉼표로 나열하고 마지막만 받침에 맞는 과/와로 잇는다', () => {
    expect(joinKoreanList(['첫 번째 특성', '두 번째 특성', '세 번째 특성'])).toBe(
      '첫 번째 특성, 두 번째 특성과 세 번째 특성'
    );
  });

  it('빈 배열은 빈 문자열을 반환한다', () => {
    expect(joinKoreanList([])).toBe('');
  });
});
