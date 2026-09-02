import { describe, expect, it } from 'vitest';
import { calculateSaju } from './saju';
import { CareerMatcher } from './career_matcher';
import { DEFAULT_PRESETS } from '../data/school_presets';

describe('CareerMatcher.matchCareers — yongSinOverride가 실제로 쓰인다', () => {
  // career_recommendation.ts#recommendCareer가 이미 계산된 saju.yongSin(legacy
  // yong_sin.ts#selectYongSin 결과, 화면에 표시되는 값)을 yongSinOverride로 넘긴다.
  // 이 옵션이 없으면 CareerMatcher가 내부 YongSinSelector(별개의 4-알고리즘 레지스트리)로
  // 용신을 다시 계산해, "용신 — 필요한 것" 카드와 직업 탭이 다른 용신을 말하는 불일치가
  // 생길 수 있었다 — override가 실제로 그 재계산을 건너뛰는지 확인한다.
  const saju = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');
  const settings = DEFAULT_PRESETS.modern_professional;

  it('override로 넘긴 오행이 실제 매칭 점수(yongSinMatch)에 반영된다 — 다른 오행을 넘기면 점수가 달라진다', () => {
    const withGeumOverride = CareerMatcher.matchCareers(saju, settings, {
      minScore: 0,
      maxResults: 100,
      yongSinOverride: { primaryYongSin: '금' },
    });
    const withHwaOverride = CareerMatcher.matchCareers(saju, settings, {
      minScore: 0,
      maxResults: 100,
      yongSinOverride: { primaryYongSin: '화' },
    });

    // 정보보안 전문가: primaryElements가 ['금','수']다(modern_careers.ts). 용신을 금으로
    // 넘기면 "주요 오행-용신 일치" 가점(60점)이 붙어야 하고, 화로 넘기면 그 career의
    // primaryElements에 화가 없으니 훨씬 낮아야 한다 — 두 호출의 유일한 차이는 override뿐이므로
    // 점수 차이가 곧 override가 실제로 쓰였다는 증거다.
    const security1 = withGeumOverride.find((m) => m.career.name === '정보보안 전문가');
    const security2 = withHwaOverride.find((m) => m.career.name === '정보보안 전문가');
    expect(security1).toBeDefined();
    expect(security2).toBeDefined();
    expect(security1!.yongSinMatch).toBeGreaterThan(security2!.yongSinMatch);
    expect(security1!.yongSinMatch).toBeGreaterThanOrEqual(60);
  });

  it('yongSinOverride를 안 주면 기존처럼 YongSinSelector가 자체 계산해 정상적으로 결과를 낸다', () => {
    const matches = CareerMatcher.matchCareers(saju, settings, { minScore: 0, maxResults: 100 });
    expect(matches.length).toBeGreaterThan(0);
  });
});
