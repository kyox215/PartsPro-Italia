# PartsPro - DATABASE_SCHEMA.md

## 1. 数据库目标

使用 Supabase PostgreSQL 管理 PartsPro 的商品、SKU、库存、订单、客户和权限。

---

## 2. 表结构总览

```txt
auth.users
  ↓
profiles
  ↓
customers

brands
categories
products
product_skus
inventory

orders
order_items
```

---

## 3. profiles

用途：扩展 Supabase Auth 用户。

字段建议：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid pk | auth.users.id |
| email | text | 邮箱 |
| full_name | text | 姓名 |
| role | text | admin / staff / customer |
| locale | text | it / en / zh |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

---

## 4. customers

用途：客户/B2B 公司资料。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid pk |
| profile_id | uuid fk profiles.id |
| customer_type | text | retail / b2b |
| company_name | text |
| vat_number | text |
| codice_fiscale | text |
| sdi | text |
| pec | text |
| phone | text |
| whatsapp | text |
| billing_address | jsonb |
| shipping_address | jsonb |
| status | text | pending / approved / rejected |
| price_group | text | retail / b2b_basic / silver / gold |
| created_at | timestamptz |

---

## 5. brands

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid pk |
| name | text | Apple |
| slug | text unique |
| logo_url | text |
| sort_order | int |
| is_active | boolean |

---

## 6. categories

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid pk |
| parent_id | uuid nullable |
| name_it | text |
| name_en | text |
| name_zh | text |
| slug | text unique |
| icon | text |
| sort_order | int |
| is_active | boolean |

---

## 7. products

用途：商品主数据。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid pk |
| brand_id | uuid fk brands.id |
| category_id | uuid fk categories.id |
| name_it | text |
| name_en | text |
| name_zh | text |
| slug | text unique |
| description_it | text |
| description_en | text |
| description_zh | text |
| product_type | text | screen / battery / flex / tool |
| phone_model | text |
| model_codes | text[] | A2221 / SM-G991B |
| status | text | draft / active / archived |
| image_urls | text[] |
| created_at | timestamptz |
| updated_at | timestamptz |

---

## 8. product_skus

用途：SKU / 变体。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid pk |
| product_id | uuid fk products.id |
| sku | text unique |
| barcode | text |
| quality_grade | text |
| color | text |
| frame_type | text | with_frame / without_frame |
| retail_price | numeric |
| b2b_price | numeric |
| cost_price | numeric |
| vat_rate | numeric |
| moq | int |
| weight_grams | int |
| is_battery | boolean |
| is_active | boolean |
| created_at | timestamptz |

---

## 9. inventory

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid pk |
| sku_id | uuid fk product_skus.id |
| quantity_available | int |
| quantity_reserved | int |
| quantity_incoming | int |
| warehouse_location | text |
| batch_number | text |
| status | text | available / reserved / defective / quarantine |
| low_stock_threshold | int |
| updated_at | timestamptz |

---

## 10. orders

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid pk |
| order_number | text unique |
| customer_id | uuid fk customers.id |
| status | text | pending / paid / processing / shipped / completed / cancelled |
| payment_status | text | unpaid / paid / refunded |
| subtotal | numeric |
| vat_total | numeric |
| shipping_total | numeric |
| grand_total | numeric |
| currency | text default EUR |
| notes | text |
| created_at | timestamptz |
| updated_at | timestamptz |

---

## 11. order_items

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid pk |
| order_id | uuid fk orders.id |
| sku_id | uuid fk product_skus.id |
| sku_snapshot | jsonb |
| quantity | int |
| unit_price | numeric |
| vat_rate | numeric |
| line_total | numeric |

---

## 12. 建议 Indexes

```sql
create index idx_products_brand_id on products(brand_id);
create index idx_products_category_id on products(category_id);
create index idx_product_skus_product_id on product_skus(product_id);
create index idx_product_skus_sku on product_skus(sku);
create index idx_inventory_sku_id on inventory(sku_id);
create index idx_orders_customer_id on orders(customer_id);
create index idx_orders_status on orders(status);
```

---

## 13. RLS 原则

- public 用户只可读取 active 商品。
- customer 只能读取自己的订单和客户资料。
- admin/staff 可管理商品、库存、订单、客户。
- service role 只能用于 server action / admin job，不进入前端。

---

## 14. Storage Buckets

| Bucket | 用途 |
|---|---|
| product-images | 商品图 |
| category-icons | 分类图标 |
| brand-logos | 品牌 logo |
| rma-uploads | 后续 RMA 图片/视频 |

规则：

```txt
商品图片公开读取
上传仅 admin/staff
RMA 上传仅登录用户
```
