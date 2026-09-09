import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BANKS } from '../data';
import { INK, YELLOW } from '../theme';

/** 송금·가입 화면이 함께 쓰는 은행 선택 2열 격자. */
export function BankGrid({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (bank: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {BANKS.map((bank) => {
        const sel = selected === bank.name;
        return (
          <Pressable
            key={bank.name}
            accessibilityRole="button"
            accessibilityState={{ selected: sel }}
            onPress={() => onSelect(bank.name)}
            style={[styles.bank, sel && styles.bankSel]}
          >
            <AppText size={16} weight={800} color={INK}>
              {bank.name}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bank: {
    width: '47.5%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: '#E8E8E8',
    backgroundColor: '#fff',
  },
  bankSel: {
    borderWidth: 2,
    borderColor: YELLOW,
  },
});
