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

type GoOptions = { replace?: boolean; reset?: boolean };

interface PracticeContextValue {
  screen: PracticeScreen;
  practiceStyle: PracticeStyle;
  practiceTarget: PracticeTarget;
  setPracticeStyle: (style: PracticeStyle) => void;
  practiceRecipient: string;
  setPracticeRecipient: (value: string) => void;
  practiceRecipientChoice: RecipientChoice;
  setPracticeRecipientChoice: (value: RecipientChoice) => void;
  practiceVoiceRecipientName: string;
  setPracticeVoiceRecipientName: (value: string) => void;
  practiceRecipientName: string;
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
}: {
  children: ReactNode;
  onComplete?: () => void;
  onTransferAttempt?: () => void;
  onExit?: () => void;
  initialState?: PracticeInitialState;
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
  const practiceTarget = useMemo<PracticeTarget>(() => initialState?.target ?? ({
    recipient: savedRecipients[0],
    amount: '30000',
    amountLabel: '30,000원',
  }), [initialState?.target]);

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
    setPracticeStyle(style);
    setHistory(['practiceHub', 'practiceMethod']);
  }, [clearPracticeData]);

  const beginPractice = useCallback((method: TransferMethod) => {
    clearPracticeData();
    setTransferMethod(method);
    setHistory((current) => {
      const base = current[current.length - 1] === 'practiceComplete'
        ? ['practiceMethod'] as PracticeScreen[]
        : current;
      return [...base, method === 'voice' ? 'practiceVoice' : 'practiceRecipient'];
    });
  }, [clearPracticeData]);

  const guidedNext = useCallback((next: PracticeScreen) => go(next), [go]);

  const enterPracticeAmount = useCallback((value: string) => {
    setPracticeAmount((current) => appendDigits(current, value, {
      maxLength: AMOUNT_MAX_DIGITS,
      trimLeadingZeros: true,
    }));
  }, []);

  const practiceRecipientName = practiceVoiceRecipientName || (
    practiceRecipientChoice === 'new'
      ? '새로 입력한 계좌'
      : savedRecipients.find((recipient) => recipient.id === practiceRecipientChoice)?.name ?? ''
  );

  const onTransferAttemptRef = useRef(onTransferAttempt);
  useEffect(() => {
    onTransferAttemptRef.current = onTransferAttempt;
  });

  useEffect(() => {
    if (screen !== 'practicePin' || pin.length !== 4) return;
    const timer = setTimeout(() => {
      if (onTransferAttemptRef.current) {
        onTransferAttemptRef.current();
        return;
      }
      if (practiceStyle === 'guided') {
        setPraise({ text: '송금 연습을 모두 마쳤어요.', next: 'practiceComplete' });
      } else {
        setHistory(['practiceComplete']);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [pin, practiceStyle, screen]);

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
    if (screen === 'practiceComplete') onCompleteRef.current?.();
  }, [screen]);

  const value = useMemo<PracticeContextValue>(() => ({
    screen,
    practiceStyle,
    practiceTarget,
    setPracticeStyle,
    practiceRecipient,
    setPracticeRecipient,
    practiceRecipientChoice,
    setPracticeRecipientChoice,
    practiceVoiceRecipientName,
    setPracticeVoiceRecipientName,
    practiceRecipientName,
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
    choosePracticeStyle,
    beginPractice,
  }), [
    screen, history.length, practiceStyle, practiceTarget, practiceRecipient, practiceRecipientChoice,
    practiceVoiceRecipientName, practiceRecipientName, practiceAmount,
    practiceMistakeMessage, transferMethod, pin, praise,
    go, back, guidedNext, choosePracticeStyle, beginPractice, enterPracticeAmount,
  ]);

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
}
