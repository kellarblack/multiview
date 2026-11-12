/* multiview.cc — optional sync client.
 *
 * NOT loaded by index.html. Include it when you want accounts and cloud boards:
 *
 *   <script src="sync.js"></script>
 *   <script>MVSync.configure({ base: 'http://localhost:8787' });</script>
 *
 * The token is kept in memory by default. Call MVSync.remember(true) if you want it
 * in localStorage (convenient, but any injected script could read it).
 *
 * Every call resolves with the parsed JSON body, or rejects with an Error that has
 * .status. Nothing here touches the local board storage.
 */

window.MVSync = (function () {
  'use strict';

  var base = '';
  var token = '';
  var keep = false;
  var STORAGE_KEY = 'multiview.sync.token';

  function configure(options) {
    var opts = options || {};
    if (opts.base) base = String(opts.base).replace(/\/+$/, '');
    if (opts.token) token = String(opts.token);
    if (opts.remember) keep = true;
    if (keep && token) {
      try { localStorage.setItem(STORAGE_KEY, token); } catch (e) { /* ignore */ }
    }
    return MVSync;
  }

  function remember(on) {
    keep = !!on;
    try {
      if (!keep) localStorage.removeItem(STORAGE_KEY);
      else if (token) localStorage.setItem(STORAGE_KEY, token);
    } catch (e) { /* ignore */ }
    return MVSync;
  }

  function restore() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { token = saved; keep = true; }
    } catch (e) { /* ignore */ }
    return token;
  }

  function request(path, options) {
    var opts = options || {};
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;

    return fetch(base + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: 'omit',
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var err = new Error(data.error || ('Request failed: ' + res.status));
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  function setSession(data) {
    token = data.token || '';
    if (keep && token) {
      try { localStorage.setItem(STORAGE_KEY, token); } catch (e) { /* ignore */ }
    }
    return data;
  }

  var MVSync = {
    configure: configure,
    remember: remember,
    restore: restore,
    isSignedIn: function () { return !!token; },

    register: function (email, password) {
      return request('/api/auth/register', { method: 'POST', body: { email: email, password: password } }).then(setSession);
    },
    login: function (email, password) {
      return request('/api/auth/login', { method: 'POST', body: { email: email, password: password } }).then(setSession);
    },
    logout: function () {
      return request('/api/auth/logout', { method: 'POST' }).finally(function () {
        token = '';
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      });
    },
    me: function () { return request('/api/me'); },
    account: function () { return request('/api/account'); },

    boards: function () { return request('/api/boards'); },
    save: function (board, id) {
      return request(id ? '/api/boards/' + encodeURIComponent(id) : '/api/boards', {
        method: id ? 'PUT' : 'POST',
        body: board,
      });
    },
    remove: function (id) { return request('/api/boards/' + encodeURIComponent(id), { method: 'DELETE' }); },
    share: function (id) { return request('/api/boards/' + encodeURIComponent(id) + '/share', { method: 'POST' }); },
    unshare: function (id) { return request('/api/boards/' + encodeURIComponent(id) + '/share', { method: 'DELETE' }); },
    publicBoard: function (slug) { return request('/api/share/' + encodeURIComponent(slug)); },
    checkout: function () { return request('/api/billing/checkout', { method: 'POST' }); },
  };

  return MVSync;
})();
