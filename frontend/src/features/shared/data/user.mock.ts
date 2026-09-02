/**
 * 현재 프로토타입에서 로그인한 사용자(목데이터).
 * TODO: 실제 인증 연동 시 이 값을 로그인 세션/유저 API 결과로 교체한다.
 */

export interface User {
  name: string;
}

export const currentUser: User = {
  name: '박옥순',
};
