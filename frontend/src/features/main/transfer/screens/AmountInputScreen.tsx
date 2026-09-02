import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { fmt } from '../../data';
import { BORDER, CREAM, INK, YELLOW } from '../../theme';
import { NavBar } from '../../components/NavBar';
import { NumPad } from '../../components/NumPad';

/** danbi_jj main/screens/transfer.tsx <AmountInputScreen> 이식. */
export function AmountInputScreen({
  value,
  onChange,
  onBack,
  onNext,
  helpTarget,
  onActivity,
  onBlockedHelp,
}: {
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
  helpTarget: string;
  onActivity: () => void;
  onBlockedHelp: () => void;
}) {
  const addAmount = (add: number) => onChange(String(parseInt(value || '0', 10) + add));
  const active = !!value && parseInt(value, 10) > 0;
  const handleNext = () => {
    if (!active) onBlockedHelp();
    else onNext();
  };

  return (
    <View style={styles.root} onTouchStart={onActivity}>
      <NavBar title="보낼 금액 입력" onBack={onBack} />
      <View style={styles.body}>
        <AppText size={28} weight={900} color={INK} lineHeight={35} style={styles.mb8}>
          {'얼마를\n보낼까요?'}
        </AppText>
        <AppText size={14} color="#888" style={styles.mb20}>
          보낼 금액을 숫자로 입력해 주세요.
        </AppText>

        <PulseHighlight active={helpTarget === 'amountField'} borderRadius={14}>
          <View style={styles.field}>
            {active ? (
              <AppText size={22} weight={700} color={INK}>
                {fmt(value)}원
              </AppText>
            ) : (
              <AppText size={15} weight={500} color="#BBB">
                보낼 금액
              </AppText>
            )}
          </View>
        </PulseHighlight>

        <View style={styles.quick}>
          {[10000, 30000, 50000].map((a) => (
            <Pressable key={a} accessibilityRole="button" onPress={() => addAmount(a)} style={styles.quickBtn}>
              <AppText size={14} weight={700} color={INK}>
                {a / 10000}만원
              </AppText>
            </Pressable>
          ))}
        </View>

        <NumPad value={value} onChange={onChange} bottomLeft="000" />
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={handleNext}
          style={[styles.next, { backgroundColor: active ? YELLOW : '#F0F0F0' }]}
        >
          <AppText size={17} weight={900} color={active ? INK : '#AAA'}>
            다음
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  mb8: { marginBottom: 8 },
  mb20: { marginBottom: 20 },
  field: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: YELLOW,
    marginBottom: 12,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  quick: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: CREAM,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
  },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  next: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
  },
});
