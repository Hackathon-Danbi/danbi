import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BACK_BUTTON_SLOT, BackButton } from '@/components/ui/BackButton';
import { INK } from '../theme';

/** danbi_jj main/components.tsx <NavBar> 이식. */
export function NavBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.bar}>
      <BackButton onPress={onBack} color={INK} />
      <AppText size={18} weight={900} color={INK} align="center" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: { flex: 1 },
  side: { minWidth: BACK_BUTTON_SLOT },
});
