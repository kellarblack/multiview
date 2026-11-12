/* multiview.cc — integration layer
 *
 * Pure-ish helpers with no DOM assumptions except the player factory and DOMParser.
 * Everything here is testable without the wall.
 *
 *   MVLib.parseM3U(text)      -> { channels, skipped, truncated, ms }
 *   MVLib.parseXMLTV(text)    -> { byChannel, channelNames, count, ms }
 *   MVLib.buildGuide(...)     -> { map, matched }
 *   MVLib.nowNext(list)       -> { now, next }
 *   MVLib.Jellyfin           -> client
 *   MVLib.createPlayer(...)   -> { video, destroy, onError }
 */

window.MVLib = (function () {
  'use strict';

  var MAX_CHANNELS = 5000;
  var MAX_PLAYLIST_CHARS = 24 * 1024 * 1024;
  var MAX_PROGRAMMES = 60000;

  /* ── small helpers ─────────────────────────────────────────── */

  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return 'c' + (h >>> 0).toString(36);
  }

  function safeUrl(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (!s) return null;
    if (!/^https?:\/\//i.test(s)) return null;
    try {
      var u = new URL(s);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
      return u.toString();
    } catch (e) {
      return null;
    }
  }

  /** Strip query strings so a token in a URL never reaches a log or an error toast. */
  function redact(url) {
    try {
      var u = new URL(String(url));
      u.search = '';
      u.hash = '';
      u.username = '';
      u.password = '';
      return u.toString();
    } catch (e) {
      return '(invalid url)';
    }
  }

  function parseAttributes(input) {
    var out = {};
    var re = /([\w-]+)="([^"]*)"/g;
    var m;
    while ((m = re.exec(input))) out[m[1].toLowerCase()] = m[2];
    return out;
  }

  /* ── M3U / M3U8 ────────────────────────────────────────────── */

  function parseM3U(text) {
    var started = (window.performance && performance.now) ? performance.now() : Date.now();
    var source = String(text == null ? '' : text);
    if (source.length > MAX_PLAYLIST_CHARS) {
      return { error: 'That playlist is too large to open here (over 24 MB).' };
    }

    var lines = source.split(/\r?\n/);
    var channels = [];
    var seen = new Set();
    var skipped = 0;
    var truncated = false;
    var pending = null;
    var group = '';

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;

      if (line.indexOf('#EXTINF:') === 0) {
        var comma = line.indexOf(',');
        var meta = comma >= 0 ? line.slice(0, comma) : line;
        var label = comma >= 0 ? line.slice(comma + 1).trim() : '';
        var attrs = parseAttributes(meta);
        pending = {
          name: label || attrs['tvg-name'] || 'Unnamed channel',
          group: attrs['group-title'] || group || '',
          logo: safeUrl(attrs['tvg-logo']) || '',
          tvgId: attrs['tvg-id'] || '',
          tvgName: attrs['tvg-name'] || '',
        };
        continue;
      }

      if (line.indexOf('#EXTGRP:') === 0) {
        group = line.slice(8).trim();
        if (pending && !pending.group) pending.group = group;
        continue;
      }

      if (line.charAt(0) === '#') continue;

      var url = safeUrl(line);
      if (!url) {
        skipped++;
        pending = null;
        continue;
      }
      if (seen.has(url)) {
        skipped++;
        pending = null;
        continue;
      }
      seen.add(url);

      var entry = pending || { name: 'Unnamed channel', group: group || '', logo: '', tvgId: '', tvgName: '' };
      channels.push({
        id: hash(url),
        name: String(entry.name).slice(0, 120),
        group: String(entry.group).slice(0, 60),
        logo: entry.logo,
        tvgId: entry.tvgId,
        tvgName: entry.tvgName,
        url: url,
      });
      pending = null;

      if (channels.length >= MAX_CHANNELS) {
        truncated = true;
        break;
      }
    }

    return {
      channels: channels,
      skipped: skipped,
      truncated: truncated,
      ms: Math.round(((window.performance && performance.now) ? performance.now() : Date.now()) - started),
    };
  }

  /* ── XMLTV ─────────────────────────────────────────────────── */

  function parseXmltvDate(raw) {
    var m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\s*([+-]\d{2}):?(\d{2})?/.exec(String(raw || '').trim());
    if (!m) return null;
    var base = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    var offset = 0;
    if (m[7]) {
      var sign = m[7].charAt(0) === '-' ? -1 : 1;
      offset = sign * (Math.abs(+m[7]) * 60 + +(m[8] || 0)) * 60000;
    }
    return new Date(base - offset);
  }

  function parseXMLTV(text) {
    var started = (window.performance && performance.now) ? performance.now() : Date.now();
    var doc;
    try {
      doc = new DOMParser().parseFromString(String(text || ''), 'application/xml');
    } catch (e) {
      return { error: 'That guide file could not be read.' };
    }
    if (doc.getElementsByTagName('parsererror').length) {
      return { error: 'That XMLTV file is not valid XML.' };
    }

    var channelNames = new Map();
    var channelNodes = doc.getElementsByTagName('channel');
    for (var i = 0; i < channelNodes.length; i++) {
      var id = channelNodes[i].getAttribute('id');
      if (!id) continue;
      var display = channelNodes[i].getElementsByTagName('display-name')[0];
      var name = display ? display.textContent.trim() : '';
      if (name) channelNames.set(id, name);
    }

    var byChannel = new Map();
    var programmes = doc.getElementsByTagName('programme');
    var count = 0;
    for (var p = 0; p < programmes.length && count < MAX_PROGRAMMES; p++) {
      var node = programmes[p];
      var start = parseXmltvDate(node.getAttribute('start'));
      var channel = node.getAttribute('channel');
      if (!start || !channel) continue;
      var stop = parseXmltvDate(node.getAttribute('stop'));
      var titleNode = node.getElementsByTagName('title')[0];
      var descNode = node.getElementsByTagName('desc')[0];
      var catNode = node.getElementsByTagName('category')[0];
      var entry = {
        channel: channel,
        start: start.getTime(),
        stop: stop ? stop.getTime() : start.getTime() + 30 * 60000,
        title: titleNode ? titleNode.textContent.trim().slice(0, 160) : '',
        desc: descNode ? descNode.textContent.trim().slice(0, 300) : '',
        category: catNode ? catNode.textContent.trim().slice(0, 40) : '',
      };
      if (!byChannel.has(channel)) byChannel.set(channel, []);
      byChannel.get(channel).push(entry);
      count++;
    }
    byChannel.forEach(function (list) { list.sort(function (a, b) { return a.start - b.start; }); });

    return {
      channelNames: channelNames,
      byChannel: byChannel,
      count: count,
      truncated: programmes.length > count,
      ms: Math.round(((window.performance && performance.now) ? performance.now() : Date.now()) - started),
    };
  }

  function normaliseName(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  /** Map my channel ids to programme lists. Exact tvg-id first, then name matching. */
  function buildGuide(channels, epg) {
    var map = new Map();
    var matched = 0;
    if (!epg || !epg.byChannel) return { map: map, matched: 0 };

    var nameIndex = new Map();
    epg.channelNames.forEach(function (name, id) {
      var key = normaliseName(name);
      if (key && !nameIndex.has(key)) nameIndex.set(key, id);
    });

    channels.forEach(function (ch) {
      var id = null;
      if (ch.tvgId && epg.byChannel.has(ch.tvgId)) id = ch.tvgId;
      if (!id && ch.tvgName) {
        var k = normaliseName(ch.tvgName);
        if (k && nameIndex.has(k)) id = nameIndex.get(k);
      }
      if (!id) {
        var k2 = normaliseName(ch.name);
        if (k2 && nameIndex.has(k2)) id = nameIndex.get(k2);
      }
      if (!id) return;
      var list = epg.byChannel.get(id);
      if (list && list.length) {
        map.set(ch.id, list);
        matched++;
      }
    });

    return { map: map, matched: matched };
  }

  function nowNext(list, now) {
    if (!list || !list.length) return { now: null, next: null };
    var at = now || Date.now();
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (p.stop <= at) continue;
      if (p.start <= at) return { now: p, next: list[i + 1] || null };
      return { now: null, next: p };
    }
    return { now: null, next: null };
  }

  /* ── Jellyfin ──────────────────────────────────────────────── */

  function Jellyfin(baseUrl) {
    this.base = String(baseUrl || '').replace(/\/+$/, '');
    this.token = null;
    this.userId = null;
    this.userName = '';
    this.serverName = '';
    this.version = '';
  }

  Jellyfin.prototype.request = function (path, opts) {
    var options = opts || {};
    var headers = { Accept: 'application/json' };
    var token = options.token === undefined ? this.token : options.token;
    if (token) headers['X-Emby-Token'] = token;
    if (options.body) headers['Content-Type'] = 'application/json';

    return fetch(this.base + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: 'omit',
      redirect: 'follow',
    }).then(function (res) {
      if (!res.ok) {
        var err = new Error(res.status === 401 ? 'Wrong username or password.' : 'Jellyfin returned ' + res.status + '.');
        err.status = res.status;
        throw err;
      }
      if (res.status === 204) return null;
      return res.json();
    });
  };

  /** Validates the URL and signs in with a password or a ready API key. */
  Jellyfin.prototype.connect = function (credentials) {
    var self = this;
    var c = credentials || {};
    if (!/^https?:\/\//i.test(this.base)) {
      return Promise.reject(new Error('Enter a full server URL, including http:// or https://.'));
    }

    return this.request('/System/Info/Public', { token: null })
      .then(function (info) {
        self.serverName = (info && info.ServerName) || '';
        self.version = (info && info.Version) || '';
        if (c.token) {
          self.token = String(c.token).trim();
          return self.request('/Users/Me');
        }
        if (!c.username || !c.password) throw new Error('Enter a username and password, or an API key.');
        return self.request('/Users/AuthenticateByName', {
          method: 'POST',
          token: null,
          body: { Username: c.username, Pw: c.password },
        }).then(function (auth) {
          self.token = auth.AccessToken;
          return auth.User;
        });
      })
      .then(function (user) {
        if (!user || !user.Id) throw new Error('Jellyfin accepted the server but not the login.');
        self.userId = user.Id;
        self.userName = user.Name || '';
        return self;
      });
  };

  Jellyfin.prototype.me = function () {
    return this.request('/Users/Me');
  };

  Jellyfin.prototype.liveTvInfo = function () {
    return this.request('/LiveTv/Info').catch(function () { return null; });
  };

  Jellyfin.prototype.liveChannels = function () {
    if (!this.userId) return Promise.reject(new Error('Not signed in.'));
    return this.request('/LiveTv/Channels?userId=' + encodeURIComponent(this.userId) + '&limit=1000')
      .then(function (data) { return (data && data.Items) || []; });
  };

  Jellyfin.prototype.playUrl = function (itemId, options) {
    var opts = options || {};
    var id = encodeURIComponent(itemId);
    var key = encodeURIComponent(this.token || '');
    if (opts.hls) {
      return this.base + '/Videos/' + id + '/master.m3u8?api_key=' + key + '&mediaSourceId=' + id;
    }
    return this.base + '/Videos/' + id + '/stream?static=true&api_key=' + key + '&mediaSourceId=' + id;
  };

  Jellyfin.prototype.itemImage = function (item, width) {
    if (!item || !item.ImageTags || !item.ImageTags.Primary) return '';
    var w = width || 120;
    return this.base + '/Items/' + encodeURIComponent(item.Id) + '/Images/Primary?maxWidth=' + w +
      '&tag=' + encodeURIComponent(item.ImageTags.Primary) + '&api_key=' + encodeURIComponent(this.token || '');
  };

  /* ── player ────────────────────────────────────────────────── */

  function looksLikeHls(url) {
    return /\.m3u8(\?|#|$)/i.test(String(url || ''));
  }

  function looksLikeVideo(url) {
    return /\.(mp4|webm|ogg|ogv|m4v|mov)(\?|#|$)/i.test(String(url || ''));
  }

  /* hls.js is ~400 KB, so it is fetched the first time an HLS stream is played,
     never on a normal page load. */
  var hlsPromise = null;
  function ensureHls() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (hlsPromise) return hlsPromise;
    hlsPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'vendor/hls.min.js';
      script.async = true;
      script.onload = function () {
        if (window.Hls) resolve(window.Hls);
        else reject(new Error('hls.js did not register'));
      };
      script.onerror = function () { reject(new Error('hls.js could not be loaded')); };
      document.head.appendChild(script);
    });
    return hlsPromise;
  }

  /**
   * Creates a detached <video> for a direct stream.
   * Native HLS first (Safari), hls.js when the browser needs it.
   */
  function createPlayer(url, options) {
    var opts = options || {};
    var video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.autoplay = opts.autoplay !== false;
    video.muted = opts.muted !== false;
    video.preload = 'metadata';
    video.className = 'media-video';
    if (opts.poster) video.poster = opts.poster;

    var hls = null;
    var destroyed = false;
    var onError = opts.onError || function () {};

    function fail(message) {
      if (destroyed) return;
      onError(message);
    }

    var isHls = looksLikeHls(url);
    var nativeHls = video.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (isHls && !nativeHls) {
      ensureHls().then(function (Hls) {
        if (destroyed) return;
        if (!Hls.isSupported()) {
          fail('This browser cannot play HLS streams.');
          return;
        }
        hls = new Hls({
          maxBufferLength: 12,
          maxMaxBufferLength: 30,
          capLevelToPlayerSize: true,
          enableWorker: true,
        });
        hls.on(Hls.Events.ERROR, function (_event, data) {
          if (!data || !data.fatal) return;
          if (data.type === 'networkError') fail('The stream could not be reached (network or CORS).');
          else if (data.type === 'mediaError') fail('The stream uses a codec this browser cannot decode.');
          else fail('HLS playback failed.');
        });
        hls.loadSource(url);
        hls.attachMedia(video);
      }).catch(function () {
        fail('The HLS player could not be loaded.');
      });
    } else if (isHls && nativeHls) {
      video.src = url;
    } else if (looksLikeVideo(url) || opts.forceVideo) {
      video.src = url;
      video.addEventListener('error', function () {
        fail('This video could not be played — the format may be unsupported or the source may require CORS.');
      }, { once: true });
    } else {
      fail('That link is not a direct video or HLS stream.');
    }

    return {
      video: video,
      destroy: function () {
        destroyed = true;
        if (hls) {
          try { hls.destroy(); } catch (e) { /* ignore */ }
          hls = null;
        }
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch (e) { /* ignore */ }
        if (video.parentNode) video.parentNode.removeChild(video);
      },
    };
  }

  return {
    parseM3U: parseM3U,
    parseXMLTV: parseXMLTV,
    buildGuide: buildGuide,
    nowNext: nowNext,
    Jellyfin: Jellyfin,
    createPlayer: createPlayer,
    looksLikeHls: looksLikeHls,
    looksLikeVideo: looksLikeVideo,
    safeUrl: safeUrl,
    redact: redact,
    hash: hash,
    MAX_CHANNELS: MAX_CHANNELS,
  };
})();
