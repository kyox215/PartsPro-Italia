"use client";

import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  Pagination,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Locale } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import { formatAdminStatus } from "@/lib/admin-display";
import { displayOrderNumber, orderRouteId } from "@/lib/order-number";
import { formatMoney } from "@/lib/pricing";
import type {
  AdminOrderListResult,
  AdminOrderNextAction,
  AdminOrderView,
} from "@/admin/services/orders";

const { Text } = Typography;

const filterOptions = [
  "all",
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "refunded",
  "cancelled",
  "expiring",
] as const;

type FilterKey = (typeof filterOptions)[number];

export function OrdersListClient({
  canReadOrders,
  configured,
  error,
  locale,
  result,
  saved,
}: Readonly<{
  canReadOrders: boolean;
  configured: boolean;
  error?: string;
  locale: Locale;
  result: AdminOrderListResult;
  saved?: string;
}>) {
  const columns = getColumns(locale);

  return (
    <div className="space-y-4">
      <Flex align="flex-start" gap={16} justify="space-between" wrap>
        <div>
          <Text className="text-xs font-semibold uppercase text-slate-500">
            {locale === "it" ? "Order workspace" : "订单中心"}
          </Text>
          <h1 className="m-0 mt-1 text-2xl font-semibold text-slate-950">
            {locale === "it" ? "Ordini e incassi" : "订单与付款管理"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            {locale === "it"
              ? "Cerca, filtra e apri l'ordine con il numero breve. Le azioni operative sono guidate dallo stato."
              : "搜索、筛选并进入订单处理；列表直接提示下一步主操作，危险操作留在详情页。"}
          </p>
        </div>
        <Space wrap>
          <Button href={localizePath(locale, "/admin/orders/timeline")}>
            {locale === "it" ? "Timeline" : "订单时间线"}
          </Button>
          <Button href={localizePath(locale, "/admin/inventory")}>
            {locale === "it" ? "Inventario" : "库存中心"}
          </Button>
        </Space>
      </Flex>

      {!configured ? (
        <Alert
          message={locale === "it" ? "Demo mode" : "演示模式"}
          showIcon
          type="warning"
          description={
            locale === "it"
              ? "Supabase non configurato, vengono mostrati ordini demo."
              : "Supabase 未配置，当前显示 demo 订单。"
          }
        />
      ) : null}

      {configured && !canReadOrders ? (
        <Alert
          message={locale === "it" ? "Permesso richiesto" : "需要订单权限"}
          showIcon
          type="error"
          description={
            locale === "it"
              ? "Il tuo ruolo non include orders:read."
              : "当前角色没有 orders:read 权限。"
          }
        />
      ) : null}

      {error ? (
        <Alert message={decodeURIComponent(error)} showIcon type="error" />
      ) : null}
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
        <Col xs={12} md={6} xl={4}>
          <Card size="small">
            <Statistic title={locale === "it" ? "Totale" : "全部订单"} value={result.counts.all} />
          </Card>
        </Col>
        <Col xs={12} md={6} xl={4}>
          <Card size="small">
            <Statistic title={locale === "it" ? "Da pagare" : "待付款"} value={result.counts.pending_payment} />
          </Card>
        </Col>
        <Col xs={12} md={6} xl={4}>
          <Card size="small">
            <Statistic title={locale === "it" ? "Picking" : "处理中"} value={result.counts.processing} />
          </Card>
        </Col>
        <Col xs={12} md={6} xl={4}>
          <Card size="small">
            <Statistic title={locale === "it" ? "Spediti" : "已发货"} value={result.counts.shipped} />
          </Card>
        </Col>
        <Col xs={12} md={6} xl={4}>
          <Card size="small">
            <Statistic title={locale === "it" ? "Rimborsi" : "退款"} value={result.counts.refunded} />
          </Card>
        </Col>
        <Col xs={12} md={6} xl={4}>
          <Card size="small">
            <Statistic title={locale === "it" ? "Lock < 6h" : "锁库将过期"} value={result.counts.expiring} />
          </Card>
        </Col>
      </Row>

      <Card size="small">
        <Form action={localizePath(locale, "/admin/orders")} layout="vertical" method="get">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto_auto] md:items-end">
            <Form.Item className="mb-0" label={locale === "it" ? "Ricerca" : "关键词"}>
              <Input
                allowClear
                defaultValue={result.q}
                name="q"
                placeholder={
                  locale === "it"
                    ? "Ordine, cliente, email, SKU, tracking..."
                    : "订单号、客户、邮箱、SKU、快递单号..."
                }
              />
            </Form.Item>
            <Form.Item className="mb-0" label={locale === "it" ? "Filtro" : "筛选"}>
              <select
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                defaultValue={result.filter}
                name="filter"
              >
                {filterOptions.map((filter) => (
                  <option key={filter} value={filter}>
                    {getFilterLabel(filter, locale)} ({result.counts[filter]})
                  </option>
                ))}
              </select>
            </Form.Item>
            <Button htmlType="submit" type="primary">
              {locale === "it" ? "Cerca" : "搜索"}
            </Button>
            <Button href={localizePath(locale, "/admin/orders")}>
              {locale === "it" ? "Reset" : "重置"}
            </Button>
          </div>
        </Form>
      </Card>

      <Card
        title={locale === "it" ? "Lista ordini" : "订单列表"}
        extra={<Tag color="blue">{`${result.total} / ${result.counts.all}`}</Tag>}
      >
        <Table<AdminOrderView>
          columns={columns}
          dataSource={result.items}
          locale={{
            emptyText: (
              <Empty
                description={locale === "it" ? "Nessun ordine trovato" : "没有匹配订单"}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          pagination={false}
          rowKey="id"
          scroll={{ x: 1180 }}
          size="middle"
        />
        <Flex className="mt-4" justify="flex-end">
          <Pagination
            current={result.page}
            itemRender={(page, type, original) => {
              if (type !== "page" && type !== "prev" && type !== "next") return original;
              return <a href={buildOrdersHref(locale, result, page)}>{original}</a>;
            }}
            pageSize={result.pageSize}
            showSizeChanger={false}
            total={result.total}
          />
        </Flex>
      </Card>
    </div>
  );
}

function getColumns(locale: Locale): ColumnsType<AdminOrderView> {
  return [
    {
      dataIndex: "orderNumber",
      fixed: "left",
      key: "order",
      render: (_value, order) => (
        <Space direction="vertical" size={0}>
          <Button
            className="px-0 font-mono"
            href={localizePath(locale, `/admin/orders/${orderRouteId(order)}`)}
            type="link"
          >
            {displayOrderNumber(order, locale)}
          </Button>
          <Text type="secondary">{formatDateTime(order.createdAt, locale)}</Text>
        </Space>
      ),
      title: locale === "it" ? "Ordine" : "订单",
      width: 190,
    },
    {
      key: "customer",
      render: (_value, order) => (
        <Space direction="vertical" size={0}>
          <Text strong>{order.companyName || order.customerName || "-"}</Text>
          <Text type="secondary">{order.email || "-"}</Text>
        </Space>
      ),
      title: locale === "it" ? "Cliente" : "客户",
      width: 240,
    },
    {
      key: "payment",
      render: (_value, order) => (
        <Space direction="vertical" size={4}>
          <Text>{formatAdminStatus("paymentMethod", order.paymentMethod, locale).label}</Text>
          <StatusTag kind="payment" locale={locale} value={order.paymentStatus ?? "-"} />
        </Space>
      ),
      title: locale === "it" ? "Pagamento" : "付款",
      width: 160,
    },
    {
      align: "right",
      key: "total",
      render: (_value, order) => (
        <Space direction="vertical" size={0}>
          <Text strong>{formatMoney(order.total, locale)}</Text>
          {(order.refundTotal ?? 0) > 0 ? (
            <Text type="danger">{`- ${formatMoney(order.refundTotal ?? 0, locale)}`}</Text>
          ) : null}
        </Space>
      ),
      title: locale === "it" ? "Importo" : "金额",
      width: 140,
    },
    {
      key: "status",
      render: (_value, order) => <StatusTag kind="order" locale={locale} value={order.status} />,
      title: locale === "it" ? "Stato" : "订单状态",
      width: 130,
    },
    {
      key: "next",
      render: (_value, order) => (
        <Tag color={order.nextPrimaryAction ? "blue" : "default"}>
          {getNextActionLabel(order.nextPrimaryAction, locale)}
        </Tag>
      ),
      title: locale === "it" ? "Prossima azione" : "下一步",
      width: 180,
    },
    {
      key: "shipment",
      render: (_value, order) => (
        <Space direction="vertical" size={0}>
          <Text>{order.trackingNumber || (locale === "it" ? "Da inserire" : "待填写")}</Text>
          <Text type="secondary">{order.shippingCarrier || "-"}</Text>
        </Space>
      ),
      title: locale === "it" ? "Tracking" : "物流",
      width: 180,
    },
    {
      fixed: "right",
      key: "actions",
      render: (_value, order) => (
        <Button href={localizePath(locale, `/admin/orders/${orderRouteId(order)}`)} type="primary">
          {locale === "it" ? "Apri" : "查看"}
        </Button>
      ),
      title: locale === "it" ? "Azioni" : "操作",
      width: 96,
    },
  ];
}

function StatusTag({
  kind,
  locale,
  value,
}: Readonly<{
  kind: "order" | "payment";
  locale: Locale;
  value: string | null | undefined;
}>) {
  const status = formatAdminStatus(kind, value, locale);
  return <Tag color={toneToColor(status.tone)}>{status.label}</Tag>;
}

function getFilterLabel(filter: FilterKey, locale: Locale) {
  const labels: Record<FilterKey, Record<Locale, string>> = {
    all: { it: "Tutti", zh: "全部" },
    cancelled: { it: "Annullati", zh: "已取消" },
    completed: { it: "Completati", zh: "已完成" },
    expiring: { it: "Lock in scadenza", zh: "锁库将过期" },
    paid: { it: "Pagati", zh: "已付款" },
    pending_payment: { it: "Da pagare", zh: "待付款" },
    processing: { it: "Picking", zh: "处理中" },
    refunded: { it: "Rimborsi", zh: "退款" },
    shipped: { it: "Spediti", zh: "已发货" },
  };

  return labels[filter][locale];
}

function getNextActionLabel(action: AdminOrderNextAction | null, locale: Locale) {
  if (!action) return locale === "it" ? "Nessuna" : "暂无";

  const labels: Record<AdminOrderNextAction, Record<Locale, string>> = {
    confirm_bank_transfer: { it: "Conferma bonifico", zh: "确认转账" },
    confirm_card_payment: { it: "Conferma carta", zh: "确认银行卡" },
    confirm_cash: { it: "Conferma contanti", zh: "确认现金" },
    confirm_order: { it: "Conferma ordine", zh: "确认订单" },
    complete_order: { it: "Completa", zh: "完成订单" },
    refund_order: { it: "Rimborso", zh: "退款" },
    ship_order: { it: "Spedisci", zh: "发货" },
    start_processing: { it: "Picking", zh: "备货" },
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

function buildOrdersHref(
  locale: Locale,
  result: Pick<AdminOrderListResult, "filter" | "q" | "pageSize">,
  page: number,
) {
  const params = new URLSearchParams();
  if (result.filter !== "all") params.set("filter", result.filter);
  if (result.q) params.set("q", result.q);
  if (page > 1) params.set("page", String(page));
  if (result.pageSize !== 20) params.set("pageSize", String(result.pageSize));
  const query = params.toString();
  return `${localizePath(locale, "/admin/orders")}${query ? `?${query}` : ""}`;
}

function formatDateTime(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === "it" ? "it-IT" : "zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  });
}
