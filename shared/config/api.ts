// API configuration
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : import.meta.env?.DEV ?? process.env.NODE_ENV !== 'production';

export const API_CONFIG = {
  baseUrl: isDev
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
