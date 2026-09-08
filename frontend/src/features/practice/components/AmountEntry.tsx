import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';
import { CompactNumberPad, type NumericKey } from './NumericKeypad';

interface QuickAmount {
  value: string;
  label: string;
  suggested?: boolean;
  attention?: boolean;
}

/** danbi_jj practice/components/AmountEntry.tsx 이식. */
export function AmountEntry({
  amount,
  formattedAmount,
  label,
  quickAmounts,
  onSelectQuickAmount,
  onKey,
  onSubmit,
  submitDisabled,
  children,
  afterQuickAmounts,
  highlighted = false,
  submitUnavailable = false,
}: {
  amount: string;
  formattedAmount: string;
  label: string;
  quickAmounts: readonly QuickAmount[];
  onSelectQuickAmount: (amount: string) => void;
  onKey: (key: NumericKey) => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  pageClassName?: string;
  keypadAriaLabel?: string;
  children: ReactNode;
  afterQuickAmounts?: ReactNode;
  className?: string;
  highlighted?: boolean;
  padClassName?: string;
  submitClassName?: string;
  submitUnavailable?: boolean;
}) {
  return (
    <>
      <View style={styles.page}>
        {children}
        <View style={[styles.display, highlighted && styles.displayHighlight]}>
          <AppText size={13} color={P.muted}>
            {label}
          </AppText>
          <AppText
            size={34}
            weight={900}
            color={P.ink}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {amount ? formattedAmount : '0'}
            <AppText size={20} weight={900} color={P.ink}>
              원
            </AppText>
          </AppText>
        </View>
        <View style={styles.quick}>
          {quickAmounts.map((q) => (
            <Pressable
              key={q.value}
              accessibilityRole="button"
              onPress={() => onSelectQuickAmount(q.value)}
              style={[styles.quickBtn, q.suggested && styles.quickSuggested]}
            >
              <AppText size={14} weight={700} color={P.ink}>
                {q.label}
              </AppText>
            </Pressable>
          ))}
        </View>
        {afterQuickAmounts}
      </View>

      <View style={styles.pad}>
        <CompactNumberPad mode="amount" onKey={onKey} />
        <Pressable
          accessibilityRole="button"
          disabled={submitDisabled || submitUnavailable}
          onPress={onSubmit}
          style={[styles.submit, (submitDisabled || submitUnavailable) && styles.submitOff]}
        >
          <AppText size={18} weight={850} color={submitDisabled || submitUnavailable ? '#8a857a' : '#fff'}>
            다음
          </AppText>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 16, gap: 14, flex: 1 },
  display: {
    gap: 6,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e4e8f4',
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  displayHighlight: { borderColor: P.accent },
  quick: { flexDirection: 'row', gap: 8 },
  quickBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e4e8f4',
    backgroundColor: P.accentSurface,
  },
  quickSuggested: { borderColor: P.accent, backgroundColor: P.accentSoft },
  pad: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 12, gap: 12 },
  submit: {
    width: '100%',
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: P.accent,
  },
  submitOff: { backgroundColor: '#ddd9cf' },
});
