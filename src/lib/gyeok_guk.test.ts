import { describe, expect, it } from 'vitest';
import { calculateSaju } from './saju';
import { determineGyeokGuk } from './gyeok_guk';
import type { SajuData } from '../types/index';

describe('월지 지장간 투출법 회귀 — 사주 전체 십성 최빈값이 아니라 월지 지장간을 봐야 한다', () => {
  // 일간 辛(음금), 월지 巳(정기 丙·중기 庚·여기 戊). 연간 壬(상관)이
  // 사주 전체 십성 가중합의 최빈값이지만 월지 지장간은 하나도 투출하지 않은
  // 합성 픽스처다. 무투용본기 원칙대로 정기 丙 → 정관격이 되어야 한다.
  const base = calculateSaju('1990-05-15', '14:30', 'solar', false, 'male', '서울');
  const saju: SajuData = {
    ...base,
    year: { ...base.year, stem: '임', branch: '신' },
    month: { ...base.month, stem: '을', branch: '사' },
    day: { ...base.day, stem: '신', branch: '사' },
    hour: { ...base.hour, stem: '정', branch: '유' },
    jiJangGan: {
      year: base.jiJangGan!.year,
      month: {
        primary: { stem: '병', strength: 54 },
        secondary: { stem: '경', strength: 23 },
        residual: { stem: '무', strength: 23 },
      },
      day: base.jiJangGan!.day,
      hour: base.jiJangGan!.hour,
    },
    tenGodsDistribution: {
      비견: 0.5,
      겁재: 0.4,
      식신: 0.6,
      상관: 1.1,
      편재: 0.3,
      정재: 0.4,
      편관: 0.5,
      정관: 0.7,
      편인: 0.2,
      정인: 0.3,
    },
  };

  it('전제: 일간은 辛, 월지는 巳다', () => {
    expect(saju.day.stem).toBe('신');
    expect(saju.month.branch).toBe('사');
  });

  it('격국은 정관격(jeong_gwan)이다 — 상관격(사주 전체 최빈 십성)이 아니다', () => {
    const analysis = determineGyeokGuk(saju);
    expect(analysis.gyeokGuk).toBe('jeong_gwan');
    expect(analysis.gyeokGuk).not.toBe('sang_gwan');
    expect(analysis.name).toBe('정관격');
  });
});

describe('월지 지장간이 실제로 투출했을 때는 정기가 아니라 투출한 지장간을 격으로 쓴다', () => {
  // 일간 갑(甲, 양목). 월지 축(丑)의 지장간은 정기 기(己)·중기 신(辛)·여기 계(癸)다.
  // 정기 기(己)는 연·월·시간 어디에도 없지만, 중기 신(辛)을 시간에 그대로 배치했다 —
  // 정기가 투출하지 않아도 중기가 투출하면 중기를 우선 써야 한다(무투용본기는 "아무것도
  // 투출하지 않았을 때"만의 폴백).
  const saju: SajuData = {
    birthDate: '1990-01-01',
    solarBirthDate: '1990-01-01',
    birthTime: '00:00',
    birthCity: '서울',
    calendar: 'solar',
    isLeapMonth: false,
    gender: 'male',
    unknownHour: false,
    year: { stem: '병', branch: '오', stemElement: '화', branchElement: '화', yinYang: '양' },
    month: { stem: '을', branch: '축', stemElement: '목', branchElement: '토', yinYang: '음' },
    day: { stem: '갑', branch: '자', stemElement: '목', branchElement: '수', yinYang: '양' },
    hour: { stem: '신', branch: '유', stemElement: '금', branchElement: '금', yinYang: '음' },
    wuxingCount: { 목: 2, 화: 2, 토: 1, 금: 2, 수: 1 },
    tenGods: [],
    jiJangGan: {
      year: { primary: { stem: '정', strength: 100 } },
      month: {
        primary: { stem: '기', strength: 70 },
        secondary: { stem: '신', strength: 20 },
        residual: { stem: '계', strength: 10 },
      },
      day: { primary: { stem: '계', strength: 100 } },
      hour: { primary: { stem: '신', strength: 100 } },
    },
  };

  it('시간에 투출한 중기 신(辛)을 격으로 써서 정관격이 된다 (정기 기(己)를 그대로 썼다면 정재격)', () => {
    const analysis = determineGyeokGuk(saju);
    // 신(辛,음금) vs 갑(양목): 금극목 관성 계열, 음양 다름 → 정관
    expect(analysis.gyeokGuk).toBe('jeong_gwan');
    // 만약 무투용본기로 정기 기(己,음토)를 그대로 썼다면 토생금 아님/목극토 재성 계열,
    // 음양 같음 → 정재격이 됐을 것 — 투출 우선이 실제로 동작하는지 구분하는 지점.
    expect(analysis.gyeokGuk).not.toBe('jeong_jae');
  });
});

describe('종격(종왕격 등) 판정은 이 리팩터와 무관하게 그대로 동작한다', () => {
  // 비견+겁재가 5개 이상이고 전체의 60% 이상이면 종왕격 — checkSpecialGyeokGuk는
  // 이번에 손대지 않았으므로 월지 지장간 로직보다 먼저 그대로 걸려야 한다.
  const saju: SajuData = {
    birthDate: '1990-01-01',
    solarBirthDate: '1990-01-01',
    birthTime: '00:00',
    birthCity: '서울',
    calendar: 'solar',
    isLeapMonth: false,
    gender: 'male',
    unknownHour: false,
    year: { stem: '갑', branch: '인', stemElement: '목', branchElement: '목', yinYang: '양' },
    month: { stem: '갑', branch: '인', stemElement: '목', branchElement: '목', yinYang: '양' },
    day: { stem: '갑', branch: '인', stemElement: '목', branchElement: '목', yinYang: '양' },
    hour: { stem: '을', branch: '묘', stemElement: '목', branchElement: '목', yinYang: '음' },
    wuxingCount: { 목: 8, 화: 0, 토: 0, 금: 0, 수: 0 },
    tenGods: [],
    tenGodsDistribution: {
      비견: 4, 겁재: 2, 식신: 0, 상관: 0, 편재: 0,
      정재: 0, 편관: 0, 정관: 0, 편인: 0, 정인: 0,
    },
  };

  it('종왕격(jong_wang)이 나온다', () => {
    expect(determineGyeokGuk(saju).gyeokGuk).toBe('jong_wang');
  });
});
