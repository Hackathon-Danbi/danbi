import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { formatWon, type Account } from '@/features/shared/data';

const YELLOW = '#FFC400';
const INK = '#111111';
const SELECTED_BG = '#FFFBEA';
const UNSELECTED_BORDER = '#E5E5E5';
const CHECK_GOLD = '#C98A00';

/** 만원 단위로 잘라 읽어주는 스크린리더용 문구. 2_450_000 → "245만원". */
function spokenWon(value: number): string {
  const man = Math.round(value / 10_000);
  return `${man.toLocaleString('en-US')}만원`;
}

/**
 * "통장 바꾸기"를 누르면 화면 하단에서 올라오는 큰 선택창.
 * 작은 드롭다운/팝오버 대신, 통장마다 카드 하나를 통째로 누르게 한다.
 */
export function AccountPickerSheet({
  visible,
  accounts,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  accounts: Account[];
  selectedId: number;
  onSelect: (account: Account) => void;
  onClose: () => void;
}) {
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { maxHeight: height * 0.72 }]}
          onPress={(event) => event.stopPropagation()}
          accessibilityViewIsModal
          accessibilityLabel="통장 선택"
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <AppText size={23} weight={900} color={INK} lineHeight={31} style={styles.title}>
              {'어떤 통장을\n사용할까요?'}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              onPress={onClose}
              style={styles.closeBtn}
            >
              <AppText size={20} weight={900} color="#555">
                ✕
              </AppText>
            </Pressable>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {accounts.map((account) => {
              const isSelected = account.accountId === selectedId;
              return (
                <Pressable
                  key={account.accountId}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={
                    `${account.accountName}, 잔액 ${spokenWon(account.balance)}` +
                    (isSelected ? ', 현재 선택된 통장' : '')
                  }
                  onPress={() => onSelect(account)}
                  style={[
                    styles.accountCard,
                    isSelected ? styles.accountCardSelected : styles.accountCardPlain,
                  ]}
                >
                  <View style={styles.accountMain}>
                    <View style={styles.accountText}>
                      <AppText size={20} weight={900} color={INK} style={styles.accountName}>
                        {account.accountName}
                      </AppText>
                      <AppText size={16} weight={600} color="#555" style={styles.accountNumber}>
                        {account.maskedAccountNumber}
                      </AppText>
                      <AppText size={24} weight={900} color={INK}>
                        {formatWon(account.balance)}
                      </AppText>
                    </View>
                    {isSelected ? (
                      <View style={styles.checkCircle}>
                        <AppText size={18} weight={900} color="#FFFFFF">
                          ✓
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: 'rgba(31,28,23,0.42)',
  },
  sheet: {
    width: '100%',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: '#FFFEF9',
  },
  handle: {
    width: 48,
    height: 5,
    alignSelf: 'center',
    marginBottom: 14,
    borderRadius: 99,
    backgroundColor: '#C8C3B9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { flex: 1, paddingRight: 12 },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { flexGrow: 0 },
  listContent: { paddingBottom: 4 },
  accountCard: {
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    minHeight: 96,
    justifyContent: 'center',
  },
  accountCardPlain: {
    borderColor: UNSELECTED_BORDER,
    backgroundColor: '#FFFFFF',
  },
  accountCardSelected: {
    borderColor: YELLOW,
    backgroundColor: SELECTED_BG,
  },
  accountMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  accountText: { flex: 1 },
  accountName: { marginBottom: 4 },
  accountNumber: { marginBottom: 8 },
  checkCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: CHECK_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
