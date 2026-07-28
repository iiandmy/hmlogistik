# Frontend Transfer Mutations API Design

## Goal

Добавить на фронте API-методы для создания и обновления `transfer`, которые используют уже существующие backend endpoints.

## Scope

- Включено:
  - `createTransfer` для `POST /api/transfers`
  - `updateTransfer` для `PATCH /api/transfers/:id`
  - типы payload в `src/api/transfers/types.ts`
- Не включено:
  - интеграция этих методов в UI-формы/мутации компонентов

## Frontend API Contract

- `createTransfer(payload: CreateTransferPayload): Promise<void>`
- `updateTransfer(id: string, payload: UpdateTransferPayload): Promise<void>`

Payload types:
- `CreateTransferPayload`:
  - required: `createdAt`, `transporter`, `receiver`, `container`, `price`, `cargo`
  - optional: `shippedAt?: string | null`
- `UpdateTransferPayload`:
  - `Partial<CreateTransferPayload>`

## Error Handling

- `createTransfer`: при `!response.ok` бросает `Error`.
- `updateTransfer`:
  - `404` -> `TransferNotFoundError`
  - остальные `!ok` -> `Error`

## File Changes

- `src/api/transfers/types.ts` — добавить payload-типы.
- `src/api/transfers/create-transfer.ts` — POST-метод.
- `src/api/transfers/update-transfer.ts` — PATCH-метод.
- `src/api/transfers/index.ts` — реэкспорт методов/типов.

## Verification

- Линт измененных файлов.
- Сборка проекта.

