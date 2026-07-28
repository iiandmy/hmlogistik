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
