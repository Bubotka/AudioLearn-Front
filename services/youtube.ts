import ytdl from 'react-native-ytdl';
import * as FileSystem from 'expo-file-system/legacy';
import type { YouTubeMetadata, DownloadProgress } from '../types/audiobook';

export const youtubeService = {
  async getMetadata(youtubeUrl: string): Promise<YouTubeMetadata> {
    try {
      const info = await ytdl.getInfo(youtubeUrl);

      return {
        title: info.videoDetails.title || 'Unknown',
        thumbnail: info.videoDetails.thumbnails?.[0]?.url || '',
        duration: parseInt(info.videoDetails.lengthSeconds || '0'),
        author: info.videoDetails.author.name || 'Unknown',
      };
    } catch (error) {
      console.error('failed to get youtube metadata:', error);
      throw new Error('failed to fetch video information', { cause: error });
    }
  },

  async getAudioUrl(youtubeUrl: string): Promise<string> {
    try {
      const urls = await ytdl(youtubeUrl, {
        quality: 'highestaudio',
        filter: 'audioonly',
      });

      if (!urls || urls.length === 0) {
        throw new Error('no audio URL found');
      }

      return urls[0].url;
    } catch (error) {
      console.error('failed to get audio URL:', error);
      throw new Error('failed to get audio download link', { cause: error });
    }
  },

  async downloadAudio(
    audioUrl: string,
    audiobookId: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    try {
      const fileName = `${audiobookId}.mp3`;
      const fileUri = FileSystem.documentDirectory + fileName;

      const downloadResumable = FileSystem.createDownloadResumable(
        audioUrl,
        fileUri,
        {},
        (downloadProgress) => {
          if (onProgress) {
            const progress: DownloadProgress = {
              totalBytes: downloadProgress.totalBytesExpectedToWrite,
              bytesWritten: downloadProgress.totalBytesWritten,
              progress:
                downloadProgress.totalBytesWritten /
                downloadProgress.totalBytesExpectedToWrite,
            };
            onProgress(progress);
          }
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result) {
        throw new Error('download failed');
      }

      return result.uri;
    } catch (error) {
      console.error('failed to download audio:', error);
      throw new Error('failed to download audio file', { cause: error });
    }
  },
};
