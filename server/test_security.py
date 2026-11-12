#!/usr/bin/env python3
"""Adversarial tests for the optional sync backend.

    python3 server/test_security.py -v

These are the checks a penetration test would run against this surface:
auth bypass, token tampering, session expiry, SQL injection, XSS payload
round-trips, CORS, webhook forgery/replay/unpaid upgrades, oversize bodies,
share enumeration, ownership isolation and URL-scheme abuse.

They start the real HTTP server on a temporary database. Nothing is mocked.
"""

import hashlib
import hmac
import itertools
import json
import os
import socket
import sqlite3
import sys
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import app as backend  # noqa: E402

backend.RATE_AUTH = 10_000
backend.RATE_GENERAL = 10_000

ALLOWED = "https://app.example"
EVIL = "https://evil.example"


class SecurityCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.NamedTemporaryFile(prefix="mv-sec-", suffix=".db", delete=False)
        cls.tmp.close()
        os.environ["MV_TRUST_PROXY"] = "1"
        os.environ["MV_TRIAL_DAYS"] = "7"
        os.environ["MV_SESSION_DAYS"] = "30"
        cls.ip = itertools.count(1)
        cls.server = backend.make_server("127.0.0.1", 0, cls.tmp.name, origins=[ALLOWED])
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        try:
            os.unlink(cls.tmp.name)
        except OSError:
            pass

    # -- helpers ----------------------------------------------------------

    def call(self, method, path, body=None, token=None, headers=None, ip=None,
             raw=None, with_headers=False):
        data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
        req = urllib.request.Request("http://127.0.0.1:%d%s" % (self.port, path), data=data, method=method)
        req.add_header("Content-Type", "application/json")
        if token:
            req.add_header("Authorization", "Bearer " + token)
        if ip:
            req.add_header("X-Forwarded-For", ip)
        for key, value in (headers or {}).items():
            req.add_header(key, value)
        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                payload = res.read()
                parsed = json.loads(payload) if payload else {}
                return (res.status, parsed, dict(res.headers)) if with_headers else (res.status, parsed)
        except urllib.error.HTTPError as err:
            payload = err.read()
            try:
                parsed = json.loads(payload) if payload else {}
            except Exception:
                parsed = {}
            return (err.code, parsed, dict(err.headers)) if with_headers else (err.code, parsed)

    def register(self, email, ip=None, password="hunter2hunter2"):
        ip = ip or ("10.1.0.%d" % next(self.ip))
        status, body = self.call("POST", "/api/auth/register", {"email": email, "password": password}, ip=ip)
        self.assertEqual(status, 201, body)
        return body["token"], body["user"]["id"]

    def owned_board(self, token):
        status, body = self.call("POST", "/api/boards", {
            "name": "Board", "layout": "4",
            "tiles": [{"url": "https://example.com/stream.m3u8"}],
        }, token=token)
        self.assertEqual(status, 201, body)
        return body["board"]["id"]

    def signed(self, event, secret, ts=None):
        payload = json.dumps(event).encode()
        ts = int(time.time()) if ts is None else ts
        sig = hmac.new(secret.encode(), ("%d." % ts).encode() + payload, hashlib.sha256).hexdigest()
        return payload, "t=%d,v1=%s" % (ts, sig)

    # -- authentication ---------------------------------------------------

    def test_01_boards_require_auth(self):
        status, _ = self.call("GET", "/api/boards")
        self.assertEqual(status, 401)
        status, _ = self.call("POST", "/api/boards", {"name": "x", "layout": "4", "tiles": []})
        self.assertEqual(status, 401)

    def test_02_tampered_tokens_are_rejected(self):
        token, _ = self.register("tokens@example.com")
        status, _ = self.call("GET", "/api/me", token=token[:-1] + ("A" if token[-1] != "A" else "B"))
        self.assertEqual(status, 401)
        status, _ = self.call("GET", "/api/me", token="not-a-token")
        self.assertEqual(status, 401)

    def test_03_sessions_expire_and_are_deleted(self):
        token, user_id = self.register("expire@example.com")
        self.assertEqual(self.call("GET", "/api/me", token=token)[0], 200)
        with sqlite3.connect(self.tmp.name) as conn:
            conn.execute("UPDATE sessions SET last_seen = ? WHERE user_id = ?",
                         (int(time.time()) - 90 * 86400, user_id))
        status, _ = self.call("GET", "/api/me", token=token)
        self.assertEqual(status, 401)
        with sqlite3.connect(self.tmp.name) as conn:
            left = conn.execute("SELECT COUNT(*) FROM sessions WHERE user_id = ?", (user_id,)).fetchone()[0]
        self.assertEqual(left, 0)

    def test_04_tokens_and_passwords_are_not_stored_raw(self):
        token, user_id = self.register("storage@example.com")
        with sqlite3.connect(self.tmp.name) as conn:
            row = conn.execute("SELECT pw_hash FROM users WHERE id = ?", (user_id,)).fetchone()
            session = conn.execute("SELECT token_hash FROM sessions WHERE user_id = ?", (user_id,)).fetchone()
        self.assertNotEqual(row[0], "hunter2hunter2")
        self.assertEqual(len(row[0]), 64)
        self.assertNotEqual(session[0], token)
        self.assertEqual(session[0], hashlib.sha256(token.encode()).hexdigest())

    def test_05_login_does_not_reveal_which_part_failed(self):
        self.register("real@example.com")
        _, unknown = self.call("POST", "/api/auth/login", {"email": "nobody@example.com", "password": "wrongpass"})
        _, wrong = self.call("POST", "/api/auth/login", {"email": "real@example.com", "password": "wrongpass"})
        self.assertEqual(unknown["error"], wrong["error"])

    def test_06_register_rejects_bad_credentials(self):
        self.assertEqual(self.call("POST", "/api/auth/register",
                                   {"email": "not-an-email", "password": "longenough"})[0], 400)
        self.assertEqual(self.call("POST", "/api/auth/register",
                                   {"email": "short@example.com", "password": "x"})[0], 400)
        status, _ = self.call("POST", "/api/auth/login",
                              {"email": "a" * 400 + "@example.com", "password": "x" * 400})
        self.assertEqual(status, 401)

    # -- injection / rendering -------------------------------------------

    def test_07_sql_injection_is_inert(self):
        token, _ = self.register("sqli@example.com")
        payload = "x'); DROP TABLE users;--"
        status, body = self.call("POST", "/api/boards", {
            "name": payload, "layout": "4",
            "tiles": [{"url": "https://example.com/a.m3u8"}],
        }, token=token)
        self.assertEqual(status, 201, body)
        self.assertEqual(body["board"]["name"], payload)
        # the table is still there and a new account can still register
        self.register("after-sqli@example.com")

    def test_08_xss_payload_is_stored_as_data_only(self):
        token, _ = self.register("xss@example.com")
        payload = "<img src=x onerror=alert(1)>"
        status, body = self.call("POST", "/api/boards", {
            "name": payload, "layout": "4",
            "tiles": [{"url": "https://example.com/a.m3u8"}],
        }, token=token)
        self.assertEqual(status, 201, body)
        self.assertEqual(body["board"]["name"], payload)
        status, body, headers = self.call("GET", "/api/boards", token=token, with_headers=True)
        self.assertEqual(status, 200)
        self.assertTrue(headers.get("Content-Type", "").startswith("application/json"))

    def test_09_header_injection_in_names_is_stripped(self):
        token, _ = self.register("crlf@example.com")
        status, body = self.call("POST", "/api/boards", {
            "name": "a\r\nSet-Cookie: evil=1", "layout": "4",
            "tiles": [{"url": "https://example.com/a.m3u8"}],
        }, token=token)
        self.assertEqual(status, 201, body)
        self.assertNotIn("\r", body["board"]["name"])
        self.assertNotIn("\n", body["board"]["name"])

    def test_10_url_schemes_and_credentials_are_rejected(self):
        token, _ = self.register("urls@example.com")
        for bad in ("javascript:alert(1)", "data:text/html,<script>x</script>",
                    "file:///etc/passwd", "http://user:pass@example.com/x",
                    "https://example.com/a b"):
            status, _ = self.call("POST", "/api/boards", {
                "name": "bad", "layout": "4", "tiles": [{"url": bad}],
            }, token=token)
            self.assertEqual(status, 400, bad)

    # -- CORS -------------------------------------------------------------

    def test_11_cors_only_echoes_allowed_origins(self):
        _, _, good = self.call("GET", "/api/health", headers={"Origin": ALLOWED}, with_headers=True)
        self.assertEqual(good.get("Access-Control-Allow-Origin"), ALLOWED)
        self.assertIn("Origin", good.get("Vary", ""))
        _, _, evil = self.call("GET", "/api/health", headers={"Origin": EVIL}, with_headers=True)
        self.assertIsNone(evil.get("Access-Control-Allow-Origin"))

    # -- shares -----------------------------------------------------------

    def test_12_share_links_are_unguessable_and_public_but_read_only(self):
        token, _ = self.register("share@example.com")
        board_id = self.owned_board(token)
        status, body = self.call("POST", "/api/boards/%s/share" % board_id, token=token)
        self.assertEqual(status, 200, body)
        slug = body["slug"]
        self.assertGreaterEqual(len(slug), 10)
        status, public = self.call("GET", "/api/share/" + slug)
        self.assertEqual(status, 200)
        self.assertEqual(public["board"]["tiles"][0]["url"], "https://example.com/stream.m3u8")
        self.assertEqual(self.call("GET", "/api/share/" + slug[:-1] + ("x" if slug[-1] != "x" else "y"))[0], 404)
        # writes to a share path do not exist
        self.assertEqual(self.call("POST", "/api/share/" + slug)[0], 404)

    def test_13_ownership_isolation(self):
        a, _ = self.register("owner-a@example.com")
        b, _ = self.register("owner-b@example.com")
        board = self.owned_board(a)
        self.assertEqual(self.call("PUT", "/api/boards/" + board,
                                   {"name": "stolen", "layout": "4", "tiles": [{"url": "https://example.com/x.m3u8"}]},
                                   token=b)[0], 404)
        self.assertEqual(self.call("DELETE", "/api/boards/" + board, token=b)[0], 404)
        self.assertEqual(self.call("GET", "/api/boards", token=b)[1]["boards"], [])

    # -- request handling -------------------------------------------------

    def test_14_oversized_and_malformed_bodies(self):
        self.assertEqual(self.call("POST", "/api/auth/register", raw=b"{" + b"x" * 10)[0], 400)
        big = b"{" + b'"email":"' + b"a" * (backend.MAX_BODY + 10) + b'"}'
        self.assertEqual(self.call("POST", "/api/auth/register", raw=big)[0], 413)

    def test_15_unknown_routes_and_wrong_methods_do_not_leak(self):
        for method, path in (("GET", "/api/nope"), ("GET", "/api/auth/register"),
                             ("POST", "/api/health"), ("GET", "/api/share/../../etc/passwd")):
            status, body = self.call(method, path)
            self.assertIn(status, (404, 405), (method, path))
            self.assertNotIn("Traceback", json.dumps(body))

    def test_16_server_header_does_not_advertise_a_version(self):
        _, _, headers = self.call("GET", "/api/health", with_headers=True)
        server = headers.get("Server", "")
        self.assertFalse(any(ch.isdigit() for ch in server), server)

    # -- rate limit -------------------------------------------------------

    def test_17_rate_limit_retry_after_and_per_ip(self):
        original = backend.RATE_AUTH
        backend.RATE_AUTH = 2
        try:
            body = {"email": "rl@example.com", "password": "wrongpass"}
            self.assertEqual(self.call("POST", "/api/auth/login", body, ip="198.51.100.44")[0], 401)
            self.assertEqual(self.call("POST", "/api/auth/login", body, ip="198.51.100.44")[0], 401)
            status, _, headers = self.call("POST", "/api/auth/login", body, ip="198.51.100.44", with_headers=True)
            self.assertEqual(status, 429)
            self.assertEqual(headers.get("Retry-After"), str(backend.RATE_WINDOW))
            self.assertEqual(self.call("POST", "/api/auth/login", body, ip="198.51.100.45")[0], 401)
        finally:
            backend.RATE_AUTH = original
            backend._RATE.clear()

    def test_20_negative_content_length_is_rejected(self):
        with socket.create_connection(("127.0.0.1", self.port), timeout=5) as sock:
            sock.sendall(
                b"POST /api/auth/login HTTP/1.1\r\n"
                b"Host: 127.0.0.1\r\n"
                b"Content-Type: application/json\r\n"
                b"Content-Length: -1\r\n"
                b"Connection: close\r\n\r\n"
            )
            data = sock.recv(200).decode("latin-1", "replace")
        self.assertIn(" 400 ", data.split("\r\n", 1)[0])

    # -- billing webhook --------------------------------------------------

    def test_18_webhook_rejects_forgery_and_stale_events(self):
        token, user_id = self.register("hook-sec@example.com")
        secret = "whsec_security"
        os.environ["STRIPE_WEBHOOK_SECRET"] = secret
        try:
            event = {"id": "evt_sec_1", "type": "checkout.session.completed",
                     "data": {"object": {"client_reference_id": user_id, "payment_status": "paid"}}}
            payload, good_sig = self.signed(event, secret)
            self.assertEqual(self.call("POST", "/api/billing/webhook", raw=payload,
                                       headers={"Stripe-Signature": good_sig[:0] + "t=1,v1=deadbeef"})[0], 400)
            stale_payload, stale_sig = self.signed(event, secret, ts=int(time.time()) - 3600)
            self.assertEqual(self.call("POST", "/api/billing/webhook", raw=stale_payload,
                                       headers={"Stripe-Signature": stale_sig})[0], 400)
            bad_json = b"{not-json"
            ts = int(time.time())
            sig = hmac.new(secret.encode(), ("%d." % ts).encode() + bad_json, hashlib.sha256).hexdigest()
            self.assertEqual(self.call("POST", "/api/billing/webhook", raw=bad_json,
                                       headers={"Stripe-Signature": "t=%d,v1=%s" % (ts, sig)})[0], 400)
        finally:
            os.environ.pop("STRIPE_WEBHOOK_SECRET", None)

    def test_19_webhook_only_upgrades_paid_checkouts(self):
        token, user_id = self.register("hook-paid@example.com")
        secret = "whsec_security2"
        os.environ["STRIPE_WEBHOOK_SECRET"] = secret
        try:
            unpaid = {"id": "evt_sec_unpaid", "type": "checkout.session.completed",
                      "data": {"object": {"client_reference_id": user_id,
                                          "payment_status": "unpaid", "mode": "payment"}}}
            payload, sig = self.signed(unpaid, secret)
            self.assertEqual(self.call("POST", "/api/billing/webhook", raw=payload,
                                       headers={"Stripe-Signature": sig})[0], 200)
            self.assertEqual(self.call("GET", "/api/me", token=token)[1]["user"]["plan"], "free")

            paid = {"id": "evt_sec_paid", "type": "checkout.session.completed",
                    "data": {"object": {"client_reference_id": user_id, "customer": "cus_sec",
                                        "payment_status": "paid", "mode": "payment"}}}
            payload, sig = self.signed(paid, secret)
            self.assertEqual(self.call("POST", "/api/billing/webhook", raw=payload,
                                       headers={"Stripe-Signature": sig})[0], 200)
            self.assertEqual(self.call("GET", "/api/me", token=token)[1]["user"]["plan"], "pro")

            # replay of the same event is a no-op
            status, body = self.call("POST", "/api/billing/webhook", raw=payload,
                                     headers={"Stripe-Signature": sig})
            self.assertEqual(status, 200)
            self.assertTrue(body.get("duplicate"))
        finally:
            os.environ.pop("STRIPE_WEBHOOK_SECRET", None)


if __name__ == "__main__":
    unittest.main(verbosity=2)
