import { ScrollView, StyleSheet, View } from 'react-native';

import { AskDanbiButton, HomeBar, SavingsHeader } from '../../imports/_shared';
import { SavingsDetailBody } from '../../imports/SavingsDetail';
import type { SavingsInstallmentDetail } from '@/api';

/** danbi_jj main/screens/savings.tsx <SavingsDetailScreen> 이식. */
export function SavingsDetailScreen({
  onBack,
  onHome,
  detail,
  onAskDanbi,
}: {
  onBack: () => void;
  onHome: () => void;
  detail: SavingsInstallmentDetail;
  onAskDanbi: () => void;
}) {
  return (
    <View style={styles.root}>
      <SavingsHeader title="적금 상세" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <SavingsDetailBody detail={detail} />
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
