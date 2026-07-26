import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { fetchLiveDndBeyondCharacter } from '../services/dndBeyondService';
import type { Character } from '../types/character';

export const useDndCharacter = (beyondId?: string, intervalMs: number = 5000) => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // רפרנס לבדיקה אם זו הקריאה הראשונית (כדי למנוע ריצוד Loading בכל 5 שניות)
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!beyondId) return;

    let isMounted = true;

    const loadCharacter = async () => {
      // הופכים את Loading ל-true רק בטעינה הראשונית הראשונה
      if (isInitialLoad.current) {
        setLoading(true);
      }

      try {
        const data = await fetchLiveDndBeyondCharacter(beyondId);
        if (isMounted) {
          setCharacter(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          let message = 'נכשלה טעינת הדמות מ-D&D Beyond';
          if (axios.isAxiosError(err)) {
            message = err.response?.data?.message || err.message || message;
          }
          setError(message);
        }
      } finally {
        if (isMounted && isInitialLoad.current) {
          setLoading(false);
          isInitialLoad.current = false; // מסמנים שהטעינה הראשונית הסתיימה
        }
      }
    };

    // איפוס הרפרנס כש-beyondId משתנה
    isInitialLoad.current = true;

    // קריאה ראשונית
    loadCharacter();

    // פולינג בלופ (Silent Refresh)
    const interval = setInterval(loadCharacter, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [beyondId, intervalMs]);

  return { character, loading, error };
};