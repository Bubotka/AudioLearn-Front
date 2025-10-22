# Migration from Vite to Next.js

## Summary

Successfully migrated AudioLearn web application from Vite + React Router to Next.js 15 with App Router.

## Why Next.js?

For **commercial projects** where users search for content via Google/Yandex:

- ✅ **SEO optimization** - Server-side rendering for better search indexing
- ✅ **Fast initial load** - Pages render on server, instant first paint
- ✅ **File-based routing** - Like Expo Router, automatic route generation
- ✅ **Meta tags** - Built-in support for SEO and social media previews
- ✅ **Production-ready** - Optimized builds, automatic code splitting

## Changes Made

### 1. Project Structure

**Before (Vite):**
```
src/
├── App.tsx          # React Router setup
├── main.tsx
├── pages/
├── components/
└── hooks/
```

**After (Next.js):**
```
app/                 # File-based routing
├── layout.tsx      # Root layout
├── page.tsx        # Home page (/)
└── player/
    └── [id]/
        └── page.tsx # /player/:id
components/
hooks/
services/
```

### 2. Routing Changes

| Vite + React Router | Next.js |
|---------------------|---------|
| `import { useNavigate } from 'react-router-dom'` | `import { useRouter } from 'next/navigation'` |
| `const navigate = useNavigate()` | `const router = useRouter()` |
| `navigate('/player')` | `router.push('/player')` |
| `<Link to="/player">` | `<Link href="/player">` |
| `useParams()` from react-router | `useParams()` from next/navigation |

### 3. Client Components

Added `'use client'` directive to components using:
- `useState`, `useEffect` (React hooks)
- Event handlers (`onClick`, etc.)
- Browser APIs (`localStorage`, `window`)

### 4. Import Paths

Updated to use `@/` alias:
```typescript
// Before
import { useAudiobooks } from '../hooks/useAudiobooks';

// After
import { useAudiobooks } from '@/hooks/useAudiobooks';
```

### 5. SEO Configuration

Added in `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: 'AudioLearn - Learn Languages with Audiobooks',
  description: 'Interactive audiobook platform for language learning',
  keywords: ['audiobooks', 'language learning', 'english learning'],
  openGraph: {
    title: 'AudioLearn',
    description: 'Interactive audiobook platform',
    type: 'website',
  },
};
```

## File Mapping

| Old File (Vite) | New File (Next.js) |
|-----------------|-------------------|
| `src/App.tsx` | `app/layout.tsx` |
| `src/pages/HomePage.tsx` | `app/page.tsx` |
| `src/pages/PlayerPage.tsx` | `app/player/[id]/page.tsx` |
| `src/components/*` | `components/*` (copied) |
| `src/hooks/*` | `hooks/*` (copied) |
| `src/services/*` | `services/*` (copied) |

## Development

```bash
cd web
npm install
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build
npm start        # Start production server
```

## Backup

Old Vite project preserved in: `web-vite-backup/`

## Next Steps

1. ✅ Test all features in browser
2. ✅ Verify SEO meta tags with browser inspector
3. ✅ Test dynamic routes (`/player/:id`)
4. ✅ Ensure localStorage works correctly
5. ✅ Test audio playback and subtitles
6. 🔜 Deploy to production (Vercel recommended for Next.js)

## Deployment

Recommended platform: **Vercel** (creators of Next.js)

```bash
npm install -g vercel
vercel
```

Or use:
- **Netlify**
- **Cloudflare Pages**
- **Self-hosted** with `npm run build && npm start`

## Key Benefits Achieved

✅ **Better SEO** - Google can now index your audiobooks
✅ **Faster load** - Server-side rendering
✅ **File-based routing** - Like Expo Router you're familiar with
✅ **Modern stack** - Next.js 15 + React 19
✅ **Production-ready** - Optimized for commercial use
