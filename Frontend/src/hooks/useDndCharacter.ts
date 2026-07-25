import { useState, useEffect } from 'react';
import { fetchLiveDndBeyondCharacter } from '../services/dndBeyondService';
import type { Character } from '../types/character';

export const useDndCharacter = (beyondId?: string, intervalMs: number = 5000) => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!beyondId) return;

    let isMounted = true;

    const loadCharacter = async () => {
      setLoading(true);
      try {
        const data = await fetchLiveDndBeyondCharacter(beyondId);
        if (isMounted) {
          setCharacter(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          const message = err.response?.data?.message || 'נכשלה טעינת הדמות מ-D&D Beyond';
          setError(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // קריאה ראשונית
    loadCharacter();

    // פולינג בלופ
    const interval = setInterval(loadCharacter, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [beyondId, intervalMs]);

  return { character, loading, error };
};