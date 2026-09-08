import { View, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';
import { usePracticeApp } from '../PracticeContext';
import { AmountEntry } from '../components/AmountEntry';
import { BackHeader } from '../components/BackHeader';
import type { NumericKey } from '../components/NumericKeypad';
import { PracticeMistakeFeedback } from '../components/PracticeMistakeFeedback';
import { PracticeProgress } from '../components/PracticeProgress';
import { SoloHelp } from '../components/SoloHelp';
import { practiceMission } from '../data/mission.mock';
import { AMOUNT_MAX_DIGITS, appendDigits, removeLastDigit } from '../utils';

/** danbi_jj practice/screens/PracticeAmountScreen.tsx 이식. */
export function PracticeAmountScreen() {
  const {
    practiceStyle,
    practiceAmount,
    setPracticeAmount,
    formattedPracticeAmount,
    enterPracticeAmount,
    practiceMistakeMessage,
    reportPracticeMistake,
    clearPracticeMistake,
    back,
    guidedNext,
  } = usePracticeApp();
  const guided = practiceStyle === 'guided';
  const targetSelected = practiceAmount === practiceMission.amount;

  const reportAmountMistake = () =>
    reportPracticeMistake(
      targetSelected
        ? '잘못 눌렀어요.\n아래 ‘다음’ 버튼을 눌러주세요.'
        : '잘못 눌렀어요.\n아래 ‘3만원’ 버튼을 눌러주세요.',
    );

  const chooseQuickAmount = (amount: string) => {
    if (guided && amount !== practiceMission.amount) {
      reportAmountMistake();
      return;
    }
    clearPracticeMistake();
    setPracticeAmount(amount);
  };

  const enterAmount = (key: NumericKey) => {
    if (key === '⌫') {
      if (guided && !practiceAmount) {
        reportAmountMistake();
        return;
      }
      clearPracticeMistake();
      setPracticeAmount(removeLastDigit(practiceAmount));
      return;
    }
    if (!guided) {
      enterPracticeAmount(key);
      return;
    }
    const nextAmount = appendDigits(practiceAmount, key, { maxLength: AMOUNT_MAX_DIGITS, trimLeadingZeros: true });
    if (!practiceMission.amount.startsWith(nextAmount)) {
      reportAmountMistake();
      return;
    }
    clearPracticeMistake();
    setPracticeAmount(nextAmount);
  };

  return (
    <View style={styles.root}>
      <BackHeader title="금액 입력" onBack={back} />
      <AmountEntry
        amount={practiceAmount}
        formattedAmount={formattedPracticeAmount}
        label="연습용 금액"
        highlighted={guided}
        quickAmounts={[
          { value: '10000', label: '1만원' },
          { value: practiceMission.amount, label: '3만원', suggested: guided },
          { value: '50000', label: '5만원' },
        ]}
        onSelectQuickAmount={chooseQuickAmount}
        onKey={enterAmount}
        submitDisabled={!guided && (!practiceAmount || Number(practiceAmount) === 0)}
        submitUnavailable={guided && !targetSelected}
        onSubmit={() => {
          if (guided && !targetSelected) {
            reportAmountMistake();
            return;
          }
          guidedNext('맞아요. 받는 사람과 금액을 확인해볼게요.', 'practiceReview');
        }}
        afterQuickAmounts={
          !guided ? (
            <SoloHelp
              key={practiceAmount || 'empty'}
              hint="보낼 금액을 숫자로 입력하면 돼요. 빠른 금액 버튼을 사용해도 괜찮아요."
            />
          ) : undefined
        }
      >
        <View style={styles.intro}>
          <PracticeProgress current={2} label="보낼 금액 입력" />
          <AppText size={28} weight={900} color={P.ink} lineHeight={35}>
            얼마를 보내볼까요?
          </AppText>
          {guided && !practiceMistakeMessage ? (
            <AppText size={17} weight={600} color={P.accentText}>
              {practiceMission.amountLabel}을 입력해보세요.
            </AppText>
          ) : null}
          {guided ? <PracticeMistakeFeedback message={practiceMistakeMessage} /> : null}
        </View>
      </AmountEntry>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper },
  intro: { gap: 10 },
});
