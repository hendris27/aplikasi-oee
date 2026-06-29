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
    try {
        return JSON.parse(localStorage.getItem('type_presets') || '{}');
    } catch (e) { return {}; }
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

                if (data.type) {
                    saveTypePreset(data.type, data);
                    c++;
                }
            }
            return c;
        }

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
    }
}

function getDynamicTarget() {
    const targetModel = Number(localStorage.getItem("target_model_fixed")) || 0;
    if (targetModel <= 0) return 0;
    return targetModel;
}

document.addEventListener("DOMContentLoaded", async function () {
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
            disableOnInteraction: false
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true
        }
    });

    if (localStorage.getItem("shiftStartedFlag") === "true") {
        startOEE();
        const currentMode = localStorage.getItem("mode");
        const hasReason = localStorage.getItem("downtimeGroup");

        if (currentMode === "down" && !hasReason && isWorkTime()) {
            setTimeout(() => {
                window.toggleDowntime(true);
            }, 500);
        }
    }

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
                        <option value="auto">Auto (Sesuai Jam Sekarang)</option>
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

        if (isStarted && oldModel && oldModel !== "" && oldModel !== form.model) {
            await Swal.fire({
                icon: 'warning',
                title: 'Reset First!',
                text: 'Cannot change the model without a reset!',
                confirmButtonText: 'OK'
            });
            return;
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

        let resolvedShift = form.shift;
        if (form.shift === 'auto') {
            resolvedShift = String(detectShiftByTime(parseInt(form.time) || 8));
        }
        localStorage.setItem("shift", resolvedShift);
        localStorage.setItem("group", form.group);
        localStorage.setItem("qty_Pallet", form.qty_Pallet);
        localStorage.setItem("target_model_fixed", form.target);

        const uphNum = form.uph || 0;
        const qty_Pallet = form.qty_Pallet || 0;
        const cycleBase = uphNum > 0 ? (3600 / uphNum).toFixed(2) : "0";
        const cycleDisplay = uphNum > 0 ? (cycleBase * qty_Pallet).toFixed(2) : "0";
        localStorage.setItem("cycle_val_base", cycleBase);
        localStorage.setItem("cycle_val_display", cycleDisplay);

        if (!isStarted) {
            localStorage.setItem("shiftStartedFlag", "true");
            localStorage.setItem("model_start_clock", timeNowStr);
            localStorage.setItem("model_start_ms", Date.now().toString());
            localStorage.setItem("lastProductTime", now.toString());
            localStorage.setItem("lastModeUpdateTime", now.toString());
            localStorage.setItem("mode", "run");
            startOEE();
        }
        Swal.fire({
            icon: 'success',
            title: 'Data Saved',
            text: form.shift === 'auto' ? `Shift ${resolvedShift}` : undefined,
            timer: form.shift === 'auto' ? 1800 : 1000,
            showConfirmButton: false
        });
        renderAll();
        flushLivePush();
    }
};

window.toggleDowntime = async function (isAuto = false) {
    if (localStorage.getItem("shiftStartedFlag") !== "true") return;

    let mode = localStorage.getItem("mode") || "run";
    if (isAuto || mode === "run") localStorage.setItem("mode", "down");
    if (Swal.isVisible() && !isAuto) { Swal.close(); return; }

    const reasons = [
        "Not Filled In Yet", "5S", "CHANGE LABEL / RIBBON", "ELECTRICAL STAGE PROBLEM", "EQUIPMENT / M/C PROBLEM", "EQUIP SOLDER PROBLEM", "FCT / ICT / LIGHT PROBLEM", "JIG / PALLET PROBLEM", "KEYENCE PROBLEM", "MATERIAL PROBLEM", "MEETING", "MP FCV OJT", "MP FV OJT", "MP INSERT OJT", "NG FCT",
        "NG PALLET", "ODEN CHECK", "OVER CHANGE MODEL", "PREPARE LINE", "PROBLEM ALARM SELBO", "PROBLEM CGS", "PROBLEM NG TRAY", "PROBLEM SOLDERABILITY", "PROBLEM W/T SELBO / SELECTIVE", "QUALITY PROBLEM", "ROMWRITE / TAISI PROB", "SCREW PROBLEM", "TOP UP",
        "TRAINING", "TRAINING MP FCT", "TRAINING MP INSERT", "WAITING COATING/CURING", "WAITING ENGINEERING", "WAITING FCT COMMON", "WAITING MATERIAL", "WAITING PACKAGING", "WAITING PALLET", "WAITING PCB", "WAITING TEMPERATURE", "WAITING TRAY", "OTHERS (CUSTOM INPUT)"
    ];
    const reasonCategoryMap = {
        "Not Filled In Yet": "LOST", "5S": "LOST", "CHANGE LABEL / RIBBON": "LOST", "MEETING": "LOST", "MP FCV OJT": "LOST", "MP FV OJT": "LOST", "MP INSERT OJT": "LOST", "ODEN CHECK": "LOST", "PREPARE LINE": "LOST", "TOP UP": "LOST", "TRAINING": "LOST",
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
        localStorage.setItem("lastModeUpdateTime", Date.now().toString());
        localStorage.setItem("mode", "down");

    } else {
        if (!isAuto) {
            const currentRuntimeMs = parseInt(localStorage.getItem("runtimeTotal") || 0);
            const newRunStartMs = Date.now() - currentRuntimeMs;
            localStorage.setItem("model_start_ms", newRunStartMs.toString());

            localStorage.setItem("lastModeUpdateTime", Date.now().toString());

            localStorage.setItem("mode", "run");
            localStorage.removeItem("downtimeGroup");
            localStorage.removeItem("downtimeCategory");
            localStorage.removeItem("downtime_start_time_ms");
            localStorage.removeItem("downtime_start_clock_str");
        }
    }
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
            'UNSMOTH', 'VOID', 'UPPER', 'WAIT SCAN', 'WHITE DOT', 'WRAP', 'WRONG COMPONENT', 'WRONG INSERT', 'WRONG POSITION', 'WRONG PCB', 'WRONG POLARITY', 'OTHERS (Custom Input)'
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
            let cycleLogs = JSON.parse(localStorage.getItem("real_cycle_logs") || "[]");

            cycleLogs.push(parseFloat(localStorage.getItem("realCycleVal")));

            localStorage.setItem("real_cycle_logs", JSON.stringify(cycleLogs));

            const avgCycle =
                cycleLogs.reduce((a, b) => a + b, 0) / cycleLogs.length;

            localStorage.setItem("realCycleAvg", avgCycle.toFixed(2));

            const uphNum = parseInt(localStorage.getItem("uph_display") || "0");
            const targetCycleTime = uphNum > 0 ? 3600 / uphNum : 0;
            const actualCycleTime = parseFloat(localStorage.getItem("realCycleVal")) || 0;

            if (targetCycleTime > 0 && actualCycleTime > targetCycleTime) {
                const overage = (actualCycleTime - targetCycleTime);
                
                if (localStorage.getItem('autoLogCycleOverage') === 'true') {
                    const dtRecord = {
                        date: new Date().toISOString().split('T')[0],
                        machine: localStorage.getItem('machine') || '-',
                        line: localStorage.getItem('line') || '-',
                        type: 'PERFORMANCE',
                        detail: `Cycle time overage: ${overage.toFixed(2)}s`,
                        time: formatDateTime(new Date()),
                        period: formatTime(overage * 1000),
                        durationMs: overage * 1000,
                        reason: 'Performance Loss - Cycle Overage',
                        category: 'LOSS',
                        model: localStorage.getItem("type") || '-',
                        start: formatDateTime(new Date(now - (actualCycleTime * 1000))),
                        end: formatDateTime(new Date(now))
                    };

                    let dtLogs = JSON.parse(localStorage.getItem("downtime_logs") || "[]");
                    dtLogs.push(dtRecord);
                    localStorage.setItem("downtime_logs", JSON.stringify(dtLogs));

                    let allDtLogs = JSON.parse(localStorage.getItem("all_downtime_logs") || "[]");
                    allDtLogs.push(dtRecord);
                    localStorage.setItem("all_downtime_logs", JSON.stringify(allDtLogs));

                    sendToServer('/api/save-downtime', dtRecord);
                    
                    console.log(`[CYCLE] ✅ Auto-downtime logged: ${overage.toFixed(2)}s`);
                }
            }

            if (localStorage.getItem("mode") === "down") {
                if (Swal.isVisible()) Swal.close();

                let dtStartMs = parseInt(localStorage.getItem("downtime_start_time_ms"));
                let dtStartClock = localStorage.getItem("downtime_start_clock_str");
                const reason = localStorage.getItem("downtimeGroup") || "Not Filled In Yet";
                const category = localStorage.getItem("downtimeCategory") || "LOST";

                if (!dtStartMs) {
                    dtStartMs = Date.now();
                    dtStartClock = formatDateTime(new Date(dtStartMs));
                    localStorage.setItem("downtime_start_time_ms", dtStartMs.toString());
                    localStorage.setItem("downtime_start_clock_str", dtStartClock);
                    localStorage.setItem("downtimeGroup", reason);
                    localStorage.setItem("downtimeCategory", category);
                }

                const dtEndMs = Date.now();
                const dtEndClock = formatDateTime(new Date(dtEndMs));
                const durationMs = dtEndMs - dtStartMs;

                const dtRecord = {
                    date: new Date().toISOString().split('T')[0],
                    machine: localStorage.getItem('machine') || '-',
                    model: localStorage.getItem("type") || '-',
                    type: category,
                    detail: reason,
                    time: dtStartClock,
                    period: formatTime(durationMs),
                    start: dtStartClock,
                    end: dtEndClock,
                    durationMs: durationMs,
                    reason: reason,
                    category: category,
                    line: localStorage.getItem('line') || '-',
                    tech: '', job: '', executor: '', solution: ''
                };


                let logs = JSON.parse(localStorage.getItem("downtime_logs") || "[]");
                logs.push(dtRecord);
                localStorage.setItem("downtime_logs", JSON.stringify(logs));

                let allDtLogs = JSON.parse(localStorage.getItem("all_downtime_logs") || "[]");
                allDtLogs.push(dtRecord);
                localStorage.setItem("all_downtime_logs", JSON.stringify(allDtLogs));

                sendToServer('/api/save-downtime', dtRecord);
            }

            localStorage.setItem("mode", "run");
            localStorage.removeItem("downtimeGroup");
            localStorage.removeItem("downtime_start_time_ms");
            localStorage.removeItem("downtime_start_clock_str");
            localStorage.removeItem("autoPopupShowed");
            if (Swal.isVisible()) {
                Swal.hideLoading();
                Swal.close();
            }
        } else {
            g = Math.max(0, g - qtyPallet);
        }
        localStorage.setItem("good", g);
    }

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

        let isResting = config.breaks.some(b => {
            const breakStart = toMin(b.s);
            const breakEnd = toMin(b.e);
            return currentTime >= breakStart && currentTime < breakEnd;
        });

        window.breakDismissed = window.breakDismissed || false;

        if (isResting && isInsideShift) {

            if (!window.breakDismissed && !Swal.isVisible()) {
                Swal.fire({
                    icon: "info",
                    title: "BREAK TIME",
                    showConfirmButton: true,
                    confirmButtonText: "OK",
                    allowOutsideClick: true,
                }).then(() => {
                    window.breakDismissed = true;
                });
            }

            renderAll();
            return;
        }

        if (!isResting) { window.breakDismissed = false; }
        if (!isInsideShift) {
            renderAll();
            return;
        }

        const now = Date.now();
        const lastUpd = parseInt(localStorage.getItem("lastModeUpdateTime")) || now;
        const elapsed = now - lastUpd;
        localStorage.setItem("lastModeUpdateTime", now.toString());

        const mode = localStorage.getItem("mode") || "run";
        const cycleAlarm = parseFloat(localStorage.getItem("cycle_val_display")) || 0;

        if (mode === "run") {
            let lastPStr = localStorage.getItem("lastProductTime");
            const shiftStartMs = parseInt(localStorage.getItem("model_start_ms")) || now;

            if (!lastPStr || parseInt(lastPStr) < shiftStartMs) {
                localStorage.setItem("lastProductTime", shiftStartMs.toString());
                lastPStr = shiftStartMs.toString();
            }

            const lastP = parseInt(lastPStr);
            const diffSeconds = (now - lastP) / 1000;

            if (cycleAlarm > 0 && diffSeconds > cycleAlarm) {
                console.log("Downtime Detected! Target:", cycleAlarm, "Actual:", diffSeconds.toFixed(2));

                if (!Swal.isVisible()) {
                    if (localStorage.getItem("mode") !== "down") {
                        const timeStartStr = formatDateTime(new Date());
                        localStorage.setItem("downtime_start_time_ms", Date.now().toString());
                        localStorage.setItem("downtime_start_clock_str", timeStartStr);
                    }

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

    const cycBase = float(get("cycle_val_base")) || cyc;
    const cycDisplay = float(get("cycle_val_display")) || cyc;

    const idealModelQty = cycDisplay > 0 ? Math.floor(modelTotalSeconds / cycDisplay) * qtyPallet : 0;
    localStorage.setItem("idealqty", idealModelQty);

    const avb = (ma > 0) ? (mr / ma) * 100 : 0;

    let pfm = (ma > 0 && cycBase > 0) ? ((mt * cycBase) / (ma / 1000)) * 100 : 0;

    const qly = (mt > 0) ? (mg / mt) * 100 : 0;
    const oee = Math.min((avb * pfm * qly) / 10000, 100);

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
            color = "#E8083E";
        }

        const textColor = color === "transparent" ? "" : "white";
        const p = el.parentElement;
        if (p) {
            p.style.backgroundColor = color;
            p.style.color = textColor;
        }
        if (id === "oee") {
            const boxT = document.getElementById("box-teks");
            if (boxT && boxT.parentElement) {
                boxT.parentElement.style.backgroundColor = color;
                boxT.parentElement.style.color = textColor;
            }
        }
    };

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
        dateEl.innerText = tglStr;
    }

    const startMs = Number(localStorage.getItem("model_start_ms") || 0);

    let fullTimeDisplay = "00:00:00";

    if (startMs > 0) {
        const diff = Date.now() - startMs;
        fullTimeDisplay = formatTime(diff);
    }

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
    set("cyc", cycDisplay.toFixed(2));
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
            diffEl.innerText = "";
        }
    }

    if (elLine) {
        const line = get("line") || "LINE";
        const machine = get("machine") || "MACHINE";
        const shift = get("shift") || " ";
        const group = get("group") || " ";

        if (line === "LINE" && machine === "MACHINE" && shift === " " && group === " ") {
            elLine.innerText = "BACKEND";
        } else {
            elLine.innerText = `${shift}. GROUP ${group}, ${line}, ${machine}`.toUpperCase();
        }
    }
    if (elModel) {
        elModel.innerText = (get("model") || "OEE PROGRAM").toUpperCase();
    }

    localStorage.setItem("oee_val", oee.toFixed(1));
    localStorage.setItem("avb_val", avb.toFixed(1));
    localStorage.setItem("pfm_val", pfm.toFixed(1));
    localStorage.setItem("qly_val", qly.toFixed(1));
    localStorage.setItem("acv_val", acv.toFixed(1));
    localStorage.setItem("efc_val", efc.toFixed(1));

    queueLivePush({
        line: get("line") || '-',
        machine: get("machine") || '-',
        model: get("model") || '-',
        shift: get("shift") || '-',
        group: get("group") || '-',
        customer: get("cst") || '-',
        mode: mode,
        started: get("shiftStartedFlag") === "true",
        run_start_ms: parseInt(localStorage.getItem("model_start_ms") || Date.now()),
        down_start_ms: mode === "down" ? parseInt(localStorage.getItem("downtime_start_time_ms") || Date.now()) : null,

        oee: oee.toFixed(1),
        avb: avb.toFixed(1),
        pfm: pfm.toFixed(1),
        qly: qly.toFixed(1),
        efc: efc.toFixed(1),

        target: currentTarget,
        iqty: idealModelQty,
        tqty: mt,
        good: mg,
        ng: mn,

        acv: acv.toFixed(1),
        cyc: cycDisplay.toFixed(2),
        rcyc: get("realCycleVal") || "0.00",
        run_time: formatTime(mr),
        down_time: formatTime(md)
    });
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

async function saveOEEToServerOnly() {
    const stopTimeStr = formatDateTime(new Date());

    const oeeRecord = {
        date: new Date().toISOString().split('T')[0],
        machine: localStorage.getItem('machine') || '-',
        operator: 'Group ' + (localStorage.getItem('group') || '-'),
        model: localStorage.getItem('model') || '-',
        customer: localStorage.getItem('cst') || '-',
        shift: localStorage.getItem('shift') || '',
        group: localStorage.getItem('group') || '',
        line: localStorage.getItem('line') || '-',
        start: localStorage.getItem('model_start_clock') ||
            formatDateTime(
                new Date(
                    Number(localStorage.getItem('model_start_clock_ms') || 0)
                )
            ),
        oee: document.getElementById('oee')?.innerText || '0%',
        avb: document.getElementById('avb')?.innerText || '0%',
        pfm: document.getElementById('pfm')?.innerText || '0%',
        qly: document.getElementById('qly')?.innerText || '0%',
        acv: document.getElementById('acv')?.innerText || '0%',
        efc: document.getElementById('efc')?.innerText || '0%',
        real_cycle_avg: localStorage.getItem('realCycleAvg') || '0.00',
        good: localStorage.getItem('good') || '0',
        ng: localStorage.getItem('nogood') || '0',
        stop_time: stopTimeStr
    };

    await sendToServer('/api/save-oee', oeeRecord);
}

window.exportToExcel = async function () {
    if (typeof window.saveToHistory === "function") window.saveToHistory();
    const history = JSON.parse(localStorage.getItem("production_history") || "[]");
    const ngLogs = JSON.parse(localStorage.getItem("all_ng_logs") || "[]");
    const downtimeLogs = JSON.parse(localStorage.getItem("downtime_logs") || "[]");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('OEE Report');

    worksheet.columns = [
        { width: 3.8 }, { width: 13.8 }, { width: 13.8 }, { width: 13.8 }, { width: 13.8 }, { width: 13.8 }, { width: 13.8 }, { width: 13.8 }
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
        if (!timeStr) return '-';

        const str = String(timeStr).trim();
        if (str.includes(' ')) {
            return str.split(' ').pop();
        }
        return str;
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
    const efcValue = getUI('efc');

    console.log('EFC Export =', efcValue);

    worksheet.getCell(`F${currRow}`).value = efcValue;
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
        worksheet.getCell(`A${currRow}`).value = `${idx + 1}.`;

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

    var exportDate = new Date();
    var exportDateStr = exportDate.getFullYear() + '-' +
        String(exportDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(exportDate.getDate()).padStart(2, '0');
    var oeeHistory = JSON.parse(localStorage.getItem('oee_export_history') || '[]');
    const oeeRecord = {
        date: exportDateStr,
        machine: localStorage.getItem('machine') || '-',
        operator: 'Group ' + (localStorage.getItem('group') || '-'),
        model: modelName,
        customer: localStorage.getItem('cst') || '-',
        shift: localStorage.getItem('shift') || '',
        group: localStorage.getItem('group') || '',
        line: localStorage.getItem('line') || '-',
        start: localStorage.getItem('model_start_clock') || '-',
        oee: document.getElementById('oee')?.innerText || '0%',
        avb: document.getElementById('avb')?.innerText || '0%',
        pfm: document.getElementById('pfm')?.innerText || '0%',
        qly: document.getElementById('qly')?.innerText || '0%',
        acv: document.getElementById('acv')?.innerText || '0%',
        efc: document.getElementById('efc')?.innerText || '0%',
        avg_cycle: localStorage.getItem('realCycleAvg') || '0.00',
        std_cycle: parseFloat(localStorage.getItem('cycle_val_display') || '0').toFixed(2),
        good: localStorage.getItem('good') || '0',
        ng: localStorage.getItem('nogood') || '0',
        run_time: document.getElementById('runtime')?.innerText || '00:00:00',
        down_time: document.getElementById('downtime')?.innerText || '00:00:00',
        stop_time: stopTimeStr,
        target: localStorage.getItem('target') || '0',
        uph: localStorage.getItem('uph_display') || '0',
        ideal: localStorage.getItem('idealqty') || '0',
        downtime_logs: JSON.parse(localStorage.getItem('downtime_logs') || '[]'),
        ng_logs: JSON.parse(localStorage.getItem('all_ng_logs') || '[]'),
        production_history: history
    };
    oeeHistory.push(oeeRecord);
    localStorage.setItem('oee_export_history', JSON.stringify(oeeHistory));

    sendToServer('/api/save-oee', oeeRecord);

    saveAs(new Blob([buffer]), fileName);

    history.pop();
    localStorage.setItem("production_history", JSON.stringify(history));
};

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

    const startMs = Number(localStorage.getItem("model_start_ms") || 0);

    let fullTime = "00:00:00";

    if (startMs > 0) {
        const diff = Date.now() - startMs;
        fullTime = formatTime(diff);
    }

    const fullEl = document.getElementById("timer");
    if (fullEl) fullEl.innerText = fullTime;

    const bottomClock = document.getElementById("txt-bottom");
    if (bottomClock) bottomClock.innerText = timeString;

    setTimeout(startTime, 1000);
}

function initKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === 'z') {
            e.preventDefault();
            window.updateQty("good", 1);
        }
    }, true);

    document.addEventListener("keydown", (e) => {
        const k = e.key.toLowerCase();
        if (/^\d$/.test(k)) {
            sequence = (sequence + k).slice(-5);
            if (sequence === "77788") {
                window.updateQty("nogood", 1);
                sequence = "";
            }
        } else { sequence = ""; }

        switch (k) {
            case 's': toggleSwiperAutoplay(); break;
            case ' ': e.preventDefault(); window.toggleDowntime(); break;
            case 'r': e.preventDefault(); window.resetData(); break;
            case 'd': e.preventDefault(); window.openConfig(); break;
            case 'e': e.preventDefault(); window.exportToExcel(); break;
            case 'z': e.preventDefault(); window.updateQty("good", 1); break;
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

function detectShiftByTime(hoursConfig) {
    const now = new Date();
    const currentTime = (now.getHours() * 60) + now.getMinutes();
    const toMin = (timeStr) => { const [h, m] = timeStr.split(':').map(Number); return (h * 60) + m; };
    const config = getScheduleConfig();
    const shifts = [1, 2, 3];

    for (const shift of shifts) {
        const sc = config[shift]?.[hoursConfig];
        if (!sc) continue;
        const startMin = toMin(sc.start);
        const endMin = toMin(sc.end);
        const inRange = (startMin > endMin)
            ? (currentTime >= startMin || currentTime < endMin)
            : (currentTime >= startMin && currentTime < endMin);
        if (inRange) return shift;
    }

    let closest = shifts[0];
    let minDiff = Infinity;
    for (const shift of shifts) {
        const sc = config[shift]?.[hoursConfig];
        if (!sc) continue;
        const startMin = toMin(sc.start);
        let diff = startMin - currentTime;
        if (diff < 0) diff += 24 * 60;
        if (diff < minDiff) { minDiff = diff; closest = shift; }
    }
    return closest;
}

function getScheduleConfig() {
    return {
        1: {
            8: { start: "07:00", end: "15:00", breaks: [{ s: "11:15", e: "12:00" }, { s: "13:15", e: "13:30" }] },
            5: { start: "07:00", end: "12:00", breaks: [{ s: "10:45", e: "11:00" }] }
        },
        2: {
            8: { start: "15:00", end: "23:00", breaks: [{ s: "16:45", e: "17:00" }, { s: "18:30", e: "19:15" }] },
            5: { start: "12:00", end: "17:00", breaks: [{ s: "15:45", e: "16:00" }] }
        },
        3: {
            8: { start: "23:00", end: "07:00", breaks: [{ s: "02:40", e: "03:20" }, { s: "05:10", e: "05:30" }] },
            5: { start: "17:00", end: "22:00", breaks: [{ s: "18:45", e: "19:00" }] }
        }
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

let isResettingData = false;

function hasOeeReportInput() {
    const line = String(localStorage.getItem('line') || '').trim();
    const machine = String(localStorage.getItem('machine') || '').trim();
    const model = String(localStorage.getItem('model') || '').trim();

    return !!line && line !== '-' && !!machine && machine !== '-' && !!model && model !== '-';
}

window.resetData = async function (options = {}) {
    const skipConfirm = !!options.skipConfirm;
    const isStarted = localStorage.getItem('shiftStartedFlag') === 'true';
    if (!skipConfirm) {
        const result = await Swal.fire({
            title: 'Are you sure you want to stop?', icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Yes'
        });
        if (!result.isConfirmed) return;
    }

    isResettingData = true;
    if (livePushTimer) {
        clearTimeout(livePushTimer);
        livePushTimer = null;
    }
    pendingLivePayload = null;

    if (isStarted && hasOeeReportInput()) {
        const activeDtStartMs = parseInt(localStorage.getItem("downtime_start_time_ms"));
        if (activeDtStartMs && localStorage.getItem("mode") === "down") {
            const activeDtEndMs = Date.now();
            const activeDtDurationMs = activeDtEndMs - activeDtStartMs;
            if (activeDtDurationMs >= 1000) {
                const activeDtRecord = {
                    date: new Date().toISOString().split('T')[0],
                    machine: localStorage.getItem('machine') || '-',
                    model: localStorage.getItem("type") || '-',
                    type: localStorage.getItem("downtimeCategory") || "DOWN",
                    detail: localStorage.getItem("downtimeGroup") || "Not Filled In Yet",
                    time: localStorage.getItem("downtime_start_clock_str") || formatDateTime(new Date(activeDtStartMs)),
                    period: formatTime(activeDtDurationMs),
                    start: localStorage.getItem("downtime_start_clock_str") || formatDateTime(new Date(activeDtStartMs)),
                    end: formatDateTime(new Date(activeDtEndMs)),
                    durationMs: activeDtDurationMs,
                    reason: localStorage.getItem("downtimeGroup") || "Not Filled In Yet",
                    category: localStorage.getItem("downtimeCategory") || "DOWN",
                    line: localStorage.getItem('line') || '-',
                    tech: '', job: '', executor: '', solution: ''
                };
                let dtLogs = JSON.parse(localStorage.getItem("downtime_logs") || "[]");
                dtLogs.push(activeDtRecord);
                localStorage.setItem("downtime_logs", JSON.stringify(dtLogs));
                await sendToServer('/api/save-downtime', activeDtRecord);
                console.log('[Reset] Active downtime flushed to server:', activeDtRecord);
            }
        }

        if (typeof window.saveToHistory === 'function') window.saveToHistory();
        const history = JSON.parse(localStorage.getItem('production_history') || '[]');
        const stopTimeStr = formatDateTime(new Date());
        const exportDate = new Date();
        const exportDateStr = exportDate.getFullYear() + '-' +
            String(exportDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(exportDate.getDate()).padStart(2, '0');

        const modelName = localStorage.getItem('model') || '-';
        const oeeRecord = {
            date: exportDateStr,
            machine: localStorage.getItem('machine') || '-',
            operator: 'Group ' + (localStorage.getItem('group') || '-'),
            model: modelName,
            customer: localStorage.getItem('cst') || '-',
            shift: localStorage.getItem('shift') || '',
            group: localStorage.getItem('group') || '',
            line: localStorage.getItem('line') || '-',
            start: localStorage.getItem('model_start_clock') || '-',
            oee: document.getElementById('oee')?.innerText || '0',
            avb: document.getElementById('avb')?.innerText || '0',
            pfm: document.getElementById('pfm')?.innerText || '0',
            qly: document.getElementById('qly')?.innerText || '0',
            acv: document.getElementById('acv')?.innerText || '0',
            efc: document.getElementById('efc')?.innerText || '0',
            avg_cycle: localStorage.getItem('realCycleAvg') || '0.00',
            std_cycle: parseFloat(localStorage.getItem('cycle_val_display') || '0').toFixed(2),
            good: localStorage.getItem('good') || '0',
            ng: localStorage.getItem('nogood') || '0',
            run_time: document.getElementById('runtime')?.innerText || '00:00:00',
            down_time: document.getElementById('downtime')?.innerText || '00:00:00',
            stop_time: stopTimeStr,
            target: localStorage.getItem('target') || '0',
            uph: localStorage.getItem('uph_display') || '0',
            ideal: localStorage.getItem('idealqty') || '0',
            downtime_logs: JSON.parse(localStorage.getItem('downtime_logs') || '[]'),
            ng_logs: JSON.parse(localStorage.getItem('all_ng_logs') || '[]'),
            production_history: history
        };

        var oeeHistory = JSON.parse(localStorage.getItem('oee_export_history') || '[]');
        oeeHistory.push(oeeRecord);
        localStorage.setItem('oee_export_history', JSON.stringify(oeeHistory));

        const savedToApi = await sendToServer('/api/save-oee', oeeRecord);
        if (!savedToApi) {
            sendWsMessage({
                type: 'save_oee',
                record: oeeRecord
            });
        }
    }

    const savedExportHistory = localStorage.getItem('oee_export_history');
    const savedTypePresets = localStorage.getItem('type_presets');
    const lineBeingCleared = localStorage.getItem('line');
    
    localStorage.clear();
    if (savedExportHistory) localStorage.setItem('oee_export_history', savedExportHistory);
    if (savedTypePresets) localStorage.setItem('type_presets', savedTypePresets);
    
    await clearLiveStatus(lineBeingCleared);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('[STOP SHIFT] Reloading page...');
    location.reload();
};

const AUTO_DETECT_HOST = window.location.hostname;
const SERVER_HOSTS = [
    window.location.origin,
    `http://${AUTO_DETECT_HOST}:4000`
];
const LIVE_LOCAL_LINES_KEY = 'oee_live_lines';

function getLocalLiveLines() {
    try {
        return JSON.parse(localStorage.getItem(LIVE_LOCAL_LINES_KEY) || '{}') || {};
    } catch (e) {
        return {};
    }
}

function upsertLocalLiveLine(payload) {
    if (!payload || !payload.line || payload.line === '-') return;
    const lines = getLocalLiveLines();
    lines[String(payload.line).trim()] = {
        ...payload,
        line: String(payload.line).trim(),
        lastUpdate: Date.now()
    };
    localStorage.setItem(LIVE_LOCAL_LINES_KEY, JSON.stringify(lines));
}

function removeLocalLiveLine(lineName) {
    const cleanLine = String(lineName || '').trim();
    if (!cleanLine) return;
    const lines = getLocalLiveLines();
    delete lines[cleanLine];
    localStorage.setItem(LIVE_LOCAL_LINES_KEY, JSON.stringify(lines));
}

async function sendToServer(endpoint, payload) {
    for (const serverHost of SERVER_HOSTS) {
        try {
            const res = await fetch(`${serverHost}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                console.log(`[API] Sukses ke: ${serverHost}`);
                return true;
            }
            console.warn(`[API] Gagal ke ${serverHost}: HTTP ${res.status}`);
        } catch (err) {
            console.warn(`[API] Gagal ke ${serverHost}:`, err.message);
        }
    }
    return false;
}

function sendWsMessage(payload) {
    try {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(payload));
            return true;
        }
    } catch (e) {
        console.warn('[WS] Gagal kirim:', e.message);
    }
    return false;
}

const LIVE_PUSH_INTERVAL = 2000;
let lastLivePushTime = 0;
let pendingLivePayload = null;
let livePushTimer = null;

function queueLivePush(payload) {
    if (isResettingData) return;
    if (!payload.line || payload.line === '-') return;

    pendingLivePayload = payload;
    const now = Date.now();
    const elapsed = now - lastLivePushTime;

    if (elapsed >= LIVE_PUSH_INTERVAL) {
        flushLivePush();
    } else if (!livePushTimer) {
        livePushTimer = setTimeout(flushLivePush, LIVE_PUSH_INTERVAL - elapsed);
    }
}

function flushLivePush() {
    livePushTimer = null;
    if (isResettingData) return;
    if (!pendingLivePayload) return;
    lastLivePushTime = Date.now();
    upsertLocalLiveLine(pendingLivePayload);
    sendToServer('/api/live-update', pendingLivePayload);
    sendWsMessage({
        type: 'live_update',
        ...pendingLivePayload
    });
}

async function clearLiveStatus(lineName) {
    if (!lineName || lineName === '-') return;
    removeLocalLiveLine(lineName);
    sendWsMessage({
        type: 'live_clear',
        line: lineName,
        timestamp: Date.now()
    });
    await sendToServer('/api/live-clear', { line: lineName });
}

async function editOnServer(endpoint, id, payload) {
    for (const serverHost of SERVER_HOSTS) {
        try {
            const res = await fetch(`${serverHost}${endpoint}?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(5000)
            });
            if (res.ok) return true;
        } catch (e) { continue; }
    }
    return false;
}

async function deleteOnServer(endpoint, id) {
    for (const serverHost of SERVER_HOSTS) {
        try {
            const res = await fetch(`${serverHost}${endpoint}?id=${id}`, {
                method: 'DELETE',
                signal: AbortSignal.timeout(5000)
            });
            if (res.ok) return true;
        } catch (e) { continue; }
    }
    return false;
}

let ws = null;
let wsReconnectAttempts = 0;
const WS_MAX_RECONNECT = 5;
const WS_RECONNECT_DELAY = 3000;
let lastGoodSignalTime = 0;
let remoteStopInProgress = false;
const REMOTE_STOP_COMMAND_KEY = 'oee_stop_command';
let lastRemoteStopCommandId = '';

function handleRemoteStopCommand(command) {
    if (!command || command.type !== 'stop_line') return;

    const signalLine = command.line ? String(command.line).trim() : '';
    const webLine = String(localStorage.getItem("line") || "").trim();
    const commandId = String(command.id || command.timestamp || '');

    if (!signalLine || !webLine || signalLine !== webLine || remoteStopInProgress) return;
    if (commandId && commandId === lastRemoteStopCommandId) return;

    lastRemoteStopCommandId = commandId;
    console.log(`Remote stop command received for line ${signalLine}`);
    remoteStopInProgress = true;
    window.resetData({ skipConfirm: true, source: command.source || 'live_monitor' });
}

function checkLocalStopCommand() {
    try {
        const command = JSON.parse(localStorage.getItem(REMOTE_STOP_COMMAND_KEY) || 'null');
        handleRemoteStopCommand(command);
    } catch (e) { }
}

window.wsStatus = 'disconnected';

function connectWebSocket() {

    try {
        ws = new WebSocket(WS_SERVER);

        ws.onopen = () => {
            window.wsStatus = 'connected';
            console.log('WebSocket Connected - Waiting for signal from ESP32');
            console.log('Server:', WS_SERVER);
            wsReconnectAttempts = 0;
        };

        ws.onmessage = (event) => {

            let signal = event.data;
            let signalLine = null;

            try {
                const parsed = JSON.parse(event.data);
                signal = parsed.type;
                signalLine = parsed.line ? String(parsed.line).trim() : null;
            } catch (e) { }

            if (signal === 'good' || signal === 'z') {
                const webLine = String(localStorage.getItem("line") || "").trim();
                if (signalLine && webLine && signalLine !== webLine) {
                    console.log(`Signal line ${signalLine} ignored, web line ${webLine}`);
                    return;
                }

                const now = Date.now();
                if (now - lastGoodSignalTime >= 200) {
                    console.log('GOOD Button Received!');
                    updateQty("good", 1);
                    lastGoodSignalTime = now;
                } else {
                    console.log('Duplicate signal ignored');
                }
            } else if (signal === 'stop_line') {
                handleRemoteStopCommand({
                    type: 'stop_line',
                    line: signalLine,
                    source: 'live_monitor',
                    timestamp: Date.now()
                });
            }
        };

        ws.onerror = (error) => {
            window.wsStatus = 'error';
            console.error('WebSocket Error:', error);
        };

        ws.onclose = () => {
            window.wsStatus = 'disconnected';
            console.warn('WebSocket Disconnected');

            if (wsReconnectAttempts < WS_MAX_RECONNECT) {
                wsReconnectAttempts++;
                console.log(`Reconnect attempt ${wsReconnectAttempts}/${WS_MAX_RECONNECT}...`);
                setTimeout(connectWebSocket, WS_RECONNECT_DELAY);
            } else {
                console.error('WebSocket reconnect failed after', WS_MAX_RECONNECT, 'attempts');
            }
        };
    } catch (error) {
        window.wsStatus = 'error';
        console.error('WebSocket initialization error:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof WS_SERVER !== 'undefined') {
        connectWebSocket();
    }
    checkLocalStopCommand();
    setInterval(checkLocalStopCommand, 1000);
});

window.addEventListener('storage', (event) => {
    if (event.key !== REMOTE_STOP_COMMAND_KEY || !event.newValue) return;
    try {
        handleRemoteStopCommand(JSON.parse(event.newValue));
    } catch (e) { }
});

window.checkWsStatus = () => {
    console.log(`WebSocket Status: ${window.wsStatus}\nServer: ${WS_SERVER}`);
};
