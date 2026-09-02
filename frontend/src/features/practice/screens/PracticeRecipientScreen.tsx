import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';
import { usePracticeApp } from '../PracticeContext';
import { AccountNumberEntry } from '../components/AccountNumberEntry';
import { BackHeader } from '../components/BackHeader';
import { CompactNumberPad } from '../components/NumericKeypad';
import { PracticeMistakeFeedback } from '../components/PracticeMistakeFeedback';
import { PracticeProgress } from '../components/PracticeProgress';
import { RecipientAccountList } from '../components/RecipientAccountList';
import { SoloHelp } from '../components/SoloHelp';
import { practiceMission } from '../data/mission.mock';
import { savedRecipients } from '../data/recipients.mock';
import type { SavedRecipient } from '../types';
import { ACCOUNT_NUMBER_MAX_DIGITS, appendDigits, removeLastDigit } from '../utils';

/** danbi_jj practice/screens/PracticeRecipientScreen.tsx 이식. */
export function PracticeRecipientScreen() {
  const {
    practiceStyle,
    practiceRecipient,
    setPracticeRecipient,
    practiceRecipientChoice,
    setPracticeRecipientChoice,
    practiceMistakeMessage,
    reportPracticeMistake,
    clearPracticeMistake,
    back,
    guidedNext,
  } = usePracticeApp();
  const guided = practiceStyle === 'guided';

  const selectSavedRecipient = (recipient: SavedRecipient) => {
    if (guided && recipient.id !== practiceMission.recipient.id) {
      reportPracticeMistake(`잘못 눌렀어요.\n아래 ‘${practiceMission.recipient.name}’ 버튼을 눌러주세요.`);
      return;
    }
    clearPracticeMistake();
    setPracticeRecipientChoice(recipient.id);
    setPracticeRecipient(recipient.account);
    guidedNext(
      guided ? '맞아요. 다음으로 넘어갈게요.' : '이제 보낼 금액을 입력해볼게요.',
      'practiceAmount',
    );
  };

  const selectNewRecipient = () => {
    if (guided) {
      reportPracticeMistake(`잘못 눌렀어요.\n아래 ‘${practiceMission.recipient.name}’ 버튼을 눌러주세요.`);
      return;
    }
    setPracticeRecipientChoice('new');
    setPracticeRecipient('');
  };

  return (
    <View style={styles.root}>
      <BackHeader title="받는 사람 선택" onBack={back} />
      <ScrollView contentContainerStyle={styles.body}>
        <PracticeProgress current={1} label="받는 사람 입력" />
        <View style={styles.titleWrap}>
          <AppText size={13} weight={700} color={P.accentText}>
            받는 사람 입력
          </AppText>
          <AppText size={30} weight={900} color={P.ink} lineHeight={38}>
            {'누구에게\n보낼까요?'}
          </AppText>
        </View>
        {guided && !practiceMistakeMessage ? (
          <AppText size={17} weight={600} color={P.accentText}>
            {practiceMission.recipient.name}님을 눌러보세요.
          </AppText>
        ) : null}
        {guided ? <PracticeMistakeFeedback message={practiceMistakeMessage} /> : null}

        <RecipientAccountList
          recipients={savedRecipients}
          selectedChoice={practiceRecipientChoice}
          onSelectRecipient={selectSavedRecipient}
          onSelectNewRecipient={selectNewRecipient}
          accountBadge="연습용 계좌"
        />

        {practiceRecipientChoice === 'new' ? (
          <AccountNumberEntry value={practiceRecipient} accountLabel="연습용 계좌번호" bankDescription="연습용 은행" />
        ) : null}

        {!guided ? (
          <SoloHelp
            key={practiceRecipientChoice ?? 'none'}
            hint={
              practiceRecipientChoice === 'new'
                ? '계좌번호를 숫자로 입력한 뒤 다음을 누르면 돼요.'
                : '오늘의 미션에서 받은 사람 이름을 확인한 뒤 목록에서 선택해보세요.'
            }
          />
        ) : null}
      </ScrollView>

      {!guided && practiceRecipientChoice === 'new' ? (
        <View style={styles.pad}>
          <CompactNumberPad
            mode="account"
            onKey={(key) =>
              setPracticeRecipient(
                key === '⌫'
                  ? removeLastDigit(practiceRecipient)
                  : appendDigits(practiceRecipient, key, { maxLength: ACCOUNT_NUMBER_MAX_DIGITS }),
              )
            }
          />
          <Pressable
            accessibilityRole="button"
            disabled={practiceRecipient.length < 8}
            onPress={() => guidedNext('이제 보낼 금액을 입력해볼게요.', 'practiceAmount')}
            style={[styles.next, practiceRecipient.length < 8 && styles.nextOff]}
          >
            <AppText size={18} weight={850} color={practiceRecipient.length < 8 ? '#8a857a' : '#fff'}>
              다음
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper },
  body: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 24, gap: 14 },
  titleWrap: { gap: 6 },
  pad: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: P.line,
  },
  next: {
    width: '100%',
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: P.accent,
  },
  nextOff: { backgroundColor: '#ddd9cf' },
});
