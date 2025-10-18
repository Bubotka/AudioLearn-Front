# Fix Backend Audio Format

## Проблема:
Backend сейчас качает **itag=249** (WebM Opus 50kbps) - очень низкое качество.

## Решение:

Измени команду `yt-dlp` в backend (`internal/services/youtube.go`):

### ❌ Текущий код (плохо):
```go
cmd := exec.Command("yt-dlp",
    "--dump-json",
    "--no-playlist",
    "-f", "bestaudio",  // ⬅️ Выбирает самое маленькое аудио!
    "--no-warnings",
    url,
)
```

### ✅ Исправленный код (хорошо):
```go
cmd := exec.Command("yt-dlp",
    "--dump-json",
    "--no-playlist",
    "-f", "bestaudio[ext=m4a]/bestaudio",  // ⬅️ Приоритет на M4A AAC 128kbps
    "--no-warnings",
    url,
)
```

## Форматы аудио (от лучшего к худшему):

| itag | Формат      | Битрейт | Качество  | Размер (10 мин) |
|------|-------------|---------|-----------|-----------------|
| 140  | M4A AAC     | 128kbps | Отлично   | ~9.6 MB         |
| 251  | WebM Opus   | 160kbps | Отлично   | ~12 MB          |
| 250  | WebM Opus   | 70kbps  | Нормально | ~5.2 MB         |
| 249  | WebM Opus   | 50kbps  | Плохо     | ~3.7 MB         |

## Альтернативные варианты:

### Вариант 1: Только M4A (лучшая совместимость):
```go
"-f", "140/bestaudio[ext=m4a]/bestaudio"
```

### Вариант 2: Максимальное качество:
```go
"-f", "bestaudio[abr>=128]/bestaudio"  // Минимум 128kbps
```

### Вариант 3: Баланс качества и размера:
```go
"-f", "251/140/bestaudio"  // Приоритет: Opus 160kbps → AAC 128kbps → любое
```

## После изменений:

1. Перезапусти backend:
```bash
go run main.go
```

2. Проверь что возвращается:
```bash
curl -X POST http://localhost:8080/api/youtube/metadata \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
  | jq -r '.audioUrl' | grep -oP 'itag=\d+'
```

Должно быть: `itag=140` или `itag=251` (не 249!)

## Почему медленно качалось:

**itag=249 (50kbps)** → Файл ~3-4 MB на 10 минут
- Маленький размер = быстро качается, **НО**
- YouTube может ограничивать скорость на низкокачественные форматы
- Плохое качество звука

**itag=140 (128kbps)** → Файл ~9-10 MB на 10 минут
- В 2.5 раза больше размер
- YouTube даёт полную скорость
- Отличное качество

---

**Рекомендую:** Используй формат `140/bestaudio[ext=m4a]/bestaudio`
