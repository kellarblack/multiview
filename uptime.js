/* Uptime history, rendered as small bars. Reads uptime.json, which the daily
   health check writes. No tracking, no requests until a page asks for it. */
(function () {
  'use strict';

  var WINDOW = 20;

  function ratio(run) {
    var total = Number(run && run.total) || 0;
    var ok = Number(run && run.ok) || 0;
    if (total <= 0) return null;
    return Math.max(0, Math.min(1, ok / total));
  }

  function level(run) {
    var value = ratio(run);
    if (value === null) return 'empty';
    if (value >= 0.999) return 'up';
    if (value >= 0.95) return 'warn';
    return 'down';
  }

  function day(run) {
    var day = String((run && run.d) || '');
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
    if (!match) return day;
    var date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    try {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (error) {
      return day;
    }
  }

  function summary(run) {
    var total = Number(run && run.total) || 0;
    var ok = Number(run && run.ok) || 0;
    return day(run) + ' · ' + ok + '/' + total + ' checks';
  }

  /* Percent across the whole window, rounded to one decimal below 100. */
  function uptime(runs) {
    var ok = 0;
    var total = 0;
    (runs || []).forEach(function (run) {
      var r = ratio(run);
      if (r === null) return;
      ok += Number(run.ok) || 0;
      total += Number(run.total) || 0;
    });
    if (!total) return null;
    var pct = (ok / total) * 100;
    if (pct >= 99.995) return 100;
    return Math.round(pct * 10) / 10;
  }

  function paint(host, runs) {
    if (!host) return;
    var list = (runs || []).filter(function (run) { return run && run.d; }).slice(-WINDOW);
    host.textContent = '';
    host.classList.add('uptime-bars');
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', list.length
      ? 'uptime: ' + (uptime(list) === null ? 'unknown' : uptime(list) + '%') + ' over the last ' + list.length + ' checks'
      : 'uptime: no checks recorded yet');

    var filled = list.length;
    var empty = Math.max(0, WINDOW - filled);
    for (var i = 0; i < empty; i++) {
      var pad = document.createElement('span');
      pad.className = 'ub is-empty';
      pad.setAttribute('aria-hidden', 'true');
      host.appendChild(pad);
    }
    list.forEach(function (run) {
      var bar = document.createElement('span');
      bar.className = 'ub is-' + level(run);
      bar.title = summary(run);
      host.appendChild(bar);
    });
  }

  function load() {
    return fetch('uptime.json', { cache: 'no-cache' }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).then(function (data) {
      return (data && data.runs) || [];
    });
  }

  window.multiviewUptime = {
    load: load,
    paint: paint,
    uptime: uptime,
    window: WINDOW
  };
})();
