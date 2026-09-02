import { useCallback, useEffect, useRef, useState } from 'react';

import { recognitionEngine } from '@/lib/speech/recognition';

export type SpeechRecognitionStatus = 'idle' | 'listening' | 'recognized' | 'error';

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
  onError?: (message: string) => void;
  /** 연습 모드 전용: 엔진 미지원/인식 실패 시 이 문장으로 진행할 수 있다. */
  fallbackTranscript?: string;
}

/**
 * danbi_jj practice/hooks/useSpeechRecognition.ts 이식.
 * 브라우저 SpeechRecognition 을 lib/speech/recognition 엔진 레이어로 대체.
 * - 웹: 실제 Web Speech API
 * - 네이티브: expo-speech-recognition으로 실제 인식, 실패 시 연습 모드만 예시 문장 사용
 */
export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const sessionRef = useRef<{ start: () => void; abort: () => void } | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef('');
  const handledRef = useRef(false);

  const onResultRef = useRef(options.onResult);
  const onErrorRef = useRef(options.onError);
  const fallbackRef = useRef(options.fallbackTranscript);
  useEffect(() => {
    onResultRef.current = options.onResult;
    onErrorRef.current = options.onError;
    fallbackRef.current = options.fallbackTranscript;
  }, [options.fallbackTranscript, options.onError, options.onResult]);

  const fail = useCallback((message: string) => {
    handledRef.current = true;
    setError(message);
    setStatus('error');
    onErrorRef.current?.(message);
  }, []);

  const stop = useCallback(() => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = null;
    sessionRef.current?.abort();
    sessionRef.current = null;
  }, []);

  const finish = useCallback((heard: string) => {
    const normalized = heard.trim();
    if (!normalized || handledRef.current) return;
    handledRef.current = true;
    latestRef.current = normalized;
    setTranscript(normalized);
    setStatus('recognized');
    onResultRef.current?.(normalized);
  }, []);

  const reset = useCallback(() => {
    stop();
    handledRef.current = false;
    latestRef.current = '';
    setTranscript('');
    setError('');
    setStatus('idle');
  }, [stop]);

  const start = useCallback(() => {
    stop();
    handledRef.current = false;
    latestRef.current = '';
    setTranscript('');
    setError('');
    setStatus('listening');

    const startFallback = () => {
      const fb = fallbackRef.current;
      if (fb) {
        fallbackTimerRef.current = setTimeout(() => finish(fb), 1200);
      } else {
        fail('이 기기에서는 음성 인식을 사용할 수 없어요. 예시 문장을 누르거나 다시 시도해주세요.');
      }
    };

    if (!recognitionEngine.supported) {
      startFallback();
      return;
    }

    const session = recognitionEngine.create({
      lang: 'ko-KR',
      onPartial: (t) => {
        latestRef.current = t;
        setTranscript(t);
      },
      onFinal: (t) => finish(t),
      onError: (kind) => {
        if (handledRef.current) return;
        if (kind === 'permission') {
          fail('마이크 사용 권한을 확인한 뒤 다시 말해주세요.');
        } else if (fallbackRef.current) {
          // 연습 모드: 인식 실패해도 예시 문장으로 진행할 수 있게 한다.
          startFallback();
        } else {
          fail('잘 듣지 못했어요. 다시 한번 말씀해주세요.');
        }
      },
      onEnd: () => {
        if (handledRef.current) return;
        if (latestRef.current) finish(latestRef.current);
        else if (fallbackRef.current) startFallback();
        else fail('잘 듣지 못했어요. 다시 한번 말씀해주세요.');
      },
    });

    if (!session) {
      startFallback();
      return;
    }
    sessionRef.current = session;
    session.start();
  }, [fail, finish, stop]);

  useEffect(() => stop, [stop]);

  return { status, transcript, error, start, stop, reset, finish };
}
