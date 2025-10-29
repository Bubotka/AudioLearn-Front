# Claude Memory

## ⚠️ ВАЖНЫЕ ИНСТРУКЦИИ ⚠️

- **НИКОГДА** не упоминай Claude, Claude Code или Anthropic в сообщениях коммитов или генерируемом коде
- **НИКОГДА** не добавляй теги вроде "Generated with Claude Code" ни в какие материалы

## Дополнительные ресурсы и руководства

- [Uber Go Style Guide](./UBER_GO_CODESTYLE.md) - руководство по стилю кода Go от Uber
- [Effective Go](https://golang.org/doc/effective_go) - официальное руководство по идиоматическому Go

При работе с Go-проектами всегда следуй принципам Effective Go и руководству по стилю Uber Go.

## Руководство по оформлению Git-коммитов

Цель: Создать одно сообщение в формате Conventional Commit.

## Стиль кода и коммуникация

### Общие принципы для кода:

- Строго следуй стилю и соглашениям, уже используемым в проекте
- Используй строки длиной не более 80-100 символов, если в проекте не указано иное
- Следуй принципам чистого кода — читаемость и понятность
- Избегай избыточных комментариев, но документируй сложную логику, подчёркиваю реально сложную и API

### Сообщения об ошибках и логи:

- Начинай с маленькой буквы
- Будь лаконичным и информативным
- Пример: `log.Error("failed to connect to api", zap.Error(err))`

### Язык кода и комментариев:

- Весь код, комментарии, названия переменных и функций должны быть на английском языке
- Следуй принятым в индустрии стандартам для каждого языка программирования
- Комментарии должны быть краткими и сосредоточенными на функциональности

### Для Go-проектов:

- Строго следуй принципам [Effective Go](https://golang.org/doc/effective_go)
- Придерживайся рекомендаций [Uber Go Style Guide](./UBER_GO_CODESTYLE.md)
- Используй идиоматический Go, включая:
    - Обработку ошибок как возвращаемых значений
    - Использование интерфейсов для абстракции
    - Следование стандартным соглашениям об именовании
    - Применение стандартных пакетов библиотеки Go

### Для React Native / Expo проектов:

**ВАЖНО:** Используем СОВРЕМЕННЫЙ подход с Expo Router (file-based routing).

#### Структура проекта:

```
project/
├── app/                    # Expo Router - файловая маршрутизация
│   ├── _layout.tsx        # Root layout (главный навигатор)
│   ├── index.tsx          # Home screen (маршрут /)
│   ├── player.tsx         # Player screen (маршрут /player)
│   └── [id].tsx           # Динамические маршруты
├── components/            # Переиспользуемые компоненты
├── hooks/                 # Custom React hooks
├── services/              # API, business logic
├── types/                 # TypeScript типы и интерфейсы
├── global.css             # Tailwind CSS
├── tailwind.config.js     # Конфигурация Tailwind
├── metro.config.js        # Metro bundler config
├── babel.config.js        # Babel config
└── app.json               # Expo config
```

**НЕ используй:**
- ❌ Старый подход с `App.tsx` в корне
- ❌ `src/` директорию для роутинга
- ❌ React Navigation напрямую (Expo Router - это обёртка над ним)
- ❌ StyleSheet (используй NativeWind/Tailwind)

#### Стилизация:

**Используй NativeWind (Tailwind CSS для React Native):**

```tsx
// ✅ Правильно
<View className="flex-1 bg-gray-100 p-5">
  <Text className="text-2xl font-bold text-center">Title</Text>
</View>

// ❌ Неправильно
<View style={styles.container}>
  <Text style={styles.title}>Title</Text>
</View>
const styles = StyleSheet.create({ ... });
```

**Конфигурация NativeWind:**

1. `tailwind.config.js`:
```javascript
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};
```

2. `metro.config.js`:
```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });
```

3. `babel.config.js`:
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

4. `app/_layout.tsx` (импорт CSS):
```tsx
import '../global.css';
```

#### Expo Router - файловая маршрутизация:

**Маршруты создаются автоматически из структуры файлов:**

```
app/
├── _layout.tsx           → Layout (не маршрут)
├── index.tsx             → /
├── about.tsx             → /about
├── user/
│   ├── _layout.tsx      → Layout для /user/*
│   ├── [id].tsx         → /user/123 (динамический)
│   └── settings.tsx     → /user/settings
└── (tabs)/              → Группа (скобки = не в URL)
    ├── _layout.tsx      → Tab navigator
    ├── home.tsx         → /home
    └── profile.tsx      → /profile
```

**Навигация:**

```tsx
// Link компонент
import { Link } from 'expo-router';
<Link href="/player">Go to Player</Link>

// Программная навигация
import { router } from 'expo-router';
router.push('/player');
router.replace('/home');
router.back();
```

**Layout файлы (_layout.tsx):**

```tsx
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f5f5f5' },
      }}>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="player" options={{ title: 'Player' }} />
    </Stack>
  );
}
```

#### TypeScript:

- Всегда используй строгую типизацию
- Определяй интерфейсы в `types/`
- Избегай `any`, используй `unknown` если тип неизвестен
- Используй type-safety для navigation params

```tsx
// types/index.ts
export interface Subtitle {
  start: number;
  end: number;
  text: string;
}

// Использование
import type { Subtitle } from '@/types';
```

#### Именование компонентов:

- Компоненты: `PascalCase` (HomeScreen.tsx, AudioPlayer.tsx)
- Хуки: `camelCase` с префиксом `use` (useAudioPlayer.ts)
- Утилиты: `camelCase` (formatTime.ts, validateUrl.ts)
- Константы: `UPPER_SNAKE_CASE`

#### Конфигурация app.json:

```json
{
  "expo": {
    "scheme": "appname",
    "web": { "bundler": "metro" },
    "plugins": ["expo-router"]
  }
}
```

#### Context7 для документации:

**ВСЕГДА** используй Context7 (mcp__context7) для получения актуальной документации:

```
1. mcp__context7__resolve-library-id - найти библиотеку
2. mcp__context7__get-library-docs - получить документацию
```

**Примеры:**
- Expo Router: `/expo/expo`
- NativeWind: `/websites/nativewind_dev`
- React Native: поиск по названию

---

## Трекинг прогресса и документация

- **ВСЕГДА** обновляй PROGRESS.md после выполнения задач
- Если работаешь над платежной системой, обновляй также PAYMENT_TASK_PROGRESS.md
- При изменении архитектуры или принятии важных решений:
  - Обновляй соответствующие документы (PAYMENT_SYSTEM_ARCHITECTURE.md, PRODUCT_ROADMAP.md)
  - Фиксируй решения в секции "Notes & Decisions" с датой
- Перед началом новой крупной фичи проверь PRODUCT_ROADMAP.md для понимания долгосрочной архитектуры

## Архитектура и чистый код

- Пишем чистый код, соблюдаем best practices. Если я уже прошу написать плохой код, допустим для mvp
то тогда можно схалтурить, а так нет - пишем хорошо. Критикуй меня, а не соглашайся со всем, что я скажу.

## Процесс разработки

- Ты делаешь едиты в код маленькими частями, чтобы я мог сразу делать ревью и вьезжать в код. Маленькими частями это когда я вижу изменения без скролинга окна и всё равно желательно ещё сильнее дробить если можно. Это нужно чтобы я был постоянно в контексте и поспевал за тобой.

## Документация проекта

- [PROGRESS.md](./PROGRESS.md) - общий прогресс по проекту
- [PAYMENT_TASK_PROGRESS.md](./PAYMENT_TASK_PROGRESS.md) - детальный прогресс платежной системы
- [PAYMENT_SYSTEM_ARCHITECTURE.md](./PAYMENT_SYSTEM_ARCHITECTURE.md) - архитектура платежей
- [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) - общий план продукта и долгосрочное видение
- [MVP-PLAN.md](./MVP-PLAN.md) - план MVP
