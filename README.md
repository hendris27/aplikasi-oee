<div align="center">

# 🏭 OEE Monitoring System

### BE Line — Production 2, Engineering 2

**A real-time web-based OEE monitoring system designed for production line performance tracking.**

Production data is automatically recorded through either an ESP32 physical button or keyboard input.

</div>

---

# 🖥️ Pages

## `/` — Production Homepage

The main operational page used by operators during production.

The interface consists of three slides that rotate automatically:

| Slide      | Description                                                            |
| ---------- | ---------------------------------------------------------------------- |
| **Page 1** | OEE, Availability, Performance, Quality, and Efficiency metrics        |
| **Page 2** | Target, Ideal Quantity, Total Quantity, Good Quantity, and NG Quantity |
| **Page 3** | Achievement, Cycle Time, Real Cycle Time, Runtime, and Downtime        |

---

## `/live` — Live Monitor

Displays the real-time production status of all production lines on a single screen.

Ideal for large monitoring displays in production areas.

---

## `/all` — Report

Provides historical OEE and downtime records for all shifts.

Users can:

* View production history
* Edit records
* Delete records
* Export data to Microsoft Excel format

---

# ⚙️ Production Setup

Before starting production, click the **Setting** button located in the upper-right corner of the homepage and complete the following configuration:

| Field            | Description                                       |
| ---------------- | ------------------------------------------------- |
| **Line**         | Production line name *(e.g., BE1, BE2)*           |
| **Machine**      | Machine name                                      |
| **Model**        | Product model or part number                      |
| **Target**       | Required production quantity for the shift        |
| **UPH**          | Units Per Hour (machine standard speed)           |
| **Customer**     | Customer name                                     |
| **Qty/Pallet**   | Quantity counted for each Good signal             |
| **Shift**        | Shift 1 / Shift 2 / Shift 3 or **Auto** detection |
| **Group**        | Group A / B / C                                   |
| **Planned Time** | Shift duration: **7 Hours** or **5 Hours**        |

After completing the configuration, click **Start Production** to begin operation.

---

# ➕ Adding Good Quantity

There are two available methods to register Good production quantity:

| Method           | Description                                        |
| ---------------- | -------------------------------------------------- |
| **ESP32 Button** | Press the physical button connected to the machine |
| **Keyboard `Z`** | Press the Z key on the computer keyboard           |

Each signal increases the quantity according to the configured **Qty/Pallet** value.

---

# 🔴 Downtime Management

The system automatically detects downtime whenever no Good signal is received beyond the standard cycle time.

When downtime is detected:

1. The **Downtime** button in the header turns red
2. A popup window appears requesting a downtime reason
3. The downtime timer starts automatically

To close downtime, simply press either:

* The ESP32 button
* Keyboard `Z`

The system will automatically:

* Close the popup window
* Record the downtime event and duration
* Resume production tracking

---

# 📊 OEE Calculation Formula

OEE is calculated based on three primary performance indicators.

---

## 📈 Availability (AVB)

Measures how long the machine is actually running compared to the total available time.

$$
AVB = \frac{Runtime}{Runtime + Downtime} \times 100
$$

```text
AVB (%) = Runtime / (Runtime + Downtime) × 100
```

---

## ⚡ Performance (PFM)

Measures production speed compared to the machine's standard performance.

$$
CycleBase = \frac{3600}{UPH}
$$

$$
PFM = \frac{TotalQty \times CycleBase}{TotalTime} \times 100
$$

```text
Cycle Base (sec/unit) = 3600 / UPH

PFM (%) = (Total Qty × Cycle Base) / Total Time (sec) × 100
```

---

## ✅ Quality (QLY)

Measures the ratio of good products to total production output.

$$
QLY = \frac{Good}{Good + NG} \times 100
$$

```text
QLY (%) = Good / (Good + NG) × 100
```

---

## 🏆 Overall Equipment Effectiveness (OEE)

Represents the overall effectiveness of the production process.

$$
OEE = \frac{AVB \times PFM \times QLY}{10000}
$$

```text
OEE (%) = (AVB × PFM × QLY) / 10,000
```

**Maximum OEE Value: 100%**

---

## 💡 Efficiency (EFC)

Measures actual production efficiency compared to the ideal production quantity.

$$
CycleDisplay = \left(\frac{3600}{UPH}\right) \times QtyPerPallet
$$

$$
IdealQty = \left\lfloor \frac{TotalTime}{CycleDisplay} \right\rfloor \times QtyPerPallet
$$

$$
EFC = \frac{Good}{IdealQty} \times 100
$$

```text
Cycle Display = (3600 / UPH) × Qty/Pallet

Ideal Qty = floor(Total Time (sec) / Cycle Display)
            × Qty/Pallet

EFC (%) = Good / Ideal Qty × 100
```

---

## 🎯 Achievement (ACV)

Measures production achievement against the shift target.

$$
ACV = \frac{TotalQty}{Target} \times 100
$$

```text
ACV (%) = Total Qty / Target × 100
```

---

## 🧮 Total Production Time

Total time used for performance and efficiency calculations.

$$
TotalTime = Runtime + Downtime
$$

```text
Total Time (sec) = Runtime + Downtime
```

---

## 📦 Total Quantity

Total production output generated during the shift.

$$
TotalQty = Good + NG
$$

```text
Total Qty = Good + NG
```

---

## ⏱ Cycle Time

Standard time required to produce one unit.

$$
CycleTime = \frac{3600}{UPH}
$$

```text
Cycle Time (sec/unit) = 3600 / UPH
```

---

# 🎨 Color Indicators

OEE values and related metrics automatically change color according to performance status.

|     Color     | Condition | Meaning         |
| :-----------: | :-------: | --------------- |
|    🟢 Green   |   ≥ 100%  | Target Achieved |
|     🔴 Red    |   < 90%   | Below Standard  |
| ⬜ Transparent | 90% – 99% | Near Target     |

---

# ⌨️ Keyboard Shortcuts

The following shortcuts are available to improve operator efficiency:

|    Key    | Function                     |
| :-------: | ---------------------------- |
|    `Z`    | Add Good Quantity            |
|  `Space`  | Enable / Disable Downtime    |
|    `D`    | Open Settings                |
|    `R`    | Stop and Reset Current Shift |
|    `E`    | Export Report to Excel       |
| `→` / `←` | Switch Slides                |
|   `Esc`   | Close Popup Window           |

---

# ⏹️ End of Shift

When production is completed, click the **Stop** button in the homepage header.

The system will automatically:

1. Save the current shift OEE data to the server
2. Remove the line status from the Live Monitor page
3. Reset all production data for the next shift

---

<div align="center">

Developed for **SIIX Production 2 — Engineering 2**

</div>
