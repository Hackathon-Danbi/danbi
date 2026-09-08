import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ScreenIn } from '@/components/anim/ScreenIn';
import { speak as ttsSpeak, stop as ttsStop } from '@/lib/speech/tts';
import { useAndroidBack } from '@/lib/useAndroidBack';
import { P } from './theme';
import { PracticeProvider, usePracticeApp } from './PracticeContext';
import { GuidedPraiseOverlay } from './components/GuidedPraiseOverlay';
import { PracticeHubScreen } from './screens/PracticeHubScreen';
import { PracticeMethodScreen } from './screens/PracticeMethodScreen';
import { PracticeVoiceScreen } from './screens/PracticeVoiceScreen';
import { PracticeRecipientScreen } from './screens/PracticeRecipientScreen';
import { PracticeAmountScreen } from './screens/PracticeAmountScreen';
import { PracticeReviewScreen } from './screens/PracticeReviewScreen';
import { PracticePinScreen } from './screens/PracticePinScreen';
import { PracticeCompleteScreen } from './screens/PracticeCompleteScreen';
import type { MissionId } from '@/features/missions/data/missions';
import { MISSION_PRACTICE_PRESETS } from './missionPresets';
import { getPracticeStepGuidance } from './guidance';
import type { PracticeInitialState } from './types';

const SCREENS = {
  practiceHub: PracticeHubScreen,
  practiceMethod: PracticeMethodScreen,
  practiceVoice: PracticeVoiceScreen,
  practiceRecipient: PracticeRecipientScreen,
  practiceAmount: PracticeAmountScreen,
  practiceReview: PracticeReviewScreen,
  practicePin: PracticePinScreen,
  practiceComplete: PracticeCompleteScreen,
} as const;

function PracticeRouter({ onExit }: { onExit?: () => void }) {
  const { screen, practiceStyle, back, canGoBack } = usePracticeApp();
  const Current = SCREENS[screen];

  // Android 하드웨어 back: PracticeProvider 의 history[] 스택을 먼저 소비한다.
  // 미션에서 진입한 첫 화면이면 onExit으로 금융독립 허브에 복귀한다.
  useAndroidBack(() => {
    if (canGoBack || onExit) {
      back();
      return true;
    }
    return false;
  });

  // guided만 현재 단계 안내를 한 번 재생한다. 화면이 바뀌거나 연습을 떠나면
  // 이전 안내를 먼저 정리해 빠른 이동에서도 음성이 남지 않게 한다.
  useEffect(() => {
    const guidance = getPracticeStepGuidance(practiceStyle, screen);
    ttsStop();
    if (guidance) ttsSpeak(guidance);
    return () => ttsStop();
  }, [practiceStyle, screen]);

  return (
    <View style={styles.root}>
      <ScreenIn key={screen}>
        <Current />
      </ScreenIn>
      <GuidedPraiseOverlay />
      {onExit ? (
        <Pressable accessibilityRole="button" onPress={onExit} style={styles.exit}>
          <AppText size={13} weight={700} color={P.accentText}>
            연습 그만하기
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export interface PracticeModeProps {
  onExit?: () => void;
  onComplete?: () => void;
  /** 위험 상황에서는 PIN 입력 뒤 실제 완료 대신 안전 개입 화면으로 전환한다. */
  onTransferAttempt?: () => void;
  missionId?: MissionId;
  initialState?: PracticeInitialState;
}

/** danbi_jj practice/PracticeMode.tsx 이식. <PracticeMode /> 하나만 렌더하면 된다. */
export function PracticeMode({
  onExit,
  onComplete,
  onTransferAttempt,
  missionId,
  initialState,
}: PracticeModeProps) {
  return (
    <PracticeProvider
      onComplete={onComplete}
      onTransferAttempt={onTransferAttempt}
      onExit={onExit}
      initialState={initialState ?? (missionId ? MISSION_PRACTICE_PRESETS[missionId] : undefined)}
    >
      <PracticeRouter onExit={onExit} />
    </PracticeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper },
  exit: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
    elevation: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: P.accentBorder,
    backgroundColor: P.white,
  },
});
