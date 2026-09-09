import { Pressable, StyleSheet } from 'react-native';

import { MicWaveRings } from '@/components/anim/MicWaveRings';
import { YELLOW } from '../theme';
import { MicIcon } from './MicIcon';

/** danbi_jj main/components.tsx <MicButton> 이식 (3중 링 = MicWaveRings). */
export function MicButton({ onClick, size = 108 }: { onClick: () => void; size?: number }) {
  return (
    <MicWaveRings size={size}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="마이크"
        onPress={onClick}
        style={({ pressed }) => [
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
          pressed && styles.pressed,
        ]}
      >
        <MicIcon size={Math.round(size * 0.46)} />
      </Pressable>
    </MicWaveRings>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  pressed: {
    transform: [{ scale: 0.93 }],
  },
});
