/* status page: build id, latest feed health, uptime history. No tracking. */
(function () {
  'use strict';

  function text(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function ago(iso) {
    var then = Date.parse(iso);
    if (!then) return 'unknown';
    var seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
    if (seconds < 90) return 'just now';
    if (seconds < 3600) return Math.round(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.round(seconds / 3600) + 'h ago';
    return Math.round(seconds / 86400) + 'd ago';
  }

  function pair(ok, total) {
    if (!total) return String(ok || 0);
    return ok + '/' + total;
  }

  function colour(node, bad) {
    if (!node) return;
    node.classList.toggle('bad', bad > 0);
    node.classList.toggle('ok', bad === 0);
  }

  fetch('BUILD.txt', { cache: 'no-cache' })
    .then(function (res) { return res.text(); })
    .then(function (body) {
      var build = /^build\s+(\S+)/m.exec(body);
      text('build', build ? build[1] : 'unknown');
    })
    .catch(function () { text('build', 'unknown'); });

  fetch('health.json', { cache: 'no-cache' })
    .then(function (res) { return res.json(); })
    .then(function (health) {
      var checked = Number(health.checked) || 0;
      var ok = Number(health.ok) || 0;
      var bad = Number(health.bad) || 0;
      var thumbs = Number(health.thumbs_checked) || 0;
      var thumbsOk = Number(health.thumbs_ok) || 0;
      var thumbBad = Number(health.thumbs_bad) || 0;
      var pages = Number(health.pages_checked) || 0;
      var pagesOk = Number(health.pages_ok) || 0;
      var pagesBad = Math.max(0, pages - pagesOk);

      text('linksOk', pair(ok, checked));
      colour(document.getElementById('linksOk'), bad);
      text('thumbsOk', pair(thumbsOk, thumbs));
      colour(document.getElementById('thumbsOk'), thumbBad);
      if (pages) {
        text('pagesOk', pair(pagesOk, pages));
        colour(document.getElementById('pagesOk'), pagesBad);
      } else {
        text('pagesOk', 'up');
        colour(document.getElementById('pagesOk'), 0);
      }
      text('checkedAt', health.generated ? ago(health.generated) : 'unknown');

      var list = document.getElementById('badList');
      if (!list) return;
      list.textContent = '';
      var dead = (health.pages || []).concat(health.items || []).concat(health.bad_thumbs || []);
      dead.slice(0, 20).forEach(function (item) {
        var li = document.createElement('li');
        li.textContent = (item.status || '?') + ' · ' + (item.url || item.id || '');
        list.appendChild(li);
      });
      if (!dead.length) {
        var clean = document.createElement('li');
        clean.className = 'none';
        clean.textContent = 'nothing failing in the last run.';
        list.appendChild(clean);
      }
    })
    .catch(function () { text('checkedAt', 'health.json not published yet'); });

  if (window.multiviewUptime) {
    window.multiviewUptime.load().then(function (runs) {
      var host = document.querySelector('[data-uptime-bars]');
      window.multiviewUptime.paint(host, runs);
      var pct = window.multiviewUptime.uptime(runs);
      text('uptimePct', pct === null ? '—' : pct + '%');
      var first = runs.length ? String(runs[0].d || '') : '';
      var since = /^\d{4}-\d{2}-\d{2}$/.test(first)
        ? new Date(first + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })
        : '';
      text('uptimeMeta', runs.length
        ? runs.length + (runs.length === 1 ? ' check' : ' checks') + (since ? ' since ' + since : '') + ' · one bar per day'
        : 'no checks recorded yet');
    }).catch(function () { text('uptimeMeta', 'history not published yet'); });
  }
})();
