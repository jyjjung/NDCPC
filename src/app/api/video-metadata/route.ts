import { NextRequest, NextResponse } from 'next/server';

import { fetchNaverBlogVideoInfo, isNaverBlogUrl } from '@/lib/naver-blog';
import { fetchNaverVideoTitle } from '@/lib/naver-metadata';
import { resolveVideoUrl } from '@/lib/resolve-video-url';
import { getVideoProvider, isSupportedVideoUrl } from '@/lib/video';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const url = await resolveVideoUrl(rawUrl);

  if (isNaverBlogUrl(url)) {
    const blogVideo = await fetchNaverBlogVideoInfo(url);
    if (!blogVideo) {
      return NextResponse.json({ error: 'Could not fetch video details' }, { status: 422 });
    }

    return NextResponse.json({
      title: blogVideo.title,
      url: blogVideo.embedUrl,
    });
  }

  if (!isSupportedVideoUrl(url) || getVideoProvider(url) === null) {
    return NextResponse.json({ error: 'Unsupported video URL' }, { status: 400 });
  }

  const provider = getVideoProvider(url);

  if (provider === 'youtube') {
    const oembedResponse = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(url)}`
    );

    if (!oembedResponse.ok) {
      return NextResponse.json({ error: 'Could not fetch video details' }, { status: 422 });
    }

    const data = await oembedResponse.json();
    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 422 });
    }

    return NextResponse.json({
      title: data.title,
      url,
    });
  }

  const title = await fetchNaverVideoTitle(url);
  if (!title) {
    return NextResponse.json({ error: 'Could not fetch video details' }, { status: 422 });
  }

  return NextResponse.json({
    title,
    url,
  });
}
