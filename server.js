const http = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');

const FILE_OEE = path.join(__dirname, 'data_oee.json');

function readJSON(filePath) {
    try {
        if (!fs.existsSync(filePath)) return [];
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw) || [];
    } catch (e) {
        console.error('[FILE] Error:', e.message);
        return [];
    }
}

function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('[FILE] Error:', e.message);
    }
}

if (!fs.existsSync(FILE_OEE)) writeJSON(FILE_OEE, []);

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    console.log(`[REQUEST] ${req.method} ${req.url} dari IP: ${req.socket.remoteAddress}`);

    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/good' && req.method === 'GET') {
        const line = url.searchParams.get('line') || '';
        console.log(`[ESP32] ✅ TERIMA SIGNAL /good dengan line=${line}`);

        if (line) {
            try {
                const record = {
                    id: Date.now(),
                    machine: 'Line ' + line,
                    model: 'ESP32-Button-' + line,
                    good_count: 1,
                    timestamp: new Date().toISOString()
                };

                let data = readJSON(FILE_OEE);
                data.push(record);
                writeJSON(FILE_OEE, data);
                console.log(`[DATA] ✅ DISIMPAN ke data_oee.json | Total: ${data.length} records`);
            } catch (e) {
                console.error('[DATA] ❌ Error:', e.message);
            }
        }

        const message = line ? JSON.stringify({ type: 'good', line, timestamp: Date.now() }) : 'z';
        const browserCount = broadcast(message);
        console.log(`[BROADCAST] 📤 Kirim ke ${browserCount} browser`);

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("OK");
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
    console.log('[BROWSER] ✅ Terhubung');
    ws.on('close', () => console.log('[BROWSER] ❌ Terputus'));
});

server.listen(3000, '0.0.0.0', () => {
    console.log('===========================================');
    console.log('   🚀 OEE WebSocket Server');
    console.log('   📍 Port: 3000');
    console.log('   🔌 ESP32: http://192.168.62.38:3000/good?line=<LINE>');
    console.log('   💾 Data: data_oee.json');
    console.log('===========================================');
    console.log('[READY] ⏳ Menunggu signal dari ESP32...\n');
});
