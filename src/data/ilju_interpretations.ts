/**
 * 60갑자 일주 해석 데이터.
 *
 * 일주는 자기 이해를 돕는 전통적 유형론의 출발점일 뿐, 한 사람의 성격이나 미래를
 * 단정하는 결론이 아니다. 고유한 상징 문장·키워드는 60개 조합별로 관리하고,
 * 천간/지지의 한자·오행 및 생극 관계는 기존 데이터에서 가져와 중복하지 않는다.
 */
import { getEarthlyBranchByKorean } from "./earthly_branches";
import { getHeavenlyStemByKorean } from "./heavenly_stems";
import { getControlledElement, getGeneratedElement } from "./wuxing";
import { josa } from "../lib/korean";
import type { EarthlyBranch, HeavenlyStem } from "../types";

interface IljuSeed {
  summary: string;
  keywords: readonly [string, string, string];
}

interface StemProfile {
  temperament: string;
  strengths: readonly [string, string];
  cautions: readonly [string, string];
}

interface BranchProfile {
  innerStyle: string;
  strength: string;
  caution: string;
}

export interface IljuInterpretation {
  key: string;
  name: string;
  hanja: string;
  summary: string;
  keywords: string[];
  temperament: string;
  innerStyle: string;
  relation: string;
  strengths: string[];
  cautions: string[];
}

const STEM_PROFILES: Record<HeavenlyStem, StemProfile> = {
  갑: {
    temperament:
      "큰 나무처럼 방향을 세우고 꾸준히 성장하려는 기질이 바탕에 있습니다.",
    strengths: [
      "목표를 세우고 먼저 길을 여는 추진력",
      "원칙과 책임을 지키려는 태도",
    ],
    cautions: [
      "정한 방향을 쉽게 바꾸지 못하는 완고함",
      "빠른 결론으로 주변의 속도를 놓치는 점",
    ],
  },
  을: {
    temperament:
      "풀과 덩굴처럼 환경을 살피며 유연하게 이어 가는 기질이 바탕에 있습니다.",
    strengths: [
      "상황과 사람 사이를 잇는 적응력",
      "작은 변화를 감지하는 섬세함",
    ],
    cautions: [
      "주변을 배려하다 결정을 늦추는 점",
      "속마음을 쌓아 두고 우회적으로 표현하는 점",
    ],
  },
  병: {
    temperament:
      "태양처럼 자신을 드러내고 주변에 활기를 나누려는 기질이 바탕에 있습니다.",
    strengths: [
      "분위기를 밝히고 사람을 모으는 표현력",
      "생각을 행동으로 옮기는 낙관적 추진력",
    ],
    cautions: [
      "주목받고 싶은 마음이 앞서는 점",
      "열기가 오른 뒤 세부를 놓치기 쉬운 점",
    ],
  },
  정: {
    temperament:
      "등불처럼 한곳을 세심하게 비추며 온기를 나누는 기질이 바탕에 있습니다.",
    strengths: [
      "대상의 미묘한 결을 읽는 집중력",
      "관계를 따뜻하게 돌보는 공감력",
    ],
    cautions: [
      "감정의 영향을 오래 품는 점",
      "완벽한 때를 기다리다 시작이 늦어지는 점",
    ],
  },
  무: {
    temperament:
      "큰 산처럼 중심을 잡고 쉽게 흔들리지 않으려는 기질이 바탕에 있습니다.",
    strengths: [
      "사람과 일을 받아내는 포용력",
      "긴 호흡으로 책임을 완수하는 안정감",
    ],
    cautions: [
      "익숙한 방식을 고수하는 경직성",
      "부담을 혼자 떠안고 표현하지 않는 점",
    ],
  },
  기: {
    temperament:
      "논밭처럼 필요한 것을 고르고 가꾸어 결실로 잇는 기질이 바탕에 있습니다.",
    strengths: [
      "현실적인 기준으로 정리하는 실무 감각",
      "사람의 필요를 세심하게 보살피는 힘",
    ],
    cautions: [
      "걱정이 많아 판단을 되풀이하는 점",
      "자잘한 문제까지 책임지려는 과부하",
    ],
  },
  경: {
    temperament:
      "단단한 쇠처럼 기준을 분명히 하고 과감히 정리하려는 기질이 바탕에 있습니다.",
    strengths: [
      "문제를 빠르게 가르고 실행하는 결단력",
      "불공정함에 맞서는 솔직함과 의리",
    ],
    cautions: [
      "표현이 날카롭거나 단정적으로 들리는 점",
      "과정의 감정보다 결과를 앞세우는 점",
    ],
  },
  신: {
    temperament:
      "다듬어진 보석처럼 완성도와 섬세한 차이를 중시하는 기질이 바탕에 있습니다.",
    strengths: ["작은 오차를 알아보는 정교함", "품질과 미감을 높이는 안목"],
    cautions: [
      "자신과 타인에게 기준을 높게 두는 점",
      "상처받은 마음을 오래 되새기는 점",
    ],
  },
  임: {
    temperament:
      "큰 강과 바다처럼 넓게 보고 자유롭게 흐르려는 기질이 바탕에 있습니다.",
    strengths: [
      "다양한 정보와 사람을 아우르는 포용력",
      "변화 속에서 새 길을 찾는 기획력",
    ],
    cautions: [
      "관심이 넓어 한곳에 머물기 어려운 점",
      "경계를 늦게 세워 에너지가 분산되는 점",
    ],
  },
  계: {
    temperament:
      "비와 이슬처럼 조용히 스며들며 흐름을 감지하는 기질이 바탕에 있습니다.",
    strengths: [
      "말하지 않은 분위기까지 읽는 관찰력",
      "정보를 모아 정교하게 판단하는 직관",
    ],
    cautions: [
      "생각을 안으로 돌려 불안을 키우는 점",
      "결정을 드러내기보다 미루는 점",
    ],
  },
};

const BRANCH_PROFILES: Record<EarthlyBranch, BranchProfile> = {
  자: {
    innerStyle:
      "내면에서는 생각과 감정이 빠르게 오가며 새로운 자극을 찾습니다.",
    strength: "정보를 모으고 기회를 포착하는 민첩함",
    caution: "생각이 많아져 휴식의 리듬이 흐트러지는 점",
  },
  축: {
    innerStyle: "내면에서는 충분히 확인한 뒤 안전하게 움직이려 합니다.",
    strength: "시간을 들여 기반을 단단히 만드는 인내",
    caution: "변화를 받아들이기까지 오래 걸리는 점",
  },
  인: {
    innerStyle: "내면에서는 가능성을 발견하면 곧바로 시작하고 싶어 합니다.",
    strength: "새로운 국면을 여는 용기와 생동감",
    caution: "준비보다 출발이 앞서기 쉬운 점",
  },
  묘: {
    innerStyle: "내면에서는 관계의 분위기와 조화를 섬세하게 살핍니다.",
    strength: "갈등을 부드럽게 조율하는 감각",
    caution: "불편한 말을 미루며 경계를 흐리는 점",
  },
  진: {
    innerStyle: "내면에서는 여러 가능성을 품고 때를 기다리는 편입니다.",
    strength: "서로 다른 자원을 묶어 크게 만드는 힘",
    caution: "생각과 계획이 많아 방향이 흔들리는 점",
  },
  사: {
    innerStyle: "내면에서는 대상을 깊이 파고들어 본질을 알아내려 합니다.",
    strength: "집중해서 해답을 찾아내는 탐구심",
    caution: "경계심이 높아 속내를 쉽게 열지 않는 점",
  },
  오: {
    innerStyle: "내면에서는 감정과 의사를 선명하고 빠르게 표현하려 합니다.",
    strength: "사람을 움직이는 열정과 존재감",
    caution: "감정이 뜨거울 때 반응이 커지는 점",
  },
  미: {
    innerStyle: "내면에서는 관계를 돌보고 편안한 자리를 만들려 합니다.",
    strength: "세심하게 보완하고 마무리하는 돌봄",
    caution: "타인의 몫까지 감당하며 지치는 점",
  },
  신: {
    innerStyle: "내면에서는 상황을 빠르게 분석해 가장 효율적인 길을 찾습니다.",
    strength: "변화에 맞춰 도구와 방법을 바꾸는 재치",
    caution: "효율을 좇다 관계의 온도를 놓치는 점",
  },
  유: {
    innerStyle: "내면에서는 기준을 세우고 결과를 깔끔하게 완성하려 합니다.",
    strength: "정리와 마감에서 드러나는 정확성",
    caution: "작은 흠결에도 예민해지는 점",
  },
  술: {
    innerStyle: "내면에서는 믿을 수 있는 사람과 원칙을 오래 지키려 합니다.",
    strength: "약속과 공동체를 보호하는 충실함",
    caution: "옳고 그름을 강하게 나누는 점",
  },
  해: {
    innerStyle: "내면에서는 경계를 넓혀 배우고 상상하는 시간을 필요로 합니다.",
    strength: "낯선 관점을 받아들이는 포용과 상상력",
    caution: "현실의 마감보다 가능성에 머무는 점",
  },
};

// 갑자에서 계해까지의 유효한 60조합만 둔다. 문장은 여러 전통적 상징을 참고해
// 이 프로젝트의 중립적 자기이해 문체로 새로 작성했다.
export const ILJU_SEEDS: Readonly<Record<string, IljuSeed>> = {
  갑자: {
    summary:
      "깊은 물가에 선 큰 나무처럼 배움을 성장의 힘으로 바꾸는 일주입니다.",
    keywords: ["성장", "탐구", "개척"],
  },
  을축: {
    summary: "찬 땅에 뿌리내린 풀처럼 조용한 끈기로 자리를 만드는 일주입니다.",
    keywords: ["인내", "실속", "적응"],
  },
  병인: {
    summary: "숲 위로 떠오른 햇빛처럼 활기차게 시작을 이끄는 일주입니다.",
    keywords: ["활력", "선도", "표현"],
  },
  정묘: {
    summary: "꽃과 잎을 비추는 등불처럼 섬세한 감각을 나누는 일주입니다.",
    keywords: ["감성", "배려", "미감"],
  },
  무진: {
    summary: "구름과 물길을 품은 산처럼 큰 흐름을 받아내는 일주입니다.",
    keywords: ["포용", "변화", "축적"],
  },
  기사: {
    summary: "햇볕을 머금은 밭처럼 사람과 일을 알맞게 길러내는 일주입니다.",
    keywords: ["실무", "관찰", "돌봄"],
  },
  경오: {
    summary: "불 속에서 단련되는 쇠처럼 도전을 통해 선명해지는 일주입니다.",
    keywords: ["결단", "승부", "정의"],
  },
  신미: {
    summary: "흙 속에서 다듬어지는 보석처럼 내실과 완성도를 쌓는 일주입니다.",
    keywords: ["정교", "내실", "품격"],
  },
  임신: {
    summary: "바위 사이를 흐르는 큰물처럼 변화에 맞춰 길을 찾는 일주입니다.",
    keywords: ["기지", "융통", "탐색"],
  },
  계유: {
    summary:
      "맑은 이슬이 금속에 맺히듯 예리한 감각으로 핵심을 읽는 일주입니다.",
    keywords: ["분석", "집중", "정돈"],
  },
  갑술: {
    summary: "마른 언덕에 선 큰 나무처럼 원칙과 책임으로 버티는 일주입니다.",
    keywords: ["책임", "신념", "보호"],
  },
  을해: {
    summary: "넓은 물 위의 수초처럼 부드럽게 연결되며 성장하는 일주입니다.",
    keywords: ["유연", "공감", "학습"],
  },
  병자: {
    summary: "겨울 물 위에 비친 햇빛처럼 상반된 기운을 조율하는 일주입니다.",
    keywords: ["조율", "재치", "대비"],
  },
  정축: {
    summary: "찬 땅을 덥히는 작은 불처럼 묵묵히 온기를 지키는 일주입니다.",
    keywords: ["성실", "온기", "지속"],
  },
  무인: {
    summary: "봄 숲을 받치는 산처럼 새로운 성장을 든든히 밀어주는 일주입니다.",
    keywords: ["기개", "후원", "시작"],
  },
  기묘: {
    summary:
      "고운 밭에서 꽃을 가꾸듯 관계와 결과를 섬세하게 돌보는 일주입니다.",
    keywords: ["조화", "관리", "세심"],
  },
  경진: {
    summary: "땅속 광맥을 찾아내듯 잠재력을 현실의 힘으로 바꾸는 일주입니다.",
    keywords: ["개척", "통찰", "실행"],
  },
  신사: {
    summary: "불빛에 드러난 보석처럼 예민한 감각과 집중력이 빛나는 일주입니다.",
    keywords: ["통찰", "완성", "집중"],
  },
  임오: {
    summary:
      "큰물과 한낮의 불이 만나듯 감성과 열정이 함께 움직이는 일주입니다.",
    keywords: ["열정", "변화", "매력"],
  },
  계미: {
    summary: "메마른 땅을 적시는 비처럼 필요한 곳을 조용히 돌보는 일주입니다.",
    keywords: ["배려", "회복", "현실감"],
  },
  갑신: {
    summary:
      "바위산을 뚫고 자라는 나무처럼 장애를 성장의 계기로 삼는 일주입니다.",
    keywords: ["도전", "혁신", "판단"],
  },
  을유: {
    summary: "정원사가 가지를 다듬듯 관계와 일을 정교하게 정리하는 일주입니다.",
    keywords: ["세련", "조율", "완성"],
  },
  병술: {
    summary: "해 질 녘 언덕의 빛처럼 신념과 온기를 오래 지키는 일주입니다.",
    keywords: ["의리", "지속", "표현"],
  },
  정해: {
    summary: "깊은 밤 물 위의 등불처럼 직관으로 길을 밝히는 일주입니다.",
    keywords: ["직관", "공감", "탐구"],
  },
  무자: {
    summary: "큰 둑이 물길을 품듯 움직이는 생각을 현실로 묶는 일주입니다.",
    keywords: ["관리", "기획", "안정"],
  },
  기축: {
    summary: "겨울 밭에 씨앗을 간직하듯 때를 기다리며 내실을 쌓는 일주입니다.",
    keywords: ["축적", "인내", "신중"],
  },
  경인: {
    summary: "새봄의 숲을 가르는 쇠처럼 빠른 결단으로 길을 여는 일주입니다.",
    keywords: ["결단", "개척", "속도"],
  },
  신묘: {
    summary: "꽃잎 위의 보석처럼 섬세한 관계 감각과 미감을 지닌 일주입니다.",
    keywords: ["미감", "예의", "민감"],
  },
  임진: {
    summary: "구름을 품은 큰 강처럼 생각과 가능성을 넓게 모으는 일주입니다.",
    keywords: ["포용", "기획", "변화"],
  },
  계사: {
    summary: "따뜻한 땅속의 샘처럼 조용한 집중으로 답을 찾아내는 일주입니다.",
    keywords: ["직관", "탐색", "집중"],
  },
  갑오: {
    summary: "햇빛을 향해 곧게 자라는 나무처럼 목표를 선명히 좇는 일주입니다.",
    keywords: ["진취", "표현", "리더십"],
  },
  을미: {
    summary:
      "부드러운 흙을 덮은 풀처럼 관계 속에서 꾸준히 결실을 만드는 일주입니다.",
    keywords: ["협력", "돌봄", "결실"],
  },
  병신: {
    summary: "빛이 금속에 반사되듯 재치와 표현이 빠르게 번뜩이는 일주입니다.",
    keywords: ["재치", "변화", "기술"],
  },
  정유: {
    summary: "정교한 촛불 공예처럼 감각을 다듬어 완성하는 일주입니다.",
    keywords: ["정밀", "예술", "집중"],
  },
  무술: {
    summary: "겹겹의 산처럼 신념과 책임감이 단단히 자리한 일주입니다.",
    keywords: ["신뢰", "원칙", "지구력"],
  },
  기해: {
    summary: "넓은 물을 머금은 땅처럼 다양한 마음을 받아 기르는 일주입니다.",
    keywords: ["포용", "학습", "배려"],
  },
  경자: {
    summary: "차가운 물에 씻긴 쇠처럼 판단이 빠르고 선명한 일주입니다.",
    keywords: ["판단", "정보", "실행"],
  },
  신축: {
    summary:
      "땅속에서 오래 다듬어진 광물처럼 조용히 가치를 축적하는 일주입니다.",
    keywords: ["내공", "신중", "품질"],
  },
  임인: {
    summary: "큰물이 봄 숲을 깨우듯 새로운 가능성을 키워내는 일주입니다.",
    keywords: ["성장", "모험", "상상"],
  },
  계묘: {
    summary: "봄잎에 스민 빗물처럼 감성과 관계를 부드럽게 잇는 일주입니다.",
    keywords: ["공감", "섬세", "조화"],
  },
  갑진: {
    summary:
      "습한 대지에 뿌리내린 큰 나무처럼 변화를 품고 성장하는 일주입니다.",
    keywords: ["성장", "포용", "기획"],
  },
  을사: {
    summary: "햇볕을 따라 뻗는 덩굴처럼 영리하게 기회를 연결하는 일주입니다.",
    keywords: ["기민", "관찰", "적응"],
  },
  병오: {
    summary: "한낮의 태양처럼 에너지와 존재감이 곧게 드러나는 일주입니다.",
    keywords: ["열정", "주도", "솔직"],
  },
  정미: {
    summary:
      "따뜻한 흙을 비추는 등불처럼 사람과 일을 다정히 가꾸는 일주입니다.",
    keywords: ["온화", "돌봄", "완성"],
  },
  무신: {
    summary: "광맥을 품은 산처럼 실용적인 자원과 해법을 찾아내는 일주입니다.",
    keywords: ["실용", "판단", "수완"],
  },
  기유: {
    summary: "수확물을 고르는 밭처럼 기준을 세워 꼼꼼히 마무리하는 일주입니다.",
    keywords: ["정리", "실속", "정확"],
  },
  경술: {
    summary: "성벽처럼 원칙과 의리를 단단하게 지키는 일주입니다.",
    keywords: ["의리", "보호", "결단"],
  },
  신해: {
    summary: "깊은 물에 씻긴 보석처럼 내면의 감각과 통찰이 맑은 일주입니다.",
    keywords: ["통찰", "감수성", "탐구"],
  },
  임자: {
    summary: "큰 강이 바다로 이어지듯 생각과 사람을 넓게 연결하는 일주입니다.",
    keywords: ["지혜", "포용", "확장"],
  },
  계축: {
    summary: "겨울 땅속의 물처럼 조용히 힘을 모아 때를 기다리는 일주입니다.",
    keywords: ["인내", "관찰", "축적"],
  },
  갑인: {
    summary: "울창한 숲의 큰 나무처럼 자립심과 성장력이 강한 일주입니다.",
    keywords: ["자립", "성장", "기개"],
  },
  을묘: {
    summary:
      "봄 정원의 풀꽃처럼 부드러움 속에 꾸준한 생명력을 지닌 일주입니다.",
    keywords: ["유연", "관계", "지속"],
  },
  병진: {
    summary: "구름 사이 햇빛처럼 변화 속에서도 방향을 밝히는 일주입니다.",
    keywords: ["낙관", "기획", "활력"],
  },
  정사: {
    summary: "심지를 품은 불꽃처럼 집중과 열정이 안에서 깊어지는 일주입니다.",
    keywords: ["몰입", "직관", "온기"],
  },
  무오: {
    summary: "햇볕을 받은 산처럼 든든한 존재감과 추진력을 드러내는 일주입니다.",
    keywords: ["주도", "신뢰", "활동"],
  },
  기미: {
    summary: "비옥한 들판처럼 사람과 자원을 보살펴 결실로 잇는 일주입니다.",
    keywords: ["돌봄", "실속", "조화"],
  },
  경신: {
    summary: "단단히 벼린 도구처럼 판단과 실행이 빠르고 명료한 일주입니다.",
    keywords: ["결단", "기술", "독립"],
  },
  신유: {
    summary: "완성된 보석처럼 기준과 미감이 또렷하게 드러나는 일주입니다.",
    keywords: ["완벽", "미감", "정돈"],
  },
  임술: {
    summary: "큰물이 단단한 둑을 만나듯 자유와 책임을 함께 배우는 일주입니다.",
    keywords: ["책임", "포용", "신념"],
  },
  계해: {
    summary:
      "깊은 물에 내리는 비처럼 직관과 상상력이 자연스럽게 흐르는 일주입니다.",
    keywords: ["직관", "상상", "공감"],
  },
};

function describeRelation(stem: HeavenlyStem, branch: EarthlyBranch): string {
  const stemData = getHeavenlyStemByKorean(stem)!;
  const branchData = getEarthlyBranchByKorean(branch)!;
  const day = `일간 ${stemData.hanja}(${stemData.element})`;
  const seat = `일지 ${branchData.hanja}(${branchData.element})`;

  if (stemData.element === branchData.element) {
    return `${josa(day, "과/와")} ${josa(seat, "이/가")} 같은 오행이라, 생각과 행동의 방향이 한곳으로 모이기 쉽습니다.`;
  }
  if (getGeneratedElement(branchData.element) === stemData.element) {
    return `${josa(seat, "이/가")} ${josa(day, "을/를")} 생(生)하는 자리라, 내면의 경험이 자신을 북돋는 흐름으로 읽습니다.`;
  }
  if (getGeneratedElement(stemData.element) === branchData.element) {
    return `${josa(day, "이/가")} ${josa(seat, "을/를")} 생(生)하는 자리라, 자신이 가진 힘을 표현하고 돌보는 데 쓰기 쉽습니다.`;
  }
  if (getControlledElement(branchData.element) === stemData.element) {
    return `${josa(seat, "이/가")} ${josa(day, "을/를")} 극(剋)하는 자리라, 내면의 긴장과 기준이 성장의 자극이 되기 쉽습니다.`;
  }
  return `${josa(day, "이/가")} ${josa(seat, "을/를")} 극(剋)하는 자리라, 현실을 관리하고 주도하려는 힘과 조절 과제가 함께 나타납니다.`;
}

export function getIljuInterpretation(
  stem: HeavenlyStem,
  branch: EarthlyBranch,
): IljuInterpretation {
  const key = `${stem}${branch}`;
  const seed = ILJU_SEEDS[key];
  if (!seed) throw new Error(`유효하지 않은 일주 조합입니다: ${key}`);

  const stemData = getHeavenlyStemByKorean(stem)!;
  const branchData = getEarthlyBranchByKorean(branch)!;
  const stemProfile = STEM_PROFILES[stem];
  const branchProfile = BRANCH_PROFILES[branch];

  return {
    key,
    name: `${key}일주`,
    hanja: `${stemData.hanja}${branchData.hanja}`,
    summary: seed.summary,
    keywords: [...seed.keywords],
    temperament: stemProfile.temperament,
    innerStyle: branchProfile.innerStyle,
    relation: describeRelation(stem, branch),
    strengths: [...stemProfile.strengths, branchProfile.strength],
    cautions: [...stemProfile.cautions, branchProfile.caution],
  };
}
