# Plan: Unify Query/Mutation Signatures (params + options pattern)

## Goal

Refactor all query and mutation hooks in `apps/web/src/api/*` to follow a consistent pattern:
- **1st argument**: all parameters for the request (args, body, etc.)
- **2nd argument (optional)**: options for the query/mutation (e.g., `enabled`, `retry`, `onSuccess`, `onError`)

## Current Problems

1. **Inconsistent signatures** — some hooks take params directly (e.g., `useTransfersList(params)`), others take `id` as a separate arg (e.g., `useUpdateTransfer(id)`)
2. **No way to pass query/mutation options** — consumers have to call `.mutate({...}, { onSuccess, onError })` instead of passing options at the hook level
3. **`id` as a positional argument** — breaks the pattern of "all params in one object"

## Target Pattern

### Queries

```typescript
// Before
export const useTransfersList = (params: GetTransfersParams = {}): UseQueryResult<GetTransfersResponse> => useQuery({...});

// After
export const useTransfersList = (
    params: GetTransfersParams = {},
    options?: UseQueryOptions<GetTransfersResponse>,
): UseQueryResult<GetTransfersResponse> => useQuery({
    ...queryOptions,
    ...options,
});
```

### Mutations

```typescript
// Before
export const useUpdateTransfer = (id: string): UseMutationResult<void, Error, UpdateTransferInput> => {
    const queryClient = useQueryClient();
    return useMutation({...});
};

// After
export const useUpdateTransfer = (
    params: { id: string },
    options?: UseMutationOptions<void, Error, UpdateTransferInput>,
): UseMutationResult<void, Error, UpdateTransferInput> => {
    const queryClient = useQueryClient();
    return useMutation({...});
};
```

## Changes by Module

### 1. Transfers (the only fully implemented module)

#### `api/mutations.ts`

| Hook | Current Signature | New Signature |
|------|-----------------|---------------|
| `useCreateTransfer` | `(): UseMutationResult<...>` | `(options?: UseMutationOptions<...>): UseMutationResult<...>` |
| `useUpdateTransfer` | `(id: string): UseMutationResult<...>` | `(params: { id: string }, options?: UseMutationOptions<...>): UseMutationResult<...>` |

#### `api/queries.ts`

| Hook | Current Signature | New Signature |
|------|-----------------|---------------|
| `useTransfersList` | `(params: GetTransfersParams = {}): UseQueryResult<...>` | `(params: GetTransfersParams = {}, options?: UseQueryOptions<...>): UseQueryResult<...>` |
| `useTransferDetail` | `(id: string): UseQueryResult<...>` | `(params: { id: string }, options?: UseQueryOptions<...>): UseQueryResult<...>` |

### 2. Avia Transfers (stub — TODO)

#### `api/mutations.ts`

| Hook | Current Signature | New Signature |
|------|-----------------|---------------|
| `useCreateAviaTransfer` | `(): UseMutationResult<...>` | `(options?: UseMutationOptions<...>): UseMutationResult<...>` |
| `useUpdateAviaTransfer` | `(id: string): UseMutationResult<...>` | `(params: { id: string }, options?: UseMutationOptions<...>): UseMutationResult<...>` |

#### `api/queries.ts`

| Hook | Current Signature | New Signature |
|------|-----------------|---------------|
| `useAviaTransfersList` | `(): UseQueryResult<...>` | `(params?: {}, options?: UseQueryOptions<...>): UseQueryResult<...>` |
| `useAviaTransferDetail` | `(id: string): UseQueryResult<...>` | `(params: { id: string }, options?: UseQueryOptions<...>): UseQueryResult<...>` |

### 3. Cargo (stub)

#### `api/mutations.ts`

| Hook | Current Signature | New Signature |
|------|-----------------|---------------|
| `useCreateCargo` | `(): void` | `(options?: UseMutationOptions<...>): UseMutationResult<...>` |
| `useUpdateCargo` | `(): void` | `(params: { id: string }, options?: UseMutationOptions<...>): UseMutationResult<...>` |

#### `api/queries.ts`

| Hook | Current Signature | New Signature |
|------|-----------------|---------------|
| `useCargoList` | `(): UseQueryResult<...>` | `(params?: {}, options?: UseQueryOptions<...>): UseQueryResult<...>` |

### 4. Receivers (stub)

#### `api/mutations.ts`

| Hook | Current Signature | New Signature |
|------|-----------------|---------------|
| `useCreateReceiver` | `(): void` | `(options?: UseMutationOptions<...>): UseMutationResult<...>` |
| `useUpdateReceiver` | `(): void` | `(params: { id: string }, options?: UseMutationOptions<...>): UseMutationResult<...>` |

#### `api/queries.ts`

| Hook | Current Signature | New Signature |
|------|-----------------|---------------|
| `useReceiversList` | `(): UseQueryResult<...>` | `(params?: {}, options?: UseQueryOptions<...>): UseQueryResult<...>` |

### 5. Transporters (stub)

#### `api/mutations.ts`

| Hook | Current Signature | New Signature |
|------|-----------------|---------------|
| `useCreateTransporter` | `(): void` | `(options?: UseMutationOptions<...>): UseMutationResult<...>` |
| `useUpdateTransporter` | `(): void` | `(params: { id: string }, options?: UseMutationOptions<...>): UseMutationResult<...>` |

#### `api/queries.ts`

| Hook | Current Signature | New Signature |
|------|-----------------|---------------|
| `useTransportersList` | `(): UseQueryResult<...>` | `(params?: {}, options?: UseQueryOptions<...>): UseQueryResult<...>` |

## Consumer Updates

### `edit-transfer-page.tsx`

```typescript
// Before
const { mutate, isPending } = useUpdateTransfer(id);
mutate(
    { payload, files, removedFileIds },
    { onError: handleEditTransferError, onSuccess: handleEditTransferSuccess },
);

// After
const { mutate, isPending } = useUpdateTransfer({ id }, {
    onError: handleEditTransferError,
    onSuccess: handleEditTransferSuccess,
});
mutate({ payload, files, removedFileIds });
```

### `create-transfer-page.tsx`

```typescript
// Before
const { mutate, isPending } = useCreateTransfer();
mutate(
    { payload: {...}, files },
    { onError: handleCreateTransferError, onSuccess: handleCreateTransferSuccess },
);

// After
const { mutate, isPending } = useCreateTransfer({
    onError: handleCreateTransferError,
    onSuccess: handleCreateTransferSuccess,
});
mutate({ payload: {...}, files });
```

### `use-transfer.ts` (hook)

```typescript
// Before
const { data, isLoading, isError } = useTransferDetail(id);

// After
const { data, isLoading, isError } = useTransferDetail({ id });
```

### `transfer-list.tsx`

```typescript
// Before
const { data, isLoading, error } = useTransfersList(searchQuery);

// After — no change needed (params already first arg, no options used)
const { data, isLoading, error } = useTransfersList(searchQuery);
```

## Implementation Order

1. **Transfers** — the only module with real consumers, needs careful updates
2. **Avia Transfers** — stub, just signature change
3. **Cargo** — stub, just signature change
4. **Receivers** — stub, just signature change
5. **Transporters** — stub, just signature change
6. **Run linter** — verify no regressions

## Type Imports Needed

Each mutations/queries file will need to import:
```typescript
import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';