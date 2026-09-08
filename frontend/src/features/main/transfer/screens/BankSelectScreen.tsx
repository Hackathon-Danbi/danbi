import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { BANKS } from '../../data';
import { INK, YELLOW } from '../../theme';
import { FloatingHomeButton } from '../../components/FloatingHomeButton';
import { NavBar } from '../../components/NavBar';

type Bank = (typeof BANKS)[number];

/** danbi_jj main/screens/transfer.tsx <BankSelectScreen> 이식. */
export function BankSelectScreen({
  onBack,
  onSelect,
  helpTarget,
  onActivity,
}: {
  onBack: () => void;
  onSelect: (bank: Bank) => void;
  helpTarget: string;
  onActivity: () => void;
}) {
  const [picked, setPicked] = useState('');

  return (
    <View style={styles.root} onTouchStart={onActivity}>
      <NavBar title="은행 선택" onBack={onBack} />
      <View style={styles.body}>
        <AppText size={28} weight={900} color={INK} lineHeight={35} style={styles.mb8}>
          {'어느 은행으로\n보내시나요?'}
        </AppText>
        <AppText size={14} color="#888" style={styles.mb26}>
          받는 분의 은행을 먼저 선택해주세요.
        </AppText>

        <PulseHighlight active={helpTarget === 'bankGrid'} borderRadius={14}>
          <View style={styles.grid}>
            {BANKS.map((b) => {
              const sel = picked === b.bankCode;
              return (
                <Pressable
                  key={b.bankCode}
                  accessibilityRole="button"
                  onPress={() => {
                    setPicked(b.bankCode);
                    setTimeout(() => onSelect(b), 180);
                  }}
                  style={[styles.bank, sel && styles.bankSel]}
                >
                  <AppText size={16} weight={800} color={INK}>
                    {b.bankName}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </PulseHighlight>
      </View>
      <FloatingHomeButton onGoHome={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 28 },
  mb8: { marginBottom: 8 },
  mb26: { marginBottom: 26 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  bank: {
    width: '47.5%',
    flexGrow: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.8,
    borderColor: '#E8E8E8',
  },
  bankSel: {
    borderWidth: 2,
    borderColor: YELLOW,
  },
});
