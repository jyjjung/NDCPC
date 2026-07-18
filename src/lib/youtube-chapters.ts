import { getYouTubeTimestampFromUrl, getYouTubeVideoId } from '@/lib/video';

export type YouTubeChapter = {
  title: string;
  startSeconds: number;
  endSeconds?: number;
};

const YOUTUBE_FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
};

function unescapeYoutubeText(text: string) {
  return text
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\//g, '/');
}

export { getYouTubeTimestampFromUrl };

export function normalizeYouTubeUrl(url: string) {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) {
    return url;
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function parseYouTubeChaptersFromHtml(html: string): YouTubeChapter[] {
  const chapters: YouTubeChapter[] = [];
  const chapterPattern =
    /"chapterRenderer":\{"title":\{"simpleText":"((?:\\.|[^"\\])*)"\},"timeRangeStartMillis":(\d+)/g;

  for (const match of html.matchAll(chapterPattern)) {
    chapters.push({
      title: unescapeYoutubeText(match[1]),
      startSeconds: Math.floor(Number.parseInt(match[2], 10) / 1000),
    });
  }

  for (let index = 0; index < chapters.length - 1; index += 1) {
    chapters[index].endSeconds = chapters[index + 1].startSeconds;
  }

  return chapters;
}

export async function fetchYouTubeChapters(url: string): Promise<YouTubeChapter[]> {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) {
    return [];
  }

  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: YOUTUBE_FETCH_HEADERS,
  });

  if (!response.ok) {
    return [];
  }

  const html = await response.text();
  return parseYouTubeChaptersFromHtml(html);
}

export function formatChapterTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function findChapterIndexForTimestamp(
  chapters: YouTubeChapter[],
  timestamp: number
) {
  return chapters.findIndex((chapter) => {
    const endSeconds = chapter.endSeconds ?? Number.POSITIVE_INFINITY;
    return timestamp >= chapter.startSeconds && timestamp < endSeconds;
  });
}

export type YouTubeClipSelection = {
  startSeconds?: number;
  endSeconds?: number;
  chapterTitle?: string;
};

export const YOUTUBE_FULL_VIDEO_VALUE = 'full';
export const YOUTUBE_MARKER_VALUE = 'marker';

/**
 * Resolve a song clip from either a selected chapter or a single URL timestamp marker.
 * Timestamp-only links (e.g. youtu.be/VIDEO?t=491) must keep their start time even when
 * the watch URL is normalized without `t=`.
 */
export function resolveYouTubeClip(options: {
  chapters?: YouTubeChapter[];
  selectedChapter: string;
  fullVideoValue?: string;
  markerValue?: string;
  timestamp?: number | null;
}): YouTubeClipSelection {
  const fullVideoValue = options.fullVideoValue ?? YOUTUBE_FULL_VIDEO_VALUE;
  const markerValue = options.markerValue ?? YOUTUBE_MARKER_VALUE;
  const chapters = options.chapters ?? [];

  if (options.selectedChapter === fullVideoValue) {
    return {};
  }

  if (options.selectedChapter === markerValue) {
    if (typeof options.timestamp === 'number' && options.timestamp > 0) {
      return { startSeconds: options.timestamp };
    }
    return {};
  }

  if (chapters.length > 0) {
    const chapter = chapters[Number.parseInt(options.selectedChapter, 10)];
    if (chapter) {
      return {
        startSeconds: chapter.startSeconds,
        ...(chapter.endSeconds !== undefined ? { endSeconds: chapter.endSeconds } : {}),
        chapterTitle: chapter.title,
      };
    }
  }

  if (typeof options.timestamp === 'number' && options.timestamp > 0) {
    return { startSeconds: options.timestamp };
  }

  return {};
}
