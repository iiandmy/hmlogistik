# Transfer Create/Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить `POST /api/transfers` и `PATCH /api/transfers/:id` для создания и обновления transfer в Supabase.

**Architecture:** Расширяем существующий `api/routes/transfers.ts` двумя mutation-endpoints и валидируем body через `zod`. Поля API маппятся в snake_case колонки БД, а ответы успешных операций возвращают `204 No Content`.

**Tech Stack:** Hono, @supabase/server, Supabase PostgREST, TypeScript, zod.

## Global Constraints

- Использовать `POST /api/transfers` и `PATCH /api/transfers/:id`.
- В `POST` обязательны: `createdAt`, `transporter`, `receiver`, `container`, `price`, `cargo`; `shippedAt` optional nullable.
- В `PATCH` разрешен любой поднабор полей, включая пустой объект.
- Успешные `POST` и `PATCH` возвращают только `204 No Content` без body.
- Невалидный `id` => `400`, отсутствующая запись в `PATCH` => `404`, ошибки Supabase => `502`.
- Валидация body должна использовать `zod` как прямую зависимость проекта.

---

### Task 1: Add request validation schemas and create endpoint

**Files:**
- Modify: `package.json`
- Modify: `yarn.lock`
- Modify: `api/routes/transfers.ts`
- Test: `api/routes/transfers.ts`

**Interfaces:**
- Consumes:
  - Supabase table columns: `created_at`, `shipped_at`, `transporter`, `receiver`, `container`, `price`, `cargo`
- Produces:
  - `POST /api/transfers` endpoint
  - `createTransferSchema` for API body validation

- [ ] **Step 1: Write the failing test**

```bash
# Start API and call missing POST endpoint
curl -i -X POST http://127.0.0.1:3002/api/transfers \
  -H "Content-Type: application/json" \
  -d '{"createdAt":"2026-07-01T00:00:00.000Z","transporter":"A","receiver":"B","container":"C","price":10,"cargo":"D"}'
```

Expected: route absent or method not allowed (not 204).

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn dev:api` in one terminal and execute the curl above in another.  
Expected: FAIL (not `204`).

- [ ] **Step 3: Write minimal implementation**

```ts
// api/routes/transfers.ts (add imports)
import { z } from 'zod'

const createTransferSchema = z.object({
  createdAt: z.string().min(1),
  shippedAt: z.string().min(1).nullable().optional(),
  transporter: z.string().min(1),
  receiver: z.string().min(1),
  container: z.string().min(1),
  price: z.number().finite(),
  cargo: z.string().min(1),
})
```

```ts
// api/routes/transfers.ts (add route)
transfersRoute.post('/transfers', withSupabase({ auth: 'none' }), async (c) => {
  let rawBody: unknown
  try {
    rawBody = await c.req.json()
  } catch {
    return c.json({ message: 'Invalid JSON body.' }, 400)
  }

  const parsed = createTransferSchema.safeParse(rawBody)
  if (!parsed.success) {
    return c.json({ message: parsed.error.issues[0]?.message ?? 'Invalid request body.' }, 400)
  }

  const body = parsed.data
  const { supabaseAdmin } = c.var.supabaseContext
  const { error } = await supabaseAdmin.from('transfers').insert({
    created_at: body.createdAt,
    shipped_at: body.shippedAt ?? null,
    transporter: body.transporter,
    receiver: body.receiver,
    container: body.container,
    price: body.price,
    cargo: body.cargo,
  })

  if (error) {
    return c.json({ message: 'Failed to create transfer in Supabase.', details: error.message }, 502)
  }

  return c.body(null, 204)
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn eslint api/routes/transfers.ts && yarn dev:api` and re-run POST curl.  
Expected: eslint PASS and POST returns `204 No Content`.

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock api/routes/transfers.ts
git commit -m "feat: add transfer create endpoint with zod validation"
```

### Task 2: Add patch endpoint with id/body validation and not-found handling

**Files:**
- Modify: `api/routes/transfers.ts`
- Test: `api/routes/transfers.ts`

**Interfaces:**
- Consumes:
  - `createTransferSchema`
  - `PATCH /api/transfers/:id` path param
- Produces:
  - `patchTransferSchema`
  - `PATCH /api/transfers/:id` endpoint returning 204/400/404/502

- [ ] **Step 1: Write the failing test**

```bash
curl -i -X PATCH http://127.0.0.1:3002/api/transfers/999999999 \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: route absent or wrong status (not controlled 404/400/204 behavior yet).

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn dev:api` and execute PATCH curl above plus invalid id check:

```bash
curl -i -X PATCH http://127.0.0.1:3002/api/transfers/abc -H "Content-Type: application/json" -d '{}'
```

Expected: FAIL relative to target contract.

- [ ] **Step 3: Write minimal implementation**

```ts
const patchTransferSchema = createTransferSchema.partial()

transfersRoute.patch('/transfers/:id', withSupabase({ auth: 'none' }), async (c) => {
  const transferId = Number.parseInt(c.req.param('id'), 10)
  if (!Number.isFinite(transferId) || transferId < 1) {
    return c.json({ message: '`id` must be a positive integer.' }, 400)
  }

  let rawBody: unknown
  try {
    rawBody = await c.req.json()
  } catch {
    return c.json({ message: 'Invalid JSON body.' }, 400)
  }

  const parsed = patchTransferSchema.safeParse(rawBody)
  if (!parsed.success) {
    return c.json({ message: parsed.error.issues[0]?.message ?? 'Invalid request body.' }, 400)
  }

  const body = parsed.data
  const payload: Record<string, unknown> = {}
  if (body.createdAt !== undefined) payload.created_at = body.createdAt
  if (body.shippedAt !== undefined) payload.shipped_at = body.shippedAt
  if (body.transporter !== undefined) payload.transporter = body.transporter
  if (body.receiver !== undefined) payload.receiver = body.receiver
  if (body.container !== undefined) payload.container = body.container
  if (body.price !== undefined) payload.price = body.price
  if (body.cargo !== undefined) payload.cargo = body.cargo

  const { supabaseAdmin } = c.var.supabaseContext
  const { error, count } = await supabaseAdmin
    .from('transfers')
    .update(payload)
    .eq('id', transferId)
    .select('id', { count: 'exact', head: true })

  if (error) {
    return c.json({ message: 'Failed to update transfer in Supabase.', details: error.message }, 502)
  }

  if ((count ?? 0) === 0) {
    return c.json({ message: 'Transfer not found' }, 404)
  }

  return c.body(null, 204)
})
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
yarn eslint api/routes/transfers.ts
yarn build
curl -i -X PATCH http://127.0.0.1:3002/api/transfers/abc -H "Content-Type: application/json" -d '{}'
curl -i -X PATCH http://127.0.0.1:3002/api/transfers/999999999 -H "Content-Type: application/json" -d '{}'
```

Expected:
- lint PASS
- build PASS (or only known unrelated pre-existing failures)
- invalid id => `400`
- missing id => `404`

- [ ] **Step 5: Commit**

```bash
git add api/routes/transfers.ts
git commit -m "feat: add transfer patch endpoint with zod validation"
```

