import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Audiobook } from '../types/audiobook';

const AUDIOBOOKS_KEY = '@audiolearn:audiobooks';

export const audiobookStorage = {
  async getAll(): Promise<Audiobook[]> {
    try {
      const data = await AsyncStorage.getItem(AUDIOBOOKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('failed to load audiobooks:', error);
      return [];
    }
  },

  async save(audiobooks: Audiobook[]): Promise<void> {
    try {
      await AsyncStorage.setItem(AUDIOBOOKS_KEY, JSON.stringify(audiobooks));
    } catch (error) {
      console.error('failed to save audiobooks:', error);
      throw error;
    }
  },

  async add(audiobook: Audiobook): Promise<void> {
    const audiobooks = await this.getAll();
    audiobooks.unshift(audiobook); // add to beginning
    await this.save(audiobooks);
  },

  async update(id: string, updates: Partial<Audiobook>): Promise<void> {
    const audiobooks = await this.getAll();
    const index = audiobooks.findIndex((book) => book.id === id);

    if (index === -1) {
      throw new Error(`audiobook with id ${id} not found`);
    }

    audiobooks[index] = { ...audiobooks[index], ...updates };
    await this.save(audiobooks);
  },

  async delete(id: string): Promise<void> {
    const audiobooks = await this.getAll();
    const filtered = audiobooks.filter((book) => book.id !== id);
    await this.save(filtered);
  },

  async getById(id: string): Promise<Audiobook | null> {
    const audiobooks = await this.getAll();
    return audiobooks.find((book) => book.id === id) || null;
  },
};
