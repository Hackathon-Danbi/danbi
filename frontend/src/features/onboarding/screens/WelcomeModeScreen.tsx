import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { speak, stop } from '@/lib/speech/tts';
import { colors, radius } from '@/theme/tokens';

export type DisplayMode = 'danbi' | 'standard';

type Props = {
  onSelect: (mode: DisplayMode) => void;
};

const GUIDE = '단비모드는 큰 글씨, 음성 안내, 한 화면 한 행동으로 은행 업무를 함께합니다.';

/** danbi_jj app/features/onboarding/screens/WelcomeModeScreen.tsx 의 RN 이식. */
export function WelcomeModeScreen({ onSelect }: Props) {
  const [isReading, setIsReading] = useState(false);

  useEffect(() => () => stop(), []);

  const toggleGuide = () => {
    if (isReading) {
      stop();
      setIsReading(false);
      return;
    }
    setIsReading(true);
    speak(GUIDE, { onDone: () => setIsReading(false) });
  };

  return (
    <Screen background={colors.paper}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: isReading }}
          accessibilityLabel={isReading ? '음성 안내 멈추기' : '화면 안내 음성으로 듣기'}
          onPress={toggleGuide}
          style={[styles.sound, isReading && styles.soundReading]}
        >
          <AppText size={19} weight={900} color="#292820">
            {isReading ? '■' : '◖))'}
          </AppText>
        </Pressable>

        <View style={styles.copy}>
          <AppText size={40} weight={900} lineHeight={48} letterSpacing={-2} color={colors.ink}>
            {'글씨와 버튼을 크게\n보여드릴까요?'}
          </AppText>
          <AppText
            size={20}
            weight={400}
            lineHeight={33}
            color={colors.welcomeCopyBody}
            style={styles.copyBody}
          >
            {'단비모드는 큰 글씨·음성 안내·한 화면 한 행동으로\n은행 업무를 함께합니다.'}
          </AppText>
        </View>

        <View style={styles.logoWrap}>
          <Image
            accessibilityLabel="단비"
            source={require('@/assets/images/danbi-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onSelect('danbi')}
            style={({ pressed }) => [styles.actionBtn, styles.primary, pressed && styles.pressed]}
          >
            <AppText size={24} weight={900} color={colors.ink} align="center">
              단비모드로 시작
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => onSelect('standard')}
            style={({ pressed }) => [styles.actionBtn, styles.secondary, pressed && styles.pressed]}
          >
            <AppText size={24} weight={900} color={colors.ink} align="center">
              기본 화면 사용
            </AppText>
          </Pressable>

          <View style={styles.hintRow}>
            <AppText size={17} color={colors.welcomeActionsHint} align="center">
              언제든{' '}
            </AppText>
            <AppText size={17} weight={800} color={colors.welcomeActionsStrong}>
              설정
            </AppText>
            <AppText size={17} color={colors.welcomeActionsHint}>
              에서 변경할 수 있어요
            </AppText>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 34,
    paddingBottom: 30,
  },
  sound: {
    position: 'absolute',
    top: 20,
    right: 4,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: colors.welcomeSoundBg,
  },
  soundReading: {
    backgroundColor: colors.yellow,
  },
  copy: {
    marginTop: 96,
  },
  copyBody: {
    marginTop: 24,
  },
  logoWrap: {
    flex: 1,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    maxWidth: 280,
    height: 180,
  },
  actions: {
    gap: 14,
  },
  actionBtn: {
    width: '100%',
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  primary: {
    borderColor: colors.yellow,
    backgroundColor: colors.yellow,
  },
  secondary: {
    borderColor: '#252525',
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
  },
  hintRow: {
    marginTop: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});
