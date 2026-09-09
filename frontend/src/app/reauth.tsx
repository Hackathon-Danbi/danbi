import { Redirect } from 'expo-router';

/** 재인증 화면은 쓰지 않는다. */
export default function ReauthRoute() {
  return <Redirect href="/welcome" />;
}
