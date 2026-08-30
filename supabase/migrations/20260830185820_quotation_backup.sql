create table public.business_profiles (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  payload jsonb not null default '{}'::jsonb,
  logo_path text,
  stamp_path text,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version bigint not null default 0 check (version >= 0),
  primary key (owner_id, id)
);

create table public.clients (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version bigint not null default 0 check (version >= 0),
  primary key (owner_id, id)
);

create table public.quotations (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  client_id text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version bigint not null default 0 check (version >= 0),
  primary key (owner_id, id),
  foreign key (owner_id, client_id) references public.clients(owner_id, id)
);

create table public.material_items (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  quotation_id text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version bigint not null default 0 check (version >= 0),
  primary key (owner_id, id),
  foreign key (owner_id, quotation_id) references public.quotations(owner_id, id) on delete cascade
);

create index business_profiles_owner_updated_idx on public.business_profiles (owner_id, updated_at desc);
create index clients_owner_updated_idx on public.clients (owner_id, updated_at desc);
create index quotations_owner_updated_idx on public.quotations (owner_id, updated_at desc);
create index material_items_quotation_idx on public.material_items (owner_id, quotation_id, updated_at desc);

alter table public.business_profiles enable row level security;
alter table public.clients enable row level security;
alter table public.quotations enable row level security;
alter table public.material_items enable row level security;

revoke all on table public.business_profiles, public.clients, public.quotations, public.material_items from anon, authenticated;
grant select, insert, update, delete on table public.business_profiles, public.clients, public.quotations, public.material_items to authenticated;

create policy "Owners select business profiles" on public.business_profiles for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners insert business profiles" on public.business_profiles for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners update business profiles" on public.business_profiles for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Owners delete business profiles" on public.business_profiles for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "Owners select clients" on public.clients for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners insert clients" on public.clients for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners update clients" on public.clients for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Owners delete clients" on public.clients for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "Owners select quotations" on public.quotations for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners insert quotations" on public.quotations for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners update quotations" on public.quotations for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Owners delete quotations" on public.quotations for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "Owners select material items" on public.material_items for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners insert material items" on public.material_items for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners update material items" on public.material_items for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Owners delete material items" on public.material_items for delete to authenticated using ((select auth.uid()) = owner_id);

insert into storage.buckets (id, name, public)
values ('business-assets', 'business-assets', false)
on conflict (id) do update set public = false;

create policy "Owners read business assets" on storage.objects for select to authenticated
using (bucket_id = 'business-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owners insert business assets" on storage.objects for insert to authenticated
with check (bucket_id = 'business-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owners update business assets" on storage.objects for update to authenticated
using (bucket_id = 'business-assets' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'business-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owners delete business assets" on storage.objects for delete to authenticated
using (bucket_id = 'business-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
