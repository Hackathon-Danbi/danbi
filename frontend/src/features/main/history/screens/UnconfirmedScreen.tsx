import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { AppText } from '@/components/ui/AppText';
import { EscalationSheet } from '@/features/onboarding/help/EscalationSheet';
import { useStagedIdle } from '@/features/onboarding/help/captureHelp';
import { speak as ttsSpeak, stop as ttsStop } from '@/lib/speech/tts';
import { INK, YELLOW } from '../../theme';
import { NavBar } from '../../components/NavBar';
import { HISTORY_HELP } from '../historyHelp';
import { RealTxBadge } from '../components/RealTxBadge';

/**
 * 미확인 거래내역 흐름의 첫 화면.
 * 음성 요약(요약 읽어주기) 또는 통장별 상세(자세히 보기) 중 하나를 고르게 한다.
 */
export function UnconfirmedScreen({
  count,
  onReadSummary,
  onDetail,
  onHome,
}: {
  count: number;
  onReadSummary: () => void;
  onDetail: () => void;
  onHome: () => void;
}) {
  const { stage, bump } = useStagedIdle(true);
  const [showEscalation, setShowEscalation] = useState(false);
  const escalatedRef = useRef(false);
  const prevStage = useRef(0);

  useEffect(() => {
    ttsSpeak(HISTORY_HELP.gateEntry(count));
    return () => ttsStop();
  }, [count]);

  useEffect(() => {
    if (stage === prevStage.current) return;
    const previous = prevStage.current;
    prevStage.current = stage;
    if (stage <= previous) return;
    if (stage === 1) ttsSpeak(HISTORY_HELP.gateIdle);
    if (stage >= 3 && !escalatedRef.current) {
      escalatedRef.current = true;
      setShowEscalation(true);
    }
  }, [stage]);

  const go = (action: () => void) => {
    ttsStop();
    action();
  };

  return (
    <View style={styles.root} onTouchStart={bump}>
      <NavBar title="미확인 거래내역" onBack={onHome} />

      <View style={styles.center}>
        <RealTxBadge />

        <View style={styles.mark}>
          <AppText size={32} weight={900} color={INK}>
            ₩
          </AppText>
        </View>

        <AppText size={20} weight={800} color="#555" align="center" style={styles.mb8}>
          최근 7일 동안
        </AppText>
        <AppText size={28} weight={900} color={INK} align="center" lineHeight={38} style={styles.mb16}>
          확인하지 않은 거래내역{'\n'}총{' '}
          <AppText size={28} weight={900} color={YELLOW}>
            {count}건
          </AppText>
          이 있어요
        </AppText>
        <AppText size={15} color="#888" align="center" lineHeight={24}>
          {'최근 거래를 음성으로 듣거나\n직접 확인할 수 있어요.'}
        </AppText>
      </View>

      <View style={styles.footer}>
        <PulseHighlight active={stage >= 1} borderRadius={16}>
          <Pressable accessibilityRole="button" onPress={() => go(onReadSummary)} style={styles.primary}>
            <Svg width={15} height={16} viewBox="0 0 15 16" fill="none">
              <Polygon points="2,2 13,8 2,14" fill={INK} />
            </Svg>
            <AppText size={17} weight={900} color={INK}>
              요약 읽어주기
            </AppText>
          </Pressable>
        </PulseHighlight>

        <Pressable accessibilityRole="button" onPress={() => go(onDetail)} style={styles.secondary}>
          <AppText size={16} weight={900} color={INK}>
            자세히 보기
          </AppText>
        </Pressable>

        <Pressable accessibilityRole="button" onPress={() => go(onHome)} style={styles.tertiary}>
          <AppText size={16} weight={700} color="#666">
            홈으로 가기
          </AppText>
        </Pressable>
      </View>

      <EscalationSheet visible={showEscalation} onDismiss={() => setShowEscalation(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  mark: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  footer: {
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  primary: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
    borderRadius: 16,
  },
  secondary: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: YELLOW,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  tertiary: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
});
