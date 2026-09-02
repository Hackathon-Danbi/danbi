import { ScrollView, StyleSheet, View } from 'react-native';

import { speak } from '@/lib/speech/tts';
import { AskDanbiButton, HomeBar, SavingsHeader } from '../../imports/_shared';
import { SavingsDetailBody } from '../../imports/SavingsDetail';

/** danbi_jj main/screens/savings.tsx <SavingsDetailScreen> 이식. */
export function SavingsDetailScreen({ onBack, onHome }: { onBack: () => void; onHome: () => void }) {
  return (
    <View style={styles.root}>
      <SavingsHeader title="적금 상세" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <SavingsDetailBody />
        <AskDanbiButton onPress={() => speak('적금 납입 일정과 예상 만기 금액을 차근차근 확인해보세요.')} />
      </ScrollView>
      <HomeBar onHome={onHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBFAF7' },
  body: { padding: 18, gap: 14 },
});
