import { Stack } from 'expo-router';

import { TransactionProvider } from '@/features/main/TransactionContext';
import { SelectedAccountProvider } from '@/features/shared/state/selectedAccount';
import { colors } from '@/theme/tokens';

/**
 * 메인 앱 영역. 시연 중에는 가입 여부와 관계없이 홈으로 들어갈 수 있다.
 */
export default function AppLayout() {
  return (
    <TransactionProvider>
      <SelectedAccountProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.paper },
          }}
        />
      </SelectedAccountProvider>
    </TransactionProvider>
  );
}
