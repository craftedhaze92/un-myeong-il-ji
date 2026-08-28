/**
 * 한국어 조사(助詞) 처리 유틸리티
 *
 * 오행·천간·지지·십성 이름은 받침 유무가 제각각이라("목/금"은 받침 有,
 * "화/토/수"는 받침 無) 서술 문장을 조립할 때마다 올바른 조사를 붙여야 한다.
 * `${el}이(가)` 같은 이중 표기로 회피하지 않고 이 모듈에서 결정론적으로 고른다.
 */

export type JosaPair = "이/가" | "을/를" | "은/는" | "과/와" | "으로/로" | "이나/나" | "이라/라";

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

/** "용신(토)" 같은 표기에서 조사 판단은 괄호 안 마지막 글자("토")를 기준으로 한다. */
function stripTrailingClosers(word: string): string {
  return word.replace(/[)\]}」』"'”’]+$/u, "");
}

/**
 * 조사 판단에 쓸 마지막 글자의 종성(받침) 인덱스.
 * 0이면 받침 없음, 1~27이면 해당 받침. 한글 음절이 아니면 null.
 */
function finalConsonantIndex(word: string): number | null {
  const trimmed = stripTrailingClosers(word);
  if (!trimmed) return null;
  const code = trimmed.charCodeAt(trimmed.length - 1);
  if (code < HANGUL_START || code > HANGUL_END) return null;
  return (code - HANGUL_START) % 28;
}

/**
 * 받침 유무 판정. 숫자·영문 등 한글 음절이 아닌 경우는 받침 있음으로 간주한다
 * (예: "3개를", "AI를").
 */
export function hasBatchim(word: string): boolean {
  const idx = finalConsonantIndex(word);
  return idx === null ? true : idx !== 0;
}

/** 단어에 맞는 조사만 반환한다. */
export function pickJosa(word: string, pair: JosaPair): string {
  const idx = finalConsonantIndex(word);
  const batchim = idx === null ? true : idx !== 0;

  switch (pair) {
    case "이/가":
      return batchim ? "이" : "가";
    case "을/를":
      return batchim ? "을" : "를";
    case "은/는":
      return batchim ? "은" : "는";
    case "과/와":
      return batchim ? "과" : "와";
    case "이나/나":
      return batchim ? "이나" : "나";
    case "이라/라":
      return batchim ? "이라" : "라";
    case "으로/로": {
      const isRieul = idx === 8; // ㄹ받침("을", "물" 등)은 "으로"가 아니라 "로"
      return batchim && !isRieul ? "으로" : "로";
    }
  }
}

/** 단어 뒤에 맞는 조사를 붙여 반환한다. */
export function josa(word: string, pair: JosaPair): string {
  return word + pickJosa(word, pair);
}

/**
 * 여러 구절을 한국어 나열형으로 합친다. 마지막 구절 앞에만 받침에 맞는
 * "과/와"를 붙이고, 그 앞은 쉼표로 나열한다 (예: "A, B와 C").
 * `${a}과 ${b}과 ${c}` 처럼 모든 접속에 동일한 조사를 반복하는 것보다 자연스럽다.
 */
export function joinKoreanList(parts: string[]): string {
  const filtered = parts.filter(Boolean);
  if (filtered.length === 0) return '';
  if (filtered.length === 1) return filtered[0]!;

  const last = filtered[filtered.length - 1]!;
  const rest = filtered.slice(0, -1);
  return `${rest.join(', ')}${pickJosa(rest[rest.length - 1]!, "과/와")} ${last}`;
}
