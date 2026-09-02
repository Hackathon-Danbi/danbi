import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';
import { formatAccountNumber } from '../utils';

/** danbi_jj practice/components/AccountNumberEntry.tsx 이식. */
export function AccountNumberEntry({
  value,
  accountLabel,
  bankDescription,
}: {
  value: string;
  accountLabel: string;
  bankDescription: string;
  real?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bankChoice}>
        <View style={styles.bankMark}>
          <AppText size={13} weight={900} color="#fff">
            KB
          </AppText>
        </View>
        <View style={styles.flex1}>
          <AppText size={16} weight={800} color={P.ink}>
            KB국민은행
          </AppText>
          <AppText size={13} color={P.muted}>
            {bankDescription}
          </AppText>
        </View>
        <AppText size={16} weight={900} color={P.accent}>
          ✓
        </AppText>
      </View>
      <View style={styles.display}>
        <AppText size={13} color={P.muted}>
          {accountLabel}
        </AppText>
        <AppText size={22} weight={800} color={value ? P.ink : '#aaa'} letterSpacing={1}>
          {formatAccountNumber(value)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 12 },
  flex1: { flex: 1 },
  bankChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: P.accentBorder,
    backgroundColor: P.accentSurface,
  },
  bankMark: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#f5c100',
    alignItems: 'center',
    justifyContent: 'center',
  },
  display: {
    gap: 6,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: P.accent,
    backgroundColor: '#fff',
  },
});
