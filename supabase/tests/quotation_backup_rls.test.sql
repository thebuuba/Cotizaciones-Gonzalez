begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(15);

select has_table('public', 'business_profiles', 'business_profiles exists');
select has_table('public', 'clients', 'clients exists');
select has_table('public', 'quotations', 'quotations exists');
select has_table('public', 'material_items', 'material_items exists');

select is((select relrowsecurity from pg_class where oid = 'public.business_profiles'::regclass), true, 'business_profiles has RLS');
select is((select relrowsecurity from pg_class where oid = 'public.clients'::regclass), true, 'clients has RLS');
select is((select relrowsecurity from pg_class where oid = 'public.quotations'::regclass), true, 'quotations has RLS');
select is((select relrowsecurity from pg_class where oid = 'public.material_items'::regclass), true, 'material_items has RLS');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@example.com', '', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other@example.com', '', now(), now());

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.business_profiles (owner_id, id, payload, updated_at) values ('11111111-1111-1111-1111-111111111111', 'business-1', '{}', now());
insert into public.clients (owner_id, id, payload, updated_at) values ('11111111-1111-1111-1111-111111111111', 'client-1', '{}', now());
insert into public.quotations (owner_id, id, client_id, payload, updated_at) values ('11111111-1111-1111-1111-111111111111', 'quote-1', 'client-1', '{}', now());
insert into public.material_items (owner_id, id, quotation_id, payload, updated_at) values ('11111111-1111-1111-1111-111111111111', 'item-1', 'quote-1', '{}', now());

select results_eq('select count(*)::bigint from public.business_profiles', array[1::bigint], 'owner reads own business profile');
select results_eq('select count(*)::bigint from public.clients', array[1::bigint], 'owner reads own client');
select results_eq('select count(*)::bigint from public.quotations', array[1::bigint], 'owner reads own quotation');
select results_eq('select count(*)::bigint from public.material_items', array[1::bigint], 'owner reads own material');

set local "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select results_eq('select count(*)::bigint from public.business_profiles', array[0::bigint], 'another user cannot read owner data');
select throws_ok(
  $$insert into public.clients (owner_id, id, payload, updated_at) values ('11111111-1111-1111-1111-111111111111', 'forbidden', '{}', now())$$,
  '42501', null, 'another user cannot insert for the owner'
);

set local role anon;
set local "request.jwt.claims" = '{"role":"anon"}';
select throws_ok('select * from public.quotations', '42501', null, 'anonymous role has no table access');

select * from finish();
rollback;
