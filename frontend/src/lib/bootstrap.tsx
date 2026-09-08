import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { getString, setString, StorageKeys } from '@/lib/storage';
import type { DisplayMode } from '@/lib/navigation';

type BootstrapContextValue = {
  displayMode: DisplayMode | null;
  onboardingDone: boolean;
  /** 간편 비밀번호가 저장돼 있는지. 저장돼 있으면 앱을 켤 때 로그인 화면을 거친다. */
  pinRegistered: boolean;
  /** 이번 실행에서 간편 비밀번호를 확인했는지(앱을 다시 켜면 false). */
  unlocked: boolean;
  selectDisplayMode: (mode: DisplayMode) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  unlock: () => void;
  lock: () => void;
};

const BootstrapContext = createContext<BootstrapContextValue | null>(null);

function isDisplayMode(value: string | null): value is DisplayMode {
  return value === 'danbi' || value === 'standard';
}

/** 폰트와 진입 상태가 모두 준비된 뒤 모든 시작 경로에서 스플래시를 닫는다. */
export function BootstrapProvider({
  children,
  fontsReady,
}: {
  children: ReactNode;
  fontsReady: boolean;
}) {
  const [displayMode, setDisplayMode] = useState<DisplayMode | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [pinRegistered, setPinRegistered] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const [storedMode, completed, legacyComplete, storedPin] = await Promise.all([
        getString(StorageKeys.displayMode),
        getString(StorageKeys.onboardingCompleted),
        getString(StorageKeys.legacySignupComplete),
        getString(StorageKeys.authPin),
      ]);
      if (!mounted.current) return;

      setDisplayMode(isDisplayMode(storedMode) ? storedMode : null);
      const isComplete = completed === 'true' || legacyComplete === 'true';
      setOnboardingDone(isComplete);
      setPinRegistered(storedPin != null);
      if (completed !== 'true' && legacyComplete === 'true') {
        void setString(StorageKeys.onboardingCompleted, 'true');
      }
      setStorageReady(true);
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  const selectDisplayMode = useCallback(async (mode: DisplayMode) => {
    await setString(StorageKeys.displayMode, mode);
    if (mounted.current) setDisplayMode(mode);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await setString(StorageKeys.onboardingCompleted, 'true');
    const storedPin = await getString(StorageKeys.authPin);
    if (!mounted.current) return;
    setOnboardingDone(true);
    setPinRegistered(storedPin != null);
    // 방금 비밀번호를 정했으니 곧바로 로그인 화면을 다시 보여주지 않는다.
    setUnlocked(true);
  }, []);

  const unlock = useCallback(() => setUnlocked(true), []);
  const lock = useCallback(() => setUnlocked(false), []);

  const ready = fontsReady && storageReady;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  const value = useMemo(
    () => ({
      displayMode,
      onboardingDone,
      pinRegistered,
      unlocked,
      selectDisplayMode,
      completeOnboarding,
      unlock,
      lock,
    }),
    [
      completeOnboarding,
      displayMode,
      lock,
      onboardingDone,
      pinRegistered,
      selectDisplayMode,
      unlock,
      unlocked,
    ],
  );

  if (!ready) return null;
  return <BootstrapContext.Provider value={value}>{children}</BootstrapContext.Provider>;
}

export function useBootstrap() {
  const value = useContext(BootstrapContext);
  if (!value) throw new Error('useBootstrap must be used inside <BootstrapProvider>');
  return value;
}
