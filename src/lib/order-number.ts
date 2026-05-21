export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

export function displayOrderNumber(order: {
  id: string;
  orderNumber?: string | null;
}, locale: "it" | "zh" = "zh") {
  return order.orderNumber || (locale === "it" ? "Numero in generazione" : "订单号待生成");
}

export function orderRouteId(order: { id: string; orderNumber?: string | null }) {
  return encodeURIComponent(order.orderNumber || order.id);
}

export function shortInternalOrderId(value: string) {
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}
