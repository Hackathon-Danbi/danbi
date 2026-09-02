import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { INK, YELLOW } from '../../theme';
import { FloatingHomeButton } from '../../components/FloatingHomeButton';
import { MicIcon } from '../../components/MicIcon';
import { NavBar } from '../../components/NavBar';

/** danbi_jj main/screens/transfer.tsx <ResultScreen> (잔액 조회 응답) 이식. */
export function ResultScreen({
  onBack,
  onViewHistory,
  onMic,
}: {
  onBack: () => void;
  onViewHistory: () => void;
  onMic: () => void;
}) {
  return (
    <View style={styles.root}>
      <NavBar title="단비가 알려드려요" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.userRow}>
          <View style={styles.userBubble}>
            <AppText size={12} weight={700} color="#7A6000" style={styles.mb4}>
              박옥순님의 말씀
            </AppText>
            <AppText size={15} weight={700} color={INK}>
              &quot;내 통장에 얼마 있어&quot;
            </AppText>
          </View>
        </View>

        <View style={styles.answer}>
          <View style={styles.answerHead}>
            <View style={styles.avatar}>
              <AppText size={13} weight={900} color={INK}>
                단
              </AppText>
            </View>
            <AppText size={14} weight={700} color={YELLOW}>
              단비가 알려드려요
            </AppText>
          </View>
          <View style={styles.answerBody}>
            <AppText size={15} color="#666" style={styles.mb4}>
              KB나라사랑우대통장에
            </AppText>
            <AppText size={34} weight={900} color={INK} style={styles.mb4}>
              1,250,000<AppText size={21} weight={900} color={INK}>원</AppText>
            </AppText>
            <AppText size={15} color="#666" style={styles.mb12}>
              있어요.
            </AppText>
            <View style={styles.chip}>
              <AppText size={12} color="#999">
                확인한 계좌 · 7878
              </AppText>
            </View>
          </View>
        </View>

        {[
          { label: '📋  거래내역 보기', action: onViewHistory },
          { label: '✅  그럼 됐어요', action: onBack },
        ].map((item) => (
          <Pressable key={item.label} accessibilityRole="button" onPress={item.action} style={styles.optionBtn}>
            <AppText size={16} weight={700} color={INK}>
              {item.label}
            </AppText>
          </Pressable>
        ))}

        <View style={styles.micCard}>
          <Pressable accessibilityRole="button" accessibilityLabel="마이크" onPress={onMic} style={styles.micBtn}>
            <MicIcon size={24} />
          </Pressable>
          <AppText size={15} weight={700} color={INK} lineHeight={21} style={styles.flex1}>
            {'다른 것이 궁금하신 분은\n마이크를 다시 눌러주세요'}
          </AppText>
        </View>
      </ScrollView>
      <FloatingHomeButton onGoHome={onBack} bg="#F7F7F7" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },
  body: { padding: 20, gap: 14 },
  flex1: { flex: 1 },
  mb4: { marginBottom: 4 },
  mb12: { marginBottom: 12 },
  userRow: { alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: YELLOW,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    maxWidth: '75%',
  },
  answer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  answerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerBody: { paddingVertical: 16, paddingHorizontal: 18 },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: '#F7F7F7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 16,
  },
  micCard: {
    backgroundColor: '#FFF8D0',
    borderWidth: 1.5,
    borderColor: YELLOW,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  micBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
