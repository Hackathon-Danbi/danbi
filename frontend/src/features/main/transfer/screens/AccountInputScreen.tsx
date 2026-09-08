import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { bankOf } from '../../data';
import { BORDER, CREAM, INK, YELLOW } from '../../theme';
import { NavBar } from '../../components/NavBar';
import { NumPad } from '../../components/NumPad';

/** danbi_jj main/screens/transfer.tsx <AccountInputScreen> 이식. 계좌번호 8자리 이상이어야 다음 진행. */
export function AccountInputScreen({
  bank,
  value,
  onChange,
  onBack,
  onReselect,
  onNext,
  helpTarget,
  onActivity,
  onBlockedHelp,
}: {
  bank: string;
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onReselect: () => void;
  onNext: () => void;
  helpTarget: string;
  onActivity: () => void;
  onBlockedHelp: () => void;
}) {
  const b = bankOf(bank);
  const displayNum = value.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
  const ready = value.length >= 8;
  const handleNext = () => {
    if (value.length < 8) onBlockedHelp();
    else onNext();
  };

  return (
    <View style={styles.root} onTouchStart={onActivity}>
      <NavBar title="계좌번호 입력" onBack={onBack} />
      <View style={styles.body}>
        <View style={styles.bankRow}>
          <View style={styles.bankLeft}>
            <View style={[styles.bankChip, { backgroundColor: b.bg }]}>
              <AppText size={13} weight={900} color={b.fg}>
                {b.short}
              </AppText>
            </View>
            <AppText size={15} weight={800} color={INK}>
              {b.bankName}
            </AppText>
          </View>
          <Pressable accessibilityRole="button" onPress={onReselect} style={styles.reselect}>
            <AppText size={13} weight={700} color="#888">
              은행 다시 선택
            </AppText>
          </Pressable>
        </View>

        <AppText size={24} weight={900} color={INK} lineHeight={31} style={styles.mb16}>
          {'계좌번호를\n입력해주세요'}
        </AppText>

        <PulseHighlight active={helpTarget === 'accountField'} borderRadius={14}>
          <View style={styles.field}>
            {value ? (
              <AppText size={20} weight={700} color={INK} letterSpacing={1}>
                {displayNum}
              </AppText>
            ) : (
              <AppText size={15} weight={500} color="#BBB">
                계좌번호
              </AppText>
            )}
          </View>
        </PulseHighlight>

        <AppText size={12} color="#AAA" lineHeight={18} style={styles.hint}>
          숫자를 잘못 눌렀다면 오른쪽 아래 지우기를 눌러주세요.
        </AppText>

        <NumPad value={value} onChange={onChange} />
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={handleNext}
          style={[styles.next, { backgroundColor: ready ? YELLOW : '#F0F0F0' }]}
        >
          <AppText size={17} weight={900} color={ready ? INK : '#AAA'}>
            다음
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  mb16: { marginBottom: 16 },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: CREAM,
    borderWidth: 1.8,
    borderColor: BORDER,
    borderRadius: 14,
    marginBottom: 22,
  },
  bankLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bankChip: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reselect: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  field: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: YELLOW,
    marginBottom: 10,
    minHeight: 56,
    justifyContent: 'center',
  },
  hint: { marginBottom: 14 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  next: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
  },
});
