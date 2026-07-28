# Frontend Transfer Mutations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в `src/api/transfers` фронтовые методы `createTransfer` и `updateTransfer` для backend `POST/PATCH` endpoints.

**Architecture:** Расширяем существующий API-слой `src/api/transfers` двумя отдельными файлами мутаций и типами payload в `types.ts`. Методы используют `fetch`, обрабатывают `204` как `void`, а ошибки преобразуют в предсказуемые исключения.

**Tech Stack:** TypeScript, Fetch API, existing frontend API layer in `src/api/transfers`.

## Global Constraints

- `createTransfer` -> `POST /api/transfers`, возвращает `Promise<void>`.
- `updateTransfer` -> `PATCH /api/transfers/:id`, возвращает `Promise<void>`.
- `CreateTransferPayload`: required `createdAt`, `transporter`, `receiver`, `container`, `price`, `cargo`; optional `shippedAt?: string | null`.
- `UpdateTransferPayload`: `Partial<CreateTransferPayload>`.
- `updateTransfer` на `404` бросает `TransferNotFoundError`, остальные ошибки — `Error`.
- Проверка: линт изменённых файлов + `yarn build`.

---

### Task 1: Add payload types and createTransfer method

**Files:**
- Modify: `src/api/transfers/types.ts`
- Create: `src/api/transfers/create-transfer.ts`
- Modify: `src/api/transfers/index.ts`
- Test: `src/api/transfers/types.ts`, `src/api/transfers/create-transfer.ts`, `src/api/transfers/index.ts`

**Interfaces:**
- Consumes: backend `POST /api/transfers` returning `204`.
- Produces:
  - `CreateTransferPayload`
  - `createTransfer(payload: CreateTransferPayload): Promise<void>`

- [ ] **Step 1: Write the failing test**

```ts
// In a temporary usage site, import createTransfer before method exists.
// Expected failure: unresolved import.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn eslint src/api/transfers/index.ts`  
Expected: FAIL due to missing export.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/api/transfers/types.ts
export interface CreateTransferPayload {
  createdAt: string
  shippedAt?: string | null
  transporter: string
  receiver: string
  container: string
  price: number
  cargo: string
}
```

```ts
// src/api/transfers/create-transfer.ts
import type { CreateTransferPayload } from './types'

export async function createTransfer(payload: CreateTransferPayload): Promise<void> {
  const response = await fetch('/api/transfers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Не удалось создать отправку')
  }
}
```

```ts
// src/api/transfers/index.ts
export { createTransfer } from './create-transfer'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn eslint src/api/transfers/types.ts src/api/transfers/create-transfer.ts src/api/transfers/index.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/transfers/types.ts src/api/transfers/create-transfer.ts src/api/transfers/index.ts
git commit -m "feat: add createTransfer frontend api method"
```

### Task 2: Add updateTransfer method and not-found handling

**Files:**
- Modify: `src/api/transfers/types.ts`
- Create: `src/api/transfers/update-transfer.ts`
- Modify: `src/api/transfers/index.ts`
- Test: `src/api/transfers/update-transfer.ts`, `src/api/transfers/index.ts`

**Interfaces:**
- Consumes:
  - `CreateTransferPayload`
  - `TransferNotFoundError` from `get-transfer-by-id.ts`
  - backend `PATCH /api/transfers/:id` returning `204`, `404`
- Produces:
  - `UpdateTransferPayload = Partial<CreateTransferPayload>`
  - `updateTransfer(id: string, payload: UpdateTransferPayload): Promise<void>`

- [ ] **Step 1: Write the failing test**

```ts
// In temporary usage, call updateTransfer before file/export exists.
// Expected failure: unresolved import.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn eslint src/api/transfers/index.ts`  
Expected: FAIL due to missing export.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/api/transfers/types.ts
export type UpdateTransferPayload = Partial<CreateTransferPayload>
```

```ts
// src/api/transfers/update-transfer.ts
import { TransferNotFoundError } from './get-transfer-by-id'
import type { UpdateTransferPayload } from './types'

export async function updateTransfer(id: string, payload: UpdateTransferPayload): Promise<void> {
  const response = await fetch(`/api/transfers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (response.status === 404) {
    throw new TransferNotFoundError()
  }

  if (!response.ok) {
    throw new Error('Не удалось обновить отправку')
  }
}
```

```ts
// src/api/transfers/index.ts
export { updateTransfer } from './update-transfer'
export type { CreateTransferPayload, UpdateTransferPayload } from './types'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn eslint src/api/transfers/types.ts src/api/transfers/update-transfer.ts src/api/transfers/index.ts && yarn build`  
Expected: eslint PASS and build PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/transfers/types.ts src/api/transfers/update-transfer.ts src/api/transfers/index.ts
git commit -m "feat: add updateTransfer frontend api method"
```

