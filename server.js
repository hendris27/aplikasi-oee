const http = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');

const FILE_OEE = path.join(__dirname, 'data_oee.json');
const FILE_LIVE = path.join(__dirname, 'data_live_status.json');

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
        return true;
    } catch (e) {
        console.error('[FILE] Error:', e.message);
        return false;
    }
}

function upsertLiveStatus(payload) {
    const line = String(payload.line || '').trim();
    if (!line || line === '-') return false;

    const data = readJSON(FILE_LIVE).filter(row => row && typeof row === 'object');
    const idx = data.findIndex(row => String(row.line || '').trim() === line);
    const row = {
        ...payload,
        line,
        lastUpdate: Date.now()
    };

    if (idx >= 0) data[idx] = { ...data[idx], ...row };
    else data.push(row);

    return writeJSON(FILE_LIVE, data);
}

function clearLiveStatus(line) {
    const cleanLine = String(line || '').trim();
    if (!cleanLine) return false;
    const data = readJSON(FILE_LIVE).filter(row => {
        if (!row || typeof row !== 'object') return true;
        return String(row.line || '').trim() !== cleanLine;
    });
    return writeJSON(FILE_LIVE, data);
}

function saveOeeRecord(record) {
    if (!record || typeof record !== 'object') return false;
    const data = readJSON(FILE_OEE).filter(row => row && typeof row === 'object');
    const id = record.id || Date.now();
    const exists = data.some(row => String(row.id || '') === String(id));
    if (!exists) data.push({ ...record, id });
    return writeJSON(FILE_OEE, data);
}

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
    readJSON(FILE_LIVE).forEach(row => {
        if (row && typeof row === 'object' && row.line) {
            ws.send(JSON.stringify({ type: 'live_update', ...row }));
        }
    });

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
            } else if (msg.type === 'live_update' && msg.line) {
                const payload = {
                    ...msg,
                    type: 'live_update',
                    line: String(msg.line).trim(),
                    lastUpdate: Date.now()
                };
                upsertLiveStatus(payload);
                const browserCount = broadcast(JSON.stringify(payload), ws);
                console.log(`[LIVE] Update line=${payload.line} dikirim ke ${browserCount} browser`);
            } else if (msg.type === 'live_clear' && msg.line) {
                const cleanLine = String(msg.line).trim();
                clearLiveStatus(cleanLine);
                const browserCount = broadcast(JSON.stringify({
                    type: 'live_clear',
                    line: cleanLine,
                    timestamp: Date.now()
                }), ws);
                console.log(`[LIVE] Clear line=${cleanLine} dikirim ke ${browserCount} browser`);
            } else if (msg.type === 'save_oee' && msg.record) {
                const ok = saveOeeRecord(msg.record);
                console.log(`[DATA] Save OEE via WS ${ok ? 'OK' : 'FAILED'}`);
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
