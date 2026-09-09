import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';
import { usePracticeApp } from '../PracticeContext';
import { OutlineButton, PrimaryButton, QuietButton, SafetyNote } from './shared';

/** danbi_jj practice/screens/PracticeCompleteScreen.tsx 이식. */
export function PracticeCompleteScreen() {
  const { practiceStyle, transferMethod, setPracticeStyle, go, beginPractice, choosePracticeStyle } = usePracticeApp();
  const solo = practiceStyle === 'solo';
  const route =
    transferMethod === 'voice' ? ['말하기', '확인', '비밀번호'] : ['받는 사람', '금액', '확인', '비밀번호'];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.seal}>
        <AppText size={14} weight={900} color={P.accentText}>
          연습 완료
        </AppText>
      </View>
      <View style={styles.mark}>
        <AppText size={44} weight={900} color="#fff">
          ✓
        </AppText>
      </View>
      <AppText size={30} weight={900} color={P.ink} align="center" lineHeight={38}>
        {solo ? '혼자서 송금을\n해봤어요!' : '송금 연습을\n완료했어요!'}
      </AppText>
      <AppText size={16} color={P.muted} align="center" lineHeight={24} style={styles.mt6}>
        {solo ? '실제 송금도\n이렇게 하면 돼요.' : '송금하는 순서를\n모두 따라 해봤어요.'}
      </AppText>

      <View style={styles.route}>
        {route.map((step, i) => (
          <View key={step} style={styles.routeItem}>
            {i > 0 ? (
              <AppText size={14} weight={900} color={P.accent}>
                →
              </AppText>
            ) : null}
            <AppText size={15} weight={700} color={P.ink}>
              {step}
            </AppText>
          </View>
        ))}
      </View>

      <SafetyNote text="이번 연습에서는 실제 돈이 움직이지 않았어요." />

      <View style={styles.actions}>
        {solo ? (
          <PrimaryButton label="한 번 더 해보기" onPress={() => beginPractice(transferMethod)} />
        ) : (
          <>
            <PrimaryButton label="혼자 해보기" onPress={() => choosePracticeStyle('solo')} />
            <OutlineButton label="한 번 더 따라하기" onPress={() => beginPractice(transferMethod)} />
          </>
        )}
        <QuietButton
          label="연습 종료"
          onPress={() => {
            setPracticeStyle(null);
            go('practiceHub', { reset: true });
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 32,
    gap: 12,
    backgroundColor: P.paper,
  },
  mt6: { marginTop: 6 },
  seal: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: P.accentSoft,
  },
  mark: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: P.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  route: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
  },
  routeItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { width: '100%', gap: 10, marginTop: 16 },
});
