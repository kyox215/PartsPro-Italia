# 03 - 数据与 API 重写计划

## 分层目标

后台业务只允许通过以下路径写入：

```text
page/action or route handler
  -> schema validation
  -> service
  -> repository
  -> RPC/table
  -> audit log
```

页面不直接拼业务状态，API 不直接写复杂跨表逻辑，关键库存/订单事务进入数据库 RPC。

## 标准响应

列表：

```ts
type AdminListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
```

Mutation：

```ts
type AdminMutationResponse<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };
```

## 权限码

新权限码：

- `admin:access`
- `orders:read`
- `orders:write`
- `customers:read`
- `customers:write`
- `inventory:read`
- `inventory:write`
- `products:read`
- `products:write`
- `finance:read`
- `finance:write`
- `staff:read`
- `staff:write`
- `settings:read`
- `settings:write`
- `audit:read`

迁移期允许旧权限映射到新权限，但新页面、新 API、新按钮只声明新权限。

## 订单服务

文件目标：

- `src/admin/schemas/orders.ts`
- `src/admin/state-machines/orders.ts`
- `src/admin/repositories/orders.ts`
- `src/admin/repositories/order-transactions.ts`
- `src/admin/repositories/order-v2-contracts.ts`
- `src/admin/repositories/order-v2-rpc.ts`
- `src/admin/services/orders.ts`
- `src/admin/services/order-mutations.ts`
- `src/admin/services/mutations.ts`
- `src/admin/schemas/order-checkout.ts`
- `src/admin/services/order-checkout.ts`

Service 动作：

- `listAdminOrders`
- `getAdminOrderDetailView`
- `quoteCartForCheckout`
- `createOrder`
- `reserveOrderInventory`
- `confirmPayment`
- `addPaymentProof`
- `startPicking`
- `shipOrder`
- `markPickupReady`
- `cancelOrder`
- `refundOrder`
- `appendOrderTimeline`

RPC 目标：

- `admin_v2_create_order`
- `admin_v2_release_inventory`
- `admin_v2_confirm_payment`
- `admin_v2_add_payment_proof`
- `admin_v2_update_order_status`
- `admin_v2_ship_order`
- `admin_v2_refund_order`
- `admin_v2_append_order_timeline`
- `admin_v2_update_stripe_checkout`
- `admin_v2_sync_stripe_refund_status`
- `admin_v2_release_expired_inventory`

旧 RPC 只在迁移期保留；新前台结账链路切换完成后，删除 JS 调用和旧函数依赖。

已落地的 API 收口：

- `/api/admin/orders/status`
- `/api/admin/orders/payment`
- `/api/admin/orders/payment-proof`
- `/api/admin/orders/shipment`
- `/api/admin/orders/refund`
- `/api/admin/orders/extend-reservation`
- `/api/admin/orders/release`

这些 route handler 当前保留旧后台表单的 303 重定向体验，同时对 JSON 请求返回标准 mutation 响应。旧 `order-workflow` 内部事务已由 `src/admin/repositories/order-transactions.ts` 包装，下一步替换为新 v2 RPC 时优先改 repository。

前台下单链路已收口：

- `/api/cart/quote` -> `quoteCheckoutCart`
- `/api/cart/checkout` -> `prepareCheckoutCart`
- `/api/orders` -> `createCheckoutOrder`

当前仍复用旧 `create_order_with_reservations`、`release_order_reservations` 与 `order-workflow` 内部函数，但调用点已集中到 `order-transactions` repository。下一步替换为 `admin_v2_*` RPC 时只需要改 repository，不再改前台 route 或后台页面。

订单事务适配层已收口：

- 创建订单与锁库：`createOrderReservation`
- 释放锁库：`releaseOrderReservation`
- 过期锁库释放：`releaseExpiredOrderReservations`
- 付款确认：`confirmOrderManualPayment`
- Stripe 付款完成：`markOrderStripePaymentPaid`
- 付款凭证：`addOrderPaymentProofRecord`
- 客户付款记录：`recordOrderPayment`
- 物流：`updateOrderShipmentRecord`
- 退款：`issueOrderRefundRecord`
- Stripe 退款状态同步：`syncOrderStripeRefundStatus`
- 状态与时间线：`updateOrderStatus`、`appendOrderTimelineEvent`
- Stripe session 回写：`updateOrderStripeCheckoutSession`

外部/客户侧订单动作已收口：

- `/api/stripe/webhook` -> `src/admin/services/order-webhooks.ts`
- `src/lib/account-workflow.ts` -> `src/admin/repositories/order-transactions.ts`

除 `order-transactions` 适配层外，应用代码不再直接 import `src/lib/order-workflow.ts`。v2 RPC 已开始进入正式 migration，后续继续在 repository 内部逐个替换旧函数。

v2 RPC 合同已落地：

- TypeScript 合同：`src/admin/repositories/order-v2-contracts.ts`
- 通用调用器：`src/admin/repositories/order-v2-rpc.ts`
- SQL 草案：`docs/admin-rebuild/sql/admin-v2-order-rpc-draft.sql`
- 正式 migration 第一批：`supabase/migrations/20260522000405_admin_v2_order_rpc.sql`
- 正式 migration 第二批：`supabase/migrations/20260522001121_admin_v2_order_payment_rpc.sql`
- 正式 migration 第三批：`supabase/migrations/20260522001416_admin_v2_order_shipment_rpc.sql`

正式 migration 第一批包含低风险写入：

- `admin_v2_update_stripe_checkout`：回写 Stripe checkout session 与 payment intent。
- `admin_v2_append_order_timeline`：追加订单时间线事件。
- `admin_v2_update_order_status`：只更新订单状态；时间线仍由 service 单独追加，避免重复事件。

正式 migration 第二批包含付款写入：

- `admin_v2_confirm_payment`：校验订单付款方式，更新订单为已付款，写入付款记录和时间线。
- `admin_v2_add_payment_proof`：写入付款凭证记录和时间线。
- 客户通知不放入 RPC；`order-mutations` 在 `ADMIN_ORDER_V2_RPC_ENABLED=true` 时补发 `payment_paid` 与 `payment_proof_added` 通知。

正式 migration 第三批包含物流写入：

- `admin_v2_ship_order`：更新物流字段、必要时把订单状态置为 `shipped`，并写入订单时间线。
- 客户通知仍由 `order-mutations` 在 v2 开关开启时补发 `shipment_updated`。

切换策略：

- 第一步：在测试库应用正式 migration，并验证函数签名、权限、成功响应、错误响应。
- 第二步：设置 `ADMIN_ORDER_V2_RPC_ENABLED=true`，灰度切换 `updateStripeCheckout`、`appendTimeline`、`updateStatus`、`confirmPayment`、`addPaymentProof`、`updateShipment`；未设置时默认继续走旧稳定路径。
- 第三步：继续在 `order-transactions` 内部按动作逐个替换，后续优先顺序为 `releaseInventory`、`confirmStripePayment`、`createOrder`、`refundOrder`。
- 第四步：每替换一个动作都运行 lint/typecheck/build，并手动验收对应订单场景。
- 第五步：全部 v2 RPC 覆盖后再删除旧 `order-workflow` 直接事务函数。

## 客户服务

文件目标：

- `src/admin/schemas/customers.ts`
- `src/admin/repositories/customers.ts`
- `src/admin/services/customers.ts`

Service 动作：

- `listCustomers`
- `getCustomerDetail`
- `changeCustomerPriceGroup`
- `updateCustomerStatus`
- `addCustomerNote`
- `upsertCustomerTags`
- `createCustomerFollowUpTask`
- `linkCustomerCompany`

## 库存服务

文件目标：

- `src/admin/schemas/inventory.ts`
- `src/admin/state-machines/inventory.ts`
- `src/admin/repositories/inventory.ts`
- `src/admin/services/inventory.ts`

Service 动作：

- `listInventory`
- `importIncomingPurchase`
- `receiveIncomingStock`
- `markIncomingMissing`
- `adjustStock`
- `listInventoryMovements`
- `allocatePreorders`

RPC 目标：

- `admin_v2_import_incoming_stock`
- `admin_v2_receive_stock`
- `admin_v2_mark_missing_stock`
- `admin_v2_adjust_stock`
- `admin_v2_allocate_preorders`

## API 路由策略

- `GET` 读取可使用 repository，但仍需权限。
- `POST/PATCH/DELETE` 必须使用 service。
- 所有 route handler 统一捕获错误并转换为标准 mutation 响应。
- 无权限统一返回 403。
- 校验失败统一返回 `fieldErrors`。

## 审计日志

需要记录：

- actor：员工或系统。
- action：业务动作。
- target：订单、客户、SKU、库存批次、设置项。
- before/after：关键字段差异。
- metadata：IP、user agent、来源页面、备注。

## 前台回归边界

后台重写不能中断：

- `/zh/products`
- `/zh/cart`
- `/zh/checkout`
- `/zh/account/orders`

前台结账服务迁移时必须先补覆盖测试，再切换调用。
