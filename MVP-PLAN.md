# AudioLearn Assistant - MVP Plan (Simplified)

## 🎯 Цель проекта

Мобильное приложение для изучения языков через аудиокниги с голосовым управлением и мгновенным переводом.

**Основная проблема:** При прослушивании аудиокниг на иностранном языке приходится останавливать, искать непонятные слова в переводчике - теряется flow.

**Решение:** Говоришь "STOP" → аудио останавливается → **слышишь озвучку перевода** последних 10 секунд → говоришь "Continue" → продолжаешь слушать.

---

## 📋 Scope MVP

### ✅ Входит в MVP v1.0 (1-1.5 недели):

**Основной функционал:**
- ✅ YouTube URL → автоматическое скачивание аудио на устройство
- ✅ Получение субтитров с YouTube (если доступны)
- ✅ Аудиоплеер с синхронизацией субтитров
- ✅ Голосовое управление: "STOP" / "Continue"
- ✅ Перевод текста (EN → RU)
- ✅ Голосовая озвучка перевода (TTS)

**Технические особенности:**
- ✅ Аудио скачивается НА КЛИЕНТЕ (не нагружает сервер)
- ✅ Бэкенд только для субтитров + перевод
- ✅ Работает только с видео, у которых ЕСТЬ субтитры на YouTube

### ❌ НЕ входит в MVP (v2.0+):

- Whisper (генерация субтитров)
- Загрузка локальных MP3 файлов
- Импорт своих субтитров (.srt/.vtt)
- Progressive generation / chunks
- WebSocket / real-time progress
- Кэширование субтитров
- База данных (SQLite)
- Регистрация/авторизация
- История переводов
- Настройки (выбор языков)
- Словарь и Anki export
- Поддержка других платформ (Spotify API, Audible API)

---

## 🛠 Технический стек

### Mobile (Frontend):
- **React Native + Expo SDK 51+** (latest)
- **react-native-ytdl** - получение ссылок на аудио с YouTube
- **expo-file-system** - скачивание аудио на устройство
- **expo-av** - audio player
- **@react-native-voice/voice** - voice recognition
- **expo-speech** - TTS (text-to-speech)
- **axios** - HTTP requests
- **react-native-paper** - UI components

### Backend (API):
- **Gin web framework** - REST API
- **yt-dlp** - скачивание субтитров с YouTube
- **github.com/DeepLcom/deepl-go** - translation API

### APIs:
- **DeepL API** (перевод) - FREE tier: 500K символов/месяц

### Deployment:
- Backend: VPS (TBD - Hetzner/DigitalOcean/Railway)
- Mobile: Expo Go (development) → Expo EAS Build (production)

---

## 📐 Архитектура (упрощённая)

### User Flow:

```
┌─────────────────────────────────────────────────┐
│      Пользователь                               │
│                                                 │
│  1. Вставляет YouTube URL                       │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│      React Native App (Клиент)                  │
│                                                 │
│  2. react-native-ytdl:                          │
│     → Получает прямую ссылку на аудио           │
│                                                 │
│  3. expo-file-system:                           │
│     → СКАЧИВАЕТ аудио на телефон                │
│     → Показывает прогресс загрузки              │
│                                                 │
│  4. HTTP запрос к бэкенду:                      │
│     → GET /api/subtitles?url=YOUTUBE_URL        │
│     → Получает .vtt субтитры                    │
│                                                 │
│  5. expo-av:                                    │
│     → Играет локальное аудио                    │
│     → Синхронизирует с субтитрами               │
│     → Показывает текущий subtitle               │
│                                                 │
│  6. Voice Control:                              │
│     → "STOP" → пауза аудио                      │
│     → Извлекает последние 10 секунд субтитров   │
│     → POST /api/translate → получает перевод    │
│     → expo-speech озвучивает перевод            │
│     → "Continue" → возобновляет аудио           │
└────────────────────┬────────────────────────────┘
                     │ HTTP (только субтитры + перевод)
                     ↓
┌─────────────────────────────────────────────────┐
│      Go Backend (МИНИМАЛЬНЫЙ!)                  │
│                                                 │
│  GET /api/subtitles?url=YOUTUBE_URL             │
│  ├─ Запускает: yt-dlp --write-auto-sub          │
│  ├─ Скачивает .vtt/.srt файл с YouTube          │
│  ├─ Парсит VTT → JSON                           │
│  └─ Отдаёт: [{start, end, text}, ...]           │
│                                                 │
│  Если субтитров НЕТ:                            │
│  └─ Возвращает 404 "Subtitles not available"    │
│                                                 │
│  POST /api/translate                            │
│  ├─ Body: { text: "..." }                       │
│  ├─ DeepL API: EN → RU                          │
│  └─ Отдаёт: { translation: "..." }              │
└─────────────────────────────────────────────────┘
```

### Почему такая архитектура?

**Преимущества:**
- ✅ Аудио скачивается на клиенте → **не нагружает сервер**
- ✅ Бэкенд ОЧЕНЬ простой → легко разрабатывать и деплоить
- ✅ Можно слушать офлайн после загрузки
- ✅ Не нужна база данных
- ✅ Не нужен Whisper (90%+ YouTube видео имеют субтитры)

**Ограничения:**
- ❌ Работает только с YouTube
- ❌ Работает только если на видео ЕСТЬ субтитры
- ❌ Нужно ждать пока аудио скачается (~50MB для 7 часов)

---

## 📅 План разработки (7-10 дней)

### Этап 1: Backend (День 1-2)
**Цель:** Минимальный API для субтитров и перевода

**Задачи:**
- Setup Go проект + зависимости (Gin, DeepL, CORS)
- Установить yt-dlp
- Endpoint: `GET /api/subtitles?url=YOUTUBE_URL`
  - Скачивает субтитры через yt-dlp
  - Парсит VTT/SRT → JSON
  - Возвращает массив [{start, end, text}]
- Endpoint: `POST /api/translate`
  - Принимает текст
  - Переводит через DeepL API (EN → RU)
  - Возвращает перевод
- Health check endpoint

**Результат:** Backend работает локально, можно тестировать через curl

---

### Этап 2: Mobile App - Core (День 3-5)
**Цель:** Скачивание аудио и воспроизведение с субтитрами

**Задачи:**
- Setup Expo проект + зависимости
- YouTube URL input screen
- Скачивание аудио через react-native-ytdl + expo-file-system
- Загрузка субтитров с бэкенда
- Audio player (expo-av)
- Синхронизация субтитров с аудио
- UI: показ текущего субтитра

**Результат:** Можно вставить YouTube URL, скачать аудио, слушать с субтитрами

---

### Этап 3: Voice Control (День 6-7)
**Цель:** Голосовое управление и перевод

**Задачи:**
- Интеграция @react-native-voice/voice
- Распознавание команды "STOP"
  - Пауза аудио
  - Извлечение последних 10 секунд субтитров
  - Запрос перевода к бэкенду
  - TTS озвучка перевода (expo-speech)
  - Показ перевода в UI
- Распознавание команды "Continue"
  - Возобновление аудио

**Результат:** Полный MVP flow работает

---

### Этап 4: Testing & Polish (День 8-10)
**Цель:** Стабильность и UX

**Задачи:**
- Тестирование на реальном 7-часовом видео
- Error handling (нет субтитров, нет интернета, ошибки API)
- Loading states и progress indicators
- UI/UX улучшения
- Bug fixes

**Результат:** Готовый MVP для использования

---

## 💰 Стоимость

### Development:
- **Time:** 7-10 дней
- **Cost:** $0

### Production (monthly):
- **VPS** (minimal): $5-10/month (или бесплатный tier Railway/Fly.io)
- **DeepL API:** FREE tier (500K символов/месяц = ~100 переводов/день)
- **Total:** $0-10/month

---

## 📊 Критерии успеха MVP

### Технические:
- [ ] YouTube URL → аудио скачивается на телефон
- [ ] Субтитры загружаются с бэкенда
- [ ] Аудио играет с синхронизацией субтитров
- [ ] Voice "STOP" → перевод → TTS озвучка
- [ ] Voice "Continue" → возобновление
- [ ] Работает на 7-часовом тестовом видео

### Бизнес:
- [ ] Ты сам используешь каждый день
- [ ] Решает твою проблему
- [ ] Готово показать друзьям

---

## 🚀 Getting Started

### 1. PoC Test (30 минут)

Перед началом разработки, проверь что всё работает:

```bash
# Test 1: yt-dlp скачивает субтитры?
yt-dlp --write-auto-sub --sub-lang en --skip-download "YOUR_YOUTUBE_URL"

# Test 2: У твоего 7-часового видео есть субтитры?
# Проверь что файл .en.vtt создался

# Test 3: react-native-ytdl работает?
# Создай простой Expo проект и попробуй получить ссылку на аудио
```

### 2. Backend First (День 1-2)

```bash
cd audiolearn-backend
go run main.go

# Test endpoints:
curl "http://localhost:8080/api/subtitles?url=YOUTUBE_URL"
curl -X POST "http://localhost:8080/api/translate" -d '{"text":"hello"}'
```

### 3. Mobile App (День 3-7)

```bash
cd audiolearn-mobile
npx expo start

# Test на эмуляторе/реальном устройстве
```

### 4. Deploy Backend (когда готов)

```bash
# TBD - выбрать VPS/Railway/Fly.io
```

---

## 📝 Структура проекта

```
audiolearn/
├── audiolearn-backend/    # Go backend (отдельный репозиторий)
│   ├── main.go
│   ├── handlers/
│   │   ├── subtitles.go
│   │   └── translate.go
│   ├── utils/
│   │   └── vtt_parser.go
│   ├── go.mod
│   └── README.md
│
└── audiolearn-mobile/     # React Native (отдельный репозиторий)
    ├── App.tsx
    ├── src/
    │   ├── screens/
    │   │   ├── HomeScreen.tsx
    │   │   └── PlayerScreen.tsx
    │   ├── components/
    │   │   ├── AudioPlayer.tsx
    │   │   ├── SubtitleView.tsx
    │   │   └── VoiceControl.tsx
    │   ├── hooks/
    │   │   ├── useAudioPlayer.ts
    │   │   ├── useVoiceControl.ts
    │   │   └── useSubtitles.ts
    │   └── services/
    │       ├── api.ts
    │       └── youtube.ts
    ├── package.json
    └── README.md
```

---

## ✅ Ready to start?

**Следующие шаги:**
1. ✅ Проверить PoC (yt-dlp + react-native-ytdl)
2. ✅ Создать `audiolearn-backend` репозиторий
3. ✅ Создать `audiolearn-mobile` репозиторий
4. ✅ Начать с Backend (Day 1-2)
5. ✅ Параллельно Mobile (Day 3-7)

Давай начнём! 🚀