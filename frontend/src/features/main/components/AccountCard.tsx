import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { formatWon } from '@/features/shared/data';
import { useSelectedAccount } from '@/features/shared/state/selectedAccount';
import { BORDER, CREAM, INK, YELLOW } from '../theme';
import { IconCard } from './icons';

/** 현재 앱에서 선택한 통장을 홈에서도 동일하게 보여준다. */
export function AccountCard() {
  const { selectedAccount } = useSelectedAccount();

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <IconCard />
        </View>
        <View style={styles.flex1}>
          <AppText
            size={15}
            weight={700}
            color="#888"
            numberOfLines={1}
            style={styles.mb3}
          >
            {selectedAccount.bankName} · {selectedAccount.accountName}
          </AppText>
          <AppText size={26} weight={900} color={INK} letterSpacing={-0.5} style={styles.mb2}>
            {formatWon(selectedAccount.balance)}
          </AppText>
          <AppText size={14} color="#AAA" numberOfLines={1}>
            {selectedAccount.maskedAccountNumber}
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
