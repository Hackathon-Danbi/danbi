import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { speak, stop as stopSpeaking } from '@/lib/speech/tts';
import { colors } from '@/theme/tokens';
import { SimulationSafetyBanner } from './SimulationSafetyBanner';
import type { RiskScenario } from './types';

type Props = {
  scenario: RiskScenario;
  onRequestTransfer: () => void;
  onStop: () => void;
};

type Phase = 'incoming' | 'conversation' | 'request';

export function ScenarioSimulationScreen({ scenario, onRequestTransfer, onStop }: Props) {
  const [phase, setPhase] = useState<Phase>(scenario.contactType === 'call' ? 'incoming' : 'conversation');
  const [step, setStep] = useState(0);
  const visibleSteps = scenario.contactType === 'message'
    ? scenario.dialogueSteps.slice(0, step + 1)
    : [scenario.dialogueSteps[step]];
  const currentStep = scenario.dialogueSteps[step];
  const isLastStep = step === scenario.dialogueSteps.length - 1;

  useEffect(() => {
    if (phase === 'conversation' && scenario.contactType === 'call' && currentStep?.tts) {
      speak(currentStep.text);
    }
    return () => stopSpeaking();
  }, [currentStep, phase, scenario.contactType]);

  const advance = () => {
    stopSpeaking();
    if (isLastStep) setPhase('request');
    else setStep((current) => current + 1);
  };

  if (phase === 'incoming') {
    return (
      <View style={styles.root}>
        <SimulationSafetyBanner />
        <View style={styles.callIncoming}>
          <View style={styles.phoneIcon}><AppText size={38}>☎</AppText></View>
          <AppText size={18} weight={800} color={colors.muted}>전화가 왔어요</AppText>
          <AppText size={30} weight={900} color={colors.ink} align="center">{scenario.contactName}</AppText>
          <AppText size={17} color={colors.muted}>{scenario.contactAddress}</AppText>
          <View style={styles.callActions}>
            <CallAction label="거절" color="#d9534f" onPress={onStop} />
            <CallAction label="받기" color="#41a564" onPress={() => setPhase('conversation')} />
          </View>
          <AppText size={14} weight={700} color="#8a1f18" align="center" lineHeight={21}>
            이 전화는 앱 안에서만 진행되는 모의 연습입니다.
          </AppText>
        </View>
      </View>
    );
  }

  if (phase === 'request') {
    return (
      <View style={styles.root}>
        <SimulationSafetyBanner />
        <View style={styles.topBar}>
          <AppText size={19} weight={900} color={colors.ink}>{scenario.contactName}</AppText>
          <Pressable accessibilityRole="button" onPress={onStop} style={styles.closeBtn}>
            <AppText size={14} weight={800} color={colors.muted}>
              {scenario.contactType === 'call' ? '통화 종료' : '메시지 닫기'}
            </AppText>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.requestBody}>
          <View style={styles.requestBadge}><AppText size={13} weight={900} color="#8a2d26">송금 요청</AppText></View>
          <AppText size={28} weight={900} color={colors.ink} align="center" lineHeight={37}>
            지금 이 계좌로{`\n`}보내달라고 해요
          </AppText>
          <View style={styles.transferCard}>
            <Field label="받는 사람" value={scenario.transferRequest.recipientName} />
            <View style={styles.line} />
            <Field label="연습용 계좌" value={`${scenario.transferRequest.bank}\n${scenario.transferRequest.account}`} />
            <View style={styles.line} />
            <Field label="요청 금액" value={`${scenario.transferRequest.amount.toLocaleString('ko-KR')}원`} />
          </View>
          <AppText size={14} color={colors.muted} align="center" lineHeight={21}>
            실제 돈은 움직이지 않아요. 지금처럼 직접 판단해보세요.
          </AppText>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" onPress={onRequestTransfer} style={styles.primary}>
            <AppText size={18} weight={900} color="#fff">송금 화면으로 가기</AppText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onStop} style={styles.stopBtn}>
            <AppText size={17} weight={850} color="#8a2d26">송금하지 않고 멈추기</AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SimulationSafetyBanner />
      <View style={styles.topBar}>
        <View>
          <AppText size={13} weight={800} color={scenario.contactType === 'call' ? '#31824d' : colors.muted}>
            {scenario.contactType === 'call' ? '☎ 통화 중 · 00:31' : scenario.contactAddress}
          </AppText>
          <AppText size={20} weight={900} color={colors.ink} style={styles.mt3}>{scenario.contactName}</AppText>
        </View>
        <Pressable accessibilityRole="button" onPress={onStop} style={styles.closeBtn}>
          <AppText size={14} weight={800} color="#8a2d26">
            {scenario.contactType === 'call' ? '통화 종료' : '닫기'}
          </AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.conversation}>
        {visibleSteps.map((dialogue) => (
          <View key={dialogue.id} style={styles.bubble}>
            <AppText size={18} weight={650} color={colors.ink} lineHeight={29}>{dialogue.text}</AppText>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={advance} style={styles.primary}>
          <AppText size={18} weight={900} color="#fff">
            {isLastStep ? '계좌 정보 확인하기' : scenario.contactType === 'call' ? '계속 듣기' : '다음 메시지 보기'}
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onStop} style={styles.stopBtn}>
          <AppText size={17} weight={850} color="#8a2d26">
            {scenario.contactType === 'call' ? '전화 끊기' : '메시지 닫기'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function CallAction({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.callAction}>
      <View style={[styles.callActionIcon, { backgroundColor: color }]}><AppText size={25} color="#fff">☎</AppText></View>
      <AppText size={16} weight={800} color={colors.ink}>{label}</AppText>
    </Pressable>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <AppText size={13} weight={700} color={colors.muted}>{label}</AppText>
      <AppText size={21} weight={900} color={colors.ink} lineHeight={29} style={styles.mt3}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  mt3: { marginTop: 3 },
  topBar: {
    minHeight: 74,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  closeBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  callIncoming: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 46,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f7f8fc',
  },
  phoneIcon: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#e9ecf5',
  },
  callActions: { flexDirection: 'row', gap: 64, marginTop: 'auto', marginBottom: 24 },
  callAction: { alignItems: 'center', gap: 9 },
  callActionIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  conversation: { padding: 20, gap: 14, flexGrow: 1, justifyContent: 'flex-end' },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    paddingVertical: 15,
    paddingHorizontal: 17,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dde1eb',
  },
  requestBody: { padding: 22, gap: 18, alignItems: 'center' },
  requestBadge: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, backgroundColor: '#fff0ed' },
  transferCard: {
    alignSelf: 'stretch',
    padding: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e1b6b1',
    backgroundColor: '#fff',
  },
  line: { height: 1, backgroundColor: colors.line, marginVertical: 14 },
  footer: { padding: 18, gap: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: '#fff' },
  primary: { minHeight: 62, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.yellow },
  stopBtn: { minHeight: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff0ed' },
});
