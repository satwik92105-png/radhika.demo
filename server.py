import http.server
import socketserver
import webbrowser
import socket
import os
import json
import sqlite3
from urllib.parse import urlparse

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(DIRECTORY, "boutique.db")

# Initialize SQLite database for orders and bespoke inquiries
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_number TEXT UNIQUE,
            date TEXT,
            customer_name TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            total_usd REAL,
            payment_method TEXT,
            status TEXT,
            items_json TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS bespoke_inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            occasion TEXT,
            budget TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def get_free_port(start_port=8080):
    port = start_port
    while port < 65535:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            res = sock.connect_ex(('127.0.0.1', port))
            if res != 0:
                return port
            port += 1
    return 8080

class BoutiqueHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        
        # API: Get all orders stored in Python SQLite database
        if parsed.path == '/api/orders':
            try:
                conn = sqlite3.connect(DB_FILE)
                conn.row_factory = sqlite3.Row
                c = conn.cursor()
                c.execute('SELECT * FROM orders ORDER BY id DESC')
                rows = [dict(r) for r in c.fetchall()]
                conn.close()

                # Parse items_json
                for r in rows:
                    if 'items_json' in r and r['items_json']:
                        try:
                            r['items'] = json.loads(r['items_json'])
                        except:
                            r['items'] = []

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(rows).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
                return

        # Default static file handler (index.html, style.css, etc.)
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(post_data) if post_data else {}
        except:
            data = {}

        # API: Record Order in Python Backend
        if parsed.path == '/api/orders':
            try:
                order_num = data.get('orderNumber', 'AT-999999')
                date = data.get('date', '')
                customer = data.get('customer', '')
                email = data.get('email', '')
                phone = data.get('phone', '')
                address = data.get('shippingAddress', '')
                total = float(data.get('totalUSD', 0))
                method = data.get('paymentMethod', 'CARD')
                status = data.get('status', 'Received')
                items = json.dumps(data.get('items', []))

                conn = sqlite3.connect(DB_FILE)
                c = conn.cursor()
                c.execute('''
                    INSERT OR REPLACE INTO orders 
                    (order_number, date, customer_name, email, phone, address, total_usd, payment_method, status, items_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (order_num, date, customer, email, phone, address, total, method, status, items))
                conn.commit()
                conn.close()

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'order_number': order_num}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
                return

        # API: Record Bespoke Custom Inquiry
        if parsed.path == '/api/bespoke':
            try:
                name = data.get('name', '')
                email = data.get('email', '')
                occasion = data.get('occasion', '')
                budget = data.get('budget', '')
                notes = data.get('notes', '')

                conn = sqlite3.connect(DB_FILE)
                c = conn.cursor()
                c.execute('''
                    INSERT INTO bespoke_inquiries (name, email, occasion, budget, notes)
                    VALUES (?, ?, ?, ?, ?)
                ''', (name, email, occasion, budget, notes))
                conn.commit()
                conn.close()

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'Inquiry recorded'}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    port = get_free_port(8080)
    url = f"http://localhost:{port}"
    print("=" * 60)
    print("  ✨ ATELIER ÉLÉONORE - PYTHON BACKEND & SERVER RUNNING")
    print(f"  🌐 Local Website: {url}")
    print(f"  🗄️ SQLite Database: {DB_FILE}")
    print("=" * 60)
    print("Press Ctrl+C to stop the server.\n")

    try:
        webbrowser.open(url)
    except:
        pass

    with socketserver.TCPServer(("", port), BoutiqueHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
