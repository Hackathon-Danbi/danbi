import { Redirect } from 'expo-router';

/**
 * 시연용: 앱을 켤 때마다 웰컴부터 보여 준다.
 */
export default function Index() {
  return <Redirect href="/welcome" />;
}
