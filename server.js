const http = require('http');
const { WebSocketServer } = require('ws');

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    console.log(`[REQUEST] ${req.method} ${req.url} dari IP: ${req.socket.remoteAddress}`);

    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/good' && req.method === 'GET') {
        const line = url.searchParams.get('line') || '';
        console.log(`[ESP32] Terima signal /good dengan line=${line}`);

        if (line) {
            console.log(`[DATA] Tidak simpan otomatis untuk line=${line}. Data OEE hanya dibuat dari input homepage saat Stop.`);
        }

        const message = line ? JSON.stringify({ type: 'good', line, timestamp: Date.now() }) : 'z';
        const browserCount = broadcast(message);
        console.log(`[BROADCAST] Kirim ke ${browserCount} browser`);

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        return;
    }

    res.writeHead(404);
    res.end();
});

const wss = new WebSocketServer({ server });

function broadcast(message, sender = null) {
    let browserCount = 0;
    wss.clients.forEach(client => {
        if (client !== sender && client.readyState === 1) {
            client.send(message);
            browserCount++;
        }
    });
    return browserCount;
}

wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
        try {
            const msg = JSON.parse(raw.toString());
            if (msg.type === 'stop_line' && msg.line) {
                const payload = JSON.stringify({
                    type: 'stop_line',
                    line: String(msg.line).trim(),
                    source: 'live_monitor',
                    timestamp: Date.now()
                });
                const browserCount = broadcast(payload, ws);
                console.log(`[COMMAND] Stop line=${msg.line} dikirim ke ${browserCount} browser`);
            }
        } catch (e) {
            console.warn('[WS] Pesan tidak valid:', e.message);
        }
    });
    console.log('[BROWSER] Terhubung');
    ws.on('close', () => console.log('[BROWSER] Terputus'));
});

server.listen(3000, '0.0.0.0', () => {
    console.log('===========================================');
    console.log('   OEE WebSocket Server');
    console.log('   Port: 3000');
    console.log('   ESP32: http://192.168.62.38:3000/good?line=<LINE>');
    console.log('   Data OEE: dibuat dari homepage saat Stop');
    console.log('===========================================');
    console.log('[READY] Menunggu signal dari ESP32...\n');
});
