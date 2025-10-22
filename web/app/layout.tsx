import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AudioLearn - Learn Languages with Audiobooks',
  description: 'Interactive audiobook platform for language learning with synchronized subtitles and instant translations',
  keywords: ['audiobooks', 'language learning', 'english learning', 'subtitles', 'translation'],
  openGraph: {
    title: 'AudioLearn - Learn Languages with Audiobooks',
    description: 'Interactive audiobook platform for language learning',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
