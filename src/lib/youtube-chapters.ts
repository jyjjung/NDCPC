import { getYouTubeVideoId } from '@/lib/video';

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

export function parseYouTubeTimestamp(value: string) {
  if (/^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }

  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!match || !match[0]) {
    return null;
  }

  const hours = Number.parseInt(match[1] ?? '0', 10);
  const minutes = Number.parseInt(match[2] ?? '0', 10);
  const seconds = Number.parseInt(match[3] ?? '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

export function getYouTubeTimestampFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const timestamp =
      parsed.searchParams.get('t') ??
      parsed.searchParams.get('start') ??
      parsed.hash.match(/[#&]t=([^&]+)/)?.[1];

    if (!timestamp) {
      return null;
    }

    return parseYouTubeTimestamp(timestamp);
  } catch {
    return null;
  }
}

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
