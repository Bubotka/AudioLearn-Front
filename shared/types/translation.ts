export type TranslationType = 'word' | 'paragraph';

export interface TranslateRequest {
  text: string;
  type: TranslationType;
  sourceLang: string;
  targetLang: string;
}

export interface TranslateResponse {
  translatedText: string;
}