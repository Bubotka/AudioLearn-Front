import { API_CONFIG, API_ENDPOINTS } from '../config/api';

interface TranslateRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

interface TranslateResponse {
  translatedText: string;
}

class TranslationService {
  private cache: Map<string, string> = new Map();

  private getCacheKey(text: string, sourceLang: string, targetLang: string): string {
    return `${sourceLang}:${targetLang}:${text}`;
  }

  async translateText(
    text: string,
    targetLang: string = 'RU',
    sourceLang: string = 'EN'
  ): Promise<string> {
    const cacheKey = this.getCacheKey(text, sourceLang, targetLang);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_ENDPOINTS.translation.translate}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            sourceLang,
            targetLang,
          } as TranslateRequest),
        }
      );

      if (!response.ok) {
        throw new Error(`translation failed: ${response.status}`);
      }

      const data: TranslateResponse = await response.json();

      this.cache.set(cacheKey, data.translatedText);

      return data.translatedText;
    } catch (error) {
      console.error('failed to translate:', error);
      throw new Error('failed to translate text', { cause: error });
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const translationService = new TranslationService();