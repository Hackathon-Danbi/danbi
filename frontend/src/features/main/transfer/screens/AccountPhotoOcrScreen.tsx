import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { AppText } from '@/components/ui/AppText';
import { bankOf } from '../../data';
import { BORDER, CREAM, INK, YELLOW } from '../../theme';
import { NavBar } from '../../components/NavBar';
import type { AccountNumberCandidate } from '../ocrAccountNumber';
import { IconScan } from '../components/AccountPhotoIcons';

type Props = {
  mode: 'processing' | 'single' | 'multiple' | 'failure';
  bank: string;
  candidates: AccountNumberCandidate[];
  onBack: () => void;
  onRetry: () => void;
  onManualInput: () => void;
  onConfirm: (candidate: AccountNumberCandidate) => void;
  helpTarget?: string;
  onActivity?: () => void;
};

export function AccountPhotoOcrScreen({
  mode,
  bank,
  candidates,
  onBack,
  onRetry,
  onManualInput,
  onConfirm,
  helpTarget = '',
  onActivity,
}: Props) {
  const [selectedDigits, setSelectedDigits] = useState('');
  const selected = candidates.find((candidate) => candidate.digits === selectedDigits);

  if (mode === 'processing') {
    return (
      <View style={styles.root}>
        <NavBar title="사진에서 찾기" onBack={onBack} />
        <View style={styles.processing} accessibilityLiveRegion="polite">
          <IconScan />
          <AppText size={25} weight={900} color={INK} align="center">
            계좌번호를 찾고 있어요
          </AppText>
          <AppText size={14} color="#777" align="center" lineHeight={21}>
            사진 속 숫자를 꼼꼼히 확인하고 있어요.
          </AppText>
        </View>
      </View>
    );
  }

  if (mode === 'failure') {
    return (
      <View style={styles.root} onTouchStart={onActivity}>
        <NavBar title="사진에서 찾기" onBack={onBack} />
        <View style={styles.failureBody}>
          <IconScan />
          <AppText size={27} weight={900} color={INK} align="center" lineHeight={36}>
            계좌번호를 정확히 찾지 못했어요.
          </AppText>
          <AppText size={16} color="#777" align="center" lineHeight={24}>
            다른 사진을 선택하거나 직접 입력해주세요.
          </AppText>
        </View>
        <View style={styles.footer}>
          <SecondaryButton label="사진 다시 선택" onPress={onRetry} />
          <PulseHighlight active={helpTarget === 'ocrManual'} borderRadius={16}>
            <PrimaryButton label="직접 입력하기" onPress={onManualInput} />
          </PulseHighlight>
        </View>
      </View>
    );
  }

  const multiple = mode === 'multiple';
  const singleCandidate = candidates[0];

  return (
    <View style={styles.root} onTouchStart={onActivity}>
      <NavBar title="계좌번호 확인" onBack={onBack} />
      <ScrollView style={styles.flex1} contentContainerStyle={styles.body}>
        <AppText size={28} weight={900} color={INK} lineHeight={36} style={styles.title}>
          {multiple ? '계좌번호를 여러 개\n찾았어요' : '사진에서 계좌번호를\n찾았어요'}
        </AppText>
        <AppText size={16} color="#777" lineHeight={24} style={styles.guide}>
          {multiple ? '보내려는 계좌번호를 선택해주세요.' : '이 계좌번호가 맞나요?'}
        </AppText>

        {multiple ? (
          <PulseHighlight active={helpTarget === 'ocrList'} borderRadius={16}>
            <View style={styles.candidateList}>
              {candidates.map((candidate) => {
                const isSelected = selectedDigits === candidate.digits;
                return (
                  <Pressable
                    key={candidate.digits}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    onPress={() => setSelectedDigits(candidate.digits)}
                    style={[styles.candidateCard, isSelected && styles.candidateCardSelected]}
                  >
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected ? <View style={styles.radioDot} /> : null}
                    </View>
                    <AppText size={21} weight={900} color={INK} style={styles.flex1}>
                      {candidate.display}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </PulseHighlight>
        ) : singleCandidate ? (
          <AccountCard bank={bank} accountNumber={singleCandidate.display} />
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {!multiple ? <SecondaryButton label="다시 사진 선택" onPress={onRetry} /> : null}
        <PulseHighlight active={helpTarget === 'ocrConfirm'} borderRadius={16}>
          <PrimaryButton
            label={multiple ? '이 계좌번호 사용하기' : '네, 맞아요'}
            disabled={multiple && !selected}
            onPress={() => {
              const candidate = multiple ? selected : singleCandidate;
              if (candidate) onConfirm(candidate);
            }}
          />
        </PulseHighlight>
      </View>
    </View>
  );
}

function AccountCard({ bank, accountNumber }: { bank: string; accountNumber: string }) {
  const bankInfo = bankOf(bank);
  return (
    <View style={styles.accountCard}>
      <View style={styles.bankRow}>
        <View style={[styles.bankChip, { backgroundColor: bankInfo.bg }]}>
          <AppText size={14} weight={900} color={bankInfo.fg}>
            {bankInfo.short}
          </AppText>
        </View>
        <AppText size={18} weight={900} color={INK}>
          {bankInfo.name}
        </AppText>
      </View>
      <View style={styles.divider} />
      <AppText size={26} weight={900} color={INK} letterSpacing={0.5}>
        {accountNumber}
      </AppText>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled && styles.buttonDisabled]}
    >
      <AppText size={17} weight={900} color={disabled ? '#AAA' : INK}>
        {label}
      </AppText>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.secondaryButton}>
      <AppText size={16} weight={800} color="#555">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  flex1: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24 },
  title: { marginBottom: 10 },
  guide: { marginBottom: 26 },
  processing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 30,
  },
  failureBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 30,
  },
  accountCard: {
    padding: 22,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: BORDER,
    backgroundColor: CREAM,
  },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bankChip: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, marginVertical: 18, backgroundColor: '#E9DFC1' },
  candidateList: { gap: 12 },
  candidateCard: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: '#E2E2E2',
    backgroundColor: '#fff',
  },
  candidateCardSelected: {
    borderWidth: 2.5,
    borderColor: YELLOW,
    backgroundColor: CREAM,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#BBB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: INK },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: YELLOW },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, gap: 10 },
  primaryButton: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: YELLOW,
  },
  secondaryButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  buttonDisabled: { backgroundColor: '#F0F0F0' },
});
