export interface Subtitle {
  start: number;
  end: number;
  text: string;
}

export interface TranslationRequest {
  text: string;
}

export interface TranslationResponse {
  translation: string;
}