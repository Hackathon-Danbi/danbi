import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { bankOf } from '../../data';
import { recipientDisplayName } from '../../savedRecipients';
import type { SavedRecipient } from '../../types';
import { INK } from '../../theme';
import { FloatingHomeButton } from '../../components/FloatingHomeButton';
import { NavBar } from '../../components/NavBar';
import { IconChevronRight } from '../../components/icons';

/** danbi_jj main/screens/transfer.tsx <RecipientScreen> 이식. */
export function RecipientScreen({
  recipients,
  onBack,
  onSelectContact,
  onNewAccount,
  helpTarget,
  onActivity,
}: {
  recipients: SavedRecipient[];
  onBack: () => void;
  onSelectContact: (recipient: SavedRecipient) => void;
  onNewAccount: () => void;
  helpTarget: string;
  onActivity: () => void;
}) {
  return (
    <View style={styles.root} onTouchStart={onActivity}>
      <NavBar title="받는 사람 선택" onBack={onBack} />
      <ScrollView style={styles.flex1} contentContainerStyle={styles.body}>
        <AppText size={30} weight={900} color={INK} lineHeight={38} style={styles.mb8}>
          {'누구에게\n보낼까요?'}
        </AppText>
        <AppText size={14} color="#888" style={styles.mb28}>
          저장된 계좌를 고르거나 새 계좌를 입력하세요.
        </AppText>

        <PulseHighlight active={helpTarget === 'contactList'} borderRadius={18}>
          <View style={styles.list}>
            {recipients.map((recipient) => {
              const bank = bankOf(recipient.recipientBankName);
              const displayName = recipientDisplayName(recipient);
              return (
                <Pressable
                  key={recipient.savedRecipientId}
                  accessibilityRole="button"
                  onPress={() => onSelectContact(recipient)}
                  style={styles.item}
                >
                  <View style={[styles.avatar, { backgroundColor: bank.bg }]}>
                    <AppText size={18} weight={900} color={bank.fg}>
                      {displayName.slice(0, 1)}
                    </AppText>
                  </View>
                  <View style={styles.flex1}>
                    <AppText size={16} weight={900} color={INK} style={styles.mb3}>
                      {displayName}
                    </AppText>
                    <AppText size={13} color="#999">
                      {recipient.recipientBankName} · {recipient.recipientAccountNumber}
                    </AppText>
                  </View>
                  <IconChevronRight />
                </Pressable>
              );
            })}

            <Pressable accessibilityRole="button" onPress={onNewAccount} style={[styles.item, styles.itemNew]}>
              <View style={[styles.avatar, styles.avatarNew]}>
                <AppText size={22} weight={900} color="#888">
                  +
                </AppText>
              </View>
              <View style={styles.flex1}>
                <AppText size={16} weight={900} color={INK} style={styles.mb3}>
                  새로운 계좌에 보내기
                </AppText>
                <AppText size={13} color="#BBB">
                  계좌번호를 직접 입력해요
                </AppText>
              </View>
              <IconChevronRight />
            </Pressable>
          </View>
        </PulseHighlight>
      </ScrollView>
      <FloatingHomeButton onGoHome={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  flex1: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20 },
  mb3: { marginBottom: 3 },
  mb8: { marginBottom: 8 },
  mb28: { marginBottom: 28 },
  list: { gap: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 16,
  },
  itemNew: {
    borderWidth: 1.8,
    borderStyle: 'dashed',
    borderColor: '#CCC',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarNew: { backgroundColor: '#F0F0F0' },
});
