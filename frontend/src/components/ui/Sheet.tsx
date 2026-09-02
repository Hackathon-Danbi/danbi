import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/tokens';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** 접근성 라벨. 없으면 title 사용. */
  a11yLabel?: string;
  children: ReactNode;
};

/**
 * danbi_jj onboarding.css .onboarding-sheet-backdrop / .onboarding-sheet 대응.
 * 하단에서 올라오는 바텀시트 + 반투명 백드롭(탭하면 닫힘).
 */
export function Sheet({ visible, onClose, title, a11yLabel, children }: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.sheet}
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
          accessibilityLabel={a11yLabel ?? title}
        >
          <View style={styles.handle} />
          {title ? (
            <AppText size={24} weight={800} lineHeight={31} style={styles.title}>
              {title}
            </AppText>
          ) : null}
          {children}
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
    backgroundColor: 'rgba(31,28,23,0.38)',
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
    backgroundColor: colors.paper,
  },
  handle: {
    width: 48,
    height: 5,
    alignSelf: 'center',
    marginBottom: 18,
    borderRadius: 99,
    backgroundColor: '#c8c3b9',
  },
  title: {
    marginBottom: 4,
  },
});
