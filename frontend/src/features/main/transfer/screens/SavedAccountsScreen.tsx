import { useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { BANKS, bankOf } from '../../data';
import {
  filterUnsavedRecentRecipients,
  recipientDisplayName,
  type SaveRecipientInput,
} from '../../savedRecipients';
import type { RecentRecipientCandidate, SavedRecipient } from '../../types';
import { BORDER, CREAM, INK, YELLOW } from '../../theme';
import { NavBar } from '../../components/NavBar';

type Editor =
  | { mode: 'new' }
  | { mode: 'nickname'; recipient: SavedRecipient }
  | null;

export function SavedAccountsScreen({
  recipients,
  recentCandidates,
  onBack,
  onSave,
  onNicknameChange,
}: {
  recipients: SavedRecipient[];
  recentCandidates: RecentRecipientCandidate[];
  onBack: () => void;
  onSave: (input: SaveRecipientInput) => void;
  onNicknameChange: (savedRecipientId: number, nickname: string) => void;
}) {
  const [editor, setEditor] = useState<Editor>(null);
  const [notice, setNotice] = useState('');
  const recommendations = useMemo(
    () => filterUnsavedRecentRecipients(recipients, recentCandidates),
    [recentCandidates, recipients],
  );

  const saveRecommendation = (candidate: RecentRecipientCandidate) => {
    onSave({
      recipientBankCode: candidate.recipientBankCode,
      recipientBankName: candidate.recipientBankName,
      recipientAccountNumber: candidate.recipientAccountNumber,
      recipientName: candidate.recipientName,
      nickname: null,
    });
    setNotice(`${candidate.recipientName}님의 계좌를 저장했어요.`);
  };

  return (
    <View style={styles.root}>
      <NavBar title="저장된 계좌" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.intro}>
          <AppText size={28} weight={900} color={INK} lineHeight={36}>
            {'자주 보내는 계좌를\n모아두세요'}
          </AppText>
          <AppText size={14} color="#777" lineHeight={21}>
            별칭으로 쉽게 찾고, 음성 송금에도 사용할 수 있어요.
          </AppText>
        </View>

        {notice ? (
          <View style={styles.notice}>
            <AppText size={14} weight={800} color="#36643E">{notice}</AppText>
          </View>
        ) : null}

        <View style={styles.sectionHead}>
          <AppText size={18} weight={900} color={INK}>저장된 계좌</AppText>
          <AppText size={13} weight={700} color="#888">{recipients.length}개</AppText>
        </View>

        <View style={styles.list}>
          {recipients.map((recipient) => {
            const bank = bankOf(recipient.recipientBankName);
            const displayName = recipientDisplayName(recipient);
            return (
              <View key={recipient.savedRecipientId} style={styles.accountCard}>
                <View style={[styles.avatar, { backgroundColor: bank.bg }]}>
                  <AppText size={18} weight={900} color={bank.fg}>
                    {displayName.slice(0, 1)}
                  </AppText>
                </View>
                <View style={styles.flex1}>
                  <AppText size={17} weight={900} color={INK}>{displayName}</AppText>
                  {recipient.nickname ? (
                    <AppText size={12} color="#999" style={styles.mt3}>
                      받는 분 {recipient.recipientName}
                    </AppText>
                  ) : null}
                  <AppText size={13} color="#777" style={styles.mt3}>
                    {recipient.recipientBankName} · {recipient.recipientAccountNumber}
                  </AppText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${displayName} 별칭 변경`}
                  onPress={() => {
                    setNotice('');
                    setEditor({ mode: 'nickname', recipient });
                  }}
                  style={styles.editButton}
                >
                  <AppText size={13} weight={800} color="#666">별칭 변경</AppText>
                </Pressable>
              </View>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setNotice('');
            setEditor({ mode: 'new' });
          }}
          style={styles.addButton}
        >
          <View style={styles.plusCircle}><AppText size={22} weight={900} color={INK}>+</AppText></View>
          <View style={styles.flex1}>
            <AppText size={16} weight={900} color={INK}>계좌번호 직접 저장</AppText>
            <AppText size={13} color="#777" style={styles.mt3}>은행과 계좌번호를 입력해요</AppText>
          </View>
        </Pressable>

        {recommendations.length > 0 ? (
          <View style={styles.recommendSection}>
            <AppText size={18} weight={900} color={INK}>최근 자주 보낸 계좌</AppText>
            <AppText size={13} color="#777" lineHeight={20} style={styles.mt5}>
              최근 송금 횟수가 많은 계좌예요. 필요한 계좌만 저장하세요.
            </AppText>
            <View style={[styles.list, styles.mt12]}>
              {recommendations.map((candidate) => {
                const bank = bankOf(candidate.recipientBankName);
                return (
                  <View
                    key={`${candidate.recipientBankCode}-${candidate.recipientAccountNumber}`}
                    style={styles.recommendCard}
                  >
                    <View style={[styles.avatar, { backgroundColor: bank.bg }]}>
                      <AppText size={18} weight={900} color={bank.fg}>
                        {candidate.recipientName.slice(0, 1)}
                      </AppText>
                    </View>
                    <View style={styles.flex1}>
                      <AppText size={16} weight={900} color={INK}>{candidate.recipientName}</AppText>
                      <AppText size={13} color="#777" style={styles.mt3}>
                        {candidate.recipientBankName} · {candidate.recipientAccountNumber}
                      </AppText>
                      <AppText size={12} weight={700} color="#947000" style={styles.mt5}>
                        최근 {candidate.recentTransferCount}회 · 마지막 {candidate.lastTransferredAt}
                      </AppText>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${candidate.recipientName} 계좌 저장`}
                      onPress={() => saveRecommendation(candidate)}
                      style={styles.saveButton}
                    >
                      <AppText size={14} weight={900} color={INK}>저장</AppText>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
        <View style={styles.spacer} />
      </ScrollView>

      <AccountEditorModal
        editor={editor}
        onClose={() => setEditor(null)}
        onSave={(input) => {
          onSave(input);
          setEditor(null);
          setNotice('새 계좌를 저장했어요.');
        }}
        onNicknameSave={(recipient, nickname) => {
          onNicknameChange(recipient.savedRecipientId, nickname);
          setEditor(null);
          setNotice(nickname.trim() ? '별칭을 바꿨어요.' : '별칭을 삭제했어요.');
        }}
      />
    </View>
  );
}

function AccountEditorModal({
  editor,
  onClose,
  onSave,
  onNicknameSave,
}: {
  editor: Editor;
  onClose: () => void;
  onSave: (input: SaveRecipientInput) => void;
  onNicknameSave: (recipient: SavedRecipient, nickname: string) => void;
}) {
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const selectedBank = BANKS.find((bank) => bank.bankCode === bankCode);
  const accountDigits = accountNumber.replace(/\D/g, '');
  const isNew = editor?.mode === 'new';
  const ready = isNew ? !!selectedBank && accountDigits.length >= 8 : true;

  const close = () => {
    setBankCode('');
    setAccountNumber('');
    setNickname('');
    onClose();
  };

  const save = () => {
    if (!editor || !ready) return;
    if (editor.mode === 'nickname') {
      onNicknameSave(editor.recipient, nickname);
    } else if (selectedBank) {
      const cleanNickname = nickname.trim();
      onSave({
        recipientBankCode: selectedBank.bankCode,
        recipientBankName: selectedBank.name,
        recipientAccountNumber: accountDigits,
        recipientName: cleanNickname || `${selectedBank.name} 계좌 ${accountDigits.slice(-4)}`,
        nickname: cleanNickname || null,
      });
    }
    setBankCode('');
    setAccountNumber('');
    setNickname('');
  };

  return (
    <Modal
      visible={!!editor}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={close}
      onShow={() => setNickname(editor?.mode === 'nickname' ? editor.recipient.nickname ?? '' : '')}
    >
      <SafeAreaView style={styles.editorRoot} edges={['top', 'bottom']}>
        <NavBar
          title={editor?.mode === 'nickname' ? '별칭 설정' : '계좌 저장'}
          onBack={close}
        />
        <ScrollView contentContainerStyle={styles.editorBody} keyboardShouldPersistTaps="handled">
          {editor?.mode === 'new' ? (
            <>
              <AppText size={15} weight={800} color={INK}>은행 선택</AppText>
              <View style={styles.bankGrid}>
                {BANKS.map((bank) => (
                  <Pressable
                    key={bank.bankCode}
                    accessibilityRole="button"
                    onPress={() => setBankCode(bank.bankCode)}
                    style={[styles.bankButton, bankCode === bank.bankCode && styles.bankButtonSelected]}
                  >
                    <AppText size={14} weight={800} color={INK}>{bank.name}</AppText>
                  </Pressable>
                ))}
              </View>
              <FieldLabel>계좌번호</FieldLabel>
              <TextInput
                accessibilityLabel="저장할 계좌번호"
                value={accountNumber}
                onChangeText={(value) => setAccountNumber(value.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="숫자만 입력"
                placeholderTextColor="#AAA"
                maxLength={16}
                style={styles.input}
              />
            </>
          ) : null}

          <FieldLabel>별칭 {isNew ? '(선택)' : ''}</FieldLabel>
          <TextInput
            accessibilityLabel="계좌 별칭"
            value={nickname}
            onChangeText={setNickname}
            placeholder="예: 엄마, 관리비"
            placeholderTextColor="#AAA"
            maxLength={12}
            autoFocus={editor?.mode === 'nickname'}
            style={styles.input}
          />
          {editor?.mode === 'nickname' ? (
            <AppText size={13} color="#777" lineHeight={20}>
              비워서 저장하면 기존 별칭이 삭제돼요.
            </AppText>
          ) : null}
        </ScrollView>
        <View style={styles.editorFooter}>
          <Pressable
            accessibilityRole="button"
            disabled={!ready}
            onPress={save}
            style={[styles.primaryButton, !ready && styles.primaryButtonDisabled]}
          >
            <AppText size={17} weight={900} color={ready ? INK : '#999'}>저장하기</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <AppText size={15} weight={800} color={INK} style={styles.fieldLabel}>{children}</AppText>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  flex1: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  intro: { gap: 8, marginBottom: 22 },
  notice: { padding: 13, borderRadius: 13, backgroundColor: '#EFF9F1', marginBottom: 18 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  list: { gap: 10 },
  accountCard: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  recommendCard: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: CREAM,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  editButton: { paddingVertical: 9, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#F3F3F3' },
  saveButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 11, backgroundColor: YELLOW },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    marginTop: 12,
    borderWidth: 1.8,
    borderStyle: 'dashed',
    borderColor: '#C9C9C9',
    borderRadius: 16,
  },
  plusCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: YELLOW },
  recommendSection: { marginTop: 30 },
  spacer: { height: 32 },
  mt3: { marginTop: 3 },
  mt5: { marginTop: 5 },
  mt12: { marginTop: 12 },
  editorRoot: { flex: 1, backgroundColor: '#fff' },
  editorBody: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28 },
  bankGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 10, marginBottom: 24 },
  bankButton: {
    width: '47%',
    flexGrow: 1,
    paddingVertical: 15,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E4E4E4',
    borderRadius: 12,
  },
  bankButtonSelected: { borderWidth: 2, borderColor: YELLOW, backgroundColor: '#FFFBEA' },
  fieldLabel: { marginBottom: 9 },
  input: {
    minHeight: 58,
    paddingHorizontal: 16,
    marginBottom: 22,
    borderWidth: 1.8,
    borderColor: '#DADADA',
    borderRadius: 14,
    fontSize: 17,
    color: INK,
    backgroundColor: '#fff',
  },
  editorFooter: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  primaryButton: { minHeight: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: YELLOW },
  primaryButtonDisabled: { backgroundColor: '#ECECEC' },
});
