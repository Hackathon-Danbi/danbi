import { Redirect } from 'expo-router';

/** 로그인 화면은 쓰지 않는다. */
export default function LoginRoute() {
  return <Redirect href="/welcome" />;
}
