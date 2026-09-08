import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { INK, YELLOW } from '../../theme';
import { NavBar } from '../../components/NavBar';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '취소', '0', '지우기'];

/** 4자리 송금 비밀번호 커스텀 키패드. */
export function PasswordScreen({
  value,
  onChange,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onCancel: () => void;
}) {
  const handleKey = (k: string) => {
    if (k === '취소') {
      onChange('');
      onCancel();
    } else if (k === '지우기') {
      onChange(value.slice(0, -1));
    } else if (value.length < 4) {
      onChange(value + k);
    }
  };

  return (
    <View style={styles.root}>
      <NavBar title="비밀번호 입력" onBack={onCancel} />
      <View style={styles.body}>
        <View style={styles.lockBox}>
          <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
            <Rect x={3} y={11} width={18} height={11} rx={2} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
            <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          </Svg>
        </View>
        <AppText size={24} weight={900} color={INK} align="center" lineHeight={33} style={styles.mb24}>
          {'계좌 비밀번호\n4자리를 입력해 주세요'}
        </AppText>

        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i < value.length ? INK : 'transparent',
                  borderColor: i < value.length ? INK : '#CCC',
                },
              ]}
            />
          ))}
        </View>
        <AppText size={13} color="#AAA" align="center" style={styles.mb32}>
          비밀번호는 다른 사람에게 보이지 않게 입력해 주세요.
        </AppText>

        <View style={styles.grid}>
          {KEYS.map((k, i) => {
            const isText = k === '취소' || k === '지우기';
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={k}
                onPress={() => handleKey(k)}
                style={[styles.key, isText && styles.keyText]}
              >
                <AppText size={isText ? 14 : 22} weight={700} color={k === '취소' ? '#E05050' : INK}>
                  {k}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  mb24: { marginBottom: 24 },
  mb32: { marginBottom: 32 },
  lockBox: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  dots: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 14,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  key: {
    width: '31.5%',
    flexGrow: 1,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 12,
  },
  keyText: {
    backgroundColor: '#F5F5F5',
  },
});
