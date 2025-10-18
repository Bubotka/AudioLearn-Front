# Backend Proxy для ускорения скачивания

## Проблема:
YouTube ограничивает скорость прямых ссылок → медленное скачивание

## Решение:
Backend проксирует скачивание с поддержкой Range requests (многопоточное скачивание)

---

## Backend Implementation (Go)

### 1. Добавь новый endpoint для проксирования

**`internal/handlers/youtube.go`** - добавь новый handler:

```go
package handlers

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"your-project/internal/services"
)

type ProxyRequest struct {
	URL string `json:"url"`
}

// ProxyAudio handles audio streaming with Range support
func (h *YouTubeHandler) ProxyAudio(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ProxyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("failed to decode request: %v", err)
		respondError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.URL == "" {
		respondError(w, "url is required", http.StatusBadRequest)
		return
	}

	log.Printf("proxying audio from: %s", req.URL)

	// Create request to YouTube
	client := &http.Client{
		Timeout: 0, // No timeout for streaming
	}

	youtubeReq, err := http.NewRequest("GET", req.URL, nil)
	if err != nil {
		log.Printf("failed to create request: %v", err)
		respondError(w, "failed to create request", http.StatusInternalServerError)
		return
	}

	// Forward Range header if present (for multi-threaded download)
	if rangeHeader := r.Header.Get("Range"); rangeHeader != "" {
		youtubeReq.Header.Set("Range", rangeHeader)
	}

	// Get response from YouTube
	resp, err := client.Do(youtubeReq)
	if err != nil {
		log.Printf("failed to fetch from youtube: %v", err)
		respondError(w, "failed to fetch audio", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Copy headers from YouTube response
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}

	// Set status code
	w.WriteHeader(resp.StatusCode)

	// Stream data to client
	written, err := io.Copy(w, resp.Body)
	if err != nil {
		log.Printf("error streaming data: %v", err)
		return
	}

	log.Printf("proxied %d bytes successfully", written)
}
```

### 2. Добавь роут в `main.go`:

```go
func main() {
	// ... existing code ...

	mux.HandleFunc("/api/youtube/metadata", youtubeHandler.GetMetadata)
	mux.HandleFunc("/api/youtube/audio-url", youtubeHandler.GetAudioURL)
	mux.HandleFunc("/api/youtube/proxy-audio", youtubeHandler.ProxyAudio) // NEW

	// ... rest of code ...
}
```

### 3. Улучшение: Кеширование (опционально)

Для ещё большей скорости можно кешировать аудио:

```go
import (
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path/filepath"
)

const cacheDir = "/tmp/audio-cache"

func (h *YouTubeHandler) ProxyAudio(w http.ResponseWriter, r *http.Request) {
	// ... decode request ...

	// Generate cache key
	hash := sha256.Sum256([]byte(req.URL))
	cacheKey := hex.EncodeToString(hash[:])
	cachePath := filepath.Join(cacheDir, cacheKey)

	// Check if cached
	if fileInfo, err := os.Stat(cachePath); err == nil {
		log.Printf("serving from cache: %s", cacheKey)

		// Serve cached file with Range support
		http.ServeFile(w, r, cachePath)
		return
	}

	// Download and cache
	log.Printf("downloading and caching: %s", cacheKey)

	// Create temp file
	tempFile, err := os.CreateTemp(cacheDir, "download-*.tmp")
	if err != nil {
		log.Printf("failed to create temp file: %v", err)
		respondError(w, "failed to cache", http.StatusInternalServerError)
		return
	}
	defer os.Remove(tempFile.Name())

	// Download from YouTube
	resp, err := http.Get(req.URL)
	if err != nil {
		log.Printf("failed to fetch: %v", err)
		respondError(w, "failed to fetch audio", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Write to temp file and response simultaneously
	multiWriter := io.MultiWriter(tempFile, w)

	// Copy headers
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}
	w.WriteHeader(resp.StatusCode)

	// Stream and cache
	io.Copy(multiWriter, resp.Body)
	tempFile.Close()

	// Move to cache
	os.Rename(tempFile.Name(), cachePath)
	log.Printf("cached: %s", cacheKey)
}
```

---

## Frontend Implementation

### Обнови `config/api.ts`:

```typescript
export const API_ENDPOINTS = {
  youtube: {
    metadata: '/youtube/metadata',
    audioUrl: '/youtube/audio-url',
    proxyAudio: '/youtube/proxy-audio', // NEW
  },
} as const;
```

### Обнови `services/youtube.ts`:

Добавь функцию для получения proxy URL:

```typescript
async getProxyAudioUrl(youtubeUrl: string): Promise<string> {
  try {
    // Сначала получаем прямую ссылку с YouTube
    const response = await fetch(
      `${API_CONFIG.baseUrl}${API_ENDPOINTS.youtube.audioUrl}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: youtubeUrl }),
      }
    );

    if (!response.ok) {
      throw new Error(`backend request failed: ${response.status}`);
    }

    const data: { audioUrl: string } = await response.json();

    // Возвращаем URL для проксирования через backend
    return `${API_CONFIG.baseUrl}${API_ENDPOINTS.youtube.proxyAudio}?url=${encodeURIComponent(data.audioUrl)}`;
  } catch (error) {
    console.error('failed to get proxy audio URL:', error);
    throw new Error('failed to get audio download link', { cause: error });
  }
},
```

### Обнови `services/downloadManager.ts`:

```typescript
export async function startDownload(audiobook: Audiobook) {
  // ... existing code ...

  try {
    let audioUrl = audiobook.audioUrl;

    if (!audioUrl) {
      console.log('fetching audio url from backend...');

      // Используем proxy URL вместо прямой ссылки
      const metadata = await youtubeService.getMetadata(audiobook.youtubeUrl);
      audioUrl = metadata.audioUrl;

      // Конвертируем в proxy URL
      audioUrl = `${API_CONFIG.baseUrl}${API_ENDPOINTS.youtube.proxyAudio}`;

      await audiobookStorage.update(audiobook.id, {
        audioUrl,
      });
    }

    // ... rest of code (download using proxy URL) ...
  }
}
```

---

## Альтернатива: Простой GET endpoint

Если не хочешь POST с JSON, можно сделать проще:

**Backend:**
```go
// GET /api/youtube/download?url=YOUTUBE_URL
func (h *YouTubeHandler) DownloadAudio(w http.ResponseWriter, r *http.Request) {
	youtubeURL := r.URL.Query().Get("url")
	if youtubeURL == "" {
		http.Error(w, "url parameter required", http.StatusBadRequest)
		return
	}

	// Extract direct audio URL
	info, err := h.service.ExtractInfo(youtubeURL)
	if err != nil {
		log.Printf("failed to extract: %v", err)
		http.Error(w, "failed to process", http.StatusInternalServerError)
		return
	}

	// Proxy audio from YouTube
	resp, err := http.Get(info.AudioURL)
	if err != nil {
		log.Printf("failed to fetch audio: %v", err)
		http.Error(w, "failed to fetch audio", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Copy headers and stream
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}
```

**Frontend:**
```typescript
// Просто используй URL напрямую
const downloadUrl = `${API_CONFIG.baseUrl}/youtube/download?url=${encodeURIComponent(youtubeUrl)}`;

// Скачивай как обычно
await FileSystem.downloadAsync(downloadUrl, fileUri);
```

---

## Преимущества Backend Proxy:

✅ **Обход ограничений YouTube** - backend может использовать VPN
✅ **Кеширование** - один раз скачал, многократно раздаёт
✅ **Range requests** - поддержка многопоточного скачивания
✅ **Стабильная скорость** - backend → client без ограничений
✅ **Контроль трафика** - можно логировать, ограничивать

## Недостатки:

❌ **Двойной трафик** - YouTube → Backend → Client
❌ **Нагрузка на backend** - нужен хороший сервер
❌ **Задержка** - небольшая задержка на проксировании

---

## Тестирование:

```bash
# 1. Запусти backend
go run main.go

# 2. Проверь что работает
curl -X POST http://localhost:8080/api/youtube/proxy-audio \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
  --output test.mp3

# 3. Проверь размер файла
ls -lh test.mp3
```

Если файл скачался - значит работает! 🎉

---

**Рекомендую:** Начни с простого GET endpoint - это проще и быстрее в реализации.
