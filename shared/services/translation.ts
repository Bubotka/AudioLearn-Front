import type { TranslationType, TranslateRequest, TranslateResponse } from '../types/translation';

interface IApiClient {
  translate(data: TranslateRequest): Promise<TranslateResponse>;
}

export class TranslationService {
  constructor(private apiClient: IApiClient) {}

  async translateText(
    text: string,
    targetLang: string,
    sourceLang: string,
    type: TranslationType = 'word'
  ): Promise<string> {
    const response = await this.apiClient.translate({
      text,
      type,
      sourceLang,
      targetLang,
    });

    return response.translatedText;
  }
}