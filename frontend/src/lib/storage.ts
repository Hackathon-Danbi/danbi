/**
 * danbi_jj 는 `window.localStorage` 에 진행 상태를 저장했다. RN 에서는 AsyncStorage 로
 * 옮긴다(비동기이므로 hydration 완료 여부를 항상 구분할 수 있게 훅을 제공).
 *
 * `sessionStorage` 기반 `danbi.onboarding.progress` / `danbi.onboarding.state` 새로고침
 * 복원 로직은 RN 에 새로고침 개념이 없어 사용하지 않는다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  displayMode: 'danbi.display-mode',
  onboardingCompleted: 'danbi.onboarding.completed',
  /** legacy — 읽기 전용. 존재하면 onboardingCompleted 로 승격. */
  legacySignupComplete: 'danbi.signup-complete',
  onboardingDraft: 'danbi.onboarding.draft',
  /** 가입 때 정한 간편 비밀번호. 로그인/재인증에서 확인한다. */
  authPin: 'danbi.auth.pin',
  missionsCompleted: 'danbi.missions.completed',
  dailyPractice: 'danbi.daily.practice',
  quizRecord: 'danbi.quiz.record',
  transactionReviews: 'danbi.transactions.reviews',
  savedRecipients: 'danbi.transfer.saved-recipients',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

// ── 저수준 래퍼 ────────────────────────────────────────────────
export async function getString(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setString(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    /* 무시 — 지속성 실패가 앱을 막지 않게 한다 */
  }
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await getString(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await setString(key, JSON.stringify(value));
}

export async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    /* 무시 */
  }
}

// ── 훅 ────────────────────────────────────────────────────────
type PersistentState<T> = {
  value: T;
  setValue: (next: T | ((prev: T) => T)) => void;
  /** AsyncStorage 에서 초기값을 읽어온 뒤 true. false 동안은 `value` 를 신뢰하지 말 것. */
  hydrated: boolean;
};

/**
 * AsyncStorage 를 뒤에 둔 상태. `serialize` 를 넘기지 않으면 JSON 으로 저장한다.
 * 초깃값 읽기가 끝나기 전(`hydrated === false`)에는 화면 렌더를 게이트해야 한다.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  options?: {
    parse?: (raw: string) => T;
    stringify?: (value: T) => string;
  },
): PersistentState<T> {
  const parse = options?.parse;
  const stringify = options?.stringify;
  const [value, setValueState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const raw = await getString(key);
      if (!mounted.current) return;
      if (raw != null) {
        try {
          setValueState(parse ? parse(raw) : (JSON.parse(raw) as T));
        } catch {
          /* 손상된 값 무시 → initial 유지 */
        }
      }
      setHydrated(true);
    })();
    return () => {
      mounted.current = false;
    };
    // key 만 의존: parse/stringify 는 호출부에서 안정적으로 넘긴다고 가정
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValueState((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        void setString(key, stringify ? stringify(resolved) : JSON.stringify(resolved));
        return resolved;
      });
    },
    [key, stringify],
  );

  return { value, setValue, hydrated };
}
