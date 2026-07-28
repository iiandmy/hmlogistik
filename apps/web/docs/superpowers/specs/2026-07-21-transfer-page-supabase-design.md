# Transfer Page Supabase Design

## Goal

Перевести `transfer-page` с мок-источника на данные из Supabase через backend API так, чтобы `useTransfer` получал запись по `id` и отдавал ее в `initialValues`.

## Scope

- Включено:
  - `GET /api/transfers/:id` на backend.
  - API-функция на фронте для запроса одной отправки.
  - Перепись `useTransfer` на `@tanstack/react-query`.
  - Состояния `loading` (Skeleton) и `not found` (Empty).
- Не включено:
  - Редактирование/сохранение transfer.
  - Дополнительные UI-фильтры.

## Backend Contract

- Endpoint: `GET /api/transfers/:id`
- Validation:
  - `id` должен быть положительным целым числом, иначе `400`.
- Responses:
  - `200`: `TransferDto` (`id`, `createdAt`, `shippedAt`, `transporter`, `receiver`, `container`, `price`, `cargo`)
  - `404`: `{ message: 'Transfer not found' }`
  - `502`: при ошибке Supabase

## Frontend API Layer

- `src/api/transfers/get-transfer-by-id.ts`
  - fetch `/api/transfers/:id`
  - 404 маппится в controlled error “not found”
  - прочие `!ok` -> общая ошибка загрузки
- `src/api/transfers/types.ts`
  - добавить тип ответа одной записи (alias `TransferDto`)
- `src/api/transfers/index.ts`
  - реэкспорт новой API-функции/типов

## Hook and Page Flow

- `useTransfer(id)`:
  - использует `useQuery` + `getTransferById`
  - преобразует даты в `dayjs`
  - возвращает `{ transfer, isLoading, isError }`
- `transfer-page.tsx`:
  - `isLoading` -> `Skeleton`
  - `isError` или `transfer === null` -> `Empty` с текстом “Не найдено”
  - success -> `TransferForm initialValues={transfer}`

## Error Handling

- Ошибки API не приводят к крэшу страницы.
- 404 трактуется как пустое состояние карточки.
- Невалидный `id` обрабатывается как backend 400, на UI показывается `Empty`.

## Verification

- Линт измененных файлов.
- Сборка проекта (допуская фиксацию известных несвязанных ошибок отдельно от текущей задачи).

