import { useState, useEffect } from 'react';
import type { Character } from '../types/character';
import { fetchDndBeyondCharacter } from '../services/dndBeyondService';

export const useDndCharacter = (characterId: string, refreshIntervalMs = 10000) => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. בדיקת הגנה: אם אין characterId, אל תפנה ל-Service!
    if (!characterId) {
      console.warn('⚠️ useDndCharacter: characterId is missing or undefined!');
      setLoading(false);
      return;
    }
    
    let isMounted = true;

    const loadCharacter = async () => {
      try {
        const data = await fetchDndBeyondCharacter(characterId);
        if (isMounted) {
          setCharacter(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error loading character');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCharacter();

    // Polling - עדכון אוטומטי כל X שניות בלייב!
    const interval = setInterval(loadCharacter, refreshIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [characterId, refreshIntervalMs]);

  return { character, loading, error };
};