import type { Subtitle, SubtitleParagraph } from '../types/audiobook';

const MAX_PAUSE_SECONDS = 1;
const MAX_PARAGRAPH_LENGTH = 250;
const MIN_SUBTITLES_PER_PARAGRAPH = 2;

export function groupSubtitlesIntoParagraphs(subtitles: Subtitle[]): SubtitleParagraph[] {
  if (!subtitles || subtitles.length === 0) {
    return [];
  }

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
      pauseToNext > MAX_PAUSE_SECONDS ||
      currentText.length > MAX_PARAGRAPH_LENGTH;

    if (shouldEndParagraph && currentGroup.length >= MIN_SUBTITLES_PER_PARAGRAPH) {
      paragraphs.push({
        id: `paragraph-${paragraphs.length}`,
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
      startTime: currentGroup[0].start,
      endTime: currentGroup[currentGroup.length - 1].end,
      text: currentText,
      subtitles: [...currentGroup],
    });
  }

  return paragraphs;
}