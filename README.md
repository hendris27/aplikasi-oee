<div align="center">

# 🏭 OEE Monitoring System
### BE LINE — Production 2, Engineering 2

![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![ESP32](https://img.shields.io/badge/ESP32-E7352C?style=for-the-badge&logo=espressif&logoColor=white)

> Sistem monitoring **OEE (Overall Equipment Effectiveness)** berbasis web real-time.
> Terintegrasi dengan hardware tombol ESP32 untuk pencatatan produksi otomatis.

</div>

---

## 📐 Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   [ESP32 Button]                                            │
│        │                                                    │
│        ▼  GET /good?line=XX                                 │
│   [Node.js :3000]  ◄──── WebSocket ────► [Browser]         │
│        │                                      │             │
│        │                               [Node.js :4000]      │
│        │                               REST API             │
│        │                                      │             │
│   [Laravel :8000] ──── Serve Blade ──► [Browser]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 📁 File Utama

| File | Fungsi |
|---|---|
| `homepage.blade.php` | Halaman utama produksi — swiper 3 page |
| `page1.blade.php` | Tampilan OEE + AVB, PFM, QLY, EFC |
| `page2.blade.php` | Tampilan qty: Target, Ideal, Total, Good, NG |
| `page3.blade.php` | Cycle, Runtime, Downtime, Achievement |
| `live_monitor.blade.php` | Dashboard semua line real-time |
| `allpage.blade.php` | Report & export data OEE |
| `public/js/app.js` | Semua logic: OEE, downtime, WebSocket, export |
| `server.js` | Node.js: WebSocket (port 3000) + API (port 4000) |

---

## 🚀 Cara Menjalankan

> **Kedua server harus jalan bersamaan!**

```bash
# Terminal 1 — Laravel
php artisan serve

# Terminal 2 — Node.js (WebSocket + API)
node server.js
```

---

## ⚙️ Konfigurasi Produksi

Sebelum mulai, buka **Setting** dan isi form:

| Field | Keterangan |
|---|---|
| Line | Nama line produksi |
| Machine | Nama mesin |
| Model | Tipe produk *(auto-fill UPH & Customer dari Excel preset)* |
| Target | Target pcs shift ini |
| UPH | Unit Per Hour — standar kecepatan mesin |
| Customer | Nama customer |
| Qty/Pallet | Jumlah pcs per 1 sinyal good |
| Shift | 1 / 2 / 3 *(atau Auto sesuai jam)* |
| Group | A / B / C |
| Planned Time | 7 jam atau 5 jam |

> Data tersimpan di `localStorage` browser.

---

## 🕐 Jadwal Shift & Break

**Planned 7 Jam**

| Shift | Jam Kerja | Break |
|:---:|---|---|
| 1 | 07:00 – 15:00 | 11:15–12:00 · 13:15–13:30 |
| 2 | 15:00 – 23:00 | 16:45–17:00 · 18:30–19:15 |
| 3 | 23:00 – 07:00 | 02:40–03:20 · 05:10–05:30 |

**Planned 5 Jam**

| Shift | Jam Kerja | Break |
|:---:|---|---|
| 1 | 07:00 – 12:00 | 10:45–11:00 |
| 2 | 12:00 – 17:00 | 15:45–16:00 |
| 3 | 17:00 – 22:00 | 18:45–19:00 |

> ⏸️ Saat break → timer berhenti, popup **"BREAK TIME"** muncul otomatis
> ⛔ Di luar jam shift → timer tidak jalan

---

## 📦 Cara Tambah Qty

| Cara | Mekanisme |
|---|---|
| 🔘 Tombol ESP32 | ESP32 → `GET /good?line=XX` → WebSocket → `updateQty("good", 1)` |
| ⌨️ Keyboard `Z` | Capture-phase listener → `updateQty("good", 1)` |

> Qty yang ditambahkan = nilai **Qty/Pallet** di konfigurasi, bukan selalu 1.
> Keduanya menghasilkan perilaku yang **100% identik**.

---

## 🔴 Deteksi Downtime Otomatis

Sistem deteksi downtime berdasarkan **cycle time**:

```
Cycle time display = (3600 / UPH) × Qty/Pallet   (detik)
```

Jika selang waktu sejak produk terakhir **melebihi cycle time** → otomatis:

1. Mode berubah ke `down`
2. Catat waktu mulai downtime
3. Popup pilih reason downtime muncul

**Saat sinyal good masuk (`Z` / ESP32) di mode `down`:**

1. ✅ Popup langsung ditutup
2. ✅ Downtime dicatat ke log
3. ✅ Jika reason belum dipilih → default `"Not Filled In Yet"`
4. ✅ Mode kembali ke `run`
5. ✅ Qty bertambah

---

## 📊 Page 1 — OEE & Komponen

<table>
<tr>
<td width="50%">

### 📈 Availability (AVB)
> Seberapa lama mesin jalan dari total waktu tersedia

```
AVB = Runtime / (Runtime + Downtime) × 100
```

### ⚡ Performance (PFM)
> Kecepatan produksi vs standar cycle time

```
Cycle base  = 3600 / UPH

PFM = (Total Qty × Cycle base) / Total detik × 100
```

</td>
<td width="50%">

### ✅ Quality (QLY)
> Rasio produk good dari total produksi

```
QLY = Good / (Good + NG) × 100
```

### 🏆 OEE
> Gabungan AVB × PFM × QLY

```
OEE = (AVB × PFM × QLY) / 10000
      (maks 100%)
```

</td>
</tr>
</table>

### 💡 Efficiency (EFC)
> Seberapa efisien produksi dibanding qty ideal yang seharusnya tercapai

```
Ideal Qty = floor(Total detik / Cycle display) × Qty/Pallet

EFC = (Good / Ideal Qty) × 100   (maks 100%)
```

### 🎨 Warna Indikator

| Kondisi | Warna | Arti |
|:---:|:---:|---|
| `≥ 100%` | 🟢 Hijau | On target |
| `< 90%` | 🔴 Merah | Di bawah standar |
| Lainnya | ⬜ Transparan | Normal |

---

## 📦 Page 2 — Qty Monitor

| Field | Rumus / Sumber | Keterangan |
|---|---|---|
| **TARGET** | dari Setting | Target pcs shift ini |
| **IDEAL QTY** | `floor(total detik / cycle display) × Qty/Pallet` | Qty yang seharusnya tercapai sampai sekarang |
| **TOTAL QTY** | `Good + NG` | Total produksi keseluruhan |
| **GOOD** | counter | Produk lolos QC |
| **NG** | counter | Produk reject |

**Indikator selisih di samping TOTAL QTY:**

```
Total < Ideal  →  🔴 -N   (kurang N pcs dari ideal)
Total > Ideal  →  🟢 +N   (melampaui ideal N pcs)
```

---

## ⏱️ Page 3 — Cycle & Waktu

| Field | Rumus | Keterangan |
|---|---|---|
| **ACHIEVEMENT** | `Total Qty / Target × 100` | % pencapaian target (0–999%) |
| **CYCLE (S)** | `(3600 / UPH) × Qty/Pallet` | Standar waktu per cycle (detik) |
| **REAL (S)** | selang waktu antar 2 good terakhir | Cycle time aktual di lapangan |
| **RUNTIME** | akumulasi waktu mode `run` | Total mesin produksi |
| **DOWNTIME** | akumulasi waktu mode `down` | Total mesin berhenti |

---

## 📋 Downtime Log

Setiap downtime dicatat otomatis:

```json
{
  "date"       : "2026-06-24",
  "line"       : "BE1",
  "machine"    : "nama mesin",
  "model"      : "tipe produk",
  "type"       : "DOWN / LOST",
  "reason"     : "alasan downtime",
  "start"      : "24/Jun/26 08:00:00",
  "end"        : "24/Jun/26 08:05:30",
  "period"     : "00:05:30",
  "durationMs" : 330000
}
```

**Kategori:**

| Kategori | Contoh Reason |
|---|---|
| `LOST` | Meeting, Training, 5S, Top Up, Prepare Line |
| `DOWN` | Equipment Problem, Material Problem, Quality Problem, Waiting PCB |

**Tersimpan di:**
- 🗄️ `localStorage` → `downtime_logs`, `all_downtime_logs`
- 💾 Server → `data_downtime.json` via `POST /api/save-downtime`

---

## 📡 Live Monitor `/live`

Menampilkan status semua line secara real-time.

```
Baca data    →  GET  :4000/api/live-status
Push tiap 2s →  POST :4000/api/live-update
Saat stop    →  POST :4000/api/live-clear
```

---

## 📑 Report `/all`

Histori OEE dan downtime dari server. Bisa diedit, dihapus, dan di-export ke Excel.

```
GET :4000/api/read-oee
GET :4000/api/read-downtime
```

---

## 🔌 API Endpoints

**Port 4000 — REST API**

| Method | Endpoint | Fungsi |
|:---:|---|---|
| `GET` | `/api/read-oee` | Baca semua data OEE |
| `POST` | `/api/save-oee` | Simpan record OEE |
| `PUT` | `/api/edit-oee?id=XX` | Edit record OEE |
| `DELETE` | `/api/delete-oee?id=XX` | Hapus record OEE |
| `GET` | `/api/read-downtime` | Baca semua data downtime |
| `POST` | `/api/save-downtime` | Simpan record downtime |
| `PUT` | `/api/edit-downtime?id=XX` | Edit record downtime |
| `DELETE` | `/api/delete-downtime?id=XX` | Hapus record downtime |
| `GET` | `/api/live-status` | Status semua line |
| `POST` | `/api/live-update` | Update status line |
| `POST` | `/api/live-clear` | Clear line saat stop |

**Port 3000 — WebSocket**

| Endpoint | Method | Fungsi |
|---|:---:|---|
| `/good?line=XX` | `GET` | Terima sinyal ESP32, broadcast ke browser |

```json
// Format pesan WebSocket ke browser:
{ "type": "good", "line": "BE1", "timestamp": 1234567890 }
```

---

## 💾 Storage Data

| File | Isi |
|---|---|
| `data_oee.json` | Histori record OEE per shift |
| `data_downtime.json` | Histori semua downtime |
| `live_status.json` | Status live tiap line (real-time) |

---

## ⌨️ Keyboard Shortcut

| Tombol | Fungsi |
|:---:|---|
| `Z` | ➕ Tambah qty good (= sinyal ESP32) |
| `Space` | 🔴 Toggle downtime on/off |
| `D` | ⚙️ Buka Setting |
| `R` | ⏹️ Stop shift / reset data |
| `E` | 📊 Export ke Excel |
| `S` | 🔄 Toggle autoplay swiper |
| `→` / `←` | ▶️ Pindah slide manual |
| `Escape` | ✖️ Tutup popup |
| `7` `7` `7` `8` `8` | ❌ Tambah qty NG |

---

<div align="center">

Made for **SIIX Production 2 — Engineering 2**

</div>
