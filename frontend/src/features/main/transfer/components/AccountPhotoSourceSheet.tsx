import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Sheet } from '@/components/ui/Sheet';
import { INK } from '../../theme';
import { IconAlbum, IconCamera } from './AccountPhotoIcons';

export function AccountPhotoSourceSheet({
  visible,
  onClose,
  onCamera,
  onAlbum,
}: {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onAlbum: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title="사진을 어떻게 가져올까요?">
      <AppText size={14} color="#777" lineHeight={21} style={styles.guide}>
        계좌번호가 잘 보이는 사진이나 저장한 스크린샷을 선택해주세요.
      </AppText>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onCamera} style={styles.option}>
          <View style={styles.iconWrap}>
            <IconCamera />
          </View>
          <AppText size={18} weight={900} color={INK}>
            사진 촬영하기
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onAlbum} style={styles.option}>
          <View style={styles.iconWrap}>
            <IconAlbum />
          </View>
          <AppText size={18} weight={900} color={INK}>
            앨범에서 가져오기
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancel}>
          <AppText size={16} weight={800} color="#666">
            취소
          </AppText>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  guide: { marginTop: 4, marginBottom: 18 },
  actions: { gap: 10 },
  option: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: '#E5E1D6',
    backgroundColor: '#fff',
  },
  iconWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFF7D5',
  },
  cancel: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F1F1F1',
  },
});
