# Backend Implementation Guide (Go)

## Роль Backend

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │────1───▶│   Backend   │────2───▶│   YouTube   │
│ React Native│         │     (Go)    │◀───3────│             │
└─────────────┘         └─────────────┘         └─────────────┘
       │                       │
       │                       │
       └───────4────────────────┘
              (Direct Download)
```

### Backend делает:
1. ✅ Принимает YouTube URL от клиента
2. ✅ Вызывает `yt-dlp` для парсинга YouTube
3. ✅ Извлекает прямую ссылку на аудио + metadata
4. ✅ Возвращает ссылку клиенту (~10KB JSON)

### Backend НЕ делает:
- ❌ НЕ скачивает аудио файл
- ❌ НЕ хранит аудио файл
- ❌ НЕ проксирует трафик
- ❌ НЕ тратит bandwidth (для 100MB аудио backend передает только 10KB)

---

## API Specification

### 1. Get Metadata + Audio URL (Recommended)

**Endpoint:** `POST /api/youtube/metadata`

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "title": "Rick Astley - Never Gonna Give You Up",
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "duration": 213,
  "author": "Rick Astley",
  "audioUrl": "https://rr4---sn-25ge7nsk.googlevideo.com/videoplayback?expire=1729..."
}
```

### 2. Get Audio URL Only (Optional)

**Endpoint:** `POST /api/youtube/audio-url`

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "audioUrl": "https://rr4---sn-25ge7nsk.googlevideo.com/videoplayback?expire=1729..."
}
```

### Error Response:
```json
{
  "error": "failed to fetch video information"
}
```

---

## Go Implementation

### 1. Install yt-dlp

```bash
# Ubuntu/Debian
sudo apt install yt-dlp

# macOS
brew install yt-dlp

# Или через pip
pip install yt-dlp

# Проверка
yt-dlp --version
```

### 2. YouTube Service (`internal/services/youtube.go`)

```go
package services

import (
	"encoding/json"
	"fmt"
	"os/exec"
)

type YouTubeInfo struct {
	Title     string `json:"title"`
	Thumbnail string `json:"thumbnail"`
	Duration  int    `json:"duration"`
	Author    string `json:"author"`
	AudioURL  string `json:"audioUrl"`
}

type YouTubeService struct{}

func NewYouTubeService() *YouTubeService {
	return &YouTubeService{}
}

// ExtractInfo gets metadata and direct audio URL from YouTube
func (s *YouTubeService) ExtractInfo(url string) (*YouTubeInfo, error) {
	cmd := exec.Command("yt-dlp",
		"--dump-json",       // Output JSON
		"--no-playlist",     // Don't download playlists
		"-f", "bestaudio",   // Best audio quality
		"--no-warnings",     // Suppress warnings
		url,
	)

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to execute yt-dlp: %w", err)
	}

	var data map[string]interface{}
	if err := json.Unmarshal(output, &data); err != nil {
		return nil, fmt.Errorf("failed to parse yt-dlp output: %w", err)
	}

	// Parse duration
	duration := 0
	if d, ok := data["duration"].(float64); ok {
		duration = int(d)
	}

	// Get thumbnail
	thumbnail := ""
	if thumb, ok := data["thumbnail"].(string); ok {
		thumbnail = thumb
	}

	// Get direct audio URL
	audioURL := ""
	if url, ok := data["url"].(string); ok {
		audioURL = url
	}

	return &YouTubeInfo{
		Title:     getString(data, "title"),
		Thumbnail: thumbnail,
		Duration:  duration,
		Author:    getString(data, "uploader"),
		AudioURL:  audioURL,
	}, nil
}

// ExtractAudioURL gets only the direct audio URL
func (s *YouTubeService) ExtractAudioURL(url string) (string, error) {
	cmd := exec.Command("yt-dlp",
		"-f", "bestaudio",
		"--get-url",         // Only output the URL
		"--no-playlist",
		"--no-warnings",
		url,
	)

	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get audio url: %w", err)
	}

	return string(output), nil
}

func getString(data map[string]interface{}, key string) string {
	if val, ok := data[key].(string); ok {
		return val
	}
	return ""
}
```

### 3. HTTP Handlers (`internal/handlers/youtube.go`)

```go
package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"your-project/internal/services"
)

type YouTubeHandler struct {
	service *services.YouTubeService
}

func NewYouTubeHandler(service *services.YouTubeService) *YouTubeHandler {
	return &YouTubeHandler{service: service}
}

type MetadataRequest struct {
	URL string `json:"url"`
}

type AudioURLRequest struct {
	URL string `json:"url"`
}

type AudioURLResponse struct {
	AudioURL string `json:"audioUrl"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

// GetMetadata handles POST /api/youtube/metadata
func (h *YouTubeHandler) GetMetadata(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req MetadataRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("failed to decode request: %v", err)
		respondError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.URL == "" {
		respondError(w, "url is required", http.StatusBadRequest)
		return
	}

	log.Printf("extracting info for: %s", req.URL)

	info, err := h.service.ExtractInfo(req.URL)
	if err != nil {
		log.Printf("failed to extract info: %v", err)
		respondError(w, "failed to fetch video information", http.StatusInternalServerError)
		return
	}

	respondJSON(w, info, http.StatusOK)
}

// GetAudioURL handles POST /api/youtube/audio-url
func (h *YouTubeHandler) GetAudioURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AudioURLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("failed to decode request: %v", err)
		respondError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.URL == "" {
		respondError(w, "url is required", http.StatusBadRequest)
		return
	}

	log.Printf("extracting audio url for: %s", req.URL)

	audioURL, err := h.service.ExtractAudioURL(req.URL)
	if err != nil {
		log.Printf("failed to extract audio url: %v", err)
		respondError(w, "failed to get audio download link", http.StatusInternalServerError)
		return
	}

	respondJSON(w, AudioURLResponse{AudioURL: audioURL}, http.StatusOK)
}

func respondJSON(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, message string, status int) {
	respondJSON(w, ErrorResponse{Error: message}, status)
}
```

### 4. Router Setup (добавить в `main.go`)

```go
package main

import (
	"log"
	"net/http"
	"your-project/internal/handlers"
	"your-project/internal/services"
)

func main() {
	// Initialize services
	youtubeService := services.NewYouTubeService()
	youtubeHandler := handlers.NewYouTubeHandler(youtubeService)

	// Setup routes
	mux := http.NewServeMux()

	mux.HandleFunc("/api/youtube/metadata", youtubeHandler.GetMetadata)
	mux.HandleFunc("/api/youtube/audio-url", youtubeHandler.GetAudioURL)

	// CORS middleware
	corsHandler := enableCORS(mux)

	// Start server
	port := ":3000"
	log.Printf("server starting on %s", port)
	if err := http.ListenAndServe(port, corsHandler); err != nil {
		log.Fatal(err)
	}
}

// CORS middleware for React Native
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
```

---

## Тестирование

### Local Testing

```bash
# Start server
go run cmd/server/main.go

# Test metadata endpoint
curl -X POST http://localhost:3000/api/youtube/metadata \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Expected response:
{
  "title": "Rick Astley - Never Gonna Give You Up",
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "duration": 213,
  "author": "Rick Astley",
  "audioUrl": "https://rr4---sn-..."
}
```

### Test with frontend

В `config/api.ts` уже настроен URL:

```typescript
export const API_CONFIG = {
  baseUrl: __DEV__
    ? 'http://localhost:3000/api' // Ваш Go backend
    : 'https://your-backend.com/api',
};
```

---

## Дополнительные улучшения (опционально)

### 1. Кеширование (прямые ссылки живут ~6 часов)

```go
import (
	"sync"
	"time"
)

type CacheItem struct {
	Data      *YouTubeInfo
	ExpiresAt time.Time
}

type Cache struct {
	items map[string]*CacheItem
	mu    sync.RWMutex
}

func (s *YouTubeService) ExtractInfoWithCache(url string) (*YouTubeInfo, error) {
	// Check cache
	if cached := s.cache.Get(url); cached != nil {
		return cached, nil
	}

	// Fetch from YouTube
	info, err := s.ExtractInfo(url)
	if err != nil {
		return nil, err
	}

	// Cache for 5 hours
	s.cache.Set(url, info, 5*time.Hour)
	return info, nil
}
```

### 2. Rate Limiting

```go
import "golang.org/x/time/rate"

var limiter = rate.NewLimiter(rate.Limit(10), 10) // 10 req/sec

func rateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !limiter.Allow() {
			http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}
```

### 3. Timeout

```go
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

cmd := exec.CommandContext(ctx, "yt-dlp", ...)
```

---

## Важные замечания

1. **Прямые ссылки живут ~6 часов** для одного IP
2. **YouTube может блокировать** при слишком частых запросах (используй rate limiting)
3. **yt-dlp нужно обновлять** регулярно: `yt-dlp -U`
4. **Обработка ошибок:**
   - Invalid YouTube URL
   - Video unavailable (private/deleted)
   - Geographic restrictions
   - Age-restricted content

---

## Checklist

- [ ] Установлен `yt-dlp` на сервере
- [ ] Добавлены `internal/services/youtube.go`
- [ ] Добавлены `internal/handlers/youtube.go`
- [ ] Обновлен `main.go` с роутами
- [ ] Включен CORS для React Native
- [ ] Протестировано с `curl`
- [ ] Frontend обновлен с правильным URL в `config/api.ts`

---

## Что уже готово на Frontend

- ✅ `services/youtube.ts` обновлен для работы с API
- ✅ `react-native-ytdl` удален
- ✅ `config/api.ts` создан с конфигурацией
- ✅ Скачивание работает через `expo-file-system` напрямую с YouTube

**Осталось только:** Добавить эти endpoints на Go backend и протестировать!