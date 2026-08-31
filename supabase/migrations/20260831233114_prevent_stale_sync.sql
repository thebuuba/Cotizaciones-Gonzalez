create or replace function public.preserve_newer_backup_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.version < old.version then
    return old;
  end if;
  return new;
end;
$$;

create trigger preserve_newer_business_profile
before update on public.business_profiles
for each row execute function public.preserve_newer_backup_version();

create trigger preserve_newer_client
before update on public.clients
for each row execute function public.preserve_newer_backup_version();

create trigger preserve_newer_quotation
before update on public.quotations
for each row execute function public.preserve_newer_backup_version();

create trigger preserve_newer_material_item
before update on public.material_items
for each row execute function public.preserve_newer_backup_version();

create index quotations_owner_client_idx
on public.quotations (owner_id, client_id);
