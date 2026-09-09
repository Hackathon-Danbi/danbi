import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { Platform } from 'react-native';

import type { RecordedAudio } from '@/api/contracts';
import { recognitionEngine } from './recognition';

export type SpeechRecognitionStatus = 'idle' | 'listening' | 'recognized' | 'error';
export type SpeechRecognitionResultSource = 'recognition' | 'api' | 'fallback';

export interface SpeechRecognitionResultMeta {
  source: SpeechRecognitionResultSource;
}

export const SPEECH_RECOGNITION_TIMEOUT_MS = 8_000;

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string, meta: SpeechRecognitionResultMeta) => void;
  onError?: (message: string) => void;
  /** 연습 모드 전용: 엔진 미지원/인식 실패 시 이 문장으로 진행할 수 있다. */
  fallbackTranscript?: string;
  /** 서버 STT를 사용할 때 녹음 파일을 받아 인식 문장을 반환한다. */
  serverTranscribe?: (audio: RecordedAudio) => Promise<string>;
}

/**
 * 브라우저/네이티브별 STT 엔진을 공통 React 상태로 노출한다.
 * - 웹: 실제 Web Speech API
 * - 네이티브: expo-speech-recognition
 * - fallbackTranscript는 연습 화면에서만 선택적으로 사용한다.
 */
export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [resultSource, setResultSource] = useState<SpeechRecognitionResultSource | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const sessionRef = useRef<{ start: () => void; abort: () => void } | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listeningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef('');
  const handledRef = useRef(false);
  const serverRecordingRef = useRef(false);
  const submittingRef = useRef(false);
  const attemptRef = useRef(0);
  const recorderStopPromiseRef = useRef<Promise<void>>(Promise.resolve());

  const onResultRef = useRef(options.onResult);
  const onErrorRef = useRef(options.onError);
  const fallbackRef = useRef(options.fallbackTranscript);
  const serverTranscribeRef = useRef(options.serverTranscribe);
  useEffect(() => {
    onResultRef.current = options.onResult;
    onErrorRef.current = options.onError;
    fallbackRef.current = options.fallbackTranscript;
    serverTranscribeRef.current = options.serverTranscribe;
  }, [options.fallbackTranscript, options.onError, options.onResult, options.serverTranscribe]);

  const fail = useCallback((message: string) => {
    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current);
    listeningTimerRef.current = null;
    handledRef.current = true;
    setResultSource(null);
    setError(message);
    setStatus('error');
    onErrorRef.current?.(message);
  }, []);

  const stop = useCallback(() => {
    attemptRef.current += 1;
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current);
    fallbackTimerRef.current = null;
    listeningTimerRef.current = null;
    sessionRef.current?.abort();
    sessionRef.current = null;
    if (serverRecordingRef.current || recorder.isRecording) {
      serverRecordingRef.current = false;
      setIsRecording(false);
      recorderStopPromiseRef.current = recorder.stop().catch(() => undefined);
    }
  }, [recorder]);

  const finish = useCallback((heard: string, source: SpeechRecognitionResultSource = 'recognition') => {
    const normalized = heard.trim();
    if (!normalized || handledRef.current) return;
    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current);
    listeningTimerRef.current = null;
    handledRef.current = true;
    latestRef.current = normalized;
    setTranscript(normalized);
    setResultSource(source);
    setStatus('recognized');
    onResultRef.current?.(normalized, { source });
  }, []);

  const reset = useCallback(() => {
    stop();
    handledRef.current = false;
    latestRef.current = '';
    setTranscript('');
    setError('');
    setResultSource(null);
    setStatus('idle');
  }, [stop]);

  const submit = useCallback(async () => {
    if (!serverRecordingRef.current || submittingRef.current || handledRef.current) return;
    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current);
    listeningTimerRef.current = null;
    const attempt = attemptRef.current;
    serverRecordingRef.current = false;
    setIsRecording(false);
    submittingRef.current = true;

    try {
      recorderStopPromiseRef.current = recorder.stop();
      await recorderStopPromiseRef.current;
      const uri = recorder.uri;
      const transcribe = serverTranscribeRef.current;
      if (!uri || !transcribe || attempt !== attemptRef.current) return;
      const isWeb = Platform.OS === 'web';
      const heard = await transcribe({
        uri,
        name: isWeb ? 'voice-recording.webm' : 'voice-recording.m4a',
        mimeType: isWeb ? 'audio/webm' : 'audio/mp4',
      });
      if (attempt === attemptRef.current) finish(heard, 'api');
    } catch (cause) {
      if (attempt !== attemptRef.current) return;
      const message = cause instanceof Error && cause.message
        ? cause.message
        : '음성을 인식하지 못했어요. 다시 한번 말씀해주세요.';
      fail(message);
    } finally {
      submittingRef.current = false;
    }
  }, [fail, finish, recorder]);

  const start = useCallback(() => {
    stop();
    const attempt = attemptRef.current;
    handledRef.current = false;
    latestRef.current = '';
    setTranscript('');
    setError('');
    setResultSource(null);
    setStatus('listening');

    const transcribe = serverTranscribeRef.current;
    if (transcribe) {
      void (async () => {
        try {
          const permission = await requestRecordingPermissionsAsync();
          if (attempt !== attemptRef.current) return;
          if (!permission.granted) {
            fail('마이크 사용 권한을 허용한 뒤 다시 말해주세요.');
            return;
          }
          await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
          await recorderStopPromiseRef.current;
          if (attempt !== attemptRef.current) return;
          await recorder.prepareToRecordAsync();
          if (attempt !== attemptRef.current) return;
          recorder.record();
          serverRecordingRef.current = true;
          setIsRecording(true);
          listeningTimerRef.current = setTimeout(() => {
            listeningTimerRef.current = null;
            void submit();
          }, SPEECH_RECOGNITION_TIMEOUT_MS);
        } catch {
          if (attempt === attemptRef.current) {
            fail('녹음을 시작하지 못했어요. 마이크 권한을 확인해주세요.');
          }
        }
      })();
      return;
    }

    const startFallback = () => {
      if (fallbackTimerRef.current || handledRef.current) return;
      const fb = fallbackRef.current;
      if (fb) {
        fallbackTimerRef.current = setTimeout(() => {
          fallbackTimerRef.current = null;
          finish(fb, 'fallback');
        }, 1200);
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
    if (!handledRef.current && !fallbackTimerRef.current) {
      listeningTimerRef.current = setTimeout(() => {
        listeningTimerRef.current = null;
        sessionRef.current?.abort();
        sessionRef.current = null;
        if (fallbackRef.current) startFallback();
        else fail('말씀을 듣지 못했어요. 다시 천천히 말씀해주세요.');
      }, SPEECH_RECOGNITION_TIMEOUT_MS);
    }
  }, [fail, finish, recorder, stop, submit]);

  useEffect(() => stop, [stop]);

  return {
    status,
    transcript,
    error,
    resultSource,
    usedFallback: resultSource === 'fallback',
    usesServerRecognition: !!options.serverTranscribe,
    isRecording,
    start,
    stop,
    submit,
    reset,
    finish,
  };
}
