"use client";

import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Divider,
  Empty,
  Flex,
  Input,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Locale } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import { formatAdminStatus } from "@/lib/admin-display";
import { displayOrderNumber } from "@/lib/order-number";
import { formatMoney } from "@/lib/pricing";
import type { AdminOrderNextAction, AdminOrderView } from "@/admin/services/orders";

const { Text } = Typography;

const orderStatuses = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
] as const;

export function OrderDetailClient({
  canWriteFinance,
  canWriteOrders,
  csrfFieldName,
  csrfToken,
  error,
  locale,
  order,
  returnTo,
  saved,
}: Readonly<{
  canWriteFinance: boolean;
  canWriteOrders: boolean;
  csrfFieldName: string;
  csrfToken: string;
  error?: string;
  locale: Locale;
  order: AdminOrderView;
  returnTo: string;
  saved?: string;
}>) {
  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const orderStatus = formatAdminStatus("order", order.status, locale);
  const paymentStatus = formatAdminStatus("payment", order.paymentStatus ?? "-", locale);
  const paymentMethod = formatAdminStatus("paymentMethod", order.paymentMethod, locale);

  return (
    <div className="space-y-4">
      <Flex align="flex-start" gap={16} justify="space-between" wrap>
        <div>
          <Text className="text-xs font-semibold uppercase text-slate-500">
            {locale === "it" ? "Order detail" : "订单详情"}
          </Text>
          <h1 className="m-0 mt-1 font-mono text-2xl font-semibold text-slate-950">
            {displayOrderNumber(order, locale)}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            {locale === "it"
              ? "Dettaglio operativo con cliente, pagamento, righe prodotto, tracking e timeline."
              : "订单处理详情，集中展示客户、付款、商品明细、物流和时间线。"}
          </p>
        </div>
        <Space wrap>
          <Button href={localizePath(locale, "/admin/orders")}>
            {locale === "it" ? "Torna ordini" : "返回订单"}
          </Button>
          <Button href={localizePath(locale, "/admin/orders/timeline")}>
            {locale === "it" ? "Timeline" : "时间线"}
          </Button>
        </Space>
      </Flex>

      {error ? <Alert message={decodeURIComponent(error)} showIcon type="error" /> : null}
      {saved ? (
        <Alert
          message={
            saved === "demo"
              ? locale === "it"
                ? "Demo: azione ricevuta, configura Supabase per salvare."
                : "演示：已收到操作，配置 Supabase 后可真实保存。"
              : locale === "it"
                ? "Operazione salvata."
                : "操作已保存。"
          }
          showIcon
          type="success"
        />
      ) : null}

      <Row gutter={[12, 12]}>
        <Col xs={24} md={12} xl={4}>
          <Card size="small">
            <Statistic
              title={locale === "it" ? "Stato ordine" : "订单状态"}
              value={orderStatus.label}
              valueStyle={{ color: toneToTextColor(orderStatus.tone), fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={5}>
          <Card size="small">
            <Statistic
              title={locale === "it" ? "Pagamento" : "付款"}
              value={paymentMethod.label}
              suffix={<Tag color={toneToColor(paymentStatus.tone)}>{paymentStatus.label}</Tag>}
              valueStyle={{ fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6} xl={4}>
          <Card size="small">
            <Statistic title={locale === "it" ? "Totale" : "订单总额"} value={formatMoney(order.total, locale)} />
          </Card>
        </Col>
        <Col xs={12} md={6} xl={4}>
          <Card size="small">
            <Statistic title={locale === "it" ? "Rimborsi" : "已退款"} value={formatMoney(order.refundTotal ?? 0, locale)} />
          </Card>
        </Col>
        <Col xs={12} md={6} xl={3}>
          <Card size="small">
            <Statistic title={locale === "it" ? "Pezzi" : "件数"} value={totalQty} />
          </Card>
        </Col>
        <Col xs={12} md={6} xl={4}>
          <Card size="small">
            <Statistic
              title={locale === "it" ? "Tracking" : "物流"}
              value={order.trackingNumber ? (locale === "it" ? "Inserito" : "已填写") : "-"}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <PrimaryAction
          canWriteFinance={canWriteFinance}
          canWriteOrders={canWriteOrders}
          csrfFieldName={csrfFieldName}
          csrfToken={csrfToken}
          locale={locale}
          order={order}
          returnTo={returnTo}
        />
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={15}>
          <Card
            title={locale === "it" ? "Pannello operativo" : "订单操作面板"}
            extra={<Tag color="blue">{locale === "it" ? "State machine" : "状态机驱动"}</Tag>}
          >
            <Row gutter={[12, 12]}>
              <Col xs={24} lg={10}>
                <Card size="small" title={locale === "it" ? "Aggiorna stato" : "更新状态"}>
                  <StatusUpdateForm
                    canWriteOrders={canWriteOrders}
                    csrfFieldName={csrfFieldName}
                    csrfToken={csrfToken}
                    locale={locale}
                    order={order}
                    returnTo={returnTo}
                  />
                  <Divider />
                  <Space direction="vertical" size={4}>
                    <Text type="secondary">
                      {locale === "it" ? "Subtotal" : "小计"}: {formatMoney(order.subtotal ?? 0, locale)}
                    </Text>
                    <Text type="secondary">IVA/VAT: {formatMoney(order.vat ?? 0, locale)}</Text>
                    {order.reservationExpiresAt ? (
                      <Text type="secondary">
                        {locale === "it" ? "Lock fino a" : "锁库到"}:{" "}
                        {formatDateTime(order.reservationExpiresAt, locale)}
                      </Text>
                    ) : null}
                  </Space>
                </Card>
              </Col>
              <Col xs={24} lg={14}>
                <Card size="small" title={locale === "it" ? "Azioni rapide" : "快捷操作"}>
                  <Space wrap>
                    {order.paymentStatus === "pending_cash" ? (
                      <ActionForm
                        action="/api/admin/orders/payment"
                        actionValue="confirm_cash"
                        canSubmit={canWriteFinance}
                        csrfFieldName={csrfFieldName}
                        csrfToken={csrfToken}
                        id={order.id}
                        locale={locale}
                        returnTo={returnTo}
                      >
                        {locale === "it" ? "Conferma contanti" : "确认现金收款"}
                      </ActionForm>
                    ) : null}
                    {order.paymentStatus === "pending_bank_transfer" ? (
                      <ActionForm
                        action="/api/admin/orders/payment"
                        actionValue="confirm_bank_transfer"
                        canSubmit={canWriteFinance}
                        csrfFieldName={csrfFieldName}
                        csrfToken={csrfToken}
                        id={order.id}
                        locale={locale}
                        returnTo={returnTo}
                      >
                        {locale === "it" ? "Conferma bonifico" : "确认转账到账"}
                      </ActionForm>
                    ) : null}
                    <ActionForm
                      action="/api/admin/orders/extend-reservation"
                      canSubmit={canWriteOrders}
                      csrfFieldName={csrfFieldName}
                      csrfToken={csrfToken}
                      id={order.id}
                      locale={locale}
                      returnTo={returnTo}
                    >
                      {locale === "it" ? "Estendi 24h" : "延长锁库 24 小时"}
                    </ActionForm>
                  </Space>
                  <Collapse
                    className="mt-4"
                    ghost
                    items={[
                      {
                        children: (
                          <ActionForm
                            action="/api/admin/orders/release"
                            canSubmit={canWriteOrders}
                            csrfFieldName={csrfFieldName}
                            csrfToken={csrfToken}
                            danger
                            id={order.id}
                            locale={locale}
                            returnTo={returnTo}
                          >
                            {locale === "it" ? "Annulla e libera stock" : "取消并释放库存"}
                          </ActionForm>
                        ),
                        key: "danger",
                        label: locale === "it" ? "Altre operazioni rischiose" : "更多高风险操作",
                      },
                    ]}
                  />
                </Card>
              </Col>
            </Row>

            <Row className="mt-3" gutter={[12, 12]}>
              <Col xs={24} lg={8}>
                <Card id="payment-proof-panel" size="small" title={locale === "it" ? "Prova pagamento" : "付款凭证"}>
                  <PaymentProofForm
                    canWriteFinance={canWriteFinance}
                    csrfFieldName={csrfFieldName}
                    csrfToken={csrfToken}
                    locale={locale}
                    order={order}
                    returnTo={returnTo}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card id="refund-panel" size="small" title={locale === "it" ? "Rimborso" : "退款"}>
                  <RefundForm
                    canWriteFinance={canWriteFinance}
                    csrfFieldName={csrfFieldName}
                    csrfToken={csrfToken}
                    locale={locale}
                    order={order}
                    returnTo={returnTo}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card id="shipment-panel" size="small" title={locale === "it" ? "Spedizione" : "物流信息"}>
                  <ShipmentForm
                    canWriteOrders={canWriteOrders}
                    csrfFieldName={csrfFieldName}
                    csrfToken={csrfToken}
                    locale={locale}
                    order={order}
                    returnTo={returnTo}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card title={locale === "it" ? "Cliente e fattura" : "客户与发票"}>
            <Descriptions
              column={1}
              items={[
                { key: "company", label: locale === "it" ? "Azienda" : "公司", children: order.companyName || "-" },
                { key: "customer", label: locale === "it" ? "Cliente" : "客户", children: order.customerName || "-" },
                { key: "email", label: "Email", children: order.email || "-" },
                { key: "vat", label: locale === "it" ? "P.IVA" : "P.IVA / 税号", children: order.vatNumber || "-" },
                { key: "fiscal", label: "Fiscal Code", children: order.fiscalCode || "-" },
                { key: "sdi", label: "SDI / PEC", children: [order.sdi, order.pec].filter(Boolean).join(" / ") || "-" },
                { key: "address", label: locale === "it" ? "Indirizzo" : "收货地址", children: order.shippingAddress || "-" },
                { key: "tracking", label: locale === "it" ? "Tracking" : "物流单号", children: [order.shippingCarrier, order.trackingNumber].filter(Boolean).join(" / ") || "-" },
                { key: "note", label: locale === "it" ? "Nota cliente" : "客户通知", children: order.customerNote || "-" },
              ]}
              size="small"
            />
            {order.trackingUrl ? (
              <Button className="mt-3" href={order.trackingUrl} target="_blank" type="link">
                {locale === "it" ? "Apri tracking" : "打开物流跟踪"}
              </Button>
            ) : null}
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={12}>
          <Card title={locale === "it" ? "Righe ordine" : "商品明细"}>
            <Table
              columns={getItemColumns(locale)}
              dataSource={order.items}
              pagination={false}
              rowKey={(item) => `${order.id}-${item.sku}`}
              scroll={{ x: 760 }}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={locale === "it" ? "Timeline ordine" : "订单时间线"}>
            {order.timelineEvents.length ? (
              <Timeline
                items={order.timelineEvents.map((event) => ({
                  children: (
                    <Space direction="vertical" size={2}>
                      <Text strong>{event.title}</Text>
                      {event.body ? <Text type="secondary">{event.body}</Text> : null}
                      <Space size={8}>
                        <Tag>{formatAdminStatus("timelineEvent", event.eventType, locale).label}</Tag>
                        <Text type="secondary">{formatDateTime(event.createdAt, locale)}</Text>
                      </Space>
                    </Space>
                  ),
                }))}
              />
            ) : (
              <Empty description={locale === "it" ? "Timeline vuota" : "暂无时间线"} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={12}>
          <Card title={locale === "it" ? "Registri pagamento" : "付款记录"}>
            <Table
              columns={getPaymentColumns(locale)}
              dataSource={order.paymentRecords}
              locale={{ emptyText: <Empty description={locale === "it" ? "Nessuna conferma" : "暂无付款记录"} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              pagination={false}
              rowKey="id"
              scroll={{ x: 760 }}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={locale === "it" ? "Registri rimborso" : "退款记录"}>
            <Table
              columns={getRefundColumns(locale)}
              dataSource={order.refunds}
              locale={{ emptyText: <Empty description={locale === "it" ? "Nessun rimborso" : "暂无退款记录"} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              pagination={false}
              rowKey="id"
              scroll={{ x: 760 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Card title={locale === "it" ? "Notifiche cliente" : "客户通知"}>
        <Table
          columns={getNotificationColumns(locale)}
          dataSource={order.notifications}
          locale={{ emptyText: <Empty description={locale === "it" ? "Nessuna notifica" : "暂无客户通知"} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          pagination={false}
          rowKey="id"
          scroll={{ x: 820 }}
          size="small"
        />
      </Card>
    </div>
  );
}

function PrimaryAction({
  canWriteFinance,
  canWriteOrders,
  csrfFieldName,
  csrfToken,
  locale,
  order,
  returnTo,
}: Readonly<{
  canWriteFinance: boolean;
  canWriteOrders: boolean;
  csrfFieldName: string;
  csrfToken: string;
  locale: Locale;
  order: AdminOrderView;
  returnTo: string;
}>) {
  const action = order.nextPrimaryAction;
  const label = getNextActionLabel(action, locale);

  return (
    <Flex align="center" gap={16} justify="space-between" wrap>
      <div>
        <Text className="text-xs font-semibold uppercase text-slate-500">
          {locale === "it" ? "Prossima azione" : "下一步主操作"}
        </Text>
        <h2 className="m-0 mt-1 text-xl font-semibold text-slate-950">{label}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {locale === "it"
            ? "Le azioni a bassa frequenza restano nel pannello dettagli."
            : "高频主操作放在这里，低频危险操作放入更多区域。"}
        </p>
      </div>
      {renderPrimaryAction({
        action,
        canWriteFinance,
        canWriteOrders,
        csrfFieldName,
        csrfToken,
        locale,
        order,
        returnTo,
      })}
    </Flex>
  );
}

function renderPrimaryAction({
  action,
  canWriteFinance,
  canWriteOrders,
  csrfFieldName,
  csrfToken,
  locale,
  order,
  returnTo,
}: {
  action: AdminOrderNextAction | null;
  canWriteFinance: boolean;
  canWriteOrders: boolean;
  csrfFieldName: string;
  csrfToken: string;
  locale: Locale;
  order: AdminOrderView;
  returnTo: string;
}) {
  if (action === "confirm_cash" || action === "confirm_bank_transfer") {
    return (
      <ActionForm
        action="/api/admin/orders/payment"
        actionValue={action}
        canSubmit={canWriteFinance}
        csrfFieldName={csrfFieldName}
        csrfToken={csrfToken}
        id={order.id}
        locale={locale}
        primary
        returnTo={returnTo}
      >
        {getNextActionLabel(action, locale)}
      </ActionForm>
    );
  }

  if (action === "confirm_card_payment") {
    return (
      <Button href="#payment-proof-panel" type="primary">
        {locale === "it" ? "Registra pagamento" : "登记付款凭证"}
      </Button>
    );
  }

  if (action === "start_processing") {
    return (
      <StatusActionForm
        canWriteOrders={canWriteOrders}
        csrfFieldName={csrfFieldName}
        csrfToken={csrfToken}
        locale={locale}
        order={order}
        primary
        returnTo={returnTo}
        status="processing"
      >
        {getNextActionLabel(action, locale)}
      </StatusActionForm>
    );
  }

  if (action === "confirm_order") {
    return (
      <StatusActionForm
        canWriteOrders={canWriteOrders}
        csrfFieldName={csrfFieldName}
        csrfToken={csrfToken}
        locale={locale}
        order={order}
        primary
        returnTo={returnTo}
        status="paid"
      >
        {getNextActionLabel(action, locale)}
      </StatusActionForm>
    );
  }

  if (action === "ship_order") {
    return (
      <Button href="#shipment-panel" type="primary">
        {getNextActionLabel(action, locale)}
      </Button>
    );
  }

  if (action === "complete_order") {
    return (
      <StatusActionForm
        canWriteOrders={canWriteOrders}
        csrfFieldName={csrfFieldName}
        csrfToken={csrfToken}
        locale={locale}
        order={order}
        primary
        returnTo={returnTo}
        status="completed"
      >
        {getNextActionLabel(action, locale)}
      </StatusActionForm>
    );
  }

  if (action === "refund_order") {
    return (
      <Button danger href="#refund-panel" type="primary">
        {getNextActionLabel(action, locale)}
      </Button>
    );
  }

  return <Tag>{locale === "it" ? "Stabile" : "暂无待办"}</Tag>;
}

function StatusUpdateForm({
  canWriteOrders,
  csrfFieldName,
  csrfToken,
  locale,
  order,
  returnTo,
}: Readonly<{
  canWriteOrders: boolean;
  csrfFieldName: string;
  csrfToken: string;
  locale: Locale;
  order: AdminOrderView;
  returnTo: string;
}>) {
  return (
    <form action="/api/admin/orders/status" method="post">
      <HiddenAdminFields
        csrfFieldName={csrfFieldName}
        csrfToken={csrfToken}
        id={order.id}
        locale={locale}
        returnTo={returnTo}
      />
      <Space.Compact block>
        <select
          className="h-9 min-w-0 flex-1 rounded-l-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400"
          defaultValue={order.status}
          disabled={!canWriteOrders}
          name="status"
        >
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              {formatAdminStatus("order", status, locale).label}
            </option>
          ))}
        </select>
        <Button disabled={!canWriteOrders} htmlType="submit" type="primary">
          {locale === "it" ? "Salva" : "保存"}
        </Button>
      </Space.Compact>
    </form>
  );
}

function StatusActionForm({
  canWriteOrders,
  children,
  csrfFieldName,
  csrfToken,
  locale,
  order,
  primary,
  returnTo,
  status,
}: Readonly<{
  canWriteOrders: boolean;
  children: React.ReactNode;
  csrfFieldName: string;
  csrfToken: string;
  locale: Locale;
  order: AdminOrderView;
  primary?: boolean;
  returnTo: string;
  status: string;
}>) {
  return (
    <form action="/api/admin/orders/status" method="post">
      <HiddenAdminFields
        csrfFieldName={csrfFieldName}
        csrfToken={csrfToken}
        id={order.id}
        locale={locale}
        returnTo={returnTo}
      />
      <input name="status" type="hidden" value={status} />
      <Button disabled={!canWriteOrders} htmlType="submit" type={primary ? "primary" : "default"}>
        {children}
      </Button>
    </form>
  );
}

function ActionForm({
  action,
  actionValue,
  canSubmit,
  children,
  csrfFieldName,
  csrfToken,
  danger,
  id,
  locale,
  primary,
  returnTo,
}: Readonly<{
  action: string;
  actionValue?: string;
  canSubmit: boolean;
  children: React.ReactNode;
  csrfFieldName: string;
  csrfToken: string;
  danger?: boolean;
  id: string;
  locale: Locale;
  primary?: boolean;
  returnTo: string;
}>) {
  return (
    <form action={action} method="post">
      <HiddenAdminFields
        csrfFieldName={csrfFieldName}
        csrfToken={csrfToken}
        id={id}
        locale={locale}
        returnTo={returnTo}
      />
      {actionValue ? <input name="action" type="hidden" value={actionValue} /> : null}
      <Button danger={danger} disabled={!canSubmit} htmlType="submit" type={primary ? "primary" : "default"}>
        {children}
      </Button>
    </form>
  );
}

function HiddenAdminFields({
  csrfFieldName,
  csrfToken,
  id,
  locale,
  returnTo,
}: Readonly<{
  csrfFieldName: string;
  csrfToken: string;
  id: string;
  locale: Locale;
  returnTo: string;
}>) {
  return (
    <>
      <input name={csrfFieldName} type="hidden" value={csrfToken} />
      <input name="id" type="hidden" value={id} />
      <input name="locale" type="hidden" value={locale} />
      <input name="returnTo" type="hidden" value={returnTo} />
    </>
  );
}

function PaymentProofForm({
  canWriteFinance,
  csrfFieldName,
  csrfToken,
  locale,
  order,
  returnTo,
}: Readonly<{
  canWriteFinance: boolean;
  csrfFieldName: string;
  csrfToken: string;
  locale: Locale;
  order: AdminOrderView;
  returnTo: string;
}>) {
  return (
    <form action="/api/admin/orders/payment-proof" className="grid gap-2" encType="multipart/form-data" method="post">
      <HiddenAdminFields csrfFieldName={csrfFieldName} csrfToken={csrfToken} id={order.id} locale={locale} returnTo={returnTo} />
      <select
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
        defaultValue={order.paymentMethod}
        disabled={!canWriteFinance}
        name="paymentMethod"
      >
        <option value="bank_transfer">{locale === "it" ? "Bonifico" : "银行转账"}</option>
        <option value="cash">{locale === "it" ? "Contanti" : "现金"}</option>
        <option value="stripe">{locale === "it" ? "Carta Stripe" : "Stripe 银行卡"}</option>
      </select>
      <select
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
        defaultValue={order.paymentStatus ?? "pending_bank_transfer"}
        disabled={!canWriteFinance}
        name="paymentStatus"
      >
        <option value="pending_bank_transfer">{locale === "it" ? "Bonifico atteso" : "等待转账"}</option>
        <option value="pending_cash">{locale === "it" ? "Contanti attesi" : "等待现金"}</option>
        <option value="pending_card">{locale === "it" ? "Carta attesa" : "等待银行卡"}</option>
        <option value="paid">{locale === "it" ? "Pagato" : "已支付"}</option>
        <option value="failed">{locale === "it" ? "Fallito" : "失败"}</option>
        <option value="cancelled">{locale === "it" ? "Annullato" : "已取消"}</option>
        <option value="refunded">{locale === "it" ? "Rimborsato" : "已退款"}</option>
      </select>
      <Input disabled={!canWriteFinance} name="amount" placeholder={locale === "it" ? "Importo" : "金额"} type="number" defaultValue={String(order.total)} />
      <Input disabled={!canWriteFinance} name="providerReference" placeholder={locale === "it" ? "CRO / ID transazione" : "CRO / 交易号"} />
      <input
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,text/plain"
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        disabled={!canWriteFinance}
        name="file"
        type="file"
      />
      <Input disabled={!canWriteFinance} name="proofUrl" placeholder="https://..." type="url" />
      <Input disabled={!canWriteFinance} name="proofLabel" placeholder={locale === "it" ? "Etichetta" : "凭证名称"} />
      <Input.TextArea disabled={!canWriteFinance} name="note" placeholder={locale === "it" ? "Nota" : "备注"} rows={3} />
      <Button disabled={!canWriteFinance} htmlType="submit" type="primary">
        {locale === "it" ? "Salva prova" : "保存付款凭证"}
      </Button>
    </form>
  );
}

function RefundForm({
  canWriteFinance,
  csrfFieldName,
  csrfToken,
  locale,
  order,
  returnTo,
}: Readonly<{
  canWriteFinance: boolean;
  csrfFieldName: string;
  csrfToken: string;
  locale: Locale;
  order: AdminOrderView;
  returnTo: string;
}>) {
  const remaining = Math.max(order.total - (order.refundTotal ?? 0), 0);

  return (
    <form action="/api/admin/orders/refund" className="grid gap-2" method="post">
      <HiddenAdminFields csrfFieldName={csrfFieldName} csrfToken={csrfToken} id={order.id} locale={locale} returnTo={returnTo} />
      <Alert
        message={`${locale === "it" ? "Rimborsabile" : "可退款"}: ${formatMoney(remaining, locale)}`}
        showIcon
        type="info"
      />
      <Input disabled={!canWriteFinance || remaining <= 0} max={remaining} min="0.01" name="amount" placeholder={locale === "it" ? "Importo" : "金额"} step="0.01" type="number" defaultValue={remaining > 0 ? remaining.toFixed(2) : ""} />
      <select
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
        defaultValue="requested_by_customer"
        disabled={!canWriteFinance || remaining <= 0}
        name="reason"
      >
        <option value="requested_by_customer">{locale === "it" ? "Richiesta cliente" : "客户要求"}</option>
        <option value="order_cancelled">{locale === "it" ? "Ordine annullato" : "订单取消"}</option>
        <option value="duplicate">{locale === "it" ? "Duplicato" : "重复付款"}</option>
        <option value="fraudulent">{locale === "it" ? "Frode" : "欺诈风险"}</option>
        <option value="other">{locale === "it" ? "Altro" : "其他"}</option>
      </select>
      {order.paymentMethod !== "stripe" ? (
        <Input disabled={!canWriteFinance || remaining <= 0} name="providerReference" placeholder={locale === "it" ? "Riferimento rimborso" : "退款参考号"} />
      ) : null}
      <Input.TextArea disabled={!canWriteFinance || remaining <= 0} name="note" placeholder={locale === "it" ? "Nota" : "备注"} rows={3} />
      <Button danger disabled={!canWriteFinance || remaining <= 0} htmlType="submit" type="primary">
        {locale === "it" ? "Registra rimborso" : "确认退款"}
      </Button>
    </form>
  );
}

function ShipmentForm({
  canWriteOrders,
  csrfFieldName,
  csrfToken,
  locale,
  order,
  returnTo,
}: Readonly<{
  canWriteOrders: boolean;
  csrfFieldName: string;
  csrfToken: string;
  locale: Locale;
  order: AdminOrderView;
  returnTo: string;
}>) {
  return (
    <form action="/api/admin/orders/shipment" className="grid gap-2" method="post">
      <HiddenAdminFields csrfFieldName={csrfFieldName} csrfToken={csrfToken} id={order.id} locale={locale} returnTo={returnTo} />
      <Input disabled={!canWriteOrders} name="shippingCarrier" placeholder="DHL / GLS / BRT" defaultValue={order.shippingCarrier ?? ""} />
      <Input disabled={!canWriteOrders} name="trackingNumber" placeholder={locale === "it" ? "Tracking" : "物流单号"} defaultValue={order.trackingNumber ?? ""} />
      <Input disabled={!canWriteOrders} name="trackingUrl" placeholder="https://..." type="url" defaultValue={order.trackingUrl ?? ""} />
      <Input.TextArea disabled={!canWriteOrders} name="customerNote" placeholder={locale === "it" ? "Nota cliente" : "客户通知"} rows={3} defaultValue={order.customerNote ?? ""} />
      <Input.TextArea disabled={!canWriteOrders} name="shipmentNote" placeholder={locale === "it" ? "Nota interna" : "内部备注"} rows={3} defaultValue={order.shipmentNote ?? ""} />
      <Button disabled={!canWriteOrders} htmlType="submit" type="primary">
        {locale === "it" ? "Salva tracking" : "保存物流信息"}
      </Button>
    </form>
  );
}

function getItemColumns(locale: Locale): ColumnsType<AdminOrderView["items"][number]> {
  return [
    { dataIndex: "sku", title: "SKU", width: 140 },
    {
      key: "name",
      render: (_value, item) => getOrderItemName(item, locale),
      title: locale === "it" ? "Nome" : "商品名",
    },
    { dataIndex: "quantity", title: locale === "it" ? "Qta" : "数量", width: 80 },
    {
      key: "stock",
      render: (_value, item) => item.preorderLeadTimeMinDays && item.preorderLeadTimeMaxDays ? (
        <Tag color="gold">
          {locale === "it" ? "Arrivo stimato" : "预计到货"} {item.preorderLeadTimeMinDays}-{item.preorderLeadTimeMaxDays}d
        </Tag>
      ) : (
        <Tag color="green">{locale === "it" ? "Disponibile" : "现货"}</Tag>
      ),
      title: locale === "it" ? "Stock" : "库存",
      width: 160,
    },
    {
      align: "right",
      key: "lineTotal",
      render: (_value, item) => formatMoney(item.unitPrice * item.quantity, locale),
      title: locale === "it" ? "Totale riga" : "行小计",
      width: 140,
    },
  ];
}

function getPaymentColumns(locale: Locale): ColumnsType<AdminOrderView["paymentRecords"][number]> {
  return [
    { render: (_value, record) => formatMoney(record.amount, locale), title: locale === "it" ? "Importo" : "金额", width: 120 },
    { render: (_value, record) => <StatusTag kind="payment" locale={locale} value={record.paymentStatus} />, title: locale === "it" ? "Stato" : "状态", width: 130 },
    { render: (_value, record) => formatAdminStatus("paymentMethod", record.paymentMethod, locale).label, title: locale === "it" ? "Metodo" : "方式", width: 140 },
    { dataIndex: "providerReference", title: locale === "it" ? "Riferimento" : "参考号", width: 160 },
    { render: (_value, record) => formatDateTime(record.createdAt, locale), title: locale === "it" ? "Creato" : "创建时间", width: 160 },
  ];
}

function getRefundColumns(locale: Locale): ColumnsType<AdminOrderView["refunds"][number]> {
  return [
    { render: (_value, refund) => formatMoney(refund.amount, locale), title: locale === "it" ? "Importo" : "金额", width: 120 },
    { render: (_value, refund) => <StatusTag kind="refundStatus" locale={locale} value={refund.status} />, title: locale === "it" ? "Stato" : "状态", width: 130 },
    { render: (_value, refund) => formatAdminStatus("refundReason", refund.reason, locale).label, title: locale === "it" ? "Motivo" : "原因", width: 150 },
    { dataIndex: "providerRefundId", title: locale === "it" ? "Provider" : "退款号", width: 160 },
    { render: (_value, refund) => formatDateTime(refund.createdAt, locale), title: locale === "it" ? "Creato" : "创建时间", width: 160 },
  ];
}

function getNotificationColumns(locale: Locale): ColumnsType<AdminOrderView["notifications"][number]> {
  return [
    { dataIndex: "subject", title: locale === "it" ? "Oggetto" : "主题", width: 260 },
    { dataIndex: "recipientEmail", title: "Email", width: 220 },
    { render: (_value, notification) => <StatusTag kind="notification" locale={locale} value={notification.status} />, title: locale === "it" ? "Stato" : "状态", width: 120 },
    { dataIndex: "errorMessage", title: locale === "it" ? "Errore" : "错误", width: 240 },
    { render: (_value, notification) => formatDateTime(notification.sentAt ?? notification.createdAt, locale), title: locale === "it" ? "Data" : "时间", width: 160 },
  ];
}

function StatusTag({
  kind,
  locale,
  value,
}: Readonly<{
  kind: "notification" | "order" | "payment" | "refundStatus";
  locale: Locale;
  value: string | null | undefined;
}>) {
  const status = formatAdminStatus(kind, value, locale);
  return <Tag color={toneToColor(status.tone)}>{status.label}</Tag>;
}

function getOrderItemName(
  item: AdminOrderView["items"][number],
  locale: Locale,
) {
  const localizedName = locale === "zh" ? item.nameZh : item.nameIt;
  const name = (localizedName || item.name || "").trim();
  return name && name !== item.sku
    ? name
    : locale === "it"
      ? "Nome prodotto da completare"
      : "商品名待补全";
}

function getNextActionLabel(action: AdminOrderNextAction | null, locale: Locale) {
  if (!action) return locale === "it" ? "Nessuna azione primaria" : "暂无主操作";

  const labels: Record<AdminOrderNextAction, Record<Locale, string>> = {
    confirm_bank_transfer: { it: "Conferma bonifico", zh: "确认转账到账" },
    confirm_card_payment: { it: "Registra pagamento carta", zh: "登记银行卡付款" },
    confirm_cash: { it: "Conferma contanti", zh: "确认现金收款" },
    confirm_order: { it: "Conferma ordine", zh: "确认订单" },
    complete_order: { it: "Completa ordine", zh: "完成订单" },
    refund_order: { it: "Registra rimborso", zh: "登记退款" },
    ship_order: { it: "Inserisci spedizione", zh: "填写物流/发货" },
    start_processing: { it: "Avvia picking", zh: "开始备货" },
  };

  return labels[action][locale];
}

function toneToColor(tone: string) {
  const colors: Record<string, string> = {
    amber: "gold",
    blue: "blue",
    green: "green",
    red: "red",
    slate: "default",
    violet: "purple",
  };

  return colors[tone] ?? "default";
}

function toneToTextColor(tone: string) {
  const colors: Record<string, string> = {
    amber: "#d48806",
    blue: "#1677ff",
    green: "#389e0d",
    red: "#cf1322",
    slate: "#475569",
    violet: "#722ed1",
  };

  return colors[tone] ?? "#475569";
}

function formatDateTime(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === "it" ? "it-IT" : "zh-CN");
}
