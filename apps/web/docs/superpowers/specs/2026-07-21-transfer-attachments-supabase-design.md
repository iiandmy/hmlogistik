# Transfer Attachments Supabase Design

## Goal

Добавить прикрепление файлов к отправкам через Ant Design Upload на фронте и хранение файлов в Supabase Storage.

## Scope

- Включено:
  - private bucket `transfer-files`
  - backend multipart обработка create/update transfer с файлами
  - хранение метаданных файлов в отдельной таблице
  - получение списка файлов отправки со signed URL
  - frontend интеграция Upload в create/edit формы
- Не включено:
  - превью изображений
  - версионирование файлов

## Data Model

Новая таблица `transfer_files`:

- `id bigserial primary key`
- `transfer_id bigint not null references transfers(id) on delete cascade`
- `storage_path text not null unique`
- `original_name text not null`
- `mime_type text not null`
- `size_bytes bigint not null`
- `created_at timestamptz not null default now()`

Storage bucket:
- name: `transfer-files`
- visibility: private

Storage path format:
- `transfers/<transferId>/<uuid>-<safeFileName>`

## API Contract

### POST `/api/transfers` (multipart)

FormData:
- `payload`: JSON string (required transfer fields + optional shippedAt)
- `files`: repeated file fields (0..10)

Validation:
- max 10 files
- max 20MB each
- mime types: `application/pdf`, `image/jpeg`, `image/png`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

Response:
- `204` on success
- `400` invalid payload/files
- `502` storage/db failure

### PATCH `/api/transfers/:id` (multipart)

FormData:
- `payload`: JSON string (partial transfer)
- `files`: repeated file fields (optional)
- `removedFileIds`: JSON array of file IDs to delete (optional)

Response:
- `204` on success
- `400` invalid id/payload/files
- `404` transfer/file not found
- `502` storage/db failure

### GET `/api/transfers/:id/files`

Response:
- array of:
  - `id`
  - `originalName`
  - `mimeType`
  - `sizeBytes`
  - `createdAt`
  - `downloadUrl` (short-lived signed URL)

## Frontend Integration

- `TransferForm` получает Upload-блок:
  - список текущих файлов (edit)
  - добавление новых
  - удаление уже прикрепленных
  - локальная валидация типа/размера/количества
- `createTransfer` и `updateTransfer` отправляют `FormData`:
  - `payload` JSON
  - `files[]`
  - `removedFileIds` (для update)
- Для edit-страницы загружается `GET /api/transfers/:id/files` и маппится в Upload fileList.

## Error Handling

- Любая ошибка upload/delete в storage должна прерывать операцию и возвращать ошибку.
- Backend не должен молча игнорировать ошибки удаления файлов.
- Для update пустой payload допустим, но файл-операции должны выполниться корректно.

## Verification

- Линт измененных файлов.
- Сборка проекта.
- Проверка create/edit через UI:
  - добавить файлы
  - удалить файлы
  - скачать файл через signed URL.

