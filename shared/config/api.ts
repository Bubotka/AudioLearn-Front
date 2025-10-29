// API endpoints configuration
export const API_ENDPOINTS = {
  youtube: {
    metadata: '/youtube/metadata',
    audioUrl: '/youtube/audio-url',
    subtitles: '/youtube/subtitles',
  },
  translation: {
    translate: '/translate',
  },
} as const;
