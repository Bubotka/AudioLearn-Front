import type { Subtitle, SubtitleParagraph } from '../types/audiobook';

const PAUSE_THRESHOLD = 1.5; // seconds

export function groupSubtitlesIntoParagraphs(subtitles: Subtitle[]): SubtitleParagraph[] {
  if (!subtitles || subtitles.length === 0) {
    return [];
  }

  const paragraphs: SubtitleParagraph[] = [];
  let currentParagraph: Subtitle[] = [];

  for (let i = 0; i < subtitles.length; i++) {
    const current = subtitles[i];
    const next = subtitles[i + 1];

    currentParagraph.push(current);

    const shouldBreak =
      !next || (next.start - current.end > PAUSE_THRESHOLD);

    if (shouldBreak) {
      paragraphs.push({
        paragraphIndex: paragraphs.length,
        subtitles: currentParagraph,
        text: currentParagraph.map((s) => s.text).join(' '),
        startTime: currentParagraph[0].start,
        endTime: currentParagraph[currentParagraph.length - 1].end,
      });
      currentParagraph = [];
    }
  }

  return paragraphs;
}

export function findParagraphAtTime(
  paragraphs: SubtitleParagraph[],
  currentTime: number
): number {
  return paragraphs.findIndex(
    (p) => currentTime >= p.startTime && currentTime <= p.endTime
  );
}