# โครงสร้างโปรเจค Ledger — ระบบบัญชีรายรับ-รายจ่าย

## โครงสร้างโฟลเดอร์

```
Ledger/
├── .next/
├── node_modules/
├── public/
│   └── favicon.ico
│
├── data/                              # ข้อมูล JSON (local storage)
│   ├── transactions/                  # ธุรกรรมรายวัน แยกตามเดือน
│   │   ├── 2026-04.json               # ธุรกรรมเดือน เมษายน 2026
│   │   └── 2026-05.json
│   ├── categories.json                # หมวดหมู่รายรับ-รายจ่าย
│   └── settings.json                  # ตั้งค่าระบบ (สกุลเงิน, งบประมาณ)
│
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root Layout
│   │   ├── page.tsx                   # Redirect → /dashboard
│   │   │
│   │   ├── dashboard/                 # หน้าภาพรวม
│   │   │   └── page.tsx
│   │   │
│   │   ├── transactions/              # หน้าธุรกรรม
│   │   │   ├── page.tsx               # รายการธุรกรรมทั้งหมด
│   │   │   ├── new/
│   │   │   │   └── page.tsx           # บันทึกธุรกรรมใหม่
│   │   │   └── [id]/
│   │   │       └── page.tsx           # แก้ไข/ดูรายละเอียดธุรกรรม
│   │   │
│   │   ├── monthly/                   # หน้าสรุปรายเดือน
│   │   │   └── page.tsx
│   │   │
│   │   ├── categories/                # หน้าจัดการหมวดหมู่
│   │   │   └── page.tsx
│   │   │
│   │   ├── reports/                   # หน้ารายงาน
│   │   │   └── page.tsx
│   │   │
│   │   └── api/                       # Next.js API Routes (อ่าน/เขียน JSON)
│   │       └── ledger/
│   │           ├── transactions/
│   │           │   ├── route.ts       # GET (list), POST (create)
│   │           │   └── [id]/
│   │           │       └── route.ts   # GET, PUT, DELETE
│   │           ├── monthly/
│   │           │   └── route.ts       # GET summary by month
│   │           ├── categories/
│   │           │   └── route.ts       # GET, POST, PUT, DELETE
│   │           └── settings/
│   │               └── route.ts       # GET, PUT
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── footer.tsx
│   │   └── ui/
│   │       ├── TransactionCard.tsx    # การ์ดแสดงรายการธุรกรรม
│   │       ├── SummaryCard.tsx        # การ์ดสรุปรายรับ/รายจ่าย/คงเหลือ
│   │       ├── CategoryBadge.tsx      # Badge หมวดหมู่
│   │       └── MonthPicker.tsx        # ตัวเลือกเดือน
│   │
│   ├── modules/
│   │   ├── dashboard/
│   │   │   ├── dashboard.container.tsx
│   │   │   └── dashboard.type.ts
│   │   ├── transactions/
│   │   │   ├── transaction-list.container.tsx
│   │   │   ├── transaction-form.container.tsx
│   │   │   ├── transaction.service.ts  # ฟังก์ชัน CRUD ผ่าน API Route
│   │   │   └── transaction.type.ts
│   │   ├── monthly/
│   │   │   ├── monthly-summary.container.tsx
│   │   │   ├── monthly.service.ts
│   │   │   └── monthly.type.ts
│   │   ├── categories/
│   │   │   ├── category.container.tsx
│   │   │   ├── category.service.ts
│   │   │   └── category.type.ts
│   │   └── reports/
│   │       ├── report.container.tsx
│   │       └── report.type.ts
│   │
│   ├── lib/
│   │   ├── json-store.ts              # helper อ่าน/เขียนไฟล์ JSON
│   │   └── date.ts                    # helper จัดการวันที่ (format, parse)
│   │
│   ├── common/
│   │   ├── contexts/
│   │   │   └── LedgerContext.tsx      # Global state (เดือนที่เลือก, filter)
│   │   ├── utils/
│   │   │   └── currency.ts            # format ตัวเลข/สกุลเงิน
│   │   └── type/
│   │       └── interface.ts
│   │
│   └── styles/
│       └── globals.css
│
├── .env.local
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## JSON Schema

### `data/transactions/YYYY-MM.json`

```json
{
  "year": 2026,
  "month": 4,
  "transactions": [
    {
      "id": "txn_abc123",
      "date": "2026-04-24",
      "type": "income",
      "categoryId": "cat_001",
      "amount": 15000,
      "description": "เงินเดือน",
      "note": "",
      "tags": ["salary"],
      "createdAt": "2026-04-24T08:00:00.000Z",
      "updatedAt": "2026-04-24T08:00:00.000Z"
    },
    {
      "id": "txn_xyz789",
      "date": "2026-04-24",
      "type": "expense",
      "categoryId": "cat_010",
      "amount": 350,
      "description": "ข้าวกลางวัน",
      "note": "ร้านข้าวมันไก่",
      "tags": ["food"],
      "createdAt": "2026-04-24T12:30:00.000Z",
      "updatedAt": "2026-04-24T12:30:00.000Z"
    }
  ]
}
```

### `data/categories.json`

```json
{
  "income": [
    { "id": "cat_001", "name": "เงินเดือน",        "icon": "💼", "color": "#22c55e" },
    { "id": "cat_002", "name": "รายได้เสริม",      "icon": "💡", "color": "#16a34a" },
    { "id": "cat_003", "name": "ดอกเบี้ย/ปันผล",   "icon": "📈", "color": "#15803d" },
    { "id": "cat_004", "name": "อื่นๆ (รายรับ)",   "icon": "➕", "color": "#4ade80" }
  ],
  "expense": [
    { "id": "cat_010", "name": "อาหาร",            "icon": "🍜", "color": "#ef4444" },
    { "id": "cat_011", "name": "ที่พัก/ค่าเช่า",   "icon": "🏠", "color": "#dc2626" },
    { "id": "cat_012", "name": "เดินทาง",           "icon": "🚗", "color": "#f97316" },
    { "id": "cat_013", "name": "สาธารณูปโภค",      "icon": "💡", "color": "#eab308" },
    { "id": "cat_014", "name": "สุขภาพ",           "icon": "🏥", "color": "#a855f7" },
    { "id": "cat_015", "name": "บันเทิง",          "icon": "🎮", "color": "#ec4899" },
    { "id": "cat_016", "name": "การศึกษา",         "icon": "📚", "color": "#6366f1" },
    { "id": "cat_017", "name": "เสื้อผ้า/ของใช้",  "icon": "👕", "color": "#0ea5e9" },
    { "id": "cat_018", "name": "อื่นๆ (รายจ่าย)",  "icon": "➖", "color": "#94a3b8" }
  ]
}
```

### `data/settings.json`

```json
{
  "currency": "THB",
  "currencySymbol": "฿",
  "locale": "th-TH",
  "monthlyBudget": {
    "enabled": true,
    "amount": 30000
  },
  "startDayOfMonth": 1
}
```

---

## Data Flow

```
หน้า (page.tsx)
  └── Container (module/*.container.tsx)
        ├── เรียก service.ts   ──→  fetch /api/ledger/...
        │                                └── API Route (route.ts)
        │                                      └── json-store.ts (อ่าน/เขียน data/*.json)
        └── render UI components
```

---

## TypeScript Interfaces หลัก

```ts
// transaction.type.ts
type TransactionType = 'income' | 'expense'

interface Transaction {
  id: string
  date: string           // YYYY-MM-DD
  type: TransactionType
  categoryId: string
  amount: number
  description: string
  note?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

interface MonthlyFile {
  year: number
  month: number
  transactions: Transaction[]
}

// monthly.type.ts
interface MonthlySummary {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
  balance: number
  byCategory: {
    categoryId: string
    total: number
  }[]
  dailyBreakdown: {
    date: string
    income: number
    expense: number
  }[]
}

// category.type.ts
interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Categories {
  income: Category[]
  expense: Category[]
}
```

---

## API Routes Summary

| Method | Path                            | หน้าที่                           |
|--------|---------------------------------|-----------------------------------|
| GET    | /api/ledger/transactions        | ดึงรายการ (query: year, month, type, categoryId) |
| POST   | /api/ledger/transactions        | เพิ่มธุรกรรมใหม่                  |
| GET    | /api/ledger/transactions/[id]   | ดูรายละเอียด 1 รายการ             |
| PUT    | /api/ledger/transactions/[id]   | แก้ไขธุรกรรม                      |
| DELETE | /api/ledger/transactions/[id]   | ลบธุรกรรม                         |
| GET    | /api/ledger/monthly             | ดึงสรุปรายเดือน (query: year, month) |
| GET    | /api/ledger/categories          | ดึงหมวดหมู่ทั้งหมด               |
| POST   | /api/ledger/categories          | เพิ่มหมวดหมู่ใหม่                 |
| PUT    | /api/ledger/categories/[id]     | แก้ไขหมวดหมู่                     |
| DELETE | /api/ledger/categories/[id]     | ลบหมวดหมู่                        |
| GET    | /api/ledger/settings            | ดึงการตั้งค่า                     |
| PUT    | /api/ledger/settings            | บันทึกการตั้งค่า                  |
