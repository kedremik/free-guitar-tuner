import { AudioStudioModule, useAudioRecorder } from '@siteed/expo-audio-studio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { base64Pcm16ToFloat32, type PitchReading, PitchTracker } from '@/lib/pitch';

import { type MicPermission, type PitchState, SAMPLE_RATE, STREAM_INTERVAL_MS } from './pitch-types';

/**
 * Native (iOS / Android) microphone pitch detection.
 *
 * Uses `@siteed/expo-audio-studio` to stream raw 16-bit PCM off the device mic.
 * Each chunk is decoded to Float32 samples and pushed through a `PitchTracker`.
 * The mic stays live for the whole lifetime of the screen.
 */
export function usePitch(): PitchState {
  const recorder = useAudioRecorder();
  const [permission, setPermission] = useState<MicPermission>('undetermined');
  const [reading, setReading] = useState<PitchReading | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Stable refs so the long-lived onAudioStream callback never goes stale.
  const trackerRef = useRef<PitchTracker | null>(null);
  const startingRef = useRef(false);

  const handleSamples = useCallback((samples: Float32Array) => {
    const tracker = trackerRef.current;
    if (!tracker) return;
    // `process` returns a reading once a window fills, or null for
    // silence/noise. Setting null when already null is a no-op re-render.
    setReading(tracker.process(samples));
  }, []);

  const start = useCallback(async () => {
    if (recorder.isRecording || startingRef.current) return;
    startingRef.current = true;
    try {
      trackerRef.current = new PitchTracker({ sampleRate: SAMPLE_RATE });
      await recorder.startRecording({
        sampleRate: SAMPLE_RATE,
        channels: 1,
        encoding: 'pcm_16bit',
        interval: STREAM_INTERVAL_MS,
        // We run our own analysis, so the native feature extractor stays off.
        enableProcessing: false,
        onAudioStream: async (event) => {
          if (typeof event.data === 'string') handleSamples(base64Pcm16ToFloat32(event.data));
        },
      });
      setIsListening(true);
    } finally {
      startingRef.current = false;
    }
  }, [recorder, handleSamples]);

  const requestPermission = useCallback(async () => {
    const result = await AudioStudioModule.requestPermissionsAsync();
    const granted = result?.granted ?? result?.status === 'granted';
    setPermission(granted ? 'granted' : 'denied');
    if (granted) await start();
  }, [start]);

  // On mount: start if already granted, otherwise prompt. Without this, a fresh
  // install sits in "undetermined" forever — the OS prompt never appears and the
  // mic never opens.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const current = await AudioStudioModule.getPermissionsAsync();
      if (cancelled) return;
      const granted = current?.granted ?? current?.status === 'granted';
      if (granted) {
        setPermission('granted');
        await start();
      } else if (current?.canAskAgain ?? current?.status === 'undetermined') {
        // First launch — trigger the system mic prompt (and start once allowed).
        await requestPermission();
      } else {
        setPermission('denied');
      }
    })();
    return () => {
      cancelled = true;
      if (recorder.isRecording) recorder.stopRecording().catch(() => {});
      setIsListening(false);
    };
    // Run once on mount; `start`/`recorder` identities are stable enough here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { reading, permission, isListening, requestPermission };
}
