/**
 * danbi_jj 의 CSS `:root`(app/styles/base.css) 와 app/features/main/theme.ts 에서
 * 실제 사용되는 색상 / 간격 / 반경만 옮긴 디자인 토큰.
 * React Native 에는 CSS 변수/className 이 없으므로 이 상수들을 직접 참조한다.
 */

export const colors = {
  // base.css :root
  yellow: '#ffcc00',
  yellowSoft: '#fff8d6',
  brown: '#4e3f25',
  accentBorder: '#d6aa00',
  accentText: '#6e5600',
  accentSurface: '#fffdf3',
  ink: '#161616',
  muted: '#696969',
  line: '#e5e2da',
  paper: '#fffef9',
  appStageBackground: '#f3f1eb',

  // main/theme.ts (Figma 원본 메인 앱 화면)
  cream: '#FFFDF8',
  mainYellow: '#FFC400',
  mainBorder: '#F6D879',
  mainInk: '#111111',

  // WelcomeModeScreen (onboarding.css .welcome-*)
  welcomeSoundBg: '#ffe781',
  welcomeSoundShadow: '#edbd00',
  welcomeCopyBody: '#34332f',
  welcomeActionsHint: '#67635c',
  welcomeActionsStrong: '#b58900',
  mascotBody: '#ffd634',
  mascotArm: '#ffd634',
  mascotFace: '#28251e',
  mascotCheek: 'rgba(255, 132, 70, 0.35)',

  white: '#ffffff',
  black: '#000000',
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
  round: 9999,
} as const;

/** danbi_jj 는 8pt 계열 간격을 인라인으로 흩어 썼다. 자주 나오는 값만 정리. */
export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 34,
} as const;

/** 이 금액 이상이면 송금 전 추가 확인 (main/theme.ts LARGE_AMOUNT_THRESHOLD). */
export const largeAmountThreshold = 1_000_000;

export type ColorToken = keyof typeof colors;
