/* status page: reads the build id and the latest feed health. No tracking. */
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
  fetch('BUILD.txt', { cache: 'no-cache' })
    .then(function (res) { return res.text(); })
    .then(function (body) {
      var build = /^build\s+(\S+)/m.exec(body);
      var date = /^date\s+(\S+)/m.exec(body);
      text('build', build ? build[1] : 'unknown');
      text('buildDate', date ? 'built ' + date[1] : 'build date unknown');
    })
    .catch(function () { text('buildDate', 'build unavailable'); });

  fetch('health.json', { cache: 'no-cache' })
    .then(function (res) { return res.json(); })
    .then(function (health) {
      var checked = Number(health.checked) || 0;
      var ok = Number(health.ok) || 0;
      var bad = Number(health.bad) || 0;
      var node = document.getElementById('feedOk');
      if (node) {
        node.textContent = ok + '/' + checked;
        node.className = bad ? 'bad' : 'ok';
      }
      var thumbs = Number(health.thumbs_checked) || 0;
      var thumbsOk = Number(health.thumbs_ok) || 0;
      text('feedMeta', bad ? bad + ' need a look' : (thumbs ? ok + '/' + checked + ' feeds · ' + thumbsOk + '/' + thumbs + ' images' : 'all curated feeds respond'));
      text('checkedAt', health.generated ? ago(health.generated) : 'unknown');
      var list = document.getElementById('badList');
      if (!list) return;
      list.innerHTML = '';
      (health.items || []).slice(0, 20).forEach(function (item) {
        var li = document.createElement('li');
        li.textContent = (item.status || '?') + ' · ' + (item.url || '');
        list.appendChild(li);
      });
    })
    .catch(function () {
      text('feedMeta', 'health.json not published yet');
    });
})();
