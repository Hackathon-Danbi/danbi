import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { ScreenIn } from '@/components/anim/ScreenIn';
import { recognitionEngine } from '@/lib/speech/recognition';
import { speak as ttsSpeak, stop as ttsStop } from '@/lib/speech/tts';
import { useAndroidBack } from '@/lib/useAndroidBack';
import { callCustomerCenter } from '@/lib/customerSupport';
import { useTransactions } from '@/features/main/TransactionContext';

import { CONTACTS } from '../data';
import { CREAM, INK, LARGE_AMOUNT_THRESHOLD, YELLOW } from '../theme';
import type { ListeningPhase, TxInfo } from '../types';
import {
  HELP_IDLE,
  REENTRY_HINTS,
  SCREEN_HELP,
  TRANSFER_SCREENS,
  isWithinBusinessHours,
} from '../proactiveHelp';
import type { HelpReason, HelpState, HelpStep } from '../proactiveHelp';
import { Waveform } from '../components/Waveform';

import { AccountInputScreen } from './screens/AccountInputScreen';
import { AmountInputScreen } from './screens/AmountInputScreen';
import { BankSelectScreen } from './screens/BankSelectScreen';
import { ConfirmPopup } from './screens/ConfirmPopup';
import { ListeningScreen } from './screens/ListeningScreen';
import { PasswordScreen } from './screens/PasswordScreen';
import { PreTransferScreen } from './screens/PreTransferScreen';
import { RecipientScreen } from './screens/RecipientScreen';
import { TransferDoneScreen } from './screens/TransferDoneScreen';
import { TransferIntroScreen } from './screens/TransferIntroScreen';
import { VoiceConfirmScreen } from './screens/VoiceConfirmScreen';

type FlowScreen =
  | 'transfer'
  | 'listening'
  | 'recipient'
  | 'bankselect'
  | 'accountinput'
  | 'amountinput'
  | 'voiceconfirm'
  | 'pretransfer'
  | 'password'
  | 'transferdone';

const STT_FAIL_MESSAGE = '음성을 잘 듣지 못했어요. 다시 말씀해주세요.';
const STT_PERMISSION_MESSAGE = '마이크 사용 권한을 켠 뒤 다시 시도하거나, 직접 입력으로 진행해주세요.';
const STT_UNAVAILABLE_MESSAGE = '이 기기에서는 음성 송금을 사용할 수 없어요. 직접 입력으로 진행해주세요.';
const EMPTY_TX: TxInfo = { recipient: '', bank: '', account: '', amount: '' };

/**
 * 메인 송금 STT: 사용자가 실제로 말한 값만 사용한다. 파싱에 실패하면 자동으로 채우지 않고
 * 직접 입력(recipient 화면)으로 보낸다. fallbackTranscript 는 절대 쓰지 않는다.
 */
function parseSpokenTransfer(
  transcript: string,
): { txInfo: TxInfo } | null {
  const compact = transcript.replace(/\s/g, '');
  const nameMatch = compact.match(/^(.+?)(?:님)?(?:에게|한테|에게로|한테로)/);
  const name = nameMatch?.[1]?.replace(/님$/, '') ?? '';
  const contact = name
    ? CONTACTS.find((c) => c.name === name || c.name.slice(1) === name)
    : undefined;

  let amount = '';
  const man = compact.match(/(\d+)만원?/);
  if (man) amount = String(parseInt(man[1], 10) * 10000);
  else {
    const won = compact.match(/(\d+)원/);
    if (won) amount = won[1];
  }

  if (!contact || !amount) return null;
  return {
    txInfo: { recipient: contact.name, bank: contact.bank, account: contact.account, amount },
  };
}

/**
 * danbi_jj main/MainBankingApp.tsx 의 송금 퍼널 + 선제적 도움 상태 머신 이식.
 * 세부 화면은 라우트로 만들지 않고 내부 state 로만 관리한다.
 */
export function TransferFlow() {
  const router = useRouter();
  const { pendingTransactions, unknownTransactions } = useTransactions();

  const [screen, setScreen] = useState<FlowScreen>('transfer');
  const [phase, setPhase] = useState<ListeningPhase>('idle');
  const [transcript, setTranscript] = useState('');
  const [sttError, setSttError] = useState('');
  const [sttNonce, setSttNonce] = useState(0);
  const [txInfo, setTxInfo] = useState<TxInfo>(EMPTY_TX);
  const [isNewAccount, setIsNew] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [pinValue, setPinValue] = useState('');

  // ── Proactive help ─────────────────────────────────────
  const [helpState, setHelpState] = useState<HelpState>(HELP_IDLE);
  const [helpDismissedAt, setHelpDismissedAt] = useState<number | null>(null);
  const [ttsPhase, setTtsPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [advisorState, setAdvisor] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [ptReviewDone, setPtReviewDone] = useState(false);

  const helpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const helpStepRef = useRef<HelpStep>('idle');
  const helpModeRef = useRef(false);
  const screenRef = useRef<FlowScreen>('transfer');
  const visitCounts = useRef<Partial<Record<FlowScreen, number>>>({});
  const inputErrCounts = useRef<Partial<Record<FlowScreen, number>>>({});
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advisorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sttSessionRef = useRef<{ start: () => void; abort: () => void } | null>(null);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);
  useEffect(() => {
    helpStepRef.current = helpState.step;
  }, [helpState.step]);

  const clearPhaseTimer = () => {
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    phaseTimerRef.current = null;
  };
  const clearHelpTimer = () => {
    if (helpTimerRef.current) {
      clearTimeout(helpTimerRef.current);
      helpTimerRef.current = null;
    }
  };
  const clearAdvisorTimer = () => {
    if (advisorTimerRef.current) clearTimeout(advisorTimerRef.current);
    advisorTimerRef.current = null;
  };
  const abortStt = () => {
    sttSessionRef.current?.abort();
    sttSessionRef.current = null;
  };

  const isInCooldown = useCallback(
    () => !!helpDismissedAt && Date.now() - helpDismissedAt < 30000,
    [helpDismissedAt],
  );

  const doEscalateTo = useCallback((step: 'voice' | 'counselor') => {
    if (helpStepRef.current === 'idle') return;
    clearHelpTimer();
    setHelpState((prev) => ({ ...prev, step }));
    helpStepRef.current = step;
    if (step === 'voice') {
      setTtsPhase('idle');
      helpTimerRef.current = setTimeout(() => {
        if (helpStepRef.current === 'idle') return;
        clearHelpTimer();
        clearAdvisorTimer();
        setHelpState((prev) => ({ ...prev, step: 'counselor' }));
        helpStepRef.current = 'counselor';
        setAdvisor('idle');
      }, 20000);
    } else {
      clearAdvisorTimer();
      setAdvisor('idle');
    }
  }, []);

  const doTriggerHighlight = useCallback(
    (s: FlowScreen, reason: HelpReason) => {
      if (helpStepRef.current !== 'idle' || isInCooldown()) return;
      const def = SCREEN_HELP[s];
      if (!def) return;
      const target = s === 'pretransfer' && !ptReviewDone ? 'txCard' : def.target;
      setHelpState({
        step: 'highlight',
        reason,
        target,
        hint: reason === 'repeatedReentry' ? REENTRY_HINTS[s] ?? def.hint : def.hint,
        voiceText: def.voiceText,
      });
      helpStepRef.current = 'highlight';
      helpModeRef.current = true;
      clearHelpTimer();
      helpTimerRef.current = setTimeout(() => doEscalateTo('voice'), 20000);
    },
    [doEscalateTo, isInCooldown, ptReviewDone],
  );

  const startInactivityTimer = useCallback(() => {
    clearHelpTimer();
    if (helpStepRef.current !== 'idle') return;
    if (isInCooldown()) return;
    const s = screenRef.current;
    if (!(TRANSFER_SCREENS as string[]).includes(s)) return;
    if (!SCREEN_HELP[s]) return;
    helpTimerRef.current = setTimeout(() => {
      if (helpStepRef.current !== 'idle') return;
      doTriggerHighlight(screenRef.current, 'inactivity');
    }, 20000);
  }, [doTriggerHighlight, isInCooldown]);

  const doResolveHelp = useCallback(() => {
    clearHelpTimer();
    setHelpState(HELP_IDLE);
    helpStepRef.current = 'idle';
    setTtsPhase('idle');
    clearAdvisorTimer();
    setAdvisor('idle');
    helpModeRef.current = false;
    startInactivityTimer();
  }, [startInactivityTimer]);

  const doDismissHelp = useCallback(() => {
    clearHelpTimer();
    clearAdvisorTimer();
    setHelpState(HELP_IDLE);
    helpStepRef.current = 'idle';
    setTtsPhase('idle');
    setAdvisor('idle');
    helpModeRef.current = false;
    setHelpDismissedAt(Date.now());
    ttsStop();
  }, []);

  const doActivity = useCallback(() => {
    if (helpStepRef.current === 'idle') startInactivityTimer();
  }, [startInactivityTimer]);

  const doInputError = useCallback(
    (s: FlowScreen) => {
      const cur = (inputErrCounts.current[s] ?? 0) + 1;
      inputErrCounts.current[s] = cur;
      if (cur >= 2) {
        if (helpStepRef.current === 'idle' && !isInCooldown()) doTriggerHighlight(s, 'inputError');
        else if (helpStepRef.current === 'highlight') doEscalateTo('voice');
      }
    },
    [doEscalateTo, doTriggerHighlight, isInCooldown],
  );

  const doPlayTts = useCallback(() => {
    setTtsPhase('playing');
    ttsSpeak(helpState.voiceText, { onDone: () => setTtsPhase('done') });
  }, [helpState.voiceText]);

  const handleSectionReview = useCallback(() => {
    setPtReviewDone(true);
    setHelpState((prev) =>
      prev.step === 'highlight' && prev.target === 'txCard'
        ? { ...prev, target: 'transferButton', hint: '송금하기를 눌러 진행해주세요.' }
        : prev,
    );
  }, []);

  // ── screen 진입: 방문 카운트 + 선제적 도움 트리거 ──────────
  useEffect(() => {
    const isTransfer = (TRANSFER_SCREENS as string[]).includes(screen);
    if (isTransfer) {
      const visits = (visitCounts.current[screen] ?? 0) + 1;
      visitCounts.current[screen] = visits;
      if (visits >= 3 && helpStepRef.current === 'idle' && !isInCooldown()) {
        doTriggerHighlight(screen, 'repeatedReentry');
        return;
      }
      if (helpStepRef.current === 'idle') startInactivityTimer();
    } else {
      clearHelpTimer();
      if (screen === 'transfer') {
        visitCounts.current = {};
        inputErrCounts.current = {};
        if (helpStepRef.current !== 'idle') {
          setHelpState(HELP_IDLE);
          helpStepRef.current = 'idle';
        }
        helpModeRef.current = false;
      }
    }
    return clearHelpTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── 비밀번호 4자리 → 완료 ────────────────────────────────
  useEffect(() => {
    if (screen === 'password' && pinValue.length === 4) {
      const t = setTimeout(() => {
        setPinValue('');
        setScreen('transferdone');
      }, 400);
      return () => clearTimeout(t);
    }
  }, [pinValue, screen]);

  // ── 메인 송금 STT (엔진 레이어) ──────────────────────────
  useEffect(() => {
    if (screen !== 'listening') {
      abortStt();
      return;
    }
    if (!recognitionEngine.supported) {
      const unsupportedTimer = setTimeout(() => setSttError(STT_UNAVAILABLE_MESSAGE), 0);
      return () => clearTimeout(unsupportedTimer);
    }
    const session = recognitionEngine.create({
      lang: 'ko-KR',
      onPartial: (t) => {
        setTranscript(t);
        setPhase('heard');
      },
      onFinal: (t) => {
        setTranscript(t);
        setPhase('confirmed');
      },
      // 인식 실패해도 fallbackTranscript(예시 문장)는 쓰지 않는다. 권한 문제와 그 외
      // 실패를 구분해 안내만 다르게 하고, 사용자는 '직접 입력하기'로 이어갈 수 있다.
      onError: (kind) =>
        setSttError(kind === 'permission' ? STT_PERMISSION_MESSAGE : STT_FAIL_MESSAGE),
      onEnd: () => {},
    });
    if (!session) {
      const unavailableTimer = setTimeout(() => setSttError(STT_UNAVAILABLE_MESSAGE), 0);
      return () => clearTimeout(unavailableTimer);
    }
    sttSessionRef.current = session;
    session.start();
    return () => {
      session.abort();
      sttSessionRef.current = null;
    };
  }, [screen, sttNonce]);

  // ── 언마운트 정리 ────────────────────────────────────────
  useEffect(
    () => () => {
      clearHelpTimer();
      clearPhaseTimer();
      clearAdvisorTimer();
      abortStt();
      ttsStop();
    },
    [],
  );

  // ── 네비게이션 ──────────────────────────────────────────
  const goHome = useCallback(() => {
    clearPhaseTimer();
    clearHelpTimer();
    abortStt();
    ttsStop();
    router.dismissTo('/(app)/home');
  }, [router]);

  const openTransfer = () => {
    clearPhaseTimer();
    setSttError('');
    setPhase('idle');
    setTranscript('');
    setSttNonce((n) => n + 1);
    setScreen('listening');
  };

  const retryListening = () => {
    setSttError('');
    setPhase('idle');
    setTranscript('');
    setSttNonce((n) => n + 1);
  };

  const goPretransfer = () => {
    setPtReviewDone(false);
    setScreen('pretransfer');
  };

  const afterListenConfirm = () => {
    abortStt();
    const parsed = parseSpokenTransfer(transcript);
    if (parsed) {
      setTxInfo(parsed.txInfo);
      setIsNew(false);
      setScreen('voiceconfirm');
    } else {
      // 말한 내용을 확실히 해석하지 못하면 자동으로 채우지 않고 직접 입력으로.
      setScreen('recipient');
    }
  };

  const goManualInput = () => {
    setSttError('');
    abortStt();
    setScreen('recipient');
  };

  const initiateTransfer = () => {
    const amt = parseInt(txInfo.amount || '0', 10);
    if (isNewAccount || amt >= LARGE_AMOUNT_THRESHOLD) {
      setShowPopup(true);
    } else {
      setPinValue('');
      setScreen('password');
    }
  };

  const isLargeAmount = parseInt(txInfo.amount || '0', 10) >= LARGE_AMOUNT_THRESHOLD;
  const helpTarget = helpState.step === 'highlight' ? helpState.target : '';

  // ── Android 하드웨어 back: 내부 이전 단계 우선 ────────────
  useAndroidBack(() => {
    if (showPopup) {
      setShowPopup(false);
      return true;
    }
    if (helpState.step === 'voice' || helpState.step === 'counselor') {
      doDismissHelp();
      return true;
    }
    switch (screen) {
      case 'transfer':
        return false; // 퍼널 첫 화면 → expo-router 가 /home 으로
      case 'listening':
      case 'recipient':
      case 'voiceconfirm':
        setScreen('transfer');
        return true;
      case 'bankselect':
        setScreen('recipient');
        return true;
      case 'accountinput':
        setScreen('bankselect');
        return true;
      case 'amountinput':
        setScreen(txInfo.account ? 'accountinput' : 'recipient');
        return true;
      case 'pretransfer':
        setScreen('amountinput');
        return true;
      case 'password':
        goPretransfer();
        return true;
      case 'transferdone':
        goHome();
        return true;
      default:
        return true;
    }
  });

  return (
    <Screen background="#fff" edges={['top', 'bottom']}>
      <ScreenIn key={screen}>
        {screen === 'transfer' && (
          <TransferIntroScreen
            onMic={openTransfer}
            onGoHome={goHome}
            onDirect={() => setScreen('recipient')}
            onHistory={() => router.replace('/(app)/history')}
            needCheckCount={pendingTransactions.length}
            unknownCount={unknownTransactions.length}
          />
        )}

        {screen === 'listening' && (
          <ListeningScreen
            mode="transfer"
            phase={phase}
            transcript={transcript}
            error={sttError || undefined}
            retryable={sttError !== STT_UNAVAILABLE_MESSAGE}
            onBack={() => setScreen('transfer')}
            onRetry={retryListening}
            onConfirm={afterListenConfirm}
            onManualInput={goManualInput}
          />
        )}

        {screen === 'recipient' && (
          <RecipientScreen
            onBack={() => setScreen('transfer')}
            onSelectContact={(c) => {
              doResolveHelp();
              setTxInfo({ recipient: c.name, bank: c.bank, account: c.account, amount: '' });
              setIsNew(false);
              setScreen('amountinput');
            }}
            onNewAccount={() => {
              doResolveHelp();
              setTxInfo(EMPTY_TX);
              setIsNew(true);
              setScreen('bankselect');
            }}
            helpTarget={helpTarget}
            onActivity={doActivity}
          />
        )}

        {screen === 'bankselect' && (
          <BankSelectScreen
            onBack={() => setScreen('recipient')}
            onSelect={(bank) => {
              doResolveHelp();
              setTxInfo((p) => ({ ...p, bank, account: '' }));
              setScreen('accountinput');
            }}
            helpTarget={helpTarget}
            onActivity={doActivity}
          />
        )}

        {screen === 'accountinput' && (
          <AccountInputScreen
            bank={txInfo.bank}
            value={txInfo.account}
            onChange={(v) => {
              setTxInfo((p) => ({ ...p, account: v }));
              doResolveHelp();
              doActivity();
            }}
            onBack={() => setScreen('bankselect')}
            onReselect={() => setScreen('bankselect')}
            onNext={() => {
              doResolveHelp();
              setTxInfo((p) => ({
                ...p,
                recipient: p.recipient || `${p.bank} 계좌 ${p.account.slice(-4)}`,
              }));
              setScreen('amountinput');
            }}
            helpTarget={helpTarget}
            onActivity={doActivity}
            onBlockedHelp={() => doInputError('accountinput')}
          />
        )}

        {screen === 'amountinput' && (
          <AmountInputScreen
            value={txInfo.amount}
            onChange={(v) => {
              setTxInfo((p) => ({ ...p, amount: v }));
              doResolveHelp();
              doActivity();
            }}
            onBack={() => setScreen(txInfo.account ? 'accountinput' : 'recipient')}
            onNext={() => {
              doResolveHelp();
              goPretransfer();
            }}
            helpTarget={helpTarget}
            onActivity={doActivity}
            onBlockedHelp={() => doInputError('amountinput')}
          />
        )}

        {screen === 'voiceconfirm' && (
          <VoiceConfirmScreen
            txInfo={txInfo}
            onBack={() => setScreen('transfer')}
            onConfirm={goPretransfer}
          />
        )}

        {screen === 'pretransfer' && (
          <PreTransferScreen
            txInfo={txInfo}
            onBack={() => setScreen('amountinput')}
            onTransfer={() => {
              doResolveHelp();
              initiateTransfer();
            }}
            onRecheck={() => {
              doResolveHelp();
              setScreen('amountinput');
            }}
            helpTarget={helpTarget}
            onActivity={doActivity}
            onSectionReview={handleSectionReview}
          />
        )}

        {screen === 'password' && (
          <PasswordScreen value={pinValue} onChange={setPinValue} onCancel={goPretransfer} />
        )}

        {screen === 'transferdone' && <TransferDoneScreen txInfo={txInfo} onHome={goHome} />}
      </ScreenIn>

      <ConfirmPopup
        visible={showPopup}
        txInfo={txInfo}
        isNewAccount={isNewAccount}
        isLargeAmount={isLargeAmount}
        onConfirm={() => {
          setShowPopup(false);
          setPinValue('');
          setScreen('password');
        }}
        onCancel={() => setShowPopup(false)}
      />

      {/* ── 1단계: 조작 영역 강조 (non-blocking dim + hint bar) ── */}
      {helpState.step === 'highlight' && !showPopup ? (
        <>
          <View pointerEvents="none" style={styles.dim} />
          <View style={styles.hintBar}>
            <View style={styles.hintIcon}>
              <AppText size={15}>💡</AppText>
            </View>
            <AppText size={15} weight={700} color="#fff" lineHeight={22} style={styles.flex1}>
              {helpState.hint}
            </AppText>
          </View>
        </>
      ) : null}

      {/* ── 2단계: 문구 + TTS 안내 ── */}
      <Modal
        visible={helpState.step === 'voice' && !showPopup}
        transparent
        animationType="fade"
        onRequestClose={doDismissHelp}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            {ttsPhase === 'playing' ? (
              <View style={styles.centerBlock}>
                <AppText size={22} weight={900} color={INK} align="center" style={styles.mb10}>
                  안내하고 있어요
                </AppText>
                <AppText size={14} color="#888" align="center" style={styles.mb24}>
                  천천히 들어보세요.
                </AppText>
                <View style={styles.centerRow}>
                  <Waveform active />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.voiceHead}>
                  <View style={styles.voiceIcon}>
                    <AppText size={22}>💡</AppText>
                  </View>
                  <View style={styles.flex1}>
                    <AppText size={12} weight={700} color="#B8860B" style={styles.mb2}>
                      단비의 도움말
                    </AppText>
                    <AppText size={17} weight={900} color={INK} lineHeight={24}>
                      {helpState.hint}
                    </AppText>
                  </View>
                </View>

                {ttsPhase === 'done' ? (
                  <View style={styles.voiceTextCard}>
                    <AppText size={15} weight={700} color={INK} lineHeight={24}>
                      {helpState.voiceText}
                    </AppText>
                  </View>
                ) : null}

                {ttsPhase === 'idle' ? (
                  <Pressable accessibilityRole="button" onPress={doPlayTts} style={styles.playBtn}>
                    <AppText size={16} weight={900} color={INK}>
                      🔊 안내 듣기
                    </AppText>
                  </Pressable>
                ) : null}

                <View style={styles.voiceActions}>
                  {ttsPhase === 'done' ? (
                    <Pressable accessibilityRole="button" onPress={doPlayTts} style={styles.grayBtn}>
                      <AppText size={15} weight={700} color={INK}>
                        🔊 다시 들려주세요
                      </AppText>
                    </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      clearHelpTimer();
                      setHelpState((prev) => ({ ...prev, step: 'highlight' }));
                      helpStepRef.current = 'highlight';
                      helpTimerRef.current = setTimeout(() => doEscalateTo('counselor'), 20000);
                    }}
                    style={styles.grayBtn}
                  >
                    <AppText size={15} weight={700} color="#555">
                      직접 입력할게요
                    </AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => doEscalateTo('counselor')}
                    style={styles.outlineBtn}
                  >
                    <AppText size={15} weight={700} color="#666">
                      도움이 더 필요해요
                    </AppText>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={doDismissHelp} style={styles.quietBtn}>
                    <AppText size={14} weight={600} color="#AAA">
                      혼자 할게요
                    </AppText>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── 3단계: 상담원 안내 ── */}
      <Modal
        visible={helpState.step === 'counselor' && !showPopup}
        transparent
        animationType="fade"
        onRequestClose={doDismissHelp}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            {advisorState === 'connecting' ? (
              <View style={styles.centerBlock}>
                <AppText size={44} align="center" style={styles.mb18}>
                  📞
                </AppText>
                <AppText size={22} weight={900} color={INK} align="center" style={styles.mb10}>
                  상담원 연결 중...
                </AppText>
                <AppText size={15} color="#888" align="center">
                  잠시만 기다려 주세요.
                </AppText>
              </View>
            ) : advisorState === 'connected' ? (
              <View style={styles.centerBlock}>
                <View style={styles.connectedMark}>
                  <AppText size={30}>✅</AppText>
                </View>
                <AppText size={22} weight={900} color={INK} align="center" style={styles.mb8}>
                  상담원이 연결되었습니다
                </AppText>
                <AppText size={15} color="#888" align="center" lineHeight={23} style={styles.mb24}>
                  담당 상담원이 곧 도와드릴 거예요.
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setHelpState(HELP_IDLE);
                    helpStepRef.current = 'idle';
                    clearAdvisorTimer();
                    setAdvisor('idle');
                    startInactivityTimer();
                  }}
                  style={styles.playBtn}
                >
                  <AppText size={16} weight={900} color={INK}>
                    확인
                  </AppText>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.centerBlock}>
                  <AppText size={42} align="center" style={styles.mb14}>
                    🙋
                  </AppText>
                  <AppText size={22} weight={900} color={INK} align="center" lineHeight={30} style={styles.mb8}>
                    계속 진행하기 어려우신가요?
                  </AppText>
                  <AppText size={15} color="#888" align="center" lineHeight={23} style={styles.mb22}>
                    상담원의 도움을 받아보세요.
                  </AppText>
                </View>
                {isWithinBusinessHours() ? (
                  <View style={styles.voiceActions}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        clearAdvisorTimer();
                        setAdvisor('connecting');
                        advisorTimerRef.current = setTimeout(() => {
                          advisorTimerRef.current = null;
                          if (helpStepRef.current === 'counselor') setAdvisor('connected');
                        }, 2000);
                      }}
                      style={styles.playBtnLg}
                    >
                      <AppText size={17} weight={900} color={INK}>
                        상담원 연결하기
                      </AppText>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        clearHelpTimer();
                        setHelpState((prev) => ({ ...prev, step: 'voice' }));
                        helpStepRef.current = 'voice';
                        setTtsPhase('idle');
                        helpTimerRef.current = setTimeout(() => doEscalateTo('counselor'), 20000);
                      }}
                      style={styles.grayBtnLg}
                    >
                      <AppText size={15} weight={700} color="#555">
                        음성 안내 다시 듣기
                      </AppText>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={doDismissHelp} style={styles.outlineBtnLg}>
                      <AppText size={15} weight={700} color="#666">
                        혼자 계속하기
                      </AppText>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.voiceActions}>
                    <View style={styles.offHoursBox}>
                      <AppText size={13} weight={700} color="#C04040" align="center">
                        현재 상담 운영 시간 외입니다 (평일 09:00~18:00)
                      </AppText>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void callCustomerCenter()}
                      style={styles.playBtnLg}
                    >
                      <AppText size={17} weight={900} color={INK}>
                        고객센터 전화하기
                      </AppText>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => Alert.alert('', '상담 가능 시간은 평일 오전 9시부터 오후 6시까지입니다.')}
                      style={styles.grayBtnLg}
                    >
                      <AppText size={15} weight={700} color="#555">
                        상담 가능한 시간 확인하기
                      </AppText>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        clearHelpTimer();
                        setHelpState((prev) => ({ ...prev, step: 'voice' }));
                        helpStepRef.current = 'voice';
                        setTtsPhase('idle');
                        helpTimerRef.current = setTimeout(() => doEscalateTo('counselor'), 20000);
                      }}
                      style={styles.outlineBtnLg}
                    >
                      <AppText size={15} weight={700} color="#666">
                        음성 안내 다시 듣기
                      </AppText>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={doDismissHelp} style={styles.quietBtn}>
                      <AppText size={14} weight={600} color="#AAA">
                        혼자 계속하기
                      </AppText>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  mb2: { marginBottom: 2 },
  mb8: { marginBottom: 8 },
  mb10: { marginBottom: 10 },
  mb14: { marginBottom: 14 },
  mb18: { marginBottom: 18 },
  mb22: { marginBottom: 22 },
  mb24: { marginBottom: 24 },

  dim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.07)',
    zIndex: 30,
  },
  hintBar: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    zIndex: 36,
    backgroundColor: 'rgba(40,32,0,0.88)',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hintIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingTop: 30,
    paddingBottom: 26,
    paddingHorizontal: 24,
  },
  centerBlock: { alignItems: 'center' },
  centerRow: { flexDirection: 'row', justifyContent: 'center' },
  voiceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  voiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceTextCard: {
    backgroundColor: CREAM,
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: '#F6D879',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  playBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: YELLOW,
    borderRadius: 14,
    marginBottom: 18,
  },
  playBtnLg: {
    width: '100%',
    paddingVertical: 17,
    alignItems: 'center',
    backgroundColor: YELLOW,
    borderRadius: 15,
  },
  voiceActions: { gap: 9 },
  grayBtn: {
    width: '100%',
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 13,
  },
  grayBtnLg: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
  },
  outlineBtn: {
    width: '100%',
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 13,
  },
  outlineBtnLg: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 15,
  },
  quietBtn: {
    width: '100%',
    paddingVertical: 11,
    alignItems: 'center',
  },
  connectedMark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF7EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  offHoursBox: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
});
