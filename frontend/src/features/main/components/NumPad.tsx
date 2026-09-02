import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { INK } from '../theme';

/**
 * danbi_jj main/components.tsx <NumPad> 이식.
 * 계좌번호 / 금액 입력용 3열 커스텀 키패드. 모바일 기본 키보드에 의존하지 않는다.
 */
export function NumPad({
  value,
  onChange,
  bottomLeft = null,
}: {
  value: string;
  onChange: (v: string) => void;
  bottomLeft?: string | null;
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', bottomLeft ?? '', '0', '⌫'];
  const press = (k: string) => {
    if (!k) return;
    if (k === '⌫') onChange(value.slice(0, -1));
    else onChange(value + k);
  };
  return (
    <View style={styles.grid}>
      {keys.map((k, i) => (
        <Pressable
          key={i}
          disabled={!k}
          accessibilityRole="button"
          accessibilityLabel={k === '⌫' ? '한 자리 지우기' : k || undefined}
          onPress={() => press(k)}
          style={[styles.key, k === '⌫' && styles.keyBack, !k && styles.keyEmpty]}
        >
          <AppText size={k === '⌫' ? 18 : 22} weight={700} color={INK}>
            {k}
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
    width: '31.5%',
    flexGrow: 1,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 12,
  },
  keyBack: {
    backgroundColor: '#EFEFEF',
  },
  keyEmpty: {
    opacity: 0,
    borderWidth: 0,
  },
});
