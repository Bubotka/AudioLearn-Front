# AudioLearn Web

Modern web application for language learning with audiobooks, built with Next.js.

## Tech Stack

- **Next.js 15** - React framework with App Router (file-based routing)
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React 19** - Latest React version

## Project Structure

```
web/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with SEO meta tags
│   ├── page.tsx           # Home page (/)
│   ├── globals.css        # Global styles
│   └── player/
│       └── [id]/
│           └── page.tsx   # Player page (/player/:id)
├── components/            # Reusable React components
│   ├── ClickableSubtitles.tsx
│   ├── SubtitleParagraphItem.tsx
│   └── SubtitleParagraphList.tsx
├── hooks/                 # Custom React hooks
│   └── useAudiobooks.ts
├── services/              # Business logic
│   └── storage.ts
└── public/                # Static assets
```

## File-based Routing

Next.js automatically creates routes from the file structure:

- `app/page.tsx` → `/`
- `app/player/[id]/page.tsx` → `/player/:id`

This is similar to Expo Router in React Native!

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
npm start
```

## SEO Features

- Server-side rendering (SSR)
- Meta tags for search engines
- Open Graph tags for social media
- Semantic HTML structure

## Migration from Vite

This project was migrated from Vite to Next.js for better SEO and commercial use:

### Changes:
- ✅ `useNavigate()` → `useRouter()`
- ✅ `<Link to>` → `<Link href>`
- ✅ React Router → Next.js App Router (file-based)
- ✅ Added SEO meta tags
- ✅ All components marked as `'use client'` where needed
- ✅ Import paths updated to use `@/` alias

### Old Vite project backed up to: `web-vite-backup/`
