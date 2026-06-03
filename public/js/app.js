var oeeInterval = null;
var swiperInstance;
var sequence = "";
var breakPopup = null;

function formatDateTime(date) {
    const d = date || new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mm = months[d.getMonth()];
    const yy = String(d.getFullYear()).slice(-2);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yy} ${h}:${m}:${s}`;
}
function getTypePresets() {
    try {return JSON.parse(localStorage.getItem('type_presets') || '{}');
    } catch (e) {return {};}
}

function getTypePreset(type) {
    if (!type) return null;
    var value = String(type).trim().toUpperCase();
    var presets = getTypePresets();
    if (presets[value]) return presets[value];

    var keys = Object.keys(presets);
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k.indexOf(value) !== -1 || value.indexOf(k) !== -1) {
            return presets[k];
        }
    }
    return null;
}

function saveTypePreset(type, data) {
    if (!type) return;
    var key = String(type).trim().toUpperCase();
    var presets = getTypePresets();

    const cleanUph = parseFloat(
        String(data.uph || '0')
            .replace(',', '.')
            .replace(/[^\d.]/g, '')) || 0;

    presets[key] = {
        line: data.line || '',
        machine: data.machine || '',
        uph: cleanUph,
        customer: data.customer || ''
    };

    localStorage.setItem('type_presets', JSON.stringify(presets));
}

async function loadTypePresetsFromExcel() {
    try {
       var pathOptions = [
            '/import/oee-data.xlsx', 'import/oee-data.xlsx', './import/oee-data.xlsx'
        ];
        var res = null;
        for (var i = 0; i < pathOptions.length; i++) {
            try {
                res = await fetch(pathOptions[i]);
                if (res && res.ok) {
                    TYPE_PRESET_XLSX_PATH = pathOptions[i];
                    console.log('Excel preset loaded from:', TYPE_PRESET_XLSX_PATH);
                    break;
                }
            } catch (e) {
                res = null;
            }
        }
        if (!res || !res.ok) {
            console.warn('Excel preset fetch failed:', pathOptions);
            return 0;
        }
        var buffer = await res.arrayBuffer();
        var count = 0;

        function parseSheetRows(rows) {
            if (!rows || !rows.length) return 0;

            const headerRow = rows[0];
            const indexes = {};

            for (let i = 0; i < headerRow.length; i++) {
                const h = String(headerRow[i] || '').trim().toLowerCase();
                if (h.includes('model') || h.includes('type')) indexes.type = i;
                if (h.includes('customer') || h.includes('cust')) indexes.customer = i;
                if (h.includes('uph')) indexes.uph = i;
            }

            console.log('Detected Excel Columns:', indexes);
            let c = 0;

            for (let r = 1; r < rows.length; r++) {
                const row = rows[r];
                if (!row || row.length === 0) continue;

                const data = {
                    type: String(row[indexes.type] || '').trim(),
                    customer: String(row[indexes.customer] || '').trim(),
                    uph: String(row[indexes.uph] || '').trim()
                };

                console.log('Excel Row Parsed:', data);

                if (data.type) {
                    saveTypePreset(data.type, data);
                    c++;
                }}
            return c;}

        if (window.XLSX) {
            try {
                var wb = XLSX.read(buffer, { type: 'array', defval: '', cellDates: true });
                if (wb.SheetNames && wb.SheetNames.length) {
                    var sheet = wb.Sheets[wb.SheetNames[0]];
                    var rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
                    count = parseSheetRows(rows);
                    console.log('SheetJS row count:', count);
                }
            } catch (e) {
                console.warn('SheetJS load failed:', e);
            }
        }
        if (!count) console.warn('Excel preset loaded but no type rows found');
        return count;
    } catch (e) {
        console.warn('Error reading Excel preset:', e);
        return 0;
    }}

function getDynamicTarget() {
    const targetModel = Number(localStorage.getItem("target_model_fixed")) || 0;
    if (targetModel <= 0) return 0;
    return targetModel;
}

document.addEventListener("DOMContentLoaded", async function() {
    const defaultData = {
        "runtimeTotal": "0",
        "downtimeTotal": "0",
        "shiftStartedFlag": "false",
        "production_history": "[]",
        "current_type_remarks": "",
        "good": "0",
        "nogood": "0",
        "all_ng_logs": "[]"
    };

    Object.keys(defaultData).forEach(k => {
        if (!localStorage.getItem(k)) localStorage.setItem(k, defaultData[k]);
    });

    swiperInstance = new Swiper(".swiper", {
        loop: true,
        loopedSlides: 3,
        observer: true,
        observeParents: true,
        autoplay: {
            delay: 8000,
            disableOnInteraction: false},
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',},
        pagination: {
            el: '.swiper-pagination',
            clickable: true }
    });

    if (localStorage.getItem("shiftStartedFlag") === "true") {
        startOEE();
        const currentMode = localStorage.getItem("mode");
        const hasReason = localStorage.getItem("downtimeGroup");

        if (currentMode === "down" && !hasReason && isWorkTime()) {
            setTimeout(() => {
                window.toggleDowntime(true);
            }, 500);
        }}
    
    startTime(); 
    renderAll();
    initKeyboardShortcuts();
    loadTypePresetsFromExcel();
});

window.openConfig = async function () {
    const isStarted = localStorage.getItem("shiftStartedFlag") === "true";
    
const { value: form } = await Swal.fire({
        title: isStarted ? 'EDIT CONFIGURATION' : 'PRODUCTION CONFIGURATION',
        showCancelButton: true,
        allowOutsideClick: false,
        confirmButtonText: isStarted ? 'Update Data' : 'Start Production',
        width: '600px',
        html: `
            <div style="text-align: left; font-size: 16px;">
                <label>Line, Machine, & Model:</label>
                <div class="input-row">
                    <input id="swal-line" class="swal2-input" placeholder="Line" value="${localStorage.getItem('line') || ''}">
                    <input id="swal-machine" class="swal2-input" placeholder="Machine" value="${localStorage.getItem('machine') || ''}">
                    <input id="swal-model" class="swal2-input" placeholder="Model" value="${localStorage.getItem('model') || ''}">
                </div>
                <label>Target, UPH, Customer, & Qty/Pallet:</label>
                <div class="input-row">
                    <input id="swal-target" class="swal2-input" type="number" placeholder="Target" value="${localStorage.getItem('target') || ''}">
                    <input id="swal-uph" class="swal2-input" type="number" placeholder="UPH" value="${localStorage.getItem('uph_display') || ''}">
                    <input id="swal-cst" class="swal2-input" placeholder="Customer" value="${localStorage.getItem('cst') || ''}">
                    <input id="swal-qty-Pallet" class="swal2-input" type="number" placeholder="Qty/Pallet" value="${localStorage.getItem('qty_Pallet') || ''}">
                </div>
                <label>Shift, Group & Planned Time:</label>
                <div class="input-row">
                    <select id="swal-shift" class="swal2-input">
                        <option value="1" ${localStorage.getItem('shift') === '1' ? 'selected' : ''}>Shift 1</option>
                        <option value="2" ${localStorage.getItem('shift') === '2' ? 'selected' : ''}>Shift 2</option>
                        <option value="3" ${localStorage.getItem('shift') === '3' ? 'selected' : ''}>Shift 3</option>
                    </select>
                    <select id="swal-group" class="swal2-input">
                        <option value="A" ${localStorage.getItem('group') === 'A' ? 'selected' : ''}>Group A</option>
                        <option value="B" ${localStorage.getItem('group') === 'B' ? 'selected' : ''}>Group B</option>
                        <option value="C" ${localStorage.getItem('group') === 'C' ? 'selected' : ''}>Group C</option>
                    </select>
                    <select id="swal-time" class="swal2-input">
                        <option value="8" ${localStorage.getItem('rawPlannedTime') === '8' ? 'selected' : ''}>7 Hour</option>
                        <option value="5" ${localStorage.getItem('rawPlannedTime') === '5' ? 'selected' : ''}>5 Hour</option>
                    </select>
                </div>
            </div>`,
            didOpen: () => {
                const modelInput = document.getElementById('swal-model');
                const targetInput = document.getElementById('swal-target');
                const uphInput = document.getElementById('swal-uph');
                const customerInput = document.getElementById('swal-cst');

                let isManualEdit = false;

                uphInput.addEventListener('input', () => { isManualEdit = true; });

                const applyAutoFill = () => {
                    if (isManualEdit) return; 

                    const val = modelInput.value;
                    const preset = getTypePreset(val);

                    if (preset) {
                        uphInput.value = preset.uph !== undefined ? preset.uph : 0;
                        customerInput.value = preset.customer || '';
                    } else {
                        if (!val) {
                            uphInput.value = '';
                            customerInput.value = '';
                        }
                    }
                };

                modelInput.addEventListener('input', () => {
                    isManualEdit = false;
                    applyAutoFill();
                });
            },
            preConfirm: () => {
                return {
                    line: document.getElementById('swal-line').value,
                    machine: document.getElementById('swal-machine').value,
                    model: document.getElementById('swal-model').value,
                    target: parseFloat(document.getElementById('swal-target').value) ||
                            parseFloat(document.getElementById('swal-uph').value) || 0,
                    uph: parseFloat(document.getElementById('swal-uph').value) || 0,
                    qty_Pallet: parseFloat(document.getElementById('swal-qty-Pallet').value) || 1,
                    customer: document.getElementById('swal-cst').value,
                    time: document.getElementById('swal-time').value,
                    shift: document.getElementById('swal-shift').value,
                    group: document.getElementById('swal-group').value
                };
        }
    });

if (form) {
    const now = Date.now();
    const timeNowStr = formatDateTime(new Date());
    const oldModel = localStorage.getItem("model");

        if (isStarted && oldModel !== form.model && oldModel !== "") {
            window.saveToHistory();
            
            [
                "good", "nogood", "runtimeTotal", "downtimeTotal", "realCycleVal", "idealqty"
            ].forEach(k => localStorage.setItem(k, "0"));

            localStorage.setItem("ng_logs", "[]");
            localStorage.setItem("downtime_logs", "[]");
            localStorage.setItem("model_start_clock", timeNowStr);
            localStorage.setItem("lastModeUpdateTime", now.toString());
            localStorage.setItem("lastProductTime", now.toString());
            localStorage.setItem("mode", "run");
        }
        localStorage.setItem("line", form.line);
        localStorage.setItem("machine", form.machine);
        localStorage.setItem("model", form.model);
        localStorage.setItem("type", form.model);
        localStorage.setItem("target_mode", "AUTO");
        localStorage.setItem("uph_display", form.uph);
        localStorage.setItem("target", form.target);
        localStorage.setItem("cst", form.customer);
        localStorage.setItem("rawPlannedTime", form.time);
        localStorage.setItem("shift", form.shift);
        localStorage.setItem("group", form.group);
        localStorage.setItem("qty_Pallet", form.qty_Pallet);
        localStorage.setItem("target_model_fixed", form.target);

        const uphNum = form.uph || 0;
        const qty_Pallet = form.qty_Pallet || 0;
        localStorage.setItem("cycle_val", uphNum > 0 ? ((3600 / uphNum) * qty_Pallet).toFixed(2) : "0");

        if (!isStarted) {
            localStorage.setItem("shiftStartedFlag", "true");
            localStorage.setItem("model_start_clock", timeNowStr);
            localStorage.setItem("lastProductTime", now.toString());
            localStorage.setItem("lastModeUpdateTime", now.toString());
            localStorage.setItem("mode", "run");
            startOEE();
        }
        Swal.fire({ icon: 'success', title: 'Data Saved', timer: 1000, showConfirmButton: false });
        renderAll();
    }
};

window.toggleDowntime = async function (isAuto = false) {
    if (localStorage.getItem("shiftStartedFlag") !== "true") return;

    let mode = localStorage.getItem("mode") || "run";
    if (isAuto || mode === "run") localStorage.setItem("mode", "down");
    if (Swal.isVisible()) return;

    const reasons = [
        "5S", "CHANGE LABEL / RIBBON", "ELECTRICAL STAGE PROBLEM", "EQUIPMENT / M/C PROBLEM", "EQUIP SOLDER PROBLEM", "FCT / ICT / LIGHT PROBLEM", "JIG / PALLET PROBLEM", "KEYENCE PROBLEM", "MATERIAL PROBLEM", "MEETING", "MP FCV OJT", "MP FV OJT", "MP INSERT OJT", "NG FCT",
        "NG PALLET", "ODEN CHECK", "OVER CHANGE MODEL", "PREPARE LINE", "PROBLEM ALARM SELBO", "PROBLEM CGS", "PROBLEM NG TRAY", "PROBLEM SOLDERABILITY", "PROBLEM W/T SELBO / SELECTIVE", "QUALITY PROBLEM", "ROMWRITE / TAISI PROB", "SCREW PROBLEM", "TOP UP",
        "TRAINING", "TRAINING MP FCT", "TRAINING MP INSERT", "WAITING COATING/CURING", "WAITING ENGINEERING", "WAITING FCT COMMON", "WAITING MATERIAL", "WAITING PACKAGING", "WAITING PALLET", "WAITING PCB", "WAITING TEMPERATURE", "WAITING TRAY", "OTHERS (CUSTOM INPUT)"
    ];
    const reasonCategoryMap = {
        "5S": "LOST", "CHANGE LABEL / RIBBON": "LOST", "MEETING": "LOST", "MP FCV OJT": "LOST", "MP FV OJT": "LOST", "MP INSERT OJT": "LOST", "ODEN CHECK": "LOST", "PREPARE LINE": "LOST", "TOP UP": "LOST", "TRAINING": "LOST",
        "TRAINING MP FCT": "LOST", "TRAINING MP INSERT": "LOST", "ELECTRICAL STAGE PROBLEM": "DOWN", "EQUIPMENT / M/C PROBLEM": "DOWN", "EQUIP SOLDER PROBLEM": "DOWN",
        "FCT / ICT / LIGHT PROBLEM": "DOWN", "JIG / PALLET PROBLEM": "DOWN", "KEYENCE PROBLEM": "DOWN", "MATERIAL PROBLEM": "DOWN", "NG FCT": "DOWN", "NG PALLET": "DOWN", "OVER CHANGE MODEL": "DOWN",
        "PROBLEM ALARM SELBO": "DOWN", "PROBLEM CGS": "DOWN", "PROBLEM NG TRAY": "DOWN", "PROBLEM SOLDERABILITY": "DOWN", "PROBLEM W/T SELBO / SELECTIVE": "DOWN", "QUALITY PROBLEM": "DOWN",
        "ROMWRITE / TAISI PROB": "DOWN", "SCREW PROBLEM": "DOWN", "WAITING COATING/CURING": "DOWN", "WAITING ENGINEERING": "DOWN", "WAITING FCT COMMON": "DOWN", "WAITING MATERIAL": "DOWN",
        "WAITING PACKAGING": "DOWN", "WAITING PALLET": "DOWN", "WAITING PCB": "DOWN", "WAITING TEMPERATURE": "DOWN", "WAITING TRAY": "DOWN"
    };

    const options = {};
    reasons.forEach((r, i) => options[r] = `${i + 1}. ${r}`);

    const { value: res } = await Swal.fire({
        title: "START DOWNTIME",
        input: "select",
        inputOptions: options,
        confirmButtonColor: "#E8083E",
        allowOutsideClick: false
    });

    if (res) {
        let final = res;
        if (res === "OTHERS (CUSTOM INPUT)") {
            const { value: custom } = await Swal.fire({
                title: 'Enter Reason',
                input: 'text',
                allowOutsideClick: false,
                inputValidator: v => !v && 'Required!'
            });
            final = custom ? custom.toUpperCase() : "MANUAL INPUT UNKNOWN";
        }

        const now = new Date();
        const timeStartStr = formatDateTime(now);

        const category = reasonCategoryMap[final] || "DOWN";
        localStorage.setItem("downtimeGroup", final);
        localStorage.setItem("downtimeCategory", category);
        localStorage.setItem("downtime_start_time_ms", Date.now().toString());
        localStorage.setItem("downtime_start_clock_str", timeStartStr);
        localStorage.setItem("mode", "down");
        console.log("Downtime dimulai:", { 
            reason: final, 
            category: category, 
            startTime: timeStartStr 
        });

    } else {
        if (!isAuto) {
            localStorage.setItem("mode", "run");
            localStorage.removeItem("downtimeGroup");
            localStorage.removeItem("downtimeCategory");
            localStorage.removeItem("downtime_start_time_ms");
            localStorage.removeItem("downtime_start_clock_str");
        }}
    renderAll();
};

window.updateQty = async function (key, change) {
    if (localStorage.getItem("shiftStartedFlag") !== "true") return;
    const now = Date.now();
    const qtyPallet = parseInt(localStorage.getItem("qty_Pallet")) || 1;
    let g = parseInt(localStorage.getItem("good")) || 0;
    let n = parseInt(localStorage.getItem("nogood")) || 0;

    if (key === "nogood" && change > 0) {
        if (g <= 0) {
            Swal.fire({ icon: 'error', title: 'No Qty!', timer: 1000, showConfirmButton: false });
            return;
        }

        const rejectReasons = [
            'BLUR', 'BLACK DOT', 'BENDING', 'BROKEN', 'BROKEN LED', 'BUTSHU', 'BURNT', 'BUBBLE', 'CRACK', 'CRIMPING NG', 'DAMAGE', 'DEFORMASI', 'DELAMINATION', 'DENTED', 'DEWETTING', 'DIRTY', 'DISCOLOUR', 'DOT MARK', 'EPGM', 'EXCESS GREENMAX',
            'EXCESS SOLDER', 'EXTRA COMPONENT', 'FCT NG', 'FLOW UP', 'FM', 'FOGGING', 'FLOATING', 'WIRE BERCABANG', 'GAP', 'GLUE', 'HAIR MARK', 'INSULIN', 'ICT NG', 'KEYENCE NG', 'LED OFF', 'LESS PRINTING', 'LESS SOLDER', 'LESS COATING', 'LONG LEAD', 'LOOKING DOWN',
            'LOOKING UP', 'LOOSE', 'LABELING', 'MA', 'MELTING', 'MISSING', 'NO BARCODE', 'NO CENTER', 'NO FLOW UP', 'NO FLUX', 'NO INSERT', 'NO SOLDER', 'NO LEAD', 'NO PRESS', 'NO SOUND', 'OC', 'OVER COATING', 'OVER CUTTING', 'PAINTING NG', 'PATTERN CUT',
            'PATTERN SHORT', 'PCB DROP', 'PIN HOLE', 'PEEL OFF', 'ROOMWRITE /TAISI', 'RUSTY', 'SCRATCH', 'SMALL HOLE', 'SHIELD OUT', 'SOLDER SHORT', 'SOLDER BALL', 'SOLDER HOLE', 'SOLDER ON HOLE', 'SOLDER SPIKE', 'SOLDER SPLASH', 'SOLDER TAIL', 'TAPE', 'TEARING', 'TRUE HOLE', 'UNEVEN',
            'UNSMOTH', 'VOID', 'UPPER', 'WAIT SCAN', 'WHITE DOT', 'WRAP', 'WRONG COMPONENT', 'WRONG INSERT', 'WRONG POSITION', 'WRONG PCB', 'WRONG POLARITY','OTHERS (Custom Input)'
        ];

        const options = {};
        rejectReasons.forEach((r, i) => options[r] = `${i + 1}. ${r}`);

        const { value: r } = await Swal.fire({
            title: 'REJECT REASON',
            input: 'select',
            inputOptions: options, 
            confirmButtonColor: "#E8083E",
            inputValidator: v => !v && 'REASON REQUIRED!'
        });
        
        if (!r) return;
        
        let fr = r;
        if (r === "OTHERS (Custom Input)") {
            const { value: custom } = await Swal.fire({ 
                title: 'CUSTOM REASON', 
                input: 'text',
                inputValidator: v => !v && 'Required!'
            });
            fr = custom || "Unknown";
        }
        
        g = g - qtyPallet; n = n + qtyPallet;
        localStorage.setItem("good", g);
        localStorage.setItem("nogood", n);

        let logs = JSON.parse(localStorage.getItem("ng_logs") || "[]");
        let all = JSON.parse(localStorage.getItem("all_ng_logs") || "[]");
        const data = { 
            time: new Date().toLocaleTimeString('id-ID'), 
            reason: fr, 
            model: localStorage.getItem("type") || "-", 
            customer: localStorage.getItem("cst") || "-" 
        };
        logs.push(data);
        all.push(data);
        localStorage.setItem("ng_logs", JSON.stringify(logs));
        localStorage.setItem("all_ng_logs", JSON.stringify(all));

    } else if (key === "good") {
        if (change > 0) {
            g = g + qtyPallet;
            let start = parseInt(localStorage.getItem("lastProductTime")) || parseInt(localStorage.getItem("lastModeUpdateTime")) || now;
            localStorage.setItem("realCycleVal", ((now - start) / 1000).toFixed(2));
            localStorage.setItem("lastProductTime", now.toString());
            
            if (localStorage.getItem("mode") === "down") {
                const dtStartMs = parseInt(localStorage.getItem("downtime_start_time_ms"));
                const dtStartClock = localStorage.getItem("downtime_start_clock_str");
                const reason = localStorage.getItem("downtimeGroup") || "Not Filled In Yet";
                
                if (dtStartMs) {
                    const dtEndMs = Date.now();
                    const dtEndClock = formatDateTime(new Date(dtEndMs));
                    const durationMs = dtEndMs - dtStartMs; 
                    
                    if (durationMs >= 1000 && dtStartClock) {
                        let logs = JSON.parse(localStorage.getItem("downtime_logs") || "[]");
                        logs.push({
                            start: dtStartClock,
                            end: dtEndClock,
                            durationMs: durationMs,
                            reason: reason,
                            category: localStorage.getItem("downtimeCategory") || "DOWN",
                            model: localStorage.getItem("type") || "-"
                        });                
                        localStorage.setItem("downtime_logs", JSON.stringify(logs));
                        const dataDowntimeRealtime = {
                            targetFile: "DOWNTIME",
                            machine: localStorage.getItem('machine') || "MC-TEST",
                            model: localStorage.getItem("type") || "MODEL-TEST",
                            type: localStorage.getItem("downtimeCategory") || "DOWN",
                            detail: reason, // variabel 'reason' bawaan updateQty kamu
                            time: dtStartClock, // variabel 'dtStartClock' bawaan updateQty kamu
                            period: formatTime(durationMs) // fungsi 'formatTime' bawaan app.js kamu
                        };
                        sendToServer(dataDowntimeRealtime);
                    }
                }
            }

            localStorage.setItem("mode", "run");
            localStorage.removeItem("downtimeGroup");
            localStorage.removeItem("downtime_start_time_ms");
            localStorage.removeItem("downtime_start_clock_str");
            localStorage.removeItem("autoPopupShowed");
        } else {
            g = Math.max(0, g - qtyPallet);
        }
        localStorage.setItem("good", g);
    }
    
    if (Swal.isVisible()) Swal.close();
    renderAll();
};

function startOEE() {
    if (oeeInterval) clearInterval(oeeInterval);

    oeeInterval = setInterval(() => {
        if (localStorage.getItem("shiftStartedFlag") !== "true") return;
        const shift = parseInt(localStorage.getItem('shift')) || 1;
        const hoursConfig = parseInt(localStorage.getItem('rawPlannedTime')) || 8;
        const config = getScheduleConfig()?.[shift]?.[hoursConfig];
        if (!config) return; 
        const d = new Date();
        const currentTime = (d.getHours() * 60) + d.getMinutes();
        const toMin = (t) => { const [h, m] = t.split(':').map(Number); return (h * 60) + m; };
        const startMin = toMin(config.start);
        const endMin = toMin(config.end);

        let isInsideShift = (startMin > endMin) 
            ? (currentTime >= startMin || currentTime < endMin) 
            : (currentTime >= startMin && currentTime < endMin);

        let isResting = false;
        for (const b of config.breaks) {
            if (currentTime >= toMin(b.s) && currentTime < toMin(b.e)) {
                isResting = true;
                break;
            }}

        if (isResting && isInsideShift) {
            if (!breakPopup && !Swal.isVisible()) {
                breakPopup = Swal.fire({ icon: "info", title: "BREAK TIME", allowOutsideClick: false });
            }
            renderAll();
            return; 
        } else if (breakPopup) {
            Swal.close();
            breakPopup = null;}

        if (!isInsideShift) { renderAll(); return; }

        const now = Date.now();
        const lastUpd = parseInt(localStorage.getItem("lastModeUpdateTime")) || now;
        const elapsed = now - lastUpd; 
        localStorage.setItem("lastModeUpdateTime", now.toString());

        const mode = localStorage.getItem("mode") || "run";
        const cycle = parseFloat(localStorage.getItem("cycle_val")) || 0;

        if (mode === "run") {
        let lastPStr = localStorage.getItem("lastProductTime");
        
        if (!lastPStr) {
            localStorage.setItem("lastProductTime", now.toString());
            lastPStr = now.toString();
        }

        const lastP = parseInt(lastPStr);
        const diffSeconds = (now - lastP) / 1000;

        if (cycle > 0 && diffSeconds > cycle) {
            console.log("Downtime Terdeteksi! Target:", cycle, "Actual:", diffSeconds.toFixed(2));
            
            if (!Swal.isVisible()) {
                const timeStartStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                localStorage.setItem("downtime_start_time_ms", Date.now().toString());
                localStorage.setItem("downtime_start_clock_str", timeStartStr);
                
                window.toggleDowntime(true); 
                return;
            }
        }
        
        const rt = parseInt(localStorage.getItem("runtimeTotal") || 0);
        localStorage.setItem("runtimeTotal", (rt + elapsed).toString());

    } else {
        const dt = parseInt(localStorage.getItem("downtimeTotal") || 0);
        localStorage.setItem("downtimeTotal", (dt + elapsed).toString());
    }

            renderAll();
        }, 1000);
    }

function renderAll() {
    const get = (k) => localStorage.getItem(k);
    const num = (v) => Number(v) || 0;
    const int = (v) => parseInt(v || 0);
    const float = (v) => parseFloat(v || 0);
    const uphAsli = num(get("uph_display"));
    const qtyPallet = float(get("qty_Pallet")) || 1;
    const cyc = float(get("cycle_val"));
    const mr = int(get("runtimeTotal"));
    const md = int(get("downtimeTotal"));
    const mg = num(get("good"));
    const mn = num(get("nogood"));
    const mt = mg + mn;
    const mode = get("mode") || "run";

    let currentTarget = getDynamicTarget();
    if (!currentTarget || currentTarget <= 0) {
        currentTarget = num(get("target")) || uphAsli || 0;
    }

    let ma = mr + md; 
    const modelTotalSeconds = ma / 1000;

    const idealModelQty = cyc > 0 ? Math.floor(modelTotalSeconds / cyc) * qtyPallet : 0;
    localStorage.setItem("idealqty", idealModelQty);

    const avb = (ma > 0) ? (mr / ma) * 100 : 0;
    
    let pfm = (ma > 0 && cyc > 0) ? ((mt * cyc) / (ma / 1000)) * 100 : 0;

    const qly = (mt > 0) ? (mg / mt) * 100 : 0;
    const oee = (avb * pfm * qly) / 10000;

    let calculatedEfc = idealModelQty > 0 ? (mg / idealModelQty) * 100 : 0;
    const efc = Math.min(calculatedEfc, 100);

    let acv = (currentTarget > 0) ? (mt / currentTarget) * 100 : 0;
    acv = Math.min(Math.max(acv, 0), 999);

    const set = (id, val, colorVal = null, comma = false) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = comma ? val.toString().replace('.', ',') : val;

        if (colorVal === null) return;
        let color = "transparent";
        if (colorVal >= 100) {
            color = "#02864A"; 
        } else if (colorVal > 0 && colorVal < 90) {
            color = "#E8083E";}
        
        const textColor = color === "transparent" ? "" : "white";
        const p = el.parentElement;
        if (p) {
            p.style.backgroundColor = color;
            p.style.color = textColor;}
        if (id === "oee") {
            const boxT = document.getElementById("box-teks");
            if (boxT && boxT.parentElement) {
                boxT.parentElement.style.backgroundColor = color;
                boxT.parentElement.style.color = textColor;
        }}};

    const btn = document.getElementById("btn-downtime");
    const blink = document.getElementById("downtime");
    if (btn) {
        btn.style.backgroundColor = mode === "down" ? "#E8083E" : "#02864A";
        btn.style.color = "#F8F9FF";
    }
    if (blink) blink.classList.toggle("warning-blink", mode === "down");

    const d = new Date();
    const tglStr = String(d.getDate()).padStart(2, '0') + '/' + 
                   String(d.getMonth() + 1).padStart(2, '0') + '/' + 
                   d.getFullYear();
    
    const dateEl = document.getElementById("current-date");
    if (dateEl && dateEl.innerText !== tglStr) {
        dateEl.innerText = tglStr;}

    const startClock = get("model_start_clock");
    let fullTimeDisplay = "00:00:00";
    if (startClock && startClock.includes(":")) {
        const [startH, startM] = startClock.split(":").map(Number);
        const start = new Date();
        start.setHours(startH, startM, 0, 0);
        
        if (d < start) start.setDate(start.getDate() - 1);
        
        let diff = d - start;
        if (diff < 0) diff = 0;
        fullTimeDisplay = formatTime(diff);}

    set("trg", currentTarget);
    set("oee", oee.toFixed(1), oee);
    set("avb", avb.toFixed(1), avb);
    set("pfm", pfm.toFixed(1), pfm);
    set("qly", qly.toFixed(1), qly);
    set("efc", efc.toFixed(1), efc);
    set("acv", acv.toFixed(1), acv);
    set("gd", mg);
    set("ng", mn);
    set("tqty", mt);
    set("iqty", idealModelQty);
    set("uph", uphAsli);
    set("cyc", cyc.toFixed(2));
    set("rcyc", get("realCycleVal") || "0.00");

    const runtimeEl = document.getElementById("runtime"); if (runtimeEl) runtimeEl.innerText = formatTime(mr);
    const downtimeEl = document.getElementById("downtime"); if (downtimeEl) downtimeEl.innerText = formatTime(md);
    const diffEl = document.getElementById("rmiqty");
    const elLine = document.getElementById("txtedt");
    const elModel = document.getElementById("typscn");
    
    if (diffEl) {
        const diff = idealModelQty - mt;
        if (diff > 0) {
            diffEl.innerText = `-${diff}`;
            diffEl.style.color = "#E8083E";
        } else if (diff < 0) {
            diffEl.innerText = `+${Math.abs(diff)}`;
            diffEl.style.color = "#02864A";
        } else {
            diffEl.innerText = "";}}

    if (elLine) {
        const line = get("line") || "LINE";
        const machine = get("machine") || "MACHINE";
        const shift = get("shift") || " ";
        const group = get("group") || " ";

        if (line === "LINE" && machine === "MACHINE" && shift === " " && group === " ") {
            elLine.innerText = "BACKEND";
        } else {
            elLine.innerText = `${shift}. GROUP ${group}, ${line}, ${machine}`.toUpperCase();
        }}
    if (elModel) {
        elModel.innerText = (get("model") || "OEE PROGRAM").toUpperCase();}
    
    localStorage.setItem("oee_val", oee.toFixed(1));
    localStorage.setItem("avb_val", avb.toFixed(1));
    localStorage.setItem("pfm_val", pfm.toFixed(1));
    localStorage.setItem("qly_val", qly.toFixed(1));
    localStorage.setItem("acv_val", acv.toFixed(1));
}

window.saveToHistory = function () {
    const idealRealtime = parseInt(localStorage.getItem("idealqty") || "0");

    const entry = {
        model_name: localStorage.getItem("model") || "-",
        model_start: localStorage.getItem("model_start_clock") || "-",
        model_end: new Date().toLocaleTimeString('id-ID'),
        model_fulltime: document.getElementById("timer")?.innerText || "00:00:00",
        model_runtime: document.getElementById("runtime")?.innerText || "00:00:00",
        model_downtime: document.getElementById("downtime")?.innerText || "00:00:00",
        target: document.getElementById('trg')?.innerText || localStorage.getItem('target') || "0",
        uph: localStorage.getItem('uph_display') || "0",
        ideal: idealRealtime.toString(),
        good: localStorage.getItem('good') || "0",
        nogood: localStorage.getItem('nogood') || "0",
        total_qty: (Number(localStorage.getItem('good') || 0) + Number(localStorage.getItem('nogood') || 0)).toString()
    };

    let history = JSON.parse(localStorage.getItem("production_history") || "[]");
    history.push(entry);
    localStorage.setItem("production_history", JSON.stringify(history));
};

window.exportToExcel = async function () {
    if (typeof window.saveToHistory === "function") window.saveToHistory();
    const history = JSON.parse(localStorage.getItem("production_history") || "[]");
    const ngLogs = JSON.parse(localStorage.getItem("all_ng_logs") || "[]");
    const downtimeLogs = JSON.parse(localStorage.getItem("downtime_logs") || "[]");
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('OEE Report');
    
    worksheet.columns = [
        { width: 3.8}, { width: 13.8 }, { width: 13.8 }, { width: 13.8 }, { width: 13.8 }, { width: 13.8 }, { width: 13.8 }, { width: 13.8 }
    ];
   
    const borderThin = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    const grayFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
    
    const alignCenter = { horizontal: 'center', vertical: 'middle', wrapText: true };
    const alignLeft = { horizontal: 'left', vertical: 'middle' };
    const alignRight = { horizontal: 'right', vertical: 'middle' };

    const fontTitle = { name: 'Arial', size: 14, bold: true, underline: true };
    const fontGroup = { name: 'Arial', size: 10, bold: true };
    const fontPart = { name: 'Arial', size: 9, bold: true };
    const fontIsi = { name: 'Arial', size: 9, bold: false };

    const formatTimeFromMs = (ms) => {
        if (!ms || isNaN(ms)) return "00:00:00";
        const totalSecs = Math.floor(ms / 1000);
        const h = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSecs % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const normalizeToExcelTime = (timeStr) => {
        if (!timeStr) return "-";
        return String(timeStr).trim().replace(/\./g, ':');
    };

    const fmtTitikDua = '@*":"';
    let currRow = 1;

    worksheet.mergeCells(`A${currRow}:H${currRow}`);
    const title = worksheet.getCell(`A${currRow}`);
    title.value = 'OEE DIGITAL REPORT';
    title.font = fontTitle;
    title.alignment = alignCenter;
    
    currRow += 1; 
    worksheet.getRow(currRow).values = []; 

    currRow += 1; 
    const cellDateLbl = worksheet.getCell(`B${currRow}`);
    cellDateLbl.value = 'DATE'; 
    cellDateLbl.font = fontGroup;
    cellDateLbl.numFormat = fmtTitikDua;
    cellDateLbl.alignment = { horizontal: 'left', vertical: 'middle' }; 

    worksheet.mergeCells(`C${currRow}:D${currRow}`);
    worksheet.getCell(`C${currRow}`).value = new Date().toLocaleDateString('en-GB');
    worksheet.getCell(`C${currRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${currRow}`).border = { bottom: { style: 'thin' } };

    const cellLineLbl = worksheet.getCell(`F${currRow}`);
    cellLineLbl.value = 'LINE'; 
    cellLineLbl.font = fontGroup;
    cellLineLbl.numFormat = fmtTitikDua;
    cellLineLbl.alignment = { horizontal: 'left', vertical: 'middle' }; 

    worksheet.mergeCells(`G${currRow}:H${currRow}`);
    worksheet.getCell(`G${currRow}`).value = localStorage.getItem('line') || "-";
    worksheet.getCell(`G${currRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`G${currRow}`).border = { bottom: { style: 'thin' } };

    currRow += 1; 
    const cellCstLbl = worksheet.getCell(`B${currRow}`);
    cellCstLbl.value = 'CUSTOMER'; 
    cellCstLbl.font = fontGroup;
    cellCstLbl.numFormat = fmtTitikDua;
    cellCstLbl.alignment = { horizontal: 'left', vertical: 'middle' }; 

    worksheet.mergeCells(`C${currRow}:D${currRow}`);
    worksheet.getCell(`C${currRow}`).value = localStorage.getItem('cst') || "-";
    worksheet.getCell(`C${currRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${currRow}`).border = { bottom: { style: 'thin' } };

    const cellShiftLbl = worksheet.getCell(`F${currRow}`);
    cellShiftLbl.value = 'SHIFT/GROUP'; 
    cellShiftLbl.font = fontGroup;
    cellShiftLbl.numFormat = fmtTitikDua;
    cellShiftLbl.alignment = { horizontal: 'left', vertical: 'middle' }; 

    worksheet.mergeCells(`G${currRow}:H${currRow}`);
    worksheet.getCell(`G${currRow}`).value = (localStorage.getItem('shift') || '-') + '/' + (localStorage.getItem('group') || '-');
    worksheet.getCell(`G${currRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`G${currRow}`).border = { bottom: { style: 'thin' } };

    currRow += 2; 

    worksheet.mergeCells(`A${currRow}:H${currRow}`);
    const sOee = worksheet.getCell(`A${currRow}`);
    sOee.value = 'OEE'; sOee.fill = grayFill; sOee.font = fontGroup; sOee.alignment = alignCenter; sOee.border = borderThin;
    
    currRow += 1; 
    worksheet.mergeCells(`A${currRow}:B${currRow}`); worksheet.getCell(`A${currRow}`).value = 'OEE';
    worksheet.getCell(`C${currRow}`).value = 'QUALITY';
    worksheet.getCell(`D${currRow}`).value = 'PERFORMANCE';
    worksheet.getCell(`E${currRow}`).value = 'AVAILABILITY';
    worksheet.getCell(`F${currRow}`).value = 'EFFICIENCY';
    worksheet.mergeCells(`G${currRow}:H${currRow}`); worksheet.getCell(`G${currRow}`).value = 'ACHIEVEMENT';

    ['A', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
        const c = worksheet.getCell(`${col}${currRow}`);
        c.font = fontPart; c.alignment = alignCenter; c.border = borderThin;
    });

    currRow += 1; 
    const getUI = id => {
        const txt = document.getElementById(id)?.innerText || "0";
        return txt.includes('%') ? txt : txt + '%';
    };
    
    worksheet.mergeCells(`A${currRow}:B${currRow}`); worksheet.getCell(`A${currRow}`).value = getUI('oee');
    worksheet.getCell(`C${currRow}`).value = getUI('qly');
    worksheet.getCell(`D${currRow}`).value = getUI('pfm');
    worksheet.getCell(`E${currRow}`).value = getUI('avb');
    worksheet.getCell(`F${currRow}`).value = getUI('efc');
    worksheet.mergeCells(`G${currRow}:H${currRow}`); worksheet.getCell(`G${currRow}`).value = getUI('acv');

    for (let col = 1; col <= 8; col++) {
        const cell = worksheet.getRow(currRow).getCell(col);
        cell.font = { name: 'Arial', size: 9 };
        cell.alignment = alignCenter;
        cell.border = borderThin;
    }
    currRow += 1; 

    currRow += 1; 
    worksheet.mergeCells(`A${currRow}:H${currRow}`);
    const sT = worksheet.getCell(`A${currRow}`);
    sT.value = 'TIME'; sT.fill = grayFill; sT.font = fontGroup; sT.alignment = alignCenter; sT.border = borderThin;

    currRow += 1; 
    worksheet.getCell(`A${currRow}`).value = 'NO.';
    worksheet.mergeCells(`B${currRow}:C${currRow}`); worksheet.getCell(`B${currRow}`).value = 'FULL TIME';
    worksheet.mergeCells(`D${currRow}:E${currRow}`); worksheet.getCell(`D${currRow}`).value = 'RUNTIME';
    worksheet.mergeCells(`F${currRow}:H${currRow}`); worksheet.getCell(`F${currRow}`).value = 'DOWNTIME';

    [`A${currRow}`, `B${currRow}`, `D${currRow}`, `F${currRow}`].forEach(pos => {
        const cell = worksheet.getCell(pos);
        cell.font = fontPart; cell.border = borderThin; cell.alignment = alignCenter;
    });

    const cleanHistory = history.length > 0 ? history : [{
        model_fulltime: document.getElementById("timer")?.innerText || "00:00:00",
        model_runtime: document.getElementById("runtime")?.innerText || "00:00:00",
        model_downtime: document.getElementById("downtime")?.innerText || "00:00:00"
    }];

    cleanHistory.forEach((hItem, idx) => {
        currRow += 1; 
        worksheet.getCell(`A${currRow}`).value =`${idx + 1}.`;
        
        worksheet.mergeCells(`B${currRow}:C${currRow}`); worksheet.getCell(`B${currRow}`).value = normalizeToExcelTime(hItem.model_fulltime);
        worksheet.mergeCells(`D${currRow}:E${currRow}`); worksheet.getCell(`D${currRow}`).value = normalizeToExcelTime(hItem.model_runtime);
        worksheet.mergeCells(`F${currRow}:H${currRow}`); worksheet.getCell(`F${currRow}`).value = normalizeToExcelTime(hItem.model_downtime);

        for (let col = 1; col <= 8; col++) {
            const cell = worksheet.getRow(currRow).getCell(col);
            cell.border = borderThin; cell.font = fontIsi; cell.alignment = alignCenter;
        }
    });

    currRow += 2; 

    worksheet.mergeCells(`A${currRow}:H${currRow}`);
    const sDtSheet = worksheet.getCell(`A${currRow}`);
    sDtSheet.value = 'DOWNTIME INFORMATION SHEET'; 
    sDtSheet.fill = grayFill; 
    sDtSheet.font = fontGroup; 
    sDtSheet.alignment = alignCenter; 
    sDtSheet.border = borderThin;

    currRow += 1; 
    worksheet.getCell(`A${currRow}`).value = 'NO.';
    worksheet.getCell(`B${currRow}`).value = 'START';
    worksheet.getCell(`C${currRow}`).value = 'STOP';
    worksheet.getCell(`D${currRow}`).value = 'TOTAL';
    worksheet.mergeCells(`E${currRow}:H${currRow}`); 
    worksheet.getCell(`E${currRow}`).value = 'REMARKS / REASON';

    [`A${currRow}`, `B${currRow}`, `C${currRow}`, `D${currRow}`, `E${currRow}`].forEach(pos => {
        const cell = worksheet.getCell(pos);
        cell.font = fontPart; 
        cell.border = borderThin; 
        cell.alignment = alignCenter;
    });

    const cleanDowntimeLogs = downtimeLogs.length > 0 ? downtimeLogs : [null];

    cleanDowntimeLogs.forEach((dataLog, idx) => {
        currRow += 1;
        worksheet.getCell(`A${currRow}`).value = `${idx + 1}.`;
        
        if (dataLog) {
            worksheet.getCell(`B${currRow}`).value = normalizeToExcelTime(dataLog.start);
            worksheet.getCell(`C${currRow}`).value = normalizeToExcelTime(dataLog.end);
            
            let totalDisplay = "00:00:00";
            if (dataLog.durationMs !== undefined) {
                totalDisplay = formatTimeFromMs(dataLog.durationMs);
            } else if (dataLog.duration !== undefined) {
                totalDisplay = formatTimeFromMs(dataLog.duration * 60000);
            }

            worksheet.getCell(`D${currRow}`).value = totalDisplay;
            worksheet.mergeCells(`E${currRow}:H${currRow}`);
            worksheet.getCell(`E${currRow}`).value = dataLog.reason || "-";
        } else {
            worksheet.getCell(`B${currRow}`).value = "-";
            worksheet.getCell(`C${currRow}`).value = "-";
            worksheet.getCell(`D${currRow}`).value = "00:00:00";
            worksheet.mergeCells(`E${currRow}:H${currRow}`);
            worksheet.getCell(`E${currRow}`).value = "-";
        }

        for (let col = 1; col <= 8; col++) {
            const cell = worksheet.getRow(currRow).getCell(col);
            cell.border = borderThin; 
            cell.font = fontIsi; 
            cell.alignment = alignCenter;
        }
    });

    currRow += 2; 

    worksheet.mergeCells(`A${currRow}:H${currRow}`);
    const sQty = worksheet.getCell(`A${currRow}`);
    sQty.value = 'QTY'; sQty.fill = grayFill; sQty.font = fontGroup; sQty.alignment = alignCenter; sQty.border = borderThin;

    currRow += 1;
    const qtyHeaders = ['NO.', 'TARGET', 'UPH', 'IDEAL', 'GOOD', 'NOGOOD'];
    qtyHeaders.forEach((h, idx) => {
        const cell = worksheet.getRow(currRow).getCell(idx + 1);
        cell.value = h; cell.font = fontPart; cell.border = borderThin; cell.alignment = alignCenter;
    });
    worksheet.mergeCells(`G${currRow}:H${currRow}`);
    worksheet.getCell(`G${currRow}`).value = 'TOTAL QTY';
    worksheet.getCell(`G${currRow}`).font = fontPart; worksheet.getCell(`G${currRow}`).border = borderThin; worksheet.getCell(`G${currRow}`).alignment = alignCenter;

    const cleanQtyHistory = history.length > 0 ? history : [{
        target: document.getElementById('trg')?.innerText || "0",
        uph: document.getElementById('uph')?.innerText || document.getElementById('uph_val')?.innerText || "0",
        ideal: document.getElementById('iqty')?.innerText || "0",
        good: document.getElementById('gd')?.innerText || "0",
        nogood: document.getElementById('ng')?.innerText || "0",
        total_qty: document.getElementById('tqty')?.innerText || "0"
    }];

    cleanQtyHistory.forEach((qItem, idx) => {
        currRow += 1; 
        worksheet.getCell(`A${currRow}`).value = `${idx + 1}.`;
        worksheet.getCell(`B${currRow}`).value = Number(qItem.target) || 0;
        worksheet.getCell(`C${currRow}`).value = Number(qItem.uph) || 0;
        worksheet.getCell(`D${currRow}`).value = Number(qItem.ideal) || 0;
        worksheet.getCell(`E${currRow}`).value = Number(qItem.good) || 0;
        worksheet.getCell(`F${currRow}`).value = Number(qItem.nogood) || 0;
        
        worksheet.mergeCells(`G${currRow}:H${currRow}`);
        worksheet.getCell(`G${currRow}`).value = Number(qItem.total_qty) || 0;

        for (let col = 1; col <= 8; col++) {
            const cell = worksheet.getRow(currRow).getCell(col);
            cell.border = borderThin; cell.font = fontIsi; cell.alignment = alignCenter;
        }
    });

    currRow += 2; 
    worksheet.mergeCells(`A${currRow}:H${currRow}`);
    const sQis = worksheet.getCell(`A${currRow}`);
    sQis.value = 'QUALITY INFORMATION SHEET'; 
    sQis.fill = grayFill; sQis.font = fontGroup; sQis.alignment = alignCenter; sQis.border = borderThin;

    currRow += 1;
    worksheet.getCell(`A${currRow}`).value = 'NO.';
    
    worksheet.mergeCells(`B${currRow}:C${currRow}`); 
    worksheet.getCell(`B${currRow}`).value = 'NG ITEM'; 
    
    worksheet.getCell(`D${currRow}`).value = 'LOC'; 
    worksheet.getCell(`E${currRow}`).value = 'QTY'; 
    
    worksheet.mergeCells(`F${currRow}:H${currRow}`); 
    worksheet.getCell(`F${currRow}`).value = 'REMARKS'; 

    ['A', 'B', 'D', 'E', 'F'].forEach(col => {
        const cell = worksheet.getCell(`${col}${currRow}`);
        cell.font = fontPart; cell.border = borderThin; cell.alignment = alignCenter;
    });

    const groupNG = {};
    ngLogs.forEach(l => {
        const key = `${l.reason}`;
        if (!groupNG[key]) groupNG[key] = { reason: l.reason, loc: l.location || "-", qty: 0 };
        groupNG[key].qty++;
    });
    const cleanNGLogs = Object.values(groupNG).length > 0 ? Object.values(groupNG) : [null];

    cleanNGLogs.forEach((dataNG, idx) => {
        currRow += 1;
        const row = worksheet.getRow(currRow);
        
        row.getCell(1).value = `${idx + 1}.`; 
        worksheet.mergeCells(`B${currRow}:C${currRow}`);
        row.getCell(2).value = dataNG ? dataNG.reason : "-";
        row.getCell(4).value = dataNG ? dataNG.loc : "-";
        row.getCell(5).value = dataNG ? dataNG.qty : 0; 
        worksheet.mergeCells(`F${currRow}:H${currRow}`);
        row.getCell(6).value = "-"; 

        for (let col = 1; col <= 8; col++) {
            const cell = row.getCell(col);
            cell.border = borderThin; 
            cell.font = fontIsi; 
            cell.alignment = alignCenter;
        }
    });

    currRow += 2; 

    worksheet.mergeCells(`A${currRow}:C${currRow}`);
    const sOpList = worksheet.getCell(`A${currRow}`);
    sOpList.value = 'OPERATOR LIST'; sOpList.fill = grayFill; sOpList.font = fontGroup; sOpList.alignment = alignCenter; sOpList.border = borderThin;

    worksheet.mergeCells(`D${currRow}:H${currRow}`);
    const sOutModel = worksheet.getCell(`D${currRow}`);
    sOutModel.value = 'OUTPUT MODEL'; sOutModel.fill = grayFill; sOutModel.font = fontGroup; sOutModel.alignment = alignCenter; sOutModel.border = borderThin;

    currRow += 1; 
    worksheet.getCell(`A${currRow}`).value = 'NO.';
    worksheet.getCell(`B${currRow}`).value = 'PROCESS';
    worksheet.getCell(`C${currRow}`).value = 'NAME';
    
    worksheet.mergeCells(`D${currRow}:E${currRow}`); 
    worksheet.getCell(`D${currRow}`).value = 'MODEL';
    worksheet.getCell(`F${currRow}`).value = 'START';
    worksheet.getCell(`G${currRow}`).value = 'END';
    worksheet.getCell(`H${currRow}`).value = 'OUTPUT';

    [`A${currRow}`, `B${currRow}`, `C${currRow}`, `D${currRow}`, `F${currRow}`, `G${currRow}`, `H${currRow}`].forEach(pos => {
        const cell = worksheet.getCell(pos);
        cell.font = fontPart; cell.border = borderThin; cell.alignment = alignCenter;
    });

    const cleanOpHistory = history.length > 0 ? history : [{
        model_name: localStorage.getItem('model') || "-",
        model_start: localStorage.getItem('model_start_clock') || "-",
        model_end: new Date().toLocaleTimeString('id-ID'),
        good: document.getElementById('gd')?.innerText || "0"
    }];

    cleanOpHistory.forEach((opItem, idx) => {
        currRow += 1; 
        worksheet.getCell(`A${currRow}`).value = `${idx + 1}.`;
        worksheet.getCell(`B${currRow}`).value = "-";
        worksheet.getCell(`C${currRow}`).value = "-";
        worksheet.mergeCells(`D${currRow}:E${currRow}`);
        worksheet.getCell(`D${currRow}`).value = opItem.model_name; 
        worksheet.getCell(`F${currRow}`).value = normalizeToExcelTime(opItem.model_start); 
        worksheet.getCell(`G${currRow}`).value = normalizeToExcelTime(opItem.model_end);   
        worksheet.getCell(`H${currRow}`).value = Number(opItem.good) || 0

        for (let col = 1; col <= 8; col++) {
            const cell = worksheet.getRow(currRow).getCell(col);
            cell.border = borderThin; cell.font = fontIsi; cell.alignment = alignCenter;
        }
    });

    currRow += 2;
    let signStart = currRow;
    
    [
        { titles: ['ISSUED', 'SOP'], col: 'F' },
        { titles: ['CHECKED', 'LEADER'], col: 'G' },
        { titles: ['APPROVED', 'SPV'], col: 'H' }
    ].forEach((s) => {
        const targetCol = s.col;
        
        const c1 = worksheet.getCell(`${targetCol}${currRow}`);
        c1.value = s.titles[0]; 
        c1.font = fontGroup; 
        c1.alignment = alignCenter;
        c1.border = borderThin;

        const c2 = worksheet.getCell(`${targetCol}${currRow + 4}`);
        c2.value = s.titles[1]; 
        c2.font = fontGroup; 
        c2.alignment = alignCenter;
        c2.border = borderThin;

        worksheet.mergeCells(`${targetCol}${currRow + 1}:${targetCol}${currRow + 3}`);

        for (let r = 1; r <= 3; r++) {
            worksheet.getCell(`${targetCol}${currRow + r}`).border = borderThin;
        }
    });

    if (typeof applyOuterBold === "function") {
        applyOuterBold(worksheet, 'F', signStart, 'H', currRow + 4);
    }

    worksheet.getRow(1).height = 22;

    const shiftName = localStorage.getItem('shift') || "UNK-SHIFT";
    const groupName = localStorage.getItem('group') || "UNK-GROUP";
    const modelName = localStorage.getItem('model') || "UNK-TYPE";
    const d = new Date();
    const tgl = d.getDate().toString().padStart(2, '0') + '-' + 
                (d.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                d.getFullYear();
    const fileName = `OEE - ${tgl} - ${shiftName} - ${groupName} - ${modelName}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();

    const stopTimeStr = formatDateTime(new Date());

    const dataOeeExport = {
        targetFile: "OEE_MASTER",
        machine: localStorage.getItem('machine') || "MC-TEST",
        operator: "Group " + (localStorage.getItem('group') || "A"),
        model: modelName,
        customer: localStorage.getItem('cst') || "CST-TEST",
        start: localStorage.getItem('model_start_clock') || "00:00",
        oee: document.getElementById('oee')?.innerText || "0%",
        avb: document.getElementById('avb')?.innerText || "0%",
        pfm: document.getElementById('pfm')?.innerText || "0%",
        qly: document.getElementById('qly')?.innerText || "0%",
        acv: document.getElementById('acv')?.innerText || "0%",
        real_cycle: localStorage.getItem("realCycleVal") || "0.00",
        std_cycle: parseFloat(localStorage.getItem("cycle_val") || "0").toFixed(2),
        good: localStorage.getItem('good') || "0",
        ng: localStorage.getItem('nogood') || "0",
        run_time: document.getElementById("runtime")?.innerText || "00:00:00",
        down_time: document.getElementById("downtime")?.innerText || "00:00:00",
        stop_time: stopTimeStr
    };
    sendToServer(dataOeeExport);

    saveAs(new Blob([buffer]), fileName);
    
    history.pop();
    localStorage.setItem("production_history", JSON.stringify(history));
};

const SERVER_HOSTS = [
'http://localhost:3000'  // ← ganti IP PC Utama
];

async function sendToServer(payload) {
    for (const host of SERVER_HOSTS) {
        try {
            const res = await fetch(`${host}/api/save-pabrik`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(4000)
            });
            if (res.ok) {
                console.log(`[HTTP] Sukses ke: ${host}`);
                return true;
            }
        } catch (err) {
            console.warn(`[HTTP] Gagal ke ${host}:`, err.message);
        }
    }
    console.error('[HTTP] Semua server gagal.');
    return false;
}

function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
}

function startTime() {
    const now = new Date();

    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");

    const timeString = `${h}:${m}:${s}`;

    const top = document.getElementById('txt');
    if (top) top.innerText = timeString;

    const dateStr =
        String(now.getDate()).padStart(2, '0') + '/' +
        String(now.getMonth() + 1).padStart(2, '0') + '/' +
        now.getFullYear();

    const dateEl = document.getElementById("current-date");
    if (dateEl) dateEl.innerText = dateStr;

    const startClock = localStorage.getItem("model_start_clock");

    let fullTime = "00:00:00";

    if (startClock && startClock.includes(":")) {
        const [h0, m0] = startClock.split(":").map(Number);

        const start = new Date();
        start.setHours(h0, m0, 0, 0);

        if (now < start) start.setDate(start.getDate() - 1);

        let diff = now - start;
        if (diff < 0) diff = 0;

        fullTime = formatTime(diff);
    }

    const fullEl = document.getElementById("timer");
    if (fullEl) fullEl.innerText = fullTime;

    const bottomClock = document.getElementById("txt-bottom");
    if (bottomClock) bottomClock.innerText = timeString;

    setTimeout(startTime, 1000);
}

function initKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
        const k = e.key.toLowerCase();
        if (/^\d$/.test(k)) {
            sequence = (sequence + k).slice(-5);
            if (sequence === "77788") {
                updateQty("nogood", 1);
                sequence = "";
        }} else { sequence = ""; }

        switch (k) {
            case 'z': updateQty("good", 1); break;
            case 's': toggleSwiperAutoplay(); break;
            case ' ': e.preventDefault(); toggleDowntime(); break;
            case 'r': e.preventDefault(); window.resetData(); break;
            case 'd': e.preventDefault(); window.openConfig(); break;
            case 'e': e.preventDefault(); window.exportToExcel(); break;
            case 'arrowright': if (swiperInstance) swiperInstance.slideNext(); break;
            case 'arrowleft': if (swiperInstance) swiperInstance.slidePrev(); break;
            case 'escape': e.preventDefault(); Swal.close(); break;
        }
    });
}

function toggleSwiperAutoplay() {
    const run = swiperInstance.autoplay.running;
    run ? swiperInstance.autoplay.stop() : swiperInstance.autoplay.start();
    Swal.fire({ 
        toast: true, position: 'top-end', icon: run ? 'info' : 'success', 
        title: run ? 'Stopped' : 'Started', showConfirmButton: false, timer: 1000 
    });
}

function getScheduleConfig() {
    return {
        1: { 8: { start: "07:00", end: "15:00", breaks: [{s: "11:15", e: "12:00"}, {s: "13:15", e: "13:30"}] },
             5: { start: "07:00", end: "12:00", breaks: [{s: "10:45", e: "11:00"}] }} ,
        2: { 8: { start: "15:00", end: "23:00", breaks: [{s: "16:45", e: "17:00"}, {s: "18:30", e: "19:15"}] },
             5: { start: "12:00", end: "17:00", breaks: [{s: "15:45", e: "16:00"}] } },
        3: { 8: { start: "23:00", end: "07:00", breaks: [{s: "02:40", e: "03:20"}, {s: "05:10", e: "05:30"}] },
             5: { start: "17:00", end: "22:00", breaks: [{s: "18:45", e: "19:00"}] } }
    };
}

function isWorkTime() {
    const shift = parseInt(localStorage.getItem('shift')) || 1;
    const hoursConfig = parseInt(localStorage.getItem('rawPlannedTime')) || 8;
    const now = new Date();
    const currentTime = (now.getHours() * 60) + now.getMinutes();
    const config = getScheduleConfig()[shift][hoursConfig];
    if (!config) return false;
    const toMin = (timeStr) => { const [h, m] = timeStr.split(':').map(Number); return (h * 60) + m; };
    const startMin = toMin(config.start);
    const endMin = toMin(config.end);
    let isWorking = (startMin > endMin) ? (currentTime >= startMin || currentTime < endMin) : (currentTime >= startMin && currentTime < endMin);
    if (!isWorking) return false;
    for (const b of config.breaks) { if (currentTime >= toMin(b.s) && currentTime < toMin(b.e)) return false; }
    return true;
}

window.resetData = () => Swal.fire({
    title: 'Reset?', text: "Clear all data!", icon: 'warning',
    showCancelButton: true, confirmButtonText: 'Yes'
}).then(r => { if (r.isConfirmed) { localStorage.clear(); location.reload(); } });

const ws = new WebSocket('ws://192.168.58.71:8000');
ws.onmessage = (event) => {
    if (event.data === 'z') {
       updateQty("good", 1);
    }
};
