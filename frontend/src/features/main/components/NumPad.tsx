import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { INK } from '../theme';

/**
 * danbi_jj main/components.tsx <NumPad> 이식.
 * 계좌번호 / 금액 입력용 3열 커스텀 키패드. 남은 높이에 맞춰 키가 줄어들어
 * 아래 버튼과 겹치지 않는다.
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
  const rows: string[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [bottomLeft ?? '', '0', '⌫'],
  ];
  const press = (k: string) => {
    if (!k) return;
    if (k === '⌫') onChange(value.slice(0, -1));
    else onChange(value + k);
  };
  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row.join('-')} style={styles.row}>
          {row.map((k, i) => (
            <Pressable
              key={`${k}-${i}`}
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
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flex: 1,
    minHeight: 0,
    gap: 8,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  key: {
    flex: 1,
    minHeight: 44,
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
