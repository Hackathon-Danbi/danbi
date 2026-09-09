import { useCallback, useEffect, useRef, useState } from 'react';

import { speak as ttsSpeak, stop as ttsStop } from '@/lib/speech/tts';

/**
 * danbi_jj onboarding/help/useScreenHelp.ts 이식.
 * 선제적 도움: 화면 진입/오류 시 안내 문구를 (음성 켜짐이면) 읽어주고, 다시 듣기/음소거 제공.
 * 원본의 window.speechSynthesis → lib/speech/tts.
 */
export function useScreenHelp() {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const voiceEnabledRef = useRef(true);
  const currentTextRef = useRef('');

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  // 화면(온보딩 플로우)이 사라지면 재생 중인 안내를 끊는다.
  useEffect(() => () => ttsStop(), []);

  const speak = useCallback((text: string) => {
    ttsSpeak(text);
    currentTextRef.current = text;
  }, []);

  const speakIfEnabled = useCallback(
    (text: string) => {
      currentTextRef.current = text;
      if (voiceEnabledRef.current) speak(text);
    },
    [speak],
  );

  const replay = useCallback(() => {
    if (currentTextRef.current) speak(currentTextRef.current);
  }, [speak]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (prev) ttsStop();
      return !prev;
    });
  }, []);

  return { voiceEnabled, speakIfEnabled, replay, toggleVoice };
}
