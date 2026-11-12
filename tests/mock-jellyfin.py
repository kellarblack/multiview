"""Protocol-faithful Jellyfin stub for the integration tests.

Not a Jellyfin implementation: just the handful of endpoints the app uses,
with the same response shapes and the same auth header. Used to verify the
client's request/response handling without anyone's real server.
"""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TOKEN = "mock-token-abc123"
USER = {"Id": "u-1", "Name": "demo"}

CHANNELS = {
    "Items": [
        {"Id": "ch-1", "Name": "Mock News", "ChannelNumber": "1", "ServiceName": "Stub Tuner"},
        {"Id": "ch-2", "Name": "Mock Sport", "ChannelNumber": "2", "ServiceName": "Stub Tuner"},
    ]
}


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "X-Emby-Token, Content-Type, Accept")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Max-Age", "600")

    def _json(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _authed(self):
        return self.headers.get("X-Emby-Token") == TOKEN

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/System/Info/Public":
            return self._json(200, {"ServerName": "Mock Jellyfin", "Version": "10.9.0"})
        if not self._authed():
            return self._json(401, {"error": "unauthorised"})
        if path == "/Users/Me":
            return self._json(200, USER)
        if path == "/LiveTv/Info":
            return self._json(200, {"IsEnabled": True, "Services": []})
        if path == "/LiveTv/Channels":
            return self._json(200, CHANNELS)
        return self._json(404, {"error": "not found"})

    def do_POST(self):
        path = self.path.split("?")[0]
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw or b"{}")
        except Exception:
            body = {}
        if path == "/Users/AuthenticateByName":
            if body.get("Username") == "demo" and body.get("Pw") == "demo":
                return self._json(200, {"AccessToken": TOKEN, "User": USER})
            return self._json(401, {"error": "bad credentials"})
        return self._json(404, {"error": "not found"})

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    print("mock jellyfin on http://127.0.0.1:%d" % port, flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
