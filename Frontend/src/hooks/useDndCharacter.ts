import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { fetchLiveDndBeyondCharacter } from '../services/dndBeyondService';
import type { Character } from '../types/character';

export const useDndCharacter = (beyondId?: string, intervalMs: number = 5000) => {
  // 1. useState
  const [character, setCharacter] = useState<Character | null>(null);
  // 2. useState
  const [loading, setLoading] = useState<boolean>(false);
  // 3. useState
  const [error, setError] = useState<string | null>(null);

  // 4. useRef
  const isInitialLoad = useRef(true);

  // 5. useCallback - טעינת דמות
  const loadCharacter = useCallback(async () => {
    if (!beyondId) return;

    if (isInitialLoad.current) {
      setLoading(true);
    }

    try {
      const data = await fetchLiveDndBeyondCharacter(beyondId);
      setCharacter(data);
      setError(null);
    } catch (err: unknown) {
      let message = 'נכשלה טעינת הדמות';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || err.message || message;
      }
      setError(message);
    } finally {
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
    }
  }, [beyondId]);

  // 6. useCallback - עדכון HP בלייב
  const applyHpChange = useCallback((changeAmount: number) => {
    setCharacter((prevChar) => {
      if (!prevChar) return null;
      const newHp = Math.min(
        prevChar.hp.max,
        Math.max(0, prevChar.hp.current + changeAmount)
      );
      return {
        ...prevChar,
        hp: {
          ...prevChar.hp,
          current: newHp,
        },
      };
    });
  }, []);

  // 7. useEffect - פולינג
  useEffect(() => {
    isInitialLoad.current = true;
    loadCharacter();

    const interval = setInterval(loadCharacter, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [beyondId, intervalMs, loadCharacter]);

  return { character, loading, error, refreshCharacter: loadCharacter, applyHpChange };
};