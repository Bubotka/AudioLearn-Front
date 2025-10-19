// API configuration
export const API_CONFIG = {
  baseUrl: __DEV__
    ? 'http://192.168.100.15:8080/api' // Development - VM Bridge IP
    : 'https://your-backend.com/api', // Production
} as const;

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
