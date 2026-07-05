export type VideoProvider = 'youtube' | 'naver';

export function getYouTubeVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function getNaverVideoId(url: string) {
  const match = url.match(/(?:m\.)?tv(?:cast)?\.naver\.com\/(?:v|embed)\/(\d+)/i);
  return match?.[1] ?? null;
}

export function getNaverLegacyEmbedUrl(url: string) {
  if (!url.includes('serviceapi.nmv.naver.com')) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const vid = parsed.searchParams.get('vid');
    const outKey = parsed.searchParams.get('outKey');

    if (vid && outKey) {
      const embedUrl = new URL('https://serviceapi.nmv.naver.com/flash/convertIframeTag.nhn');
      embedUrl.searchParams.set('vid', vid);
      embedUrl.searchParams.set('outKey', outKey);
      return embedUrl.toString();
    }
  } catch {
    return null;
  }

  return url;
}

export function getVideoProvider(url: string): VideoProvider | null {
  if (getYouTubeVideoId(url)) {
    return 'youtube';
  }

  if (getNaverVideoId(url) || getNaverLegacyEmbedUrl(url)) {
    return 'naver';
  }

  return null;
}

export function isSupportedVideoUrl(url: string) {
  return getVideoProvider(url) !== null;
}

export function getVideoEmbedUrl(url: string) {
  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }

  const naverId = getNaverVideoId(url);
  if (naverId) {
    return `https://tv.naver.com/embed/${naverId}`;
  }

  return getNaverLegacyEmbedUrl(url);
}
