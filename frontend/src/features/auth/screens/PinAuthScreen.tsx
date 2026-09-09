import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { INK, YELLOW } from '@/features/main/theme';
import { NavBar } from '@/features/main/components/NavBar';
import { PinDots, PinKeypad } from '../components/PinPad';
import { PIN_LENGTH, verifyPin } from '../pinStore';

const MAX_ATTEMPTS = 5;

/**
 * 로그인(앱 잠금 해제)과 재인증에 함께 쓰는 간편 비밀번호 화면.
 * 메인 앱 송금 비밀번호 화면과 같은 규격(흰 배경 + 노란 자물쇠 + 테두리 키패드)이다.
 */
export function PinAuthScreen({
  title,
  description,
  onSuccess,
  onBack,
  onForgot,
}: {
  title: string;
  description?: string;
  onSuccess: () => void;
  /** 없으면 뒤로 가기 버튼을 숨긴다(앱 잠금 화면). */
  onBack?: () => void;
  /** 비밀번호를 잊었을 때의 도움 경로. */
  onForgot?: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [checking, setChecking] = useState(false);

  const locked = attempts >= MAX_ATTEMPTS;

  const submit = async (value: string) => {
    setChecking(true);
    const ok = await verifyPin(value);
    setChecking(false);
    if (ok) {
      setError('');
      onSuccess();
      return;
    }
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setPin('');
    setError(
      nextAttempts >= MAX_ATTEMPTS
        ? '5번 틀렸어요. 안전을 위해 잠시 뒤 다시 시도하거나 상담원에게 도움을 받아주세요.'
        : `비밀번호가 맞지 않아요. ${MAX_ATTEMPTS - nextAttempts}번 더 입력할 수 있어요.`,
    );
  };

  const addDigit = (digit: string) => {
    if (locked || checking || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setError('');
    setPin(next);
    if (next.length === PIN_LENGTH) void submit(next);
  };

  return (
    <View style={s.root}>
      {onBack ? <NavBar title={title} onBack={onBack} /> : null}
      <View style={s.body}>
        <View style={s.lockBox}>
          <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
            <Rect
              x={3}
              y={11}
              width={18}
              height={11}
              rx={2}
              stroke={INK}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          </Svg>
        </View>

        <AppText size={24} weight={900} color={INK} align="center" lineHeight={33}>
          {`간편 비밀번호\n${PIN_LENGTH}자리를 입력해 주세요`}
        </AppText>
        <AppText size={15} color="#888" align="center" lineHeight={22} style={s.mt8}>
          {description ?? '가입할 때 정한 숫자를 입력하면 바로 들어갈 수 있어요.'}
        </AppText>

        <View style={s.dotsArea}>
          <PinDots length={PIN_LENGTH} filled={pin.length} />
        </View>

        <AppText
          size={15}
          weight={error ? 700 : 400}
          color={error ? '#E05050' : '#AAA'}
          align="center"
          lineHeight={21}
          style={s.hint}
        >
          {error || '비밀번호는 다른 사람에게 보이지 않게 입력해 주세요.'}
        </AppText>

        <PinKeypad
          onDigit={addDigit}
          onBackspace={() => {
            setError('');
            setPin((current) => current.slice(0, -1));
          }}
          onClear={() => {
            setError('');
            setPin('');
          }}
        />

        {onForgot ? (
          <Pressable accessibilityRole="button" onPress={onForgot} style={s.forgot}>
            <AppText size={15} weight={700} color="#888" style={s.underline}>
              비밀번호를 잊으셨나요?
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  lockBox: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    borderRadius: 18,
    backgroundColor: YELLOW,
  },
  mt8: { marginTop: 8 },
  dotsArea: { marginTop: 24, marginBottom: 14 },
  hint: { marginBottom: 28, paddingHorizontal: 10 },
  forgot: { paddingVertical: 14 },
  underline: { textDecorationLine: 'underline' as const },
});
