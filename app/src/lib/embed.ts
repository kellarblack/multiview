import type { Tile } from './types';

const YT_ID = /(?:watch\?v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/;
const YT_LIST = /[?&]list=([A-Za-z0-9_-]{10,})/;
const YT_LIVE_ID = /youtube\.com\/live\/([A-Za-z0-9_-]{11})/;
const YT_CHANNEL = /youtube\.com\/channel\/([A-Za-z0-9_-]{10,})/;
const TWITCH = /twitch\.tv\/([A-Za-z0-9_]{3,})/i;
const ALLOWED = /^https?:\/\//i;

export interface Parsed {
  url: string;
  embed: string;
  kind: Tile['kind'];
  name: string;
}

/** Turn a pasted link into something a tile can actually frame. */
export function parseLink(input: string): Parsed | null {
  const url = input.trim();
  if (!url || !ALLOWED.test(url)) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(parsed.protocol)) return null;

  const host = parsed.hostname.replace(/^www\./, '');

  if (/(^|\.)youtube\.com$/.test(host) || host === 'youtu.be') {
    const liveId = YT_LIVE_ID.exec(url)?.[1] ?? (/\/live\/?$/.test(url) ? YT_ID.exec(url)?.[1] : undefined);
    if (liveId) {
      return {
        url,
        embed: `https://www.youtube.com/embed/${liveId}?autoplay=1&mute=1&playsinline=1&rel=0`,
        kind: 'youtube',
        name: 'YouTube live',
      };
    }
    const channel = YT_CHANNEL.exec(url)?.[1];
    if (channel) {
      return {
        url,
        embed: `https://www.youtube.com/embed/live_stream?channel=${channel}&autoplay=1&mute=1&playsinline=1`,
        kind: 'youtube',
        name: 'YouTube channel',
      };
    }
    const id = YT_ID.exec(url)?.[1];
    if (id) {
      return {
        url,
        embed: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0`,
        kind: 'youtube',
        name: 'YouTube',
      };
    }
    const list = YT_LIST.exec(url)?.[1];
    if (list) {
      return {
        url,
        embed: `https://www.youtube.com/embed/videoseries?list=${list}&autoplay=1&mute=1&playsinline=1`,
        kind: 'youtube',
        name: 'YouTube playlist',
      };
    }
    return null;
  }

  if (host === 'twitch.tv' || host.endsWith('.twitch.tv')) {
    const channel = TWITCH.exec(url)?.[1];
    if (channel) {
      return {
        url,
        embed: `https://player.twitch.tv/?channel=${channel}&parent=${location.hostname}&autoplay=true&muted=true`,
        kind: 'twitch',
        name: channel,
      };
    }
    return null;
  }

  const name = host.replace(/^m\./, '');
  return { url, embed: url, kind: 'generic', name };
}
