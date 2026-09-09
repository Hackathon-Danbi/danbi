import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { INK } from '@/features/main/theme';

/**
 * 간편 비밀번호 입력 부품. 메인 앱 송금 비밀번호 화면(PasswordScreen)과 같은 규격을
 * 쓰므로, 가입·로그인·재인증 화면의 키패드가 모두 동일하게 보인다.
 */

export function PinDots({ length, filled }: { length: number; filled: number }) {
  return (
    <View style={s.dots} accessibilityLabel={`비밀번호 ${filled}자리 입력됨`}>
      {Array.from({ length }, (_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            {
              backgroundColor: i < filled ? INK : 'transparent',
              borderColor: i < filled ? INK : '#CCC',
            },
          ]}
        />
      ))}
    </View>
  );
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '지우기', '0', '전체 지우기'] as const;

export function PinKeypad({
  onDigit,
  onBackspace,
  onClear,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}) {
  const handle = (key: string) => {
    if (key === '지우기') onBackspace();
    else if (key === '전체 지우기') onClear();
    else onDigit(key);
  };

  return (
    <View style={s.grid} accessibilityLabel="간편 비밀번호 숫자 키패드">
      {KEYS.map((key) => {
        const isText = key === '지우기' || key === '전체 지우기';
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={key}
            onPress={() => handle(key)}
            style={({ pressed }) => [s.key, isText && s.keyText, pressed && s.keyPressed]}
          >
            <AppText size={isText ? 14 : 22} weight={700} color={INK}>
              {key}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 20 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },

  grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  key: {
    width: '31.5%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    backgroundColor: '#fff',
  },
  keyText: { backgroundColor: '#F5F5F5' },
  keyPressed: { opacity: 0.75 },
});
