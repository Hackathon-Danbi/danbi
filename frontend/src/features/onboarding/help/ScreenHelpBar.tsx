import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';

interface ScreenHelpBarProps {
  guidance: string;
  voiceEnabled: boolean;
  onReplay: () => void;
  onToggleVoice: () => void;
}

/** danbi_jj onboarding/help/ScreenHelpBar.tsx 이식 (onboarding-help.css .screen-help-bar). */
export function ScreenHelpBar({ guidance, voiceEnabled, onReplay, onToggleVoice }: ScreenHelpBarProps) {
  if (!guidance) return null;
  return (
    <View style={styles.bar} accessibilityLiveRegion="polite">
      <AppText size={16} weight={500} lineHeight={25} color="#2c3e7a" style={styles.text}>
        {guidance}
      </AppText>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="안내 다시 듣기"
          onPress={onReplay}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        >
          <AppText size={14} weight={700} color="#2c3e7a" align="center">
            다시 듣기
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={voiceEnabled ? '음성 끄기' : '음성 켜기'}
          onPress={onToggleVoice}
          style={({ pressed }) => [styles.btn, styles.mute, pressed && styles.btnPressed]}
        >
          <AppText size={14} weight={700} color="#7a8ab5" align="center">
            {voiceEnabled ? '음성 끄기' : '음성 켜기'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginTop: 12,
    marginBottom: 16,
    padding: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f0f4ff',
    borderWidth: 1.5,
    borderColor: '#c7d4ff',
    borderRadius: 14,
  },
  text: {
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#9db3ff',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  btnPressed: {
    backgroundColor: '#eef1ff',
  },
  mute: {
    flex: 0,
    minWidth: 88,
    backgroundColor: 'transparent',
    borderColor: '#c0c8e8',
  },
});
