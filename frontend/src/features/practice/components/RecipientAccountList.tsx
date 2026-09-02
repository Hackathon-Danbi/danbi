import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';
import type { RecipientChoice, SavedRecipient, SavedRecipientId } from '../types';
import { formatAccountNumber } from '../utils';

/** danbi_jj practice/components/RecipientAccountList.tsx 이식. */
export function RecipientAccountList({
  recipients,
  selectedChoice,
  onSelectRecipient,
  onSelectNewRecipient,
  accountBadge,
}: {
  ariaLabel?: string;
  recipients: readonly SavedRecipient[];
  selectedChoice: RecipientChoice;
  onSelectRecipient: (recipient: SavedRecipient) => void;
  onSelectNewRecipient: () => void;
  accountBadge?: string;
  guidedTargetId?: SavedRecipientId;
  guidedTargetAttention?: boolean;
}) {
  return (
    <View style={styles.list}>
      {recipients.map((recipient) => {
        const selected = selectedChoice === recipient.id;
        return (
          <Pressable
            key={recipient.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelectRecipient(recipient)}
            style={[styles.card, selected && styles.cardSelected]}
          >
            <View style={styles.mark}>
              <AppText size={16} weight={900} color={P.accentText}>
                {recipient.initials}
              </AppText>
            </View>
            <View style={styles.flex1}>
              <AppText size={17} weight={900} color={P.ink}>
                {recipient.name}
              </AppText>
              <AppText size={13} color={P.muted}>
                {recipient.bank} · {formatAccountNumber(recipient.account)}
              </AppText>
              {accountBadge ? (
                <AppText size={12} weight={700} color={P.accentText} style={styles.badge}>
                  {accountBadge}
                </AppText>
              ) : null}
            </View>
            <AppText size={18} weight={900} color={selected ? P.accent : '#bbb'}>
              {selected ? '✓' : '›'}
            </AppText>
          </Pressable>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: selectedChoice === 'new' }}
        onPress={onSelectNewRecipient}
        style={[styles.card, styles.newCard, selectedChoice === 'new' && styles.cardSelected]}
      >
        <View style={[styles.mark, styles.plusMark]}>
          <AppText size={20} weight={900} color="#888">
            +
          </AppText>
        </View>
        <View style={styles.flex1}>
          <AppText size={17} weight={900} color={P.ink}>
            새로운 계좌로 보내기
          </AppText>
          <AppText size={13} color={P.muted}>
            계좌번호를 직접 입력해요
          </AppText>
        </View>
        <AppText size={18} weight={900} color={selectedChoice === 'new' ? P.accent : '#bbb'}>
          {selectedChoice === 'new' ? '✓' : '›'}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  flex1: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: '#fff',
  },
  cardSelected: { borderColor: P.accent, backgroundColor: P.accentSurface },
  newCard: { borderStyle: 'dashed', borderColor: '#CCC' },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: P.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusMark: { backgroundColor: '#F0F0F0' },
  badge: { marginTop: 4 },
});
