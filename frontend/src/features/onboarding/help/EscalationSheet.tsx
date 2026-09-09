import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Sheet } from '@/components/ui/Sheet';
import { colors } from '@/theme/tokens';

interface EscalationSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

/** danbi_jj onboarding/help/EscalationSheet.tsx 이식 (onboarding-help.css .escalation-*). */
export function EscalationSheet({ visible, onDismiss }: EscalationSheetProps) {
  return (
    <Sheet visible={visible} onClose={onDismiss} title="도움이 필요하신가요?" a11yLabel="도움이 필요하신가요?">
      <AppText size={19} lineHeight={28} color="#5d584f" style={styles.body}>
        계속 어려우시면 상담원이나 영업점에서 도와드릴 수 있어요.
      </AppText>

      <View style={styles.options}>
        <Pressable
          accessibilityRole="button"
          onPress={() => Linking.openURL('tel:15889999')}
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
        >
          <View style={styles.optionIcon}>
            <AppText size={14} weight={700} color="#555" align="center">
              전화
            </AppText>
          </View>
          <View style={styles.optionInfo}>
            <AppText size={18} weight={700} color="#1a1a1a">
              전화 상담받기
            </AppText>
            <AppText size={16} color="#888">
              1588-9999 · 평일 오전 9시 ~ 오후 6시
            </AppText>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onDismiss();
            Alert.alert(
              '',
              '가까운 영업점은 국민은행 홈페이지나 콜센터(1588-9999)에서 안내받을 수 있어요.',
            );
          }}
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
        >
          <View style={styles.optionIcon}>
            <AppText size={14} weight={700} color="#555" align="center">
              영업점
            </AppText>
          </View>
          <View style={styles.optionInfo}>
            <AppText size={18} weight={700} color="#1a1a1a">
              영업점에서 도움받기
            </AppText>
            <AppText size={16} color="#888">
              신분증 지참 필수 · 방문 전 영업 시간을 확인해주세요
            </AppText>
          </View>
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" onPress={onDismiss} style={styles.quiet}>
        <AppText size={18} weight={700} color="#4e4a43" style={styles.quietText}>
          계속 해볼게요
        </AppText>
      </Pressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: {
    marginTop: 12,
    marginBottom: 16,
  },
  options: {
    gap: 10,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  optionPressed: {
    backgroundColor: '#f8f8f8',
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
    gap: 2,
  },
  quiet: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  quietText: {
    textDecorationLine: 'underline',
  },
});
