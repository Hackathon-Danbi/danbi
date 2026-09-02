import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BORDER, CREAM, INK, YELLOW } from '../theme';
import { IconCard } from './icons';

/** danbi_jj main/components.tsx <AccountCard> 이식. */
export function AccountCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <IconCard />
        </View>
        <View style={styles.flex1}>
          <AppText size={13} weight={700} color="#888" style={styles.mb3}>
            KB나라사랑우대통장 (7878)
          </AppText>
          <AppText size={26} weight={900} color={INK} letterSpacing={-0.5} style={styles.mb2}>
            1,250,000원
          </AppText>
          <AppText size={12} color="#AAA">
            출금 가능 금액 1,250,000원
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 18,
    marginBottom: 18,
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: BORDER,
    backgroundColor: CREAM,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: { flex: 1 },
  mb3: { marginBottom: 3 },
  mb2: { marginBottom: 2 },
});
