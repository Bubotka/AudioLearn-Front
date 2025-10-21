import { API_CONFIG, API_ENDPOINTS } from '../config/api';

class TranslationService {
  async translateText(text: string, targetLang: string, sourceLang: string): Promise<string> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_ENDPOINTS.translation.translate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLang,
          sourceLang,
        }),
      });

      if (!response.ok) {
        throw new Error(`translation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.translatedText || text;
    } catch (error) {
      console.error('translation error:', error);
      throw error;
    }
  }
}

export const translationService = new TranslationService();