import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, use, useEffect, useState } from 'react';

import { DEFAULT_TUNING_ID, getTuningById, type Tuning } from '@/lib/pitch';

const STORAGE_KEY = 'free-guitar-tuner/active-tuning';

type TuningContextValue = {
  /** The currently selected tuning (Standard until a saved choice loads). */
  tuning: Tuning;
  /** Select a tuning and persist the choice. */
  setTuning: (tuning: Tuning) => void;
};

const TuningContext = createContext<TuningContextValue | null>(null);

/**
 * Holds the active tuning and persists it to local storage, so the choice is
 * remembered across launches. Defaults to Standard while loading and whenever a
 * stored id is missing or unrecognized.
 */
export function TuningProvider({ children }: { children: ReactNode }) {
  const [tuning, setTuningState] = useState<Tuning>(() => getTuningById(DEFAULT_TUNING_ID));

  // Restore the saved choice once on mount.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((id) => {
        if (!cancelled && id) setTuningState(getTuningById(id));
      })
      .catch(() => {
        /* fall back to the default */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setTuning = (next: Tuning) => {
    setTuningState(next);
    AsyncStorage.setItem(STORAGE_KEY, next.id).catch(() => {
      /* a failed write just means the choice isn't remembered next launch */
    });
  };

  return <TuningContext value={{ tuning, setTuning }}>{children}</TuningContext>;
}

export function useTuning(): TuningContextValue {
  const value = use(TuningContext);
  if (!value) throw new Error('useTuning must be used within a TuningProvider');
  return value;
}
