# Transfer Create/Update Endpoints Design

## Goal

Добавить в backend API эндпоинты создания и обновления сущности `transfer` в Supabase.

## Scope

- Включено:
  - `POST /api/transfers`
  - `PATCH /api/transfers/:id`
  - валидация payload через `zod`
- Не включено:
  - изменение фронтенд-формы и submit-логики
  - изменение формата ответа list/get endpoints

## API Contract

### POST `/api/transfers`

- Request body:
  - required: `createdAt`, `transporter`, `receiver`, `container`, `price`, `cargo`
  - optional: `shippedAt` (`string | null`)
- Success: `204 No Content`
- Validation error: `400`
- Supabase error: `502`

### PATCH `/api/transfers/:id`

- Path param:
  - `id` must be positive integer
- Request body:
  - any subset of transfer fields
  - empty object is allowed
- Success: `204 No Content`
- Not found: `404`
- Validation error: `400`
- Supabase error: `502`

## Implementation Plan (Code-level)

- Add direct dependency: `zod`
- In `api/routes/transfers.ts`:
  - define `createTransferSchema`
  - define `patchTransferSchema = createTransferSchema.partial()`
  - add route handlers for `POST /transfers` and `PATCH /transfers/:id`
  - map request fields to DB columns:
    - `createdAt -> created_at`
    - `shippedAt -> shipped_at`
- Reuse existing error style (`400/404/502`) consistent with other transfers routes.

## Error Handling Rules

- Invalid JSON or schema mismatch => `400` with validation message
- Invalid `id` => `400`
- `PATCH` update with missing target row => `404`
- Supabase operation errors => `502`

## Verification

- Lint changed files.
- Run project build to confirm no regressions.

