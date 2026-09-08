import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Toast } from '@/components/ui/Toast';
import { NavBar } from '@/features/main/components/NavBar';
import {
  BottomActionArea,
  GuideBox,
  GuideText,
  PageTitle,
  SeniorTextInput,
} from '@/features/onboarding/components/OnboardingComponents';
import { MOCK_OTP } from '@/features/onboarding/hooks/useOnboardingState';
import { currentUser } from '@/features/shared/data';
import { PinDots, PinKeypad } from '../components/PinPad';
import { PIN_LENGTH, savePin } from '../pinStore';

type Phase = 'verify' | 'create' | 'confirm' | 'done';

/**
 * 재인증. 간편 비밀번호를 잊었거나 다시 확인이 필요할 때 문자로 본인을 확인하고
 * 비밀번호를 새로 정한다. 화면 규격은 메인(홈) 화면과 같다.
 */
export function ReauthFlow({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [phase, setPhase] = useState<Phase>('verify');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [notice, setNotice] = useState('문자로 인증번호를 보냈어요.');

  const currentPin = phase === 'confirm' ? confirmPin : firstPin;

  const verify = () => {
    if (otp !== MOCK_OTP) {
      setOtpError('인증번호가 맞지 않아요. 문자를 다시 확인해주세요.');
      return;
    }
    setOtpError('');
    setPhase('create');
  };

  const enterDigit = (digit: string) => {
    setPinError('');
    if (phase === 'create') {
      const next = (firstPin + digit).slice(0, PIN_LENGTH);
      setFirstPin(next);
      if (next.length === PIN_LENGTH) setPhase('confirm');
      return;
    }
    const next = (confirmPin + digit).slice(0, PIN_LENGTH);
    setConfirmPin(next);
    if (next.length < PIN_LENGTH) return;
    if (next !== firstPin) {
      setConfirmPin('');
      setPinError('번호가 서로 달라요. 처음부터 다시 정해주세요.');
      setFirstPin('');
      setPhase('create');
      return;
    }
    void savePin(next);
    setPhase('done');
  };

  const backspace = () => {
    setPinError('');
    if (phase === 'confirm') setConfirmPin((v) => v.slice(0, -1));
    else setFirstPin((v) => v.slice(0, -1));
  };

  const clearPin = () => {
    setPinError('');
    setFirstPin('');
    setConfirmPin('');
    setPhase('create');
  };

  return (
    <View style={s.root}>
      <NavBar
        title={phase === 'verify' ? '본인 확인' : '간편 비밀번호 변경'}
        onBack={phase === 'verify' ? onCancel : () => setPhase('verify')}
      />
      <KeyboardAvoidingView style={s.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.body}>
          {phase === 'verify' ? (
            <>
              <PageTitle>{'본인 확인을\n한 번 더 할게요'}</PageTitle>
              <GuideText>
                {`${currentUser.name}님 휴대폰으로 보낸 문자에서 숫자 6자리를 확인해주세요.`}
              </GuideText>
              <SeniorTextInput
                label="인증번호"
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                placeholder="숫자 6자리"
                inputMode="numeric"
                maxLength={6}
                error={otpError}
                support="문자로 받은 숫자를 그대로 입력해주세요."
              />
              <GuideBox
                title="프로토타입 인증번호"
                description={`${MOCK_OTP}를 입력하면 본인 확인이 끝나요.`}
              />
            </>
          ) : phase === 'done' ? (
            <>
              <PageTitle>{'새 비밀번호를\n저장했어요'}</PageTitle>
              <GuideText>다음 로그인부터 새로 정한 숫자 6자리를 사용해요.</GuideText>
              <GuideBox tone="success" title="이제 다시 단비를 이용할 수 있어요." />
            </>
          ) : (
            <>
              <PageTitle>
                {phase === 'confirm' ? '한 번 더 입력해주세요' : '새로 쓸 숫자 6자리를\n정해주세요'}
              </PageTitle>
              <GuideText>
                {phase === 'confirm'
                  ? '처음 정한 번호를 그대로 입력해주세요.'
                  : '생일이나 전화번호처럼 알기 쉬운 번호는 피해주세요.'}
              </GuideText>
              <View style={s.pinArea}>
                <View style={s.pinDotsBox}>
                  <PinDots length={PIN_LENGTH} filled={currentPin.length} />
                </View>
                <PinKeypad onDigit={enterDigit} onBackspace={backspace} onClear={clearPin} />
                <AppText
                  size={13}
                  weight={pinError ? 700 : 400}
                  color={pinError ? '#E05050' : '#AAA'}
                  align="center"
                  lineHeight={19}
                  style={s.pinHint}
                >
                  {pinError || '비밀번호는 다른 사람에게 보이지 않게 입력해 주세요.'}
                </AppText>
              </View>
            </>
          )}
        </View>

        {phase === 'verify' ? (
          <BottomActionArea
            primary="인증번호 확인"
            onPrimary={verify}
            primaryDisabled={otp.length !== 6}
            secondary="인증번호 다시 받기"
            onSecondary={() => setNotice('새 인증번호를 보냈어요.')}
          />
        ) : phase === 'done' ? (
          <BottomActionArea primary="확인했어요" onPrimary={onDone} />
        ) : null}
      </KeyboardAvoidingView>
      <Toast message={notice} onDismiss={() => setNotice('')} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  flex1: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 14 },
  pinArea: { alignItems: 'center', marginTop: 18 },
  pinDotsBox: { marginBottom: 22 },
  pinHint: { marginTop: 12 },
});
