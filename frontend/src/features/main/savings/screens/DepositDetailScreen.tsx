import { ScrollView, StyleSheet, View } from 'react-native';

import { speak } from '@/lib/speech/tts';
import { AskDanbiButton, HomeBar, SavingsHeader } from '../../imports/_shared';
import { DepositDetailBody } from '../../imports/DepositDetail';

/** danbi_jj main/screens/savings.tsx <DepositDetailScreen> 이식. */
export function DepositDetailScreen({ onBack, onHome }: { onBack: () => void; onHome: () => void }) {
  return (
    <View style={styles.root}>
      <SavingsHeader title="예금 상세" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <DepositDetailBody />
        <AskDanbiButton onPress={() => speak('예금 금리와 만기 금액을 확인하고 싶다면 가까운 영업점이나 고객센터에 문의해주세요.')} />
      </ScrollView>
      <HomeBar onHome={onHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBFAF7' },
  body: { padding: 18, gap: 14 },
});
