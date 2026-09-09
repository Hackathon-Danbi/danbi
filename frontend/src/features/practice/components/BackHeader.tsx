import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BACK_BUTTON_SLOT, BackButton } from '@/components/ui/BackButton';
import { P } from '../theme';

/** danbi_jj practice/components/BackHeader.tsx 이식 (chrome.css .page-header). */
export function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} />
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
    minHeight: 72,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: P.line,
    backgroundColor: 'rgba(255,254,249,0.97)',
  },
  flex1: { flex: 1 },
  spacer: { minWidth: BACK_BUTTON_SLOT },
});
