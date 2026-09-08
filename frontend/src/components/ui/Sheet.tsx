import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/tokens';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** 접근성 라벨. 없으면 title 사용. */
  a11yLabel?: string;
  /** true면 화면 대부분을 쓰고, 자식이 그 안에서 스크롤된다. */
  tall?: boolean;
  children: ReactNode;
};

/**
 * danbi_jj onboarding.css .onboarding-sheet-backdrop / .onboarding-sheet 대응.
 * 하단에서 올라오는 바텀시트 + 반투명 백드롭(탭하면 닫힘).
 *
 * 시트 본문은 Pressable이 아니라 View다. Pressable이 제스처를 가로채면
 * 안의 ScrollView가 스크롤되지 않는다.
 */
export function Sheet({ visible, onClose, title, a11yLabel, tall, children }: SheetProps) {
  const { height } = useWindowDimensions();
  const sheetMax = height * 0.88;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        />
        <View
          style={[styles.sheet, { maxHeight: sheetMax }, tall ? { height: sheetMax } : null]}
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
        </View>
      </View>
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
    flexDirection: 'column',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: colors.paper,
    overflow: 'hidden',
  },
  handle: {
    width: 48,
    height: 5,
    alignSelf: 'center',
    marginBottom: 18,
    borderRadius: 99,
    backgroundColor: '#c8c3b9',
    flexShrink: 0,
  },
  title: {
    marginBottom: 4,
    flexShrink: 0,
  },
});
