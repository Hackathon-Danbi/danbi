import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';

/** danbi_jj practice/components/PracticeMistakeFeedback.tsx 이식. */
export function PracticeMistakeFeedback({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={styles.row} accessibilityLiveRegion="assertive">
      <View style={styles.mark}>
        <AppText size={13} weight={900} color="#fff">
          !
        </AppText>
      </View>
      <AppText size={15} weight={800} color="#a7372b" lineHeight={22} style={styles.flex1}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#fff0ed',
  },
  mark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#d9534f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: { flex: 1 },
});
