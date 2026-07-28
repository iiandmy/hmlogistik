# Tabs Layout Routing Design

## Goal

Добавить общий layout с табами и тремя страницами:
- Отправки (`/transfers`)
- Перевозчики (`/transporters`)
- Получатели (`/receivers`)

При этом устранить конфликт маршрутов, из-за которого `/transfers` резолвится в `undefined`.

## Current Problem

Сейчас в роутере смешаны абсолютные и вложенные пути вокруг `indexRoute`, из-за чего несколько шаблонов могут совпадать с одним URL и TanStack Router предупреждает о коллизии.

## Chosen Approach

Создать отдельный parent-route для таб-лейаута и держать внутри него только табовые маршруты с относительными путями.

### Route tree

- `rootRoute`
  - `tabsLayoutRoute` (path: `/`, component: Tabs layout + Outlet)
    - `tabsIndexRoute` (path: `/`, redirect -> `/transfers`)
    - `transfersRoute` (path: `transfers`)
    - `transportersRoute` (path: `transporters`) — dummy page
    - `receiversRoute` (path: `receivers`) — dummy page
  - `transferRoute` (path: `transfer/$id`)
  - `createTransferRoute` (path: `create`)

## UI Behavior

- В таб-лейауте активный таб определяется по текущему URL.
- При переключении табов выполняется `navigate` на соответствующий путь.
- Страница `transfers` сохраняет текущий функционал списка.
- `transporters` и `receivers` — заглушки с простым контентом.

## Error Prevention

- Для child routes под layout используются **только относительные** пути.
- Redirect с index внутри layout ведет на один уникальный target (`/transfers`).
- Убирается дублирующая/конфликтующая конфигурация для `/transfers`.

## Validation

- Переходы по вкладкам работают без `Not found`.
- Предупреждение про `matched route "undefined"` исчезает.
- `/transfer/:id` и `/create` продолжают работать как раньше.
