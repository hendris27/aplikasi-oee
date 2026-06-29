<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All Data</title>
    <link rel="icon" href="{{ asset('favicon.jpg') }}">
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js"></script>

</head>

<body>

    <div class="top-bar">
        <div class="top-left">
            <img src="{{ asset('favicon.png') }}" alt="SIIX LOGO" class="logo">
            <h1>OEE Data</h1>
        </div>
        <div class="cntrtxt">
            <h1 class="top">BE LINE</h1>
            <h1 class="bot">OEE PROGRAM</h1>
        </div>
        <div class="top-right">
            <h4>PRODUCTION 2 - ENGINEERING 2</h4>
        </div>
    </div>

    <div class="allpage-wrapper">

        <div class="breadcrumb-bar">
            <span class="breadcrumb-link" onclick="window.location.href='/'">Home</span>
            <span class="breadcrumb-sep">/</span>
            <span>All Data</span>
        </div>
        <div class="action-row">
            <div class="tab-group">
                <button class="tab-btn active" id="tab-oee" onclick="switchTab('oee')">
                    OEE Data
                </button>
                <button class="tab-btn" id="tab-downtime" onclick="switchTab('downtime')">
                    Downtime Data
                </button>
            </div>
            <button class="export-btn" onclick="exportExcel()">
                <i class="fa-regular fa-file-excel"></i> Export
            </button>
        </div>

        <div class="filter-bar">
            <div id="filters-oee" class="filters-group">
                <div class="filter-item">
                    <label>Line</label>
                    <select id="f-line" onchange="applyFilters()">
                        <option value="">Line</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label>Shift</label>
                    <select id="f-shift" onchange="applyFilters()">
                        <option value="">Shift</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label>Group</label>
                    <select id="f-group" onchange="applyFilters()">
                        <option value="">Group</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label>Customer</label>
                    <select id="f-customer" onchange="applyFilters()">
                        <option value="">Customer</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label>Machine</label>
                    <select id="f-machine" onchange="applyFilters()">
                        <option value="">Machine</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label>From</label>
                    <input type="date" id="f-from" onchange="applyFilters()">
                </div>
                <div class="filter-item">
                    <label>To</label>
                    <input type="date" id="f-to" onchange="applyFilters()">
                </div>
                <div class="filter-item search-model-item">
                    <label>Search Model</label>
                    <input type="text" id="f-search" placeholder="Model name..." oninput="applyFilters()">
                </div>
            </div>

            <div id="filters-downtime" class="filters-group" style="display:none;">
                <div class="filter-item">
                    <label>Line</label>
                    <select id="fd-line" onchange="applyFilters()">
                        <option value="">Line</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label>Machine</label>
                    <select id="fd-machine" onchange="applyFilters()">
                        <option value="">Machine</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label>Type</label>
                    <select id="fd-type" onchange="applyFilters()">
                        <option value="">Type</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label>From</label>
                    <input type="date" id="fd-from" onchange="applyFilters()">
                </div>
                <div class="filter-item">
                    <label>To</label>
                    <input type="date" id="fd-to" onchange="applyFilters()">
                </div>
                <div class="filter-item">
                    <label>Search Detail</label>
                    <input type="text" id="fd-search" placeholder="Detail..." oninput="applyFilters()">
                </div>
            </div>
        </div>

        <div class="table-wrapper">
            <div class="table-scroll">
                <table id="table-oee" class="data-table">
                    <thead>
                        <tr>
                            <th>NO</th>
                            <th>Date</th>
                            <th>Line</th>
                            <th>Machine</th>
                            <th>Operator</th>
                            <th>Model</th>
                            <th>Customer</th>
                            <th>Start</th>
                            <th>OEE</th>
                            <th>Availability</th>
                            <th>Performance</th>
                            <th>Quality</th>
                            <th>Achievement</th>
                            <th>Real Cycle</th>
                            <th>Std Cycle</th>
                            <th>Good Qty</th>
                            <th>NG Qty</th>
                            <th>Run Time</th>
                            <th>Down Time</th>
                            <th>Setup Time</th>
                            <th>Stop Time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-oee">
                        <tr>
                            <td colspan="22" class="no-data">Loading data...</td>
                        </tr>
                    </tbody>
                </table>

                <table id="table-downtime" class="data-table" style="display:none;">
                    <thead>
                        <tr>
                            <th>NO</th>
                            <th>Date</th>
                            <th>Line</th>
                            <th>Machine</th>
                            <th>Model</th>
                            <th>Type</th>
                            <th>Detail</th>
                            <th>Time</th>
                            <th>Period</th>
                            <th>Tech</th>
                            <th>Job</th>
                            <th>Executor</th>
                            <th>Solution</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-downtime">
                        <tr>
                            <td colspan="13" class="no-data">Loading data...</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="pagination-bar">
                <span id="pag-info" class="pag-info">Showing 0 records</span>
                <div class="pag-controls">
                    <button onclick="changePage(-1)" id="btn-prev">&#8592; Prev</button>
                    <span id="pag-pages"></span>
                    <button onclick="changePage(1)" id="btn-next">Next &#8594;</button>
                </div>
                <div class="pag-size">
                    <label>Per page:</label>
                    <select onchange="changePageSize(this.value)">
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="9999">All</option>
                    </select>
                </div>
            </div>
        </div>

    </div>

    <script>
        var currentTab = 'oee';
        var oeeData = [];
        var downtimeData = [];
        var filteredOee = [];
        var filteredDowntime = [];
        var currentPage = 1;
        var pageSize = 25;

        // Auto-detect berdasarkan hostname
        var SERVER_IP = window.location.hostname; // Auto: localhost atau IP server
        var API_BASE = window.location.origin;
        var API_BASES = [window.location.origin, 'http://' + SERVER_IP + ':4000'];

        document.addEventListener('DOMContentLoaded', function() {
            loadData();
        });

        async function loadData() {
            try {
                for (var i = 0; i < API_BASES.length; i++) {
                    var r1 = await fetch(API_BASES[i] + '/api/read-oee');
                    if (r1.ok) {
                        var d1 = await r1.json();
                        oeeData = d1.map(function(item, idx) {
                            return normalizeOee(item, idx);
                        });
                        break;
                    }
                }
            } catch (e) {
                console.warn('Failed to fetch OEE from server:', e.message);
            }

            try {
                for (var j = 0; j < API_BASES.length; j++) {
                    var r2 = await fetch(API_BASES[j] + '/api/read-downtime');
                    if (r2.ok) {
                        var d2 = await r2.json();
                        downtimeData = d2.map(function(item, idx) {
                            return normalizeDowntime(item, idx);
                        });
                        break;
                    }
                }
            } catch (e) {
                console.warn('Failed to fetch Downtime from server:', e.message);
            }

            populateFilterDropdowns();
            applyFilters();
        }

        function normalizeOee(item, idx) {
            return {
                id: item.id || idx,
                no: idx + 1,
                date: item.date || '',
                machine: item.machine || '-',
                operator: 'Shift ' + (item.shift || '-') + ' / Group ' + (item.group || '-').toUpperCase(),
                model: item.model || '-',
                customer: item.customer || '-',
                line: item.line || '-',
                shift: item.shift || extractShift(item.operator || ''),
                group: item.group || extractGroup(item.operator || ''),
                start: item.start || '-',
                oee: item.oee || '0',
                avb: item.avb || '0',
                pfm: item.pfm || '0',
                qly: item.qly || '0',
                acv: item.acv || '0',
                real_cycle: item.avg_cycle || item.real_cycle || '-',
                std_cycle: item.std_cycle || '-',
                good: item.good || '0',
                ng: item.ng || '0',
                run_time: item.run_time || '-',
                down_time: item.down_time || '-',
                setup_time: item.setup_time || '00:00:00',
                stop_time: item.stop_time || '-',
                downtime_logs: item.downtime_logs || [],
                ng_logs: item.ng_logs || [],
                production_history: item.production_history || []
            };
        }

        function normalizeDowntime(item, idx) {
            return {
                id: item.id || idx,
                no: idx + 1,
                date: item.date || '',
                machine: item.machine || '-',
                model: item.model || '-',
                line: item.line || '-',

                time: item.start || item.time || '-',
                period: item.period || (item.durationMs ? msToHMS(item.durationMs) : '-'),

                type: item.type || item.category || '-',
                detail: item.detail || item.reason || '-',

                tech: item.tech || '-',
                job: item.job || '-',
                executor: item.executor || '-',
                solution: item.solution || '-'
            };
        }

        function extractShift(op) {
            var m = (op || '').match(/(\d)/);
            return m ? m[1] : '';
        }

        function extractGroup(op) {
            var m = (op || '').match(/([ABC])/i);
            return m ? m[1].toUpperCase() : '';
        }

        function populateFilterDropdowns() {
            populateSelect('f-customer', unique(oeeData, 'customer'));
            populateSelect('f-machine', unique(oeeData, 'machine'));
            populateSelect('f-line', unique(oeeData, 'line'));
            populateSelect('fd-machine', unique(downtimeData, 'machine'));
            populateSelect('fd-type', unique(downtimeData, 'type'));
            populateSelect('fd-line', unique(downtimeData, 'line'));
        }

        function unique(arr, key) {
            return [...new Set(arr.map(function(d) {
                return d[key];
            }).filter(Boolean))].sort();
        }

        function populateSelect(id, values) {
            var sel = document.getElementById(id);
            if (!sel) return;
            while (sel.options.length > 1) sel.remove(1);
            values.forEach(function(v) {
                var o = document.createElement('option');
                o.value = v;
                o.textContent = v;
                sel.appendChild(o);
            });
        }

        function applyFilters() {
            currentPage = 1;
            if (currentTab === 'oee') {
                var fShift = document.getElementById('f-shift').value;
                var fGroup = document.getElementById('f-group').value;
                var fCust = document.getElementById('f-customer').value.toLowerCase();
                var fMach = document.getElementById('f-machine').value.toLowerCase();
                var fLine = document.getElementById('f-line').value.toLowerCase();
                var fFrom = document.getElementById('f-from').value;
                var fTo = document.getElementById('f-to').value;
                var fSearch = document.getElementById('f-search').value.toLowerCase();

                filteredOee = oeeData.filter(function(d) {
                    if (fShift && d.shift !== fShift) return false;
                    if (fGroup && d.group.toUpperCase() !== fGroup) return false;
                    if (fCust && d.customer.toLowerCase() !== fCust) return false;
                    if (fMach && d.machine.toLowerCase() !== fMach) return false;
                    if (fLine && d.line.toLowerCase() !== fLine) return false;
                    if (fSearch && !d.model.toLowerCase().includes(fSearch)) return false;
                    if (fFrom && d.date && d.date < fFrom) return false;
                    if (fTo && d.date && d.date > fTo) return false;
                    return true;
                });
                renderOeeTable();
            } else {
                var fdMach = document.getElementById('fd-machine').value.toLowerCase();
                var fdType = document.getElementById('fd-type').value.toLowerCase();
                var fdLine = document.getElementById('fd-line').value.toLowerCase();
                var fdFrom = document.getElementById('fd-from').value;
                var fdTo = document.getElementById('fd-to').value;
                var fdSearch = document.getElementById('fd-search').value.toLowerCase();

                filteredDowntime = downtimeData.filter(function(d) {
                    if (fdMach && d.machine.toLowerCase() !== fdMach) return false;
                    if (fdType && d.type.toLowerCase() !== fdType) return false;
                    if (fdLine && d.line.toLowerCase() !== fdLine) return false;
                    if (fdSearch && !d.detail.toLowerCase().includes(fdSearch)) return false;
                    if (fdFrom && d.date && d.date < fdFrom) return false;
                    if (fdTo && d.date && d.date > fdTo) return false;
                    return true;
                });
                renderDowntimeTable();
            }
        }

        function renderOeeTable() {
            var tbody = document.getElementById('tbody-oee');
            var start = (currentPage - 1) * pageSize;
            var page = filteredOee.slice(start, start + pageSize);

            if (filteredOee.length === 0) {
                tbody.innerHTML = '<tr><td colspan="22" class="no-data">No Data Available</td></tr>';
                renderPagination(0);
                return;
            }

            var html = '';
            page.forEach(function(d, i) {
                var globalIdx = start + i;
                var oeeVal = parseFloat(d.oee) || 0;
                var oeePct = (oeeVal > 100 ? (oeeVal / 10000 * 100) : oeeVal).toFixed(1);
                var oeeClass = oeeVal >= 85 ? 'cell-green' : oeeVal >= 60 ? 'cell-amber' : 'cell-red';
                var rowClass = globalIdx % 2 === 0 ? '' : 'row-alt';

                html += '<tr class="' + rowClass + '">';
                html += '<td class="cell-no">' + (globalIdx + 1) + '</td>';
                html += '<td>' + (d.date || '-') + '</td>';
                html += '<td class="cell-bold">' + (d.line || '-') + '</td>';
                html += '<td class="cell-bold">' + (d.machine || '-') + '</td>';
                html += '<td>' + (d.operator || '-') + '</td>';
                html += '<td>' + (d.model || '-') + '</td>';
                html += '<td><span class="badge-cust">' + (d.customer || '-') + '</span></td>';
                html += '<td>' + (d.start || '-') + '</td>';
                html += '<td class="' + oeeClass + ' cell-bold">' + oeePct + '%</td>';
                html += '<td>' + fmtPct(d.avb) + '</td>';
                html += '<td>' + fmtPct(d.pfm) + '</td>';
                html += '<td>' + fmtPct(d.qly) + '</td>';
                html += '<td>' + (d.acv || '-') + '</td>';
                html += '<td>' + (d.real_cycle || '-') + '</td>';
                html += '<td>' + (d.std_cycle || '-') + '</td>';
                html += '<td class="cell-good">' + (d.good || '0') + '</td>';
                html += '<td class="cell-ng">' + (d.ng || '0') + '</td>';
                html += '<td>' + (d.run_time || '-') + '</td>';
                html += '<td>' + (d.down_time || '-') + '</td>';
                html += '<td>' + (d.setup_time || '-') + '</td>';
                html += '<td>' + (d.stop_time || '-') + '</td>';
                html += '<td class="action-cell">';
                html += '<button class="btn-action btn-download" onclick="downloadOeeRow(' + globalIdx +
                    ')" title="Download">⬇</button>';
                html += '<button class="btn-action btn-edit" onclick="editOee(' + globalIdx +
                    ')" title="Edit">✎</button>';
                html += '<button class="btn-action btn-delete" onclick="deleteOee(' + globalIdx +
                    ')" title="Delete">✖</button>';
                html += '</td>';
                html += '</tr>';
            });

            tbody.innerHTML = html;
            renderPagination(filteredOee.length);
        }

        function renderDowntimeTable() {
            var tbody = document.getElementById('tbody-downtime');
            var start = (currentPage - 1) * pageSize;
            var page = filteredDowntime.slice(start, start + pageSize);

            if (filteredDowntime.length === 0) {
                tbody.innerHTML = '<tr><td colspan="14" class="no-data">No Data Available</td></tr>';
                renderPagination(0);
                return;
            }

            var html = '';
            page.forEach(function(d, i) {
                var globalIdx = start + i;
                var rowClass = globalIdx % 2 === 0 ? '' : 'row-alt';
                var typeUp = (d.type || '').toUpperCase();
                var typeClass = typeUp === 'DOWN' || typeUp === 'BREAKDOWN' ? 'badge-red' :
                    typeUp === 'LOST' ? 'badge-amber' : 'badge-blue';

                html += '<tr class="' + rowClass + '">';
                html += '<td class="cell-no">' + (globalIdx + 1) + '</td>';
                html += '<td>' + (d.date || '-') + '</td>';
                html += '<td class="cell-bold">' + (d.line || '-') + '</td>';
                html += '<td class="cell-bold">' + (d.machine || '-') + '</td>';
                html += '<td>' + (d.model || '-') + '</td>';
                html += '<td><span class="badge ' + typeClass + '">' + (d.type || '-') + '</span></td>';
                html += '<td>' + (d.detail || '-') + '</td>';
                html += '<td>' + (d.time || '-') + '</td>';
                html += '<td class="cell-bold">' + (d.period || '-') + '</td>';
                html += '<td>' + (d.tech || '-') + '</td>';
                html += '<td>' + (d.job || '-') + '</td>';
                html += '<td>' + (d.executor || '-') + '</td>';
                html += '<td>' + (d.solution || '-') + '</td>';
                html += '<td class="action-cell">';
                html += '<button class="btn-action btn-edit"   onclick="editDowntime(' + globalIdx +
                    ')" title="Edit">✎</button>';
                html += '<button class="btn-action btn-delete" onclick="deleteDowntime(' + globalIdx +
                    ')" title="Delete">✖</button>';
                html += '</td>';
                html += '</tr>';
            });

            tbody.innerHTML = html;
            renderPagination(filteredDowntime.length);
        }

        async function downloadOeeRow(idx) {
            var d = filteredOee[idx];
            if (!d) return;

            var borderThin = {
                top: {
                    style: 'thin'
                },
                left: {
                    style: 'thin'
                },
                bottom: {
                    style: 'thin'
                },
                right: {
                    style: 'thin'
                }
            };
            var grayFill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                    argb: 'FFD3D3D3'
                }
            };
            var alignCenter = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true
            };
            var alignLeft = {
                horizontal: 'left',
                vertical: 'middle'
            };
            var fontTitle = {
                name: 'Arial',
                size: 14,
                bold: true,
                underline: true
            };
            var fontGroup = {
                name: 'Arial',
                size: 10,
                bold: true
            };
            var fontPart = {
                name: 'Arial',
                size: 9,
                bold: true
            };
            var fontIsi = {
                name: 'Arial',
                size: 9,
                bold: false
            };
            var fmtTitikDua = '@*":"';

            var normalizeTime = function(v) {
                if (!v) return '-';
                var s = String(v).trim();
                return s.includes(' ') ? s.split(' ').pop() : s;
            };

            var formatTimeFromMs = function(ms) {
                if (!ms || isNaN(ms)) return '00:00:00';
                var tSec = Math.floor(ms / 1000);
                var h = Math.floor(tSec / 3600);
                var m = Math.floor((tSec % 3600) / 60);
                var s = tSec % 60;
                return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2,
                    '0');
            };

            var pct = function(v) {
                if (v === null || v === undefined || v === '') return '0%';
                var s = String(v).trim();
                return s.includes('%') ? s : (parseFloat(s) || 0).toFixed(1) + '%';
            };

            var workbook = new ExcelJS.Workbook();
            var worksheet = workbook.addWorksheet('OEE Report');
            worksheet.columns = [{
                    width: 3.8
                }, {
                    width: 13.8
                }, {
                    width: 13.8
                }, {
                    width: 13.8
                },
                {
                    width: 13.8
                }, {
                    width: 13.8
                }, {
                    width: 13.8
                }, {
                    width: 13.8
                }
            ];

            var currRow = 1;

            worksheet.mergeCells('A' + currRow + ':H' + currRow);
            var titleCell = worksheet.getCell('A' + currRow);
            titleCell.value = 'OEE DIGITAL REPORT';
            titleCell.font = fontTitle;
            titleCell.alignment = alignCenter;

            currRow += 1;
            worksheet.getRow(currRow).values = [];

            currRow += 1;
            var cb = worksheet.getCell('B' + currRow);
            cb.value = 'DATE';
            cb.font = fontGroup;
            cb.numFormat = fmtTitikDua;
            cb.alignment = alignLeft;
            worksheet.mergeCells('C' + currRow + ':D' + currRow);
            worksheet.getCell('C' + currRow).value = d.date || '-';
            worksheet.getCell('C' + currRow).alignment = alignCenter;
            worksheet.getCell('C' + currRow).border = {
                bottom: {
                    style: 'thin'
                }
            };
            var cf = worksheet.getCell('F' + currRow);
            cf.value = 'LINE';
            cf.font = fontGroup;
            cf.numFormat = fmtTitikDua;
            cf.alignment = alignLeft;
            worksheet.mergeCells('G' + currRow + ':H' + currRow);
            worksheet.getCell('G' + currRow).value = d.line || '-';
            worksheet.getCell('G' + currRow).alignment = alignCenter;
            worksheet.getCell('G' + currRow).border = {
                bottom: {
                    style: 'thin'
                }
            };

            currRow += 1;
            var cc = worksheet.getCell('B' + currRow);
            cc.value = 'CUSTOMER';
            cc.font = fontGroup;
            cc.numFormat = fmtTitikDua;
            cc.alignment = alignLeft;
            worksheet.mergeCells('C' + currRow + ':D' + currRow);
            worksheet.getCell('C' + currRow).value = d.customer || '-';
            worksheet.getCell('C' + currRow).alignment = alignCenter;
            worksheet.getCell('C' + currRow).border = {
                bottom: {
                    style: 'thin'
                }
            };
            var cs = worksheet.getCell('F' + currRow);
            cs.value = 'SHIFT/GROUP';
            cs.font = fontGroup;
            cs.numFormat = fmtTitikDua;
            cs.alignment = alignLeft;
            worksheet.mergeCells('G' + currRow + ':H' + currRow);
            worksheet.getCell('G' + currRow).value = (d.shift || '-') + '/' + (d.group || '-');
            worksheet.getCell('G' + currRow).alignment = alignCenter;
            worksheet.getCell('G' + currRow).border = {
                bottom: {
                    style: 'thin'
                }
            };

            currRow += 2;
            worksheet.mergeCells('A' + currRow + ':H' + currRow);
            var sOee = worksheet.getCell('A' + currRow);
            sOee.value = 'OEE';
            sOee.fill = grayFill;
            sOee.font = fontGroup;
            sOee.alignment = alignCenter;
            sOee.border = borderThin;

            currRow += 1;
            worksheet.mergeCells('A' + currRow + ':B' + currRow);
            worksheet.getCell('A' + currRow).value = 'OEE';
            worksheet.getCell('C' + currRow).value = 'QUALITY';
            worksheet.getCell('D' + currRow).value = 'PERFORMANCE';
            worksheet.getCell('E' + currRow).value = 'AVAILABILITY';
            worksheet.getCell('F' + currRow).value = 'EFFICIENCY';
            worksheet.mergeCells('G' + currRow + ':H' + currRow);
            worksheet.getCell('G' + currRow).value = 'ACHIEVEMENT';
            ['A', 'C', 'D', 'E', 'F', 'G'].forEach(function(col) {
                var c = worksheet.getCell(col + currRow);
                c.font = fontPart;
                c.alignment = alignCenter;
                c.border = borderThin;
            });

            currRow += 1;
            worksheet.mergeCells('A' + currRow + ':B' + currRow);
            worksheet.getCell('A' + currRow).value = pct(d.oee);
            worksheet.getCell('C' + currRow).value = pct(d.qly);
            worksheet.getCell('D' + currRow).value = pct(d.pfm);
            worksheet.getCell('E' + currRow).value = pct(d.avb);
            worksheet.getCell('F' + currRow).value = pct(d.efc || d.efficiency || 0);
            worksheet.mergeCells('G' + currRow + ':H' + currRow);
            worksheet.getCell('G' + currRow).value = pct(d.acv);
            for (var col = 1; col <= 8; col++) {
                var cell = worksheet.getRow(currRow).getCell(col);
                cell.font = {
                    name: 'Arial',
                    size: 9
                };
                cell.alignment = alignCenter;
                cell.border = borderThin;
            }
            currRow += 1;

            currRow += 1;
            worksheet.mergeCells('A' + currRow + ':H' + currRow);
            var sT = worksheet.getCell('A' + currRow);
            sT.value = 'TIME';
            sT.fill = grayFill;
            sT.font = fontGroup;
            sT.alignment = alignCenter;
            sT.border = borderThin;

            currRow += 1;
            worksheet.getCell('A' + currRow).value = 'NO.';
            worksheet.mergeCells('B' + currRow + ':C' + currRow);
            worksheet.getCell('B' + currRow).value = 'FULL TIME';
            worksheet.mergeCells('D' + currRow + ':E' + currRow);
            worksheet.getCell('D' + currRow).value = 'RUNTIME';
            worksheet.mergeCells('F' + currRow + ':H' + currRow);
            worksheet.getCell('F' + currRow).value = 'DOWNTIME';
            ['A' + currRow, 'B' + currRow, 'D' + currRow, 'F' + currRow].forEach(function(pos) {
                var c = worksheet.getCell(pos);
                c.font = fontPart;
                c.border = borderThin;
                c.alignment = alignCenter;
            });

            var ph = (d.production_history && d.production_history.length > 0) ?
                d.production_history : [{
                    model_fulltime: normalizeTime(d.start),
                    model_runtime: d.run_time || '-',
                    model_downtime: d.down_time || '-'
                }];

            ph.forEach(function(hItem, idx2) {
                currRow += 1;
                worksheet.getCell('A' + currRow).value = (idx2 + 1) + '.';
                worksheet.mergeCells('B' + currRow + ':C' + currRow);
                worksheet.getCell('B' + currRow).value = normalizeTime(hItem.model_fulltime);
                worksheet.mergeCells('D' + currRow + ':E' + currRow);
                worksheet.getCell('D' + currRow).value = normalizeTime(hItem.model_runtime);
                worksheet.mergeCells('F' + currRow + ':H' + currRow);
                worksheet.getCell('F' + currRow).value = normalizeTime(hItem.model_downtime);
                for (var col = 1; col <= 8; col++) {
                    var cell = worksheet.getRow(currRow).getCell(col);
                    cell.border = borderThin;
                    cell.font = fontIsi;
                    cell.alignment = alignCenter;
                }
            });

            currRow += 2;
            worksheet.mergeCells('A' + currRow + ':H' + currRow);
            var sDt = worksheet.getCell('A' + currRow);
            sDt.value = 'DOWNTIME INFORMATION SHEET';
            sDt.fill = grayFill;
            sDt.font = fontGroup;
            sDt.alignment = alignCenter;
            sDt.border = borderThin;

            currRow += 1;
            worksheet.getCell('A' + currRow).value = 'NO.';
            worksheet.getCell('B' + currRow).value = 'START';
            worksheet.getCell('C' + currRow).value = 'STOP';
            worksheet.getCell('D' + currRow).value = 'TOTAL';
            worksheet.mergeCells('E' + currRow + ':H' + currRow);
            worksheet.getCell('E' + currRow).value = 'REMARKS / REASON';
            ['A' + currRow, 'B' + currRow, 'C' + currRow, 'D' + currRow, 'E' + currRow].forEach(function(pos) {
                var c = worksheet.getCell(pos);
                c.font = fontPart;
                c.border = borderThin;
                c.alignment = alignCenter;
            });

            var dtLogs = (d.downtime_logs && d.downtime_logs.length > 0) ? d.downtime_logs : [null];
            dtLogs.forEach(function(dataLog, idx2) {
                currRow += 1;
                worksheet.getCell('A' + currRow).value = (idx2 + 1) + '.';
                if (dataLog) {
                    worksheet.getCell('B' + currRow).value = normalizeTime(dataLog.start);
                    worksheet.getCell('C' + currRow).value = normalizeTime(dataLog.stop);
                    worksheet.getCell('D' + currRow).value = dataLog.total || '00:00:00';
                    worksheet.mergeCells('E' + currRow + ':H' + currRow);
                    worksheet.getCell('E' + currRow).value = dataLog.detail || '-';
                } else {
                    worksheet.getCell('B' + currRow).value = '-';
                    worksheet.getCell('C' + currRow).value = '-';
                    worksheet.getCell('D' + currRow).value = '00:00:00';
                    worksheet.mergeCells('E' + currRow + ':H' + currRow);
                    worksheet.getCell('E' + currRow).value = '-';
                }
                for (var col = 1; col <= 8; col++) {
                    var cell = worksheet.getRow(currRow).getCell(col);
                    cell.border = borderThin;
                    cell.font = fontIsi;
                    cell.alignment = alignCenter;
                }
            });

            currRow += 2;
            worksheet.mergeCells('A' + currRow + ':H' + currRow);
            var sQty = worksheet.getCell('A' + currRow);
            sQty.value = 'QTY';
            sQty.fill = grayFill;
            sQty.font = fontGroup;
            sQty.alignment = alignCenter;
            sQty.border = borderThin;

            currRow += 1;
            var qtyHdrs = ['NO.', 'TARGET', 'UPH', 'IDEAL', 'GOOD', 'NOGOOD'];
            qtyHdrs.forEach(function(h, i) {
                var c = worksheet.getRow(currRow).getCell(i + 1);
                c.value = h;
                c.font = fontPart;
                c.border = borderThin;
                c.alignment = alignCenter;
            });
            worksheet.mergeCells('G' + currRow + ':H' + currRow);
            worksheet.getCell('G' + currRow).value = 'TOTAL QTY';
            worksheet.getCell('G' + currRow).font = fontPart;
            worksheet.getCell('G' + currRow).border = borderThin;
            worksheet.getCell('G' + currRow).alignment = alignCenter;

            var qtyPh = (d.production_history && d.production_history.length > 0) ? d.production_history : [null];
            qtyPh.forEach(function(qItem, idx2) {
                currRow += 1;
                worksheet.getCell('A' + currRow).value = (idx2 + 1) + '.';
                if (qItem) {
                    worksheet.getCell('B' + currRow).value = Number(qItem.target) || Number(d.target) || 0;
                    worksheet.getCell('C' + currRow).value = Number(qItem.uph) || Number(d.uph) || 0;
                    worksheet.getCell('D' + currRow).value = Number(qItem.ideal) || Number(d.ideal) || 0;
                    worksheet.getCell('E' + currRow).value = Number(qItem.good) || 0;
                    worksheet.getCell('F' + currRow).value = Number(qItem.nogood) || 0;
                    worksheet.mergeCells('G' + currRow + ':H' + currRow);
                    worksheet.getCell('G' + currRow).value = Number(qItem.total_qty) || (Number(qItem.good ||
                        0) + Number(qItem.nogood || 0)) || 0;
                } else {
                    worksheet.getCell('B' + currRow).value = Number(d.target) || 0;
                    worksheet.getCell('C' + currRow).value = Number(d.uph) || 0;
                    worksheet.getCell('D' + currRow).value = Number(d.ideal) || 0;
                    worksheet.getCell('E' + currRow).value = Number(d.good) || 0;
                    worksheet.getCell('F' + currRow).value = Number(d.ng) || 0;
                    worksheet.mergeCells('G' + currRow + ':H' + currRow);
                    worksheet.getCell('G' + currRow).value = (Number(d.good) || 0) + (Number(d.ng) || 0);
                }
                for (var col = 1; col <= 8; col++) {
                    var cell = worksheet.getRow(currRow).getCell(col);
                    cell.border = borderThin;
                    cell.font = fontIsi;
                    cell.alignment = alignCenter;
                }
            });

            currRow += 2;
            worksheet.mergeCells('A' + currRow + ':H' + currRow);
            var sQis = worksheet.getCell('A' + currRow);
            sQis.value = 'QUALITY INFORMATION SHEET';
            sQis.fill = grayFill;
            sQis.font = fontGroup;
            sQis.alignment = alignCenter;
            sQis.border = borderThin;

            currRow += 1;
            worksheet.getCell('A' + currRow).value = 'NO.';
            worksheet.mergeCells('B' + currRow + ':C' + currRow);
            worksheet.getCell('B' + currRow).value = 'NG ITEM';
            worksheet.getCell('D' + currRow).value = 'LOC';
            worksheet.getCell('E' + currRow).value = 'QTY';
            worksheet.mergeCells('F' + currRow + ':H' + currRow);
            worksheet.getCell('F' + currRow).value = 'REMARKS';
            ['A' + currRow, 'B' + currRow, 'D' + currRow, 'E' + currRow, 'F' + currRow].forEach(function(pos) {
                var c = worksheet.getCell(pos);
                c.font = fontPart;
                c.border = borderThin;
                c.alignment = alignCenter;
            });

            var ngLogs = d.ng_logs || [];
            var groupNG = {};
            ngLogs.forEach(function(l) {
                var key = l.reason || '-';
                if (!groupNG[key]) groupNG[key] = {
                    reason: key,
                    qty: 0
                };
                groupNG[key].qty++;
            });
            var ngRows = Object.values(groupNG).length > 0 ? Object.values(groupNG) : [null];

            ngRows.forEach(function(dataNG, idx2) {
                currRow += 1;
                worksheet.getCell('A' + currRow).value = (idx2 + 1) + '.';
                worksheet.mergeCells('B' + currRow + ':C' + currRow);
                worksheet.getCell('B' + currRow).value = dataNG ? dataNG.reason : '-';
                worksheet.getCell('D' + currRow).value = '-';
                worksheet.getCell('E' + currRow).value = dataNG ? dataNG.qty : 0;
                worksheet.mergeCells('F' + currRow + ':H' + currRow);
                worksheet.getCell('F' + currRow).value = pct(d.efc || d.efficiency || 0);
                for (var col = 1; col <= 8; col++) {
                    var cell = worksheet.getRow(currRow).getCell(col);
                    cell.border = borderThin;
                    cell.font = fontIsi;
                    cell.alignment = alignCenter;
                }
            });

            currRow += 2;
            worksheet.mergeCells('A' + currRow + ':C' + currRow);
            var sOpList = worksheet.getCell('A' + currRow);
            sOpList.value = 'OPERATOR LIST';
            sOpList.fill = grayFill;
            sOpList.font = fontGroup;
            sOpList.alignment = alignCenter;
            sOpList.border = borderThin;
            worksheet.mergeCells('D' + currRow + ':H' + currRow);
            var sOutModel = worksheet.getCell('D' + currRow);
            sOutModel.value = 'OUTPUT MODEL';
            sOutModel.fill = grayFill;
            sOutModel.font = fontGroup;
            sOutModel.alignment = alignCenter;
            sOutModel.border = borderThin;

            currRow += 1;
            worksheet.getCell('A' + currRow).value = 'NO.';
            worksheet.getCell('B' + currRow).value = 'PROCESS';
            worksheet.getCell('C' + currRow).value = 'NAME';
            worksheet.mergeCells('D' + currRow + ':E' + currRow);
            worksheet.getCell('D' + currRow).value = 'MODEL';
            worksheet.getCell('F' + currRow).value = 'START';
            worksheet.getCell('G' + currRow).value = 'END';
            worksheet.getCell('H' + currRow).value = 'OUTPUT';
            ['A' + currRow, 'B' + currRow, 'C' + currRow, 'D' + currRow, 'F' + currRow, 'G' + currRow, 'H' + currRow]
            .forEach(function(pos) {
                var c = worksheet.getCell(pos);
                c.font = fontPart;
                c.border = borderThin;
                c.alignment = alignCenter;
            });

            var opPh = (d.production_history && d.production_history.length > 0) ? d.production_history : [null];
            opPh.forEach(function(opItem, idx2) {
                currRow += 1;
                worksheet.getCell('A' + currRow).value = (idx2 + 1) + '.';
                worksheet.getCell('B' + currRow).value = '-';
                worksheet.getCell('C' + currRow).value = '-';
                worksheet.mergeCells('D' + currRow + ':E' + currRow);
                worksheet.getCell('D' + currRow).value = opItem ? (opItem.model_name || d.model || '-') : (d
                    .model || '-');
                worksheet.getCell('F' + currRow).value = normalizeTime(opItem ? opItem.model_start : d.start);
                worksheet.getCell('G' + currRow).value = normalizeTime(opItem ? opItem.model_end : d.stop_time);
                worksheet.getCell('H' + currRow).value = opItem ? (Number(opItem.good) || 0) : (Number(d
                    .good) || 0);
                for (var col = 1; col <= 8; col++) {
                    var cell = worksheet.getRow(currRow).getCell(col);
                    cell.border = borderThin;
                    cell.font = fontIsi;
                    cell.alignment = alignCenter;
                }
            });

            currRow += 2;
            var signStart = currRow;
            [{
                    titles: ['ISSUED', 'SOP'],
                    col: 'F'
                },
                {
                    titles: ['CHECKED', 'LEADER'],
                    col: 'G'
                },
                {
                    titles: ['APPROVED', 'SPV'],
                    col: 'H'
                }
            ].forEach(function(s) {
                var c1 = worksheet.getCell(s.col + currRow);
                c1.value = s.titles[0];
                c1.font = fontGroup;
                c1.alignment = alignCenter;
                c1.border = borderThin;
                var c2 = worksheet.getCell(s.col + (currRow + 4));
                c2.value = s.titles[1];
                c2.font = fontGroup;
                c2.alignment = alignCenter;
                c2.border = borderThin;
                worksheet.mergeCells(s.col + (currRow + 1) + ':' + s.col + (currRow + 3));
                for (var i = 1; i <= 3; i++) worksheet.getCell(s.col + (currRow + i)).border = borderThin;
            });

            worksheet.getRow(1).height = 22;

            var shiftName = d.shift || 'UNK-SHIFT';
            var groupName = d.group || 'UNK-GROUP';
            var modelName = d.model || 'UNK-TYPE';
            var dd2 = d.date ? d.date.split('-') : [];
            var tgl = dd2.length === 3 ? dd2[2] + '-' + dd2[1] + '-' + dd2[0] : (new Date()).toISOString().slice(0, 10);
            var fileName = 'OEE - ' + tgl + ' - ' + shiftName + ' - ' + groupName + ' - ' + modelName + '.xlsx';

            var buffer = await workbook.xlsx.writeBuffer();
            var xlsxBlob = new Blob([buffer]);

            function _buildOeeRowPdf(d) {
                var {
                    jsPDF
                } = window.jspdf;
                var doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'pt',
                    format: 'a4'
                });
                var pct = function(v) {
                    if (v === null || v === undefined || v === '') return '0%';
                    var s = String(v).trim();
                    return s.includes('%') ? s : (parseFloat(s) || 0).toFixed(1) + '%';
                };
                var normTime = function(v) {
                    if (!v) return '-';
                    var s = String(v).trim();
                    return s.includes(' ') ? s.split(' ').pop() : s;
                };

                var W = 595,
                    ml = 28,
                    cw = W - ml - 28;
                var c = cw / 8;
                var y = 28,
                    lh = 15,
                    gap = 5;
                var gray = [211, 211, 211],
                    white = [255, 255, 255];

                function rect(x, yy, w, h, fill) {
                    if (fill) {
                        doc.setFillColor(fill[0], fill[1], fill[2]);
                        doc.rect(x, yy, w, h, 'FD');
                    } else {
                        doc.setFillColor(255, 255, 255);
                        doc.rect(x, yy, w, h, 'FD');
                    }
                    doc.setDrawColor(160, 160, 160);
                    doc.setLineWidth(0.3);
                }

                function noFillRect(x, yy, w, h) {
                    doc.setDrawColor(160, 160, 160);
                    doc.setLineWidth(0.3);
                    doc.rect(x, yy, w, h, 'S');
                }

                function ct(txt, x, yy, w, h, opts) {
                    opts = opts || {};
                    doc.setFontSize(opts.size || 8);
                    doc.setTextColor(opts.color ? opts.color[0] : 0, opts.color ? opts.color[1] : 0, opts.color ? opts
                        .color[2] : 0);
                    doc.setFont(undefined, opts.bold ? 'bold' : 'normal');
                    var lines = doc.splitTextToSize(String(txt || '-'), w - 2);
                    doc.text(lines[0], x + w / 2, yy + h / 2, {
                        align: 'center',
                        baseline: 'middle'
                    });
                }

                function lt(txt, x, yy, opts) {
                    opts = opts || {};
                    doc.setFontSize(opts.size || 8);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, opts.bold ? 'bold' : 'normal');
                    doc.text(String(txt || ''), x, yy, {
                        baseline: 'middle'
                    });
                }

                function sectionHdr(label, yy) {
                    rect(ml, yy, cw, lh, gray);
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(0, 0, 0);
                    doc.text(label, ml + cw / 2, yy + lh / 2, {
                        align: 'center',
                        baseline: 'middle'
                    });
                    return yy + lh;
                }

                function hdrRow(cols, yy) {
                    var x = ml;
                    cols.forEach(function(cl) {
                        rect(x, yy, cl.w, lh, white);
                        ct(cl.l, x, yy, cl.w, lh, {
                            bold: true,
                            size: 7
                        });
                        x += cl.w;
                    });
                    return yy + lh;
                }

                function dataRow(cols, vals, yy) {
                    var x = ml;
                    cols.forEach(function(cl, i) {
                        rect(x, yy, cl.w, lh);
                        ct(vals[i], x, yy, cl.w, lh, {
                            size: 8
                        });
                        x += cl.w;
                    });
                    return yy + lh;
                }

                function formatTimeFromMs(ms) {
                    if (!ms || isNaN(ms)) return '00:00:00';
                    var tSec = Math.floor(ms / 1000);
                    var h = Math.floor(tSec / 3600);
                    var m = Math.floor((tSec % 3600) / 60);
                    var s = tSec % 60;
                    return String(h).padStart(2, '0') + ':' +
                        String(m).padStart(2, '0') + ':' +
                        String(s).padStart(2, '0');
                }

                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('OEE DIGITAL REPORT', ml + cw / 2, y + lh / 2, {
                    align: 'center',
                    baseline: 'middle'
                });
                y += lh + 4;

                y += 6;

                lt('DATE :', ml + c + 2, y + lh / 2, {
                    bold: true
                });
                doc.line(ml + c * 2, y + lh, ml + c * 4, y + lh);
                ct(d.date || '-', ml + c * 2, y, c * 2, lh, {
                    size: 8
                });

                lt('LINE :', ml + c * 5 + 2, y + lh / 2, {
                    bold: true
                });
                doc.line(ml + c * 6, y + lh, ml + c * 8, y + lh);
                ct(d.line || '-', ml + c * 6, y, c * 2, lh, {
                    size: 8
                });

                y += lh + 2;

                lt('CUSTOMER :', ml + c + 2, y + lh / 2, {
                    bold: true
                });
                doc.line(ml + c * 2, y + lh, ml + c * 4, y + lh);
                ct(d.customer || '-', ml + c * 2, y, c * 2, lh, {
                    size: 8
                });

                lt('SHIFT/GROUP :', ml + c * 5 + 2, y + lh / 2, {
                    bold: true
                });
                doc.line(ml + c * 6, y + lh, ml + c * 8, y + lh);
                ct((d.shift || '-') + '/' + (d.group || '-'), ml + c * 6, y, c * 2, lh, {
                    size: 8
                });

                y += lh + gap + 2;

                y = sectionHdr('OEE', y);
                var oeeCols = [{
                    l: 'OEE',
                    w: c * 2
                }, {
                    l: 'QUALITY',
                    w: c
                }, {
                    l: 'PERFORMANCE',
                    w: c
                }, {
                    l: 'AVAILABILITY',
                    w: c
                }, {
                    l: 'EFFICIENCY',
                    w: c
                }, {
                    l: 'ACHIEVEMENT',
                    w: c * 2
                }];
                y = hdrRow(oeeCols, y);
                y = dataRow(oeeCols, [pct(d.oee), pct(d.qly), pct(d.pfm), pct(d.avb), pct(d.efc || d.efficiency || 0),
                    pct(d.acv)
                ], y);
                y += gap;

                y = sectionHdr('TIME', y);
                var timeCols = [{
                    l: 'NO.',
                    w: c
                }, {
                    l: 'FULL TIME',
                    w: c * 2
                }, {
                    l: 'RUNTIME',
                    w: c * 2
                }, {
                    l: 'DOWNTIME',
                    w: c * 3
                }];
                y = hdrRow(timeCols, y);
                var ph = (d.production_history && d.production_history.length > 0) ? d.production_history : [{
                    model_fulltime: normTime(d.start),
                    model_runtime: d.run_time || '-',
                    model_downtime: d.down_time || '-'
                }];
                ph.forEach(function(h, i) {
                    y = dataRow(timeCols, [i + 1 + '.', normTime(h.model_fulltime), normTime(h.model_runtime),
                        normTime(h.model_downtime)
                    ], y);
                });
                y += gap;

                y = sectionHdr('DOWNTIME INFORMATION SHEET', y);
                var dtCols = [{
                    l: 'NO.',
                    w: c
                }, {
                    l: 'START',
                    w: c
                }, {
                    l: 'STOP',
                    w: c
                }, {
                    l: 'TOTAL',
                    w: c
                }, {
                    l: 'REMARKS / REASON',
                    w: c * 4
                }];
                y = hdrRow(dtCols, y);
                var dtLogs = downtimeData.filter(function(dt) {
                    return String(dt.line || '') === String(d.line || '') &&
                        String(dt.model || '') === String(d.model || '') &&
                        new Date(dt.start).getTime() >= new Date(d.start).getTime();
                });
                dtLogs.forEach(function(lg, i) {
                    y = dataRow(dtCols, [
                        i + 1 + '.', lg ? normTime(lg.start) : '-', lg ? normTime(lg.stop) : '-', lg ? (
                            lg.total || '00:00:00') : '00:00:00', lg ? (lg.detail || '-') : '-'
                    ], y);
                });
                y += gap;

                y = sectionHdr('QTY', y);
                var qtyCols = [{
                    l: 'NO.',
                    w: c
                }, {
                    l: 'TARGET',
                    w: c
                }, {
                    l: 'UPH',
                    w: c
                }, {
                    l: 'IDEAL',
                    w: c
                }, {
                    l: 'GOOD',
                    w: c
                }, {
                    l: 'NOGOOD',
                    w: c
                }, {
                    l: 'TOTAL QTY',
                    w: c * 2
                }];
                y = hdrRow(qtyCols, y);
                var qPh = (d.production_history && d.production_history.length > 0) ? d.production_history : [null];
                qPh.forEach(function(q, i) {
                    var good = q ? Number(q.good || 0) : Number(d.good || 0),
                        ng = q ? Number(q.nogood || 0) : Number(d.ng || 0);
                    y = dataRow(qtyCols, [i + 1 + '.', q ? Number(q.target || 0) : Number(d.target || 0), q ?
                        Number(q.uph || 0) : Number(d.uph || 0), q ? Number(q.ideal || 0) : Number(d
                            .ideal || 0), good, ng, good + ng
                    ], y);
                });
                y += gap;

                y = sectionHdr('QUALITY INFORMATION SHEET', y);
                var qiCols = [{
                    l: 'NO.',
                    w: c
                }, {
                    l: 'NG ITEM',
                    w: c * 2
                }, {
                    l: 'LOC',
                    w: c
                }, {
                    l: 'QTY',
                    w: c
                }, {
                    l: 'REMARKS',
                    w: c * 3
                }];
                y = hdrRow(qiCols, y);
                var ngLogs = d.ng_logs || [];
                var groupNG = {};
                ngLogs.forEach(function(l) {
                    var k = l.reason || '-';
                    if (!groupNG[k]) groupNG[k] = {
                        reason: k,
                        qty: 0
                    };
                    groupNG[k].qty++;
                });
                var ngRows = Object.values(groupNG).length > 0 ? Object.values(groupNG) : [null];
                ngRows.forEach(function(ng, i) {
                    y = dataRow(qiCols, [i + 1 + '.', ng ? ng.reason : '-', '-', ng ? ng.qty : 0, '-'], y);
                });
                y += gap;

                rect(ml, y, c * 3, lh, gray);
                ct('OPERATOR LIST', ml, y, c * 3, lh, {
                    bold: true,
                    size: 8
                });
                rect(ml + c * 3, y, c * 5, lh, gray);
                ct('OUTPUT MODEL', ml + c * 3, y, c * 5, lh, {
                    bold: true,
                    size: 8
                });
                y += lh;
                var opCols = [{
                    l: 'NO.',
                    w: c
                }, {
                    l: 'PROCESS',
                    w: c
                }, {
                    l: 'NAME',
                    w: c
                }, {
                    l: 'MODEL',
                    w: c * 2
                }, {
                    l: 'START',
                    w: c
                }, {
                    l: 'END',
                    w: c
                }, {
                    l: 'OUTPUT',
                    w: c
                }];
                y = hdrRow(opCols, y);
                var opPh = (d.production_history && d.production_history.length > 0) ? d.production_history : [null];
                opPh.forEach(function(op, i) {
                    var model = op ? (op.model_name || d.model || '-') : (d.model || '-');
                    var out = op ? Number(op.good || 0) : Number(d.good || 0);
                    y = dataRow(opCols, [i + 1 + '.', '-', '-', model, normTime(op ? op.model_start : d.start),
                        normTime(op ? op.model_end : d.stop_time), out
                    ], y);
                });
                y += gap + 4;

                var sigW = c;
                var sigH = lh * 3;
                var sigX = ml + c * 5;

                [
                    ['ISSUED', 'SOP'],
                    ['CHECKED', 'LEADER'],
                    ['APPROVED', 'SPV']
                ].forEach(function(s, i) {

                    var sx = sigX + (c * i);

                    rect(sx, y, sigW, lh, gray);
                    ct(s[0], sx, y, sigW, lh, {
                        bold: true,
                        size: 8
                    });
                    rect(sx, y + lh, sigW, sigH);
                    rect(sx, y + lh + sigH, sigW, lh, gray);
                    ct(s[1], sx, y + lh + sigH, sigW, lh, {
                        bold: true,
                        size: 8
                    });
                });

                return doc;
            }

            var docPdf = _buildOeeRowPdf(d);
            var pdfBlob = docPdf.output('blob');
            var pdfUrl = URL.createObjectURL(pdfBlob);
            var overlay = document.createElement('div');
            overlay.style.cssText =
                'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML =
                '<div style="background:#fff;border-radius:10px;width:96vw;height:92vh;max-width:1300px;padding:16px 20px 14px;box-shadow:0 8px 40px rgba(0,0,0,0.4);display:flex;flex-direction:column;gap:10px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">' +
                '<span style="font-size:15px;font-weight:700;color:#1F3864;">Preview — OEE Report: ' + (d.model ||
                    '-') + ' (' + (d.date || '') + ')</span>' +
                '<button id="row-close-x" style="background:none;border:none;font-size:24px;cursor:pointer;color:#555;">✕</button>' +
                '</div>' +
                '<iframe src="' + pdfUrl +
                '" style="flex:1;width:100%;border:1px solid #ccc;border-radius:6px;min-height:0;"></iframe>' +
                '<div style="display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;">' +
                '<button id="row-dl-excel" style="padding:8px 24px;background:#1F7A45;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">⬇ Download Excel</button>' +
                '<button id="row-dl-pdf"   style="padding:8px 24px;background:#c0392b;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">⬇ Download PDF</button>' +
                '<button id="row-close-btn" style="padding:8px 20px;background:#777;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">Tutup</button>' +
                '</div>' +
                '</div>';
            document.body.appendChild(overlay);

            function closeRow() {
                URL.revokeObjectURL(pdfUrl);
                document.body.removeChild(overlay);
            }
            document.getElementById('row-close-x').onclick = closeRow;
            document.getElementById('row-close-btn').onclick = closeRow;
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) closeRow();
            });

            document.getElementById('row-dl-excel').onclick = function() {
                saveAs(xlsxBlob, fileName);
            };

            document.getElementById('row-dl-pdf').onclick = function() {
                var pdfName = fileName.replace('.xlsx', '.pdf');
                docPdf.save(pdfName);
            };
        }

        function editOee(idx) {
            var d = filteredOee[idx];
            if (!d) return;

            var machineList = unique(oeeData, 'machine');
            var machineOpts = machineList.map(function(m) {
                return '<option value="' + m + '"' + (d.machine === m ? ' selected' : '') + '>' + m + '</option>';
            }).join('');
            if (d.machine && machineList.indexOf(d.machine) === -1)
                machineOpts = '<option value="' + d.machine + '" selected>' + d.machine + '</option>' + machineOpts;

            var modelSet = {};
            try {
                modelSet = JSON.parse(localStorage.getItem('type_presets') || '{}');
            } catch (e) {}
            var modelList = Object.keys(modelSet);
            unique(oeeData, 'model').forEach(function(m) {
                if (modelList.indexOf(m) === -1) modelList.push(m);
            });
            modelList.sort();
            var modelOpts = '<option value="">-- Select Model --</option>';
            modelOpts += modelList.map(function(m) {
                return '<option value="' + m + '"' + (d.model === m ? ' selected' : '') + '>' + m + '</option>';
            }).join('');
            if (d.model && modelList.indexOf(d.model) === -1)
                modelOpts += '<option value="' + d.model + '" selected>' + d.model + '</option>';

            var custSet = {};
            Object.values(modelSet).forEach(function(p) {
                if (p.customer) custSet[p.customer] = 1;
            });
            unique(oeeData, 'customer').forEach(function(c) {
                custSet[c] = 1;
            });
            var custList = Object.keys(custSet).sort();
            var custOpts = custList.map(function(c) {
                return '<option value="' + c + '"' + (d.customer === c ? ' selected' : '') + '>' + c + '</option>';
            }).join('');
            if (d.customer && custList.indexOf(d.customer) === -1)
                custOpts = '<option value="' + d.customer + '" selected>' + d.customer + '</option>' + custOpts;

            var curShift = d.shift || '';
            var curGroup = d.group || '';
            var shiftOpts = ['1', '2', '3'].map(function(s) {
                return '<option value="' + s + '"' + (curShift === s ? ' selected' : '') + '>Shift ' + s +
                    '</option>';
            }).join('');
            var groupOpts = ['A', 'B', 'C'].map(function(g) {
                return '<option value="' + g + '"' + (curGroup.toUpperCase() === g ? ' selected' : '') + '>Group ' +
                    g + '</option>';
            }).join('');

            Swal.fire({
                title: 'Edit OEE Data',
                width: '680px',
                allowOutsideClick: false,
                showCancelButton: true,
                confirmButtonText: 'Save',
                html: `<div style="text-align:left;font-size:13px;">
            <div style="display:flex;gap:10px;margin-bottom:4px;">
                <div style="flex:1;">
                    <label class="swal2-label">Machine</label>
                    <select id="eo-machine" class="swal2-input" style="height:38px;padding:0 8px;">${machineOpts}</select>
                </div>
                <div style="flex:1;">
                    <label class="swal2-label">Customer</label>
                    <select id="eo-customer" class="swal2-input" style="height:38px;padding:0 8px;">${custOpts}</select>
                </div>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:4px;">
                <div style="flex:1;">
                    <label class="swal2-label">Model</label>
                    <input id="eo-model" class="swal2-input" value="${d.model || ''}" placeholder="Model">
                </div>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:4px;">
                <div style="flex:1;">
                    <label class="swal2-label">Shift</label>
                    <select id="eo-shift" class="swal2-input" style="height:38px;padding:0 8px;">${shiftOpts}</select>
                </div>
                <div style="flex:1;">
                    <label class="swal2-label">Group</label>
                    <select id="eo-group" class="swal2-input" style="height:38px;padding:0 8px;">${groupOpts}</select>
                </div>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:4px;">
                <div style="flex:1;">
                    <label class="swal2-label">Setup Time (HH:MM:SS)</label>
                    <input id="eo-setup" class="swal2-input" value="${d.setup_time && d.setup_time !== '-' ? d.setup_time : '00:00:00'}" placeholder="00:00:00">
                </div>
            </div>
            <div style="margin-top:6px;">
                <label class="swal2-label">Qty (Total: <span id="eo-total">${(parseInt(d.good)||0)+(parseInt(d.ng)||0)}</span>)</label>
                <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                    <div style="flex:1;text-align:center;">
                        <div style="font-size:11px;color:#888;margin-bottom:2px;">GOOD</div>
                        <div style="display:flex;align-items:center;gap:4px;justify-content:center;">
                            <button type="button" id="eo-good-minus" style="width:32px;height:32px;font-size:18px;border:1px solid #ccc;border-radius:6px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;padding:0;">−</button>
                            <input id="eo-good" class="swal2-input" value="${d.good || '0'}" style="width:80px;text-align:center;font-size:16px;font-weight:bold;color:#22c55e;">
                            <button type="button" id="eo-good-plus" style="width:32px;height:32px;font-size:18px;border:1px solid #ccc;border-radius:6px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;padding:0;">+</button>
                        </div>
                    </div>
                    <div style="font-size:20px;color:#aaa;padding-top:16px;">⇄</div>
                    <div style="flex:1;text-align:center;">
                        <div style="font-size:11px;color:#888;margin-bottom:2px;">NG</div>
                        <div style="display:flex;align-items:center;gap:4px;justify-content:center;">
                            <button type="button" id="eo-ng-minus" style="width:32px;height:32px;font-size:18px;border:1px solid #ccc;border-radius:6px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;padding:0;">−</button>
                            <input id="eo-ng" class="swal2-input" value="${d.ng || '0'}" style="width:80px;text-align:center;font-size:16px;font-weight:bold;color:#ef4444;">
                            <button type="button" id="eo-ng-plus" style="width:32px;height:32px;font-size:18px;border:1px solid #ccc;border-radius:6px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;padding:0;">+</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`,
                didOpen: function() {
                    var goodEl = document.getElementById('eo-good');
                    var ngEl = document.getElementById('eo-ng');
                    var totalEl = document.getElementById('eo-total');
                    var total = parseInt(goodEl.value) + parseInt(ngEl.value);

                    function updateTotal() {
                        var g = Math.max(0, parseInt(goodEl.value) || 0);
                        var n = Math.max(0, parseInt(ngEl.value) || 0);
                        totalEl.textContent = g + n;
                    }

                    document.getElementById('eo-good-plus').onclick = function() {
                        var g = parseInt(goodEl.value) || 0;
                        var n = parseInt(ngEl.value) || 0;
                        if (n > 0) {
                            goodEl.value = g + 1;
                            ngEl.value = n - 1;
                        }
                        updateTotal();
                    };
                    document.getElementById('eo-good-minus').onclick = function() {
                        var g = parseInt(goodEl.value) || 0;
                        var n = parseInt(ngEl.value) || 0;
                        if (g > 0) {
                            goodEl.value = g - 1;
                            ngEl.value = n + 1;
                        }
                        updateTotal();
                    };
                    document.getElementById('eo-ng-plus').onclick = function() {
                        var g = parseInt(goodEl.value) || 0;
                        var n = parseInt(ngEl.value) || 0;
                        if (g > 0) {
                            ngEl.value = n + 1;
                            goodEl.value = g - 1;
                        }
                        updateTotal();
                    };
                    document.getElementById('eo-ng-minus').onclick = function() {
                        var g = parseInt(goodEl.value) || 0;
                        var n = parseInt(ngEl.value) || 0;
                        if (n > 0) {
                            ngEl.value = n - 1;
                            goodEl.value = g + 1;
                        }
                        updateTotal();
                    };
                    goodEl.addEventListener('input', updateTotal);
                    ngEl.addEventListener('input', updateTotal);

                    document.getElementById('eo-model').addEventListener('change', function() {
                        var preset = modelSet[this.value];
                        if (preset && preset.customer) {
                            var custSel = document.getElementById('eo-customer');
                            for (var i = 0; i < custSel.options.length; i++) {
                                if (custSel.options[i].value === preset.customer) {
                                    custSel.selectedIndex = i;
                                    break;
                                }
                            }
                        }
                    });
                },
                preConfirm: function() {
                    var shift = document.getElementById('eo-shift').value;
                    var group = document.getElementById('eo-group').value;
                    var setup = document.getElementById('eo-setup').value.trim();
                    if (!/^\d{1,2}:\d{2}:\d{2}$/.test(setup)) {
                        Swal.showValidationMessage('Format Setup Time harus HH:MM:SS');
                        return false;
                    }
                    return {
                        machine: document.getElementById('eo-machine').value,
                        operator: 'Shift ' + shift + ' / Group ' + group,
                        shift: shift,
                        group: group,
                        model: document.getElementById('eo-model').value,
                        customer: document.getElementById('eo-customer').value,
                        good: document.getElementById('eo-good').value,
                        ng: document.getElementById('eo-ng').value,
                        setup_time: setup
                    };
                }
            }).then(async function(result) {
                if (!result.isConfirmed) return;
                await fetch(API_BASE + '/api/edit-oee?id=' + d.id, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(result.value)
                });
                var origIdx = oeeData.findIndex(function(o) {
                    return o.id === d.id;
                });
                if (origIdx !== -1) {
                    oeeData[origIdx].machine = result.value.machine;
                    oeeData[origIdx].operator = result.value.operator;
                    oeeData[origIdx].shift = result.value.shift;
                    oeeData[origIdx].group = result.value.group;
                    oeeData[origIdx].model = result.value.model;
                    oeeData[origIdx].customer = result.value.customer;
                    oeeData[origIdx].good = result.value.good;
                    oeeData[origIdx].ng = result.value.ng;
                    oeeData[origIdx].setup_time = result.value.setup_time;
                }
                Swal.fire({
                    icon: 'success',
                    title: 'Tersimpan',
                    timer: 800,
                    showConfirmButton: false
                });
                applyFilters();
            });
        }

        function deleteOee(idx) {
            var d = filteredOee[idx];
            if (!d) return;
            Swal.fire({
                title: 'Delete this data?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete',
                confirmButtonColor: '#E8083E'
            }).then(async function(result) {
                if (!result.isConfirmed) return;
                await fetch(API_BASE + '/api/delete-oee?id=' + d.id, {
                    method: 'DELETE'
                });
                loadData();
            });
        }

        function editDowntime(idx) {
            var d = filteredDowntime[idx];
            if (!d) return;

            var reasons = [
                "5S", "CHANGE LABEL / RIBBON", "ELECTRICAL STAGE PROBLEM", "EQUIPMENT / M/C PROBLEM",
                "EQUIP SOLDER PROBLEM", "FCT / ICT / LIGHT PROBLEM", "JIG / PALLET PROBLEM", "KEYENCE PROBLEM",
                "MATERIAL PROBLEM", "MEETING", "MP FCV OJT", "MP FV OJT", "MP INSERT OJT", "NG FCT", "NG PALLET",
                "ODEN CHECK", "OVER CHANGE MODEL", "PREPARE LINE", "PROBLEM ALARM SELBO", "PROBLEM CGS",
                "PROBLEM NG TRAY", "PROBLEM SOLDERABILITY", "PROBLEM W/T SELBO / SELECTIVE", "QUALITY PROBLEM",
                "ROMWRITE / TAISI PROB", "SCREW PROBLEM", "TOP UP", "TRAINING", "TRAINING MP FCT", "TRAINING MP INSERT",
                "WAITING COATING/CURING", "WAITING ENGINEERING", "WAITING FCT COMMON", "WAITING MATERIAL",
                "WAITING PACKAGING", "WAITING PALLET", "WAITING PCB", "WAITING TEMPERATURE", "WAITING TRAY",
                "OTHERS (CUSTOM INPUT)"
            ];
            var reasonCategoryMap = {
                "5S": "LOST",
                "CHANGE LABEL / RIBBON": "LOST",
                "MEETING": "LOST",
                "MP FCV OJT": "LOST",
                "MP FV OJT": "LOST",
                "MP INSERT OJT": "LOST",
                "ODEN CHECK": "LOST",
                "PREPARE LINE": "LOST",
                "TOP UP": "LOST",
                "TRAINING": "LOST",
                "TRAINING MP FCT": "LOST",
                "TRAINING MP INSERT": "LOST",
                "ELECTRICAL STAGE PROBLEM": "DOWN",
                "EQUIPMENT / M/C PROBLEM": "DOWN",
                "EQUIP SOLDER PROBLEM": "DOWN",
                "FCT / ICT / LIGHT PROBLEM": "DOWN",
                "JIG / PALLET PROBLEM": "DOWN",
                "KEYENCE PROBLEM": "DOWN",
                "MATERIAL PROBLEM": "DOWN",
                "NG FCT": "DOWN",
                "NG PALLET": "DOWN",
                "OVER CHANGE MODEL": "DOWN",
                "PROBLEM ALARM SELBO": "DOWN",
                "PROBLEM CGS": "DOWN",
                "PROBLEM NG TRAY": "DOWN",
                "PROBLEM SOLDERABILITY": "DOWN",
                "PROBLEM W/T SELBO / SELECTIVE": "DOWN",
                "QUALITY PROBLEM": "DOWN",
                "ROMWRITE / TAISI PROB": "DOWN",
                "SCREW PROBLEM": "DOWN",
                "WAITING COATING/CURING": "DOWN",
                "WAITING ENGINEERING": "DOWN",
                "WAITING FCT COMMON": "DOWN",
                "WAITING MATERIAL": "DOWN",
                "WAITING PACKAGING": "DOWN",
                "WAITING PALLET": "DOWN",
                "WAITING PCB": "DOWN",
                "WAITING TEMPERATURE": "DOWN",
                "WAITING TRAY": "DOWN"
            };

            var machineList = unique(downtimeData, 'machine');
            if (d.machine && machineList.indexOf(d.machine) === -1) machineList.unshift(d.machine);
            var machineOpts = machineList.map(function(m) {
                return '<option value="' + m + '"' + (d.machine === m ? ' selected' : '') + '>' + m + '</option>';
            }).join('');

            var curDetail = d.detail || '';
            var reasonOpts = reasons.map(function(r) {
                return '<option value="' + r + '"' + (curDetail === r ? ' selected' : '') + '>' + r + '</option>';
            }).join('');
            if (curDetail && reasons.indexOf(curDetail) === -1)
                reasonOpts = '<option value="' + curDetail + '" selected>' + curDetail + '</option>' + reasonOpts;

            var curType = d.type || 'DOWN';
            var typeFromReason = reasonCategoryMap[curDetail] || curType;

            Swal.fire({
                title: 'Edit Downtime Data',
                width: '680px',
                allowOutsideClick: false,
                showCancelButton: true,
                confirmButtonText: 'Save',
                html: `<div style="text-align:left;font-size:13px;">
            <div style="display:flex;gap:10px;margin-bottom:4px;">
                <div style="flex:1;">
                    <label class="swal2-label">Machine</label>
                    <select id="ed-machine" class="swal2-input" style="height:38px;padding:0 8px;">${machineOpts}</select>
                </div>
                <div style="flex:1;">
                    <label class="swal2-label">Model</label>
                    <input id="ed-model" class="swal2-input" value="${d.model || ''}" placeholder="Model">
                </div>
            </div>
            <label class="swal2-label">Detail / Reason</label>
            <select id="ed-detail" class="swal2-input" style="height:38px;padding:0 8px;width:100%;">${reasonOpts}</select>
            <div id="ed-custom-wrap" style="display:none;margin-top:6px;">
                <label class="swal2-label">Custom Reason</label>
                <input id="ed-custom" class="swal2-input" placeholder="Enter custom reason...">
            </div>
            <div style="display:flex;gap:10px;margin-top:6px;">
                <div style="flex:1;">
                    <label class="swal2-label">Type</label>
                    <select id="ed-type" class="swal2-input" style="height:38px;padding:0 8px;">
                        <option value="DOWN" ${typeFromReason==='DOWN'?'selected':''}>DOWN</option>
                        <option value="LOST" ${typeFromReason==='LOST'?'selected':''}>LOST</option>
                        <option value="OTHERS" ${typeFromReason==='OTHERS'?'selected':''}>OTHERS</option>
                    </select>
                </div>
                <div style="flex:1;">
                    <label class="swal2-label">Period (durasi)</label>
                    <input id="ed-period" class="swal2-input" value="${d.period || ''}">
                </div>
            </div>
            <div style="display:flex;gap:10px;margin-top:6px;">
                <div style="flex:1;"><label class="swal2-label">Tech</label>
                <input id="ed-tech" class="swal2-input" value="${d.tech || ''}"></div>
                <div style="flex:1;"><label class="swal2-label">Job</label>
                <input id="ed-job" class="swal2-input" value="${d.job || ''}"></div>
            </div>
            <div style="display:flex;gap:10px;">
                <div style="flex:1;"><label class="swal2-label">Executor</label>
                <input id="ed-executor" class="swal2-input" value="${d.executor || ''}"></div>
                <div style="flex:1;"><label class="swal2-label">Solution</label>
                <input id="ed-solution" class="swal2-input" value="${d.solution || ''}"></div>
            </div>
        </div>`,
                didOpen: function() {
                    var rcMap = reasonCategoryMap;
                    document.getElementById('ed-detail').addEventListener('change', function() {
                        var val = this.value;
                        var customWrap = document.getElementById('ed-custom-wrap');
                        if (val === 'OTHERS (CUSTOM INPUT)') {
                            customWrap.style.display = 'block';
                        } else {
                            customWrap.style.display = 'none';
                            var auto = rcMap[val];
                            if (auto) {
                                var typeSel = document.getElementById('ed-type');
                                for (var i = 0; i < typeSel.options.length; i++) {
                                    if (typeSel.options[i].value === auto) {
                                        typeSel.selectedIndex = i;
                                        break;
                                    }
                                }
                            }
                        }
                    });
                },
                preConfirm: function() {
                    var detailVal = document.getElementById('ed-detail').value;
                    if (detailVal === 'OTHERS (CUSTOM INPUT)') {
                        var custom = document.getElementById('ed-custom').value.trim();
                        if (!custom) {
                            Swal.showValidationMessage('Please enter a custom reason');
                            return false;
                        }
                        detailVal = custom.toUpperCase();
                    }
                    return {
                        machine: document.getElementById('ed-machine').value,
                        model: document.getElementById('ed-model').value,
                        type: document.getElementById('ed-type').value,
                        detail: detailVal,
                        period: document.getElementById('ed-period').value,
                        tech: document.getElementById('ed-tech').value,
                        job: document.getElementById('ed-job').value,
                        executor: document.getElementById('ed-executor').value,
                        solution: document.getElementById('ed-solution').value
                    };
                }
            }).then(async function(result) {
                if (!result.isConfirmed) return;
                await fetch(API_BASE + '/api/edit-downtime?id=' + d.id, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(result.value)
                });
                var origIdx = downtimeData.findIndex(function(o) {
                    return o.id === d.id;
                });
                if (origIdx !== -1) {
                    Object.assign(downtimeData[origIdx], result.value);
                }
                Swal.fire({
                    icon: 'success',
                    title: 'Tersimpan',
                    timer: 800,
                    showConfirmButton: false
                });
                applyFilters();
            });
        }

        function deleteDowntime(idx) {
            var d = filteredDowntime[idx];
            if (!d) return;
            Swal.fire({
                title: 'Delete this data??',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete',
                confirmButtonColor: '#E8083E'
            }).then(async function(result) {
                if (!result.isConfirmed) return;
                await fetch(API_BASE + '/api/delete-downtime?id=' + d.id, {
                    method: 'DELETE'
                });
                loadData();
            });
        }

        function renderPagination(total) {
            var totalPages = Math.ceil(total / pageSize) || 1;
            var start = (currentPage - 1) * pageSize + 1;
            var end = Math.min(currentPage * pageSize, total);
            document.getElementById('pag-info').textContent = 'Showing ' + (total ? start + '–' + end : '0') + ' of ' +
                total + ' records';
            document.getElementById('btn-prev').disabled = currentPage <= 1;
            document.getElementById('btn-next').disabled = currentPage >= totalPages;

            var pages = '';
            for (var i = 1; i <= totalPages; i++) {
                if (i === currentPage) pages += '<span class="pag-cur">' + i + '</span>';
                else if (i <= 2 || i > totalPages - 2 || Math.abs(i - currentPage) <= 1)
                    pages += '<span class="pag-num" onclick="goPage(' + i + ')">' + i + '</span>';
                else if (Math.abs(i - currentPage) === 2)
                    pages += '<span class="pag-ellipsis">…</span>';
            }
            document.getElementById('pag-pages').innerHTML = pages;
        }

        function changePage(dir) {
            var data = currentTab === 'oee' ? filteredOee : filteredDowntime;
            var totalPages = Math.ceil(data.length / pageSize) || 1;
            currentPage = Math.max(1, Math.min(currentPage + dir, totalPages));
            currentTab === 'oee' ? renderOeeTable() : renderDowntimeTable();
        }

        function goPage(n) {
            currentPage = n;
            currentTab === 'oee' ? renderOeeTable() : renderDowntimeTable();
        }

        function changePageSize(val) {
            pageSize = parseInt(val);
            currentPage = 1;
            applyFilters();
        }

        function switchTab(tab) {
            currentTab = tab;
            currentPage = 1;
            document.getElementById('tab-oee').classList.toggle('active', tab === 'oee');
            document.getElementById('tab-downtime').classList.toggle('active', tab === 'downtime');
            document.getElementById('table-oee').style.display = tab === 'oee' ? '' : 'none';
            document.getElementById('table-downtime').style.display = tab === 'downtime' ? '' : 'none';
            document.getElementById('filters-oee').style.display = tab === 'oee' ? '' : 'none';
            document.getElementById('filters-downtime').style.display = tab === 'downtime' ? '' : 'none';
            applyFilters();
        }

        function _buildWorkbook(tab) {
            var workbook = new ExcelJS.Workbook();
            var borderThin = {
                top: {
                    style: 'thin'
                },
                left: {
                    style: 'thin'
                },
                bottom: {
                    style: 'thin'
                },
                right: {
                    style: 'thin'
                }
            };
            var headerFill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                    argb: 'FF1F3864'
                }
            };
            var fillEven = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                    argb: 'FFFCE4D6'
                }
            };
            var fillOdd = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                    argb: 'FFFFFFFF'
                }
            };
            var fontHeader = {
                name: 'Arial',
                size: 9,
                bold: true,
                color: {
                    argb: 'FFFFFFFF'
                }
            };
            var fontBody = {
                name: 'Arial',
                size: 9
            };
            var alignC = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true
            };

            function addSheet(wb, sheetName, headers, colWidths, dataRows) {
                var ws = wb.addWorksheet(sheetName);
                var hRow = ws.addRow(headers);
                hRow.height = 30;
                hRow.eachCell(function(cell) {
                    cell.fill = headerFill;
                    cell.font = fontHeader;
                    cell.alignment = alignC;
                    cell.border = borderThin;
                });
                dataRows.forEach(function(rowData, idx) {
                    var no = idx + 1;
                    var row = ws.addRow([no].concat(rowData));
                    row.height = 20;
                    row.eachCell(function(cell) {
                        cell.fill = no % 2 === 0 ? fillEven : fillOdd;
                        cell.font = fontBody;
                        cell.alignment = alignC;
                        cell.border = borderThin;
                    });
                });
                ws.columns.forEach(function(col, i) {
                    col.width = colWidths[i] || 12;
                });
                ws.views = [{
                    state: 'frozen',
                    ySplit: 1
                }];
            }

            var headers, widths, rows, fileName, sheetName;
            if (tab === 'oee') {
                headers = ['No', 'Line', 'Machine', 'Operator', 'Model', 'Customer', 'Start', 'OEE', 'Availability',
                    'Performance', 'Quality', 'Achievement', 'Real Cycle', 'Std Cycle', 'Good Qty', 'NG Qty',
                    'Run Time', 'Down Time', 'Setup Time', 'Stop Time'
                ];
                widths = [4, 12, 15, 15, 25, 15, 25, 10, 15, 15, 15, 15, 12, 12, 10, 10, 15, 15, 15, 25];
                rows = filteredOee.map(function(d) {
                    return [d.line, d.machine, d.operator, d.model, d.customer, d.start,
                        d.oee, d.avb, d.pfm, d.qly, d.acv,
                        d.real_cycle, d.std_cycle, d.good, d.ng,
                        d.run_time, d.down_time, d.setup_time, d.stop_time
                    ];
                });
                fileName = 'OEE_Data_' + dateStr() + '.xlsx';
                sheetName = 'OEE Master Database';
            } else {
                headers = ['No', 'Line', 'Machine', 'Model', 'Type', 'Detail', 'Time', 'Period', 'Tech', 'Job', 'Executor',
                    'Solution'
                ];
                widths = [4, 12, 15, 25, 15, 25, 25, 15, 20, 20, 20, 20];
                rows = filteredDowntime.map(function(d) {
                    return [d.line, d.machine, d.model, d.type, d.detail, d.time, d.period,
                        d.tech, d.job, d.executor, d.solution
                    ];
                });
                fileName = 'Downtime_Data_' + dateStr() + '.xlsx';
                sheetName = 'Downtime Database';
            }
            addSheet(workbook, sheetName, headers, widths, rows);
            return {
                workbook,
                headers,
                rows,
                fileName
            };
        }

        function _makePdfDoc(tab, built) {
            var {
                jsPDF
            } = window.jspdf;
            var doc = new jsPDF({
                orientation: 'landscape',
                unit: 'pt',
                format: 'a4'
            });
            var label = tab === 'oee' ? 'OEE Data' : 'Downtime Data';
            doc.setFontSize(11);
            doc.setTextColor(31, 56, 100);
            doc.text('Export: ' + label + '  |  ' + dateStr() + '  |  ' + built.rows.length + ' records', 20, 25);
            doc.autoTable({
                startY: 35,
                head: [built.headers],
                body: built.rows.map(function(r, i) {
                    return [i + 1].concat(r);
                }),
                styles: {
                    fontSize: 7,
                    cellPadding: 3,
                    halign: 'center',
                    valign: 'middle',
                    overflow: 'linebreak'
                },
                headStyles: {
                    fillColor: [31, 56, 100],
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                alternateRowStyles: {
                    fillColor: [252, 228, 214]
                },
                tableLineColor: [180, 180, 180],
                tableLineWidth: 0.3,
                margin: {
                    left: 15,
                    right: 15
                }
            });
            return doc;
        }

        function exportExcel() {
            var tab = currentTab;
            var built = _buildWorkbook(tab);
            var label = tab === 'oee' ? 'OEE Data' : 'Downtime Data';
            var fileName = built.fileName;
            var pdfName = fileName.replace('.xlsx', '.pdf');

            var doc = _makePdfDoc(tab, built);
            var pdfBlob = doc.output('blob');
            var pdfUrl = URL.createObjectURL(pdfBlob);

            var overlay = document.createElement('div');
            overlay.id = 'export-preview-overlay';
            overlay.style.cssText =
                'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;display:flex;align-items:center;justify-content:center;';

            overlay.innerHTML =
                '<div style="background:#fff;border-radius:10px;width:96vw;height:92vh;max-width:1300px;padding:16px 20px 14px;box-shadow:0 8px 40px rgba(0,0,0,0.4);display:flex;flex-direction:column;gap:10px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">' +
                '<span style="font-size:15px;font-weight:700;color:#1F3864;">Preview — ' + label + ' (' + built.rows
                .length + ' records)</span>' +
                '<button id="exp-close-btn" style="background:none;border:none;font-size:24px;cursor:pointer;color:#555;line-height:1;">✕</button>' +
                '</div>' +
                '<iframe id="exp-iframe" src="' + pdfUrl +
                '" style="flex:1;width:100%;border:1px solid #ccc;border-radius:6px;min-height:0;"></iframe>' +
                '<div style="display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;">' +
                '<button id="exp-excel-btn" style="padding:8px 24px;background:#1F7A45;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">⬇ Download Excel</button>' +
                '<button id="exp-pdf-btn"   style="padding:8px 24px;background:#c0392b;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">⬇ Download PDF</button>' +
                '<button id="exp-close-btn2" style="padding:8px 20px;background:#777;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">Tutup</button>' +
                '</div>' +
                '</div>';

            document.body.appendChild(overlay);

            function closeOverlay() {
                URL.revokeObjectURL(pdfUrl);
                document.body.removeChild(overlay);
            }
            document.getElementById('exp-close-btn').onclick = closeOverlay;
            document.getElementById('exp-close-btn2').onclick = closeOverlay;
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) closeOverlay();
            });

            document.getElementById('exp-excel-btn').onclick = async function() {
                var buf = await built.workbook.xlsx.writeBuffer();
                saveAs(new Blob([buf]), fileName);
            };

            document.getElementById('exp-pdf-btn').onclick = function() {
                var doc2 = _makePdfDoc(tab, built);
                doc2.save(pdfName);
            };
        }

        function fmtPct(v) {
            if (v === null || v === undefined || v === '') return '-';
            var n = parseFloat(v);
            return isNaN(n) ? v : n.toFixed(1) + '%';
        }

        function msToHMS(ms) {
            var s = Math.floor(ms / 1000);
            var h = Math.floor(s / 3600);
            var m = Math.floor((s % 3600) / 60);
            return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
        }

        function todayStr() {
            var d = new Date();
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2,
                '0');
        }

        function dateStr() {
            var d = new Date();
            return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        }

        var wsAllpage = null;
        var pollingTimer = null;

        function connectAlllpageWS() {
            try {
                wsAllpage = new WebSocket('ws://' + SERVER_IP + ':3000');

                wsAllpage.onopen = function() {

                    if (pollingTimer) {
                        clearInterval(pollingTimer);
                        pollingTimer = null;
                    }
                };

                wsAllpage.onmessage = function(event) {
                    try {
                        var msg = JSON.parse(event.data);
                        if (msg.type === 'data_updated') {

                            loadData();
                        }
                    } catch (e) {}
                };

                wsAllpage.onerror = function() {

                    startPolling();
                };

                wsAllpage.onclose = function() {

                    startPolling();
                    setTimeout(connectAlllpageWS, 5000);
                };
            } catch (e) {

                startPolling();
            }
        }

        function startPolling() {
            if (pollingTimer) return;
            pollingTimer = setInterval(function() {

                loadData();
            }, 10000);
        }
    </script>
</body>

</html>
