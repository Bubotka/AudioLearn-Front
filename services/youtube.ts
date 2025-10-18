import type { YouTubeMetadata, Subtitle } from '../types/audiobook';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

interface BackendMetadataResponse {
  title: string;
  thumbnail: string;
  duration: number;
  author: string;
  audioUrl: string;
}

export const youtubeService = {
  async getMetadata(youtubeUrl: string): Promise<YouTubeMetadata> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_ENDPOINTS.youtube.metadata}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: youtubeUrl }),
        }
      );

      if (!response.ok) {
        throw new Error(`backend request failed: ${response.status}`);
      }

      const data: BackendMetadataResponse = await response.json();

      return {
        title: data.title || 'Unknown',
        thumbnail: data.thumbnail || '',
        duration: data.duration || 0,
        author: data.author || 'Unknown',
        audioUrl: data.audioUrl,
      };
    } catch (error) {
      console.error('failed to get youtube metadata:', error);
      throw new Error('failed to fetch video information', { cause: error });
    }
  },

  async getSubtitles(youtubeUrl: string): Promise<Subtitle[]> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_ENDPOINTS.youtube.subtitles}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: youtubeUrl }),
        }
      );

      if (!response.ok) {
        throw new Error(`backend request failed: ${response.status}`);
      }

      const data: Subtitle[] = await response.json();
      return data;
    } catch (error) {
      console.error('failed to get youtube subtitles:', error);
      throw new Error('failed to fetch subtitles', { cause: error });
    }
  },
};
