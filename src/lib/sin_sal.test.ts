import { describe, expect, it } from 'vitest';
import { findGeonRokBranch, findSinSalHits, findSinSals } from './sin_sal';
import { SIN_SAL_DATA } from '../data/sinsal_table';
import { getTwelveStage } from './twelve_stages';
import { getTwelveSinSal } from './twelve_sinsal';
import { getHeavenlyStemByKorean } from '../data/heavenly_stems';
import { getEarthlyBranchByKorean, EARTHLY_BRANCHES } from '../data/earthly_branches';
import type { EarthlyBranch, HeavenlyStem, Pillar, SajuData, SinSal } from '../types/index';

interface PillarSpec {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
}

function makePillar({ stem, branch }: PillarSpec): Pillar {
  const stemData = getHeavenlyStemByKorean(stem)!;
  const branchData = getEarthlyBranchByKorean(branch)!;
  return {
    stem,
    branch,
    stemElement: stemData.element,
    branchElement: branchData.element,
    yinYang: stemData.yinYang,
  };
}

/**
 * 신살 판정에 필요한 최소한의 합성 SajuData를 만든다. 오행 카운트·십성 등 신살 판정과
 * 무관한 필드는 임의값을 채운다.
 */
function makeSaju(
  pillars: { year: PillarSpec; month: PillarSpec; day: PillarSpec; hour: PillarSpec },
  opts: { unknownHour?: boolean } = {},
): SajuData {
  return {
    birthDate: '1990-01-01',
    solarBirthDate: '1990-01-01',
    birthTime: '00:00',
    birthCity: '서울',
    calendar: 'solar',
    isLeapMonth: false,
    gender: 'male',
    unknownHour: opts.unknownHour ?? false,
    year: makePillar(pillars.year),
    month: makePillar(pillars.month),
    day: makePillar(pillars.day),
    hour: makePillar(pillars.hour),
    wuxingCount: { 목: 2, 화: 2, 토: 2, 금: 1, 수: 1 },
    tenGods: [],
  };
}

/**
 * 원진살/귀문관살 지지 짝 테스트처럼 지지 조합만 중요하고 천간은 무관한 경우를 위한 헬퍼.
 * 기존 테스트가 쓰던 "네 지지만 지정" 형태를 유지하되, 서로 다른 천간(갑을병정)을 채워
 * 우연히 다른 신살(백호살·괴강살 등 간지 고정 조합)과 겹치지 않게 한다.
 */
function makeSajuByBranches(
  branches: [EarthlyBranch, EarthlyBranch, EarthlyBranch, EarthlyBranch],
): SajuData {
  const stems: HeavenlyStem[] = ['갑', '을', '병', '정'];
  return makeSaju({
    year: { stem: stems[0]!, branch: branches[0] },
    month: { stem: stems[1]!, branch: branches[1] },
    day: { stem: stems[2]!, branch: branches[2] },
    hour: { stem: stems[3]!, branch: branches[3] },
  });
}

const ALL_BRANCHES: EarthlyBranch[] = EARTHLY_BRANCHES.map((b) => b.korean);

describe('귀문관살은 지정된 6개 짝 조합일 때만 성립한다 — 인·신·사·해 중 2개 이상이면 성립하던 오판정 회귀', () => {
  const validPairs: [EarthlyBranch, EarthlyBranch][] = [
    ['진', '해'],
    ['오', '축'],
    ['사', '술'],
    ['묘', '신'],
    ['인', '미'],
    ['자', '유'],
  ];

  it.each(validPairs)('%s-%s 조합이 있으면 귀문관살이 성립한다', (a, b) => {
    // 나머지 두 지지는 어떤 조합과도 겹치지 않는 '축'/'미' 등으로 채우면 오탐 우려가 있으니
    // 조합과 무관한 지지(여기서는 짝에 없는 지지 중 하나)로 채운다.
    const filler = ALL_BRANCHES.find((br) => br !== a && br !== b)!;
    const saju = makeSajuByBranches([a, b, filler, filler]);
    expect(findSinSals(saju)).toContain('gwi_mun_gwan_sal');
  });

  it('예전 버그 조합(인+신, 2개 이상이면 성립하던 규칙)은 더 이상 성립하지 않는다 — 인신은 유효한 짝이 아님', () => {
    const saju = makeSajuByBranches(['인', '신', '자', '축']);
    expect(findSinSals(saju)).not.toContain('gwi_mun_gwan_sal');
  });

  it('예전 버그 조합(사+해)도 유효한 짝이 아니므로 성립하지 않는다', () => {
    const saju = makeSajuByBranches(['사', '해', '자', '축']);
    expect(findSinSals(saju)).not.toContain('gwi_mun_gwan_sal');
  });

  it('관련 지지가 하나도 없으면 성립하지 않는다', () => {
    const saju = makeSajuByBranches(['자', '축', '자', '축']);
    expect(findSinSals(saju)).not.toContain('gwi_mun_gwan_sal');
  });
});

describe('원진살은 원진 짝(자미·축오·인유·묘신·진해·사술)에만 성립한다 — 육충 짝(자오 등)을 쓰던 회귀', () => {
  it('자-미(원진 짝)가 있으면 원진살이 성립한다', () => {
    const saju = makeSajuByBranches(['자', '미', '인', '진']);
    expect(findSinSals(saju)).toContain('won_jin_sal');
  });

  it('자-오(육충 짝이지 원진 짝이 아님)는 원진살이 성립하지 않는다', () => {
    const saju = makeSajuByBranches(['자', '오', '인', '진']);
    expect(findSinSals(saju)).not.toContain('won_jin_sal');
  });

  it('묘-신(원진 짝)이 있으면 원진살이 성립한다', () => {
    const saju = makeSajuByBranches(['묘', '신', '자', '축']);
    expect(findSinSals(saju)).toContain('won_jin_sal');
  });
});

describe('공망은 일간까지 봐야 한다 — 일지만으로 순(旬)을 판단하던 회귀', () => {
  it('갑자일생은 년·월·시지의 술·해가 공망이다', () => {
    const saju = makeSaju({
      year: { stem: '경', branch: '술' },
      month: { stem: '신', branch: '묘' },
      day: { stem: '갑', branch: '자' },
      hour: { stem: '정', branch: '사' },
    });
    const hits = findSinSalHits(saju);
    const gongMang = hits.find((h) => h.sinSal === 'gong_mang');
    expect(gongMang?.pillars).toContain('year');
  });

  it(
    '병인일생도 갑인순(甲寅旬)과 같은 공망(술·해)이다 — ' +
      '일지(인)만 보고 표를 찾으면 자·축이 되던 회귀(옛 표는 일간을 무시했음)',
    () => {
      const saju = makeSaju({
        year: { stem: '무', branch: '술' },
        month: { stem: '기', branch: '묘' },
        day: { stem: '병', branch: '인' },
        hour: { stem: '신', branch: '사' },
      });
      const hits = findSinSalHits(saju);
      const gongMang = hits.find((h) => h.sinSal === 'gong_mang');
      expect(gongMang?.pillars).toContain('year');
    },
  );

  it('병인일생 기준으로 자·축은 공망이 아니다 — 일지만 보던 옛 표라면 자·축을 공망으로 잘못 판단했을 자리', () => {
    const saju = makeSaju({
      year: { stem: '갑', branch: '자' },
      month: { stem: '을', branch: '축' },
      day: { stem: '병', branch: '인' },
      hour: { stem: '정', branch: '묘' },
    });
    expect(findSinSals(saju)).not.toContain('gong_mang');
  });

  it('일지 자신은 구조적으로 공망이 될 수 없다', () => {
    const saju = makeSaju({
      year: { stem: '경', branch: '술' },
      month: { stem: '신', branch: '유' },
      day: { stem: '갑', branch: '자' },
      hour: { stem: '정', branch: '사' },
    });
    const hits = findSinSalHits(saju);
    const gongMang = hits.find((h) => h.sinSal === 'gong_mang');
    expect(gongMang?.pillars).not.toContain('day');
  });
});

describe('화개살은 일지 기준 십이신살(twelve_sinsal)의 화개 자리로만 성립한다 — 진·술·축·미 한 글자만 있으면 항상 성립하던 과탐지 회귀', () => {
  it('일지가 자(신자진 수국)일 때 진이 있으면 화개살이 성립한다 (수국의 화개 자리)', () => {
    const saju = makeSaju({
      year: { stem: '무', branch: '진' },
      month: { stem: '을', branch: '묘' },
      day: { stem: '병', branch: '자' },
      hour: { stem: '정', branch: '사' },
    });
    expect(findSinSals(saju)).toContain('hwa_gae_sal');
  });

  it('일지가 자(수국)일 때 술이 있어도 화개살이 아니다 — 옛 코드는 (인|오|술)&&술 형태라 술만 있으면 항상 성립했음', () => {
    const saju = makeSaju({
      year: { stem: '무', branch: '술' },
      month: { stem: '을', branch: '묘' },
      day: { stem: '병', branch: '자' },
      hour: { stem: '정', branch: '사' },
    });
    expect(findSinSals(saju)).not.toContain('hwa_gae_sal');
  });
});

describe('도화살·역마살은 twelve_sinsal.ts#getTwelveSinSal(일지, 대상지지)의 연살·역마살 자리와 정확히 일치한다', () => {
  it.each(ALL_BRANCHES)('일지가 자일 때 대상지지 %s에 대한 판정이 getTwelveSinSal과 일치한다', (target) => {
    if (target === '자') return; // 기준 자리(일지) 자신은 판정 대상에서 제외
    const saju = makeSaju({
      year: { stem: '갑', branch: target },
      // 월지 채움은 반안살(중립) 자리인 '축'으로 고정 — 연살/역마살/화개살과 겹치면
      // target과 무관하게 항상 true가 나와 이 테스트의 의미가 사라진다.
      month: { stem: '을', branch: '축' },
      day: { stem: '병', branch: '자' },
      hour: { stem: '정', branch: '축' },
    });
    const sinSals = findSinSals(saju);
    const expected = getTwelveSinSal('자', target);
    expect(sinSals.includes('do_hwa_sal')).toBe(expected === '연살');
    expect(sinSals.includes('yeok_ma_sal')).toBe(expected === '역마살');
  });
});

describe('학당귀인·건록·양인살은 십이운성(twelve_stages.ts#getTwelveStage)에서 유도된다', () => {
  it('갑일간의 장생지(해)가 있으면 학당귀인이 성립한다', () => {
    expect(getTwelveStage('갑', '해')).toBe('장생');
    const saju = makeSaju({
      year: { stem: '기', branch: '해' },
      month: { stem: '을', branch: '축' },
      day: { stem: '갑', branch: '오' },
      hour: { stem: '정', branch: '묘' },
    });
    expect(findSinSals(saju)).toContain('hak_dang_gwi_in');
  });

  it('갑일간의 건록지(인)가 있으면 건록이 성립한다', () => {
    expect(getTwelveStage('갑', '인')).toBe('건록');
    const saju = makeSaju({
      year: { stem: '병', branch: '인' },
      month: { stem: '을', branch: '축' },
      day: { stem: '갑', branch: '오' },
      hour: { stem: '정', branch: '묘' },
    });
    expect(findSinSals(saju)).toContain('geon_rok');
  });

  it('갑일간(양간)의 제왕지(묘)가 있으면 양인살이 성립한다', () => {
    expect(getTwelveStage('갑', '묘')).toBe('제왕');
    const saju = makeSaju({
      year: { stem: '기', branch: '축' },
      month: { stem: '을', branch: '해' },
      day: { stem: '갑', branch: '오' },
      hour: { stem: '정', branch: '묘' },
    });
    expect(findSinSals(saju)).toContain('yang_in_sal');
  });

  it('음간(을) 일간은 제왕지가 있어도 양인살이 성립하지 않는다', () => {
    // 을(음간)의 제왕지를 십이운성 산식으로 직접 찾아 하드코딩 오류를 피한다.
    const eulJewangBranch = ALL_BRANCHES.find((b) => getTwelveStage('을', b) === '제왕')!;
    const saju = makeSaju({
      year: { stem: '기', branch: '축' },
      month: { stem: '병', branch: '해' },
      day: { stem: '을', branch: '사' },
      hour: { stem: '정', branch: eulJewangBranch },
    });
    expect(findSinSals(saju)).not.toContain('yang_in_sal');
  });
});

describe('천덕귀인은 월지에 따라 천간이 대상인 달과 지지가 대상인 달이 나뉜다', () => {
  it('인월(월지 인)은 천간 정이 대상 — 정이 지지가 아니라 천간에 있어야 성립', () => {
    const saju = makeSaju({
      year: { stem: '정', branch: '해' },
      month: { stem: '기', branch: '인' },
      day: { stem: '무', branch: '자' },
      hour: { stem: '신', branch: '유' },
    });
    const hits = findSinSalHits(saju);
    const cheonDeok = hits.find((h) => h.sinSal === 'cheon_deok_gwi_in');
    expect(cheonDeok?.pillars).toContain('year');
  });

  it('오월(월지 오)은 지지 해가 대상 — 해가 지지에 있어야 성립', () => {
    const saju = makeSaju({
      year: { stem: '갑', branch: '자' },
      month: { stem: '경', branch: '오' },
      day: { stem: '무', branch: '진' },
      hour: { stem: '신', branch: '해' },
    });
    const hits = findSinSalHits(saju);
    const cheonDeok = hits.find((h) => h.sinSal === 'cheon_deok_gwi_in');
    expect(cheonDeok?.pillars).toContain('hour');
  });
});

describe('백호살·괴강살은 일주뿐 아니라 년·월·시주에서도 성립한다', () => {
  it('년주가 갑진이면 백호살이 년주에서 성립한다', () => {
    const saju = makeSaju({
      year: { stem: '갑', branch: '진' },
      month: { stem: '을', branch: '축' },
      day: { stem: '기', branch: '사' },
      hour: { stem: '신', branch: '유' },
    });
    const hits = findSinSalHits(saju);
    const baekHo = hits.find((h) => h.sinSal === 'baek_ho_sal');
    expect(baekHo?.pillars).toContain('year');
  });

  it('월주가 경진이면 괴강살이 월주에서 성립한다', () => {
    const saju = makeSaju({
      year: { stem: '기', branch: '사' },
      month: { stem: '경', branch: '진' },
      day: { stem: '을', branch: '축' },
      hour: { stem: '신', branch: '유' },
    });
    const hits = findSinSalHits(saju);
    const goeGang = hits.find((h) => h.sinSal === 'goe_gang_sal');
    expect(goeGang?.pillars).toContain('month');
  });
});

describe('unknownHour(시간 미상)이면 시주는 모든 신살 판정에서 빠진다', () => {
  it('시주가 백호살 조합(갑진)이어도 unknownHour면 잡히지 않는다', () => {
    const saju = makeSaju(
      {
        year: { stem: '기', branch: '사' },
        month: { stem: '신', branch: '유' },
        day: { stem: '을', branch: '축' },
        hour: { stem: '갑', branch: '진' },
      },
      { unknownHour: true },
    );
    const hits = findSinSalHits(saju);
    const baekHo = hits.find((h) => h.sinSal === 'baek_ho_sal');
    expect(baekHo).toBeUndefined();
  });
});

describe('천주귀인은 일간의 식신 천간이 건록을 얻는 지지다 — 화토동법으로 병·정이 무·기와 겹치지 않는다', () => {
  it('갑일간은 사가 있으면 성립한다 (식신 병화의 건록)', () => {
    const saju = makeSaju({
      year: { stem: '기', branch: '사' },
      month: { stem: '을', branch: '축' },
      day: { stem: '갑', branch: '오' },
      hour: { stem: '정', branch: '묘' },
    });
    expect(findSinSals(saju)).toContain('cheon_ju_gwi_in');
  });

  it('병일간도 사가 있으면 성립한다 — 화토동법 없이 무일간(신)과 헷갈리면 틀리기 쉬운 자리', () => {
    const saju = makeSaju({
      year: { stem: '기', branch: '사' },
      month: { stem: '을', branch: '축' },
      day: { stem: '병', branch: '오' },
      hour: { stem: '정', branch: '묘' },
    });
    expect(findSinSals(saju)).toContain('cheon_ju_gwi_in');
  });

  it('정일간은 오가 있으면 성립한다 — 기일간(유)과 다름을 확인', () => {
    const saju = makeSaju({
      year: { stem: '기', branch: '축' },
      month: { stem: '을', branch: '해' },
      day: { stem: '정', branch: '오' },
      hour: { stem: '갑', branch: '묘' },
    });
    expect(findSinSals(saju)).toContain('cheon_ju_gwi_in');
  });
});

describe('협록은 건록지를 사이에 낀 앞·뒤 지지다', () => {
  it('findGeonRokBranch가 export되어 갑일간의 건록지(인)를 그대로 조회할 수 있다', () => {
    expect(findGeonRokBranch('갑')).toBe('인');
  });

  it('갑일간은 축·묘 둘 다 협록으로 성립한다 (건록 인의 앞뒤 지지)', () => {
    const saju = makeSaju({
      year: { stem: '기', branch: '축' },
      month: { stem: '을', branch: '묘' },
      day: { stem: '갑', branch: '오' },
      hour: { stem: '정', branch: '사' },
    });
    const hits = findSinSalHits(saju);
    const hyeopRok = hits.find((h) => h.sinSal === 'hyeop_rok');
    expect(hyeopRok?.pillars).toEqual(expect.arrayContaining(['year', 'month']));
  });
});

describe('급각살은 월지가 속한 계절 기준으로 일지·시지를 대조한다', () => {
  it('인묘진월생(월지 인)의 일지에 해가 있으면 성립한다', () => {
    const saju = makeSaju({
      year: { stem: '기', branch: '오' },
      month: { stem: '갑', branch: '인' },
      day: { stem: '무', branch: '해' },
      hour: { stem: '신', branch: '유' },
    });
    const hits = findSinSalHits(saju);
    const geupGak = hits.find((h) => h.sinSal === 'geup_gak_sal');
    expect(geupGak?.pillars).toContain('day');
  });
});

describe('탕화살은 일지가 인·오·축일 때만 성립하고, 그 외 지지는 이 신살 자체가 없다', () => {
  it('일지가 인이고 시지에 사가 있으면 성립한다', () => {
    const saju = makeSaju({
      year: { stem: '기', branch: '오' },
      month: { stem: '갑', branch: '신' },
      day: { stem: '무', branch: '인' },
      hour: { stem: '신', branch: '사' },
    });
    const hits = findSinSalHits(saju);
    const tangHwa = hits.find((h) => h.sinSal === 'tang_hwa_sal');
    expect(tangHwa?.pillars).toContain('hour');
  });

  it('일지가 묘(표에 없는 지지)면 월지·시지에 무엇이 있어도 성립하지 않는다', () => {
    const saju = makeSaju({
      year: { stem: '기', branch: '오' },
      month: { stem: '갑', branch: '인' },
      day: { stem: '무', branch: '묘' },
      hour: { stem: '신', branch: '사' },
    });
    expect(findSinSals(saju)).not.toContain('tang_hwa_sal');
  });
});

describe('고란살은 일주 전용이다 — 년·월·시에 같은 간지가 있어도 일주 자체가 아니면 무관하다', () => {
  it('일주가 신해면 성립한다', () => {
    const saju = makeSaju({
      year: { stem: '기', branch: '축' },
      month: { stem: '을', branch: '유' },
      day: { stem: '신', branch: '해' },
      hour: { stem: '갑', branch: '인' },
    });
    expect(findSinSals(saju)).toContain('go_ran_sal');
  });

  it('신해 조합이 연주에만 있고 일주가 아니면 성립하지 않는다', () => {
    const saju = makeSaju({
      year: { stem: '신', branch: '해' },
      month: { stem: '을', branch: '유' },
      day: { stem: '무', branch: '진' },
      hour: { stem: '갑', branch: '인' },
    });
    expect(findSinSals(saju)).not.toContain('go_ran_sal');
  });
});

describe('현침살은 천간(갑·신) 중 하나와 지지(묘·오·미·신) 중 하나가 함께 있으면 성립한다', () => {
  it('일간이 갑이고 지지에 오가 있으면 성립한다', () => {
    const saju = makeSaju({
      year: { stem: '기', branch: '축' },
      month: { stem: '을', branch: '해' },
      day: { stem: '갑', branch: '오' },
      hour: { stem: '정', branch: '진' },
    });
    expect(findSinSals(saju)).toContain('hyeon_chim_sal');
  });

  it('갑·신이 천간에 하나도 없으면 지지에 오·미가 있어도 성립하지 않는다', () => {
    const saju = makeSaju({
      year: { stem: '기', branch: '축' },
      month: { stem: '을', branch: '해' },
      day: { stem: '무', branch: '오' },
      hour: { stem: '정', branch: '미' },
    });
    expect(findSinSals(saju)).not.toContain('hyeon_chim_sal');
  });
});

describe('SIN_SAL_DATA는 SinSal 유니온과 정확히 대응한다 (29종)', () => {
  it('SIN_SAL_DATA의 키 개수가 29개다', () => {
    expect(Object.keys(SIN_SAL_DATA).length).toBe(29);
  });

  it('모든 항목이 name·hanja·description 등 필수 서술 필드를 갖춘다', () => {
    (Object.keys(SIN_SAL_DATA) as SinSal[]).forEach((key) => {
      const info = SIN_SAL_DATA[key];
      expect(info.name).toBeTruthy();
      expect(info.hanja).toBeTruthy();
      expect(info.basis).toBeTruthy();
      expect(['lucky', 'unlucky', 'neutral']).toContain(info.type);
    });
  });
});
