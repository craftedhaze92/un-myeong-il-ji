import { describe, expect, it } from 'vitest';
import { getTwelveStage, TWELVE_STAGE_INFO, TWELVE_STAGE_ORDER } from './twelve_stages';
import type { EarthlyBranch } from '../types/index';

// 12지지를 자축인묘진사오미신유술해 순서로 나열 — 아래 기대 배열과 zip해서 비교한다.
const BRANCHES_IN_ORDER: EarthlyBranch[] = [
  '자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해',
];

describe('갑목(양간) 순행 — 生亥 敗子 冠丑 祿寅 旺卯 衰辰 病巳 死午 墓未 絶申 胎酉 養戌', () => {
  // 자축인묘진사오미신유술해 순서로 갑목의 12운성을 나열하면
  // 목욕(자) 관대(축) 건록(인) 제왕(묘) 쇠(진) 병(사) 사(오) 묘(미) 절(신) 태(유) 양(술) 장생(해)
  const expected = [
    '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양', '장생',
  ];

  it.each(BRANCHES_IN_ORDER.map((b, i) => [b, expected[i]] as const))(
    '갑목 + %s = %s',
    (branch, stage) => {
      expect(getTwelveStage('갑', branch)).toBe(stage);
    },
  );

  it('12개 지지가 서로 다른 12단계를 정확히 한 번씩 채운다', () => {
    const stages = BRANCHES_IN_ORDER.map((b) => getTwelveStage('갑', b));
    expect(new Set(stages).size).toBe(12);
    expect(TWELVE_STAGE_ORDER.every((s) => stages.includes(s))).toBe(true);
  });
});

describe('을목(음간) 역행 — 生午 敗巳 冠辰 祿卯 旺寅 衰丑 病子 死亥 墓戌 絶酉 胎申 養未', () => {
  // 위 한자 표는 午에서 시작해 巳辰卯寅丑子亥戌酉申未 순서(역행)로 읽는다.
  // 자축인묘진사오미신유술해 순서로 다시 정렬하면
  // 병(자) 쇠(축) 제왕(인) 건록(묘) 관대(진) 목욕(사) 장생(오) 양(미) 태(신) 절(유) 묘(술) 사(해)
  const expected = [
    '병', '쇠', '제왕', '건록', '관대', '목욕', '장생', '양', '태', '절', '묘', '사',
  ];

  it.each(BRANCHES_IN_ORDER.map((b, i) => [b, expected[i]] as const))(
    '을목 + %s = %s',
    (branch, stage) => {
      expect(getTwelveStage('을', branch)).toBe(stage);
    },
  );
});

describe('화토동법 — 무토는 병화와, 기토는 정화와 완전히 같은 표를 쓴다', () => {
  it.each(BRANCHES_IN_ORDER)('무토와 병화의 %s 운성이 같다', (branch) => {
    expect(getTwelveStage('무', branch)).toBe(getTwelveStage('병', branch));
  });

  it.each(BRANCHES_IN_ORDER)('기토와 정화의 %s 운성이 같다', (branch) => {
    expect(getTwelveStage('기', branch)).toBe(getTwelveStage('정', branch));
  });
});

describe('점신(占神) 벤치마크 화면 회귀 — 신금(음간) 일간의 대운 십이운성', () => {
  // 벤치마크 스크린샷의 대운 십성(辛=비견 庚=겁재 己=편인 戊=정인 丁=편관 丙=정관)으로
  // 미루어 일간은 신금(辛). 화면에 찍힌 午 병·未 쇠·申 제왕·酉 건록·戌 관대·亥 목욕이
  // "음간 역행" 학파로만 재현된다 — 음간도 순행시키는 학파를 썼다면 결과가 달랐을 것.
  it('午=병, 未=쇠, 申=제왕, 酉=건록, 戌=관대, 亥=목욕', () => {
    expect(getTwelveStage('신', '오')).toBe('병');
    expect(getTwelveStage('신', '미')).toBe('쇠');
    expect(getTwelveStage('신', '신')).toBe('제왕');
    expect(getTwelveStage('신', '유')).toBe('건록');
    expect(getTwelveStage('신', '술')).toBe('관대');
    expect(getTwelveStage('신', '해')).toBe('목욕');
  });

  it('세운 스크린샷: 卯=절, 辰=묘, 巳=사도 같은 신금 기준으로 일치한다', () => {
    expect(getTwelveStage('신', '묘')).toBe('절');
    expect(getTwelveStage('신', '진')).toBe('묘');
    expect(getTwelveStage('신', '사')).toBe('사');
  });
});

describe('TWELVE_STAGE_INFO 데이터 정합성 — energy·band 필드를 손으로 채우다 어긋나는 사고 방지', () => {
  it('TWELVE_STAGE_ORDER의 12단계 전부가 TWELVE_STAGE_INFO에 키로 존재한다', () => {
    for (const stage of TWELVE_STAGE_ORDER) {
      expect(TWELVE_STAGE_INFO[stage]).toBeDefined();
    }
  });

  it('energy가 1~12를 중복 없이 정확히 한 번씩 채운다', () => {
    const energies = TWELVE_STAGE_ORDER.map((s) => TWELVE_STAGE_INFO[s].energy);
    expect(new Set(energies).size).toBe(12);
    expect([...energies].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
  });

  it('band와 energy 구간이 서로 어긋나지 않는다 (9~12=왕, 5~8=평, 1~4=쇠)', () => {
    for (const stage of TWELVE_STAGE_ORDER) {
      const { energy, band } = TWELVE_STAGE_INFO[stage];
      if (energy >= 9) expect(band).toBe('왕');
      else if (energy >= 5) expect(band).toBe('평');
      else expect(band).toBe('쇠');
    }
  });

  it('통설 3분류: 왕 그룹은 정확히 {장생, 관대, 건록, 제왕}이다', () => {
    const wangGroup = TWELVE_STAGE_ORDER.filter((s) => TWELVE_STAGE_INFO[s].band === '왕');
    expect(new Set(wangGroup)).toEqual(new Set(['장생', '관대', '건록', '제왕']));
  });
});
