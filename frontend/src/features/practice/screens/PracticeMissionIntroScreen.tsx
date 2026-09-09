import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BackHeader } from '../components/BackHeader';
import { usePracticeApp } from '../PracticeContext';
import { P } from '../theme';
import { BottomActions, PrimaryButton, SafetyNote } from './shared';

/** 오늘의 미션에서 송금 대상을 먼저 확인한 뒤 지정된 입력 방식으로 시작한다. */
export function PracticeMissionIntroScreen() {
  const { practiceTarget, transferMethod, go, back } = usePracticeApp();
  const voice = transferMethod === 'voice';

  return (
    <View style={styles.root}>
      <BackHeader title="오늘의 미션" onBack={back} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
        <View style={styles.badge}>
          <AppText size={14} weight={900} color={P.accentText}>
            오늘의 송금 미션
          </AppText>
        </View>

        <AppText size={30} weight={900} color={P.ink} lineHeight={39}>
          {'아래 내용대로\n송금해 보세요'}
        </AppText>

        <View style={styles.missionCard}>
          <AppText size={15} weight={700} color={P.muted}>
            받는 사람
          </AppText>
          <AppText size={23} weight={900} color={P.ink} style={styles.mt4}>
            {practiceTarget.recipient.name}님
          </AppText>
          <AppText size={15} weight={700} color={P.muted} style={styles.mt6}>
            {practiceTarget.recipient.bank} · {practiceTarget.recipient.account}
          </AppText>

          <View style={styles.divider} />

          <AppText size={15} weight={700} color={P.muted}>
            보낼 금액
          </AppText>
          <AppText size={26} weight={900} color={P.accentText} style={styles.mt4}>
            {practiceTarget.amountLabel}
          </AppText>
        </View>

        <AppText size={16} weight={700} color={P.ink} lineHeight={24}>
          {voice
            ? '받는 사람과 금액을 함께 말해 주세요.'
            : '받는 사람과 금액을 차례대로 입력해 주세요.'}
        </AppText>
        <SafetyNote text="연습이므로 실제 돈은 움직이지 않아요." />
      </ScrollView>

      <BottomActions>
        <PrimaryButton
          label={voice ? '음성 송금 연습 시작하기' : '직접 입력 연습 시작하기'}
          onPress={() => go(voice ? 'practiceVoice' : 'practiceRecipient')}
        />
      </BottomActions>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper },
  scroll: { flex: 1 },
  body: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20, gap: 18 },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: P.accentSoft,
    borderWidth: 1,
    borderColor: P.accentBorder,
  },
  missionCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: P.accentBorder,
    backgroundColor: '#fff',
  },
  divider: {
    height: 1,
    marginVertical: 18,
    backgroundColor: P.line,
  },
  mt4: { marginTop: 4 },
  mt6: { marginTop: 6 },
});
