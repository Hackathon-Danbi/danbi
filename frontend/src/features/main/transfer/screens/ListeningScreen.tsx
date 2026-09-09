import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { AppText } from '@/components/ui/AppText';
import { BORDER, CREAM, INK, YELLOW } from '../../theme';
import type { ListeningPhase } from '../../types';
import { Waveform } from '../../components/Waveform';

type Mode = 'balance' | 'transfer';

const COPY: Record<Mode, { header: string; badge: string; examples: string[] }> = {
  balance: {
    header: '단비에게 물어보기',
    badge: '음성 질문',
    examples: ['"내 통장에 얼마 있어?"', '"이번 달에 얼마 썼어?"', '"최근 거래내역 알려줘"'],
  },
  transfer: {
    header: '말로 송금하기',
    badge: '음성 송금',
    examples: ['"엄마에게 10만원 보내줘"', '"친구에게 2만원 보내줘"', '"내 계좌로 5만원 보내줘"'],
  },
};

/**
 * danbi_jj main/screens/transfer.tsx <ListeningScreen> 이식.
 * 표시 전용 컴포넌트 — phase/transcript/error 는 호출부가 실제 STT 상태에서 전달한다.
 */
export function ListeningScreen({
  mode,
  phase,
  transcript,
  error,
  retryable = true,
  onBack,
  onRetry,
  onConfirm,
  onManualInput,
  helpTarget = '',
  onActivity,
  recording = false,
  onFinishRecording,
}: {
  mode: Mode;
  phase: ListeningPhase;
  transcript: string;
  error?: string;
  /** false 이면 '다시 말하기'가 도움이 되지 않는 상태(엔진 미지원 등) → 숨긴다. */
  retryable?: boolean;
  onBack: () => void;
  onRetry: () => void;
  onConfirm: () => void;
  onManualInput?: () => void;
  helpTarget?: string;
  onActivity?: () => void;
  /** 서버 STT용 오디오를 녹음 중인지 여부. */
  recording?: boolean;
  onFinishRecording?: () => void;
}) {
  const copy = COPY[mode];
  const showButtons = phase !== 'idle' || !!error || recording;
  const showRetry = !error || retryable;

  return (
    <View style={styles.root} onTouchStart={onActivity}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="이전" onPress={onBack} style={styles.back} hitSlop={10}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Polyline points="15 18 9 12 15 6" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
        <AppText size={17} weight={900} color={INK}>
          {copy.header}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.badge}>
          <AppText size={13} weight={700} color="#9A7200">
            {copy.badge}
          </AppText>
        </View>

        {error ? (
          <>
            <AppText size={28} weight={900} color={INK} align="center" style={styles.mb20}>
              잘 듣지 못했어요
            </AppText>
            <View style={styles.errorCard}>
              <AppText size={16} weight={700} color={INK} align="center" lineHeight={24}>
                {error}
              </AppText>
            </View>
          </>
        ) : (
          <>
            <AppText size={28} weight={900} color={INK} align="center" style={styles.mb28}>
              {phase === 'confirmed' ? '이렇게 들었어요' : '말씀을 듣고 있어요'}
            </AppText>
            {phase !== 'confirmed' ? <Waveform active={recording || phase === 'heard'} /> : null}

            {phase === 'idle' && !recording ? (
              <>
                <AppText size={14} color="#888" align="center" style={styles.idleHint}>
                  궁금한 내용을 편하게 말씀해주세요.
                </AppText>
                <PulseHighlight active={helpTarget === 'listenExamples'} borderRadius={14}>
                  <View style={styles.examplesWrap}>
                    <AppText size={15} weight={800} color={INK} style={styles.examplesTitle}>
                      이렇게 말씀해보세요
                    </AppText>
                    <View style={styles.examples}>
                      {copy.examples.map((t) => (
                        <View key={t} style={styles.example}>
                          <AppText size={15} weight={600} color={INK} align="center">
                            {t}
                          </AppText>
                        </View>
                      ))}
                    </View>
                  </View>
                </PulseHighlight>
              </>
            ) : null}

            {phase === 'idle' && recording ? (
              <AppText size={14} color="#888" align="center" style={styles.idleHint}>
                말씀을 마치면 아래 버튼을 눌러주세요.
              </AppText>
            ) : null}

            {phase === 'heard' ? (
              <>
                <AppText size={14} color="#888" align="center" style={styles.heardHint}>
                  궁금한 내용을 편하게 말씀해주세요.
                </AppText>
                <View style={styles.heardCard}>
                  <AppText size={12} weight={700} color="#B8860B" style={styles.mb8}>
                    말씀하신 내용
                  </AppText>
                  <AppText size={22} weight={900} color={INK}>
                    {transcript}
                  </AppText>
                </View>
              </>
            ) : null}

            {phase === 'confirmed' ? (
              <>
                <View style={styles.confirmCard}>
                  <AppText size={12} weight={700} color="#999" style={styles.mb8}>
                    박옥순님의 {mode === 'transfer' ? '말씀' : '질문'}
                  </AppText>
                  <AppText size={22} weight={900} color={INK}>
                    &quot;{transcript}&quot;
                  </AppText>
                </View>
                <AppText size={15} color="#888" align="center">
                  맞으면 네, 맞아요를 눌러주세요.
                </AppText>
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      {showButtons ? (
        <PulseHighlight active={helpTarget === 'listenActions'} borderRadius={14}>
          <View style={styles.footer}>
            {recording && onFinishRecording ? (
              <Pressable accessibilityRole="button" onPress={onFinishRecording} style={[styles.fBtn, styles.fPrimary]}>
                <AppText size={16} weight={700} color={INK}>
                  말하기 완료
                </AppText>
              </Pressable>
            ) : null}
            {!recording && showRetry ? (
              <Pressable accessibilityRole="button" onPress={onRetry} style={[styles.fBtn, styles.fSecondary]}>
                <AppText size={16} weight={700} color="#555">
                  다시 말하기
                </AppText>
              </Pressable>
            ) : null}
            {!recording && error && onManualInput ? (
              <Pressable accessibilityRole="button" onPress={onManualInput} style={[styles.fBtn, styles.fPrimary]}>
                <AppText size={16} weight={700} color={INK}>
                  직접 입력하기
                </AppText>
              </Pressable>
            ) : !recording && !error ? (
              <Pressable accessibilityRole="button" onPress={onConfirm} style={[styles.fBtn, styles.fPrimary]}>
                <AppText size={16} weight={700} color={INK}>
                  네, 맞아요
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </PulseHighlight>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  back: { position: 'absolute', left: 16, padding: 6 },
  body: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  mb8: { marginBottom: 8 },
  mb20: { marginBottom: 20 },
  mb28: { marginBottom: 28 },
  badge: {
    backgroundColor: '#FFF3C4',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  idleHint: { marginTop: 20, marginBottom: 24 },
  examplesWrap: { width: '100%' },
  examplesTitle: { alignSelf: 'flex-start', marginBottom: 14 },
  examples: { width: '100%', gap: 10 },
  example: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  heardHint: { marginTop: 20, marginBottom: 20 },
  heardCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: YELLOW,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  confirmCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: BORDER,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 24,
    marginBottom: 18,
  },
  errorCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: BORDER,
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  fBtn: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 14,
  },
  fSecondary: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#DDD' },
  fPrimary: { backgroundColor: YELLOW },
});
