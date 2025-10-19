export type AudiobookStatus = 'downloading' | 'ready' | 'error' | 'playing' | 'paused';

export interface Subtitle {
  start: number;
  end: number;
  text: string;
}

export interface SubtitleParagraph {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translatedText?: string;
  subtitles: Subtitle[];
}

export interface Audiobook {
  id: string;
  youtubeUrl: string;
  title: string;
  thumbnail?: string;
  duration?: number; // in seconds
  status: AudiobookStatus;
  progress: number; // 0-100 for downloading
  downloadSpeed?: number; // bytes per second
  totalBytes?: number; // total file size
  bytesWritten?: number; // downloaded bytes
  audioPath?: string; // local file path
  audioUrl?: string; // direct YouTube audio URL (valid for ~6 hours)
  subtitlesPath?: string; // local subtitles path
  subtitles?: Subtitle[]; // stored subtitles from YouTube
  paragraphs?: SubtitleParagraph[];
  currentPosition?: number; // playback position in seconds
  lastPosition?: number; // last saved playback position in seconds
  author?: string; // video author/channel
  addedAt: number; // timestamp
  lastPlayedAt?: number; // timestamp
}

export interface YouTubeMetadata {
  title: string;
  thumbnail: string;
  duration: number;
  author: string;
  audioUrl: string; // direct audio URL from backend
}
