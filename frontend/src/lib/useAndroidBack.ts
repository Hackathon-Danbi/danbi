import { useCallback, useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * Android 하드웨어 back 을 화면 내부 상태 머신이 먼저 처리하도록 가로챈다.
 *
 * @param handler 이벤트를 소비하고 내부적으로 한 단계 뒤로 갔으면 `true`,
 *                더 돌아갈 내부 단계가 없어 expo-router 기본 동작(상위 라우트)에
 *                맡겨야 하면 `false` 를 반환한다.
 *
 * - 화면이 포커스된 동안에만 구독하고, 벗어나면 자동으로 해제한다(cleanup 보장).
 * - 핸들러는 ref 로 최신값을 유지하므로 인라인 화살표 함수를 넘겨도 재구독하지 않는다.
 * - 한 라우트 안에서 여러 번 호출하면 마지막에 마운트된(=가장 안쪽) 것부터 먼저 실행된다
 *   (BackHandler 는 LIFO). 안쪽 핸들러가 false 를 반환하면 바깥 핸들러로 넘어간다.
 */
export function useAndroidBack(handler: () => boolean) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => ref.current());
      return () => sub.remove();
    }, []),
  );
}
