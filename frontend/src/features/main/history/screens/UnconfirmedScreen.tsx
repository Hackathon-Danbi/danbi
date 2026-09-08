import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { AppText } from '@/components/ui/AppText';
import { EscalationSheet } from '@/features/onboarding/help/EscalationSheet';
import { useStagedIdle } from '@/features/onboarding/help/captureHelp';
import { speak as ttsSpeak, stop as ttsStop } from '@/lib/speech/tts';
import { INK, YELLOW } from '../../theme';
import { NavBar } from '../../components/NavBar';
import { HISTORY_HELP } from '../historyHelp';

/** danbi_jj main/screens/history.tsx <UnconfirmedScreen> 이식. */
export function UnconfirmedScreen({
  count,
  onDetail,
  onHome,
}: {
  count: number;
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

  return (
    <View style={styles.root} onTouchStart={bump}>
      <NavBar title="미확인 거래내역" onBack={onHome} />

      <View style={styles.center}>
        <View style={styles.mark}>
          <AppText size={32} weight={900} color={INK}>
            ₩
          </AppText>
        </View>

        <AppText size={28} weight={900} color={INK} align="center" lineHeight={38} style={styles.mb16}>
          확인하지 않은 거래내역{'\n'}총{' '}
          <AppText size={28} weight={900} color={YELLOW}>
            {count}건
          </AppText>
          이 있어요
        </AppText>
        <AppText size={15} color="#888" align="center" lineHeight={24}>
          최근 거래를 하나씩 확인해주세요.
        </AppText>
      </View>

      <View style={styles.footer}>
        <PulseHighlight active={stage >= 1} borderRadius={16}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              ttsStop();
              onDetail();
            }}
            style={styles.primary}
          >
            <AppText size={17} weight={900} color={INK}>
              자세히 보기
            </AppText>
          </Pressable>
        </PulseHighlight>
        <Pressable accessibilityRole="button" onPress={onHome} style={styles.secondary}>
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
  mb16: { marginBottom: 16 },
  mark: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  footer: {
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  primary: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: YELLOW,
    borderRadius: 16,
  },
  secondary: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 16,
  },
});
