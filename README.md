<div align="center">

# 🏭 OEE Monitoring System
### BE LINE — Production 2, Engineering 2

**Sistem monitoring OEE berbasis web real-time untuk production line.**
Pencatatan produksi otomatis melalui tombol fisik ESP32 atau keyboard.

</div>
## 🖥️ Halaman

### `/` — Homepage (Halaman Produksi)
Halaman utama yang digunakan operator selama produksi berlangsung.
Terdiri dari 3 slide yang berganti otomatis:

| Slide | Isi |
|---|---|
| **Page 1** | Nilai OEE, Availability, Performance, Quality, Efficiency |
| **Page 2** | Target, Ideal Qty, Total Qty, Good, NG |
| **Page 3** | Achievement, Cycle Time, Real Cycle, Runtime, Downtime |

---

### `/live` — Live Monitor
Menampilkan status **semua line produksi** secara real-time dalam satu layar.
Cocok ditampilkan di monitor pantau ruang produksi.

---

### `/all` — Report
Menampilkan **histori data OEE dan downtime** dari seluruh shift.
Data dapat diedit, dihapus, dan di-export ke file **Excel**.

---

## ⚙️ Setting Sebelum Mulai Produksi

Klik tombol **Setting** di pojok kanan atas homepage, lalu isi form berikut:

| Field | Keterangan |
|---|---|
| **Line** | Nama line produksi *(contoh: BE1, BE2)* |
| **Machine** | Nama mesin yang digunakan |
| **Model** | Tipe / part number produk yang sedang diproduksi |
| **Target** | Jumlah pcs yang harus dicapai dalam shift ini |
| **UPH** | Unit Per Hour — standar kecepatan mesin |
| **Customer** | Nama customer produk ini |
| **Qty/Pallet** | Jumlah pcs yang dihitung setiap 1 kali sinyal good |
| **Shift** | Pilih Shift 1 / 2 / 3, atau **Auto** untuk deteksi otomatis |
| **Group** | Group A / B / C |
| **Planned Time** | Durasi shift — **7 jam** atau **5 jam** |

Setelah diisi, klik **Start Production** — sistem mulai berjalan.

---

## ➕ Cara Menambah Qty Good

Ada dua cara yang bisa digunakan, keduanya menghasilkan hasil yang sama:

| Cara | Keterangan |
|---|---|
| **Tombol ESP32** | Tekan tombol fisik yang terhubung ke mesin |
| **Keyboard `Z`** | Tekan huruf Z di keyboard komputer |

Setiap 1 kali sinyal = qty bertambah sebesar nilai **Qty/Pallet** yang diset di konfigurasi.

---

## 🔴 Downtime

Sistem akan **otomatis mendeteksi downtime** apabila tidak ada sinyal good dalam waktu melebihi standar cycle time.

Saat downtime terdeteksi:
1. Tombol **Downtime** di header berubah merah
2. Popup muncul untuk memilih **alasan downtime**
3. Timer downtime mulai berjalan

Untuk **menutup downtime**, cukup tekan tombol ESP32 atau keyboard `Z` — sistem akan otomatis:
- Menutup popup
- Mencatat log downtime beserta durasinya
- Melanjutkan timer produksi

---

## 📊 Rumus OEE

OEE terdiri dari 3 komponen utama yang dikalikan:

---

Kalau maksudnya ingin tampilannya konsisten seperti AVB (ada judul, penjelasan, rumus matematika, dan format code block), bisa dibuat seperti ini:

````md
### 📈 Availability — AVB
> Seberapa lama mesin benar-benar berjalan dari total waktu yang tersedia

$$
AVB = \frac{Runtime}{Runtime + Downtime} \times 100
$$

```text
AVB (%) = Runtime / (Runtime + Downtime) × 100
````

---

### ⚡ Performance — PFM

> Seberapa cepat mesin berproduksi dibandingkan standar yang ditetapkan

$$
CycleBase = \frac{3600}{UPH}
$$

$$
PFM = \frac{TotalQty \times CycleBase}{TotalWaktu} \times 100
$$

```text
Cycle Base (detik/unit) = 3600 / UPH

PFM (%) = (Total Qty × Cycle Base) / Total Waktu (detik) × 100
```

---

### ✅ Quality — QLY

> Rasio produk good dari seluruh produk yang diproduksi

$$
QLY = \frac{Good}{Good + NG} \times 100
$$

```text
QLY (%) = Good / (Good + NG) × 100
```

---

### 🏆 Overall Equipment Effectiveness — OEE

> Nilai keseluruhan efektivitas mesin

$$
OEE = \frac{AVB \times PFM \times QLY}{10000}
$$

```text
OEE (%) = (AVB × PFM × QLY) / 10.000
```

> Nilai maksimal OEE adalah **100%**

---

### 💡 Efficiency — EFC

> Seberapa efisien produksi dibandingkan jumlah ideal yang seharusnya tercapai

$$
CycleDisplay = \left(\frac{3600}{UPH}\right) \times QtyPerPallet
$$

$$
IdealQty = \left\lfloor \frac{TotalWaktu}{CycleDisplay} \right\rfloor \times QtyPerPallet
$$

$$
EFC = \frac{Good}{IdealQty} \times 100
$$

```text
Cycle Display = (3600 / UPH) × Qty/Pallet

Ideal Qty = floor(Total Waktu (detik) / Cycle Display)
            × Qty/Pallet

EFC (%) = Good / Ideal Qty × 100
```

---

### 🎯 Achievement — ACV

> Persentase pencapaian produksi terhadap target shift

$$
ACV = \frac{TotalQty}{Target} \times 100
$$

```text
ACV (%) = Total Qty / Target × 100
```

---

### 🧮 Total Waktu Produksi

> Total waktu yang digunakan dalam perhitungan performa dan efisiensi

$$
TotalWaktu = Runtime + Downtime
$$

```text
Total Waktu (detik) = Runtime + Downtime
```

---

### 📦 Total Quantity

> Total produk yang dihasilkan selama produksi

$$
TotalQty = Good + NG
$$

```text
Total Qty = Good + NG
```

---

### ⏱ Cycle Time

> Waktu standar yang dibutuhkan untuk menghasilkan 1 unit produk

$$
CycleTime = \frac{3600}{UPH}
$$

```text
Cycle Time (detik/unit) = 3600 / UPH
```

```

Hasilnya nanti semua parameter (AVB, PFM, QLY, OEE, EFC, ACV) punya format yang seragam dan lebih enak dibaca di dashboard, PDF, maupun halaman Help/Info Formula.
```


## 🎨 Indikator Warna

Setiap nilai OEE dan komponennya akan berubah warna otomatis:

| Warna | Kondisi | Arti |
|:---:|:---:|---|
| 🟢 **Hijau** | ≥ 100% | Tercapai / On target |
| 🔴 **Merah** | < 90% | Di bawah standar |
| ⬜ **Transparan** | 90% – 99% | Mendekati target |

---

## ⌨️ Keyboard Shortcut

Untuk memudahkan operator tanpa menggunakan mouse:

| Tombol | Fungsi |
|:---:|---|
| `Z` | Tambah qty good |
| `Space` | Aktifkan / nonaktifkan downtime |
| `D` | Buka Setting |
| `R` | Stop & reset shift |
| `E` | Export laporan ke Excel |
| `→` / `←` | Pindah slide |
| `Escape` | Tutup popup |

---

## 🕐 Jam Kerja & Break

Timer hanya berjalan pada jam kerja yang telah ditentukan. Break otomatis menghentikan timer.

**Planned 7 Jam**

| Shift | Jam Kerja | Jam Break |
|:---:|---|---|
| Shift 1 | 07:00 – 15:00 | 11:15–12:00 dan 13:15–13:30 |
| Shift 2 | 15:00 – 23:00 | 16:45–17:00 dan 18:30–19:15 |
| Shift 3 | 23:00 – 07:00 | 02:40–03:20 dan 05:10–05:30 |

**Planned 5 Jam**

| Shift | Jam Kerja | Jam Break |
|:---:|---|---|
| Shift 1 | 07:00 – 12:00 | 10:45–11:00 |
| Shift 2 | 12:00 – 17:00 | 15:45–16:00 |
| Shift 3 | 17:00 – 22:00 | 18:45–19:00 |

---

## ⏹️ Stop Shift

Setelah produksi selesai, klik tombol **Stop** di header homepage.
Sistem akan:
1. Menyimpan data OEE shift ini ke server
2. Menghapus status line dari Live Monitor
3. Mereset semua data untuk shift berikutnya

---

<div align="center">

Dibuat untuk **SIIX Production 2 — Engineering 2**

</div>
