create or replace function app_private.catalog_supplier_product_name_zh(
  original_name text,
  brand text,
  model text,
  color text,
  quality_grade text,
  category text
)
returns text
language plpgsql
immutable
as $$
declare
  v_original text := btrim(coalesce(original_name, ''));
  v_source text := lower(coalesce(quality_grade, '') || ' ' || coalesce(original_name, ''));
  v_quality text;
  v_category text;
  v_color text;
  v_core text;
  v_translated_part text;
begin
  if v_source ~ 'original\s+pulled|original\s+pull' then
    v_quality := '原拆';
  elsif v_source ~ 'premium|high\s+quality\s+compatible' then
    v_quality := '高品质兼容';
  else
    v_quality := coalesce(nullif(btrim(quality_grade), ''), '高品质兼容');
  end if;

  if lower(coalesce(category, '')) = 'dock-connectors'
    or lower(v_original) ~ 'dock\s+connector' then
    v_category := '尾插 / 充电接口';
  else
    v_category := coalesce(nullif(btrim(category), ''), '配件');
  end if;

  v_color := case lower(coalesce(color, ''))
    when 'black titanium' then '黑钛色'
    when 'white titanium' then '白钛色'
    when 'blue titanium' then '蓝钛色'
    when 'natural titanium' then '原色钛'
    when 'black' then '黑色'
    when 'white' then '白色'
    when 'blue' then '蓝色'
    when 'red' then '红色'
    when 'green' then '绿色'
    when 'gold' then '金色'
    when 'silver' then '银色'
    when 'purple' then '紫色'
    when 'pink' then '粉色'
    when 'yellow' then '黄色'
    when 'grey' then '灰色'
    when 'gray' then '灰色'
    when 'orange' then '橙色'
    when 'teal' then '青绿色'
    when 'ultramarine' then '群青色'
    when 'starlight' then '星光色'
    when 'midnight' then '午夜色'
    when 'graphite' then '石墨色'
    when 'titanium' then '钛色'
    else null
  end;

  if v_color is null then
    v_color := case
      when lower(v_original) ~ '\mblack titanium\M' then '黑钛色'
      when lower(v_original) ~ '\mwhite titanium\M' then '白钛色'
      when lower(v_original) ~ '\mblue titanium\M' then '蓝钛色'
      when lower(v_original) ~ '\mnatural titanium\M' then '原色钛'
      when lower(v_original) ~ '\mblack\M' then '黑色'
      when lower(v_original) ~ '\mwhite\M' then '白色'
      when lower(v_original) ~ '\mblue\M' then '蓝色'
      when lower(v_original) ~ '\mred\M' then '红色'
      when lower(v_original) ~ '\mgreen\M' then '绿色'
      when lower(v_original) ~ '\mgold\M' then '金色'
      when lower(v_original) ~ '\msilver\M' then '银色'
      when lower(v_original) ~ '\mpurple\M' then '紫色'
      when lower(v_original) ~ '\mpink\M' then '粉色'
      when lower(v_original) ~ '\myellow\M' then '黄色'
      when lower(v_original) ~ '\mgrey\M' then '灰色'
      when lower(v_original) ~ '\mgray\M' then '灰色'
      when lower(v_original) ~ '\morange\M' then '橙色'
      when lower(v_original) ~ '\mteal\M' then '青绿色'
      when lower(v_original) ~ '\multramarine\M' then '群青色'
      when lower(v_original) ~ '\mstarlight\M' then '星光色'
      else null
    end;
  end if;

  v_core := btrim(concat_ws(' ', nullif(btrim(coalesce(brand, '')), ''), nullif(btrim(coalesce(model, '')), '')));

  if v_core = '' then
    v_core := btrim(
      regexp_replace(
        regexp_replace(v_original, '(?i)original\s+pulled|premium|dock\s+connector', '', 'g'),
        '\s+',
        ' ',
        'g'
      )
    );
  end if;

  v_translated_part := coalesce(v_color, '') || v_category;

  return btrim(concat_ws(' ', v_quality, nullif(v_core, ''), nullif(v_translated_part, '')));
end;
$$;

create or replace function app_private.set_supplier_product_name_zh()
returns trigger
language plpgsql
set search_path = public, app_private
as $$
begin
  if new.external_source = 'supplier_cart'
    and (
      new.name_zh is null
      or btrim(new.name_zh) = ''
      or btrim(new.name_zh) = btrim(new.name_it)
    ) then
    new.name_zh := app_private.catalog_supplier_product_name_zh(
      new.name_it,
      new.brand,
      new.model,
      new.external_payload ->> 'color',
      new.quality_grade,
      new.category
    );

    if new.description_zh is null or btrim(new.description_zh) = '' then
      new.description_zh := '从上游订货单导入的尾插 / 充电接口配件。预购预计 7-14 天到货。';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists products_supplier_name_zh on public.products;

create trigger products_supplier_name_zh
before insert or update of
  external_source,
  external_payload,
  name_it,
  name_zh,
  brand,
  model,
  category,
  quality_grade
on public.products
for each row
execute function app_private.set_supplier_product_name_zh();

update public.products
set
  name_zh = app_private.catalog_supplier_product_name_zh(
    name_it,
    brand,
    model,
    external_payload ->> 'color',
    quality_grade,
    category
  ),
  description_zh = coalesce(
    nullif(btrim(description_zh), ''),
    '从上游订货单导入的尾插 / 充电接口配件。预购预计 7-14 天到货。'
  ),
  updated_at = now()
where external_source = 'supplier_cart'
  and (
    name_zh is null
    or btrim(name_zh) = ''
    or btrim(name_zh) = btrim(name_it)
  );
