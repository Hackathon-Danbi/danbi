import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';
import { usePracticeApp } from '../PracticeContext';
import { BackHeader } from '../components/BackHeader';
import { PracticeMistakeFeedback } from '../components/PracticeMistakeFeedback';
import { PracticeProgress } from '../components/PracticeProgress';
import { SoloHelp } from '../components/SoloHelp';
import { practiceMission } from '../data/mission.mock';
import { formatAccountNumber } from '../utils';
import { BottomActions, PrimaryButton, QuietButton } from './shared';

type ReviewError = 'recipient' | 'amount' | 'both' | null;

/** danbi_jj practice/screens/PracticeReviewScreen.tsx 이식. */
export function PracticeReviewScreen() {
  const {
    practiceStyle,
    transferMethod,
    practiceRecipient,
    practiceRecipientChoice,
    practiceRecipientName,
    practiceAmount,
    formattedPracticeAmount,
    practiceMistakeMessage,
    setPin,
    back,
    guidedNext,
  } = usePracticeApp();
  const guided = practiceStyle === 'guided';

  const recipientMismatch = practiceRecipientChoice !== practiceMission.recipient.id;
  const amountMismatch = Number(practiceAmount) !== Number(practiceMission.amount);
  const reviewError: ReviewError =
    recipientMismatch && amountMismatch
      ? 'both'
      : recipientMismatch
        ? 'recipient'
        : amountMismatch
          ? 'amount'
          : null;

  const normalButtonLabel = guided ? '확인' : '연습 송금하기';
  const retryButtonLabel = transferMethod === 'voice' ? '다시 말해보기' : '다시 입력해보기';
  const errorTitle =
    reviewError === 'recipient'
      ? '말씀하신 받는 사람이 달라요. 다시 말해보세요.'
      : reviewError === 'amount'
        ? '말씀하신 금액이 달라요. 다시 말해보세요.'
        : '말씀하신 내용이 달라요. 다시 말해보세요.';

  const handlePrimaryAction = () => {
    if (reviewError) {
      back();
      return;
    }
    setPin('');
    guidedNext('맞아요. 마지막으로 비밀번호를 입력해볼게요.', 'practicePin');
  };

  const recipientDetails = practiceRecipient
    ? `${formatAccountNumber(practiceRecipient)} · 연습용`
    : '음성으로 들은 받는 사람 · 연습용';

  return (
    <View style={styles.root}>
      <BackHeader title="송금 내용 확인" onBack={back} />
      <ScrollView contentContainerStyle={styles.body}>
        <PracticeProgress current={3} label="송금 내용 확인" />
        <View style={styles.titleWrap}>
          <AppText size={13} weight={700} color={P.accentText}>
            송금 내용 확인
          </AppText>
          <AppText size={30} weight={900} color={P.ink} lineHeight={38}>
            {'보내기 전에\n확인해 주세요'}
          </AppText>
        </View>
        {guided && !reviewError && !practiceMistakeMessage ? (
          <AppText size={17} weight={600} color={P.accentText} lineHeight={25}>
            {'받는 사람과 금액이 맞는지 확인한 뒤,\n확인을 눌러보세요.'}
          </AppText>
        ) : null}

        <View style={[styles.card, guided && !reviewError && styles.cardGuided, reviewError === 'both' && styles.cardError]}>
          <View style={reviewError === 'recipient' ? styles.fieldError : undefined}>
            <AppText size={13} color={P.muted}>
              받는 사람
            </AppText>
            <AppText size={22} weight={900} color={P.ink} style={styles.mt4}>
              {practiceRecipientName || '확인되지 않음'}
            </AppText>
            <AppText size={13} color={P.muted} style={styles.mt2}>
              {recipientDetails}
            </AppText>
          </View>
          <View style={styles.hr} />
          <View style={reviewError === 'amount' ? styles.fieldError : undefined}>
            <AppText size={13} color={P.muted}>
              보낼 금액
            </AppText>
            <AppText size={22} weight={900} color={P.ink} style={styles.mt4}>
              {practiceAmount ? `${formattedPracticeAmount}원` : '확인되지 않음'}
            </AppText>
            <AppText size={13} color={P.muted} style={styles.mt2}>
              연습용 금액
            </AppText>
          </View>
        </View>

        {!guided && !reviewError ? (
          <SoloHelp hint="받는 사람과 금액을 확인한 뒤 연습 송금하기를 누르면 돼요." />
        ) : null}
      </ScrollView>

      <BottomActions>
        <PracticeMistakeFeedback message={reviewError ? errorTitle : guided ? practiceMistakeMessage : ''} />
        <PrimaryButton
          label={reviewError ? retryButtonLabel : normalButtonLabel}
          onPress={handlePrimaryAction}
        />
        {!reviewError ? (
          <QuietButton
            label={transferMethod === 'voice' ? '다시 말할게요' : '다시 확인할게요'}
            onPress={back}
          />
        ) : null}
      </BottomActions>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper },
  body: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20, gap: 14 },
  titleWrap: { gap: 6 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  card: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#e4e8f4',
    backgroundColor: '#fff',
    gap: 4,
  },
  cardGuided: { borderColor: P.accent },
  cardError: { borderColor: '#d9534f' },
  fieldError: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#d9534f',
    padding: 8,
    marginHorizontal: -8,
  },
  hr: { height: 1, backgroundColor: '#eee', marginVertical: 14 },
});
