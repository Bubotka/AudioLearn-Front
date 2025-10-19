# План реализации перевода и озвучки текста

## Цель
Добавить функционал выделения слов/предложений в субтитрах с возможностью:
1. Прослушать выделенный текст на английском (TTS)
2. Перевести и прослушать на русском
3. Перевести целый абзац и показать перевод

## Технологический стек

- **Перевод**: DeepL API (лучшее качество для EN→RU, $12/1M символов)
- **TTS**: Expo Speech (бесплатно, встроенный) для MVP
- **Альтернатива TTS**: Google Cloud TTS (премиум качество, $4-16/1M символов)

---

## Этап 1: Настройка бэкенда для переводов

### 1.1 Регистрация DeepL API
- [ ] Зарегистрироваться на https://www.deepl.com/pro-api
- [ ] Выбрать DeepL API Free (500K символов/месяц бесплатно)
- [ ] Получить API ключ
- [ ] Добавить ключ в `.env` бэкенда: `DEEPL_API_KEY=xxx`

### 1.2 Создать эндпоинт `/api/translate` на бэкенде (Go)

**Файл**: `backend/handlers/translation.go`

```go
type TranslateRequest struct {
    Text       string `json:"text" binding:"required"`
    SourceLang string `json:"sourceLang" binding:"required"` // "EN"
    TargetLang string `json:"targetLang" binding:"required"` // "RU"
}

type TranslateResponse struct {
    TranslatedText string `json:"translatedText"`
    Cached         bool   `json:"cached"`
}

func TranslateText(c *gin.Context) {
    // 1. Парсинг запроса
    // 2. Проверка кэша (Redis или DB)
    // 3. Запрос к DeepL API если нет в кэше
    // 4. Сохранение в кэш
    // 5. Возврат результата
}
```

**Важно:**
- Кэшировать ВСЕ переводы навсегда (переводы не меняются)
- Использовать hash(text + sourceLang + targetLang) как ключ кэша
- Использовать DeepL Free API endpoint: `https://api-free.deepl.com/v2/translate`

### 1.3 Добавить маршрут

**Файл**: `backend/routes/routes.go`

```go
router.POST("/api/translate", handlers.TranslateText)
```

### 1.4 Настроить кэширование

**Варианты:**
- **Redis** (рекомендуется) - быстрый in-memory кэш
- **PostgreSQL таблица** - постоянное хранение
- **In-memory map** - простой вариант для MVP

**Структура кэша:**
```
Key: sha256(text + sourceLang + targetLang)
Value: translated text
TTL: бесконечно (переводы не меняются)
```

---

## Этап 2: Фронтенд - API интеграция

### 2.1 Обновить типы

**Файл**: `types/audiobook.ts`

```typescript
export interface SubtitleParagraph {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translatedText?: string; // ← ДОБАВИТЬ
  subtitles: Subtitle[];
}
```

### 2.2 Обновить конфиг API

**Файл**: `config/api.ts`

```typescript
export const API_ENDPOINTS = {
  youtube: {
    metadata: '/youtube/metadata',
    audioUrl: '/youtube/audio-url',
    subtitles: '/youtube/subtitles',
  },
  translation: {
    translate: '/translate', // ← ДОБАВИТЬ
  },
} as const;
```

### 2.3 Создать сервис перевода

**Файл**: `services/translation.ts` (НОВЫЙ ФАЙЛ)

```typescript
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

interface TranslateRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

interface TranslateResponse {
  translatedText: string;
  cached: boolean;
}

export const translationService = {
  async translateText(
    text: string,
    targetLang: string = 'RU',
    sourceLang: string = 'EN'
  ): Promise<string> {
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
      return data.translatedText;
    } catch (error) {
      console.error('failed to translate:', error);
      throw new Error('failed to translate text', { cause: error });
    }
  },
};
```

---

## Этап 3: UI компоненты для выделения текста

### 3.1 Создать компонент SelectableText

**Файл**: `components/SelectableText.tsx` (НОВЫЙ ФАЙЛ)

**Функционал:**
- Разбить текст на слова
- Сделать каждое слово кликабельным
- При клике на слово - показать меню действий
- Меню:
  - "Прослушать на английском" (Expo Speech)
  - "Перевести и прослушать" (DeepL + Expo Speech)
  - "Закрыть"

**Технические детали:**
```typescript
import * as Speech from 'expo-speech';
import { translationService } from '../services/translation';

// Разбиение на слова с сохранением пробелов
const words = text.split(/(\s+)/);

// Озвучка
Speech.speak(text, {
  language: 'en-US', // или 'ru-RU'
  pitch: 1.0,
  rate: 0.85, // немного медленнее для понимания
});
```

### 3.2 Обновить SubtitleParagraphItem

**Файл**: `components/SubtitleParagraphItem.tsx`

**Изменения:**
1. Заменить обычный `<Text>` на `<SelectableText>`
2. Добавить кнопку "Перевести абзац"
3. Показать перевод под оригинальным текстом
4. Сохранять перевод в storage при первом запросе

```typescript
import { SelectableText } from './SelectableText';
import { translationService } from '../services/translation';

// Добавить state для перевода
const [showTranslation, setShowTranslation] = useState(false);
const [isTranslating, setIsTranslating] = useState(false);

// Функция перевода абзаца
const handleTranslateParagraph = async () => {
  if (paragraph.translatedText) {
    setShowTranslation(!showTranslation);
    return;
  }

  setIsTranslating(true);
  try {
    const translated = await translationService.translateText(
      paragraph.text,
      'RU',
      'EN'
    );
    onTranslate?.(paragraph.id, translated); // сохранить в storage
    setShowTranslation(true);
  } catch (error) {
    console.error('translation error:', error);
  } finally {
    setIsTranslating(false);
  }
};
```

---

## Этап 4: Интеграция с плеером

### 4.1 Обновить PlayerScreen

**Файл**: `app/player/[id].tsx`

**Добавить функцию сохранения переводов:**

```typescript
const handleParagraphTranslate = async (
  paragraphId: string,
  translatedText: string
) => {
  if (!audiobook || !audiobook.paragraphs) return;

  // Обновляем параграф с переводом
  const updatedParagraphs = audiobook.paragraphs.map(p =>
    p.id === paragraphId ? { ...p, translatedText } : p
  );

  // Сохраняем в AsyncStorage
  await audiobookStorage.update(audiobook.id, {
    paragraphs: updatedParagraphs,
  });

  // Обновляем локальное состояние
  setAudiobook({ ...audiobook, paragraphs: updatedParagraphs });
  paragraphsRef.current = updatedParagraphs;
};
```

**Передать в SubtitleParagraphList:**

```tsx
<SubtitleParagraphList
  paragraphs={audiobook.paragraphs}
  currentParagraphIndex={currentParagraphIndex}
  currentTime={position}
  onSeek={seekTo}
  onTranslate={handleParagraphTranslate} // ← ДОБАВИТЬ
/>
```

### 4.2 Обновить SubtitleParagraphList

**Файл**: `components/SubtitleParagraphList.tsx`

```typescript
interface SubtitleParagraphListProps {
  paragraphs: SubtitleParagraph[];
  currentParagraphIndex: number;
  currentTime: number;
  onSeek: (time: number) => void;
  onTranslate?: (paragraphId: string, translatedText: string) => void; // ← ДОБАВИТЬ
}

// Передать в SubtitleParagraphItem
<SubtitleParagraphItem
  paragraph={item}
  isActive={index === currentParagraphIndex}
  onPress={() => onSeek(item.startTime)}
  onTranslate={onTranslate} // ← ДОБАВИТЬ
/>
```

---

## Этап 5: Установка зависимостей

### 5.1 Expo Speech (уже включен в Expo SDK)

```bash
# Проверить, что установлен
expo install expo-speech
```

### 5.2 (Опционально) Google Cloud TTS

Если захочешь использовать премиум TTS вместо Expo Speech:

**Бэкенд:**
- Добавить эндпоинт `/api/tts`
- Интеграция с Google Cloud Text-to-Speech API
- Возвращать аудио URL или base64

**Фронтенд:**
- Использовать `expo-av` для проигрывания TTS аудио

---

## Этап 6: Оптимизации и улучшения

### 6.1 Кэширование на фронтенде

**Зачем:** Не запрашивать переводы одних и тех же слов повторно

**Реализация:**
```typescript
// В translationService.ts
const translationCache = new Map<string, string>();

export const translationService = {
  async translateText(text: string, targetLang: string, sourceLang: string) {
    const cacheKey = `${text}_${sourceLang}_${targetLang}`;

    // Проверяем локальный кэш
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    // Запрос к API
    const translated = await fetch(...);

    // Сохраняем в кэш
    translationCache.set(cacheKey, translated);

    return translated;
  }
};
```

### 6.2 Индикаторы загрузки

- Показывать `ActivityIndicator` при переводе абзаца
- Показывать состояние "озвучивается" при TTS

### 6.3 Обработка ошибок

```typescript
try {
  const translated = await translationService.translateText(...);
} catch (error) {
  Alert.alert(
    'Ошибка перевода',
    'Не удалось перевести текст. Проверьте соединение с интернетом.'
  );
}
```

### 6.4 Настройки языка в профиле

**Будущая фича:**
- Добавить экран настроек `/settings`
- Выбор целевого языка перевода (RU, ES, DE, etc.)
- Сохранять в AsyncStorage
- Использовать в `translationService.translateText()`

---

## Этап 7: Тестирование

### 7.1 Unit тесты
- [ ] Тест `translationService.translateText()`
- [ ] Тест кэширования переводов
- [ ] Тест разбиения текста на слова

### 7.2 Интеграционные тесты
- [ ] Перевод абзаца + сохранение в storage
- [ ] Озвучка слова через Expo Speech
- [ ] Работа с кэшем переводов на бэкенде

### 7.3 Мануальное тестирование
- [ ] Выделить слово → прослушать на EN
- [ ] Выделить слово → перевести → прослушать на RU
- [ ] Перевести абзац → показать перевод
- [ ] Переведенный абзац сохраняется в storage
- [ ] При повторном открытии - перевод уже есть
- [ ] Работает оффлайн (TTS), не работает перевод без интернета

---

## Этап 8: Деплой

### 8.1 Бэкенд
- [ ] Добавить `DEEPL_API_KEY` в environment variables
- [ ] Настроить Redis для кэша (или использовать DB)
- [ ] Деплой на сервер

### 8.2 Фронтенд
- [ ] Обновить `API_CONFIG.baseUrl` для production
- [ ] Билд и публикация через Expo

---

## Приоритизация (MVP)

### Минимальная версия (1-2 дня):

1. ✅ **Перевод абзаца**
   - Кнопка "Перевести" на абзаце
   - Показать перевод под оригиналом
   - Сохранить в storage

2. ✅ **Озвучка выделенного текста (Expo Speech)**
   - Тап на слово
   - Меню "Прослушать на английском"

3. ✅ **Бэкенд с DeepL API**
   - Эндпоинт `/api/translate`
   - Базовое кэширование (in-memory map)

### Расширенная версия (3-5 дней):

4. ✅ Выделение текста пальцем (TextInput с selection)
5. ✅ "Перевести и прослушать" для слов
6. ✅ Redis кэш на бэкенде
7. ✅ Обработка ошибок и индикаторы загрузки

### Премиум версия (будущее):

8. ⭐ Google Cloud TTS для премиум подписки
9. ⭐ Настройки языка в профиле
10. ⭐ Оффлайн переводы (словарь часто используемых слов)

---

## Структура файлов после реализации

```
AudioLearn-Front/
├── app/
│   └── player/
│       └── [id].tsx                    # Обновлен: handleParagraphTranslate
├── components/
│   ├── SelectableText.tsx              # НОВЫЙ: выделение и озвучка слов
│   ├── SubtitleParagraphItem.tsx       # Обновлен: кнопка перевода абзаца
│   └── SubtitleParagraphList.tsx       # Обновлен: onTranslate prop
├── services/
│   ├── translation.ts                  # НОВЫЙ: DeepL API интеграция
│   ├── storage.ts                      # Без изменений
│   └── youtube.ts                      # Без изменений
├── types/
│   └── audiobook.ts                    # Обновлен: translatedText в SubtitleParagraph
├── config/
│   └── api.ts                          # Обновлен: translation endpoint
└── TTS_TRANSLATION_PLAN.md             # Этот файл
```

---

## Чеклист реализации

### Backend (Go):
- [ ] Регистрация DeepL API и получение ключа
- [ ] Создать `handlers/translation.go`
- [ ] Добавить маршрут `POST /api/translate`
- [ ] Реализовать кэширование (Redis/DB/in-memory)
- [ ] Тестирование эндпоинта

### Frontend:
- [ ] Обновить `types/audiobook.ts`
- [ ] Обновить `config/api.ts`
- [ ] Создать `services/translation.ts`
- [ ] Создать `components/SelectableText.tsx`
- [ ] Обновить `components/SubtitleParagraphItem.tsx`
- [ ] Обновить `components/SubtitleParagraphList.tsx`
- [ ] Обновить `app/player/[id].tsx`
- [ ] Установить `expo-speech`
- [ ] Тестирование функционала

### Тестирование:
- [ ] Тест перевода абзаца
- [ ] Тест озвучки слова
- [ ] Тест сохранения переводов
- [ ] Тест работы оффлайн (TTS)
- [ ] Тест обработки ошибок

### Деплой:
- [ ] Environment variables на бэкенде
- [ ] Настройка production API URL
- [ ] Билд и публикация

---

## Примерная оценка времени

| Задача | Время |
|--------|-------|
| Настройка бэкенда (DeepL API) | 2-3 часа |
| Фронтенд API интеграция | 1-2 часа |
| SelectableText компонент | 3-4 часа |
| Интеграция с плеером | 1-2 часа |
| Тестирование и фиксы | 2-3 часа |
| **ИТОГО** | **9-14 часов** (1-2 дня) |

---

## Полезные ссылки

- DeepL API Docs: https://www.deepl.com/docs-api
- Expo Speech Docs: https://docs.expo.dev/versions/latest/sdk/speech/
- Google Cloud TTS: https://cloud.google.com/text-to-speech/docs
- React Native Text Selection: https://reactnative.dev/docs/textinput#selection
