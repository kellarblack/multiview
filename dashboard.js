/* multiview.cc — dashboard + sources
 *
 * Builds the Home and Sources views and drives the IPTV / Jellyfin flows.
 * It never invents content: everything rendered comes from state or a real request.
 */

window.MVDash = (function () {
  'use strict';

  var API = null;
  var ROW = 52;
  var filmObserver = null;
  var homeFrameTimer = 0;
  var healthGenerated = '';

  var iptv = { guide: null, guideNote: '', guideLoading: false, filter: '', group: '', favOnly: false, list: [], viewport: null };
  var jelly = { channels: null, loading: false, error: '' };
  var browse = { open: false, which: 'iptv' };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function el(html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = String(html).trim();
    return tpl.content.firstElementChild;
  }

  function ago(ts) {
    var s = Math.max(1, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return 'just now';
    if (s < 3600) return Math.round(s / 60) + 'm ago';
    if (s < 86400) return Math.round(s / 3600) + 'h ago';
    return Math.round(s / 86400) + 'd ago';
  }

  function statusPill(ok, label) {
    return '<span class="pill ' + (ok ? 'ok' : 'off') + '"><i></i>' + esc(label) + '</span>';
  }

  function presetCard(p, mode) {
    var keyAttr = mode === 'wall' ? 'data-wall-key' : 'data-preset';
    var cells = '';
    var thumbs = p.thumbs || [];
    for (var i = 0; i < 2; i++) {
      cells += thumbs[i]
        ? '<img class="mv-frame" data-vid="' + esc(thumbs[i]) + '" data-local="media/hero/05.jpg?v=2" src="' + frameSrc(thumbs[i]) + '" alt="" width="320" height="180" loading="lazy" decoding="async">'
        : '<i></i>';
    }
    return '<button class="preset-card" ' + keyAttr + '="' + esc(p.key) + '" title="Open ' + esc(p.name) + '">' +
      '<span class="preset-thumb">' + cells + '</span>' +
      '<span class="preset-name">' + esc(String(p.name).toLowerCase()) + '</span>' +
      '<span class="preset-meta">' + esc(p.blurb) + '</span>' +
      (p.rights ? '<span class="preset-flag">unofficial</span>' : '') +
      '<span class="preset-check" data-health-age>checked —</span>' +
    '</button>';
  }

  function paintHealthAge() {
    var label = 'not checked';
    if (healthGenerated) {
      var ts = Date.parse(healthGenerated);
      if (ts) label = 'checked ' + ago(ts);
    }
    document.querySelectorAll('[data-health-age]').forEach(function (el) { el.textContent = label; });
  }

  function renderWalls() {
    var grid = document.getElementById('wallsGrid');
    if (!grid) return;
    var presets = API.presets ? API.presets() : [];
    grid.innerHTML = presets.map(function (p) { return presetCard(p, 'wall'); }).join('');
    paintHealthAge();
  }

  function openWalls() {
    renderWalls();
    var dialog = document.getElementById('wallsDialog');
    if (dialog && !dialog.open) dialog.showModal();
  }

  /* Real broadcast frames, not uploader thumbnails: hqdefault_live for a live
     feed, mq2 (the middle frame) for a normal video. The five-minute bucket
     asks YouTube for a newer live frame on its own. */
  function framePair(id, frame) {
    var bucket = Math.floor(Date.now() / 300000);
    var n = frame || 2;
    var base = 'https://i.ytimg.com/vi/' + id + '/';
    return {
      small: base + 'mq' + n + '.jpg?t=' + bucket,
      large: base + 'maxres' + n + '.jpg?t=' + bucket,
    };
  }

  function frameSrc(id, size, frame) {
    if (!id) return 'media/hero/05.jpg?v=2';
    if (size === 'sport') return framePair(id, frame).large;
    return framePair(id, frame).small;
  }

  function saveSources(next) {
    API.setSources(next);
  }

  /* ── init ──────────────────────────────────────────────────── */

  function init(api) {
    API = api;
    var wallsDialog = document.getElementById('wallsDialog');
    if (wallsDialog) {
      wallsDialog.addEventListener('click', function (e) {
        var b = e.target.closest('[data-wall-key]');
        if (!b) return;
        wallsDialog.close();
        if (API && API.preset) API.preset(b.dataset.wallKey);
      });
    }
    /* Green means uptime, not pricing. The top chip and the footer read the
       same health.json the /status page uses. */
    fetch('health.json', { cache: 'no-cache' })
      .then(function (res) { return res.json(); })
      .then(function (h) {
        healthGenerated = h.generated || '';
        paintHealthAge();
        var bad = Number(h.bad) || 0;
        var chip = bad ? bad + ' down' : (h.ok + '/' + h.checked + ' up');
        var foot = bad ? bad + ' feed' + (bad === 1 ? '' : 's') + ' down' : h.ok + '/' + h.checked + ' feeds up';
        document.querySelectorAll('[data-status="chip"],[data-status="foot"]').forEach(function (el) {
          el.textContent = el.getAttribute('data-status') === 'chip' ? chip : foot;
        });
        document.querySelectorAll('[data-status-dot]').forEach(function (el) {
          el.classList.toggle('is-bad', bad > 0);
        });
        var link = document.querySelector('.status-chip');
        if (link) link.title = h.checked + ' curated feeds checked · ' + h.ok + ' up · ' + bad + ' down';
      })
      .catch(function () {
        document.querySelectorAll('[data-status="chip"]').forEach(function (el) { el.textContent = 'status'; });
      });
  }

  /* A missing channel logo hides itself. This replaces an inline onerror so the
     page can ship a Content-Security-Policy without unsafe-inline scripts. */
  document.addEventListener('error', function (event) {
    var el = event.target;
    if (!el || el.tagName !== 'IMG') return;
    if (el.classList.contains('chan-logo')) {
      el.style.visibility = 'hidden';
      return;
    }
    if (!el.classList.contains('mv-frame')) return;
    /* Real live frame → mid-video frame → local still. Never a broken card. */
    if (el.dataset.fallback === '2') { el.style.opacity = '0'; return; }
    if (el.dataset.fallback === '1') {
      el.dataset.fallback = '2';
      el.src = el.dataset.local || 'media/hero/05.jpg?v=2';
    } else {
      el.dataset.fallback = '1';
      el.src = 'https://i.ytimg.com/vi/' + el.dataset.vid + '/sd2.jpg';
    }
  }, true);

  /* ── HOME ──────────────────────────────────────────────────── */

  function renderHome() {
    var host = document.getElementById('homeView');
    if (!host) return;
    var state = API.getState();
    var boards = API.boards();
    var history = API.history();
    var sources = state.sources || {};
    var iptvOn = !!(sources.iptv && sources.iptv.channels && sources.iptv.channels.length);
    var jfOn = !!sources.jellyfin;
    var anyTiles = boards.some(function (b) { return b.tiles > 0; });

    var presets = API.presets ? API.presets() : [];
    var allSports = API.sports ? API.sports() : [];
    var featuredSports = allSports.filter(function (sport) {
      return ['basketball', 'soccer', 'cfb'].indexOf(sport.key) !== -1;
    });
    if (featuredSports.length < 3) featuredSports = allSports.slice(0, 3);
    var featuredPresets = ['now', 'sports', 'news', 'creators', 'hacker'].map(function (key) {
      return presets.filter(function (p) { return p.key === key; })[0];
    }).filter(Boolean);
    if (featuredPresets.length < 4) featuredPresets = presets.slice(0, 5);

    host.innerHTML =
      '<div class="home">' +
        '<section class="home-hero">' +
          '<div class="home-copy">' +
            '<h1>up to <span class="grad">4 streams</span>.<br>one screen.</h1>' +
            '<p class="home-sub">paste a link. it plays.</p>' +
            '<div class="hero-paste">' +
              '<input id="heroUrl" type="text" spellcheck="false" autocomplete="off" aria-label="Paste a link" placeholder="paste a youtube, twitch, iptv or web link">' +
              '<button class="btn primary" id="heroAdd">add</button>' +
            '</div>' +
            '<div class="hero-alt">' +
              (anyTiles ? '' : '<button class="btn" data-act="load-demo">load demo</button>') +
              '<button class="btn" data-act="blank-wall">blank wall</button>' +
              (API.isDownloadEdition && API.isDownloadEdition()
                ? '<button class="btn ghost" data-act="already-downloaded">running offline</button>'
                : '<a class="btn ghost" href="multiview-beta.zip?v=dev" download>download</a>') +
            '</div>' +
            '<p class="home-fine">free in beta · no account · <button class="link-btn" data-act="plan">plans</button></p>' +
          '</div>' +
          '<div class="home-visual">' + heroFilm() + '</div>' +
        '</section>' +

        '<section class="home-sports">' +
          '<div class="home-head">' +
            '<h2>live sport</h2>' +
            '<button class="link-btn" data-act="preset-sports">all sports →</button>' +
          '</div>' +
          '<div class="sport-grid">' +
            featuredSports.map(sportCard).join('') +
            allSportCard() +
          '</div>' +
        '</section>' +

        '<section class="home-demo">' +
          '<h2>try a wall</h2>' +
          '<div class="demo-sizes" role="group" aria-label="Demo screen count">' +
            [1, 2, 4].map(function (n) {
              return '<button type="button" data-demo="' + n + '" title="Open ' + n + ' live screens">' + n + '-up</button>';
            }).join('') +
          '</div>' +
        '</section>' +

        '<section class="home-presets">' +
          '<div class="home-head">' +
            '<h2>ready-made walls</h2>' +
            '<button class="link-btn" data-act="all-walls">all walls →</button>' +
          '</div>' +
          '<div class="preset-grid">' +
            featuredPresets.map(function (p) { return presetCard(p); }).join('') +
          '</div>' +
        '</section>' +

        '<section class="home-signin">' +
          '<div class="signin-card signin-simple">' +
            '<div class="signin-copy">' +
              '<h2>put a streaming service in your wall.</h2>' +
              '<p>Paste the web address of the service you already watch — the same link you would open in a normal browser tab. It opens in a tile. If the site asks you to sign in, sign in right there with your own account. We never see or store your password.</p>' +
              '<div class="signin-paste">' +
                '<input id="signinUrl" type="text" spellcheck="false" autocomplete="off" aria-label="Paste a streaming service link" placeholder="paste a streaming service link here">' +
                '<button class="btn primary" data-act="signin-add">add to wall</button>' +
              '</div>' +
              '<p class="signin-fine">Some services refuse to be shown inside another page. Those open in their own window instead, and still work normally.</p>' +
            '</div>' +
          '</div>' +
        '</section>' +

        '<section class="home-price-line">' +
          '<p><span class="pill ok"><i></i>free in beta</span>' +
            'no account, no card <span class="sep">·</span> ' +
            'pro <strong>$5 one time</strong> after beta <span class="sep">·</span> ' +
            'the app you download is yours.</p>' +
          '<button class="link-btn" data-act="plan">plans →</button>' +
        '</section>' +

        '<footer class="home-footer">' +
          '<div class="home-footer-links">' +
            '<button class="link-btn" data-act="share">share</button>' +
            '<button class="link-btn" data-act="go-sources">sources</button>' +
            '<a class="link-btn" href="help.html">help &amp; devices</a>' +
            '<a class="link-btn" href="legal.html">legal</a>' +
            '<a class="link-btn" href="status.html">status</a>' +
            '<span class="repo-soon">public repo · coming soon</span>' +
          '</div>' +
          '<span class="home-footer-note"><span class="dot" data-status-dot></span><span data-status="foot">checking feeds…</span> · <a href="status.html">status</a> · multiview.cc · free in beta</span>' +
        '</footer>' +
      '</div>';

    var heroInput = host.querySelector('#heroUrl');
    var heroAdd = host.querySelector('#heroAdd');
    if (heroInput && heroAdd) {
      var submitHero = function () {
        var value = heroInput.value.trim();
        if (!value) { heroInput.focus(); return; }
        if (API.addUrls(value)) heroInput.value = '';
        else heroInput.select();
      };
      heroAdd.addEventListener('click', submitHero);
      heroInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); submitHero(); }
      });
    }

    host.querySelectorAll('[data-act="load-demo"]').forEach(function (b) {
      b.addEventListener('click', function () { API.loadDemo(); });
    });
    host.querySelectorAll('[data-demo]').forEach(function (b) {
      b.addEventListener('click', function () { API.demo(Number(b.dataset.demo)); });
    });
    host.querySelectorAll('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function () { API.preset(b.dataset.preset); });
    });
    host.querySelectorAll('[data-act="all-walls"]').forEach(function (b) {
      b.addEventListener('click', openWalls);
    });

    /* Live frames move on their own. Ask YouTube for a new frame every five
       minutes while Home is the visible view. */
    if (homeFrameTimer) clearInterval(homeFrameTimer);
    homeFrameTimer = setInterval(function () {
      if (document.body.dataset.view !== 'home') return;
      host.querySelectorAll('.sport-thumb img[data-live-frame]').forEach(function (img) {
        var pair = framePair(img.dataset.vid, Number(img.dataset.frame) || 2);
        img.src = pair.small;
        img.srcset = pair.small + ' 320w, ' + pair.large + ' 1280w';
      });
    }, 300000);
    paintHealthAge();

    /* When the Pages Function is live, use its cached live frame. On a static
       direct upload the endpoint is 404 and the normal frame stays. */
    if (location.protocol === 'https:') {
      host.querySelectorAll('.sport-thumb img[data-vid]').forEach(function (img) {
        fetch('/api/live?video=' + encodeURIComponent(img.dataset.vid))
          .then(function (res) { return res.ok ? res.json() : null; })
          .then(function (data) {
            if (data && data.frame) {
              img.src = data.frame + '?v=' + Date.now().toString(36);
              img.removeAttribute('srcset');
            }
          })
          .catch(function () { /* static build: keep the normal frame */ });
      });
    }

    host.querySelectorAll('[data-act="go-wall"]').forEach(function (b) {
      b.addEventListener('click', function () { API.showView('wall'); });
    });
    host.querySelectorAll('[data-act="go-sources"]').forEach(function (b) {
      b.addEventListener('click', function () { API.showView('sources'); });
    });
    host.querySelectorAll('[data-act="new-board"]').forEach(function (b) {
      b.addEventListener('click', function () {
        API.newBoard('Board ' + (boards.length + 1));
        API.showView('wall');
      });
    });
    var clear = host.querySelector('[data-act="clear-history"]');
    if (clear) clear.addEventListener('click', function () {
      API.getState().history = [];
      API.save();
      renderHome();
    });
    host.querySelectorAll('[data-board]').forEach(function (btn) {
      btn.addEventListener('click', function () { API.openBoard(btn.dataset.board); });
    });
    host.querySelectorAll('[data-act="tv-mode"]').forEach(function (b) {
      b.addEventListener('click', function () { API.tvMode(true); });
    });
    host.querySelectorAll('[data-act="share"]').forEach(function (b) {
      b.addEventListener('click', function () { API.share(); });
    });
    host.querySelectorAll('[data-act="copy-link"]').forEach(function (b) {
      b.addEventListener('click', function () { API.copyLink(); });
    });
    host.querySelectorAll('[data-act="random-wall"]').forEach(function (b) {
      b.addEventListener('click', function () { API.randomWall(); });
    });
    host.querySelectorAll('[data-act="blank-wall"]').forEach(function (b) {
      b.addEventListener('click', function () { API.blankWall(); });
    });
    host.querySelectorAll('[data-sport]').forEach(function (b) {
      b.addEventListener('click', function () { API.sport(b.dataset.sport); });
    });
    host.querySelectorAll('[data-act="already-downloaded"]').forEach(function (b) {
      b.addEventListener('click', function () {
        API.toast('You are already running the downloaded build — this is it.');
      });
    });
    host.querySelectorAll('[data-signin]').forEach(function (b) {
      b.addEventListener('click', function () { API.openSignIn(b.dataset.signin, b.dataset.name); });
    });
    var allSports = host.querySelector('[data-act="preset-sports"]');
    if (allSports) allSports.addEventListener('click', function () { API.preset('sports'); });
    var signinInput = host.querySelector('#signinUrl');
    var signinAdd = host.querySelector('[data-act="signin-add"]');
    var submitSignin = function () {
      var value = signinInput.value.trim();
      if (!value) { signinInput.focus(); return; }
      if (API.addUrls(value)) {
        signinInput.value = '';
      } else if (/^https?:\/\//i.test(value)) {
        /* already on this board — take them to it so they can sign in */
        API.showView('wall');
      } else {
        signinInput.select();
      }
    };
    if (signinAdd) signinAdd.addEventListener('click', submitSignin);
    if (signinInput) {
      signinInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); submitSignin(); }
      });
    }
    host.querySelectorAll('[data-recent]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.dataset.kind === 'media') {
          API.addMedia({
            url: btn.dataset.url,
            title: btn.dataset.title,
            source: btn.dataset.source,
            hls: /\.m3u8(\?|$)/i.test(btn.dataset.url),
          });
        } else {
          API.addUrls(btn.dataset.url);
        }
      });
    });

    /* Cursor-driven 3D preview: the wall tilts and the tiles pan, instead of
       a looping gloss sweep. The listener lives on the persistent Home host,
       so a re-render cannot leave it attached to a detached preview. */
    if (!host._tiltWired) {
      var calm = false;
      try {
        calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (e) { /* treat as motion allowed */ }
      if (!calm) {
        host._tiltWired = true;
        var tiltRender = null;
        var tx = 0, ty = 0, cx = 0, cy = 0, tiltRaf = 0;
        var tickTilt = function () {
          tiltRaf = 0;
          if (!tiltRender) return;
          cx += (tx - cx) * 0.18;
          cy += (ty - cy) * 0.18;
          tiltRender.style.setProperty('--ry', (cx * 14).toFixed(2) + 'deg');
          tiltRender.style.setProperty('--rx', (-cy * 11).toFixed(2) + 'deg');
          tiltRender.style.setProperty('--mx', (cx * -20).toFixed(2) + 'px');
          tiltRender.style.setProperty('--my', (cy * -16).toFixed(2) + 'px');
          if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) {
            tiltRaf = requestAnimationFrame(tickTilt);
          }
        };
        host.addEventListener('pointermove', function (e) {
          if (e.pointerType === 'touch') return;
          var el = e.target && e.target.closest ? e.target.closest('.hero-film') : null;
          if (!el) {
            tx = 0; ty = 0;
          } else {
            tiltRender = el;
            var r = el.getBoundingClientRect();
            if (!r.width || !r.height) { tx = 0; ty = 0; }
            else {
              tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
              ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
            }
          }
          if (!tiltRaf) tiltRaf = requestAnimationFrame(tickTilt);
        }, { passive: true });
        host.addEventListener('pointerleave', function () {
          tx = 0; ty = 0;
          if (!tiltRaf) tiltRaf = requestAnimationFrame(tickTilt);
        }, { passive: true });
      }
    }

    /* Product film: mute, loop, play only while it is on screen. Reduced-motion
       visitors get the poster and a play button instead of autoplay. */
    var film = host.querySelector('#productFilm');
    var filmToggle = host.querySelector('#filmToggle');
    if (film && filmToggle) {
      if (filmObserver) { filmObserver.disconnect(); filmObserver = null; }
      var setFilmState = function (playing) {
        filmToggle.classList.toggle('is-playing', playing);
        filmToggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
        filmToggle.setAttribute('aria-label', playing ? 'Pause product film' : 'Play product film');
      };
      var playFilm = function () {
        var p = film.play();
        if (p && p.catch) p.catch(function () { setFilmState(false); });
      };
      filmToggle.addEventListener('click', function () {
        if (film.paused) playFilm();
        else film.pause();
      });
      film.addEventListener('play', function () { setFilmState(true); });
      film.addEventListener('pause', function () { setFilmState(false); });
      var reduceFilm = false;
      try {
        reduceFilm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      } catch (e) { /* treat as motion allowed */ }
      if (!reduceFilm && 'IntersectionObserver' in window) {
        /* Let the page paint first: the film is 2 MB and must not compete with
           the hero copy, fonts and first thumbnails. */
        var filmStart = 0;
        filmObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              if (!filmStart) filmStart = setTimeout(playFilm, 1600);
            } else {
              clearTimeout(filmStart);
              filmStart = 0;
              if (!film.paused) film.pause();
            }
          });
        }, { threshold: 0.5 });
        filmObserver.observe(film);
      } else {
        setFilmState(false);
      }
    }
  }

  /* Local, text-free sport art for the Home cards. The preset mosaics still use
     real channel thumbnails because those cards stand for real playlists. */
  var SPORT_FRAME = {
    basketball: 2, soccer: 3, baseball: 3, cfb: 1, mma: 2, olympics: 2, esports: 2,
  };

  var SPORT_ART = {
    basketball: 'media/hero/02.jpg?v=2',
    baseball: 'media/hero/03.jpg?v=2',
    soccer: 'media/hero/01.jpg?v=2',
    olympics: 'media/hero/06.jpg?v=2',
    mma: 'media/hero/04.jpg?v=2',
    cfb: 'media/hero/04.jpg?v=2',
    esports: 'media/hero/07.jpg?v=2',
  };

  function allSportCard() {
    var picks = (API.sports ? API.sports() : []).slice(0, 4);
    var mosaic = picks.map(function (sport) {
      return '<img class="mv-frame" data-vid="' + esc(sport.thumb) + '" data-local="' + esc(SPORT_ART[sport.key] || 'media/hero/05.jpg?v=2') + '" src="' + frameSrc(sport.thumb, 'card', SPORT_FRAME[sport.key]) + '" alt="" width="320" height="180" loading="lazy" decoding="async">';
    }).join('');
    return '<button class="sport-card sport-all" data-act="preset-sports" title="Open the sports wall">' +
      '<span class="sport-thumb">' +
        '<span class="sport-mosaic">' + mosaic + '</span>' +
        '<span class="sport-feed"><i></i>4 feeds</span>' +
      '</span>' +
      '<span class="sport-body">' +
        '<span class="sport-name">all sports</span>' +
        '<span class="sport-league">every sport</span>' +
      '</span>' +
    '</button>';
  }

  function sportCard(sport) {
    var id = sport.thumb || '';
    return '<button class="sport-card" data-sport="' + esc(sport.key) + '" title="Open ' + esc(sport.name) + '">' +
      '<span class="sport-thumb">' +
        '<img class="mv-frame" data-vid="' + esc(id) + '" data-live-frame="1" data-local="' + esc(SPORT_ART[sport.key] || 'media/hero/05.jpg?v=2') + '" src="' + framePair(id, SPORT_FRAME[sport.key]).small + '" srcset="' + framePair(id, SPORT_FRAME[sport.key]).small + ' 320w, ' + framePair(id, SPORT_FRAME[sport.key]).large + ' 1280w" sizes="(max-width: 760px) 46vw, 280px" data-frame="' + (SPORT_FRAME[sport.key] || 2) + '" alt="" width="480" height="270" loading="lazy" decoding="async">' +
        '<span class="sport-feed"><i></i>live</span>' +
      '</span>' +
      '<span class="sport-body">' +
        '<span class="sport-name">' + esc(String(sport.name).toLowerCase()) + '</span>' +
        '<span class="sport-league">' + esc(sport.league) + '</span>' +
      '</span>' +
    '</button>';
  }

  function heroFilm() {
    if (API.isDownloadEdition && API.isDownloadEdition()) {
      return '<div class="hero-film hero-film-static">' +
        '<div class="hero-film-frame">' +
          '<img src="media/hero/01.jpg?v=2" alt=""><img src="media/hero/02.jpg?v=2" alt="">' +
          '<img src="media/hero/03.jpg?v=2" alt=""><img src="media/hero/04.jpg?v=2" alt="">' +
        '</div>' +
      '</div>';
    }
    return '<div class="hero-film">' +
      '<div class="hero-film-glow" aria-hidden="true"></div>' +
      '<div class="hero-film-frame">' +
        '<video id="productFilm" muted loop playsinline preload="none" poster="media/multiview-demo-poster.jpg?v=6" aria-label="multiview product film — four games on one screen">' +
          '<source src="media/multiview-demo.mp4?v=5" type="video/mp4">' +
        '</video>' +
        '<button class="film-toggle" id="filmToggle" type="button" aria-label="Play product film" aria-pressed="false">' +
          '<svg class="icon-play" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M7 4.6l8 5.4-8 5.4z" fill="currentColor"/></svg>' +
          '<svg class="icon-pause" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M6.4 4.5h2.8v11H6.4zM10.8 4.5h2.8v11h-2.8z" fill="currentColor"/></svg>' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  var LAYOUT_SPEC = {
    '1': { cols: 1, cells: 1 },
    '2': { cols: 2, cells: 2 },
    '3': { cols: 3, cells: 3 },
    '4': { cols: 2, cells: 4 },
    '6': { cols: 3, cells: 6 },
    '9': { cols: 3, cells: 9 },
  };

  function boardCard(board) {
    var spec = LAYOUT_SPEC[board.layout] || LAYOUT_SPEC['4'];
    var cells = '';
    for (var i = 0; i < spec.cells; i++) {
      cells += '<i' + (i < board.tiles ? ' class="on"' : '') + '></i>';
    }
    return '<button class="board-card' + (board.active ? ' is-active' : '') + '" data-board="' + esc(board.id) + '">' +
      '<span class="board-thumb" style="--cols:' + spec.cols + '">' + cells + '</span>' +
      '<span class="board-name">' + esc(board.name) + '</span>' +
      '<span class="board-meta">' + board.tiles + ' tile' + (board.tiles === 1 ? '' : 's') + '</span>' +
    '</button>';
  }

  function recentChip(item) {
    var isMedia = item.source === 'iptv' || item.source === 'jellyfin';
    return '<button class="recent-chip" data-recent="1" data-kind="' + (isMedia ? 'media' : 'web') + '"' +
      ' data-url="' + esc(item.url) + '" data-title="' + esc(item.title) + '" data-source="' + esc(item.source) + '">' +
      '<span class="dot ' + (isMedia ? 'media' : 'web') + '"></span>' +
      '<span class="recent-chip-name">' + esc(item.title || item.url) + '</span>' +
      '<span class="recent-chip-time">' + ago(item.at) + '</span>' +
    '</button>';
  }

  function srcChip(name, status, on) {
    return '<button class="src-chip' + (on ? ' on' : '') + '" data-act="go-sources">' +
      '<span class="dot"></span>' +
      '<span class="src-chip-name">' + esc(name) + '</span>' +
      '<span class="src-chip-status">' + esc(status) + '</span>' +
    '</button>';
  }

  /* ── SOURCES ───────────────────────────────────────────────── */

  function renderSources() {
    var host = document.getElementById('sourcesView');
    if (!host) return;
    var state = API.getState();
    var s = state.sources || {};

    host.innerHTML =
      '<div class="dash">' +
        '<header class="dash-head">' +
          '<div>' +
            '<p class="eyebrow">multiview</p>' +
            '<h1>sources</h1>' +
            '<p class="dash-sub">bring your own sources.</p>' +
          '</div>' +
          
        '</header>' +

        '<div class="src-cards">' +
          '<section class="card">' +
            '<div class="card-head"><div><h2>web links</h2><p>pages, players, embeds</p></div>' + statusPill(true, 'built in') + '</div>' +
            '<p class="card-copy">paste any public link. if a site blocks frames, it opens in a window.</p>' +
            '<div class="card-actions"><button class="btn" data-act="go-wall">paste a link</button><button class="btn ghost" data-act="open-sources-help">which sites embed</button></div>' +
          '</section>' +

          '<section class="card">' +
            '<div class="card-head"><div><h2>tuners &amp; plex</h2><p>hdhomerun · tablo · plex · threadfin</p></div>' + statusPill(true, 'm3u + xmltv') + '</div>' +
            '<p class="card-copy">point a tuner or plex at threadfin/xteve, export an m3u + xmltv, then add it as iptv. local http tuners need the downloaded build on localhost.</p>' +
            '<div class="card-actions"><a class="btn" href="#iptvCard">use the iptv card</a><a class="btn ghost" href="help.html#tuners">how to connect</a></div>' +
          '</section>' +

          '<section class="card" id="iptvCard">' + iptvCard(s.iptv) + '</section>' +
          '<section class="card" id="jellyCard">' + jellyfinCard(s.jellyfin) + '</section>' +
        '</div>' +

        '<div id="browserHost"></div>' +
      '</div>';

    var heroInput = host.querySelector('#heroUrl');
    var heroAdd = host.querySelector('#heroAdd');
    if (heroInput && heroAdd) {
      var submitHero = function () {
        var value = heroInput.value.trim();
        if (!value) { heroInput.focus(); return; }
        if (API.addUrls(value)) heroInput.value = '';
        else heroInput.select();
      };
      heroAdd.addEventListener('click', submitHero);
      heroInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); submitHero(); }
      });
    }

    host.querySelectorAll('[data-act="load-demo"]').forEach(function (b) {
      b.addEventListener('click', function () { API.loadDemo(); });
    });
    host.querySelectorAll('[data-demo]').forEach(function (b) {
      b.addEventListener('click', function () { API.demo(Number(b.dataset.demo)); });
    });
    host.querySelectorAll('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function () { API.preset(b.dataset.preset); });
    });
    host.querySelectorAll('[data-act="all-walls"]').forEach(function (b) {
      b.addEventListener('click', openWalls);
    });

    host.querySelectorAll('[data-act="go-wall"]').forEach(function (b) {
      b.addEventListener('click', function () { API.showView('wall'); });
    });
    var help = host.querySelector('[data-act="open-sources-help"]');
    if (help) help.addEventListener('click', function () {
      var d = document.getElementById('sourcesDialog');
      if (d) d.showModal();
    });

    wireIptv(host);
    wireJellyfin(host);

    /* a stored guide URL is re-fetched on load; the parsed guide is never persisted */
    if (s.iptv && s.iptv.epgUrl && !iptv.guide && !iptv.guideLoading) {
      if (window.MVLib.safeUrl(s.iptv.epgUrl)) loadGuide(s.iptv.epgUrl);
      else iptv.guideNote = 'Guide URL is not valid.';
    }

    if (browse.open) {
      var which = browse.which;
      openBrowser(which);
    }
  }

  function iptvCard(conn) {
    var connected = !!(conn && conn.channels && conn.channels.length);
    return '' +
      '<div class="card-head"><div><h2>iptv</h2><p>m3u playlist + optional xmltv guide</p></div>' +
        statusPill(connected, connected ? (conn.channels.length + ' channels') : 'not connected') + '</div>' +
      (connected ?
        '<div class="card-stats">' +
          '<div><strong>' + conn.channels.length + '</strong><span>channels</span></div>' +
          '<div><strong>' + (conn.epgUrl ? 'yes' : 'no') + '</strong><span>guide</span></div>' +
          '<div><strong>' + ((conn.favorites || []).length) + '</strong><span>favorites</span></div>' +
        '</div>' +
        '<div class="card-actions">' +
          '<button class="btn primary" data-act="iptv-browse">browse channels</button>' +
          '<button class="btn" data-act="iptv-test">test a stream</button>' +
          '<button class="btn ghost danger" data-act="iptv-remove">remove</button>' +
        '</div>' +
        '<p class="card-note">' + (conn.epgUrl ? (iptv.guideNote || 'guide loading…') : 'no guide attached. add an xmltv url below to show now/next.') + '</p>' +
        '<details class="card-more"><summary>replace the playlist</summary>' + iptvForm(conn) + '</details>'
        : iptvForm(conn)) +
      '<p class="card-note">stored in this browser only. never logged.</p>';
  }

  function iptvForm(conn) {
    return '<div class="form">' +
      '<label class="field"><span>playlist url</span>' +
        '<input type="url" data-field="iptv-url" placeholder="https://example.com/playlist.m3u" value="' + esc(conn && conn.playlistUrl ? conn.playlistUrl : '') + '"></label>' +
      '<label class="field"><span>xmltv guide url <em>optional</em></span>' +
        '<input type="url" data-field="iptv-epg" placeholder="https://example.com/guide.xml" value="' + esc(conn && conn.epgUrl ? conn.epgUrl : '') + '"></label>' +
      '<div class="form-row">' +
        '<button class="btn primary" data-act="iptv-connect">connect playlist</button>' +
        '<button class="btn" data-act="iptv-file">choose file…</button>' +
        '<input type="file" accept=".m3u,.m3u8,audio/x-mpegurl,application/vnd.apple.mpegurl,text/plain" data-field="iptv-file" hidden>' +
      '</div>' +
      '<p class="form-msg" data-msg="iptv" hidden></p>' +
    '</div>';
  }

  function jellyfinCard(conn) {
    var connected = !!(conn && conn.baseUrl && conn.token);
    return '' +
      '<div class="card-head"><div><h2>jellyfin</h2><p>your own media server</p></div>' +
        statusPill(connected, connected ? (conn.serverName || 'connected') : 'not connected') + '</div>' +
      (connected ?
        '<div class="card-stats">' +
          '<div><strong>' + esc(conn.userName || '—') + '</strong><span>user</span></div>' +
          '<div><strong>' + esc(conn.version || '—') + '</strong><span>server</span></div>' +
          '<div><strong>' + (conn.liveTv === false ? 'off' : 'check') + '</strong><span>live tv</span></div>' +
        '</div>' +
        '<div class="card-actions">' +
          '<button class="btn primary" data-act="jf-browse">browse live tv</button>' +
          '<button class="btn" data-act="jf-test">test connection</button>' +
          '<button class="btn ghost danger" data-act="jf-remove">disconnect</button>' +
        '</div>' +
        '<details class="card-more"><summary>use a different server</summary>' + jellyfinForm(conn) + '</details>'
        : jellyfinForm(conn)) +
      '<p class="card-note">' +
        (conn && conn.remember ? 'token saved on this device. passwords are never stored.' : 'memory-only session. passwords are never stored.') +
      '</p>';
  }

  function jellyfinForm(conn) {
    return '<div class="form">' +
      '<label class="field"><span>Server URL</span>' +
        '<input type="url" data-field="jf-url" placeholder="https://jellyfin.example.com" value="' + esc(conn && conn.baseUrl ? conn.baseUrl : '') + '"></label>' +
      '<div class="form-row two">' +
        '<label class="field"><span>Username</span><input type="text" data-field="jf-user" autocomplete="username" value="' + esc(conn && conn.userName ? conn.userName : '') + '"></label>' +
        '<label class="field"><span>Password</span><input type="password" data-field="jf-pass" autocomplete="current-password"></label>' +
      '</div>' +
      '<label class="field"><span>…or an API key <em>optional</em></span><input type="password" data-field="jf-token" placeholder="Paste a Jellyfin API key"></label>' +
      '<label class="check"><input type="checkbox" data-field="jf-remember" checked> Remember this server on this device</label>' +
      '<div class="form-row"><button class="btn primary" data-act="jf-connect">Connect</button></div>' +
      '<p class="form-msg" data-msg="jf" hidden></p>' +
    '</div>';
  }

  /* ── IPTV wiring ───────────────────────────────────────────── */

  function setMsg(kind, message, isError) {
    var host = document.getElementById('sourcesView');
    var node = host && host.querySelector('[data-msg="' + kind + '"]');
    if (!node) return;
    node.textContent = message || '';
    node.hidden = !message;
    node.classList.toggle('err', !!isError);
  }

  function wireIptv(host) {
    var connect = host.querySelector('[data-act="iptv-connect"]');
    if (connect) connect.addEventListener('click', function () {
      var url = host.querySelector('[data-field="iptv-url"]').value.trim();
      var epg = host.querySelector('[data-field="iptv-epg"]').value.trim();
      if (!url) { setMsg('iptv', 'Enter a playlist URL, or choose a file.', true); return; }
      loadPlaylistFromUrl(url, epg);
    });

    var fileBtn = host.querySelector('[data-act="iptv-file"]');
    if (fileBtn) fileBtn.addEventListener('click', function () {
      host.querySelector('[data-field="iptv-file"]').click();
    });
    var fileInput = host.querySelector('[data-field="iptv-file"]');
    if (fileInput) fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (file.size > 24 * 1024 * 1024) { setMsg('iptv', 'That file is larger than 24 MB.', true); return; }
      var reader = new FileReader();
      reader.onload = function () { applyPlaylist(String(reader.result), '', '', file.name); };
      reader.onerror = function () { setMsg('iptv', 'That file could not be read.', true); };
      reader.readAsText(file);
    });

    var browseBtn = host.querySelector('[data-act="iptv-browse"]');
    if (browseBtn) browseBtn.addEventListener('click', function () { openBrowser('iptv'); });

    var testBtn = host.querySelector('[data-act="iptv-test"]');
    if (testBtn) testBtn.addEventListener('click', function () {
      var conn = API.getState().sources.iptv;
      if (!conn || !conn.channels.length) return;
      var target = conn.channels[0];
      API.addMedia({ url: target.url, title: target.name, group: target.group, source: 'iptv', hls: /\.m3u8(\?|$)/i.test(target.url) });
      API.toast('Opened “' + target.name + '” as a test tile.');
    });

    var removeBtn = host.querySelector('[data-act="iptv-remove"]');
    if (removeBtn) removeBtn.addEventListener('click', function () {
      var s = API.getState();
      s.sources.iptv = null;
      iptv.guide = null;
      iptv.guideLoading = false;
      iptv.guideNote = '';
      API.save();
      renderSources();
      API.toast('IPTV playlist removed.');
    });
  }

  function applyPlaylist(text, playlistUrl, epgUrl, fileName) {
    var parsed = window.MVLib.parseM3U(text);
    if (parsed.error) { setMsg('iptv', parsed.error, true); return; }
    if (!parsed.channels.length) { setMsg('iptv', 'No playable channels were found in that playlist.', true); return; }

    var s = API.getState();
    s.sources.iptv = {
      name: fileName || 'IPTV playlist',
      playlistUrl: playlistUrl || '',
      epgUrl: epgUrl || '',
      channels: parsed.channels,
      favorites: (s.sources.iptv && s.sources.iptv.favorites) || [],
      addedAt: Date.now(),
    };
    API.save();
    iptv.guide = null;
    iptv.guideNote = epgUrl ? 'Loading guide…' : '';
    renderSources();

    API.toast(parsed.channels.length + ' channels loaded' + (parsed.truncated ? ' (first ' + window.MVLib.MAX_CHANNELS + ')' : '') +
      (parsed.skipped ? ' · ' + parsed.skipped + ' skipped' : '') + ' in ' + parsed.ms + 'ms.');

    if (epgUrl) loadGuide(epgUrl);
  }

  function loadPlaylistFromUrl(url, epgUrl) {
    var safe = window.MVLib.safeUrl(url);
    if (!safe) { setMsg('iptv', 'That playlist URL is not a valid http(s) address.', true); return; }
    setMsg('iptv', 'Fetching playlist…');
    fetch(safe, { credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('The playlist responded ' + res.status + '.');
        return res.text();
      })
      .then(function (text) { applyPlaylist(text, safe, epgUrl, ''); })
      .catch(function (err) {
        setMsg('iptv', 'Could not fetch the playlist: ' + (err && err.message ? err.message : 'network error') +
          '. If the server does not allow CORS, download the file and use “Choose file…”.', true);
      });
  }

  function loadGuide(url) {
    var safe = window.MVLib.safeUrl(url);
    if (!safe) { iptv.guideNote = 'Guide URL is not valid.'; return; }
    if (iptv.guideLoading) return;
    iptv.guideLoading = true;
    iptv.guideNote = 'Loading guide…';
    fetch(safe, { credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('guide responded ' + res.status);
        return res.text();
      })
      .then(function (text) {
        var epg = window.MVLib.parseXMLTV(text);
        if (epg.error) throw new Error(epg.error);
        var conn = API.getState().sources.iptv;
        var built = window.MVLib.buildGuide(conn.channels, epg);
        iptv.guide = built;
        iptv.guideNote = 'Guide: ' + epg.count + ' programmes · ' + built.matched + ' channels matched.';
        iptv.guideLoading = false;
        renderSources();
      })
      .catch(function (err) {
        iptv.guide = null;
        iptv.guideLoading = false;
        iptv.guideNote = 'Guide unavailable: ' + (err && err.message ? err.message : 'network error') +
          '. CORS is the usual cause; a same-origin or CORS-enabled guide URL works.';
        renderSources();
      });
  }

  /* ── Jellyfin wiring ───────────────────────────────────────── */

  function wireJellyfin(host) {
    var connect = host.querySelector('[data-act="jf-connect"]');
    if (connect) connect.addEventListener('click', function () {
      var url = host.querySelector('[data-field="jf-url"]').value.trim();
      var user = host.querySelector('[data-field="jf-user"]').value.trim();
      var pass = host.querySelector('[data-field="jf-pass"]').value;
      var token = host.querySelector('[data-field="jf-token"]').value.trim();
      var remember = host.querySelector('[data-field="jf-remember"]').checked;
      if (!url) { setMsg('jf', 'Enter the server URL.', true); return; }
      setMsg('jf', 'Connecting…');
      connectJellyfin(url, { username: user, password: pass, token: token }, remember);
    });

    var browseBtn = host.querySelector('[data-act="jf-browse"]');
    if (browseBtn) browseBtn.addEventListener('click', function () { openBrowser('jellyfin'); });

    var testBtn = host.querySelector('[data-act="jf-test"]');
    if (testBtn) testBtn.addEventListener('click', function () { testJellyfin(); });

    var removeBtn = host.querySelector('[data-act="jf-remove"]');
    if (removeBtn) removeBtn.addEventListener('click', function () {
      var s = API.getState();
      s.sources.jellyfin = null;
      API.save();
      jelly.channels = null;
      renderSources();
      API.toast('Jellyfin disconnected.');
    });
  }

  function connectJellyfin(baseUrl, credentials, remember) {
    var client = new window.MVLib.Jellyfin(baseUrl);
    client.connect(credentials)
      .then(function () {
        return client.liveTvInfo().then(function (info) {
          var s = API.getState();
          s.sources.jellyfin = {
            baseUrl: client.base,
            token: remember ? client.token : '',
            sessionToken: client.token,
            userId: client.userId,
            userName: client.userName,
            serverName: client.serverName,
            version: client.version,
            liveTv: !!info,
            remember: !!remember,
            addedAt: Date.now(),
          };
          API.save();
          renderSources();
          API.toast('Connected to ' + (client.serverName || 'Jellyfin') + (info ? '' : ' — Live TV is not configured on this server.'));
        });
      })
      .catch(function (err) {
        var reason = err && err.message ? err.message : 'Could not connect.';
        if (!/[.!?]$/.test(reason)) reason += '.';
        setMsg('jf', reason + ' Check the URL, that the server is reachable from this browser, and that CORS is allowed.', true);
      });
  }

  function testJellyfin() {
    var conn = API.getState().sources.jellyfin;
    if (!conn) return;
    var token = conn.token || conn.sessionToken;
    setMsg('jf', 'Testing…');
    var client = new window.MVLib.Jellyfin(conn.baseUrl);
    client.token = token;
    client.userId = conn.userId;
    client.request('/Users/Me')
      .then(function (me) {
        setMsg('jf', 'OK — signed in as ' + (me.Name || 'user') + '.');
      })
      .catch(function (err) {
        setMsg('jf', 'Test failed: ' + (err && err.message ? err.message : 'no response') + '.', true);
      });
  }

  /* ── channel browser ──────────────────────────────────────── */

  function openBrowser(which) {
    browse.open = true;
    browse.which = which;
    var host = document.getElementById('browserHost');
    if (!host) return;

    if (which === 'jellyfin') {
      var conn = API.getState().sources.jellyfin;
      if (!conn) return;
      host.innerHTML = '<section class="browser"><div class="browser-head"><h2>jellyfin live tv</h2>' +
        '<button class="btn ghost" data-act="close-browser">Close</button></div>' +
        '<p class="browser-note">' + (jelly.loading ? 'Loading channels…' : jelly.error ? esc(jelly.error) : '') + '</p>' +
        '<div class="chan-list" data-list="jellyfin"></div></section>';
      host.querySelector('[data-act="close-browser"]').addEventListener('click', closeBrowser);
      if (!jelly.channels && !jelly.loading) loadJellyfinChannels();
      else renderJellyRows();
      return;
    }

    host.innerHTML = '<section class="browser">' +
      '<div class="browser-head"><div><h2>iptv channels</h2><p class="browser-sub" data-f="count"></p></div>' +
        '<button class="btn ghost" data-act="close-browser">Close</button></div>' +
      '<div class="browser-tools">' +
        '<input type="search" class="browser-search" placeholder="Search channels" data-f="q">' +
        '<select class="browser-select" data-f="group"></select>' +
        '<label class="check"><input type="checkbox" data-f="fav"> Favorites</label>' +
      '</div>' +
      '<p class="browser-note" data-f="note"></p>' +
      '<div class="chan-viewport" data-f="viewport"><div class="chan-rows" data-f="rows"></div></div>' +
    '</section>';

    host.querySelector('[data-act="close-browser"]').addEventListener('click', closeBrowser);
    var q = host.querySelector('[data-f="q"]');
    var timer = null;
    q.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { iptv.filter = q.value.trim().toLowerCase(); refreshList(); }, 140);
    });
    host.querySelector('[data-f="group"]').addEventListener('change', function (e) {
      iptv.group = e.target.value;
      refreshList();
    });
    host.querySelector('[data-f="fav"]').addEventListener('change', function (e) {
      iptv.favOnly = e.target.checked;
      refreshList();
    });

    iptv.viewport = host.querySelector('[data-f="viewport"]');
    iptv.viewport.addEventListener('scroll', function () { paintRows(); }, { passive: true });

    buildGroups();
    refreshList();
  }

  function closeBrowser() {
    browse.open = false;
    var host = document.getElementById('browserHost');
    if (host) host.innerHTML = '';
  }

  function buildGroups() {
    var conn = API.getState().sources.iptv;
    var host = document.getElementById('browserHost');
    var select = host && host.querySelector('[data-f="group"]');
    if (!conn || !select) return;
    var groups = [];
    var seen = Object.create(null);
    conn.channels.forEach(function (c) {
      var g = c.group || 'Ungrouped';
      if (!seen[g]) { seen[g] = 1; groups.push(g); }
    });
    groups.sort();
    select.innerHTML = '<option value="">All groups</option>' +
      groups.map(function (g) { return '<option value="' + esc(g) + '">' + esc(g) + '</option>'; }).join('');
  }

  function refreshList() {
    var conn = API.getState().sources.iptv;
    if (!conn) return;
    var favs = conn.favorites || [];
    var list = conn.channels.filter(function (c) {
      if (iptv.group && (c.group || 'Ungrouped') !== iptv.group) return false;
      if (iptv.favOnly && favs.indexOf(c.id) === -1) return false;
      if (iptv.filter && c.name.toLowerCase().indexOf(iptv.filter) === -1 &&
        (c.group || '').toLowerCase().indexOf(iptv.filter) === -1) return false;
      return true;
    });
    iptv.list = list;

    var host = document.getElementById('browserHost');
    if (!host) return;
    var count = host.querySelector('[data-f="count"]');
    if (count) count.textContent = list.length + ' of ' + conn.channels.length + ' channels';
    var note = host.querySelector('[data-f="note"]');
    if (note) {
      note.textContent = iptv.guide
        ? 'Guide loaded · ' + iptv.guide.matched + ' matched channels'
        : (iptv.guideNote || 'No guide loaded — now/next is hidden.');
    }

    var rowsHost = host.querySelector('[data-f="rows"]');
    if (!rowsHost) return;
    rowsHost.style.height = (list.length * ROW) + 'px';
    paintRows();
  }

  function paintRows() {
    var host = document.getElementById('browserHost');
    if (!host) return;
    var rowsHost = host.querySelector('[data-f="rows"]');
    var vp = iptv.viewport;
    if (!rowsHost || !vp) return;

    var start = Math.max(0, Math.floor(vp.scrollTop / ROW) - 6);
    var visible = Math.ceil((vp.clientHeight || 400) / ROW) + 12;
    var end = Math.min(iptv.list.length, start + visible);
    var html = '';
    var conn = API.getState().sources.iptv;
    var favs = (conn && conn.favorites) || [];

    for (var i = start; i < end; i++) {
      var c = iptv.list[i];
      if (!c) continue;
      var guide = iptv.guide ? iptv.guide.map.get(c.id) : null;
      var slot = guide ? window.MVLib.nowNext(guide) : null;
      var sub = slot && slot.now ? slot.now.title : (slot && slot.next ? 'Next: ' + slot.next.title : (c.group || 'IPTV'));
      html += '<div class="chan-row" style="top:' + (i * ROW) + 'px" data-id="' + esc(c.id) + '">' +
        (c.logo ? '<img class="chan-logo" src="' + esc(c.logo) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '<span class="chan-logo placeholder">' + esc((c.name[0] || '?').toUpperCase()) + '</span>') +
        '<span class="chan-text"><strong>' + esc(c.name) + '</strong><span>' + esc(sub) + '</span></span>' +
        '<button class="chan-fav' + (favs.indexOf(c.id) !== -1 ? ' on' : '') + '" data-fav="' + esc(c.id) + '" aria-label="Favorite">' +
          '<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="m10 3.6 1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="' + (favs.indexOf(c.id) !== -1 ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<button class="btn tiny" data-play="' + esc(c.id) + '">Add</button>' +
      '</div>';
    }
    rowsHost.innerHTML = html;

    rowsHost.querySelectorAll('[data-play]').forEach(function (btn) {
      btn.addEventListener('click', function () { playChannel(btn.dataset.play); });
    });
    rowsHost.querySelectorAll('[data-fav]').forEach(function (btn) {
      btn.addEventListener('click', function () { toggleFav(btn.dataset.fav); });
    });
  }

  function playChannel(id) {
    var conn = API.getState().sources.iptv;
    var ch = conn && conn.channels.find(function (c) { return c.id === id; });
    if (!ch) return;
    API.addMedia({
      url: ch.url,
      title: ch.name,
      group: ch.group,
      source: 'iptv',
      hls: /\.m3u8(\?|$)/i.test(ch.url),
    });
  }

  function toggleFav(id) {
    var s = API.getState();
    var conn = s.sources.iptv;
    if (!conn) return;
    conn.favorites = conn.favorites || [];
    var at = conn.favorites.indexOf(id);
    if (at === -1) conn.favorites.push(id);
    else conn.favorites.splice(at, 1);
    API.save();
    refreshList();
  }

  function loadJellyfinChannels() {
    var conn = API.getState().sources.jellyfin;
    if (!conn) return;
    jelly.loading = true;
    jelly.error = '';
    renderJellyRows();

    var client = new window.MVLib.Jellyfin(conn.baseUrl);
    client.token = conn.token || conn.sessionToken;
    client.userId = conn.userId;
    client.liveChannels()
      .then(function (items) {
        jelly.channels = items;
        jelly.loading = false;
        renderJellyRows();
        var host = document.getElementById('browserHost');
        if (host) { var n = host.querySelector('.browser-note'); if (n) n.textContent = items.length + ' channels from Jellyfin.'; }
      })
      .catch(function (err) {
        jelly.loading = false;
        jelly.error = 'Could not load channels: ' + (err && err.message ? err.message : 'no response') +
          '. Live TV must be configured, and the browser must be allowed by CORS.';
        renderJellyRows();
      });
  }

  function renderJellyRows() {
    var host = document.getElementById('browserHost');
    if (!host) return;
    var list = host.querySelector('[data-list="jellyfin"]');
    if (!list) return;

    if (jelly.loading) { list.innerHTML = '<div class="browser-empty">Loading channels…</div>'; return; }
    if (jelly.error) { list.innerHTML = '<div class="browser-empty err">' + esc(jelly.error) + '</div>'; return; }
    if (!jelly.channels || !jelly.channels.length) {
      list.innerHTML = '<div class="browser-empty">No Live TV channels. Jellyfin only returns channels when a tuner or M3U source is configured on the server.</div>';
      return;
    }

    var conn = API.getState().sources.jellyfin;
    var client = new window.MVLib.Jellyfin(conn.baseUrl);
    client.token = conn.token || conn.sessionToken;

    list.innerHTML = jelly.channels.slice(0, 500).map(function (ch) {
      return '<div class="chan-row static">' +
        '<span class="chan-logo placeholder">' + esc((ch.Name || '?').charAt(0).toUpperCase()) + '</span>' +
        '<span class="chan-text"><strong>' + esc(ch.Name || 'Channel') + '</strong><span>' +
          esc(ch.ChannelNumber ? 'Channel ' + ch.ChannelNumber : (ch.ServiceName || 'Live TV')) + '</span></span>' +
        '<button class="btn tiny" data-jf-play="' + esc(ch.Id) + '">Add</button>' +
      '</div>';
    }).join('');

    list.querySelectorAll('[data-jf-play]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        API.addMedia({
          url: client.playUrl(btn.dataset.jfPlay, { hls: true }),
          title: (jelly.channels.find(function (c) { return c.Id === btn.dataset.jfPlay; }) || {}).Name || 'Jellyfin',
          source: 'jellyfin',
          itemId: btn.dataset.jfPlay,
          hls: true,
        });
        API.toast('Opening the Jellyfin stream — if it stays blank, the server may need transcoding for this browser.');
      });
    });
  }

  /* ── SUGGESTED CHANNELS ────────────────────────────────────── */

  var SUGGEST = [
    /* News */
    { name: 'Bloomberg Television', cat: 'News', tag: 'YouTube', note: 'Markets, business and global news, all day', url: 'https://www.youtube.com/channel/UCIALMKvObZNtJ6AmdCLP7Lg/live', live: true },
    { name: 'NewsNation', cat: 'News', tag: 'YouTube', note: 'US news and live desk coverage', url: 'https://www.youtube.com/channel/UCGWTUS6esxeTcmFJN_RwbEQ/live', live: true },
    { name: 'Law&Crime Network', cat: 'News', tag: 'YouTube', note: 'Trials and true-crime uploads', url: 'https://www.youtube.com/playlist?list=UUz8K1occVvDTYDfFo7N5EZw', playlist: true, fresh: true },
    { name: 'ABC News Live', cat: 'News', tag: 'Samsung TV Plus', note: 'Live news, headlines and special reports', url: 'https://www.youtube.com/watch?v=6QFVhVT187M', live: true },
    /* Sport, science, city, kids */
    { name: 'LiveNOW from FOX', cat: 'Sport', tag: 'Samsung TV Plus', note: 'Live news and sport, no panel shows', url: 'https://www.youtube.com/watch?v=Lhk3Gu0YeRs', live: true },
    { name: 'CBS News 24/7', cat: 'News', tag: 'YouTube', note: 'Live breaking news and top stories', url: 'https://www.youtube.com/watch?v=q8Puv82CkFw', live: true },
    { name: 'Times Square', cat: 'City', tag: 'Samsung TV Plus', note: 'EarthCam live from New York', url: 'https://www.youtube.com/watch?v=ZxCeWQ3Lcig', live: true },
    { name: 'Cartoon Network', cat: 'Kids', tag: 'Samsung TV Plus', note: 'Gumball, nonstop', url: 'https://www.youtube.com/watch?v=nIyaCRNwxhU', live: true },
    { name: 'Boomerang', cat: 'Kids', tag: 'Samsung TV Plus', note: 'Tom & Jerry, nonstop', url: 'https://www.youtube.com/watch?v=ALGbqW-tUAQ', live: true },
    /* Creators */
    { name: 'MrBeast', cat: 'Creators', tag: 'YouTube', note: 'Official long-form playlist, shuffled', url: 'https://www.youtube.com/playlist?list=PLoSWVnSA9vG8SK6-_45PAu6RVTaP1zXHf', playlist: true },
    { name: 'MrBeast Gaming', cat: 'Creators', tag: 'YouTube', note: 'One-hour compilations, shuffled', url: 'https://www.youtube.com/playlist?list=PLnYX1qinc5ASs-gDN960p3yo_YOYvialR', playlist: true },
    { name: 'Good Mythical Morning', cat: 'Creators', tag: 'YouTube', note: 'Daily-ish uploads playlist', url: 'https://www.youtube.com/playlist?list=UU4PooiX37Pld1T8J5SYT-SQ', playlist: true },
    { name: 'Conan O\'Brien', cat: 'Creators', tag: 'YouTube', note: 'Team Coco uploads, remotes and clips', url: 'https://www.youtube.com/playlist?list=UUi7GJNg51C3jgmYTUwqoUXA', playlist: true },
    { name: 'Mark Rober', cat: 'Creators', tag: 'YouTube', note: 'Science builds and experiments', url: 'https://www.youtube.com/playlist?list=UU513PdAP2-jWkJunTh5kXRw', playlist: true },
    { name: 'Dude Perfect', cat: 'Creators', tag: 'YouTube', note: 'Tricks, challenges and sport', url: 'https://www.youtube.com/playlist?list=UUJrWyyCRROi8NlQ6Xd9dx5Q', playlist: true },
    { name: 'Sidemen', cat: 'Creators', tag: 'YouTube', note: 'Group challenges and football', url: 'https://www.youtube.com/playlist?list=UUh5mLn90vUaB1PbRRx_AiaA', playlist: true },
    { name: 'Michelle Khare', cat: 'Creators', tag: 'YouTube', note: 'Challenge Accepted and skill series', url: 'https://www.youtube.com/playlist?list=UUGGZ_POGmIWG1pQXTDzQv-g', playlist: true },
    { name: 'Airrack', cat: 'Creators', tag: 'YouTube', note: 'Big stunts and challenges', url: 'https://www.youtube.com/playlist?list=UU7oAKdhAM_ImxYOkLLPC9TQ', playlist: true },
    { name: 'Zach King', cat: 'Creators', tag: 'YouTube', note: 'Magic vines and edits', url: 'https://www.youtube.com/playlist?list=UUiJUp_NBW2D_UMQIvq2nlPg', playlist: true },
    { name: 'Corridor Crew', cat: 'Creators', tag: 'YouTube', note: 'VFX artists react and breakdowns', url: 'https://www.youtube.com/playlist?list=UUsn6cjffsvyOZCZxvGoJxGg', playlist: true },
    { name: 'Yes Theory', cat: 'Creators', tag: 'YouTube', note: 'Travel and seek discomfort', url: 'https://www.youtube.com/playlist?list=UUTd7KzdwnFE3lm6LCfYDmUQ', playlist: true },
    { name: 'Jubilee', cat: 'Creators', tag: 'YouTube', note: 'Surrounded and middle ground', url: 'https://www.youtube.com/playlist?list=UUQCKnN9inc30A9f7IYP5_QA', playlist: true },
    { name: 'Jesse Weber', cat: 'News', tag: 'YouTube', note: 'Law&Crime host — trials and legal analysis', url: 'https://www.youtube.com/playlist?list=UUg5XcYTwshKxNIAIs2_sTGg', playlist: true, fresh: true },
    /* Tech */
    { name: 'Linus Tech Tips', cat: 'Tech', tag: 'YouTube', note: 'Builds, reviews and teardowns', url: 'https://www.youtube.com/playlist?list=UUdBK94H6oZT2Q7l0-b0xmMg', playlist: true },
    { name: 'Marques Brownlee', cat: 'Tech', tag: 'YouTube', note: 'MKBHD reviews and explainers', url: 'https://www.youtube.com/playlist?list=UUG7J20LhUeLl6y_Emi7OJrA', playlist: true },
    /* Learning */
    { name: 'TED', cat: 'Learning', tag: 'YouTube', note: 'Talks playlist, plays continuously', url: 'https://www.youtube.com/playlist?list=UUsT0YIqwnpJCM-mx7-gSA4Q', playlist: true },
    { name: 'Kurzgesagt', cat: 'Learning', tag: 'YouTube', note: 'Animated science explainers', url: 'https://www.youtube.com/playlist?list=UUq8ZAAsI89IoJ-fn1gYpO3g', playlist: true },
    { name: 'Veritasium', cat: 'Science', tag: 'YouTube', note: 'Science and engineering, explained', url: 'https://www.youtube.com/playlist?list=UU1UmujXTizWokDHojdEOdow', playlist: true },
    { name: 'Numberphile', cat: 'Learning', tag: 'YouTube', note: 'Maths with people who love it', url: 'https://www.youtube.com/playlist?list=UUtwKon9qMt5YLVgQt1tvJKg', playlist: true },
    { name: 'Vsauce', cat: 'Learning', tag: 'YouTube', note: 'Curiosity, questions and tangents', url: 'https://www.youtube.com/playlist?list=UU6nSFpj9HTCZ5t-N3Rm3-HA', playlist: true },
  ];
  var suggestFilter = 'All';
  var SUGGEST_CHECKED = '11 Nov 2026';

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
    }
    return list;
  }

  /* A random wall is a mix, not four things from the same shelf. Take one from
     each category first, then fill. Remember the last set so the next roll is
     different. */
  function randomPicks(count) {
    var pool = [];
    var seen = {};
    function add(url, name, cat, live, playlist) {
      if (!url || seen[url]) return;
      seen[url] = 1;
      pool.push({ url: url, name: name, cat: cat || 'More', live: !!live, playlist: !!playlist });
    }
    SUGGEST.forEach(function (c) { add(c.url, c.name, c.cat, c.live, c.playlist); });
    (API.sports ? API.sports() : []).forEach(function (sp) { add(sp.url, sp.name, 'Sport', true, false); });
    (API.presets ? API.presets() : []).forEach(function (p) {
      (p.links || []).forEach(function (url) {
        add(url, p.name, p.name, /\/live/.test(url), /playlist/.test(url));
      });
    });

    var groups = {};
    pool.forEach(function (c) { (groups[c.cat] = groups[c.cat] || []).push(c); });
    var cats = shuffle(Object.keys(groups));
    var picks = [];
    cats.forEach(function (cat) {
      var arr = groups[cat];
      if (arr.length) picks.push(arr[Math.floor(Math.random() * arr.length)]);
    });
    shuffle(pool).forEach(function (c) {
      if (picks.indexOf(c) === -1) picks.push(c);
    });

    var last = [];
    try { last = JSON.parse(sessionStorage.getItem('mv.random.last') || '[]'); } catch (e) { /* ignore */ }
    shuffle(picks).sort(function (a, b) {
      return (last.indexOf(a.url) >= 0 ? 1 : 0) - (last.indexOf(b.url) >= 0 ? 1 : 0);
    });

    var n = Math.max(1, Math.min(Number(count) || 4, 4));
    var chosen = picks.slice(0, n);
    /* 2-4 up always gets one comfort tile: Family Guy or American Dad. */
    if (n >= 2) {
      var funny = (API.presets ? API.presets() : []).filter(function (p) { return p.key === 'funny'; })[0];
      if (funny && funny.links && funny.links.length) {
        var used = chosen.map(function (c) { return c.url; });
        var options = funny.links.filter(function (u) { return used.indexOf(u) === -1; });
        if (!options.length) options = funny.links;
        var pick = options[Math.floor(Math.random() * options.length)];
        chosen[n - 1] = { url: pick, name: 'Funny', cat: 'Funny', live: false, playlist: false };
      }
    }
    try { sessionStorage.setItem('mv.random.last', JSON.stringify(chosen.map(function (c) { return c.url; }))); } catch (e) { /* ignore */ }
    return chosen.map(function (c) { return { url: c.url, name: c.name }; });
  }

  function renderChannels() {
    var host = document.getElementById('channelList');
    if (!host) return;
    var search = document.getElementById('channelSearch');
    var q = (search && search.value ? search.value : '').trim().toLowerCase();
    var list = SUGGEST.filter(function (c) {
      return !q || (c.name + ' ' + c.cat + ' ' + c.note).toLowerCase().indexOf(q) !== -1;
    });
    var state = API.getState();
    var active = state.views.filter(function (v) { return v.id === state.activeId; })[0];
    var have = {};
    (active ? active.tiles : []).forEach(function (t) { have[t.url] = true; });

    var live = list.filter(function (c) { return c.live; });
    var uploads = list.filter(function (c) { return c.playlist; }).sort(function (a, b) {
      return (b.fresh ? 1 : 0) - (a.fresh ? 1 : 0) || a.name.localeCompare(b.name);
    });

    function row(c) {
      var added = !!have[c.url];
      return '<div class="channel-row">' +
        '<span class="channel-dot ' + (c.live ? 'live' : 'play') + '"></span>' +
        '<span class="channel-row-text"><b>' + esc(c.name) + '</b><span>' + esc(c.cat) + ' · ' + esc(c.note) + '</span></span>' +
        '<button class="btn tiny channel-add" data-channel-add="' + esc(c.url) + '"' + (added ? ' disabled' : '') + '>' +
          (added ? 'added' : 'add') + '</button>' +
      '</div>';
    }

    function section(title, items) {
      if (!items.length) return '';
      return '<section class="channel-section">' +
        '<h3>' + esc(title) + ' <span>' + items.length + '</span></h3>' +
        items.map(row).join('') +
      '</section>';
    }

    host.innerHTML = section('live now', live) + section('new videos', uploads) ||
      '<p class="channel-empty">no channels match “' + esc(q) + '”.</p>';

    host.querySelectorAll('[data-channel-add]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (API.addUrls(btn.dataset.channelAdd)) {
          btn.disabled = true;
          btn.textContent = 'added';
        }
      });
    });

    if (search && !search._wired) {
      search._wired = true;
      search.addEventListener('input', renderChannels);
    }
  }

  function renderSuggested() {
    var host = document.getElementById('suggestedView');
    if (!host) return;
    var cats = ['All'];
    SUGGEST.forEach(function (c) { if (cats.indexOf(c.cat) === -1) cats.push(c.cat); });
    var list = SUGGEST.filter(function (c) { return suggestFilter === 'All' || c.cat === suggestFilter; });

    host.innerHTML =
      '<div class="dash">' +
        '<header class="dash-head">' +
          '<div>' +
            '<p class="eyebrow">discover</p>' +
            '<h1>live channels</h1>' +
            '<p class="dash-sub">youtube live feeds for channels you already know from samsung tv plus. add one, or fill a wall.</p>' +
            '<p class="suggest-check">checked ' + SUGGEST_CHECKED + ' · ' +
              SUGGEST.filter(function (c) { return c.live; }).length + ' live · ' +
              SUGGEST.length + ' listed</p>' +
          '</div>' +
          '<a class="btn" href="https://www.samsungtvplus.com/" target="_blank" rel="noopener noreferrer">open samsung tv plus ↗</a>' +
        '</header>' +
        '<div class="suggest-bar">' +
          '<div class="suggest-filters" role="group" aria-label="Channel category">' +
            cats.map(function (c) {
              return '<button class="suggest-chip' + (suggestFilter === c ? ' is-on' : '') + '" data-suggest-filter="' + esc(c) + '">' + esc(c) + '</button>';
            }).join('') +
          '</div>' +
          '<button class="btn primary" data-suggest-all title="' + (list.length > 4 ? 'A wall holds 4 tiles — this adds the first 4' : 'Add these to the wall') + '">' +
            (list.length ? 'add ' + Math.min(list.length, 9) + ' to wall' : 'nothing here') + '</button>' +
        '</div>' +
        '<div class="suggest-grid">' +
          list.map(function (c) {
            return '<button class="suggest-card" data-suggest-add="' + esc(c.url) + '" title="Add ' + esc(c.name) + '">' +
              '<span class="suggest-top"><span class="suggest-live' + (c.playlist ? ' is-vod' : '') + '"><i></i>' + (c.playlist ? 'playlist' : 'live') + '</span><span class="suggest-tag">' + esc(c.tag) + '</span></span>' +
              '<span class="suggest-name">' + esc(c.name) + '</span>' +
              '<span class="suggest-note">' + esc(c.cat) + ' · ' + esc(c.note) + '</span>' +
              '<span class="suggest-add">+ add to wall</span>' +
            '</button>';
          }).join('') +
        '</div>' +
        '<p class="suggest-foot">samsung tv plus is free and needs no account. some channels only live in samsung’s app; this list uses the youtube feeds that work in a tile.</p>' +
      '</div>';

    host.querySelectorAll('[data-suggest-filter]').forEach(function (b) {
      b.addEventListener('click', function () { suggestFilter = b.dataset.suggestFilter; renderSuggested(); });
    });
    host.querySelectorAll('[data-suggest-add]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (API.addUrls(b.dataset.suggestAdd)) API.showView('wall');
      });
    });
    var all = host.querySelector('[data-suggest-all]');
    if (all) all.addEventListener('click', function () {
      var urls = list.map(function (c) { return c.url; });
      if (urls.length && API.addUrls(urls.join(' '))) API.showView('wall');
    });
  }

  return {
    init: init,
    renderHome: renderHome,
    renderSources: renderSources,
    renderSuggested: renderSuggested,
    renderChannels: renderChannels,
    randomPicks: randomPicks,
    openWalls: openWalls,
  };
})();
