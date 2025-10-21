import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Audiobook } from '@audiolearn/shared';

const STORAGE_KEY = 'audiobooks';

class AudiobookStorage {
  async getAll(): Promise<Audiobook[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('failed to load audiobooks:', error);
      return [];
    }
  }

  async add(audiobook: Audiobook): Promise<void> {
    const audiobooks = await this.getAll();
    audiobooks.push(audiobook);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(audiobooks));
  }

  async update(id: string, updates: Partial<Audiobook>): Promise<void> {
    const audiobooks = await this.getAll();
    const index = audiobooks.findIndex((book) => book.id === id);

    if (index !== -1) {
      audiobooks[index] = { ...audiobooks[index], ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(audiobooks));
    }
  }

  async delete(id: string): Promise<void> {
    const audiobooks = await this.getAll();
    const filtered = audiobooks.filter((book) => book.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  async get(id: string): Promise<Audiobook | null> {
    const audiobooks = await this.getAll();
    return audiobooks.find((book) => book.id === id) || null;
  }
}

export const audiobookStorage = new AudiobookStorage();
