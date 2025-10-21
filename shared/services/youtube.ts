import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import type { Subtitle } from '../types/audiobook';

interface YoutubeMetadata {
  title: string;
  author?: string;
  duration?: number;
  thumbnailUrl?: string;
}

interface YoutubeAudioResponse {
  audioUrl: string;
}

interface YoutubeSubtitlesResponse {
  subtitles: Subtitle[];
}

class YoutubeService {
  async getMetadata(youtubeUrl: string): Promise<YoutubeMetadata> {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_ENDPOINTS.youtube.metadata}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: youtubeUrl }),
    });

    if (!response.ok) {
      throw new Error(`failed to get metadata: ${response.statusText}`);
    }

    return response.json();
  }

  async getAudioUrl(youtubeUrl: string): Promise<string> {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_ENDPOINTS.youtube.audioUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: youtubeUrl }),
    });

    if (!response.ok) {
      throw new Error(`failed to get audio url: ${response.statusText}`);
    }

    const data: YoutubeAudioResponse = await response.json();
    return data.audioUrl;
  }

  async getSubtitles(youtubeUrl: string, languageCode: string = 'en'): Promise<Subtitle[]> {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_ENDPOINTS.youtube.subtitles}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: youtubeUrl, languageCode }),
    });

    if (!response.ok) {
      throw new Error(`failed to get subtitles: ${response.statusText}`);
    }

    const data: YoutubeSubtitlesResponse = await response.json();
    return data.subtitles;
  }
}

export const youtubeService = new YoutubeService();