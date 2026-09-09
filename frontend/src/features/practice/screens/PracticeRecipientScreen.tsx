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
import type { SavedRecipient } from '../types';
import {
  ACCOUNT_NUMBER_MAX_DIGITS,
  appendDigits,
  isValidPracticeRecipient,
  removeLastDigit,
} from '../utils';

/** danbi_jj practice/screens/PracticeRecipientScreen.tsx 이식. */
export function PracticeRecipientScreen() {
  const {
    practiceStyle,
    practiceTarget,
    practiceRecipients,
    practiceRecipient,
    setPracticeRecipient,
    practiceRecipientChoice,
    setPracticeRecipientChoice,
    setPracticeVoiceRecipientName,
    practiceMistakeMessage,
    reportPracticeMistake,
    clearPracticeMistake,
    mode,
    reviewStep,
    back,
    guidedNext,
    completePracticeStep,
  } = usePracticeApp();
  const guided = practiceStyle === 'guided';
  const accountReview = mode === 'review' && reviewStep === 'account';
  const recipientReview = mode === 'review' && reviewStep === 'recipient';
  const newRecipientValid = accountReview
    ? practiceRecipient === practiceTarget.recipient.account
    : isValidPracticeRecipient(practiceRecipientChoice, practiceRecipient);

  const selectSavedRecipient = (recipient: SavedRecipient) => {
    const matchesTarget = recipient.id === practiceTarget.recipient.id
      || recipient.name === practiceTarget.recipient.name
      || recipient.account === practiceTarget.recipient.account;
    if (guided && !matchesTarget) {
      reportPracticeMistake(
        recipientReview
          ? `‘${practiceTarget.recipient.name}’님을 찾아 다시 눌러보세요.`
          : `잘못 눌렀어요.\n아래 ‘${practiceTarget.recipient.name}’ 버튼을 눌러주세요.`,
      );
      return;
    }
    clearPracticeMistake();
    setPracticeVoiceRecipientName('');
    setPracticeRecipientChoice(recipient.id);
    setPracticeRecipient(recipient.account);
    if (recipientReview) completePracticeStep('practiceAmount');
    else guidedNext('practiceAmount');
  };

  const selectNewRecipient = () => {
    if (guided) {
      reportPracticeMistake(
        recipientReview
          ? `‘${practiceTarget.recipient.name}’님을 찾아 다시 눌러보세요.`
          : `잘못 눌렀어요.\n아래 ‘${practiceTarget.recipient.name}’ 버튼을 눌러주세요.`,
      );
      return;
    }
    setPracticeVoiceRecipientName('');
    setPracticeRecipientChoice('new');
    setPracticeRecipient('');
  };

  return (
    <View style={styles.root}>
      <BackHeader title={accountReview ? '계좌번호 입력' : '받는 사람 선택'} onBack={back} />
      <ScrollView contentContainerStyle={styles.body}>
        <PracticeProgress current={1} label={accountReview ? '계좌번호 입력' : '받는 사람 입력'} />
        <View style={styles.titleWrap}>
          <AppText size={15} weight={700} color={P.accentText}>
            {accountReview ? '계좌번호 입력' : '받는 사람 입력'}
          </AppText>
          <AppText size={30} weight={900} color={P.ink} lineHeight={38}>
            {accountReview ? '계좌번호를\n입력해보세요' : '누구에게\n보낼까요?'}
          </AppText>
        </View>
        {accountReview && !practiceMistakeMessage ? (
          <View style={styles.requestCard}>
            <AppText size={15} weight={700} color={P.accentText}>연습할 계좌번호</AppText>
            <AppText size={20} weight={900} color={P.ink} style={styles.mt4}>
              {practiceTarget.recipient.account}
            </AppText>
          </View>
        ) : guided && !practiceMistakeMessage ? (
          <AppText size={17} weight={600} color={P.accentText}>
            {practiceTarget.recipient.name}님을 눌러보세요.
          </AppText>
        ) : null}
        {guided ? <PracticeMistakeFeedback message={practiceMistakeMessage} /> : null}

        {!accountReview ? (
          <RecipientAccountList
            recipients={practiceRecipients}
            selectedChoice={practiceRecipientChoice}
            onSelectRecipient={selectSavedRecipient}
            onSelectNewRecipient={selectNewRecipient}
            accountBadge="연습용 계좌"
          />
        ) : null}

        {!guided ? (
          <View style={styles.requestCard}>
            <AppText size={15} weight={700} color={P.accentText}>오늘 연습에서 받은 정보</AppText>
            <AppText size={17} weight={900} color={P.ink} style={styles.mt4}>
              {practiceTarget.recipient.name} · {practiceTarget.recipient.bank}
            </AppText>
            <AppText size={16} weight={700} color={P.ink} style={styles.mt4}>
              {practiceTarget.recipient.account}
            </AppText>
            <AppText size={16} weight={800} color={P.ink} style={styles.mt4}>
              {practiceTarget.amountLabel}
            </AppText>
          </View>
        ) : null}

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

      {(!guided || accountReview) && practiceRecipientChoice === 'new' ? (
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
            disabled={!newRecipientValid}
            onPress={() => {
              if (accountReview && practiceRecipient !== practiceTarget.recipient.account) {
                reportPracticeMistake('안내된 계좌번호와 같은지 한 번 더 확인해보세요.');
                return;
              }
              completePracticeStep('practiceAmount');
            }}
            style={[styles.next, !newRecipientValid && styles.nextOff]}
          >
            <AppText size={18} weight={850} color={!newRecipientValid ? '#8a857a' : '#fff'}>
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
  mt4: { marginTop: 4 },
  requestCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.accentBorder,
    backgroundColor: P.accentSurface,
  },
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
