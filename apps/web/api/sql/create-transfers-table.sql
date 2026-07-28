create table if not exists public.transfers (
  id bigserial primary key,
  created_at timestamptz,
  shipped_at timestamptz,
  transporter text not null,
  receiver text not null,
  container text,
  price numeric(12, 2) not null check (price >= 0),
  cargo text not null
);

create index if not exists transfers_created_at_idx on public.transfers (created_at desc);
create index if not exists transfers_shipped_at_idx on public.transfers (shipped_at desc);
create index if not exists transfers_price_idx on public.transfers (price);

alter table if exists public.transfers
  alter column shipped_at drop not null;

alter table if exists public.transfers
  alter column container drop not null;

alter table if exists public.transfers
  alter column created_at drop not null;
