import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { YELLOW } from '../theme';
import { TabIconHome, TabIconList, TabIconSend } from './icons';

type TabId = 'transfer' | 'home' | 'transactions';

/** danbi_jj main/components.tsx <BottomTabBar> 이식. */
export function BottomTabBar({
  active,
  onTransfer,
  onHome,
  onTransactions,
}: {
  active: TabId;
  onTransfer: () => void;
  onHome: () => void;
  onTransactions: () => void;
}) {
  const tabs: { id: TabId; label: string; render: (a: boolean) => React.ReactNode; action: () => void }[] = [
    { id: 'transfer', label: '송금하기', render: (a) => <TabIconSend active={a} />, action: onTransfer },
    { id: 'home', label: '홈', render: (a) => <TabIconHome active={a} />, action: onHome },
    { id: 'transactions', label: '거래내역', render: (a) => <TabIconList active={a} />, action: onTransactions },
  ];

  return (
    <View style={styles.bar}>
      {tabs.map(({ id, label, render, action }) => {
        const isActive = active === id;
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            disabled={isActive}
            onPress={action}
            style={styles.tab}
          >
            {render(isActive)}
            <AppText size={11} weight={700} color={isActive ? YELLOW : '#999'}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1.5,
    borderTopColor: '#EBEBEB',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingTop: 12,
    paddingBottom: 14,
  },
});
