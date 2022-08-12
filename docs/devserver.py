#!/usr/bin/env python3

"""Development server.

Features:
    - Disables caching for static files
    - Link substitution

Usage:
    $ ./devserver.py

Gotchas:
    - Currently only works with index.html page
"""
import os
import time
import http.server
from http import HTTPStatus


PORT = 8000


# Substitutions
SUB = [
    (
        '/react-json-form/',
        '/'
    ),
    (
        'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/4.6.2/css/bootstrap.min.css',
        '/local/bootstrap.min.css',
    ),
    (
        'https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.production.min.js',
        '/node_modules/react/umd/react.development.js',
    ),
    (
        'https://cdnjs.cloudflare.com/ajax/libs/react-dom/17.0.2/umd/react-dom.production.min.js',
        '/node_modules/react-dom/umd/react-dom.development.js',
    ),
    (
        'https://cdnjs.cloudflare.com/ajax/libs/react-modal/3.15.1/react-modal.min.js',
        '/node_modules/react-modal/dist/react-modal.min.js'
    ),
]


CACHE_TIME = None
CACHE_DATA = None


class DevHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def send_response_only(self, code, message=None):
        super().send_response_only(code, message)
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')

    def is_index(self):
        return self.path == '/' or self.path == '/index.html'

    def do_GET(self):
        if self.is_index():
            try:
                f = open('index.html', 'rb')
            except OSError:
                self.send_error(HTTPStatus.NOT_FOUND, "File not found")
                return None

            try:
                fs = os.fstat(f.fileno())
                global CACHE_TIME
                global CACHE_DATA
                if not CACHE_TIME or CACHE_TIME <= fs.st_mtime:
                    CACHE_TIME = time.time()
                    CACHE_DATA = f.read().decode()

                    for sub in SUB:
                        CACHE_DATA = CACHE_DATA.replace(sub[0], sub[1])

                    CACHE_DATA = CACHE_DATA.encode('utf-8')

                self.send_response(HTTPStatus.OK)
                self.send_header("Content-type", "text/html")
                self.send_header("Content-Length", str(len(CACHE_DATA)))
                self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
                self.end_headers()

                f.close()

                self.wfile.write(CACHE_DATA)
            except:
                f.close()
                raise
        else:
            super().do_GET()


if __name__ == '__main__':
    http.server.test(
        HandlerClass=DevHTTPRequestHandler,
        port=PORT
    )