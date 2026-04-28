# Phase 1 — ระบบพื้นฐานทำงานได้ครบวงจร

**เป้าหมาย**: บันทึก / ดู / แก้ไข / ลบ ธุรกรรม + Dashboard ภาพรวมประจำเดือน

**Stack**: Next.js 16 App Router · React 19 · Tailwind v4 · TypeScript · JSON file storage

---

## สิ่งที่ยังไม่มีใน repo

ปัจจุบันมีเพียง scaffold เริ่มต้น (`layout.tsx`, `page.tsx`, `globals.css`) — ต้องสร้างทุกอย่างตั้งแต่ต้น

---

## ขั้นตอน Phase 1

### Step 1 — Data seed + Types (Foundation)

สร้างข้อมูลเริ่มต้นและ TypeScript interfaces ก่อนทุกอย่าง

**ไฟล์ที่ต้องสร้าง:**

```
data/
  categories.json          ← seed หมวดหมู่ตาม schema
  settings.json            ← seed ค่าเริ่มต้น (THB, budget 30000)
  transactions/
    2026-04.json           ← seed ธุรกรรมตัวอย่าง 5-10 รายการ

src/common/type/interface.ts          ← re-export ทุก type
src/modules/transactions/transaction.type.ts
src/modules/monthly/monthly.type.ts
src/modules/categories/category.type.ts
```

**Types หลัก (ตาม structure):**
- `Transaction`, `MonthlyFile`, `TransactionType`
- `MonthlySummary`, `Category`, `Categories`
- `Settings`

---

### Step 2 — Lib Helpers

```
src/lib/json-store.ts      ← readJson<T>(path), writeJson<T>(path, data)
src/lib/date.ts            ← formatDate, parseYearMonth, getMonthKey (YYYY-MM)
src/common/utils/currency.ts  ← formatCurrency(amount, currency?)
```

**json-store.ts** ต้องรองรับ:
- อ่าน/เขียนไฟล์ใน `data/` (ใช้ `fs/promises` + `path`)
- สร้างไฟล์ใหม่อัตโนมัติถ้าไม่มี (transactions/YYYY-MM.json)
- Thread-safe เบื้องต้น (ไม่ต้อง lock ใน Phase 1)

---

### Step 3 — API Routes

สร้าง API layer ให้ครบก่อน UI — ทดสอบด้วย curl ได้เลย

#### 3a. `/api/ledger/categories` — route.ts
- `GET` → อ่าน `data/categories.json`

#### 3b. `/api/ledger/settings` — route.ts
- `GET` → อ่าน `data/settings.json`
- `PUT` → เขียน `data/settings.json`

#### 3c. `/api/ledger/transactions` — route.ts
- `GET` → query params: `year`, `month`, `type?`, `categoryId?`
  - อ่าน `data/transactions/YYYY-MM.json`
  - filter ตาม type/categoryId ถ้ามี
- `POST` → รับ body, สร้าง id (`txn_` + nanoid 6 ตัว), เพิ่มใน array แล้ว save

#### 3d. `/api/ledger/transactions/[id]` — route.ts
- `GET` → หา transaction ตาม id (ต้องรู้ month ก่อน → ส่ง `date` มาใน query)
- `PUT` → แก้ไข transaction ใน file เดิม
- `DELETE` → ลบ transaction ออกจาก array

#### 3e. `/api/ledger/monthly` — route.ts
- `GET` → query: `year`, `month`
  - อ่าน transactions ของเดือนนั้น
  - คำนวณ `totalIncome`, `totalExpense`, `balance`
  - สร้าง `byCategory[]` และ `dailyBreakdown[]`

---

### Step 4 — Root Layout + Navigation

ปรับ `src/app/layout.tsx` ให้มี sidebar + header พร้อมใช้งาน

```
src/components/layout/
  sidebar.tsx     ← nav links: Dashboard, ธุรกรรม, รายเดือน, หมวดหมู่, รายงาน
  header.tsx      ← ชื่อหน้า + MonthPicker (รับ context)
  footer.tsx      ← optional ใน Phase 1

src/common/contexts/LedgerContext.tsx
  ← selectedYear, selectedMonth, setMonth()
  ← useSettings() (load ครั้งเดียว)
```

Layout หน้าตา: sidebar ซ้าย (fixed) + main content ขวา — mobile ยังไม่ต้องทำ

```
src/components/ui/
  MonthPicker.tsx    ← dropdown เลือก YYYY-MM
  SummaryCard.tsx    ← การ์ดรายรับ / รายจ่าย / คงเหลือ
  CategoryBadge.tsx  ← badge สี + icon ของหมวดหมู่
  TransactionCard.tsx ← แสดง 1 ธุรกรรม
```

---

### Step 5 — Dashboard Page

`src/app/dashboard/page.tsx` + `src/modules/dashboard/dashboard.container.tsx`

**แสดง:**
- SummaryCard ×3 (รายรับ / รายจ่าย / คงเหลือ) — ดึงจาก `/api/ledger/monthly`
- รายการธุรกรรมล่าสุด 5 รายการ — ดึงจาก `/api/ledger/transactions`
- MonthPicker ใน header เพื่อเปลี่ยนเดือน

`src/app/page.tsx` → redirect ไป `/dashboard`

---

### Step 6 — Transaction Pages

#### 6a. รายการธุรกรรม `/transactions`
`src/modules/transactions/transaction-list.container.tsx`
- ดึงข้อมูลจาก `/api/ledger/transactions?year=&month=`
- แสดง TransactionCard เรียงตามวันที่ล่าสุดก่อน
- ปุ่ม "บันทึกรายการใหม่" → ไปหน้า `/transactions/new`
- กด card → ไปหน้า `/transactions/[id]`

#### 6b. บันทึกธุรกรรมใหม่ `/transactions/new`
`src/modules/transactions/transaction-form.container.tsx`
- Form: วันที่, ประเภท (income/expense), หมวดหมู่, จำนวนเงิน, คำอธิบาย, หมายเหตุ
- Submit → `POST /api/ledger/transactions` → redirect ไป `/transactions`

#### 6c. แก้ไขธุรกรรม `/transactions/[id]`
- Load ข้อมูลเดิม → แสดงใน form เดียวกัน
- Submit → `PUT /api/ledger/transactions/[id]`
- ปุ่มลบ → `DELETE /api/ledger/transactions/[id]` → confirm ก่อน

---

## สิ่งที่ยัง **ไม่ทำ** ใน Phase 1

| Feature | Phase |
|---------|-------|
| หน้า Monthly Summary (กราฟ) | 2 |
| หน้า Categories (CRUD) | 2 |
| หน้า Reports | 2 |
| หน้า Settings | 2 |
| Mobile responsive | 2 |
| Search / Filter ใน transaction list | 2 |
| Tags | 2 |

---

## ลำดับการสร้าง (แนะนำ)

```
1 → data seed + types
2 → lib helpers (json-store, date, currency)
3 → API routes (ทดสอบด้วย curl)
4 → LedgerContext + Layout + UI components พื้นฐาน
5 → Dashboard page
6 → Transaction list → new → edit/delete
```

แต่ละ step ต้องทดสอบก่อนไป step ถัดไป

---

## เช็คลิสต์ก่อน Phase 1 เสร็จ

- [ ] `GET /api/ledger/transactions?year=2026&month=4` คืน JSON ถูกต้อง
- [ ] `POST /api/ledger/transactions` สร้างรายการใหม่ใน data file ได้
- [ ] `PUT /api/ledger/transactions/[id]` แก้ไขได้
- [ ] `DELETE /api/ledger/transactions/[id]` ลบได้
- [ ] `GET /api/ledger/monthly?year=2026&month=4` คืน summary ถูกต้อง
- [ ] Dashboard แสดง summary การ์ดและรายการล่าสุดได้
- [ ] บันทึกรายการใหม่ → ข้อมูลปรากฏใน list ทันที
- [ ] แก้ไข/ลบรายการจากหน้า `/transactions/[id]` ได้
