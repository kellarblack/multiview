#!/usr/bin/env python3
"""multiview.cc sync backend — optional, stdlib only.

The static app does not need this. It exists so accounts, cloud-synced boards,
share links and a one-time purchase can be switched on later without rewriting
the frontend.

    python3 server/app.py            # http://127.0.0.1:8787

Endpoints
    GET    /api/health
    POST   /api/auth/register     {email, password}
    POST   /api/auth/login        {email, password} -> {token, user}
    POST   /api/auth/logout
    GET    /api/me
    GET    /api/boards
    POST   /api/boards            {name, layout, tiles[]}
    PUT    /api/boards/{id}       {name, layout, tiles[]}
    DELETE /api/boards/{id}
    POST   /api/boards/{id}/share -> {slug, url}
    DELETE /api/boards/{id}/share
    GET    /api/share/{slug}      (public)
    POST   /api/billing/checkout  -> {url}      (needs STRIPE_SECRET_KEY)
    POST   /api/billing/webhook                 (needs STRIPE_WEBHOOK_SECRET)

Environment
    MV_PORT, MV_HOST, MV_DB, MV_ORIGINS, MV_FREE_LIMIT
    STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET, MV_PUBLIC_URL

Security notes are in server/README.md. Nothing here is exposed by default: the
server binds to 127.0.0.1 and only answers the origins listed in MV_ORIGINS.
"""

import hashlib
import hmac
import ipaddress
import json
import os
import re
import secrets
import sqlite3
import sys
import threading
import time
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, urlsplit
from urllib.request import Request, urlopen

VERSION = "0.1.0"
PBKDF2_ROUNDS = 200_000
MAX_BODY = 256 * 1024
BOARD_LAYOUTS = {"1", "2", "3", "4", "6", "9"}
MAX_TILES = 9
RATE_WINDOW = 60
RATE_AUTH = 12
RATE_GENERAL = 120

CONFIG = {}
_LOCK = threading.Lock()
_RATE = {}


# ── storage ────────────────────────────────────────────────────────────────

MIGRATIONS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "migrations")


def apply_migrations(conn):
    """Apply server/migrations/*.sql in order, recording each in schema_migrations."""
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations ("
        "name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)"
    )
    applied = {row[0] for row in conn.execute("SELECT name FROM schema_migrations")}
    try:
        files = sorted(f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".sql"))
    except OSError:
        files = []
    for name in files:
        if name in applied:
            continue
        path = os.path.join(MIGRATIONS_DIR, name)
        with open(path, "r", encoding="utf-8") as handle:
            conn.executescript(handle.read())
        conn.execute(
            "INSERT OR REPLACE INTO schema_migrations (name, applied_at) VALUES (?, ?)",
            (name, int(time.time())),
        )


@contextmanager
def db():
    conn = sqlite3.connect(CONFIG["db"], timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db(path):
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    with sqlite3.connect(path) as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        apply_migrations(conn)
        # databases created before migrations existed: add the column once
        cols = [row[1] for row in conn.execute("PRAGMA table_info(users)")]
        if "trial_ends_at" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN trial_ends_at INTEGER")
        # cache the IP-HMAC key so hash_ip() never opens a second connection
        if not os.environ.get("MV_IP_SECRET"):
            row = conn.execute("SELECT value FROM meta WHERE key = 'ip_secret'").fetchone()
            if not row:
                value = secrets.token_hex(32)
                conn.execute(
                    "INSERT OR IGNORE INTO meta (key, value) VALUES ('ip_secret', ?)", (value,)
                )
                row = conn.execute("SELECT value FROM meta WHERE key = 'ip_secret'").fetchone()
            CONFIG["ip_secret"] = row[0]


def record_event(conn, kind, user_id=None, meta=""):
    conn.execute(
        "INSERT OR REPLACE INTO events (id, at, kind, user_id, meta) VALUES (?,?,?,?,?)",
        (secrets.token_hex(8), int(time.time()), kind, user_id, meta[:200]),
    )


# ── crypto / validation ────────────────────────────────────────────────────

def hash_password(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), PBKDF2_ROUNDS)
    return salt, digest.hex()


def new_token():
    return secrets.token_urlsafe(32)


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def trial_days():
    try:
        return max(0, min(365, int(os.environ.get("MV_TRIAL_DAYS", "7"))))
    except ValueError:
        return 7


def session_seconds():
    try:
        days = max(1, min(365, int(os.environ.get("MV_SESSION_DAYS", "30"))))
    except ValueError:
        days = 30
    return days * 86400


def ip_secret():
    """HMAC key for visitor IPs. Env wins, then the value cached by init_db()."""
    env = os.environ.get("MV_IP_SECRET")
    if env:
        return env
    cached = CONFIG.get("ip_secret")
    if cached:
        return cached
    # only reached if someone calls hash_ip() before init_db()
    with db() as conn:
        row = conn.execute("SELECT value FROM meta WHERE key = 'ip_secret'").fetchone()
        if not row:
            conn.execute(
                "INSERT OR IGNORE INTO meta (key, value) VALUES ('ip_secret', ?)",
                (secrets.token_hex(32),),
            )
            row = conn.execute("SELECT value FROM meta WHERE key = 'ip_secret'").fetchone()
        CONFIG["ip_secret"] = row[0]
    return CONFIG["ip_secret"]


def hash_ip(ip):
    return hmac.new(ip_secret().encode(), ip.encode(), hashlib.sha256).hexdigest()[:32]


def entitled(user):
    if not user:
        return False
    if user.get("plan") == "pro":
        return True
    return time.time() < (user.get("trial_ends_at") or 0)


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[a-z]{2,}$", re.I)
SAFE_URL_RE = re.compile(r"^https?://", re.I)


def clean_email(value):
    email = str(value or "").strip().lower()
    if len(email) > 254 or not EMAIL_RE.match(email):
        raise ValueError("Enter a valid email address.")
    return email


def clean_password(value):
    password = str(value or "")
    if len(password) < 8:
        raise ValueError("Passwords need at least 8 characters.")
    if len(password) > 200:
        raise ValueError("That password is too long.")
    return password


def clean_stream_url(url):
    """Accept only well-formed http(s) URLs: no credentials, controls or spaces."""
    if not url or len(url) > 2048:
        return None
    bad = {' ', '\\', '"', "'", '<', '>'}
    if any(ord(ch) < 0x20 or ord(ch) == 0x7f or ch in bad for ch in url):
        return None
    try:
        parts = urlsplit(url)
    except ValueError:
        return None
    if parts.scheme.lower() not in ("http", "https"):
        return None
    if not parts.netloc or parts.username or parts.password:
        return None
    return url


def clean_board(payload):
    """Only store what a board actually needs; never trust embed/kind from a client."""
    data = payload.get("board") if isinstance(payload, dict) and isinstance(payload.get("board"), dict) else payload
    if not isinstance(data, dict):
        raise ValueError("No board in that payload.")
    name = re.sub(r"[\x00-\x1f\x7f]", " ", str(data.get("name") or "Board"))
    name = re.sub(r"\s+", " ", name).strip()[:40] or "Board"
    layout = str(data.get("layout") or "4")
    if layout not in BOARD_LAYOUTS:
        raise ValueError("Unsupported layout.")
    tiles = data.get("tiles")
    if not isinstance(tiles, list):
        raise ValueError("The board has no tile list.")
    if len(tiles) > MAX_TILES:
        raise ValueError("A board holds at most %d tiles." % MAX_TILES)

    clean = []
    for entry in tiles:
        if isinstance(entry, str):
            url = entry.strip()
            flags = {}
        elif isinstance(entry, dict):
            url = str(entry.get("url") or "").strip()
            flags = entry
        else:
            continue
        if not clean_stream_url(url):
            continue
        clean.append({
            "url": url,
            "muted": bool(flags.get("muted", True)),
            "cc": bool(flags.get("cc", False)),
            "force": bool(flags.get("force", False)),
        })
    if not clean:
        raise ValueError("None of those links are valid http(s) URLs.")
    return {"name": name, "layout": layout, "tiles": clean}


# ── http helpers ───────────────────────────────────────────────────────────

class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


def rate_ok(ip, bucket, limit):
    now = time.time()
    key = (ip, bucket)
    with _LOCK:
        # keep the table bounded even if a client spoofs a new address per request
        if len(_RATE) > 4096:
            for old in [k for k, v in _RATE.items() if not any(now - t < RATE_WINDOW for t in v)]:
                _RATE.pop(old, None)
            if len(_RATE) > 4096:
                _RATE.clear()
        hits = [t for t in _RATE.get(key, []) if now - t < RATE_WINDOW]
        if len(hits) >= limit:
            _RATE[key] = hits
            return False
        hits.append(now)
        _RATE[key] = hits
    return True


class Handler(BaseHTTPRequestHandler):
    server_version = "multiview-sync/" + VERSION
    protocol_version = "HTTP/1.1"
    timeout = 30  # drop idle/slow sockets instead of pinning a thread forever

    def version_string(self):
        """Do not advertise the build; version probing is free reconnaissance."""
        return "multiview"

    # -- plumbing ---------------------------------------------------------

    def log_message(self, fmt, *args):  # quiet by default; never log bodies
        if os.environ.get("MV_VERBOSE"):
            sys.stderr.write("[sync] " + (fmt % args) + "\n")

    def _cors(self):
        origin = self.headers.get("Origin")
        allowed = CONFIG.get("origins") or []
        if origin and (origin in allowed or "*" in allowed):
            self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Max-Age", "600")

    def _send(self, status, payload=None, extra=None):
        body = b"" if payload is None else json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        if status == 413:
            self.send_header("Connection", "close")
            self.close_connection = True
        for key, value in (extra or {}).items():
            self.send_header(key, value)
        self._cors()
        self.end_headers()
        if body:
            self.wfile.write(body)

    def _content_length(self):
        raw = self.headers.get("Content-Length")
        if raw in (None, ""):
            return 0
        try:
            length = int(raw)
        except (TypeError, ValueError):
            raise ApiError(400, "Bad Content-Length.")
        if length < 0:
            raise ApiError(400, "Bad Content-Length.")
        return length

    def _read_json(self):
        length = self._content_length()
        if length > MAX_BODY:
            self.close_connection = True  # never reuse a socket with an unread body
            raise ApiError(413, "That request is too large.")
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw or b"{}")
        except Exception:
            raise ApiError(400, "Body must be JSON.")
        if not isinstance(data, dict):
            raise ApiError(400, "Body must be a JSON object.")
        return data

    # -- auth -------------------------------------------------------------

    def _user(self, required=True):
        auth = self.headers.get("Authorization") or ""
        token = auth[7:].strip() if auth.lower().startswith("bearer ") else ""
        if not token:
            if required:
                raise ApiError(401, "Sign in first.")
            return None
        hashed = token_hash(token)
        now = int(time.time())
        with db() as conn:
            row = conn.execute(
                "SELECT u.*, s.last_seen AS session_seen FROM sessions s "
                "JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?",
                (hashed,),
            ).fetchone()
            if row and now - int(row["session_seen"] or 0) > session_seconds():
                conn.execute("DELETE FROM sessions WHERE token_hash = ?", (hashed,))
                conn.commit()  # the 401 below leaves the context manager early
                row = None
            if not row:
                if required:
                    raise ApiError(401, "That session has expired.")
                return None
            # touch at most once a minute: no write amplification on every tile action
            if now - int(row["session_seen"] or 0) > 60:
                conn.execute("UPDATE sessions SET last_seen = ? WHERE token_hash = ?", (now, hashed))
            user = dict(row)
            user.pop("session_seen", None)
            return user

    def _client_ip(self):
        """Real client address, only trusting X-Forwarded-For behind a known proxy.

        The header is validated as an IP so a junk value can never become a rate-limit
        or trial key. The proxy must overwrite the header (see MV_TRUST_PROXY).
        """
        if os.environ.get("MV_TRUST_PROXY") == "1":
            forwarded = (self.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
            if forwarded:
                try:
                    return str(ipaddress.ip_address(forwarded))
                except ValueError:
                    pass
        return self.client_address[0]

    def _require_entitled(self, user):
        if not entitled(user):
            raise ApiError(402, "Your free trial has ended. Upgrade to Pro to keep syncing boards.")

    def _start_session(self, conn, user):
        token = new_token()
        now = int(time.time())
        # opportunistic housekeeping; cheap and keeps the table from growing forever
        conn.execute("DELETE FROM sessions WHERE last_seen < ?", (now - session_seconds(),))
        conn.execute(
            "INSERT INTO sessions (token_hash, user_id, created_at, last_seen) VALUES (?,?,?,?)",
            (token_hash(token), user["id"], now, now),
        )
        return token

    @staticmethod
    def _public_user(user):
        ends = user.get("trial_ends_at") or 0
        return {
            "id": user["id"],
            "email": user["email"],
            "plan": user["plan"],
            "trialEndsAt": ends,
            "trialDaysLeft": max(0, int((ends - time.time()) // 86400)) if ends else 0,
            "entitled": entitled(dict(user)),
        }

    # -- routes -----------------------------------------------------------

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self._cors()
        self.end_headers()

    def do_GET(self):
        self._dispatch("GET")

    def do_POST(self):
        self._dispatch("POST")

    def do_PUT(self):
        self._dispatch("PUT")

    def do_DELETE(self):
        self._dispatch("DELETE")

    def _dispatch(self, method):
        path = urlparse(self.path).path
        ip = self._client_ip()
        auth_route = path.startswith("/api/auth/")
        if not rate_ok(ip, "auth" if auth_route else "api", RATE_AUTH if auth_route else RATE_GENERAL):
            return self._send(
                429,
                {"error": "Too many requests. Try again shortly."},
                extra={"Retry-After": str(RATE_WINDOW)},
            )
        try:
            return self._route(method, path)
        except ApiError as err:
            return self._send(err.status, {"error": err.message})
        except ValueError as err:
            return self._send(400, {"error": str(err)})
        except Exception:
            # Never leak internals or tokens.
            return self._send(500, {"error": "Something went wrong on the server."})

    def _route(self, method, path):
        if path == "/api/health" and method == "GET":
            with db() as conn:
                conn.execute("SELECT 1").fetchone()
            return self._send(200, {"ok": True, "version": VERSION, "billing": bool(os.environ.get("STRIPE_SECRET_KEY"))})

        if path == "/api/auth/register" and method == "POST":
            return self._register()
        if path == "/api/auth/login" and method == "POST":
            return self._login()
        if path == "/api/auth/logout" and method == "POST":
            return self._logout()
        if path == "/api/me" and method == "GET":
            return self._send(200, {"user": self._public_user(self._user())})
        if path == "/api/account" and method == "GET":
            user = self._user()
            with db() as conn:
                used = conn.execute(
                    "SELECT 1 FROM trials WHERE ip_hash = ?", (hash_ip(self._client_ip()),)
                ).fetchone()
            return self._send(200, {
                "user": self._public_user(user),
                "entitled": entitled(user),
                "trial": {
                    "days": trial_days(),
                    "endsAt": user.get("trial_ends_at") or 0,
                    "available": not bool(used),
                },
            })

        if path == "/api/boards" and method == "GET":
            return self._list_boards()
        if path == "/api/boards" and method == "POST":
            return self._create_board()

        match = re.match(r"^/api/boards/([A-Za-z0-9_-]{4,40})$", path)
        if match and method in ("PUT", "DELETE"):
            return self._update_or_delete(match.group(1), method)
        share = re.match(r"^/api/boards/([A-Za-z0-9_-]{4,40})/share$", path)
        if share and method == "POST":
            return self._share(share.group(1))
        if share and method == "DELETE":
            return self._unshare(share.group(1))
        public = re.match(r"^/api/share/([A-Za-z0-9]{6,40})$", path)
        if public and method == "GET":
            return self._public_board(public.group(1))

        if path == "/api/billing/checkout" and method == "POST":
            return self._checkout()
        if path == "/api/billing/webhook" and method == "POST":
            return self._webhook()

        raise ApiError(404, "Not found.")

    # -- auth handlers -----------------------------------------------------

    def _register(self):
        body = self._read_json()
        email = clean_email(body.get("email"))
        password = clean_password(body.get("password"))
        salt, digest = hash_password(password)
        user_id = "u_" + secrets.token_hex(8)
        now = int(time.time())
        with db() as conn:
            if conn.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
                raise ApiError(409, "That email is already registered.")
            ip_hash = hash_ip(self._client_ip())
            reuse = conn.execute("SELECT 1 FROM trials WHERE ip_hash = ?", (ip_hash,)).fetchone()
            trial_end = 0
            if not reuse and trial_days() > 0:
                ends = now + trial_days() * 86400
                # INSERT OR IGNORE: two simultaneous sign-ups from one IP cannot both win
                taken = conn.execute(
                    "INSERT OR IGNORE INTO trials (ip_hash, user_id, started_at, ends_at) VALUES (?,?,?,?)",
                    (ip_hash, user_id, now, ends),
                )
                if taken.rowcount:
                    trial_end = ends
            try:
                conn.execute(
                    "INSERT INTO users (id, email, pw_salt, pw_hash, plan, trial_ends_at, created_at) VALUES (?,?,?,?,?,?,?)",
                    (user_id, email, salt, digest, "free", trial_end, now),
                )
            except sqlite3.IntegrityError:
                # lost a race with the same email; do not burn the IP's trial
                conn.execute("DELETE FROM trials WHERE user_id = ?", (user_id,))
                raise ApiError(409, "That email is already registered.")
            record_event(conn, "register", user_id)
            user = {"id": user_id, "email": email, "plan": "free", "trial_ends_at": trial_end}
            token = self._start_session(conn, user)
        return self._send(201, {"token": token, "user": self._public_user(user)})

    def _login(self):
        body = self._read_json()
        email = str(body.get("email") or "").strip().lower()
        password = str(body.get("password") or "")
        # same error and roughly the same work for every failure mode
        if len(email) > 254 or len(password) > 200 or not email or not password:
            hash_password("x" * 16, "00" * 16)
            raise ApiError(401, "Wrong email or password.")
        with db() as conn:
            row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            if not row:
                hash_password(password, "00" * 16)  # constant-cost dummy verification
                raise ApiError(401, "Wrong email or password.")
            _, digest = hash_password(password, row["pw_salt"])
            if not hmac.compare_digest(digest, row["pw_hash"]):
                raise ApiError(401, "Wrong email or password.")
            token = self._start_session(conn, dict(row))
            record_event(conn, "login", row["id"])
        return self._send(200, {"token": token, "user": self._public_user(dict(row))})

    def _logout(self):
        auth = self.headers.get("Authorization") or ""
        token = auth[7:].strip() if auth.lower().startswith("bearer ") else ""
        if token:
            with db() as conn:
                conn.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash(token),))
        return self._send(200, {"ok": True})

    # -- boards ------------------------------------------------------------

    def _list_boards(self):
        user = self._user()
        self._require_entitled(user)
        with db() as conn:
            rows = conn.execute(
                "SELECT id, name, layout, tiles, updated_at FROM boards WHERE user_id = ? ORDER BY updated_at DESC",
                (user["id"],),
            ).fetchall()
        boards = [{
            "id": row["id"],
            "name": row["name"],
            "layout": row["layout"],
            "tiles": json.loads(row["tiles"]),
            "updatedAt": row["updated_at"],
        } for row in rows]
        return self._send(200, {"boards": boards, "limit": board_limit(user)})

    def _create_board(self):
        user = self._user()
        self._require_entitled(user)
        board = clean_board(self._read_json())
        now = int(time.time())
        board_id = "b_" + secrets.token_hex(8)
        with db() as conn:
            count = conn.execute("SELECT COUNT(*) AS n FROM boards WHERE user_id = ?", (user["id"],)).fetchone()["n"]
            if count >= board_limit(user):
                raise ApiError(402, "The free plan syncs %d boards. Upgrade to sync more." % board_limit(user))
            conn.execute(
                "INSERT INTO boards (id, user_id, name, layout, tiles, created_at, updated_at) VALUES (?,?,?,?,?,?,?)",
                (board_id, user["id"], board["name"], board["layout"], json.dumps(board["tiles"]), now, now),
            )
            record_event(conn, "board_create", user["id"])
        return self._send(201, {"board": dict(board, id=board_id, updatedAt=now)})

    def _owned_board(self, conn, user, board_id):
        row = conn.execute("SELECT * FROM boards WHERE id = ? AND user_id = ?", (board_id, user["id"])).fetchone()
        if not row:
            raise ApiError(404, "Board not found.")
        return row

    def _update_or_delete(self, board_id, method):
        user = self._user()
        self._require_entitled(user)
        with db() as conn:
            self._owned_board(conn, user, board_id)
            if method == "DELETE":
                conn.execute("DELETE FROM boards WHERE id = ?", (board_id,))
                conn.execute("DELETE FROM shares WHERE board_id = ?", (board_id,))
                record_event(conn, "board_delete", user["id"])
                return self._send(200, {"ok": True})
            board = clean_board(self._read_json())
            now = int(time.time())
            conn.execute(
                "UPDATE boards SET name = ?, layout = ?, tiles = ?, updated_at = ? WHERE id = ?",
                (board["name"], board["layout"], json.dumps(board["tiles"]), now, board_id),
            )
        return self._send(200, {"board": dict(board, id=board_id, updatedAt=now)})

    def _share(self, board_id):
        user = self._user()
        self._require_entitled(user)
        with db() as conn:
            self._owned_board(conn, user, board_id)
            row = conn.execute("SELECT slug FROM shares WHERE board_id = ?", (board_id,)).fetchone()
            if row:
                slug = row["slug"]
            else:
                slug = secrets.token_urlsafe(9).replace("-", "a").replace("_", "b")[:12]
                conn.execute(
                    "INSERT INTO shares (slug, board_id, user_id, created_at) VALUES (?,?,?,?)",
                    (slug, board_id, user["id"], int(time.time())),
                )
                record_event(conn, "share_create", user["id"])
        base = os.environ.get("MV_PUBLIC_URL", "http://localhost:5455")
        return self._send(200, {"slug": slug, "url": "%s/#s=%s" % (base.rstrip("/"), slug)})

    def _unshare(self, board_id):
        user = self._user()
        self._require_entitled(user)
        with db() as conn:
            self._owned_board(conn, user, board_id)
            conn.execute("DELETE FROM shares WHERE board_id = ? AND user_id = ?", (board_id, user["id"]))
        return self._send(200, {"ok": True})

    def _public_board(self, slug):
        with db() as conn:
            row = conn.execute(
                "SELECT b.name, b.layout, b.tiles FROM shares s JOIN boards b ON b.id = s.board_id WHERE s.slug = ?",
                (slug,),
            ).fetchone()
        if not row:
            raise ApiError(404, "That link is not available.")
        return self._send(200, {"board": {
            "name": row["name"],
            "layout": row["layout"],
            "tiles": json.loads(row["tiles"]),
        }})

    # -- billing -----------------------------------------------------------

    def _checkout(self):
        user = self._user()
        secret = os.environ.get("STRIPE_SECRET_KEY")
        price = os.environ.get("STRIPE_PRICE_ID")
        if not secret or not price:
            raise ApiError(503, "Billing is not configured on this server.")
        base = os.environ.get("MV_PUBLIC_URL", "http://localhost:5455").rstrip("/")
        form = {
            "mode": "payment",
            "success_url": base + "/?upgraded=1",
            "cancel_url": base + "/?cancelled=1",
            "client_reference_id": user["id"],
            "line_items[0][price]": price,
            "line_items[0][quantity]": "1",
            "metadata[user_id]": user["id"],
        }
        body = "&".join("%s=%s" % (k, quote(v)) for k, v in form.items()).encode()
        req = Request(
            "https://api.stripe.com/v1/checkout/sessions",
            data=body,
            headers={"Authorization": "Bearer " + secret, "Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        try:
            with urlopen(req, timeout=15) as res:
                data = json.loads(res.read())
        except Exception:
            raise ApiError(502, "Could not reach the payment provider.")
        return self._send(200, {"url": data.get("url"), "id": data.get("id")})

    def _webhook(self):
        secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
        if not secret:
            raise ApiError(503, "Billing is not configured on this server.")
        length = self._content_length()
        if length > MAX_BODY:
            self.close_connection = True
            raise ApiError(413, "Payload too large.")
        raw = self.rfile.read(length) if length else b""
        if not verify_stripe_signature(raw, self.headers.get("Stripe-Signature") or "", secret):
            raise ApiError(400, "Invalid signature.")

        try:
            event = json.loads(raw or b"{}")
        except Exception:
            raise ApiError(400, "Invalid event body.")
        if not isinstance(event, dict):
            raise ApiError(400, "Invalid event body.")
        event_id = str(event.get("id") or "")
        if not event_id:
            raise ApiError(400, "Missing event id.")
        kind = event.get("type") or ""
        obj = (event.get("data") or {}).get("object") or {}
        if not isinstance(obj, dict):
            obj = {}

        with db() as conn:
            if conn.execute("SELECT 1 FROM events WHERE id = ?", (event_id,)).fetchone():
                return self._send(200, {"received": True, "duplicate": True})
            user_id = obj.get("client_reference_id") or (obj.get("metadata") or {}).get("user_id")
            # only a genuinely paid checkout grants Pro
            paid = obj.get("payment_status") == "paid" and obj.get("mode", "payment") == "payment"
            if kind == "checkout.session.completed" and user_id and paid:
                conn.execute("UPDATE users SET plan = 'pro', stripe_customer = ? WHERE id = ?",
                             (obj.get("customer"), user_id))
            # keyed by the Stripe event id so retries are idempotent
            conn.execute(
                "INSERT INTO events (id, at, kind, user_id, meta) VALUES (?,?,?,?,?)",
                (event_id, int(time.time()), "stripe:" + kind, user_id, ""),
            )
        return self._send(200, {"received": True})


def board_limit(user):
    return 9999 if user["plan"] == "pro" else int(os.environ.get("MV_FREE_LIMIT", "2"))


def quote(value):
    from urllib.parse import quote as _q
    return _q(str(value), safe="")


def verify_stripe_signature(payload, header, secret, tolerance=300, now=None):
    """Stripe's scheme: t=<ts>,v1=<hmac-sha256 of "ts.payload">. Constant-time compare."""
    parts = {}
    for item in header.split(","):
        if "=" in item:
            key, value = item.split("=", 1)
            parts.setdefault(key.strip(), []).append(value.strip())
    if "t" not in parts or "v1" not in parts:
        return False
    try:
        timestamp = int(parts["t"][0])
    except ValueError:
        return False
    current = int(time.time()) if now is None else now
    if abs(current - timestamp) > tolerance:
        return False
    signed = ("%d." % timestamp).encode() + payload
    expected = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(expected, candidate) for candidate in parts["v1"])


# ── server ─────────────────────────────────────────────────────────────────

def make_server(host="127.0.0.1", port=8787, db_path="server/data/multiview.db", origins=None, verbose=False):
    if verbose:
        os.environ["MV_VERBOSE"] = "1"
    CONFIG["db"] = db_path
    CONFIG["origins"] = origins if origins is not None else [
        "http://localhost:5455", "http://127.0.0.1:5455",
        "http://localhost:4321", "http://127.0.0.1:4321",
    ]
    init_db(db_path)
    return ThreadingHTTPServer((host, port), Handler)


def main():
    host = os.environ.get("MV_HOST", "127.0.0.1")
    port = int(os.environ.get("MV_PORT", "8787"))
    db_path = os.environ.get("MV_DB", os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "multiview.db"))
    origins = [o.strip() for o in os.environ.get("MV_ORIGINS", "").split(",") if o.strip()] or None
    server = make_server(host, port, db_path, origins, verbose=bool(os.environ.get("MV_VERBOSE")))
    print("multiview sync backend v%s" % VERSION)
    print("  listening on http://%s:%d" % (host, port))
    print("  database    %s" % db_path)
    print("  billing     %s" % ("stripe configured" if os.environ.get("STRIPE_SECRET_KEY") else "not configured (503 on checkout)"))
    print("  the static app does not use this yet — see server/README.md")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
