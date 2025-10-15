export type AudiobookStatus = 'downloading' | 'ready' | 'error' | 'playing' | 'paused';

export interface Audiobook {
  id: string;
  youtubeUrl: string;
  title: string;
  thumbnail?: string;
  duration?: number; // in seconds
  status: AudiobookStatus;
  progress: number; // 0-100 for downloading
  audioPath?: string; // local file path
  subtitlesPath?: string; // local subtitles path
  currentPosition?: number; // playback position in seconds
  addedAt: number; // timestamp
  lastPlayedAt?: number; // timestamp
}

export interface DownloadProgress {
  totalBytes: number;
  bytesWritten: number;
  progress: number; // 0-1
}

export interface YouTubeMetadata {
  title: string;
  thumbnail: string;
  duration: number;
  author: string;
}
