# План миграции: Vercel Functions (Hono + Supabase) → NestJS + PostgreSQL + MinIO

## 1. Текущая архитектура

```
Frontend (Vite/React) → Vite Proxy → Vercel Functions (Hono)
                                         ├── GET    /api/transfers       — список с фильтрацией/пагинацией
                                         ├── GET    /api/transfers/:id   — получение по ID
                                         ├── POST   /api/transfers       — создание (JSON или multipart)
                                         ├── PATCH  /api/transfers/:id   — обновление (JSON или multipart)
                                         └── GET    /api/transfers/:id/files — файлы отправки
                                         
                                         Хранилище: Supabase (PostgreSQL + Storage)
```

## 2. Целевая архитектура

```
Frontend (Vite/React) → Vite Proxy → NestJS API (Docker)
                                       │
                                       ├── Модули:
                                       │   ├── TransfersModule
                                       │   │   ├── TransfersController
                                       │   │   ├── TransfersService
                                       │   │   └── DTOs (class-validator)
                                       │   │
                                       │   └── FilesModule (переиспользуемый)
                                       │       ├── FilesController (опционально)
                                       │       └── FilesService
                                       │           ├── uploadFile()
                                       │           ├── getFileUrl()
                                       │           ├── deleteFile()
                                       │           └── getFilesByEntity()
                                       │
                                       ├── PrismaService (глобальный)
                                       │   └── @hmlogistik/database
                                       │
                                       └── MinioService (глобальный, переиспользуемый)
                                           ├── upload()
                                           ├── getSignedUrl()
                                           ├── delete()
                                           └── deleteMultiple()
                                       
                                       Хранилище: PostgreSQL + MinIO (Docker)
```

## 3. Компоненты системы

### 3.1 Prisma Schema — модель TransferFile

Необходимо добавить модель `TransferFile` в [`packages/database/prisma/schema.prisma`](packages/database/prisma/schema.prisma):

```prisma
model TransferFile {
  id           BigInt   @id @default(autoincrement())
  transferId   BigInt   @map("transfer_id")
  storagePath  String   @map("storage_path")
  originalName String   @map("original_name")
  mimeType     String   @map("mime_type")
  sizeBytes    BigInt   @map("size_bytes")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz()

  transfer Transfer @relation(fields: [transferId], references: [id], onDelete: Cascade)

  @@index([transferId])
  @@map("transfer_files")
}
```

### 3.2 MinioService (переиспользуемый)

Выносим всю работу с MinIO в отдельный сервис, чтобы его можно было использовать из любого модуля.

**Интерфейс:**
- `upload(bucket: string, path: string, buffer: Buffer, mimeType: string): Promise<void>`
- `getSignedUrl(bucket: string, path: string, ttlSeconds: number): Promise<string>`
- `delete(bucket: string, path: string): Promise<void>`
- `deleteMultiple(bucket: string, paths: string[]): Promise<void>`

**Bucket name** — вынести в конфигурацию (через `ConfigService`), по умолчанию `transfer-files`.

### 3.3 FilesService (переиспользуемый)

Сервис для работы с файлами, привязанными к сущностям. Использует `MinioService` + `PrismaService`.

**Методы:**
- `uploadFiles(entityType: string, entityId: number, files: Express.Multer.File[]): Promise<TransferFile[]>`
- `getFilesByEntity(entityType: string, entityId: number): Promise<TransferFileWithUrl[]>`
- `deleteFilesByIds(entityType: string, entityId: number, fileIds: number[]): Promise<void>`

### 3.4 TransfersModule

**TransfersController** — эндпоинты:

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/transfers` | Список с фильтрацией/сортировкой/пагинацией |
| `GET` | `/api/transfers/:id` | Получение по ID |
| `POST` | `/api/transfers` | Создание (multipart: payload + files) |
| `PATCH` | `/api/transfers/:id` | Обновление (multipart: payload + files + removedFileIds) |
| `GET` | `/api/transfers/:id/files` | Файлы отправки |

**TransfersService** — бизнес-логика:
- `findAll(params)` — список с фильтрами
- `findById(id)` — получение по ID
- `create(dto, files)` — создание + загрузка файлов
- `update(id, dto, files, removedFileIds)` — обновление + управление файлами

### 3.5 DTOs (class-validator)

```typescript
// create-transfer.dto.ts
export class CreateTransferDto {
  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  shippedAt?: string;

  @IsString()
  @MinLength(1)
  transporter: string;

  @IsString()
  @MinLength(1)
  receiver: string;

  @IsOptional()
  @IsString()
  container?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  @MinLength(1)
  cargo: string;
}

// update-transfer.dto.ts
export class UpdateTransferDto extends PartialType(CreateTransferDto) {}

// query-transfers.dto.ts
export class QueryTransfersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'shippedAt'])
  sortBy?: string;

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMax?: number;
}
```

### 3.6 Multer для multipart

Для обработки multipart-запросов (создание/обновление с файлами) используем `@nestjs/platform-express` с `multer`. Файлы будут приходить как `Express.Multer.File[]`, а JSON-данные — через текстовое поле `payload`.

Потребуется кастомный **FileInterceptor** или парсинг `multipart/form-data` вручную через `@Body` с кастомным pipe.

**Рекомендация:** написать кастомный `MultipartPipe`, который:
1. Парсит `payload` из form-data как JSON
2. Валидирует через class-validator
3. Извлекает `files` и `removedFileIds`

## 4. Структура файлов в `apps/api/src/`

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── pipes/
│   │   └── multipart.pipe.ts          # Пайп для парсинга multipart
│   ├── filters/
│   │   └── http-exception.filter.ts   # Глобальный фильтр ошибок
│   └── interfaces/
│       └── file.interface.ts          # Интерфейсы для файлов
├── config/
│   └── configuration.ts               # Конфигурация (ConfigService)
├── modules/
│   ├── transfers/
│   │   ├── transfers.module.ts
│   │   ├── transfers.controller.ts
│   │   ├── transfers.service.ts
│   │   ├── transfers.service.spec.ts
│   │   ├── dto/
│   │   │   ├── create-transfer.dto.ts
│   │   │   ├── update-transfer.dto.ts
│   │   │   └── query-transfers.dto.ts
│   │   └── interfaces/
│   │       └── transfer-response.interface.ts
│   └── files/
│       ├── files.module.ts
│       ├── files.service.ts
│       ├── files.service.spec.ts
│       └── interfaces/
│           └── transfer-file-response.interface.ts
├── providers/
│   ├── minio/
│   │   ├── minio.module.ts
│   │   ├── minio.service.ts
│   │   ├── minio.service.spec.ts
│   │   └── minio.config.ts
│   └── prisma/
│       ├── prisma.module.ts
│       └── prisma.service.ts
```

## 5. Конфигурация (Environment Variables)

```
# База данных
DATABASE_URL=postgresql://admin:admin_pwd@localhost:5432/hmlogistik

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=transfer-files
MINIO_USE_SSL=false

# Приложение
PORT=3000
```

## 6. Docker Compose (dev)

Текущий [`docker-compose.dev.yml`](docker-compose.dev.yml) уже содержит PostgreSQL и MinIO. После реализации API нужно будет добавить сервис `api` в dev-композ (по аналогии с prod).

## 7. Фронтенд — обновление Vite proxy

В [`apps/web/vite.config.ts`](apps/web/vite.config.ts) нужно настроить proxy на `http://localhost:3000` (или порт, на котором работает NestJS).

## 8. Пошаговый план реализации

### Шаг 1: Prisma — добавить модель TransferFile
- [ ] Добавить модель `TransferFile` в [`packages/database/prisma/schema.prisma`](packages/database/prisma/schema.prisma)
- [ ] Создать миграцию: `yarn db:migrate`
- [ ] Перегенерировать Prisma Client: `yarn db:generate`

### Шаг 2: NestJS — PrismaModule и PrismaService
- [ ] Создать [`apps/api/src/providers/prisma/prisma.module.ts`](apps/api/src/providers/prisma/prisma.module.ts) — глобальный модуль
- [ ] Создать [`apps/api/src/providers/prisma/prisma.service.ts`](apps/api/src/providers/prisma/prisma.service.ts) — обёртка над PrismaClient
- [ ] Подключить в `AppModule`

### Шаг 3: NestJS — MinioModule и MinioService
- [ ] Создать [`apps/api/src/providers/minio/minio.config.ts`](apps/api/src/providers/minio/minio.config.ts) — конфигурация
- [ ] Создать [`apps/api/src/providers/minio/minio.module.ts`](apps/api/src/providers/minio/minio.module.ts) — глобальный модуль
- [ ] Создать [`apps/api/src/providers/minio/minio.service.ts`](apps/api/src/providers/minio/minio.service.ts) — методы: `upload`, `getSignedUrl`, `delete`, `deleteMultiple`
- [ ] Написать тесты для MinioService

### Шаг 4: NestJS — FilesModule и FilesService
- [ ] Создать [`apps/api/src/modules/files/files.module.ts`](apps/api/src/modules/files/files.module.ts)
- [ ] Создать [`apps/api/src/modules/files/files.service.ts`](apps/api/src/modules/files/files.service.ts) — методы для работы с файлами сущностей
- [ ] Создать интерфейсы ответов
- [ ] Написать тесты для FilesService

### Шаг 5: NestJS — TransfersModule (Controller + Service + DTOs)
- [ ] Создать DTO: [`create-transfer.dto.ts`](apps/api/src/modules/transfers/dto/create-transfer.dto.ts), [`update-transfer.dto.ts`](apps/api/src/modules/transfers/dto/update-transfer.dto.ts), [`query-transfers.dto.ts`](apps/api/src/modules/transfers/dto/query-transfers.dto.ts)
- [ ] Создать [`transfers.service.ts`](apps/api/src/modules/transfers/transfers.service.ts) — бизнес-логика (список, получение, создание, обновление)
- [ ] Создать [`transfers.controller.ts`](apps/api/src/modules/transfers/transfers.controller.ts) — эндпоинты
- [ ] Создать [`transfers.module.ts`](apps/api/src/modules/transfers/transfers.module.ts)
- [ ] Написать тесты для TransfersService

### Шаг 6: NestJS — MultipartPipe и глобальные фильтры
- [ ] Создать [`apps/api/src/common/pipes/multipart.pipe.ts`](apps/api/src/common/pipes/multipart.pipe.ts) — парсинг multipart/form-data
- [ ] Создать [`apps/api/src/common/filters/http-exception.filter.ts`](apps/api/src/common/filters/http-exception.filter.ts) — единый формат ошибок

### Шаг 7: Фронтенд — обновить Vite proxy
- [ ] Обновить [`apps/web/vite.config.ts`](apps/web/vite.config.ts) — добавить proxy на `http://localhost:3000`

### Шаг 8: Docker Compose dev — добавить сервис api
- [ ] Добавить сервис `api` в [`docker-compose.dev.yml`](docker-compose.dev.yml)

### Шаг 9: Интеграционное тестирование
- [ ] Проверить все эндпоинты через Postman/curl
- [ ] Проверить загрузку/скачивание файлов через MinIO
- [ ] Проверить пагинацию и фильтры
- [ ] Проверить создание и обновление с файлами (multipart)

## 9. Схема взаимодействия компонентов

```mermaid
flowchart TD
    Client[Frontend React] -->|HTTP| Controller[TransfersController]
    
    Controller --> Service[TransfersService]
    Service --> Prisma[PrismaService]
    Service --> FilesSvc[FilesService]
    
    FilesSvc --> MinioSvc[MinioService]
    FilesSvc --> Prisma
    
    MinioSvc --> MinIO[(MinIO Storage)]
    Prisma --> PG[(PostgreSQL)]
    
    subgraph "Переиспользуемые сервисы"
        MinioSvc
        FilesSvc
        Prisma
    end
    
    subgraph "Модуль Transfers"
        Controller
        Service
    end
```

## 10. Формат ответов API

### Успешный ответ (список)
```json
{
  "items": [
    {
      "id": 1,
      "createdAt": "2026-07-28T10:00:00Z",
      "shippedAt": null,
      "transporter": "Транспортер",
      "receiver": "Получатель",
      "container": "CON-001",
      "price": 1500.00,
      "cargo": "Груз"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### Успешный ответ (файлы)
```json
[
  {
    "id": 1,
    "originalName": "document.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 1024000,
    "createdAt": "2026-07-28T10:00:00Z",
    "downloadUrl": "https://minio:9000/..."
  }
]
```

### Ошибка
```json
{
  "statusCode": 400,
  "message": "Описание ошибки",
  "error": "Bad Request"
}