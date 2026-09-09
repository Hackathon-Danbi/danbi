import { ScrollView, StyleSheet, View } from 'react-native';

import { AskDanbiButton, HomeBar, SavingsHeader } from '../../imports/_shared';
import { DepositDetailBody } from '../../imports/DepositDetail';
import type { SavingsDepositDetail } from '@/api';

/** danbi_jj main/screens/savings.tsx <DepositDetailScreen> 이식. */
export function DepositDetailScreen({
  onBack,
  onHome,
  detail,
  onAskDanbi,
}: {
  onBack: () => void;
  onHome: () => void;
  detail: SavingsDepositDetail;
  onAskDanbi: () => void;
}) {
  return (
    <View style={styles.root}>
      <SavingsHeader title="예금 상세" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <DepositDetailBody detail={detail} />
        <AskDanbiButton onPress={onAskDanbi} />
      </ScrollView>
      <HomeBar onHome={onHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBFAF7' },
  body: { padding: 18, gap: 14 },
});
