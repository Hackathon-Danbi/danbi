import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { YELLOW } from '@/features/main/theme';

interface ScreenHelpBarProps {
  guidance: string;
  voiceEnabled: boolean;
  onReplay: () => void;
  onToggleVoice: () => void;
}

/**
 * 선제적 도움 안내 줄. 메인 앱 WarningBar 와 같은 톤(노란 테두리 + 연노랑 배경)이고,
 * 한 화면에 스크롤 없이 들어가도록 한 줄 높이로 유지한다.
 */
export function ScreenHelpBar({ guidance, voiceEnabled, onReplay, onToggleVoice }: ScreenHelpBarProps) {
  if (!guidance) return null;
  return (
    <View style={s.bar} accessibilityLiveRegion="polite">
      <AppText size={13} weight={600} lineHeight={19} color="#7A6000" style={s.text}>
        {guidance}
      </AppText>
      <View style={s.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="안내 다시 듣기"
          onPress={onReplay}
          style={({ pressed }) => [s.btn, pressed && s.pressed]}
          hitSlop={6}
        >
          <AppText size={12} weight={700} color="#7A6000">
            다시 듣기
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={voiceEnabled ? '음성 끄기' : '음성 켜기'}
          onPress={onToggleVoice}
          style={({ pressed }) => [s.btn, pressed && s.pressed]}
          hitSlop={6}
        >
          <AppText size={12} weight={700} color="#7A6000">
            {voiceEnabled ? '음성 끄기' : '음성 켜기'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: YELLOW,
    backgroundColor: '#FFF8D0',
  },
  text: { flex: 1 },
  actions: { gap: 4 },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F0DFA0',
    backgroundColor: '#fff',
  },
  pressed: { opacity: 0.75 },
});
