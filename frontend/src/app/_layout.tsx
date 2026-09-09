import '@/global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BootstrapProvider } from '@/lib/bootstrap';
import { useAppFonts } from '@/theme/fonts';
import { colors } from '@/theme/tokens';

// 폰트와 저장소 hydrate가 끝날 때까지 네이티브 스플래시를 유지한다.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { fontsReady } = useAppFonts();

  return (
    <BootstrapProvider fontsReady={fontsReady}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.paper },
            }}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </BootstrapProvider>
  );
}
