import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';
import { usePracticeApp } from '../PracticeContext';
import { BackHeader } from '../components/BackHeader';
import { PinNumberPad } from '../components/NumericKeypad';
import { PracticeMistakeFeedback } from '../components/PracticeMistakeFeedback';
import { SoloHelp } from '../components/SoloHelp';

/** danbi_jj practice/screens/PracticePinScreen.tsx 이식. */
export function PracticePinScreen() {
  const { practiceStyle, pin, setPin, practiceMistakeMessage, reportPracticeMistake, clearPracticeMistake, back } =
    usePracticeApp();
  const guided = practiceStyle === 'guided';
  const goBack = () => {
    setPin('');
    back();
  };

  return (
    <View style={styles.root}>
      <BackHeader title="비밀번호 입력" onBack={goBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.dataLabel}>
          <AppText size={13} weight={850} color={P.accentText}>
            ✓ 4 / 4 · 비밀번호 입력
          </AppText>
        </View>
        <View style={styles.lock}>
          <AppText size={28}>▣</AppText>
        </View>
        <AppText size={24} weight={900} color={P.ink} align="center" lineHeight={33}>
          {guided ? '연습용 비밀번호\n4자리를 입력해보세요' : '연습용 비밀번호를\n입력해 주세요'}
        </AppText>

        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
          ))}
        </View>
        {guided ? <PracticeMistakeFeedback message={practiceMistakeMessage} /> : null}

        <View style={styles.warning}>
          <AppText size={13} weight={900} color="#a7372b">
            !
          </AppText>
          <AppText size={14} color={P.ink} lineHeight={21} style={styles.flex1}>
            <AppText size={14} weight={900} color={P.ink}>
              실제 비밀번호를 입력하지 마세요.
            </AppText>
            {guided ? '\n아무 숫자나 4개 눌러 연습하세요.' : ''}
          </AppText>
        </View>

        {!guided ? (
          <SoloHelp key={pin.length} hint="연습용이므로 실제 비밀번호 대신 아무 숫자나 4개 입력하면 돼요." />
        ) : null}
      </ScrollView>

      <View style={styles.pad}>
        <PinNumberPad
          value={pin}
          onChange={(value) => {
            if (guided && value === pin && pin.length === 0) {
              reportPracticeMistake('잘못 눌렀어요.\n아래 숫자 버튼을 눌러주세요.');
              return;
            }
            clearPracticeMistake();
            setPin(value);
          }}
          onCancel={goBack}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper },
  body: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16, alignItems: 'center', gap: 16 },
  flex1: { flex: 1 },
  dataLabel: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: P.accentBorder,
    backgroundColor: P.accentSoft,
  },
  lock: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: P.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', gap: 15 },
  dot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#d5d1c8' },
  dotFilled: { backgroundColor: '#302b24' },
  warning: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff0ed',
    width: '100%',
  },
  pad: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
});
