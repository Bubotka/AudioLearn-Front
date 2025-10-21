export interface Subtitle {
  start: number;
  end: number;
  text: string;
}

export interface SubtitleParagraph {
  id?: string;
  paragraphIndex: number;
  subtitles: Subtitle[];
  text: string;
  translatedText?: string;
  startTime: number;
  endTime: number;
}

export type AudiobookStatus = 'ready' | 'downloading' | 'error' | 'playing' | 'paused';

export interface Audiobook {
  id: string;
  title: string;
  author?: string;
  youtubeUrl?: string;
  audioUri?: string;
  audioUrl?: string;
  audioPath?: string;
  subtitles?: Subtitle[];
  paragraphs?: SubtitleParagraph[];
  duration?: number;
  status: AudiobookStatus;
  downloadProgress?: number;
  progress?: number;
  thumbnail?: string;
  thumbnailUrl?: string;
  bytesWritten?: number;
  totalBytes?: number;
  downloadSpeed?: number;
  lastPosition?: number;
  createdAt: number;
}