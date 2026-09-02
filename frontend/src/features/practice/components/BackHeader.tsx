import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';

/** danbi_jj practice/components/BackHeader.tsx 이식 (chrome.css .page-header). */
export function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="뒤로 가기" onPress={onBack} style={styles.back} hitSlop={10}>
        <AppText size={34} weight={400} color="#201e19" lineHeight={34}>
          ‹
        </AppText>
      </Pressable>
      <AppText size={21} weight={800} color={P.ink} align="center" style={styles.flex1} numberOfLines={1}>
        {title}
      </AppText>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.line,
    backgroundColor: 'rgba(255,254,249,0.97)',
  },
  back: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  flex1: { flex: 1 },
  spacer: { width: 50 },
});
