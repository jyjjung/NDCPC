import { isSupportedVideoUrl } from '@/lib/video';

function extractBridgeUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'link.naver.com' || !parsed.pathname.startsWith('/bridge')) {
      return null;
    }

    const target = parsed.searchParams.get('url');
    return target ? decodeURIComponent(target) : null;
  } catch {
    return null;
  }
}

export async function resolveVideoUrl(input: string) {
  let current = input;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const bridgeTarget = extractBridgeUrl(current);
    if (bridgeTarget) {
      current = bridgeTarget;
      if (isSupportedVideoUrl(current)) {
        return current;
      }
      continue;
    }

    if (isSupportedVideoUrl(current)) {
      return current;
    }

    const response = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NDCPC/1.0)',
      },
    });

    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        break;
      }

      current = new URL(location, current).toString();
      continue;
    }

    return response.url || current;
  }

  return current;
}
