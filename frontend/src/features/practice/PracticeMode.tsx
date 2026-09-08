import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ScreenIn } from '@/components/anim/ScreenIn';
import { stop as ttsStop } from '@/lib/speech/tts';
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
  const { screen, back, canGoBack } = usePracticeApp();
  const Current = SCREENS[screen];

  // Android 하드웨어 back: PracticeProvider 의 history[] 스택을 가장 먼저 소비한다.
  // 돌아갈 내부 화면이 없으면 false 를 반환해 상위(MissionMode)가 hub 로 복귀하게 한다.
  useAndroidBack(() => {
    if (canGoBack) {
      back();
      return true;
    }
    return false;
  });

  // 언마운트 시 재생 중이던 안내 정리. STT 세션 abort 는 useSpeechRecognition 훅이,
  // 진행 타이머 clear 는 PracticeContext 의 각 effect cleanup 이 담당한다.
  useEffect(() => () => ttsStop(), []);

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
  missionId?: MissionId;
}

/** danbi_jj practice/PracticeMode.tsx 이식. <PracticeMode /> 하나만 렌더하면 된다. */
export function PracticeMode({ onExit, onComplete, missionId }: PracticeModeProps) {
  return (
    <PracticeProvider
      onComplete={onComplete}
      onExit={onExit}
      initialState={missionId ? MISSION_PRACTICE_PRESETS[missionId] : undefined}
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
