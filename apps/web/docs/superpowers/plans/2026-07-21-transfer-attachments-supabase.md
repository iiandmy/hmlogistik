# Transfer Attachments Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить прикрепление файлов к отправкам через Ant Upload с хранением в private Supabase bucket и управлением файлами при create/edit.

**Architecture:** Добавить таблицу `transfer_files` для метаданных, расширить backend `POST/PATCH` на `multipart/form-data`, реализовать загрузку/удаление в Supabase Storage и endpoint выдачи signed URLs. На фронте расширить `TransferForm` и API-слой мутаций для работы с `FormData`, новых файлов и удаления существующих.

**Tech Stack:** Hono, @supabase/server, Supabase Storage, PostgreSQL, React, Ant Design Upload, TanStack Query, TypeScript.

## Global Constraints

- Bucket: `transfer-files`, private.
- Ограничения: максимум 10 файлов на отправку, максимум 20MB на файл.
- Разрешенные типы: `application/pdf`, `image/jpeg`, `image/png`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
- `POST /api/transfers` и `PATCH /api/transfers/:id` должны принимать `multipart/form-data`.
- `POST/PATCH` успешный ответ: `204 No Content`.
- В edit форме обязательно поддержать одновременно: список текущих файлов, скачивание (signed URL), добавление новых, удаление существующих.
- Удаление файлов из отправки должно удалять и запись в `transfer_files`, и объект из Storage.

---

### Task 1: Add DB schema for transfer file metadata

**Files:**
- Create: `api/sql/create-transfer-files-table.sql`
- Test: SQL execution in Supabase SQL editor

**Interfaces:**
- Consumes: existing `transfers(id)` table.
- Produces: `transfer_files` table schema and indexes.

- [ ] **Step 1: Write the failing test**

```sql
select * from transfer_files limit 1;
```

Expected: error (`relation "transfer_files" does not exist`).

- [ ] **Step 2: Run test to verify it fails**

Run in Supabase SQL editor: query above.  
Expected: relation missing.

- [ ] **Step 3: Write minimal implementation**

```sql
create table if not exists public.transfer_files (
  id bigserial primary key,
  transfer_id bigint not null references public.transfers(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now()
);

create index if not exists transfer_files_transfer_id_idx
  on public.transfer_files (transfer_id);
```

- [ ] **Step 4: Run test to verify it passes**

Run in SQL editor:
```sql
select id, transfer_id, storage_path from transfer_files limit 1;
```

Expected: query succeeds.

- [ ] **Step 5: Commit**

```bash
git add api/sql/create-transfer-files-table.sql
git commit -m "feat: add transfer files metadata table"
```

### Task 2: Extend backend transfer routes for multipart upload + file listing

**Files:**
- Modify: `api/routes/transfers.ts`
- Test: runtime via `yarn dev:api` + curl

**Interfaces:**
- Consumes:
  - `transfer_files` table
  - Supabase Storage bucket `transfer-files`
- Produces:
  - Multipart `POST /api/transfers`
  - Multipart `PATCH /api/transfers/:id`
  - `GET /api/transfers/:id/files`

- [ ] **Step 1: Write the failing test**

```bash
curl -i http://127.0.0.1:3002/api/transfers/1/files
```

Expected: 404 route missing.

- [ ] **Step 2: Run test to verify it fails**

Run `yarn dev:api`, then command above.  
Expected: not implemented.

- [ ] **Step 3: Write minimal implementation**

```ts
// Add DB types for transfer_files and constants:
const TRANSFER_FILES_BUCKET = 'transfer-files'
const MAX_FILES_PER_TRANSFER = 10
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([ ... ])
```

```ts
// Add helpers:
// - parseMultipartPayload(formData, schema)
// - validateUploadedFiles(files)
// - buildStoragePath(transferId, originalName)
// - uploadFilesAndInsertMetadata(...)
// - deleteFilesByIds(...)
// - listFilesWithSignedUrls(...)
```

```ts
// POST /transfers:
// - read formData
// - parse `payload` JSON + zod validate
// - extract files[] and validate limits/type/size
// - create transfer record
// - upload files to storage
// - insert transfer_files metadata
// - return 204
```

```ts
// PATCH /transfers/:id:
// - validate id
// - read formData
// - parse `payload` JSON partial + zod validate
// - parse `removedFileIds` JSON array optional
// - apply transfer update if fields provided
// - remove requested files (storage + metadata)
// - upload new files and insert metadata
// - return 204
```

```ts
// GET /transfers/:id/files:
// - validate id
// - fetch transfer_files rows
// - create signed URL per file via storage.createSignedUrl(path, 60)
// - return mapped list
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
yarn eslint api/routes/transfers.ts
yarn dev:api
curl -i http://127.0.0.1:3002/api/transfers/1/files
```

Expected: route returns `200` (or `404` only if transfer missing by chosen contract).

- [ ] **Step 5: Commit**

```bash
git add api/routes/transfers.ts
git commit -m "feat: add transfer file upload and listing endpoints"
```

### Task 3: Add frontend API methods for multipart create/update and file listing

**Files:**
- Modify: `src/api/transfers/types.ts`
- Modify: `src/api/transfers/create-transfer.ts`
- Modify: `src/api/transfers/update-transfer.ts`
- Create: `src/api/transfers/get-transfer-files.ts`
- Modify: `src/api/transfers/index.ts`
- Test: eslint + build

**Interfaces:**
- Consumes: new backend multipart/file-list endpoints.
- Produces:
  - `TransferFileDto`
  - `CreateTransferInput` / `UpdateTransferInput`
  - `getTransferFiles(transferId)`
  - multipart-aware `createTransfer` and `updateTransfer`

- [ ] **Step 1: Write the failing test**

```ts
// Update signatures in usage site before implementation:
// createTransfer({ payload, files })
// updateTransfer(id, { payload, files, removedFileIds })
// getTransferFiles(id)
```

Expected: TS compile fails on missing types/functions.

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn tsc -b`  
Expected: missing API members.

- [ ] **Step 3: Write minimal implementation**

```ts
// types.ts
export interface TransferFileDto { id: number; originalName: string; mimeType: string; sizeBytes: number; createdAt: string; downloadUrl: string }
export interface CreateTransferInput { payload: CreateTransferPayload; files: File[] }
export interface UpdateTransferInput { payload: UpdateTransferPayload; files: File[]; removedFileIds: number[] }
```

```ts
// create-transfer.ts/update-transfer.ts
// Build FormData:
// formData.append('payload', JSON.stringify(payload))
// files.forEach(file => formData.append('files', file))
// update: append removedFileIds JSON
// fetch with method POST/PATCH and body formData (no JSON content-type header)
```

```ts
// get-transfer-files.ts
export async function getTransferFiles(id: string): Promise<TransferFileDto[]> { ... }
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
yarn eslint src/api/transfers/types.ts src/api/transfers/create-transfer.ts src/api/transfers/update-transfer.ts src/api/transfers/get-transfer-files.ts src/api/transfers/index.ts
yarn build
```

Expected: both commands pass.

- [ ] **Step 5: Commit**

```bash
git add src/api/transfers/types.ts src/api/transfers/create-transfer.ts src/api/transfers/update-transfer.ts src/api/transfers/get-transfer-files.ts src/api/transfers/index.ts
git commit -m "feat: add frontend multipart transfer APIs"
```

### Task 4: Integrate Ant Upload into transfer form and pages

**Files:**
- Modify: `src/components/transfer-form.tsx`
- Modify: `src/modules/create-transfer/create-transfer-page.tsx`
- Modify: `src/modules/edit-transfer/edit-transfer-page.tsx`
- Modify: `src/modules/edit-transfer/hooks/use-transfer.ts` (if needed for file-fetch wiring context)
- Test: UI behavior via local run + build

**Interfaces:**
- Consumes:
  - `createTransfer({ payload, files })`
  - `updateTransfer(id, { payload, files, removedFileIds })`
  - `getTransferFiles(id)`
- Produces:
  - upload UI in create/edit
  - handling of new files and removed file IDs
  - existing file list with download links

- [ ] **Step 1: Write the failing test**

```ts
// Render TransferForm with Upload UI expectations in page usage;
// fail state: required props for attachments not present yet.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn tsc -b`  
Expected: prop/type errors until Upload API is wired.

- [ ] **Step 3: Write minimal implementation**

```tsx
// transfer-form.tsx
// Add Upload component with:
// - fileList controlled
// - beforeUpload validation (size/type/count)
// - onRemove callback
// - showUploadList with download link for existing files
```

```tsx
// create-transfer-page.tsx
// Maintain local File[] state from Upload
// on submit -> createTransfer({ payload: mappedTransfer, files })
```

```tsx
// edit-transfer-page.tsx
// Fetch existing files (getTransferFiles)
// Track:
// - existing file list
// - new File[] uploads
// - removedFileIds[]
// on submit -> updateTransfer(id, { payload: mappedDiff, files: newFiles, removedFileIds })
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
yarn eslint src/components/transfer-form.tsx src/modules/create-transfer/create-transfer-page.tsx src/modules/edit-transfer/edit-transfer-page.tsx
yarn build
```

Expected: lint/build pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/transfer-form.tsx src/modules/create-transfer/create-transfer-page.tsx src/modules/edit-transfer/edit-transfer-page.tsx
git commit -m "feat: integrate upload attachments into transfer forms"
```

