import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { WaveBars } from '@/components/anim/WaveBars';
import { P } from '../theme';
import { usePracticeApp } from '../PracticeContext';
import { BackHeader } from '../components/BackHeader';
import { useSpeechRecognition } from '@/lib/speech/useSpeechRecognition';
import { speak as ttsSpeak, stop as ttsStop } from '@/lib/speech/tts';
import type {
  SpeechRecognitionResultMeta,
  SpeechRecognitionResultSource,
} from '@/lib/speech/useSpeechRecognition';
import { formatWon } from '../utils';
import {
  createVoicePracticeStatePatch,
  isCompleteVoiceTransfer,
  parseVoiceTransfer,
  PRACTICE_VOICE_EXAMPLES,
  voiceTransferIssueMessage,
} from '../voiceTransfer';
import type { ParsedVoiceTransfer } from '../voiceTransfer';
import { BottomActions, PrimaryButton, QuietButton, SecondaryButton } from './shared';
import { isApiConfigured } from '@/api';

type VoiceState = 'idle' | 'listening' | 'recognized' | 'retry';

/** danbi_jj practice/screens/PracticeVoiceScreen.tsx 이식 (연습 모드 STT). */
export function PracticeVoiceScreen() {
  const {
    practiceStyle,
    practiceTarget,
    practiceRecipients,
    recognizePracticeVoice,
    setTransferMethod,
    setPracticeRecipient,
    setPracticeRecipientChoice,
    setPracticeVoiceRecipientName,
    setPracticeAmount,
    clearPracticeMistake,
    go,
    back,
    completePracticeStep,
  } = usePracticeApp();
  const guided = practiceStyle === 'guided';
  const targetVoiceRecipient = {
    id: practiceTarget.recipient.id,
    name: practiceTarget.recipient.name,
    bank: practiceTarget.recipient.bank,
    account: practiceTarget.recipient.account,
  };
  const targetVoiceExample = `${practiceTarget.recipient.name}에게 ${practiceTarget.amountLabel} 보내줘`;
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedVoiceTransfer | null>(null);
  const [resultSource, setResultSource] = useState<SpeechRecognitionResultSource | null>(null);
  const [speechError, setSpeechError] = useState('');
  const resultComplete = parsedResult ? isCompleteVoiceTransfer(parsedResult) : false;
  const guidedResultMismatch = !!(
    guided &&
    resultComplete &&
    (
      (
        parsedResult?.recipient?.id !== practiceTarget.recipient.id &&
        parsedResult?.recipient?.name !== practiceTarget.recipient.name
      ) ||
      parsedResult.amount !== practiceTarget.amount
    )
  );
  const resultName = parsedResult?.recipientName ?? '';
  const resultAmount = parsedResult?.amount ?? '';
  const resultIssueMessage = parsedResult ? voiceTransferIssueMessage(parsedResult) : '';

  const applyPracticePatch = (result: ParsedVoiceTransfer) => {
    const patch = createVoicePracticeStatePatch(result);
    if (patch.recipientChoice) setPracticeRecipientChoice(patch.recipientChoice);
    if (patch.recipientAccount) setPracticeRecipient(patch.recipientAccount);
    if (patch.recipientName) setPracticeVoiceRecipientName(patch.recipientName);
    if (patch.amount) setPracticeAmount(patch.amount);
  };

  const handleTranscript = (heard: string, meta: SpeechRecognitionResultMeta) => {
    const parsed = parseVoiceTransfer(heard, [...practiceRecipients, targetVoiceRecipient]);
    setTranscript(parsed.transcript);
    setParsedResult(parsed);
    setResultSource(meta.source);
    setSpeechError('');
    setVoiceState('recognized');
  };

  const clearRecognitionAttempt = () => {
    setTranscript('');
    setParsedResult(null);
    setResultSource(null);
    setSpeechError('');
  };

  const recognition = useSpeechRecognition({
    onResult: handleTranscript,
    onError: (message) => {
      clearRecognitionAttempt();
      setSpeechError(message);
      setVoiceState('retry');
      if (guided) ttsSpeak(message);
    },
    fallbackTranscript: targetVoiceExample,
    serverTranscribe: isApiConfigured() ? recognizePracticeVoice : undefined,
  });

  const startListening = () => {
    // 앱 안내 음성이 마이크 입력으로 다시 들어가지 않도록 항상 먼저 끊는다.
    ttsStop();
    clearPracticeMistake();
    clearRecognitionAttempt();
    setVoiceState('listening');
    recognition.start();
  };

  const switchToDirectEntry = () => {
    recognition.stop();
    setTransferMethod('manual');
    if (parsedResult) applyPracticePatch(parsedResult);

    const recipientReady = !!parsedResult?.recipient && (
      !guided || parsedResult.recipient.id === practiceTarget.recipient.id
    );
    clearRecognitionAttempt();
    go(recipientReady ? 'practiceAmount' : 'practiceRecipient', { replace: true });
  };

  const confirmResult = () => {
    if (!parsedResult || !resultComplete || guidedResultMismatch) return;
    clearPracticeMistake();
    applyPracticePatch(parsedResult);
    setTransferMethod('voice');
    completePracticeStep('practiceReview');
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
                <AppText size={15} weight={700} color={P.accentText}>
                  이렇게 말해보세요
                </AppText>
                <AppText size={20} weight={900} color={P.ink} style={styles.mt6}>
                  “{targetVoiceExample}”
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
                {[targetVoiceExample, ...PRACTICE_VOICE_EXAMPLES]
                  .filter((example, index, examples) => examples.indexOf(example) === index)
                  .slice(0, 3)
                  .map((example) => (
                    <AppText key={example} size={15} weight={600} color={P.ink} align="center">
                      “{example}”
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
          !resultComplete || guidedResultMismatch ? (
            <View style={styles.center}>
              <AppText size={26} weight={900} color={P.ink} align="center" lineHeight={34}>
                {guidedResultMismatch ? '이번 미션과\n다르게 들었어요.' : '조금 더\n확인이 필요해요.'}
              </AppText>
              <View style={styles.mismatchCard}>
                <AppText size={15} color={P.muted}>
                  이렇게 들었어요
                </AppText>
                <AppText size={18} weight={900} color={P.ink} style={styles.mt6}>
                  “{transcript}”
                </AppText>
                <View style={styles.hr} />
                <AppText size={14} color={P.ink}>
                  받는 사람: {resultName || '확인되지 않음'}
                </AppText>
                <AppText size={14} color={P.ink} style={styles.mt4}>
                  보낼 금액: {resultAmount ? `${formatWon(resultAmount)}원` : '확인되지 않음'}
                </AppText>
              </View>
              {guidedResultMismatch ? (
                <>
                  <AppText size={15} color={P.ink}>
                    이번에는 이렇게 말씀해주세요.
                  </AppText>
                  <AppText size={18} weight={900} color={P.accentText}>
                    “{targetVoiceExample}”
                  </AppText>
                </>
              ) : (
                <AppText size={16} weight={700} color={P.accentText} align="center" lineHeight={24}>
                  {resultIssueMessage}
                </AppText>
              )}
              {resultSource === 'fallback' ? (
                <View style={styles.fallbackNotice}>
                  <AppText size={14} color={P.ink} align="center" lineHeight={21}>
                    실제 인식 대신 연습용 예시 문장으로 보여드렸어요.
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.center}>
              <AppText size={15} weight={800} color={P.accentText}>
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
                  <AppText size={15} color={P.muted}>
                    받는 사람
                  </AppText>
                  <AppText size={20} weight={900} color={P.ink} style={styles.mt4}>
                    {resultName || '확인되지 않음'}
                  </AppText>
                  <View style={styles.hr} />
                  <AppText size={15} color={P.muted}>
                    보낼 금액
                  </AppText>
                  <AppText size={22} weight={900} color={P.ink} style={styles.mt4}>
                    {resultAmount ? `${formatWon(resultAmount)}원` : '확인되지 않음'}
                  </AppText>
                  <AppText size={15} color={P.muted} style={styles.mt6}>
                    “{transcript}”
                  </AppText>
                </View>
              )}
              <AppText size={26} weight={900} color={P.ink} align="center">
                맞게 들었나요?
              </AppText>
              {resultSource === 'fallback' ? (
                <View style={styles.fallbackNotice}>
                  <AppText size={14} color={P.ink} align="center" lineHeight={21}>
                    실제 인식 대신 연습용 예시 문장으로 보여드렸어요.
                  </AppText>
                </View>
              ) : null}
            </View>
          )
        ) : null}

        {voiceState === 'retry' ? (
          <View style={styles.center}>
            <AppText size={40}>↻</AppText>
            <AppText size={26} weight={900} color={P.ink} align="center" lineHeight={34}>
              {guided ? '잘 듣지\n못했어요.' : '다시 한번\n말씀해볼까요?'}
            </AppText>
            {speechError ? (
              <AppText size={16} weight={700} color={P.accentText} align="center" lineHeight={24}>
                {speechError}
              </AppText>
            ) : guided ? (
              <>
                <AppText size={15} color={P.ink} align="center">
                  다시 한번 천천히 말씀해주세요.
                </AppText>
                <AppText size={18} weight={900} color={P.accentText}>
                  “{targetVoiceExample}”
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

      {voiceState === 'recognized' && (!resultComplete || guidedResultMismatch) ? (
        <BottomActions>
          <PrimaryButton label="다시 말하기" onPress={startListening} />
          <QuietButton label="직접 입력 연습으로 바꾸기" onPress={switchToDirectEntry} />
        </BottomActions>
      ) : null}
      {voiceState === 'listening' && recognition.isRecording ? (
        <BottomActions>
          <PrimaryButton label="말하기 완료" onPress={() => void recognition.submit()} />
        </BottomActions>
      ) : null}
      {voiceState === 'recognized' && resultComplete && !guidedResultMismatch ? (
        <BottomActions>
          <PrimaryButton label="네, 맞아요" onPress={confirmResult} />
          <SecondaryButton label="다시 말하기" onPress={startListening} />
          <QuietButton label="직접 입력 연습으로 바꾸기" onPress={switchToDirectEntry} />
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
  fallbackNotice: {
    alignSelf: 'stretch',
    padding: 12,
    borderRadius: 14,
    backgroundColor: P.accentSoft,
  },
  hr: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
});
