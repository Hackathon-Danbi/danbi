import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors } from '@/theme/tokens';
import { fontFamily, weightToken } from '@/theme/fonts';

export type AppTextProps = TextProps & {
  /** px 크기 (원본 CSS font-size 그대로 유지). */
  size?: number;
  /** 원본 CSS font-weight 값 (400/500/600/700/800/900). */
  weight?: number;
  color?: string;
  /** 숫자면 px, 없으면 size * 1.4. */
  lineHeight?: number;
  align?: TextStyle['textAlign'];
  letterSpacing?: number;
};

/**
 * 모든 텍스트의 단일 진입점. 폰트 패밀리는 theme/fonts.ts 가 중앙에서 결정한다
 * (Pretendard → 시스템). 커스텀 패밀리가 로드된 경우 fontWeight 를
 * 지정하지 않고(패밀리 자체가 굵기), 시스템 폰트로 내려간 경우에만 fontWeight 를 준다.
 */
export function AppText({
  size = 16,
  weight = 400,
  color = colors.ink,
  lineHeight,
  align,
  letterSpacing,
  style,
  ...rest
}: AppTextProps) {
  const family = fontFamily(weightToken(weight));

  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: size,
          lineHeight: lineHeight ?? Math.round(size * 1.4),
          color,
          fontFamily: family,
          ...(family ? null : { fontWeight: String(weight) as TextStyle['fontWeight'] }),
          ...(align ? { textAlign: align } : null),
          ...(letterSpacing != null ? { letterSpacing } : null),
        },
        style,
      ]}
    />
  );
}
