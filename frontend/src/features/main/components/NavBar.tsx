import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { INK } from '../theme';

/** danbi_jj main/components.tsx <NavBar> 이식. */
export function NavBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="이전"
        onPress={onBack}
        style={styles.back}
        hitSlop={10}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Polyline
            points="15 18 9 12 15 6"
            stroke={INK}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
      <AppText size={17} weight={900} color={INK}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  back: {
    position: 'absolute',
    left: 16,
    padding: 6,
  },
});
