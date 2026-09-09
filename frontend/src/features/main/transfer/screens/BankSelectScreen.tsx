import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { INK } from '../../theme';
import { BankGrid } from '../../components/BankGrid';
import { FloatingHomeButton } from '../../components/FloatingHomeButton';
import { NavBar } from '../../components/NavBar';

/** danbi_jj main/screens/transfer.tsx <BankSelectScreen> 이식. */
export function BankSelectScreen({
  onBack,
  onSelect,
  helpTarget,
  onActivity,
}: {
  onBack: () => void;
  onSelect: (bank: string) => void;
  helpTarget: string;
  onActivity: () => void;
}) {
  const [picked, setPicked] = useState('');

  return (
    <View style={styles.root} onTouchStart={onActivity}>
      <NavBar title="은행 선택" onBack={onBack} />
      <View style={styles.body}>
        <AppText size={24} weight={900} color={INK} lineHeight={31} style={styles.mb8}>
          {'어느 은행으로\n보내시나요?'}
        </AppText>
        <AppText size={16} color="#888" style={styles.mb20}>
          받는 분의 은행을 먼저 선택해주세요.
        </AppText>

        <PulseHighlight active={helpTarget === 'bankGrid'} borderRadius={14}>
          <BankGrid
            selected={picked}
            onSelect={(bank) => {
              setPicked(bank);
              setTimeout(() => onSelect(bank), 180);
            }}
          />
        </PulseHighlight>
      </View>
      <FloatingHomeButton onGoHome={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: '#fff' },
  body: { flex: 1, minHeight: 0, overflow: 'hidden', paddingHorizontal: 20, paddingTop: 20 },
  mb8: { marginBottom: 8 },
  mb20: { marginBottom: 20 },
});
