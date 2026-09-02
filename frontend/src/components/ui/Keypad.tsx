import { StyleSheet, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radius } from '@/theme/tokens';

const BACKSPACE = '⌫';

type KeypadProps = {
  value: string;
  onChange: (next: string) => void;
  /** 왼쪽 아래 특수 키 (예: "000"). 없으면 빈 칸. */
  bottomLeft?: string | null;
  maxLength?: number;
};

/**
 * danbi_jj main/components.tsx <NumPad> + onboarding 키패드 공통화.
 * 1–9 / (bottomLeft) / 0 / ⌫ 3열 그리드.
 */
export function Keypad({ value, onChange, bottomLeft = null, maxLength }: KeypadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', bottomLeft ?? '', '0', BACKSPACE];

  const press = (key: string) => {
    if (!key) return;
    if (key === BACKSPACE) {
      onChange(value.slice(0, -1));
      return;
    }
    const next = value + key;
    onChange(maxLength ? next.slice(0, maxLength) : next);
  };

  return (
    <View style={styles.grid}>
      {keys.map((key, index) => (
        <Pressable
          key={index}
          disabled={!key}
          accessibilityRole="button"
          accessibilityLabel={key === BACKSPACE ? '한 자리 지우기' : key || undefined}
          onPress={() => press(key)}
          style={({ pressed }) => [
            styles.key,
            key === BACKSPACE && styles.keyBackspace,
            !key && styles.keyEmpty,
            pressed && key ? styles.keyPressed : null,
          ]}
        >
          <AppText size={key === BACKSPACE ? 20 : 24} weight={700} color={colors.mainInk}>
            {key}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  key: {
    // 3열: (100% - 2*gap) / 3
    width: '31%',
    flexGrow: 1,
    flexBasis: '30%',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    backgroundColor: colors.white,
  },
  keyBackspace: {
    backgroundColor: '#EFEFEF',
  },
  keyEmpty: {
    opacity: 0,
    borderWidth: 0,
  },
  keyPressed: {
    backgroundColor: '#F3F0E7',
  },
});
