begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(3);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sync-owner@example.com', '', now(), now());

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

insert into public.clients (owner_id, id, payload, updated_at, version)
values ('33333333-3333-3333-3333-333333333333', 'client-version', '{}', now(), 2);
insert into public.quotations (owner_id, id, client_id, payload, updated_at, version)
values ('33333333-3333-3333-3333-333333333333', 'quote-version', 'client-version', '{"newest":true}', now(), 2);

update public.quotations set payload = '{"stale":true}', version = 1 where id = 'quote-version';
select is((select version from public.quotations where id = 'quote-version'), 2::bigint, 'older updates are ignored');

update public.quotations set deleted_at = now(), version = 1 where id = 'quote-version';
select is((select deleted_at from public.quotations where id = 'quote-version'), null::timestamptz, 'older tombstones are ignored');

select has_index('public', 'quotations', 'quotations_owner_client_idx', array['owner_id', 'client_id'], 'quotation client foreign key is indexed');

select * from finish();
rollback;
