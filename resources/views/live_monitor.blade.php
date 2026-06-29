<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>LIVE MONITOR - OEE ALL LINES</title>
    <link rel="icon" href="{{ asset('favicon.jpg') }}">

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: bolder;
            color: #F8F9FF;
            overflow: hidden;
            touch-action: none;
            overscroll-behavior: none;
        }

        html,
        body {
            height: 100%;
            background: #1C1A27;
            overflow: hidden;
            touch-action: pan-x pan-y;
        }

        .lm-topstrip {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 6vh;
            min-height: 44px;
            max-height: 60px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 18px;
            background: #573CFA;
            border-bottom: 2px solid #F8F9FF;
            z-index: 1000;
        }

        .lm-topstrip .lm-clock {
            font-size: clamp(14px, 1.8vh, 22px);
            letter-spacing: 1px;
            white-space: nowrap;
        }

        .lm-topstrip .lm-title {
            font-size: clamp(13px, 1.7vh, 20px);
            letter-spacing: 2px;
            text-transform: uppercase;
            text-align: center;
            flex: 1;
        }

        .lm-topstrip .lm-actions {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .lm-ws-dot {
            width: clamp(8px, 1vh, 10px);
            height: clamp(8px, 1vh, 10px);
            border-radius: 50%;
            background: #E8083E;
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.4);
            flex-shrink: 0;
        }

        .lm-ws-dot.connected {
            background: #02864A;
            animation: lm-pulse 2s infinite;
        }

        @keyframes lm-pulse {

            0%,
            100% {
                opacity: 1;
            }

            50% {
                opacity: 0.45;
            }
        }

        .lm-btn-home {
            background: #F8F9FF;
            color: #1C1A27;
            border: none;
            padding: 0.6vh 16px;
            cursor: pointer;
            border-radius: 50px;
            font-size: clamp(12px, 1.5vh, 15px);
            font-weight: bolder;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
            transition: 0.2s;
            white-space: nowrap;
        }

        .lm-btn-home:hover {
            background: #FB8D1A;
            color: #F8F9FF;
        }

        .lm-swiper {
            position: absolute;
            top: 5vh;
            left: 0;
            width: 100%;
            height: 95vh;
        }

        @media (max-height: 700px) {
            .lm-topstrip {
                height: 38px;
            }

            .lm-swiper {
                top: 38px;
                height: calc(100% - 38px);
            }
        }

        .lm-slide-grid {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 5px;
            padding: 5px;
        }

        .lm-card {
            background: #20232A;
            border: 1px solid rgba(248, 249, 255, 0.15);
            border-radius: 6px;
            border-left: 5px solid #555;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
            min-height: 0;
            min-width: 0;
        }

        .lm-card.st-red {
            border-left-color: #E8083E;
        }

        .lm-card.st-plain {
            border-left-color: #555;
        }

        .lm-card.st-green {
            border-left-color: #02864A;
        }

        .lm-card.st-down {
            border-left-color: #E8083E;
        }

        .lm-card.is-stale {
            opacity: 1;
            /* Tidak redup lagi */
        }

        .lm-card-head {
            padding: clamp(2px, 0.4vh, 4px) clamp(4px, 0.5vw, 7px) clamp(1px, 0.25vh, 3px);
            border-bottom: 1px solid rgba(248, 249, 255, 0.12);
            line-height: 1.15;
            flex-shrink: 0;
        }

        .lm-card-headrow {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 4px;
        }

        .lm-card-line {
            font-size: clamp(11px, 1.5vw, 16px);
            letter-spacing: 0.5px;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .lm-card-badge {
            flex-shrink: 0;
            font-size: clamp(6.5px, 0.8vw, 9px);
            padding: 1px 6px;
            border-radius: 20px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            background: #02864A;
            white-space: nowrap;
        }

        .lm-status-actions {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            flex-shrink: 0;
        }

        .lm-btn-stop {
            width: clamp(17px, 1.6vw, 22px);
            height: clamp(17px, 1.6vw, 22px);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(248, 249, 255, 0.45);
            border-radius: 50%;
            background: #E8083E;
            cursor: pointer;
            padding: 0;
            flex-shrink: 0;
        }

        .lm-btn-stop:hover {
            background: #FB8D1A;
        }

        .lm-btn-stop:disabled {
            cursor: wait;
            opacity: 0.55;
        }

        .lm-stop-icon {
            width: 42%;
            height: 42%;
            display: block;
            background: #F8F9FF;
            border-radius: 1px;
        }

        .lm-card.st-down .lm-card-badge,
        .lm-card.st-critical .lm-card-badge {
            background: #E8083E;
        }

        .lm-card.is-stale .lm-card-badge {
            background: #6b6b6b;
        }

        .lm-card-sub {
            font-size: clamp(7.5px, 0.95vw, 11px);
            opacity: 0.75;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: normal;
        }

        .lm-card-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: clamp(4px, 1.2vh, 10px) clamp(6px, 1vw, 12px) clamp(4px, 1vh, 10px);
            gap: clamp(4px, 0.8vh, 8px);
            min-height: 0;
        }

        .lm-oee-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            flex-shrink: 0;
            text-align: center;
        }

        .lm-oee-row .lm-oee-main {
            grid-column: 1 / -1;
            display: flex;
            align-items: baseline;
            justify-content: center;
            gap: 3px;
            border-radius: 4px;
        }

        .lm-oee-row .lm-oee-main .lm-oee-label {
            font-size: clamp(8px, 1vw, 11px);
            opacity: 0.75;
            letter-spacing: 1px;
        }

        .lm-oee-row .lm-oee-main .lm-oee-val {
            font-size: clamp(27px, 4.2vw, 42px);
            line-height: 1;
            font-weight: 900;
        }

        .lm-oee-row .lm-oee-main .lm-oee-unit {
            font-size: clamp(8px, 1vw, 10px);
            opacity: 0.7;
        }

        .lm-oee-row .lm-metric-item {
            background: rgba(248, 249, 255, 0.06);
            border-radius: 4px;
            padding: 4px 0;
            min-width: 0;
        }

        .lm-oee-row .lm-metric-label {
            font-size: clamp(5.5px, 0.7vw, 8px);
            opacity: 0.65;
            letter-spacing: 0.2px;
        }

        .lm-oee-row .lm-metric-val {
            font-size: clamp(11px, 1.4vw, 15px);
            font-weight: bold;
        }

        .lm-metric-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 3px;
            text-align: center;
            flex-shrink: 0;
        }

        .lm-metric-grid .lm-metric-item {
            background: rgba(248, 249, 255, 0.06);
            border-radius: 4px;
            padding: 4px 0;
            min-width: 0;
        }

        .lm-metric-grid .lm-metric-label {
            font-size: clamp(6px, 0.75vw, 9px);
            opacity: 0.65;
            letter-spacing: 0.2px;
            font-weight: bolder;
        }

        .lm-metric-grid .lm-metric-val {
            font-size: clamp(11px, 1.4vw, 15px);
            font-weight: bold;
        }

        .lm-prod-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 3px;
            text-align: center;
            flex: 1;
            min-height: 0;
            align-content: center;
        }

        .lm-prod-grid .lm-prod-item {
            min-width: 0;
            background: rgba(248, 249, 255, 0.04);
            border-radius: 4px;
            padding: 3px 0;
        }

        .lm-prod-grid .lm-prod-label {
            font-size: clamp(6px, 0.75vw, 8px);
            opacity: 0.6;
            letter-spacing: 0.2px;
            white-space: nowrap;
            overflow: hidden;
        }

        .lm-prod-grid .lm-prod-val {
            font-size: clamp(11px, 1.4vw, 15px);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: bold;
        }

        .lm-bottom-row {
            margin-top: auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3px;
            border-top: 1px solid rgba(248, 249, 255, 0.1);
            padding-top: clamp(2px, 0.6vh, 6px);
            flex-shrink: 0;
        }

        .lm-bottom-row .lm-bottom-item {
            text-align: center;
            min-width: 0;
        }

        .lm-bottom-row .lm-bottom-label {
            font-size: clamp(6px, 0.75vw, 8px);
            opacity: 0.6;
        }

        .lm-bottom-row .lm-bottom-val {
            font-size: clamp(10px, 1.2vw, 14px);
            white-space: nowrap;
            overflow: hidden;
            font-weight: bold;
        }

        .lm-bottom-row .lm-bottom-val.lm-blink {
            color: #E8083E;
            animation: lm-blinker 1s linear infinite;
            font-weight: bolder;
        }

        @keyframes lm-blinker {
            50% {
                opacity: 0.25;
            }
        }

        .lm-card-empty {
            background: rgba(248, 249, 255, 0.03);
            border: 1px dashed rgba(248, 249, 255, 0.12);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: clamp(9px, 1vw, 12px);
            opacity: 0.3;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .lm-no-data {
            position: absolute;
            top: 6vh;
            left: 0;
            width: 100%;
            height: 94vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            opacity: 0.6;
            font-size: clamp(14px, 1.8vw, 20px);
            letter-spacing: 1px;
            text-align: center;
            padding: 0 20px;
        }


        .swiper-pagination-bullet {
            background: #F8F9FF !important;
            opacity: 0.4;
        }

        .swiper-pagination-bullet-active {
            background: #FB8D1A !important;
            opacity: 1;
        }

        .swiper-button-next,
        .swiper-button-prev {
            color: #F8F9FF !important;
            transform: scale(0.7);
        }

        @media (max-width: 900px) {
            .lm-slide-grid {
                grid-template-columns: repeat(4, 1fr);
                grid-template-rows: repeat(4, 1fr);
            }
        }

        .lm-topstrip .lm-clock {
            font-size: clamp(14px, 1.86vh, 23px);
        }

        .lm-topstrip .lm-title {
            font-size: clamp(14px, 1.75vh, 21px);
        }

        .lm-btn-home {
            font-size: clamp(12px, 1.55vh, 15px);
        }

        .lm-card-line {
            font-size: clamp(12px, 1.55vw, 17px);
        }

        .lm-card-badge {
            font-size: clamp(7px, 0.83vw, 10px);
        }

        .lm-card-sub {
            font-size: clamp(6px, 0.69vw, 9px);
        }

        .lm-oee-row .lm-oee-main .lm-oee-label {
            font-size: clamp(6px, 0.73vw, 9px);
        }

        .lm-oee-row .lm-oee-main .lm-oee-unit {
            font-size: clamp(6px, 0.69vw, 7px);
        }

        .lm-oee-row .lm-metric-label {
            font-size: clamp(4px, 0.52vw, 6px);
        }

        .lm-metric-grid .lm-metric-label {
            font-size: clamp(4px, 0.55vw, 7px);
        }

        .lm-prod-grid .lm-prod-label {
            font-size: clamp(4px, 0.55vw, 7px);
        }

        .lm-bottom-row .lm-bottom-label {
            font-size: clamp(4px, 0.55vw, 7px);
        }

        .lm-oee-row .lm-oee-main .lm-oee-val {
            font-size: clamp(19px, 2.89vw, 29px);
        }

        .lm-oee-row .lm-metric-val {
            font-size: clamp(12px, 1.44vw, 15px);
        }

        .lm-metric-grid .lm-metric-val {
            font-size: clamp(12px, 1.44vw, 15px);
        }

        .lm-prod-grid .lm-prod-val {
            font-size: clamp(12px, 1.44vw, 15px);
        }

        .lm-bottom-row .lm-bottom-val {
            font-size: clamp(10px, 1.24vw, 14px);
        }

        .lm-card-empty {
            font-size: clamp(10px, 1.03vw, 12px);
        }

        .lm-no-data {
            font-size: clamp(14px, 1.86vw, 21px);
        }

    </style>
</head>

<body>

    <div class="lm-topstrip">
        <div class="lm-actions">
            <div class="lm-ws-dot" id="lm-ws-dot"></div>
            <div class="lm-clock" id="lm-clock">00:00:00</div>
        </div>
        <div class="lm-title">Monitor Production &middot; Backend</div>
        <div class="lm-actions">
            <button class="lm-btn-home" onclick="window.location.href='/'">&larr; Homepage</button>
        </div>
    </div>

    <div class="lm-swiper swiper" id="lm-swiper">
        <div class="swiper-wrapper" id="lm-swiper-wrapper">

        </div>
        <div class="swiper-pagination"></div>
        <div class="swiper-button-prev"></div>
        <div class="swiper-button-next"></div>
    </div>

    <div class="lm-no-data" id="lm-no-data" style="display:none;">
        <div>Belum ada line yang aktif mengirim data live.</div>
        <div style="font-size:0.7em; opacity:0.7;">Mulai produksi di halaman line (Setting &rarr; Start Production)
            untuk muncul di sini.</div>
    </div>

    <script>
        const AUTO_DETECT_HOST = window.location.hostname;
        const API_BASE = `http://${AUTO_DETECT_HOST}:4000`;
        const WS_SERVER = `ws://${AUTO_DETECT_HOST}:3000`;
        const CARDS_PER_SLIDE = 14;
        const STALE_MS = 30000;
        const lineStartTimes = {};
        const linesBeingCleared = new Set();

        let liveLinesMap = {};
        let cardOrder = [];
        let lmSwiper = null;
        let ws = null;

        const lastPayloadRunStartMs = {};

        function tickClock() {
            const now = new Date();
            const h = String(now.getHours()).padStart(2, '0');
            const m = String(now.getMinutes()).padStart(2, '0');
            const s = String(now.getSeconds()).padStart(2, '0');
            document.getElementById('lm-clock').innerText = `${h}:${m}:${s}`;
        }

        function statusFromOee(oee) {
            const v = parseFloat(oee) || 0;
            if (v >= 100) return 'green';
            if (v >= 90) return 'plain';
            return 'red';
        }

        function escapeHtml(str) {
            return String(str ?? '-').replace(/[&<>"']/g, c => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            } [c]));
        }

        function safeId(line) {
            return 'lmcard-' + String(line).replace(/[^a-zA-Z0-9_-]/g, '_');
        }

        function buildCardSkeleton(line) {
            const id = safeId(line);
            return `
                <div class="lm-card" id="${id}">
                    <div class="lm-card-head">
                        <div class="lm-card-headrow">
                            <div class="lm-card-line" id="${id}-line"></div>
                            <div class="lm-status-actions">
                                <span class="lm-card-badge" id="${id}-badge">RUNNING</span>
                                <button class="lm-btn-stop" type="button" data-stop-line="${escapeHtml(line)}" title="Stop line">
                                    <span class="lm-stop-icon"></span>
                                </button>
                            </div>
                        </div>
                        <div class="lm-card-sub" id="${id}-sub1"></div>
                        <div class="lm-card-sub" id="${id}-sub2"></div>
                    </div>
                    <div class="lm-card-body">
                        <div class="lm-oee-row">
                            <div class="lm-oee-main">
                                <span class="lm-oee-label">OEE</span>
                                <span class="lm-oee-val" id="${id}-oee">0.0</span>
                                <span class="lm-oee-unit">%</span>
                            </div>
                            <div class="lm-metric-item">
                                <div class="lm-metric-label">AVAILABILITY</div>
                                <div class="lm-metric-val" id="${id}-avb">0.0</div>
                            </div>
                            <div class="lm-metric-item">
                                <div class="lm-metric-label">PERFORMANCE</div>
                                <div class="lm-metric-val" id="${id}-pfm">0.0</div>
                            </div>
                            <div class="lm-metric-item">
                                <div class="lm-metric-label">QUALITY</div>
                                <div class="lm-metric-val" id="${id}-qly">0.0</div>
                            </div>
                            <div class="lm-metric-item">
                                <div class="lm-metric-label">EFFICIENCY</div>
                                <div class="lm-metric-val" id="${id}-efc">0.0</div>
                            </div>
                        </div>
                        <div class="lm-prod-grid">
                            <div class="lm-prod-item">
                                <div class="lm-prod-label">TARGET</div>
                                <div class="lm-prod-val" id="${id}-target">0</div>
                            </div>
                            <div class="lm-prod-item">
                                <div class="lm-prod-label">TOTAL</div>
                                <div class="lm-prod-val" id="${id}-tqty">0</div>
                            </div>
                            <div class="lm-prod-item">
                                <div class="lm-prod-label">IDEAL</div>
                                <div class="lm-prod-val" id="${id}-iqty">0</div>
                            </div>
                            <div class="lm-prod-item">
                                <div class="lm-prod-label">ACHIEVEMENT</div>
                                <div class="lm-prod-val" id="${id}-good" style="color:#4CC273;">0</div>
                            </div>
                            <div class="lm-prod-item">
                                <div class="lm-prod-label">GOOD</div>
                                <div class="lm-prod-val" id="${id}-good2" style="color:#4CC273;">0</div>
                            </div>
                            <div class="lm-prod-item">
                                <div class="lm-prod-label">NG</div>
                                <div class="lm-prod-val" id="${id}-ng" style="color:#E8083E;">0</div>
                            </div>
                        </div>
                        <div class="lm-bottom-row">
                            <div class="lm-bottom-item">
                                <div class="lm-bottom-label">RUNTIME</div>
                                <div class="lm-bottom-val" id="${id}-run">00:00:00</div>
                            </div>
                            <div class="lm-bottom-item">
                                <div class="lm-bottom-label">DOWNTIME</div>
                                <div class="lm-bottom-val" id="${id}-down">00:00:00</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        function buildEmptyCard() {
            return `<div class="lm-card-empty">No Line</div>`;
        }

        function updateCard(line) {
            const d = liveLinesMap[line];
            if (!d) return;
            const id = safeId(line);
            const cardEl = document.getElementById(id);
            if (!cardEl) return;

            const isDown = d.mode === 'down' || (d.down_start_ms && d.down_start_ms > 0);
            const stale = (Date.now() - (d.lastUpdate || 0)) > STALE_MS;
            const status = isDown ? 'down' : statusFromOee(d.oee);

            cardEl.className = `lm-card st-${status}${stale ? ' is-stale' : ''}`;

            document.getElementById(`${id}-line`).textContent = d.line || '-';
            document.getElementById(`${id}-sub1`).textContent = `${d.machine || '-'} · ${d.model || '-'}`;
            document.getElementById(`${id}-sub2`).textContent =
                `Shift ${d.shift || '-'} · Group ${d.group || '-'} · ${d.customer || '-'}`;
            document.getElementById(`${id}-badge`).textContent = isDown ? 'DOWN' : (stale ? 'NO SIG' : 'RUN');
            document.getElementById(`${id}-avb`).textContent = parseFloat(d.avb || 0).toFixed(1);
            document.getElementById(`${id}-pfm`).textContent = parseFloat(d.pfm || 0).toFixed(1);
            document.getElementById(`${id}-qly`).textContent = parseFloat(d.qly || 0).toFixed(1);
            document.getElementById(`${id}-efc`).textContent = parseFloat(d.efc || 0).toFixed(1);

            const parseTimeToMs = (timeStr) => {
                const parts = (timeStr || '0:0:0').split(':');
                const h = parseInt(parts[0]) || 0;
                const m = parseInt(parts[1]) || 0;
                const s = parseInt(parts[2]) || 0;
                return (h * 3600 + m * 60 + s) * 1000;
            };

            let runtimeMs = 0;

            if (d.mode === 'down' || (d.down_start_ms && d.down_start_ms > 0)) {
                delete lineStartTimes[line];
                delete lastPayloadRunStartMs[line];
                runtimeMs = parseTimeToMs(d.run_time);
            } else if (d.run_start_ms) {
                const payloadRunTimeMs = parseTimeToMs(d.run_time);
                const isFirstPayload = !lastPayloadRunStartMs.hasOwnProperty(line);
                const isTransition = isFirstPayload || (lastPayloadRunStartMs[line] !== d.run_start_ms);

                if (isTransition) {
                    lineStartTimes[line] = Date.now() - payloadRunTimeMs;
                    lastPayloadRunStartMs[line] = d.run_start_ms;
                    runtimeMs = payloadRunTimeMs;
                } else {
                    runtimeMs = Date.now() - lineStartTimes[line];
                }
            }

            let downtimeMs = parseTimeToMs(d.down_time);
            if (d.down_start_ms && d.down_start_ms > 0) {
                const currentDowntimeDurationMs = Date.now() - d.down_start_ms;
                downtimeMs = downtimeMs + currentDowntimeDurationMs;
            }

            const totalTimeMs = runtimeMs + downtimeMs;

            const realAvb = totalTimeMs > 0 ? (runtimeMs / totalTimeMs) * 100 : 0;
            const realQly = (d.tqty > 0) ? (d.good / d.tqty) * 100 : 0;
            const realPfm = d.cyc && totalTimeMs > 0 ? ((d.tqty * d.cyc) / (totalTimeMs / 1000)) * 100 : 0;
            const realOee = Math.min((realAvb * realPfm * realQly) / 10000, 100);

            const oeeEl = document.getElementById(`${id}-oee`);
            if (oeeEl) oeeEl.textContent = realOee.toFixed(1);

            const oeeMain = oeeEl ? oeeEl.closest('.lm-oee-main') : null;
            if (oeeMain) {
                if (realOee >= 100) {
                    oeeMain.style.backgroundColor = '#02864A';
                    oeeMain.style.color = 'white';
                } else if (realOee < 90) {
                    oeeMain.style.backgroundColor = '#E8083E';
                    oeeMain.style.color = 'white';
                } else {
                    oeeMain.style.backgroundColor = 'transparent';
                    oeeMain.style.color = '';
                }
            }

            const applyMetricColor = (metricId, value) => {
                const el = document.getElementById(metricId);
                if (!el) return;
                const container = el.closest('.lm-metric-item');
                if (!container) return;
                const val = parseFloat(value || 0);
                if (val >= 100) {
                    container.style.backgroundColor = '#02864A';
                    container.style.color = 'white';
                } else if (val < 90) {
                    container.style.backgroundColor = '#E8083E';
                    container.style.color = 'white';
                } else {
                    container.style.backgroundColor = 'rgba(248,249,255,0.06)';
                    container.style.color = '';
                }
            };

            document.getElementById(`${id}-avb`).textContent = realAvb.toFixed(1);
            applyMetricColor(`${id}-avb`, realAvb);
            applyMetricColor(`${id}-pfm`, realPfm);
            applyMetricColor(`${id}-qly`, realQly);
            applyMetricColor(`${id}-efc`, d.efc);

            document.getElementById(`${id}-target`).textContent = parseInt(d.target || 0);
            document.getElementById(`${id}-tqty`).textContent = parseInt(d.tqty || 0);
            document.getElementById(`${id}-iqty`).textContent = parseInt(d.iqty || 0);
            document.getElementById(`${id}-good`).textContent = parseInt(d.good || 0);
            document.getElementById(`${id}-good2`).textContent = parseInt(d.good || 0);
            document.getElementById(`${id}-ng`).textContent = parseInt(d.ng || 0);

            if (d.mode === 'down' || (d.down_start_ms && d.down_start_ms > 0)) {
                document.getElementById(`${id}-run`).textContent = d.run_time || '00:00:00';
            } else if (d.run_start_ms) {
                const payloadRunTimeMs = parseTimeToMs(d.run_time);
                const isFirstPayload = !lastPayloadRunStartMs.hasOwnProperty(line);
                const isTransition = isFirstPayload || (lastPayloadRunStartMs[line] !== d.run_start_ms);

                if (isTransition) {
                    const displayRunTimeMs = payloadRunTimeMs;
                    const hours = Math.floor(displayRunTimeMs / 3600000);
                    const mins = Math.floor((displayRunTimeMs % 3600000) / 60000);
                    const secs = Math.floor((displayRunTimeMs % 60000) / 1000);
                    const runTimeStr =
                        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                    document.getElementById(`${id}-run`).textContent = runTimeStr;
                } else {
                    const displayRunTimeMs = Date.now() - lineStartTimes[line];
                    const hours = Math.floor(displayRunTimeMs / 3600000);
                    const mins = Math.floor((displayRunTimeMs % 3600000) / 60000);
                    const secs = Math.floor((displayRunTimeMs % 60000) / 1000);
                    const runTimeStr =
                        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                    document.getElementById(`${id}-run`).textContent = runTimeStr;
                }
            } else {
                document.getElementById(`${id}-run`).textContent = d.run_time || '00:00:00';
            }

            if (d.mode === 'down' || (d.down_start_ms && d.down_start_ms > 0)) {
                const currentDowntimeDurationMs = Date.now() - d.down_start_ms;
                const baseDowntimeMs = parseTimeToMs(d.down_time);
                const totalDowntimeMs = baseDowntimeMs + currentDowntimeDurationMs;

                const downHours = Math.floor(totalDowntimeMs / 3600000);
                const downMins = Math.floor((totalDowntimeMs % 3600000) / 60000);
                const downSecs = Math.floor((totalDowntimeMs % 60000) / 1000);
                const downTimeStr =
                    `${String(downHours).padStart(2, '0')}:${String(downMins).padStart(2, '0')}:${String(downSecs).padStart(2, '0')}`;
                const downEl = document.getElementById(`${id}-down`);
                downEl.textContent = downTimeStr;
                downEl.classList.toggle('lm-blink', true);
            } else {
                const downEl = document.getElementById(`${id}-down`);
                downEl.textContent = d.down_time || '00:00:00';
                downEl.classList.toggle('lm-blink', false);
            }
        }

        function updateAllCards() {
            cardOrder.forEach(updateCard);
        }

        function rebuildSkeletonIfNeeded() {
            const newOrder = Object.keys(liveLinesMap).sort((a, b) => a.localeCompare(b, undefined, {
                numeric: true
            }));
            const changed = newOrder.length !== cardOrder.length ||
                newOrder.some((line, i) => line !== cardOrder[i]);

            if (!changed) return false;

            cardOrder = newOrder;

            const wrapper = document.getElementById('lm-swiper-wrapper');
            const noData = document.getElementById('lm-no-data');
            const swiperEl = document.getElementById('lm-swiper');

            if (!cardOrder.length) {
                wrapper.innerHTML = '';
                noData.style.display = 'flex';
                swiperEl.style.display = 'none';
                return true;
            }

            noData.style.display = 'none';
            swiperEl.style.display = 'block';

            const activeIndex = lmSwiper ? lmSwiper.activeIndex : 0;

            let html = '';
            for (let i = 0; i < cardOrder.length; i += CARDS_PER_SLIDE) {
                const chunk = cardOrder.slice(i, i + CARDS_PER_SLIDE);
                let cardsHtml = chunk.map(buildCardSkeleton).join('');
                for (let f = chunk.length; f < CARDS_PER_SLIDE; f++) {
                    cardsHtml += buildEmptyCard();
                }
                html += `<div class="swiper-slide"><div class="lm-slide-grid">${cardsHtml}</div></div>`;
            }
            wrapper.innerHTML = html;

            if (lmSwiper) {
                lmSwiper.update();
                const maxIndex = lmSwiper.slides.length - 1;
                lmSwiper.slideTo(Math.min(activeIndex, maxIndex), 0);
            }

            return true;
        }

        function render() {
            const skeletonRebuilt = rebuildSkeletonIfNeeded();
            updateAllCards();
        }

        function requestLineStop(line, button) {
            const lineName = String(line || '').trim();
            if (!lineName) return;

            const confirmed = confirm(`Stop line ${lineName}?`);
            if (!confirmed) return;

            if (!ws || ws.readyState !== WebSocket.OPEN) {
                alert('WebSocket belum terhubung. Coba lagi sebentar.');
                return;
            }

            if (button) button.disabled = true;
            ws.send(JSON.stringify({
                type: 'stop_line',
                line: lineName,
                timestamp: Date.now()
            }));

            linesBeingCleared.add(lineName);
            delete liveLinesMap[lineName];
            delete lineStartTimes[lineName];
            delete lastPayloadRunStartMs[lineName];
            render();

            setTimeout(() => {
                linesBeingCleared.delete(lineName);
            }, 300000);
        }

        document.addEventListener('click', (event) => {
            const stopButton = event.target.closest('.lm-btn-stop');
            if (!stopButton) return;
            event.preventDefault();
            event.stopPropagation();
            requestLineStop(stopButton.dataset.stopLine, stopButton);
        });


        async function loadLiveStatus() {
            try {
                const res = await fetch(`${API_BASE}/api/live-status`, {
                    signal: AbortSignal.timeout(5000)
                });
                if (!res.ok) throw new Error('fetch failed');
                const arr = await res.json();
                liveLinesMap = {};
                arr.forEach(d => {
                    if (!d.started) return;

                    const cleanLine = String(d.line || '').trim();
                    if (cleanLine && !linesBeingCleared.has(cleanLine)) {
                        liveLinesMap[cleanLine] = {
                            ...d,
                            line: cleanLine
                        };
                    }
                });
                render();
            } catch (e) {
                console.error('loadLiveStatus error:', e);
            }
        }

        setInterval(updateAllCards, 1000);

        function connectWS() {
            const dot = document.getElementById('lm-ws-dot');
            try {
                ws = new WebSocket(WS_SERVER);

                ws.onopen = () => {
                    dot.classList.add('connected');
                    loadLiveStatus();
                };

                ws.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        if (msg.type === 'live_update') {
                            if (msg.line && !linesBeingCleared.has(String(msg.line).trim())) {
                                loadLiveStatus();
                            }
                        } else if (msg.type === 'live_clear') {
                            if (msg.line) {
                                const cleanLine = String(msg.line).trim();
                                linesBeingCleared.add(cleanLine);
                                delete liveLinesMap[cleanLine];
                                render();

                                setTimeout(() => {
                                    loadLiveStatus();
                                    setTimeout(() => {
                                        linesBeingCleared.delete(cleanLine);
                                        console.log(
                                            `[Clear Timeout] Line ${cleanLine} dihapus dari tracking`
                                        );
                                    }, 300000);
                                }, 500);
                            }
                        }
                    } catch (e) {}
                };

                ws.onclose = () => {
                    dot.classList.remove('connected');
                    setTimeout(connectWS, 3000);
                };

                ws.onerror = () => {
                    dot.classList.remove('connected');
                };
            } catch (error) {
                console.error('WebSocket connection error:', error);
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            tickClock();
            setInterval(tickClock, 1000);

            lmSwiper = new Swiper('#lm-swiper', {
                observer: true,
                observeParents: true,
                touchRatio: 1,
                simulateTouch: true,
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                }
            });

            loadLiveStatus();
            connectWS();

            setInterval(loadLiveStatus, 10000);
        });

        document.addEventListener('gesturestart', e => e.preventDefault());
        document.addEventListener('gesturechange', e => e.preventDefault());
        document.addEventListener('gestureend', e => e.preventDefault());

        document.addEventListener('wheel', function(e) {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        }, {
            passive: false
        });

        document.addEventListener('keydown', function(e) {
            if (
                (e.ctrlKey && ['+', '-', '=', '0'].includes(e.key)) ||
                (e.ctrlKey && e.key.toLowerCase() === 'add') ||
                (e.ctrlKey && e.key.toLowerCase() === 'subtract')
            ) {
                e.preventDefault();
            }
        });
    </script>

</body>

</html>
