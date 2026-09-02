import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';

const ACCOUNT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', '⌫'] as const;
const AMOUNT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'] as const;
const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export type NumericKey = Exclude<(typeof ACCOUNT_KEYS)[number] | (typeof AMOUNT_KEYS)[number], null>;

/** danbi_jj practice/components/NumericKeypad.tsx <CompactNumberPad> 이식. */
export function CompactNumberPad({
  mode,
  onKey,
}: {
  mode: 'account' | 'amount';
  onKey: (key: NumericKey) => void;
  ariaLabel?: string;
}) {
  const keys = mode === 'account' ? ACCOUNT_KEYS : AMOUNT_KEYS;
  return (
    <View style={styles.grid}>
      {keys.map((key, index) =>
        key ? (
          <Pressable
            key={`${key}-${index}`}
            accessibilityRole="button"
            accessibilityLabel={key === '⌫' ? '지우기' : key}
            onPress={() => onKey(key)}
            style={styles.key}
          >
            <AppText size={22} weight={700} color={P.ink}>
              {key}
            </AppText>
          </Pressable>
        ) : (
          <View key={`blank-${index}`} style={[styles.key, styles.blank]} />
        ),
      )}
    </View>
  );
}

/** danbi_jj practice/components/NumericKeypad.tsx <PinNumberPad> 이식. */
export function PinNumberPad({
  value,
  onChange,
  onCancel,
  maxLength = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  className?: string;
  ariaLabel?: string;
  maxLength?: number;
}) {
  const append = (digit: string) => {
    if (value.length < maxLength) onChange(`${value}${digit}`);
  };
  return (
    <View style={styles.grid}>
      {PIN_KEYS.map((n) => (
        <Pressable key={n} accessibilityRole="button" onPress={() => append(n)} style={styles.key}>
          <AppText size={22} weight={700} color={P.ink}>
            {n}
          </AppText>
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" onPress={onCancel} style={[styles.key, styles.textKey]}>
        <AppText size={15} weight={700} color="#c0392b">
          취소
        </AppText>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => append('0')} style={styles.key}>
        <AppText size={22} weight={700} color={P.ink}>
          0
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange(value.slice(0, -1))}
        style={[styles.key, styles.textKey]}
      >
        <AppText size={15} weight={700} color={P.ink}>
          지우기
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  key: {
    width: '31.5%',
    flexGrow: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e4e8f4',
    backgroundColor: '#fff',
  },
  textKey: { backgroundColor: '#f3f4fb' },
  blank: { opacity: 0, borderWidth: 0 },
});
