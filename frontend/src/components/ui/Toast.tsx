import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radius } from '@/theme/tokens';

type ToastProps = {
  message: string;
  onDismiss: () => void;
};

/**
 * danbi_jj onboarding.css .onboarding-toast 대응.
 * 화면 하단에 떠서 탭하면 사라지는 안내. `message` 가 비면 렌더하지 않는다.
 */
export function Toast({ message, onDismiss }: ToastProps) {
  if (!message) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLiveRegion="polite"
      onPress={onDismiss}
      style={styles.toast}
    >
      <AppText size={15} weight={700} color={colors.white} align="center" lineHeight={22}>
        {message}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    backgroundColor: 'rgba(23,23,23,0.92)',
  },
});
