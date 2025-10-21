import { useState, useEffect, useCallback } from 'react';
import type { Audiobook } from '@audiolearn/shared';
import { audiobookStorage } from '../services/storage';

export function useAudiobooks() {
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAudiobooks = useCallback(async () => {
    try {
      setLoading(true);
      const books = await audiobookStorage.getAll();
      setAudiobooks(books);
    } catch (error) {
      console.error('failed to load audiobooks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudiobooks();
  }, [loadAudiobooks]);

  const addAudiobook = useCallback(
    async (audiobook: Audiobook) => {
      await audiobookStorage.add(audiobook);
      await loadAudiobooks();
    },
    [loadAudiobooks]
  );

  const updateAudiobook = useCallback(
    async (id: string, updates: Partial<Audiobook>) => {
      await audiobookStorage.update(id, updates);
      await loadAudiobooks();
    },
    [loadAudiobooks]
  );

  const deleteAudiobook = useCallback(
    async (id: string) => {
      await audiobookStorage.delete(id);
      await loadAudiobooks();
    },
    [loadAudiobooks]
  );

  return {
    audiobooks,
    loading,
    addAudiobook,
    updateAudiobook,
    deleteAudiobook,
    refresh: loadAudiobooks,
  };
}
