import { describe, expect, it } from 'vitest';
import { calculateSaju } from '@/lib/saju';
import { calculateDaeUn } from '@/lib/dae_un';
import {
  buildReadingViewModel,
  buildDaeunDetailViewModel,
  buildSeyunDetailViewModel,
  buildWolunDetailViewModel,
} from './reading-view-model';

describe('buildReadingViewModel — 4블록이 빈 값 없이 채워지는지 스모크 테스트', () => {
  const saju = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');
  const daeUn = calculateDaeUn(saju);
  const vm = buildReadingViewModel({ saju, daeUn, nowYear: 2024 });

  it('명식 기본 해석(myeongsik) 블록이 채워진다', () => {
    expect(vm.myeongsik.gyeokGuk).toBeDefined();
    expect(vm.myeongsik.dayMasterStrength).toBeDefined();
    expect(vm.myeongsik.wolRyeong).toBeDefined();
    expect(vm.myeongsik.jiJangGan.length).toBe(4); // 4주 모두 계산됨
    expect(vm.myeongsik.yongSin).toBeDefined();
    expect(vm.myeongsik.yongSin?.advice.length).toBeGreaterThan(0);
  });

  it('인생 총평(life) 블록이 4개 운세(총평/재물/건강/애정)를 담는다', () => {
    expect(vm.life.fortunes.map((f) => f.type).sort()).toEqual(['general', 'health', 'love', 'wealth'].sort());
    vm.life.fortunes.forEach((f) => {
      expect(f.score).toBeGreaterThanOrEqual(0);
      expect(f.score).toBeLessThanOrEqual(100);
      expect(f.summary.length).toBeGreaterThan(0);
    });
  });

  it('흐름(flow) 블록에 대운 옵션과 현재 선택된 대운·세운이 있다', () => {
    expect(vm.flow.daeunOptions.length).toBeGreaterThan(0);
    expect(vm.flow.selectedDaeun).not.toBeNull();
    expect(vm.flow.seyunSpark.length).toBe(9); // 기본 -2 ~ +6년
    expect(vm.flow.selectedSeyun.year).toBe(2024);
  });

  it('직업(career) 블록에 추천 목록이 있다', () => {
    expect(vm.career.recommendations.length).toBeGreaterThan(0);
    expect(vm.career.summary.length).toBeGreaterThan(0);
  });

  it('buildDaeunDetailViewModel/buildSeyunDetailViewModel을 개별 호출해도 동일한 결과를 낸다', () => {
    const firstOption = vm.flow.daeunOptions[0]!;
    const detail = buildDaeunDetailViewModel(saju, daeUn, firstOption.startAge);
    expect(detail?.pillar).toBe(firstOption.pillar);

    const seyunDetail = buildSeyunDetailViewModel(saju, 2030);
    expect(seyunDetail.year).toBe(2030);
  });

  it('buildWolunDetailViewModel이 흐름 탭의 월운 카드에 필요한 필드를 빈 값 없이 채운다', () => {
    const wolunDetail = buildWolunDetailViewModel(saju, 2024, 5);
    expect(wolunDetail.year).toBe(2024);
    expect(wolunDetail.month).toBe(5);
    expect(wolunDetail.pillar.length).toBe(2);
    expect(wolunDetail.score).toBeGreaterThanOrEqual(0);
    expect(wolunDetail.score).toBeLessThanOrEqual(100);
    expect(wolunDetail.keywords.length).toBeGreaterThan(0);
    expect(wolunDetail.doList.length).toBeGreaterThan(0);
    expect(wolunDetail.dontList.length).toBeGreaterThan(0);
  });
});

describe('시간 미상 명식으로도 4블록이 정상 생성된다', () => {
  const saju = calculateSaju('1990-05-15', '12:00', 'solar', false, 'female', '서울', {
    unknownHour: true,
  });
  const daeUn = calculateDaeUn(saju);
  const vm = buildReadingViewModel({ saju, daeUn, nowYear: 2024 });

  it('시주가 빠진 상태에서도 지장간은 3주만 나온다', () => {
    expect(vm.myeongsik.jiJangGan.length).toBe(3);
  });

  it('나머지 블록도 예외 없이 채워진다', () => {
    expect(vm.life.fortunes.length).toBe(4);
    expect(vm.flow.daeunOptions.length).toBeGreaterThan(0);
    expect(vm.career.recommendations.length).toBeGreaterThan(0);
  });
});
