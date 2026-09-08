import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BORDER, CREAM, INK } from '../theme';
import { IconBell } from './icons';

/** danbi_jj main/components.tsx <HomeHeader> 이식. */
export function HomeHeader({
  onHistory,
  needCheckCount,
  unknownCount = 0,
}: {
  onHistory: () => void;
  needCheckCount: number;
  unknownCount?: number;
}) {
  const alertCount = unknownCount || needCheckCount;
  const alertLabel = unknownCount > 0 ? `신고 확인 ${unknownCount}건 ›` : `확인할 거래 ${needCheckCount}건 ›`;

  return (
    <View style={styles.row}>
      <AppText size={16} weight={800} color={INK}>
        안녕하세요, 박옥순님
      </AppText>
      <View style={styles.right}>
        {alertCount > 0 ? (
          <Pressable accessibilityRole="button" onPress={onHistory} style={styles.alert}>
            <IconBell size={15} />
            <AppText size={12} weight={700} color={INK}>
              {alertLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: CREAM,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 8,
    paddingRight: 10,
  },
});
