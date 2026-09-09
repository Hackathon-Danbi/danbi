import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  PracticeInitialState,
  PracticeScreen,
  PracticeStyle,
  PracticeTarget,
  Praise,
  RecipientChoice,
  TransferMethod,
} from './types';
import { savedRecipients } from './data/recipients.mock';
import { AMOUNT_MAX_DIGITS, appendDigits, formatWon } from './utils';
import type { ReviewableTransferStep } from '@/features/missions/transferDifficulty';
import { initialStateForReviewStep, screenForReviewStep } from './reviewMode';
import { isApiConfigured, practiceApi } from '@/api';
import type { PracticeSession, RecordedAudio } from '@/api';
import { PRACTICE_PASSWORD, PRACTICE_PASSWORD_LENGTH } from './practicePassword';

type GoOptions = { replace?: boolean; reset?: boolean };
export type PracticeFlowMode = 'full' | 'review';

interface PracticeContextValue {
  screen: PracticeScreen;
  practiceStyle: PracticeStyle;
  practiceTarget: PracticeTarget;
  mode: PracticeFlowMode;
  reviewStep: ReviewableTransferStep | null;
  reviewScore: { earnedPoints: number; newScore: number; maxScore: number } | null;
  setPracticeStyle: (style: PracticeStyle) => void;
  practiceRecipient: string;
  setPracticeRecipient: (value: string) => void;
  practiceRecipientChoice: RecipientChoice;
  setPracticeRecipientChoice: (value: RecipientChoice) => void;
  practiceVoiceRecipientName: string;
  setPracticeVoiceRecipientName: (value: string) => void;
  practiceRecipientName: string;
  practiceRecipients: readonly import('./types').SavedRecipient[];
  recognizePracticeVoice: (audio: RecordedAudio) => Promise<string>;
  practiceAmount: string;
  setPracticeAmount: (value: string) => void;
  formattedPracticeAmount: string;
  enterPracticeAmount: (value: string) => void;
  practiceMistakeMessage: string;
  reportPracticeMistake: (message: string) => void;
  clearPracticeMistake: () => void;
  transferMethod: TransferMethod;
  setTransferMethod: (method: TransferMethod) => void;
  pin: string;
  setPin: (value: string) => void;
  praise: Praise | null;
  go: (screen: PracticeScreen, options?: GoOptions) => void;
  back: () => void;
  /** 내부 history 스택에 돌아갈 화면이 남아 있는지 (Android hardware back 우선 처리용). */
  canGoBack: boolean;
  guidedNext: (screen: PracticeScreen) => void;
  completePracticeStep: (next: PracticeScreen) => void;
  startReviewStep: () => void;
  restartReview: () => void;
  exitReview: () => void;
  choosePracticeStyle: (style: Exclude<PracticeStyle, null>) => void;
  beginPractice: (method: TransferMethod) => void;
}

const PracticeContext = createContext<PracticeContextValue | null>(null);

export function usePracticeApp() {
  const value = useContext(PracticeContext);
  if (!value) throw new Error('usePracticeApp must be used inside <PracticeProvider>');
  return value;
}

export function PracticeProvider({
  children,
  onComplete,
  onTransferAttempt,
  onExit,
  initialState,
  mode = 'full',
  reviewStep = null,
  apiMissionId,
  reviewScore = null,
}: {
  children: ReactNode;
  onComplete?: () => void;
  onTransferAttempt?: () => void;
  onExit?: () => void;
  initialState?: PracticeInitialState;
  mode?: PracticeFlowMode;
  reviewStep?: ReviewableTransferStep | null;
  apiMissionId?: number;
  reviewScore?: { earnedPoints: number; newScore: number; maxScore: number } | null;
}) {
  const [history, setHistory] = useState<PracticeScreen[]>([initialState?.screen ?? 'practiceHub']);
  const screen = history[history.length - 1];
  const [practiceStyle, setPracticeStyle] = useState<PracticeStyle>(initialState?.practiceStyle ?? null);
  const [practiceRecipient, setPracticeRecipient] = useState(initialState?.practiceRecipient ?? '');
  const [practiceRecipientChoice, setPracticeRecipientChoice] = useState<RecipientChoice>(
    initialState?.practiceRecipientChoice ?? null,
  );
  const [practiceVoiceRecipientName, setPracticeVoiceRecipientName] = useState(
    initialState?.practiceVoiceRecipientName ?? '',
  );
  const [practiceAmount, setPracticeAmount] = useState(initialState?.practiceAmount ?? '');
  const [practiceMistakeMessage, setPracticeMistakeMessage] = useState('');
  const [transferMethod, setTransferMethod] = useState<TransferMethod>(initialState?.transferMethod ?? 'voice');
  const [pin, setPin] = useState('');
  const [praise, setPraise] = useState<Praise | null>(null);
  const [practiceRecipients, setPracticeRecipients] = useState<readonly import('./types').SavedRecipient[]>(savedRecipients);
  const sessionPromiseRef = useRef<Promise<PracticeSession> | null>(null);
  const transferSubmittingRef = useRef(false);
  const practiceTarget = useMemo<PracticeTarget>(() => initialState?.target ?? ({
    recipient: savedRecipients[0],
    amount: '30000',
    amountLabel: '30,000원',
  }), [initialState?.target]);

  useEffect(() => {
    if (!apiMissionId || !isApiConfigured() || mode === 'review') return;
    let active = true;
    void practiceApi.getAccounts().then((accounts) => {
      if (!active || accounts.length === 0) return;
      setPracticeRecipients(accounts.map((account) => ({
        id: String(account.accountId),
        name: account.recipientName,
        bank: account.bankCode === '004' ? 'KB국민은행' : `은행코드 ${account.bankCode}`,
        account: account.accountNumber,
        initials: account.recipientName.slice(0, 1),
      })));
    }).catch(() => {
      // 백엔드 준비 전에는 기존 연습 계좌를 그대로 유지한다.
    });
    return () => {
      active = false;
    };
  }, [apiMissionId, mode]);

  const ensureSession = useCallback((inputType: 'VOICE' | 'DIRECT') => {
    if (!apiMissionId || !isApiConfigured()) return null;
    if (!sessionPromiseRef.current) {
      const request = practiceApi.createSession(
        apiMissionId,
        practiceStyle === 'guided' ? 'GUIDED' : 'SOLO',
        inputType,
      );
      sessionPromiseRef.current = request;
      void request.catch(() => {
        if (sessionPromiseRef.current === request) sessionPromiseRef.current = null;
      });
    }
    return sessionPromiseRef.current;
  }, [apiMissionId, practiceStyle]);

  const recognizePracticeVoice = useCallback(async (audio: RecordedAudio) => {
    const session = await ensureSession('VOICE');
    if (!session) throw new Error('연습 음성 API가 설정되지 않았습니다.');
    const result = await practiceApi.recognizeVoice(session.sessionId, audio);
    return result.recognizedText;
  }, [ensureSession]);

  // useState 의 setter 는 참조가 고정이므로 아래 콜백들도 마운트 동안 안정적이다.
  const clearPracticeData = useCallback(() => {
    setPracticeRecipient('');
    setPracticeRecipientChoice(null);
    setPracticeVoiceRecipientName('');
    setPracticeAmount('');
    setPracticeMistakeMessage('');
    setPin('');
    setPraise(null);
  }, []);

  const resetReviewData = useCallback(() => {
    if (!reviewStep) return;
    const reviewState = initialStateForReviewStep(reviewStep);
    setPracticeStyle(reviewState.practiceStyle);
    setTransferMethod(reviewState.transferMethod);
    setPracticeRecipient(reviewState.practiceRecipient ?? '');
    setPracticeRecipientChoice(reviewState.practiceRecipientChoice ?? null);
    setPracticeVoiceRecipientName(reviewState.practiceVoiceRecipientName ?? '');
    setPracticeAmount(reviewState.practiceAmount ?? '');
    setPracticeMistakeMessage('');
    setPin('');
    setPraise(null);
  }, [reviewStep]);

  const go = useCallback((next: PracticeScreen, options?: GoOptions) => {
    setPracticeMistakeMessage('');
    setHistory((current) => {
      if (options?.reset) return [next];
      if (options?.replace) return [...current.slice(0, -1), next];
      return [...current, next];
    });
  }, []);

  const onExitRef = useRef(onExit);
  useEffect(() => {
    onExitRef.current = onExit;
  });

  const back = useCallback(() => {
    setPracticeMistakeMessage('');
    if (screen === 'practicePin') setPin('');
    if (history.length <= 1) {
      onExitRef.current?.();
      return;
    }
    setHistory((current) => current.slice(0, -1));
  }, [history.length, screen]);

  const choosePracticeStyle = useCallback((style: Exclude<PracticeStyle, null>) => {
    clearPracticeData();
    sessionPromiseRef.current = null;
    setPracticeStyle(style);
    setHistory(['practiceHub', 'practiceMethod']);
  }, [clearPracticeData]);

  const beginPractice = useCallback((method: TransferMethod) => {
    clearPracticeData();
    sessionPromiseRef.current = null;
    setTransferMethod(method);
    setHistory((current) => {
      const base = current[current.length - 1] === 'practiceComplete'
        ? ['practiceMethod'] as PracticeScreen[]
        : current;
      return [...base, method === 'voice' ? 'practiceVoice' : 'practiceRecipient'];
    });
  }, [clearPracticeData]);

  const guidedNext = useCallback((next: PracticeScreen) => go(next), [go]);

  const completePracticeStep = useCallback((next: PracticeScreen) => {
    // 맞춤 복습은 한 단계만 연습하므로 history 를 쌓지 않고 완료 화면으로 교체한다.
    // (full 모드의 practiceComplete 진입과 동일하게 뒤로가기 스택을 남기지 않는다.)
    if (mode === 'review') {
      setHistory(['practiceReviewComplete']);
      return;
    }
    go(next);
  }, [go, mode]);

  const startReviewStep = useCallback(() => {
    if (!reviewStep) return;
    go(screenForReviewStep(reviewStep));
  }, [go, reviewStep]);

  const restartReview = useCallback(() => {
    if (!reviewStep) return;
    resetReviewData();
    setHistory(['practiceReviewIntro']);
  }, [resetReviewData, reviewStep]);

  const exitReview = useCallback(() => onExitRef.current?.(), []);

  const enterPracticeAmount = useCallback((value: string) => {
    setPracticeAmount((current) => appendDigits(current, value, {
      maxLength: AMOUNT_MAX_DIGITS,
      trimLeadingZeros: true,
    }));
  }, []);

  const practiceRecipientName = practiceVoiceRecipientName || (
    practiceRecipientChoice === 'new'
      ? '새로 입력한 계좌'
      : practiceRecipients.find((recipient) => recipient.id === practiceRecipientChoice)?.name ?? ''
  );

  const onTransferAttemptRef = useRef(onTransferAttempt);
  useEffect(() => {
    onTransferAttemptRef.current = onTransferAttempt;
  });

  useEffect(() => {
    if (screen !== 'practicePin' || pin.length !== PRACTICE_PASSWORD_LENGTH || transferSubmittingRef.current) return;
    // 서버 연습(실제 practicePassword 전송)일 때만 고정 비밀번호 1234를 강제한다.
    // API 미설정 오프라인 연습은 기존처럼 아무 4자리나 허용한다.
    const serverPractice = !!apiMissionId && isApiConfigured();
    const timer = setTimeout(() => {
      if (serverPractice && pin !== PRACTICE_PASSWORD) {
        setPin('');
        setPracticeMistakeMessage(`연습용 비밀번호 ${PRACTICE_PASSWORD}를 입력해주세요.`);
        return;
      }
      if (mode === 'review') {
        setHistory(['practiceReviewComplete']);
        return;
      } else if (onTransferAttemptRef.current) {
        onTransferAttemptRef.current();
        return;
      }
      const completeLocally = () => {
        if (practiceStyle === 'guided') {
          setPraise({ text: '송금 연습을 모두 마쳤어요.', next: 'practiceComplete' });
        } else {
          setHistory(['practiceComplete']);
        }
      };
      if (!serverPractice) {
        completeLocally();
        return;
      }

      // 서버 연습 송금은 점수 동기화용 best-effort. 실패/타임아웃이어도 연습 흐름은 완료된다.
      transferSubmittingRef.current = true;
      completeLocally();
      void (async () => {
        try {
          const session = await ensureSession(transferMethod === 'voice' ? 'VOICE' : 'DIRECT');
          const recipient = practiceRecipients.find((item) => (
            item.id === practiceRecipientChoice || item.account === practiceRecipient
          ));
          const accountId = recipient ? Number(recipient.id) : NaN;
          if (!session || !recipient || !Number.isFinite(accountId)) return;
          await practiceApi.transfer(session.sessionId, accountId, Number(practiceAmount), pin);
          await practiceApi.getResult(session.sessionId);
        } catch {
          // 서버 동기화 실패는 조용히 무시한다. 연습은 이미 완료 처리됐다.
        } finally {
          transferSubmittingRef.current = false;
        }
      })();
    }, 350);
    return () => clearTimeout(timer);
  }, [
    apiMissionId, ensureSession, mode, pin, practiceAmount, practiceRecipient,
    practiceRecipientChoice, practiceRecipients, practiceStyle, screen, transferMethod,
  ]);

  useEffect(() => {
    if (!praise) return;
    const timer = setTimeout(() => {
      setPraise(null);
      setHistory([praise.next]);
    }, 1200);
    return () => clearTimeout(timer);
  }, [praise]);

  // onComplete 의 최신 참조만 유지해, 화면이 practiceComplete 가 되는 순간 한 번만 호출한다.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });
  useEffect(() => {
    if (screen === 'practiceComplete' || screen === 'practiceReviewComplete') {
      onCompleteRef.current?.();
    }
  }, [screen]);

  const value = useMemo<PracticeContextValue>(() => ({
    screen,
    practiceStyle,
    practiceTarget,
    mode,
    reviewStep,
    reviewScore,
    setPracticeStyle,
    practiceRecipient,
    setPracticeRecipient,
    practiceRecipientChoice,
    setPracticeRecipientChoice,
    practiceVoiceRecipientName,
    setPracticeVoiceRecipientName,
    practiceRecipientName,
    practiceRecipients,
    recognizePracticeVoice,
    practiceAmount,
    setPracticeAmount,
    formattedPracticeAmount: formatWon(practiceAmount),
    enterPracticeAmount,
    practiceMistakeMessage,
    reportPracticeMistake: setPracticeMistakeMessage,
    clearPracticeMistake: () => setPracticeMistakeMessage(''),
    transferMethod,
    setTransferMethod,
    pin,
    setPin,
    praise,
    go,
    back,
    canGoBack: history.length > 1,
    guidedNext,
    completePracticeStep,
    startReviewStep,
    restartReview,
    exitReview,
    choosePracticeStyle,
    beginPractice,
  }), [
    screen, history.length, practiceStyle, practiceTarget, practiceRecipient, practiceRecipientChoice,
    practiceVoiceRecipientName, practiceRecipientName, practiceRecipients, practiceAmount,
    practiceMistakeMessage, transferMethod, pin, praise,
    mode, reviewStep, reviewScore, go, back, guidedNext, completePracticeStep, startReviewStep,
    restartReview, exitReview, choosePracticeStyle, beginPractice, enterPracticeAmount,
    recognizePracticeVoice,
  ]);

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
}
