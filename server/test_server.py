#!/usr/bin/env python3
"""Integration tests for the sync backend.

    python3 server/test_server.py -v

Starts the real HTTP server on an ephemeral port with a temporary database and
talks to it over TCP — no mocks of the server itself.
"""

import itertools
import json
import os
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import app as backend  # noqa: E402

backend.RATE_AUTH = 10_000
backend.RATE_GENERAL = 10_000


class ServerCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.NamedTemporaryFile(prefix="mv-test-", suffix=".db", delete=False)
        cls.tmp.close()
        os.environ["MV_TRUST_PROXY"] = "1"
        os.environ["MV_TRIAL_DAYS"] = "7"
        cls.ip = itertools.count(1)
        cls.server = backend.make_server("127.0.0.1", 0, cls.tmp.name)
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

    def call(self, method, path, body=None, token=None, headers=None, ip=None):
        url = "http://127.0.0.1:%d%s" % (self.port, path)
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Content-Type", "application/json")
        if token:
            req.add_header("Authorization", "Bearer " + token)
        if ip:
            req.add_header("X-Forwarded-For", ip)
        for key, value in (headers or {}).items():
            req.add_header(key, value)
        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                raw = res.read()
                return res.status, (json.loads(raw) if raw else {})
        except urllib.error.HTTPError as err:
            raw = err.read()
            try:
                payload = json.loads(raw) if raw else {}
            except Exception:
                payload = {}
            return err.code, payload

    def register(self, email="a@example.com", password="hunter2hunter2", ip=None):
        ip = ip or ("10.0.0.%d" % next(self.ip))
        status, body = self.call("POST", "/api/auth/register", {"email": email, "password": password}, ip=ip)
        self.assertEqual(status, 201, body)
        return body["token"]

    # -- tests ------------------------------------------------------------

    def test_01_health(self):
        status, body = self.call("GET", "/api/health")
        self.assertEqual(status, 200)
        self.assertTrue(body["ok"])
        self.assertIn("version", body)

    def test_02_register_and_duplicate(self):
        token = self.register("dup@example.com")
        self.assertTrue(token)
        status, body = self.call("POST", "/api/auth/register", {"email": "dup@example.com", "password": "hunter2hunter2"})
        self.assertEqual(status, 409)
        self.assertIn("already registered", body["error"])

    def test_03_weak_password_and_bad_email(self):
        status, body = self.call("POST", "/api/auth/register", {"email": "x@example.com", "password": "short"})
        self.assertEqual(status, 400)
        status, body = self.call("POST", "/api/auth/register", {"email": "not-an-email", "password": "hunter2hunter2"})
        self.assertEqual(status, 400)

    def test_04_login_paths(self):
        self.register("login@example.com")
        status, body = self.call("POST", "/api/auth/login", {"email": "login@example.com", "password": "wrong"})
        self.assertEqual(status, 401)
        status, body = self.call("POST", "/api/auth/login", {"email": "login@example.com", "password": "hunter2hunter2"})
        self.assertEqual(status, 200)
        self.assertIn("token", body)

    def test_05_me_requires_token(self):
        status, _ = self.call("GET", "/api/me")
        self.assertEqual(status, 401)
        status, body = self.call("GET", "/api/me", token="nonsense")
        self.assertEqual(status, 401)
        token = self.register("me@example.com")
        status, body = self.call("GET", "/api/me", token=token)
        self.assertEqual(status, 200)
        self.assertEqual(body["user"]["email"], "me@example.com")
        self.assertEqual(body["user"]["plan"], "free")
        self.assertNotIn("pw_hash", json.dumps(body))

    def test_06_board_crud(self):
        token = self.register("crud@example.com")
        board = {"name": "Saturday", "layout": "4", "tiles": [
            {"url": "https://example.com/a.m3u8", "muted": True, "cc": False},
            {"url": "https://example.com/b.m3u8", "muted": False, "cc": True},
        ]}
        status, body = self.call("POST", "/api/boards", board, token=token)
        self.assertEqual(status, 201, body)
        board_id = body["board"]["id"]
        self.assertEqual(len(body["board"]["tiles"]), 2)

        status, body = self.call("GET", "/api/boards", token=token)
        self.assertEqual(len(body["boards"]), 1)
        self.assertEqual(body["limit"], 2)

        status, body = self.call("PUT", "/api/boards/" + board_id, {
            "name": "Saturday night", "layout": "2",
            "tiles": [{"url": "https://example.com/c.m3u8"}],
        }, token=token)
        self.assertEqual(status, 200)
        self.assertEqual(body["board"]["layout"], "2")
        self.assertEqual(len(body["board"]["tiles"]), 1)

        status, _ = self.call("DELETE", "/api/boards/" + board_id, token=token)
        self.assertEqual(status, 200)
        status, body = self.call("GET", "/api/boards", token=token)
        self.assertEqual(body["boards"], [])

    def test_07_tile_validation(self):
        token = self.register("validate@example.com")
        status, body = self.call("POST", "/api/boards", {
            "name": "bad", "layout": "4",
            "tiles": [{"url": "javascript:alert(1)"}],
        }, token=token)
        self.assertEqual(status, 400)

        status, body = self.call("POST", "/api/boards", {
            "name": "too many", "layout": "9",
            "tiles": [{"url": "https://example.com/%d.m3u8" % i} for i in range(10)],
        }, token=token)
        self.assertEqual(status, 400)

        status, body = self.call("POST", "/api/boards", {"name": "x", "layout": "5", "tiles": []}, token=token)
        self.assertEqual(status, 400)

        # unsafe entries are dropped, valid ones kept
        status, body = self.call("POST", "/api/boards", {
            "name": "mixed", "layout": "2",
            "tiles": [{"url": "javascript:alert(1)"}, {"url": "https://example.com/ok.m3u8"}],
        }, token=token)
        self.assertEqual(status, 201)
        self.assertEqual(len(body["board"]["tiles"]), 1)

    def test_08_free_limit(self):
        token = self.register("limit@example.com")
        for i in range(2):
            status, body = self.call("POST", "/api/boards", {
                "name": "b%d" % i, "layout": "1", "tiles": [{"url": "https://example.com/%d.m3u8" % i}],
            }, token=token)
            self.assertEqual(status, 201, body)
        status, body = self.call("POST", "/api/boards", {
            "name": "b3", "layout": "1", "tiles": [{"url": "https://example.com/3.m3u8"}],
        }, token=token)
        self.assertEqual(status, 402)
        self.assertIn("Upgrade", body["error"])

    def test_09_share_round_trip(self):
        token = self.register("share@example.com")
        status, body = self.call("POST", "/api/boards", {
            "name": "Shared", "layout": "4",
            "tiles": [{"url": "https://example.com/a.m3u8"}],
        }, token=token)
        board_id = body["board"]["id"]
        status, body = self.call("POST", "/api/boards/%s/share" % board_id, token=token)
        self.assertEqual(status, 200)
        slug = body["slug"]
        self.assertTrue(body["url"].endswith("#s=" + slug))

        # public, no auth
        status, body = self.call("GET", "/api/share/" + slug)
        self.assertEqual(status, 200)
        self.assertEqual(body["board"]["name"], "Shared")

        status, _ = self.call("DELETE", "/api/boards/%s/share" % board_id, token=token)
        self.assertEqual(status, 200)
        status, _ = self.call("GET", "/api/share/" + slug)
        self.assertEqual(status, 404)

    def test_10_ownership_isolation(self):
        alice = self.register("alice@example.com")
        bob = self.register("bob@example.com")
        status, body = self.call("POST", "/api/boards", {
            "name": "Alice", "layout": "4",
            "tiles": [{"url": "https://example.com/a.m3u8"}],
        }, token=alice)
        board_id = body["board"]["id"]
        status, _ = self.call("PUT", "/api/boards/" + board_id, {"name": "hacked", "layout": "4", "tiles": []}, token=bob)
        self.assertEqual(status, 404)
        status, _ = self.call("DELETE", "/api/boards/" + board_id, token=bob)
        self.assertEqual(status, 404)

    def test_11_checkout_without_keys(self):
        token = self.register("pay@example.com")
        status, body = self.call("POST", "/api/billing/checkout", token=token)
        self.assertEqual(status, 503)
        self.assertIn("not configured", body["error"])

    def test_12_webhook_signature_and_upgrade(self):
        token = self.register("hook@example.com")
        status, me = self.call("GET", "/api/me", token=token)
        user_id = me["user"]["id"]

        secret = "whsec_test_secret"
        os.environ["STRIPE_WEBHOOK_SECRET"] = secret
        try:
            payload = json.dumps({
                "id": "evt_test_1",
                "type": "checkout.session.completed",
                "data": {"object": {
                    "client_reference_id": user_id,
                    "customer": "cus_test",
                    "payment_status": "paid",
                    "mode": "payment",
                }},
            }).encode()

            # bad signature
            status, _ = self.call("POST", "/api/billing/webhook", headers={"Stripe-Signature": "t=1,v1=deadbeef"})
            self.assertEqual(status, 400)

            import hashlib
            import hmac
            import time
            ts = int(time.time())
            sig = hmac.new(secret.encode(), ("%d." % ts).encode() + payload, hashlib.sha256).hexdigest()
            req = urllib.request.Request("http://127.0.0.1:%d/api/billing/webhook" % self.port, data=payload, method="POST")
            req.add_header("Content-Type", "application/json")
            req.add_header("Stripe-Signature", "t=%d,v1=%s" % (ts, sig))
            with urllib.request.urlopen(req, timeout=10) as res:
                self.assertEqual(res.status, 200)

            status, me = self.call("GET", "/api/me", token=token)
            self.assertEqual(me["user"]["plan"], "pro")

            # duplicate delivery is idempotent
            req2 = urllib.request.Request("http://127.0.0.1:%d/api/billing/webhook" % self.port, data=payload, method="POST")
            req2.add_header("Content-Type", "application/json")
            req2.add_header("Stripe-Signature", "t=%d,v1=%s" % (ts, sig))
            with urllib.request.urlopen(req2, timeout=10) as res:
                body = json.loads(res.read())
                self.assertTrue(body.get("duplicate"))
        finally:
            os.environ.pop("STRIPE_WEBHOOK_SECRET", None)

    def test_13_cors_preflight(self):
        req = urllib.request.Request("http://127.0.0.1:%d/api/boards" % self.port, method="OPTIONS")
        req.add_header("Origin", "http://localhost:5455")
        req.add_header("Access-Control-Request-Method", "POST")
        with urllib.request.urlopen(req, timeout=10) as res:
            self.assertEqual(res.status, 204)
            self.assertEqual(res.headers.get("Access-Control-Allow-Origin"), "http://localhost:5455")

        req = urllib.request.Request("http://127.0.0.1:%d/api/boards" % self.port, method="OPTIONS")
        req.add_header("Origin", "http://evil.example")
        with urllib.request.urlopen(req, timeout=10) as res:
            self.assertIsNone(res.headers.get("Access-Control-Allow-Origin"))

    def test_14_unknown_route(self):
        status, body = self.call("GET", "/api/nope")
        self.assertEqual(status, 404)
        self.assertNotIn("Traceback", json.dumps(body))


    def test_15_trial_is_started_and_expires(self):
        token = self.register("trial@example.com", ip="11.0.0.1")
        status, acct = self.call("GET", "/api/account", token=token, ip="11.0.0.1")
        self.assertEqual(status, 200)
        self.assertTrue(acct["entitled"])
        self.assertGreaterEqual(acct["trial"]["endsAt"], int(__import__("time").time()))
        self.assertEqual(acct["trial"]["days"], 7)
        self.assertFalse(acct["trial"]["available"])  # this IP has used its trial

        # expire it directly in the database
        import sqlite3
        with sqlite3.connect(self.tmp.name) as conn:
            conn.execute("UPDATE users SET trial_ends_at = 1 WHERE email = ?", ("trial@example.com",))

        status, body = self.call("POST", "/api/boards", {
            "name": "late", "layout": "1", "tiles": [{"url": "https://example.com/a.m3u8"}],
        }, token=token, ip="11.0.0.1")
        self.assertEqual(status, 402)
        self.assertIn("trial has ended", body["error"])

        status, acct = self.call("GET", "/api/account", token=token, ip="11.0.0.1")
        self.assertFalse(acct["entitled"])
        self.assertEqual(acct["user"]["trialDaysLeft"], 0)

    def test_16_one_trial_per_ip(self):
        first = self.register("ip-a@example.com", ip="12.0.0.9")
        status, acct = self.call("GET", "/api/account", token=first, ip="12.0.0.9")
        self.assertTrue(acct["entitled"])

        second = self.register("ip-b@example.com", ip="12.0.0.9")
        status, acct = self.call("GET", "/api/account", token=second, ip="12.0.0.9")
        self.assertFalse(acct["entitled"])
        self.assertEqual(acct["trial"]["endsAt"], 0)

        status, body = self.call("POST", "/api/boards", {
            "name": "nope", "layout": "1", "tiles": [{"url": "https://example.com/b.m3u8"}],
        }, token=second, ip="12.0.0.9")
        self.assertEqual(status, 402)

    def test_17_pro_bypasses_trial(self):
        token = self.register("pro@example.com", ip="13.0.0.1")
        status, me = self.call("GET", "/api/me", token=token, ip="13.0.0.1")
        user_id = me["user"]["id"]

        secret = "whsec_pro"
        os.environ["STRIPE_WEBHOOK_SECRET"] = secret
        try:
            import hashlib
            import hmac
            import json as _json
            import time as _time
            payload = _json.dumps({
                "id": "evt_pro_1",
                "type": "checkout.session.completed",
                "data": {"object": {
                    "client_reference_id": user_id,
                    "customer": "cus_pro",
                    "payment_status": "paid",
                    "mode": "payment",
                }},
            }).encode()
            ts = int(_time.time())
            sig = hmac.new(secret.encode(), ("%d." % ts).encode() + payload, hashlib.sha256).hexdigest()
            req = urllib.request.Request("http://127.0.0.1:%d/api/billing/webhook" % self.port, data=payload, method="POST")
            req.add_header("Content-Type", "application/json")
            req.add_header("Stripe-Signature", "t=%d,v1=%s" % (ts, sig))
            with urllib.request.urlopen(req, timeout=10) as res:
                self.assertEqual(res.status, 200)
        finally:
            os.environ.pop("STRIPE_WEBHOOK_SECRET", None)

        status, body = self.call("POST", "/api/boards", {
            "name": "pro board", "layout": "1", "tiles": [{"url": "https://example.com/p.m3u8"}],
        }, token=token, ip="13.0.0.1")
        self.assertEqual(status, 201, body)

    def test_18_rate_limit_is_per_ip_and_sends_retry_after(self):
        original = backend.RATE_AUTH
        backend.RATE_AUTH = 3
        try:
            ip = "198.51.100.7"
            body = {"email": "nobody@example.com", "password": "wrong-password"}
            for _ in range(3):
                status, _ = self.call("POST", "/api/auth/login", body, ip=ip)
                self.assertEqual(status, 401)

            req = urllib.request.Request(
                "http://127.0.0.1:%d/api/auth/login" % self.port,
                data=json.dumps(body).encode(),
                method="POST",
            )
            req.add_header("Content-Type", "application/json")
            req.add_header("X-Forwarded-For", ip)
            with self.assertRaises(urllib.error.HTTPError) as ctx:
                urllib.request.urlopen(req, timeout=10)
            self.assertEqual(ctx.exception.code, 429)
            self.assertEqual(ctx.exception.headers.get("Retry-After"), str(backend.RATE_WINDOW))

            # a different address still gets through
            status, _ = self.call("POST", "/api/auth/login", body, ip="198.51.100.8")
            self.assertEqual(status, 401)
        finally:
            backend.RATE_AUTH = original
            backend._RATE.clear()

if __name__ == "__main__":
    unittest.main(verbosity=2)
