drop index if exists public.brands_external_source_id_key;
drop index if exists public.phone_models_external_source_id_key;
drop index if exists public.categories_external_source_id_key;
drop index if exists public.products_external_source_id_key;
drop index if exists public.skus_external_source_id_key;

create unique index brands_external_source_id_key
on public.brands (external_source, external_id);

create unique index phone_models_external_source_id_key
on public.phone_models (external_source, external_id);

create unique index categories_external_source_id_key
on public.categories (external_source, external_id);

create unique index products_external_source_id_key
on public.products (external_source, external_id);

create unique index skus_external_source_id_key
on public.skus (external_source, external_id);
