import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { formatWon, type Account } from '@/features/shared/data';
import { colors, radius, spacing } from '@/theme/tokens';

/** 현재 통장을 두 줄로 보여주는 컴팩트한 전체 클릭형 선택 카드. */
export function SelectedAccountCard({
  account,
  onChange,
}: {
  account: Account;
  onChange: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${account.accountName}, ${account.maskedAccountNumber}, 잔액 ${formatWon(account.balance)}`}
      accessibilityHint="다른 통장을 선택하는 창을 엽니다"
      onPress={onChange}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.row}>
        <AppText
          size={19}
          weight={900}
          color={colors.mainInk}
          numberOfLines={1}
          style={styles.name}
        >
          {account.accountName}
        </AppText>
        <View style={styles.changeLabel}>
          <AppText size={17} weight={800} color={colors.accentText}>
            변경
          </AppText>
          <AppText size={17} weight={800} color={colors.accentText}>
            〉
          </AppText>
        </View>
      </View>

      <View style={styles.row}>
        <AppText
          size={15}
          weight={600}
          color={colors.muted}
          numberOfLines={1}
          style={styles.number}
        >
          {account.maskedAccountNumber}
        </AppText>
        <AppText
          size={18}
          weight={800}
          color={colors.mainInk}
          letterSpacing={-0.3}
          numberOfLines={1}
          style={styles.balance}
        >
          {formatWon(account.balance)}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 84,
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  cardPressed: {
    backgroundColor: colors.accentSurface,
    borderColor: colors.mainBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  name: { flex: 1 },
  changeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  number: { flex: 1, minWidth: 0 },
  balance: { flexShrink: 0 },
});
