import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { YELLOW } from '../theme';

/** danbi_jj main/components.tsx <WarningBar> 이식. */
export function WarningBar({ text }: { text: string }) {
  return (
    <View style={styles.bar}>
      <AppText size={18}>⚠️</AppText>
      <AppText size={14} weight={600} lineHeight={21} color="#7A6000" style={styles.text}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF8D0',
    borderWidth: 1.5,
    borderColor: YELLOW,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  text: {
    flex: 1,
  },
});
