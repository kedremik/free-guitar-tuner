import { useCallback, useEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { type PitchReading, PitchTracker } from '@/lib/pitch';

import { type MicPermission, type PitchState, UI_UPDATE_INTERVAL_MS } from './pitch-types';

/**
 * Web microphone pitch detection via the Web Audio API.
 *
 * `getUserMedia` -> `AnalyserNode` gives us raw time-domain samples each frame,
 * which feed the shared `PitchTracker`. The analyser's own sample rate is used
 * so cents stay accurate regardless of the browser's audio hardware.
 */
const FFT_SIZE = 2048;

export function usePitch(): PitchState {
  const [permission, setPermission] = useState<MicPermission>('undetermined');
  const [reading, setReading] = useState<PitchReading | null>(null);
  const [isListening, setIsListening] = useState(false);
  const cents = useSharedValue<number | null>(null);

  const cleanupRef = useRef<(() => void) | null>(null);

  const start = useCallback(async () => {
    if (cleanupRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });

    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    source.connect(analyser);

    const tracker = new PitchTracker({ sampleRate: context.sampleRate, bufferSize: FFT_SIZE });
    const samples = new Float32Array(FFT_SIZE);
    let frame = 0;
    let lastTextUpdate = 0;

    const tick = () => {
      analyser.getFloatTimeDomainData(samples);
      const result = tracker.process(samples);
      if (result !== undefined) {
        // Full-rate needle via shared value; throttled text re-render.
        cents.value = result ? result.cents : null;
        const now = performance.now();
        if (now - lastTextUpdate >= UI_UPDATE_INTERVAL_MS) {
          lastTextUpdate = now;
          setReading(result);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    setIsListening(true);

    cleanupRef.current = () => {
      cancelAnimationFrame(frame);
      stream.getTracks().forEach((track) => track.stop());
      context.close();
      cleanupRef.current = null;
      setIsListening(false);
    };
  }, [cents]);

  const requestPermission = useCallback(async () => {
    try {
      await start();
      setPermission('granted');
    } catch {
      setPermission('denied');
    }
  }, [start]);

  // Try to start automatically; browsers that block it fall back to the button.
  // `requestPermission` only sets state after awaiting getUserMedia, so this is
  // not a synchronous cascading render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestPermission();
    return () => cleanupRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { reading, cents, permission, isListening, requestPermission };
}
