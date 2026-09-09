import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';

export function PracticePage({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.page, style]}>{children}</View>;
}

export function StepIntro({ children }: { children: ReactNode }) {
  return <View style={styles.stepIntro}>{children}</View>;
}

export function Title({ eyebrow, children }: { eyebrow?: string; children: string }) {
  return (
    <View style={styles.titleWrap}>
      {eyebrow ? (
        <AppText size={14} weight={800} color={P.accentText} style={styles.eyebrow}>
          {eyebrow}
        </AppText>
      ) : null}
      <AppText size={30} weight={900} color={P.ink} lineHeight={38} letterSpacing={-1.4}>
        {children}
      </AppText>
    </View>
  );
}

export function GuidedInstruction({ children }: { children: string }) {
  return (
    <AppText size={17} weight={600} color={P.accentText} lineHeight={25} style={styles.guided}>
      {children}
    </AppText>
  );
}

export function BottomActions({ children }: { children: ReactNode }) {
  return <View style={styles.bottomActions}>{children}</View>;
}

type BtnProps = { label: string; onPress: () => void; disabled?: boolean };

export function PrimaryButton({ label, onPress, disabled }: BtnProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.btn, styles.primary, disabled && styles.primaryOff]}
    >
      <AppText size={18} weight={850} color={disabled ? '#8a857a' : '#fff'}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress }: BtnProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.btn, styles.outline]}>
      <AppText size={17} weight={800} color={P.accentText}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: BtnProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.btn, styles.secondary]}>
      <AppText size={17} weight={800} color="#292721">
        {label}
      </AppText>
    </Pressable>
  );
}

export function QuietButton({ label, onPress }: BtnProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.quiet}>
      <AppText size={16} weight={700} color="#4e4a43" style={styles.underline}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function SafetyNote({ text }: { text: string }) {
  return (
    <View style={styles.safety}>
      <View style={styles.safetyMark}>
        <AppText size={15} weight={900} color="#fff">
          ✓
        </AppText>
      </View>
      <AppText size={15} weight={700} color={P.ink} lineHeight={22} style={styles.flex1}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 22, paddingTop: 18, gap: 18 },
  stepIntro: { gap: 12 },
  titleWrap: { gap: 6 },
  eyebrow: {},
  guided: {},
  flex1: { flex: 1 },
  underline: { textDecorationLine: 'underline' },
  bottomActions: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: P.line,
    backgroundColor: 'rgba(255,254,249,0.98)',
  },
  btn: {
    width: '100%',
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  primary: { backgroundColor: P.accent },
  primaryOff: { backgroundColor: '#ddd9cf' },
  outline: { borderWidth: 2, borderColor: P.accentBorder, backgroundColor: '#fff' },
  secondary: { borderWidth: 2, borderColor: '#c8c2b4', backgroundColor: '#fff' },
  quiet: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  safety: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: P.accentSoft,
  },
  safetyMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: P.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
