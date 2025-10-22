import type { Subtitle, SubtitleParagraph } from '../types/audiobook';

interface GroupingOptions {
  maxPauseSeconds?: number;
  maxParagraphLength?: number;
  minSubtitlesPerParagraph?: number;
}

const DEFAULT_OPTIONS = {
  maxPauseSeconds: 1,
  maxParagraphLength: 250,
  minSubtitlesPerParagraph: 2,
};

export function groupSubtitlesIntoParagraphs(
  subtitles: Subtitle[],
  options?: GroupingOptions
): SubtitleParagraph[] {
  if (!subtitles || subtitles.length === 0) {
    return [];
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  const paragraphs: SubtitleParagraph[] = [];
  let currentGroup: Subtitle[] = [];
  let currentText = '';

  for (let i = 0; i < subtitles.length; i++) {
    const subtitle = subtitles[i];
    const nextSubtitle = subtitles[i + 1];

    currentGroup.push(subtitle);
    currentText += (currentText ? ' ' : '') + subtitle.text;

    const pauseToNext = nextSubtitle
      ? nextSubtitle.start - subtitle.end
      : 0;

    const shouldEndParagraph =
      !nextSubtitle ||
      pauseToNext > opts.maxPauseSeconds ||
      currentText.length > opts.maxParagraphLength;

    if (shouldEndParagraph && currentGroup.length >= opts.minSubtitlesPerParagraph) {
      paragraphs.push({
        id: `paragraph-${paragraphs.length}`,
        paragraphIndex: paragraphs.length,
        startTime: currentGroup[0].start,
        endTime: currentGroup[currentGroup.length - 1].end,
        text: currentText,
        subtitles: [...currentGroup],
      });

      currentGroup = [];
      currentText = '';
    } else if (shouldEndParagraph && nextSubtitle) {
      continue;
    }
  }

  if (currentGroup.length > 0) {
    paragraphs.push({
      id: `paragraph-${paragraphs.length}`,
      paragraphIndex: paragraphs.length,
      startTime: currentGroup[0].start,
      endTime: currentGroup[currentGroup.length - 1].end,
      text: currentText,
      subtitles: [...currentGroup],
    });
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