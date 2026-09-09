import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { bankOf } from '../../data';
import { BORDER, CREAM, INK, YELLOW } from '../../theme';
import { NavBar } from '../../components/NavBar';
import { NumPad } from '../../components/NumPad';
import { IconPhotoSearch } from '../components/AccountPhotoIcons';

/** danbi_jj main/screens/transfer.tsx <AccountInputScreen> 이식. 계좌번호 8자리 이상이어야 다음 진행. */
export function AccountInputScreen({
  bank,
  value,
  onChange,
  onBack,
  onReselect,
  onFindFromPhoto,
  onNext,
  helpTarget,
  onActivity,
  onBlockedHelp,
  error,
}: {
  bank: string;
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onReselect: () => void;
  onFindFromPhoto: () => void;
  onNext: () => void;
  helpTarget: string;
  onActivity: () => void;
  onBlockedHelp: () => void;
  error?: string;
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
              <AppText size={15} weight={900} color={b.fg}>
                {b.short}
              </AppText>
            </View>
            <AppText size={15} weight={800} color={INK}>
              {b.name}
            </AppText>
          </View>
          <Pressable accessibilityRole="button" onPress={onReselect} style={styles.reselect}>
            <AppText size={15} weight={700} color="#888">
              은행 다시 선택
            </AppText>
          </Pressable>
        </View>

        <AppText size={22} weight={900} color={INK} lineHeight={29} style={styles.mb10}>
          {'계좌번호를\n입력해주세요'}
        </AppText>
        <AppText size={16} color="#777" lineHeight={23} style={styles.guide}>
          직접 입력하거나 사진에서 계좌번호를 찾을 수 있어요.
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

        {error ? (
          <AppText size={15} weight={800} color="#D94040" lineHeight={22} style={styles.error}>
            {error}
          </AppText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="사진에서 계좌번호 찾기"
          onPress={onFindFromPhoto}
          style={styles.photoButton}
        >
          <IconPhotoSearch />
          <AppText size={17} weight={900} color={INK}>
            사진에서 계좌번호 찾기
          </AppText>
        </Pressable>

        <AppText size={14} color="#AAA" lineHeight={20} style={styles.hint}>
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
  root: { flex: 1, minHeight: 0, backgroundColor: '#fff' },
  body: { flex: 1, minHeight: 0, paddingHorizontal: 20, paddingTop: 16 },
  mb10: { marginBottom: 10 },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: CREAM,
    borderWidth: 1.8,
    borderColor: BORDER,
    borderRadius: 14,
    marginBottom: 14,
  },
  bankLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bankChip: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guide: { marginTop: -4, marginBottom: 10 },
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
    minHeight: 52,
    justifyContent: 'center',
  },
  error: { marginTop: -2, marginBottom: 10 },
  photoButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: BORDER,
    backgroundColor: CREAM,
  },
  hint: { marginBottom: 8 },
  footer: { flexShrink: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  next: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
  },
});
