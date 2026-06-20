const http = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');

const WS_PORT = 3000;
const API_PORT = 4000;

const FILE_OEE = path.join(__dirname, 'data_oee.json');
const FILE_DOWNTIME = path.join(__dirname, 'data_downtime.json');

function readJSON(filePath) {
    try {
        if (!fs.existsSync(filePath)) return [];
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw) || [];
    } catch (e) {
        console.error('[FILE] Gagal baca:', filePath, e.message);
        return [];
    }
}

function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('[FILE] Gagal tulis:', filePath, e.message);
    }
}

if (!fs.existsSync(FILE_OEE)) writeJSON(FILE_OEE, []);
if (!fs.existsSync(FILE_DOWNTIME)) writeJSON(FILE_DOWNTIME, []);

const liveStatus = {};

const wsServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/good' && req.method === 'GET') {
        const line = url.searchParams.get('line') || '';
        const message = line ? JSON.stringify({ type: 'good', line }) : 'z';
        console.log(`[WS] GOOD dari ESP32${line ? ' | LINE ' + line : ''}`);
        wss.clients.forEach(client => {
            if (client.readyState === 1) client.send(message);
        });
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        return;
    }

    res.writeHead(404); res.end();
});

const wss = new WebSocketServer({ server: wsServer });

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log('[WS] Browser terhubung dari:', ip);
    ws.on('close', () => console.log('[WS] Browser terputus:', ip));
});

wsServer.listen(WS_PORT, '0.0.0.0', () => {
    console.log('[WS]  WebSocket + ESP32 berjalan di port', WS_PORT);
});

const apiServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname.toLowerCase();

    if (pathname === '/api/read-oee' && req.method === 'GET') {
        const data = readJSON(FILE_OEE);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
    }

    if (pathname === '/api/read-downtime' && req.method === 'GET') {
        const data = readJSON(FILE_DOWNTIME);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
    }

    if (pathname === '/api/live-update' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                let line = String(payload.line || '').trim();
                if (!line) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'line wajib diisi' }));
                    return;
                }

                // FILTER: Jika started === false, DELETE dari liveStatus (jangan simpan)
                if (payload.started === false) {
                    if (liveStatus[line]) delete liveStatus[line];
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'ok', action: 'deleted' }));
                    return;
                }

                payload.line = line;  // Normalize line
                payload.lastUpdate = Date.now();
                liveStatus[line] = payload;

                const notif = JSON.stringify({ type: 'live_update', line });
                wss.clients.forEach(client => {
                    if (client.readyState === 1) client.send(notif);
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) {
                console.error('[API] Error live-update:', e.message);
                res.writeHead(500); res.end('Error: ' + e.message);
            }
        });
        return;
    }

    if (pathname === '/api/live-status' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(Object.values(liveStatus)));
        return;
    }

    if (pathname === '/api/live-clear' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const line = String(payload.line || '').trim();
                if (line && liveStatus[line]) delete liveStatus[line];

                const notif = JSON.stringify({ type: 'live_clear', line });
                wss.clients.forEach(client => {
                    if (client.readyState === 1) client.send(notif);
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) {
                res.writeHead(500); res.end('Error: ' + e.message);
            }
        });
        return;
    }

    if (pathname === '/api/live-clear-all' && req.method === 'POST') {
        const count = Object.keys(liveStatus).length;
        liveStatus = {};
        console.log('[API] All live data cleared. Removed', count, 'lines');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', cleared: count }));
        return;
    }

    if (pathname === '/api/save-oee' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const record = JSON.parse(body);
                const data = readJSON(FILE_OEE);
                record.id = Date.now();
                data.push(record);
                writeJSON(FILE_OEE, data);
                console.log('[API] OEE tersimpan:', record.machine, '| Model:', record.model);
                const notifOee = JSON.stringify({ type: 'data_updated', source: 'oee' });
                wss.clients.forEach(client => {
                    if (client.readyState === 1) client.send(notifOee);
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', id: record.id }));
            } catch (e) {
                console.error('[API] Error save-oee:', e.message);
                res.writeHead(500); res.end('Error: ' + e.message);
            }
        });
        return;
    }

    if (pathname === '/api/save-downtime' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const record = JSON.parse(body);
                const data = readJSON(FILE_DOWNTIME);
                record.id = Date.now();
                data.push(record);
                writeJSON(FILE_DOWNTIME, data);
                console.log('[API] Downtime tersimpan:', record.machine, '| Detail:', record.detail);
                const notif = JSON.stringify({ type: 'data_updated', source: 'downtime' });
                wss.clients.forEach(client => {
                    if (client.readyState === 1) client.send(notif);
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', id: record.id }));
            } catch (e) {
                console.error('[API] Error save-downtime:', e.message);
                res.writeHead(500); res.end('Error: ' + e.message);
            }
        });
        return;
    }

    if (pathname === '/api/delete-oee' && req.method === 'DELETE') {
        const id = parseInt(url.searchParams.get('id'));
        let data = readJSON(FILE_OEE);
        data = data.filter(r => r.id !== id);
        writeJSON(FILE_OEE, data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    if (pathname === '/api/delete-downtime' && req.method === 'DELETE') {
        const id = parseInt(url.searchParams.get('id'));
        let data = readJSON(FILE_DOWNTIME);
        data = data.filter(r => r.id !== id);
        writeJSON(FILE_DOWNTIME, data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    if (pathname === '/api/edit-oee' && req.method === 'PUT') {
        const id = parseInt(url.searchParams.get('id'));
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const updated = JSON.parse(body);
                let data = readJSON(FILE_OEE);
                const idx = data.findIndex(r => r.id === id);
                if (idx !== -1) { data[idx] = Object.assign(data[idx], updated); }
                writeJSON(FILE_OEE, data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) {
                res.writeHead(500); res.end('Error: ' + e.message);
            }
        });
        return;
    }

    if (pathname === '/api/edit-downtime' && req.method === 'PUT') {
        const id = parseInt(url.searchParams.get('id'));
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const updated = JSON.parse(body);
                let data = readJSON(FILE_DOWNTIME);
                const idx = data.findIndex(r => r.id === id);
                if (idx !== -1) { data[idx] = Object.assign(data[idx], updated); }
                writeJSON(FILE_DOWNTIME, data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) {
                res.writeHead(500); res.end('Error: ' + e.message);
            }
        });
        return;
    }

    if (pathname === '/api/edit-oee' && req.method === 'POST') {
        const id = parseInt(url.searchParams.get('id'));
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const updated = JSON.parse(body);
                let data = readJSON(FILE_OEE);
                const idx = data.findIndex(r => r.id === id);
                if (idx !== -1) {
                    data[idx] = Object.assign(data[idx], updated);
                    writeJSON(FILE_OEE, data);
                    console.log('[API] OEE diedit (POST):', data[idx].machine, '| Setup:', data[idx].setup_time);
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', data: data[idx] }));
            } catch (e) {
                console.error('[API] Error edit-oee POST:', e.message);
                res.writeHead(500);
                res.end('Error: ' + e.message);
            }
        });
        return;
    }

    if (pathname === '/api/edit-downtime' && req.method === 'POST') {
        const id = parseInt(url.searchParams.get('id'));
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const updated = JSON.parse(body);
                let data = readJSON(FILE_DOWNTIME);
                const idx = data.findIndex(r => r.id === id);
                if (idx !== -1) {
                    data[idx] = Object.assign(data[idx], updated);
                    writeJSON(FILE_DOWNTIME, data);
                    console.log('[API] Downtime diedit (POST):', data[idx].machine, '| Type:', data[idx].type);
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', data: data[idx] }));
            } catch (e) {
                console.error('[API] Error edit-downtime POST:', e.message);
                res.writeHead(500);
                res.end('Error: ' + e.message);
            }
        });
        return;
    }

    res.writeHead(404); res.end('Not Found');
});

apiServer.listen(API_PORT, '0.0.0.0', () => {
    console.log('[API] REST API berjalan di port', API_PORT);
});

console.log('===========================================');
console.log('   OEE SERVER');
console.log('   WebSocket (ESP32) : port', WS_PORT);
console.log('   REST API (Data)   : port', API_PORT);
console.log('   Data disimpan di  : data_oee.json & data_downtime.json');
console.log('   Live status       : in-memory (realtime, tidak disimpan ke file)');
console.log('===========================================');
