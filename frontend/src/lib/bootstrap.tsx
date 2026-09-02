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
  selectDisplayMode: (mode: DisplayMode) => Promise<void>;
  completeOnboarding: () => Promise<void>;
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
  const [storageReady, setStorageReady] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const [storedMode, completed, legacyComplete] = await Promise.all([
        getString(StorageKeys.displayMode),
        getString(StorageKeys.onboardingCompleted),
        getString(StorageKeys.legacySignupComplete),
      ]);
      if (!mounted.current) return;

      setDisplayMode(isDisplayMode(storedMode) ? storedMode : null);
      const isComplete = completed === 'true' || legacyComplete === 'true';
      setOnboardingDone(isComplete);
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
    if (mounted.current) setOnboardingDone(true);
  }, []);

  const ready = fontsReady && storageReady;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  const value = useMemo(
    () => ({ displayMode, onboardingDone, selectDisplayMode, completeOnboarding }),
    [completeOnboarding, displayMode, onboardingDone, selectDisplayMode],
  );

  if (!ready) return null;
  return <BootstrapContext.Provider value={value}>{children}</BootstrapContext.Provider>;
}

export function useBootstrap() {
  const value = useContext(BootstrapContext);
  if (!value) throw new Error('useBootstrap must be used inside <BootstrapProvider>');
  return value;
}
