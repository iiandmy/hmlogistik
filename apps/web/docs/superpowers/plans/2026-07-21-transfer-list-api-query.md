# Transfer List API Query Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Подключить `TransferList` к `GET /api/transfers` через отдельный API-слой в `src` с использованием `@tanstack/react-query`.

**Architecture:** Добавить слой `src/api/transfers` с типами и функцией запроса, затем подключить `QueryClientProvider` в `src/app/app.tsx`, и перевести `TransferList` на `useQuery` без моков. Компонент должен показывать loading, ошибку и данные из API, оставляя таблицу основной точкой рендера.

**Tech Stack:** React 19, TypeScript, Ant Design, TanStack Router, TanStack Query, Fetch API.

## Global Constraints

- `QueryClientProvider` размещать в `src/app/app.tsx`, не в `main.tsx`.
- Для первой итерации не добавлять UI-контролы фильтров/сортировки/пагинации.
- Ошибка запроса: пустая таблица + сообщение об ошибке, без fallback на мок.
- Использовать текущий backend-контракт `GET /api/transfers` c дефолтами `page=1`, `limit=10`, `sortBy=createdAt`, `order=desc`.

---

### Task 1: Create frontend transfers API layer

**Files:**
- Create: `src/api/transfers/types.ts`
- Create: `src/api/transfers/get-transfers.ts`
- Create: `src/api/transfers/index.ts`
- Test: `src/api/transfers/get-transfers.ts` (runtime smoke via app integration, because no dedicated test runner is configured for this area)

**Interfaces:**
- Consumes: `GET /api/transfers` response JSON from backend.
- Produces:
  - `export interface TransferDto`
  - `export interface TransfersPagination`
  - `export interface GetTransfersParams`
  - `export interface GetTransfersResponse`
  - `export async function getTransfers(params?: GetTransfersParams): Promise<GetTransfersResponse>`

- [ ] **Step 1: Write the failing test**

```ts
// Add a temporary compile-time usage in transfer-list.tsx (or a temporary scratch call)
// that expects getTransfers() to exist and return items/pagination.
// Expected fail now: module/function not found because API layer does not exist yet.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn eslint src/modules/transfer-list/components/transfer-list.tsx`  
Expected: FAIL with import/identifier not found for `getTransfers`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/api/transfers/types.ts
export interface TransferDto {
  id: number
  createdAt: string
  shippedAt: string | null
  transporter: string
  receiver: string
  container: string
  price: number
  cargo: string
}

export interface TransfersPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface GetTransfersParams {
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'shippedAt'
  order?: 'asc' | 'desc'
}

export interface GetTransfersResponse {
  items: TransferDto[]
  pagination: TransfersPagination
}
```

```ts
// src/api/transfers/get-transfers.ts
import type { GetTransfersParams, GetTransfersResponse } from './types'

const DEFAULT_PARAMS: Required<GetTransfersParams> = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  order: 'desc',
}

export async function getTransfers(params: GetTransfersParams = {}): Promise<GetTransfersResponse> {
  const merged = { ...DEFAULT_PARAMS, ...params }
  const query = new URLSearchParams({
    page: String(merged.page),
    limit: String(merged.limit),
    sortBy: merged.sortBy,
    order: merged.order,
  })

  const response = await fetch(`/api/transfers?${query.toString()}`)
  if (!response.ok) {
    throw new Error('Не удалось загрузить отправки')
  }

  return response.json() as Promise<GetTransfersResponse>
}
```

```ts
// src/api/transfers/index.ts
export { getTransfers } from './get-transfers'
export type {
  GetTransfersParams,
  GetTransfersResponse,
  TransferDto,
  TransfersPagination,
} from './types'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn eslint src/api/transfers/types.ts src/api/transfers/get-transfers.ts src/api/transfers/index.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/transfers/types.ts src/api/transfers/get-transfers.ts src/api/transfers/index.ts
git commit -m "feat: add transfers frontend api layer"
```

### Task 2: Add TanStack Query provider at app layer

**Files:**
- Modify: `src/app/app.tsx`
- Modify: `package.json` (dependency)
- Modify: `yarn.lock`
- Test: `src/app/app.tsx` (compile/lint verification)

**Interfaces:**
- Consumes:
  - `QueryClient`
  - `QueryClientProvider` from `@tanstack/react-query`
- Produces:
  - Global React Query context for all components rendered inside `App`.

- [ ] **Step 1: Write the failing test**

```ts
// Add temporary useQuery call in TransferList without provider first.
// Expected runtime fail in app: "No QueryClient set, use QueryClientProvider to set one".
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn build`  
Expected: either missing module/provider usage issue before provider wiring is complete.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/app/app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const App: FC = () => {
  return (
    <ConfigProvider ...>
      <AppContext>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AppContext>
    </ConfigProvider>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn eslint src/app/app.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/app.tsx package.json yarn.lock
git commit -m "feat: wire tanstack query provider in app"
```

### Task 3: Migrate TransferList from mock datasource to useQuery

**Files:**
- Modify: `src/modules/transfer-list/components/transfer-list.tsx`
- Modify: `src/modules/transfer-list/hooks/useTransferListColumns.tsx` (if display formatting/types require adjustment)
- Test: `src/modules/transfer-list/components/transfer-list.tsx` (behavior validation via lint/build)

**Interfaces:**
- Consumes:
  - `getTransfers(params?) => Promise<GetTransfersResponse>`
  - React Query context from Task 2
- Produces:
  - `TransferList` that requests data from backend and renders loading/error/data states.

- [ ] **Step 1: Write the failing test**

```ts
// Replace datasource usage with getTransfers/useQuery imports (before full implementation).
// Expected fail until all states and types are wired correctly.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn eslint src/modules/transfer-list/components/transfer-list.tsx`  
Expected: FAIL with unresolved types/state usage while migration is incomplete.

- [ ] **Step 3: Write minimal implementation**

```tsx
import { Alert, Flex, Table } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getTransfers } from '../../../api/transfers'

const DEFAULT_PARAMS = { page: 1, limit: 10, sortBy: 'createdAt' as const, order: 'desc' as const }

export const TransferList: FC = () => {
  const columns = useTransferListColumns()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['transfers', DEFAULT_PARAMS],
    queryFn: () => getTransfers(DEFAULT_PARAMS),
  })

  const dataSource = (data?.items ?? []).map((transfer) => ({ ...transfer, key: transfer.id }))

  return (
    <Flex vertical>
      {isError && <Alert type="error" message={(error as Error).message || 'Ошибка загрузки отправок'} showIcon />}
      <Table
        loading={isLoading}
        dataSource={dataSource}
        columns={columns}
        pagination={{ current: data?.pagination.page ?? 1, pageSize: data?.pagination.limit ?? 10, total: data?.pagination.total ?? 0 }}
      />
    </Flex>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn eslint src/modules/transfer-list/components/transfer-list.tsx src/modules/transfer-list/hooks/useTransferListColumns.tsx && yarn build`  
Expected: lint for changed files PASS; build may still fail only on known pre-existing unrelated errors.

- [ ] **Step 5: Commit**

```bash
git add src/modules/transfer-list/components/transfer-list.tsx src/modules/transfer-list/hooks/useTransferListColumns.tsx
git commit -m "feat: load transfer list from api via tanstack query"
```
