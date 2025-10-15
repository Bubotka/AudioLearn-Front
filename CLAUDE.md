# Claude Memory

## ⚠️ ВАЖНЫЕ ИНСТРУКЦИИ ⚠️

- **НИКОГДА** не упоминай Claude, Claude Code или Anthropic в сообщениях коммитов или генерируемом коде
- **НИКОГДА** не добавляй теги вроде "Generated with Claude Code" ни в какие материалы

## Дополнительные ресурсы и руководства

- [Uber Go Style Guide](./UBER_GO_CODESTYLE.md) - руководство по стилю кода Go от Uber
- [Effective Go](https://golang.org/doc/effective_go) - официальное руководство по идиоматическому Go

При работе с Go-проектами всегда следуй принципам Effective Go и руководству по стилю Uber Go.

## Руководство по оформлению Git-коммитов

При создании сообщений для Git-коммитов следуй этим правилам:

### Стандарт сообщений коммитов

Цель: Создать одно сообщение в формате Conventional Commit.

### Структура сообщения:

**ПЕРВАЯ СТРОКА (обязательно, в самом верху)**:
Шаблон: `<тип>(<опциональная_область>): <краткое_описание>`

ПРАВИЛО: Длина первой строки ДОЛЖНА быть не более 72 символов. Оптимально ~50 символов.

`<тип>`: Проанализируй ВЕСЬ diff. Выбери ОДИН `<тип>` для основного изменения:
- feat: новая функциональность
- fix: исправление ошибки
- chore: обслуживание кода
- refactor: рефакторинг кода
- test: добавление или изменение тестов
- docs: изменение документации
- style: форматирование, отступы и т.п.
- perf: улучшение производительности
- ci: изменения в CI
- build: изменения в сборке

`<опциональная_область>`: Если основное изменение касается конкретного компонента, укажи его. Иначе опусти.

`<краткое_описание>`:
- Используй повелительное наклонение, настоящее время (например, "add taskfile utility", "fix login bug")
- НЕ используй заглавную букву в начале (например, "add", а не "Add"), если только слово не является именем собственным или аббревиатурой
- НЕ ставь точку в конце
- Кратко суммируй основную цель ВСЕХ изменений

**ТЕЛО (опционально; если используется, отделяй от первой строки ОДНОЙ пустой строкой)**:
Объясни ЧТО изменилось и ПОЧЕМУ для ВСЕХ изменений в diff.

ПРАВИЛО: КАЖДАЯ строка в теле (включая пункты списка и их подстроки) ДОЛЖНА иметь длину не более 72 символов.

Если diff включает несколько различных аспектов:
- Детализируй каждый аспект, используя маркированные пункты. Каждый пункт должен начинаться с "- ".
- Пример для детализации нескольких аспектов:
  ```
  - introduce Taskfile.yml to automate common development
    workflows, like building, running, and testing.
  - update .gitignore to exclude temporary build files.
  - refactor user tests for clarity.
  ```
- НЕ создавай новые строки, похожие на первую строку (с type:scope), внутри тела.

**НИЖНИЙ КОЛОНТИТУЛ (опционально; отделяй ОДНОЙ пустой строкой)**:
Шаблон: `BREAKING CHANGE: <описание>` ИЛИ `Closes #<issue_id>`

ПРАВИЛО: КАЖДАЯ строка в нижнем колонтитуле ДОЛЖНА иметь длину не более 72 символов.

### Пример полного сообщения коммита:

```
feat(devworkflow): introduce Taskfile and streamline development environment

This commit introduces a Taskfile to automate common development
tasks and includes related improvements to the project's development
environment and test consistency.

- add Taskfile.yml defining tasks for:
  - building project binaries and mock servers
  - running the application and associated services
  - executing functional test suites with automated setup/teardown
- modify .gitignore to exclude build artifacts, log files,
  and common IDE configuration files.
- adjust test messages in bot_test.go to ensure consistent
  casing and fix minor sensitivity issues.

Closes #135
```

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

Используй PROGRESS.md как трекер прогреса выполненных задач и не забывай его дополнять и править, после выполнения задачи
