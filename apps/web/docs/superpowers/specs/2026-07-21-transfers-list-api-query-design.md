# Transfers List API Query Design

## Goal

Подключить `TransferList` к backend-эндпоинту `GET /api/transfers`, убрать зависимость от мок-списка в UI, и добавить отдельный API-слой в `src` с использованием `@tanstack/react-query`.

## Scope

- Включено:
  - API-слой для запроса списка отправок в `src/api/transfers`.
  - Подключение `@tanstack/react-query`.
  - Интеграция `TransferList` с API через `useQuery`.
  - Базовая обработка loading/error/success состояний.
- Не включено:
  - UI-контролы фильтрации/сортировки/пагинации (в следующем шаге).
  - Fallback на мок-данные при ошибке.

## API Contract (Frontend side)

- Query по умолчанию:
  - `page=1`
  - `limit=10`
  - `sortBy=createdAt`
  - `order=desc`
- Ответ:
  - `items: TransferDto[]`
  - `pagination: { page: number; limit: number; total: number; totalPages: number }`
- `TransferDto`:
  - `id: number`
  - `createdAt: string`
  - `shippedAt: string | null`
  - `transporter: string`
  - `receiver: string`
  - `container: string`
  - `price: number`
  - `cargo: string`

## Architecture

1. `src/api/transfers/types.ts`
   - Контракт запроса/ответа и DTO.
2. `src/api/transfers/get-transfers.ts`
   - Функция запроса к `/api/transfers`.
   - Сборка query string.
   - Ошибка при `!response.ok`.
3. `src/api/transfers/index.ts`
   - Реэкспорт публичных API-функций/типов.
4. `src/app/app.tsx`
   - `QueryClient` + `QueryClientProvider` вокруг текущего приложения.
5. `src/modules/transfer-list/components/transfer-list.tsx`
   - Использует `useQuery` вместо мок-источника.
   - Рендерит таблицу по API-данным.
   - Пустая таблица + `Alert` при ошибке.

## Data Flow

1. `TransferList` монтируется.
2. `useQuery` вызывает `getTransfers(defaultParams)`.
3. API-слой делает `fetch('/api/transfers?...')`.
4. Успех: данные попадают в таблицу.
5. Ошибка: показывается `Alert`, таблица пустая.

## Error Handling

- Любой HTTP status `>=400` обрабатывается как ошибка запроса.
- В `TransferList` показывается пользовательское сообщение без fallback на мок.
- Компонент не падает, а продолжает рендер пустой `Table`.

## Testing/Verification

- Проверка линта измененных файлов.
- Проверка сборки проекта.
- Если в проекте остаются несвязанные pre-existing ошибки, фиксируются отдельно и не блокируют описание результата по текущей задаче.

