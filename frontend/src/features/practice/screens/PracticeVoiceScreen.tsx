import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { WaveBars } from '@/components/anim/WaveBars';
import { P } from '../theme';
import { usePracticeApp } from '../PracticeContext';
import { BackHeader } from '../components/BackHeader';
import { practiceMission } from '../data/mission.mock';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { RecipientChoice } from '../types';
import { formatWon } from '../utils';
import { parseVoiceTransfer } from '../voiceTransfer';
import { BottomActions, PrimaryButton, QuietButton, SecondaryButton } from './shared';

type VoiceState = 'idle' | 'listening' | 'recognized' | 'retry';

const exampleLines = [
  ['김민수에게', '3만원 보내줘'],
  ['이영희에게', '3만원 송금해줘'],
  ['민수에게', '만원 보내줘'],
];
const examples = ['김민수에게 3만원 보내줘', '이영희에게 3만원 송금해줘', '민수에게 만원 보내줘'];

/** danbi_jj practice/screens/PracticeVoiceScreen.tsx 이식 (연습 모드 STT). */
export function PracticeVoiceScreen() {
  const {
    practiceStyle,
    setTransferMethod,
    setPracticeRecipient,
    setPracticeRecipientChoice,
    setPracticeVoiceRecipientName,
    setPracticeAmount,
    clearPracticeMistake,
    go,
    back,
    guidedNext,
  } = usePracticeApp();
  const guided = practiceStyle === 'guided';
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [resultName, setResultName] = useState('');
  const [resultAmount, setResultAmount] = useState('');
  const recognizedNeedsRetry =
    resultName !== practiceMission.recipient.name || resultAmount !== practiceMission.amount;

  const applyRecognizedTransfer = (
    heard: string,
    choice: RecipientChoice,
    account: string,
    name: string,
    amount: string,
  ) => {
    setTranscript(heard);
    setResultName(name);
    setResultAmount(amount);
    setPracticeRecipientChoice(choice);
    setPracticeRecipient(account);
    setPracticeVoiceRecipientName(name);
    setPracticeAmount(amount);
    setVoiceState('recognized');
  };

  const handleTranscript = (heard: string) => {
    const parsed = parseVoiceTransfer(heard);
    applyRecognizedTransfer(
      heard,
      parsed.recipient?.id ?? null,
      parsed.recipient?.account ?? '',
      parsed.recipientName,
      parsed.amount,
    );
  };

  const clearRecognizedTransfer = () => {
    setTranscript('');
    setResultName('');
    setResultAmount('');
    setPracticeRecipientChoice(null);
    setPracticeRecipient('');
    setPracticeVoiceRecipientName('');
    setPracticeAmount('');
  };

  const recognition = useSpeechRecognition({
    onResult: handleTranscript,
    onError: () => {
      clearRecognizedTransfer();
      setVoiceState('retry');
    },
    fallbackTranscript: guided ? '민수에게 3만원 보내줘' : examples[0],
  });

  const startListening = () => {
    clearPracticeMistake();
    clearRecognizedTransfer();
    setVoiceState('listening');
    recognition.start();
  };

  const switchToDirectEntry = () => {
    recognition.stop();
    setTransferMethod('manual');
    clearRecognizedTransfer();
    go('practiceRecipient', { replace: true });
  };

  const confirmResult = () => {
    clearPracticeMistake();
    setTransferMethod('voice');
    if (recognizedNeedsRetry) {
      go('practiceReview');
      return;
    }
    guidedNext('잘 확인하셨어요. 송금 내용을 한 번 더 볼게요.', 'practiceReview');
  };

  return (
    <View style={styles.root}>
      <BackHeader
        title="음성 송금 연습"
        onBack={() => {
          recognition.stop();
          back();
        }}
      />
      <ScrollView contentContainerStyle={styles.body}>
        {voiceState === 'idle' ? (
          <View style={styles.center}>
            {guided ? (
              <View style={styles.scriptCard}>
                <AppText size={13} weight={700} color={P.accentText}>
                  이렇게 말해보세요
                </AppText>
                <AppText size={20} weight={900} color={P.ink} style={styles.mt6}>
                  “민수에게 3만원 보내줘”
                </AppText>
              </View>
            ) : (
              <AppText size={26} weight={900} color={P.ink} align="center" lineHeight={34}>
                {'누구에게 얼마를\n보내시겠어요?'}
              </AppText>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="마이크를 눌러 음성 송금 연습 시작"
              onPress={startListening}
              style={styles.mic}
            >
              <AppText size={26}>●</AppText>
            </Pressable>
            <AppText size={15} weight={700} color={P.ink}>
              마이크를 눌러 말씀해주세요
            </AppText>
            {!guided ? (
              <View style={styles.examples}>
                {exampleLines.map(([who, what]) => (
                  <AppText key={who} size={15} weight={600} color={P.ink} align="center">
                    “{who} {what}”
                  </AppText>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {voiceState === 'listening' ? (
          <View style={styles.center}>
            <AppText size={26} weight={900} color={P.ink} align="center" lineHeight={34}>
              {'말씀해주세요.\n듣고 있어요.'}
            </AppText>
            <View style={[styles.mic, styles.micLive]}>
              <AppText size={26}>●</AppText>
            </View>
            <WaveBars active />
            {recognition.transcript ? (
              <AppText size={16} weight={700} color={P.accentText} align="center">
                {recognition.transcript}
              </AppText>
            ) : null}
          </View>
        ) : null}

        {voiceState === 'recognized' ? (
          guided && recognizedNeedsRetry ? (
            <View style={styles.center}>
              <AppText size={26} weight={900} color={P.ink} align="center" lineHeight={34}>
                {'다시 한번\n말해볼까요?'}
              </AppText>
              <View style={styles.mismatchCard}>
                <AppText size={13} color={P.muted}>
                  이렇게 들었어요
                </AppText>
                <AppText size={18} weight={900} color={P.ink} style={styles.mt6}>
                  “{transcript}”
                </AppText>
              </View>
              <AppText size={15} color={P.ink}>
                이번에는 이렇게 말씀해주세요.
              </AppText>
              <AppText size={18} weight={900} color={P.accentText}>
                “민수에게 3만원 보내줘”
              </AppText>
            </View>
          ) : (
            <View style={styles.center}>
              <AppText size={13} weight={800} color={P.accentText}>
                이렇게 들었어요
              </AppText>
              {guided ? (
                <View style={styles.resultCard}>
                  <AppText size={20} weight={900} color={P.ink}>
                    “{transcript}”
                  </AppText>
                </View>
              ) : (
                <View style={styles.resultCard}>
                  <AppText size={13} color={P.muted}>
                    받는 사람
                  </AppText>
                  <AppText size={20} weight={900} color={P.ink} style={styles.mt4}>
                    {resultName || '확인되지 않음'}
                  </AppText>
                  <View style={styles.hr} />
                  <AppText size={13} color={P.muted}>
                    보낼 금액
                  </AppText>
                  <AppText size={22} weight={900} color={P.ink} style={styles.mt4}>
                    {resultAmount ? `${formatWon(resultAmount)}원` : '확인되지 않음'}
                  </AppText>
                  <AppText size={13} color={P.muted} style={styles.mt6}>
                    “{transcript}”
                  </AppText>
                </View>
              )}
              <AppText size={26} weight={900} color={P.ink} align="center">
                맞게 들었나요?
              </AppText>
            </View>
          )
        ) : null}

        {voiceState === 'retry' ? (
          <View style={styles.center}>
            <AppText size={40}>↻</AppText>
            <AppText size={26} weight={900} color={P.ink} align="center" lineHeight={34}>
              {guided ? '잘 듣지\n못했어요.' : '다시 한번\n말씀해볼까요?'}
            </AppText>
            {guided ? (
              <>
                <AppText size={15} color={P.ink} align="center">
                  다시 한번 천천히 말씀해주세요.
                </AppText>
                <AppText size={18} weight={900} color={P.accentText}>
                  “민수에게 3만원 보내줘”
                </AppText>
              </>
            ) : (
              <AppText size={15} color={P.ink} align="center" lineHeight={22}>
                {'괜찮아요. 받는 사람과 금액을\n천천히 함께 말씀해 주세요.'}
              </AppText>
            )}
          </View>
        ) : null}
      </ScrollView>

      {voiceState === 'recognized' && guided && recognizedNeedsRetry ? (
        <BottomActions>
          <PrimaryButton label="다시 말하기" onPress={startListening} />
        </BottomActions>
      ) : null}
      {voiceState === 'recognized' && (!guided || !recognizedNeedsRetry) ? (
        <BottomActions>
          <PrimaryButton label="네, 맞아요" onPress={confirmResult} />
          <SecondaryButton label="다시 말하기" onPress={startListening} />
        </BottomActions>
      ) : null}
      {voiceState === 'retry' ? (
        <BottomActions>
          <PrimaryButton label="다시 말하기" onPress={startListening} />
          <QuietButton label="직접 입력 연습으로 바꾸기" onPress={switchToDirectEntry} />
        </BottomActions>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper },
  body: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 20 },
  center: { alignItems: 'center', gap: 18 },
  mt4: { marginTop: 4 },
  mt6: { marginTop: 6 },
  scriptCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: P.accentSurface,
    borderWidth: 1,
    borderColor: P.accentBorder,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  mic: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: P.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micLive: { backgroundColor: P.accentText },
  examples: { gap: 10, marginTop: 4 },
  mismatchCard: {
    alignSelf: 'stretch',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d9534f',
    backgroundColor: '#fff',
  },
  resultCard: {
    alignSelf: 'stretch',
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: P.accent,
    backgroundColor: '#fff',
  },
  hr: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
});
