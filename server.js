const http = require('http');
const { WebSocketServer } = require('ws');
const ExcelJS = require('exceljs');
const fs = require('fs');

const FILE_OEE = './MASTER_OEE_PABRIK.xlsx';
const FILE_DOWNTIME = './MASTER_DOWNTIME_PABRIK.xlsx';

async function writeToExcel(filePath, sheetName, headers, dataRow) {
    const workbook = new ExcelJS.Workbook();
    if (fs.existsSync(filePath)) {
        try { await workbook.xlsx.readFile(filePath); }
        catch (e) { console.log("File terkunci, mencoba menulis..."); }
    }

    let worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
        worksheet = workbook.addWorksheet(sheetName);

        // ── Style header ──────────────────────────────
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } }; // biru tua
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };   // putih
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };
        });
        headerRow.height = 30;
    }

    const lastRowNum = worksheet.lastRow ? worksheet.lastRow.number : 1;
    const nextNo = lastRowNum === 1 ? 1 : Number(worksheet.getCell(`A${lastRowNum}`).value) + 1;

    // ── Warna baris selang-seling ──────────────────
    const isEven = nextNo % 2 === 0;
    const rowFill = isEven
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } }  // orange muda
        : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };  // putih

    const newRow = worksheet.addRow([nextNo, ...dataRow]);
    newRow.eachCell(cell => {
        cell.fill = rowFill;
        cell.font = { name: 'Arial', size: 9 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
        };
    });
    newRow.height = 20;

    // ── Lebar kolom otomatis per file ──────────────
    if (filePath === FILE_DOWNTIME) {
        const widths = [4, 15, 25, 15, 25, 25, 15, 20, 20, 20, 20];
        worksheet.columns.forEach((col, i) => { col.width = widths[i] || 12; });
    } else {
        const widths = [4, 15, 15, 25, 15, 25, 10, 10, 10, 10, 10, 10, 10, 10, 10, 15, 15, 15, 25];
        worksheet.columns.forEach((col, i) => { col.width = widths[i] || 10; });
    }

    // ── Freeze header row ──────────────────────────
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    await workbook.xlsx.writeFile(filePath);
}

// ── SERVER KLIEN (WebSocket Arduino) port 8000 ──────────────
const serverKlien = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.url === '/good' && req.method === 'GET') {
        console.log('[KLIEN] GOOD FROM ESP32');
        wss.clients.forEach(client => {
            if (client.readyState === 1) client.send('z');
        });
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("OK");
        return;
    }

    res.writeHead(404);
    res.end();
});

const wss = new WebSocketServer({ server: serverKlien });
serverKlien.listen(3000, '0.0.0.0', () => {
    console.log('[KLIEN] WebSocket server jalan di port 3000');
});

// ── SERVER UTAMA (API Excel) port 3000 ──────────────────────
const serverUtama = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const normalizedUrl = req.url.toLowerCase();
    if (normalizedUrl.includes('/api/save-pabrik') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);

                if (data.targetFile === "DOWNTIME") {
                    const headers = ["No", "MACHINE", "Model", "Type", "Detail", "Time", "Period", "Tech", "Job", "Executor", "Solution"];
                    const row = [data.machine, data.model, data.type, data.detail, data.time, data.period, "", "", "", ""];
                    await writeToExcel(FILE_DOWNTIME, "Downtime Database", headers, row);
                    console.log(`[UTAMA] Downtime tercatat: ${data.machine} | ${data.detail}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'success' }));
                    return;
                }

                if (data.targetFile === "OEE_MASTER") {
                    const headers = ["No", "MACHINE", "Operator", "Model", "Customer", "Start", "OEE", "AVB", "PFM", "QLY", "ACV", "Real Cycle", "Std Cycle", "Good Qty", "NG Qty", "Run Time", "Down Time", "Setup Time", "Stop Time"];
                    const row = [data.machine, data.operator, data.model, data.customer, data.start, data.oee, data.avb, data.pfm, data.qly, data.acv, data.real_cycle, data.std_cycle, data.good, data.ng, data.run_time, data.down_time, "", data.stop_time];
                    await writeToExcel(FILE_OEE, "OEE Master Database", headers, row);
                    console.log(`[UTAMA] OEE Export tercatat: ${data.machine} | OEE: ${data.oee}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'success' }));
                    return;
                }

                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end("Target file tidak dikenali");
            } catch (err) {
                console.error('[UTAMA] Gagal memproses:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end("Server Error: " + err.message);
            }
        });
        return;
    }

    res.writeHead(404);
    res.end();
});

serverUtama.listen(4000, '0.0.0.0', () => {
    console.log('[UTAMA] API server jalan di port 4000');
});

console.log('===========================================');
console.log('   OEE TEST MODE - SINGLE PC');
console.log('   WebSocket : port 3000');
console.log('   API Excel : port 4000');
console.log('===========================================');
