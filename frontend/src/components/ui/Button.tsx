import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radius } from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'quiet';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** 원본 큰 버튼(welcome 등)용. 기본 62(chrome.css). */
  minHeight?: number;
  fontSize?: number;
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
};

/** danbi_jj chrome.css 의 .primary/.secondary/.outline/.quiet-button 대응. */
export function Button({
  label,
  variant = 'primary',
  disabled = false,
  minHeight = 62,
  fontSize = 18,
  fullWidth = true,
  style,
  ...rest
}: ButtonProps) {
  const v = VARIANTS[variant];
  const bg = disabled ? colors.line : v.bg;
  const fg = disabled ? colors.muted : v.fg;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { minHeight, backgroundColor: bg, borderColor: v.border ?? bg },
        v.border ? styles.bordered : null,
        fullWidth ? styles.fullWidth : null,
        pressed && !disabled ? styles.pressed : null,
        style as ViewStyle,
      ]}
      {...rest}
    >
      <View pointerEvents="none">
        <AppText size={fontSize} weight={850} color={fg} align="center">
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const VARIANTS: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.yellow, fg: '#241d08' },
  secondary: { bg: colors.white, fg: '#292721', border: '#c8c2b4' },
  outline: { bg: colors.white, fg: '#5e4b00', border: '#b38e00' },
  quiet: { bg: '#efede7', fg: '#34322d' },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md + 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  bordered: {
    borderWidth: 2,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ translateY: 1 }],
  },
});
