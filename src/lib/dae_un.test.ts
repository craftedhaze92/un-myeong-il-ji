import { describe, expect, it } from 'vitest';
import { calculateSaju } from './saju';
import { calculateDaeUn } from './dae_un';
import { calculateDaeunList } from './daeun_analysis';

describe('음남 명식에서 calculateDaeUn과 calculateDaeunList의 간지가 일치한다 — 성별만 보고 순역을 정하던 회귀', () => {
  // daeun_analysis.ts#calculateDaeunList가 예전에 갖고 있던 자체 구현은
  // `const isYangMale = gender === 'male'`로 순역을 판정해, 연간 음양을 보지 않았다.
  // 남성이어도 연간이 음간(을·정·기·신·계)이면 음남 역행이어야 하는데, 옛 구현은
  // 무조건 순행으로 계산해 dae_un.ts#calculateDaeUn과 다른 간지를 냈다.
  const saju = calculateSaju('1991-08-15', '10:00', 'solar', false, 'male', '서울');

  it('전제: 이 명식은 연간이 음간(음남)이다', () => {
    expect(saju.year.yinYang).toBe('음');
  });

  it('calculateDaeUn과 calculateDaeunList의 처음 5개 대운 간지·시작 나이가 완전히 일치한다', () => {
    const fromDaeUn = calculateDaeUn(saju, 60).slice(0, 5);
    const fromAnalysis = calculateDaeunList(saju, 60).slice(0, 5);

    expect(fromAnalysis.length).toBe(fromDaeUn.length);
    fromDaeUn.forEach((period, i) => {
      expect(fromAnalysis[i]).toMatchObject({
        startAge: period.startAge,
        endAge: period.endAge,
        stem: period.stem,
        branch: period.branch,
        pillar: `${period.stem}${period.branch}`,
      });
    });
  });
});

describe('양남 명식에서도 두 함수의 결과가 일치한다 (순행 케이스 회귀 방지)', () => {
  const saju = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');

  it('전제: 이 명식은 연간이 양간(양남)이다', () => {
    expect(saju.year.yinYang).toBe('양');
  });

  it('처음 5개 대운이 일치한다', () => {
    const fromDaeUn = calculateDaeUn(saju, 60).slice(0, 5);
    const fromAnalysis = calculateDaeunList(saju, 60).slice(0, 5);
    fromDaeUn.forEach((period, i) => {
      expect(fromAnalysis[i]).toMatchObject({
        startAge: period.startAge,
        stem: period.stem,
        branch: period.branch,
      });
    });
  });
});
