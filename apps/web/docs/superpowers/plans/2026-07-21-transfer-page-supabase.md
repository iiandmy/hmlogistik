# Transfer Page Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Подключить `transfer-page` к Supabase через backend API, чтобы `useTransfer` загружал запись по `id` и передавал ее в `initialValues`.

**Architecture:** Добавить backend endpoint `GET /api/transfers/:id`, затем добавить frontend API-функцию `getTransferById`. После этого переписать `useTransfer` на React Query и обновить `transfer-page` для корректного `loading/not-found` поведения.

**Tech Stack:** Hono, @supabase/server, React, TypeScript, @tanstack/react-query, dayjs, Ant Design.

## Global Constraints

- Backend endpoint: `GET /api/transfers/:id`.
- `id` должен быть положительным целым числом; иначе backend возвращает `400`.
- Отсутствующая запись: `404` с `{ message: 'Transfer not found' }`.
- `useTransfer` использует `@tanstack/react-query`.
- Во время загрузки на `transfer-page` показывать `Skeleton`.
- При `isError` или отсутствии записи показывать `Empty` с текстом “Не найдено”.
- Не добавлять лишний функционал вне загрузки одной записи по id.

---

### Task 1: Add backend endpoint for single transfer

**Files:**
- Modify: `api/routes/transfers.ts`
- Test: `api/routes/transfers.ts` (runtime check through `yarn dev:api` + `curl`)

**Interfaces:**
- Consumes:
  - Supabase table `transfers`
  - Existing row shape:
    - `id`, `created_at`, `shipped_at`, `transporter`, `receiver`, `container`, `price`, `cargo`
- Produces:
  - `GET /api/transfers/:id`:
    - `200` + `TransferDto`
    - `400` + validation message
    - `404` + `{ message: 'Transfer not found' }`
    - `502` + Supabase error wrapper

- [ ] **Step 1: Write the failing test**

```ts
// Add route call in browser/curl expectation:
// GET /api/transfers/1 should return one transfer, but route does not exist yet.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `curl -i http://127.0.0.1:3002/api/transfers/1`  
Expected: `404` from router (route missing).

- [ ] **Step 3: Write minimal implementation**

```ts
// In api/routes/transfers.ts add:
transfersRoute.get('/transfers/:id', withSupabase({ auth: 'none' }), async (c) => {
  const idRaw = c.req.param('id')
  const id = Number.parseInt(idRaw, 10)
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ message: '`id` must be a positive integer.' }, 400)
  }

  const { supabaseAdmin } = c.var.supabaseContext
  const { data, error } = await supabaseAdmin
    .from('transfers')
    .select('id, created_at, shipped_at, transporter, receiver, container, price, cargo')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return c.json({ message: 'Failed to fetch transfer from Supabase.', details: error.message }, 502)
  }

  if (!data) {
    return c.json({ message: 'Transfer not found' }, 404)
  }

  return c.json({
    id: data.id,
    createdAt: data.created_at,
    shippedAt: data.shipped_at,
    transporter: data.transporter,
    receiver: data.receiver,
    container: data.container,
    price: Number(data.price),
    cargo: data.cargo,
  })
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn eslint api/routes/transfers.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/routes/transfers.ts
git commit -m "feat: add transfer by id api endpoint"
```

### Task 2: Add frontend API function for transfer by id

**Files:**
- Modify: `src/api/transfers/types.ts`
- Create: `src/api/transfers/get-transfer-by-id.ts`
- Modify: `src/api/transfers/index.ts`
- Test: `src/api/transfers/get-transfer-by-id.ts` (lint/type-level validation)

**Interfaces:**
- Consumes:
  - `GET /api/transfers/:id`
- Produces:
  - `export class TransferNotFoundError extends Error`
  - `export async function getTransferById(id: string | number): Promise<TransferDto>`
  - `export type GetTransferByIdResponse = TransferDto`

- [ ] **Step 1: Write the failing test**

```ts
// In useTransfer (next task), import getTransferById before file exists.
// Expected fail: module export missing.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn eslint src/modules/transfer/hooks/useTransfer.ts`  
Expected: FAIL with unresolved import.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/api/transfers/get-transfer-by-id.ts
import type { TransferDto } from './types'

export class TransferNotFoundError extends Error {}

export async function getTransferById(id: string | number): Promise<TransferDto> {
  const response = await fetch(`/api/transfers/${id}`)

  if (response.status === 404) {
    throw new TransferNotFoundError('Transfer not found')
  }

  if (!response.ok) {
    throw new Error('Не удалось загрузить отправку')
  }

  return response.json() as Promise<TransferDto>
}
```

```ts
// src/api/transfers/types.ts
export type GetTransferByIdResponse = TransferDto
```

```ts
// src/api/transfers/index.ts
export { getTransferById, TransferNotFoundError } from './get-transfer-by-id'
export type { GetTransferByIdResponse } from './types'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn eslint src/api/transfers/types.ts src/api/transfers/get-transfer-by-id.ts src/api/transfers/index.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/transfers/types.ts src/api/transfers/get-transfer-by-id.ts src/api/transfers/index.ts
git commit -m "feat: add transfer by id frontend api function"
```

### Task 3: Migrate useTransfer and transfer-page to async query flow

**Files:**
- Modify: `src/modules/transfer/hooks/useTransfer.ts`
- Modify: `src/modules/transfer/transfer-page.tsx`
- Test: `src/modules/transfer/hooks/useTransfer.ts`, `src/modules/transfer/transfer-page.tsx`

**Interfaces:**
- Consumes:
  - `getTransferById(id) => Promise<TransferDto>`
  - `TransferNotFoundError`
  - `Transfer` type (`shippedAt: Dayjs | null`)
- Produces:
  - `useTransfer(id): { transfer: Transfer | null; isLoading: boolean; isError: boolean }`
  - `TransferPage` with `Skeleton`, `Empty`, and success render.

- [ ] **Step 1: Write the failing test**

```ts
// Change TransferPage to expect useTransfer object shape:
// const { transfer, isLoading, isError } = useTransfer(id)
// Fails because current hook returns Transfer | undefined.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn eslint src/modules/transfer/transfer-page.tsx`  
Expected: FAIL on hook return shape mismatch.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/modules/transfer/hooks/useTransfer.ts
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { Transfer } from '~shared/types/types'
import { getTransferById, TransferNotFoundError } from '../../../api/transfers'

export function useTransfer(id: string): { transfer: Transfer | null; isLoading: boolean; isError: boolean } {
  const { data, isLoading, error } = useQuery({
    queryKey: ['transfer', id],
    queryFn: async () => getTransferById(id),
  })

  if (error instanceof TransferNotFoundError) {
    return { transfer: null, isLoading: false, isError: true }
  }

  if (!data) {
    return { transfer: null, isLoading, isError: Boolean(error) }
  }

  return {
    transfer: {
      ...data,
      createdAt: dayjs(data.createdAt),
      shippedAt: data.shippedAt ? dayjs(data.shippedAt) : null,
    },
    isLoading,
    isError: false,
  }
}
```

```tsx
// src/modules/transfer/transfer-page.tsx
import { Button, Empty, Flex, Form, Skeleton, Typography } from 'antd'

const { transfer, isLoading, isError } = useTransfer(id)

if (isLoading) {
  return <Skeleton active />
}

if (isError || !transfer) {
  return <Empty description="Не найдено" />
}

// success branch uses transfer instead of initialValues
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn eslint src/modules/transfer/hooks/useTransfer.ts src/modules/transfer/transfer-page.tsx && yarn build`  
Expected: lint PASS for changed files; build may still fail only on pre-existing unrelated issues if they remain.

- [ ] **Step 5: Commit**

```bash
git add src/modules/transfer/hooks/useTransfer.ts src/modules/transfer/transfer-page.tsx
git commit -m "feat: load transfer page from supabase by id"
```

