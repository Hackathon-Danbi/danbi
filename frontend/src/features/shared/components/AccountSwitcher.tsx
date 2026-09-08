import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { Account } from '@/features/shared/data';
import { AccountPickerSheet } from './AccountPickerSheet';
import { SelectedAccountCard } from './SelectedAccountCard';

/**
 * 거래내역 / 돈 보내기 상단에서 함께 쓰는 계좌 선택 UI.
 *
 *   AccountSwitcher
 *    ├─ SelectedAccountCard   (현재 통장 + "변경")
 *    └─ AccountPickerSheet    (하단에서 올라오는 큰 선택창)
 */
export function AccountSwitcher({
  selectedAccount,
  accounts,
  onChangeAccount,
  title,
}: {
  selectedAccount: Account;
  accounts: Account[];
  onChangeAccount: (account: Account) => void;
  /** 카드 위의 짧은 안내 라벨. 거래내역처럼 자명한 화면에서는 생략한다. */
  title?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      {title ? (
        <AppText size={16} weight={800} color="#4A4A4A" style={styles.guide}>
          {title}
        </AppText>
      ) : null}

      <SelectedAccountCard account={selectedAccount} onChange={() => setPickerOpen(true)} />

      <AccountPickerSheet
        visible={pickerOpen}
        accounts={accounts}
        selectedId={selectedAccount.accountId}
        onSelect={(account) => {
          onChangeAccount(account);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  guide: { marginBottom: 6 },
});
