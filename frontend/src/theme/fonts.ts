/**
 * 폰트 중앙 관리.
 *
 * 우선순위: Pretendard(로컬 OTF) → 시스템 한글 폰트.
 *
 * RN 코드에 CSS 식 fallback 문자열을
 * 넣지 않는다. `useAppFonts()` 로 로드를 시도하고, `fontFamily(weight)` 가 그 시점에
 * 실제 로드된 단일 패밀리명(없으면 undefined = 시스템)을 돌려준다.
 *
 * 웹에서는 expo-font 가 동일 키로 @font-face 를 주입하므로 같은 경로로 동작한다.
 * 폰트 로드가 실패하면 시스템 글꼴로 내려간다.
 */
import { isLoaded, useFonts } from 'expo-font';

export type FontWeightToken = 'regular' | 'medium' | 'semibold' | 'bold' | 'black';

const PRETENDARD_FAMILY: Record<FontWeightToken, string> = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  black: 'Pretendard-Black',
};

export const fontAssets: Record<string, number> = {
  [PRETENDARD_FAMILY.regular]: require('@/assets/fonts/Pretendard-Regular.otf'),
  [PRETENDARD_FAMILY.medium]: require('@/assets/fonts/Pretendard-Medium.otf'),
  [PRETENDARD_FAMILY.semibold]: require('@/assets/fonts/Pretendard-SemiBold.otf'),
  [PRETENDARD_FAMILY.bold]: require('@/assets/fonts/Pretendard-Bold.otf'),
  [PRETENDARD_FAMILY.black]: require('@/assets/fonts/Pretendard-Black.otf'),
};

/**
 * 앱 부팅 시 폰트 로드를 시도한다. 스플래시는 "성공" 이 아니라 "시도 완료" 기준으로
 * 내린다 — 폰트가 실패해도 시스템 폰트로 앱이 떠야 하기 때문.
 */
export function useAppFonts(): { fontsReady: boolean; fontsError: Error | null } {
  const [loaded, error] = useFonts(fontAssets);
  return { fontsReady: loaded || !!error, fontsError: error ?? null };
}

/** 주어진 굵기에 대해 현재 실제 사용할 수 있는 폰트 패밀리명. 없으면 undefined(시스템). */
export function fontFamily(weight: FontWeightToken = 'regular'): string | undefined {
  const pretendard = PRETENDARD_FAMILY[weight];
  if (isLoaded(pretendard)) return pretendard;
  return undefined;
}

/** 숫자 굵기(원본 CSS 의 font-weight 값) → 토큰. */
export function weightToken(numeric: number): FontWeightToken {
  if (numeric >= 850) return 'black';
  if (numeric >= 700) return 'bold';
  if (numeric >= 600) return 'semibold';
  if (numeric >= 500) return 'medium';
  return 'regular';
}
