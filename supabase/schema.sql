create table if not exists public.pedidos (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  pedido jsonb not null check (jsonb_typeof(pedido) = 'object'),
  primary key (user_id, id),
  check (pedido->>'id' is not null and pedido->>'id' = id)
);

alter table public.pedidos enable row level security;

grant select, insert, update, delete on public.pedidos to authenticated;

drop policy if exists "Users manage their own pedidos" on public.pedidos;
create policy "Users manage their own pedidos"
  on public.pedidos
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pedidos'
  ) then
    alter publication supabase_realtime add table public.pedidos;
  end if;
end;
$$;

create or replace function public.substituir_pedidos(p_pedidos jsonb)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Autenticação obrigatória';
  end if;

  if jsonb_typeof(p_pedidos) is distinct from 'array' then
    raise exception 'A lista de pedidos deve ser um array JSON';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_pedidos) as entrada(pedido)
    where jsonb_typeof(entrada.pedido) is distinct from 'object'
       or nullif(entrada.pedido->>'id', '') is null
  ) then
    raise exception 'Cada pedido precisa conter um id';
  end if;

  delete from public.pedidos where user_id = auth.uid();

  insert into public.pedidos (user_id, id, pedido)
  select auth.uid(), entrada.pedido->>'id', entrada.pedido
  from jsonb_array_elements(p_pedidos) as entrada(pedido);
end;
$$;

revoke all on function public.substituir_pedidos(jsonb) from public;
grant execute on function public.substituir_pedidos(jsonb) to authenticated;
