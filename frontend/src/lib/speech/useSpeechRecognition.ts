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
  /**
   * 서버 STT. 있으면 녹음 파일을 보내 인식 문장을 받는다.
   * - 기기 STT가 되는 환경: 기기 STT가 주(主), 서버 결과는 성공 시 덮어쓰는 보정.
   * - 기기 STT가 안 되는 환경: 서버 STT가 유일한 경로(‘말하기 완료’로 전송).
   * 서버가 실패/타임아웃이어도 기기 STT 결과나 fallbackTranscript로 진행한다.
   */
  serverTranscribe?: (audio: RecordedAudio) => Promise<string>;
}

/**
 * 브라우저/네이티브별 STT 엔진을 공통 React 상태로 노출한다.
 * - 웹: 실제 Web Speech API
 * - 네이티브: expo-speech-recognition
 * - serverTranscribe: 서버 STT (기기 STT의 보정 또는 대체)
 * - fallbackTranscript: 연습 화면에서만 선택적으로 사용한다.
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
  const recordingRef = useRef(false); // expo-audio 녹음이 실제로 돌고 있는지
  const serverOnlyRef = useRef(false); // 기기 STT 없이 서버 녹음만 하는 경로인지
  const submittingRef = useRef(false);
  const settlingRef = useRef(false);
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
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current);
    fallbackTimerRef.current = null;
    listeningTimerRef.current = null;
    handledRef.current = true;
    setResultSource(null);
    setError(message);
    setStatus('error');
    onErrorRef.current?.(message);
  }, []);

  const stopRecorder = useCallback(() => {
    if (!recordingRef.current && !recorder.isRecording) return;
    recordingRef.current = false;
    setIsRecording(false);
    recorderStopPromiseRef.current = recorder.stop().catch(() => undefined);
  }, [recorder]);

  const stop = useCallback(() => {
    attemptRef.current += 1;
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current);
    fallbackTimerRef.current = null;
    listeningTimerRef.current = null;
    sessionRef.current?.abort();
    sessionRef.current = null;
    serverOnlyRef.current = false;
    submittingRef.current = false;
    settlingRef.current = false;
    stopRecorder();
  }, [stopRecorder]);

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

  /** 확정된 결과를 서버 인식 문장으로 덮어쓴다(더 정확하다고 보고). 같은 시도가 유지되는 동안만. */
  const refine = useCallback((heard: string, attempt: number) => {
    const normalized = heard.trim();
    if (!normalized || attempt !== attemptRef.current || !handledRef.current) return;
    if (normalized === latestRef.current) return;
    latestRef.current = normalized;
    setTranscript(normalized);
    setResultSource('api');
    onResultRef.current?.(normalized, { source: 'api' });
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

  const beginRecording = useCallback(async (attempt: number): Promise<boolean> => {
    if (!serverTranscribeRef.current) return false;
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (attempt !== attemptRef.current || !permission.granted) return false;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorderStopPromiseRef.current;
      if (attempt !== attemptRef.current) return false;
      await recorder.prepareToRecordAsync();
      if (attempt !== attemptRef.current) return false;
      recorder.record();
      recordingRef.current = true;
      return true;
    } catch {
      recordingRef.current = false;
      return false;
    }
  }, [recorder]);

  const stopRecordingAndTranscribe = useCallback(async (attempt: number): Promise<string | null> => {
    const transcribe = serverTranscribeRef.current;
    if (!recordingRef.current || !transcribe) return null;
    recordingRef.current = false;
    setIsRecording(false);
    try {
      recorderStopPromiseRef.current = recorder.stop();
      await recorderStopPromiseRef.current;
      const uri = recorder.uri;
      if (!uri || attempt !== attemptRef.current) return null;
      const isWeb = Platform.OS === 'web';
      const heard = await transcribe({
        uri,
        name: isWeb ? 'voice-recording.webm' : 'voice-recording.m4a',
        mimeType: isWeb ? 'audio/webm' : 'audio/mp4',
      });
      return heard.trim() || null;
    } catch {
      return null;
    }
  }, [recorder]);

  /** 기기 STT(또는 타임아웃) 결과가 나왔을 때: 병행 녹음이 있으면 서버로 확정/보정한다. */
  const settleWithDevice = useCallback(async (deviceText: string, attempt: number) => {
    if (attempt !== attemptRef.current || handledRef.current || settlingRef.current) return;
    settlingRef.current = true;
    try {
      const trimmed = deviceText.trim();
      if (recordingRef.current) {
        if (trimmed) finish(trimmed, 'recognition');
        const serverText = await stopRecordingAndTranscribe(attempt);
        if (attempt !== attemptRef.current) return;
        if (serverText) {
          if (trimmed) refine(serverText, attempt);
          else finish(serverText, 'api');
          return;
        }
        if (!trimmed) {
          if (fallbackRef.current) finish(fallbackRef.current, 'fallback');
          else fail('음성을 인식하지 못했어요. 다시 한번 말씀해주세요.');
        }
        return;
      }
      if (trimmed) finish(trimmed, 'recognition');
      else if (fallbackRef.current) finish(fallbackRef.current, 'fallback');
      else fail('잘 듣지 못했어요. 다시 한번 말씀해주세요.');
    } finally {
      settlingRef.current = false;
    }
  }, [fail, finish, refine, stopRecordingAndTranscribe]);

  const submit = useCallback(async () => {
    // 서버 전용 경로에서 사용자가 ‘말하기 완료’를 누른 경우.
    if (!serverOnlyRef.current || submittingRef.current || handledRef.current) return;
    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current);
    listeningTimerRef.current = null;
    const attempt = attemptRef.current;
    submittingRef.current = true;
    try {
      const serverText = await stopRecordingAndTranscribe(attempt);
      if (attempt !== attemptRef.current) return;
      if (serverText) finish(serverText, 'api');
      else if (fallbackRef.current) finish(fallbackRef.current, 'fallback');
      else fail('음성을 인식하지 못했어요. 다시 한번 말씀해주세요.');
    } finally {
      submittingRef.current = false;
    }
  }, [fail, finish, stopRecordingAndTranscribe]);

  const start = useCallback(() => {
    stop();
    const attempt = attemptRef.current;
    handledRef.current = false;
    latestRef.current = '';
    setTranscript('');
    setError('');
    setResultSource(null);
    setStatus('listening');

    const hasServer = !!serverTranscribeRef.current;
    const deviceSupported = recognitionEngine.supported;

    // ── 서버 STT 전용 경로: 기기 STT를 못 쓸 때만 ──────────────
    if (hasServer && !deviceSupported) {
      serverOnlyRef.current = true;
      void (async () => {
        const ok = await beginRecording(attempt);
        if (attempt !== attemptRef.current) return;
        if (!ok) {
          serverOnlyRef.current = false;
          if (fallbackRef.current) finish(fallbackRef.current, 'fallback');
          else fail('이 기기에서는 음성 인식을 사용할 수 없어요. 다시 시도해주세요.');
          return;
        }
        setIsRecording(true);
        listeningTimerRef.current = setTimeout(() => {
          listeningTimerRef.current = null;
          void submit();
        }, SPEECH_RECOGNITION_TIMEOUT_MS);
      })();
      return;
    }

    // ── 기기 STT 주 경로 (웹에서만 서버 STT 병행 보정) ─────────
    // 네이티브에서 녹음과 기기 STT가 마이크를 동시에 잡는 위험을 피한다.
    if (hasServer && deviceSupported && Platform.OS === 'web') {
      void beginRecording(attempt); // best-effort. 실패해도 기기 STT가 결과를 만든다.
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

    if (!deviceSupported) {
      startFallback();
      return;
    }

    const session = recognitionEngine.create({
      lang: 'ko-KR',
      onPartial: (t) => {
        latestRef.current = t;
        setTranscript(t);
      },
      onFinal: (t) => void settleWithDevice(t, attempt),
      onError: (kind) => {
        if (handledRef.current) return;
        if (kind === 'permission') {
          fail('마이크 사용 권한을 확인한 뒤 다시 말해주세요.');
        } else if (recordingRef.current) {
          void settleWithDevice(latestRef.current, attempt);
        } else if (fallbackRef.current) {
          // 연습 모드: 인식 실패해도 예시 문장으로 진행할 수 있게 한다.
          startFallback();
        } else {
          fail('잘 듣지 못했어요. 다시 한번 말씀해주세요.');
        }
      },
      onEnd: () => {
        if (handledRef.current) return;
        if (latestRef.current || recordingRef.current) void settleWithDevice(latestRef.current, attempt);
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
        if (latestRef.current || recordingRef.current) void settleWithDevice(latestRef.current, attempt);
        else if (fallbackRef.current) startFallback();
        else fail('말씀을 듣지 못했어요. 다시 천천히 말씀해주세요.');
      }, SPEECH_RECOGNITION_TIMEOUT_MS);
    }
  }, [beginRecording, fail, finish, settleWithDevice, stop, submit]);

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
