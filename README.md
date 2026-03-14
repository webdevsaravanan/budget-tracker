# 💰 Budget Tracker — Angular 17+

A mobile-first personal finance tracker built with Angular 17 standalone components,
Tailwind CSS, and npoint.io as the backend.

---

## 🗂 Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   ├── transaction.model.ts
│   │   │   └── budget.model.ts
│   │   └── services/
│   │       ├── transaction.service.ts   ← fetches from npoint
│   │       ├── budget.service.ts        ← reads/writes budget to npoint
│   │       └── toast.service.ts
│   ├── pages/
│   │   ├── home/
│   │   ├── search/
│   │   └── budget/
│   ├── shared/
│   │   └── components/
│   │       ├── bottom-nav/
│   │       ├── circular-progress/       ← SVG donut chart
│   │       ├── transaction-item/        ← reusable tx row
│   │       └── toast/
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
└── styles.scss
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js 18+
- npm 9+
- Angular CLI 17

### 1. Install Angular CLI (if not already)
```bash
npm install -g @angular/cli@17
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
ng serve
```

Open → **http://localhost:4200**

---

## 🔌 API Endpoints

Both are configured in the services:

| Service | URL |
|---|---|
| Transactions (read) | `https://api.npoint.io/e38b788a1721f85a81b3` |
| Budget (read/write) | `https://api.npoint.io/28daca92ce54a38ab4bb` |

To update URLs, edit:
- `src/app/core/services/transaction.service.ts` → `private readonly API`
- `src/app/core/services/budget.service.ts` → `private readonly API`

---

## 📱 Pages

### Home (`/`)
- Circular SVG donut chart: Debit spent vs Budget
- Month filter chips (auto-generated from transaction data)
- Stats bar: Budget · Safe/day · Days left
- Recent 8 transactions

### Search (`/search`)
- Live text search across transaction IDs & accounts
- Filter by specific date (date picker)
- Filter by month (dropdown)
- Filter by type: All / Debit / Credit
- Filter by account number
- Sticky footer: total Debit, Credit, Net

### Budget (`/budget`)
- View active budget with progress bar
- Create / Edit: enter Amount + Days → calculates daily allowance preview
- Delete budget
- All changes saved to npoint API (POST)

---

## 🏗 Build for Production

```bash
ng build
```

Output in `dist/budget-tracker/browser/`

---

## 🎨 Customisation

### Colours (tailwind.config.js)
```js
colors: {
  accent:  '#5e7bff',   // blue — chart, active nav
  accent2: '#7c5cfc',   // purple — account chips
  debit:   '#ff5f5f',   // red
  credit:  '#32d583',   // green
}
```

### Add more transaction sources
The `TransactionService` reads the npoint array directly.
Each item needs: `id`, `date`, `amount`, `source`, `account`, `created`, `transactionType`.

---

## 🔧 Tech Stack

| Tool | Purpose |
|---|---|
| Angular 17 | Framework (standalone components, signals) |
| Tailwind CSS 3 | Utility-first styling |
| RxJS | HTTP + reactive state |
| Angular Signals | Local component state |
| npoint.io | JSON storage API |
| Space Grotesk | UI font |
| JetBrains Mono | Numbers / amounts |
