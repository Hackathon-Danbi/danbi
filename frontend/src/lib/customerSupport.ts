import { Alert, Linking } from 'react-native';

export const CUSTOMER_CENTER_NUMBER = '15889999';

/** 전화 앱이 없는 기기와 URL 열기 실패를 사용자에게 설명한다. */
export async function callCustomerCenter(): Promise<void> {
  const url = `tel:${CUSTOMER_CENTER_NUMBER}`;
  try {
    if (!(await Linking.canOpenURL(url))) {
      Alert.alert('전화를 걸 수 없어요', '고객센터 1588-9999로 직접 전화해주세요.');
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('전화 연결에 실패했어요', '고객센터 1588-9999로 직접 전화해주세요.');
  }
}
