"use client";

import { useMemo, useState } from "react";
import type { AdminProductRow } from "@/lib/admin-products";
import type { Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

export function AdminProductInlineTable({
  rows,
  locale,
  returnTo,
  csrfToken,
}: Readonly<{
  rows: AdminProductRow[];
  locale: Locale;
  returnTo: string;
  csrfToken: string;
}>) {
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const dirtyValue = useMemo(() => [...dirtyIds].join(","), [dirtyIds]);

  function markDirty(id: string) {
    setDirtyIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }

  return (
    <form action="/api/admin/products/inline-update" method="post" className="relative">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="rowCount" value={rows.length} />
      <input type="hidden" name="dirtyIds" value={dirtyValue} />

      {dirtyIds.size > 0 ? (
        <div className="sticky top-[68px] z-10 mb-3 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 shadow-sm">
          <p className="text-sm font-black text-blue-900">
            {locale === "it"
              ? `${dirtyIds.size} righe modificate`
              : `已修改 ${dirtyIds.size} 行，尚未保存`}
          </p>
          <button
            className="h-9 rounded-lg bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700"
            type="submit"
          >
            {locale === "it" ? "Salva pagina" : "保存当前页"}
          </button>
        </div>
      ) : null}

      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[1280px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="px-3 py-3">SKU</th>
              <th className="px-3 py-3">{locale === "it" ? "Nome IT" : "意文名"}</th>
              <th className="px-3 py-3">中文名</th>
              <th className="px-3 py-3">{locale === "it" ? "Brand" : "品牌"}</th>
              <th className="px-3 py-3">{locale === "it" ? "Modello" : "型号"}</th>
              <th className="px-3 py-3">{locale === "it" ? "Retail" : "零售价"}</th>
              <th className="px-3 py-3">{locale === "it" ? "Wholesale" : "批发价"}</th>
              <th className="px-3 py-3">MOQ</th>
              <th className="px-3 py-3">{locale === "it" ? "Immagine" : "图片 URL"}</th>
              <th className="px-3 py-3">{locale === "it" ? "Online" : "上架"}</th>
              <th className="px-3 py-3">{locale === "it" ? "Stock" : "库存"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={row.skuId} className="align-top hover:bg-blue-50/40">
                <td className="px-3 py-3">
                  <input type="hidden" name={`row:${index}:productId`} value={row.productId} />
                  <input type="hidden" name={`row:${index}:skuId`} value={row.skuId} />
                  <input type="hidden" name={`row:${index}:slug`} value={row.slug} />
                  <input type="hidden" name={`row:${index}:sku`} value={row.sku} />
                  <input type="hidden" name={`row:${index}:barcodeEan13`} value={row.barcodeEan13 ?? ""} />
                  <input type="hidden" name={`row:${index}:category`} value={row.category} />
                  <input type="hidden" name={`row:${index}:qualityGrade`} value={row.qualityGrade} />
                  <input type="hidden" name={`row:${index}:color`} value={row.color ?? ""} />
                  <input type="hidden" name={`row:${index}:costPrice`} value={row.costPrice ?? ""} />
                  <input type="hidden" name={`row:${index}:descriptionIt`} value={row.descriptionIt ?? ""} />
                  <input type="hidden" name={`row:${index}:descriptionZh`} value={row.descriptionZh ?? ""} />
                  <input type="hidden" name={`row:${index}:compatibility`} value={row.compatibility.join(", ")} />
                  <input type="hidden" name={`row:${index}:attributes`} value="" />
                  <p className="font-mono text-xs font-black text-slate-900">{row.sku}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {row.barcodeEan13 ?? "-"}
                  </p>
                </td>
                <EditableCell name={`row:${index}:nameIt`} value={row.nameIt} onDirty={() => markDirty(row.skuId)} />
                <EditableCell name={`row:${index}:nameZh`} value={row.nameZh} onDirty={() => markDirty(row.skuId)} />
                <EditableCell name={`row:${index}:brand`} value={row.brand} onDirty={() => markDirty(row.skuId)} width="w-28" />
                <EditableCell name={`row:${index}:model`} value={row.model} onDirty={() => markDirty(row.skuId)} width="w-28" />
                <EditableCell name={`row:${index}:retailPrice`} value={String(row.retailPrice)} onDirty={() => markDirty(row.skuId)} type="number" width="w-24" />
                <EditableCell name={`row:${index}:b2bPrice`} value={String(row.b2bPrice)} onDirty={() => markDirty(row.skuId)} type="number" width="w-24" />
                <EditableCell name={`row:${index}:moq`} value={String(row.moq)} onDirty={() => markDirty(row.skuId)} type="number" width="w-20" />
                <EditableCell name={`row:${index}:imageUrl`} value={row.imageUrl ?? ""} onDirty={() => markDirty(row.skuId)} width="w-56" />
                <td className="px-3 py-3">
                  <select
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-900 outline-none focus:border-blue-300"
                    defaultValue={row.isActive ? "true" : "false"}
                    name={`row:${index}:isActive`}
                    onChange={() => markDirty(row.skuId)}
                  >
                    <option value="true">{locale === "it" ? "Online" : "上架"}</option>
                    <option value="false">{locale === "it" ? "Archivio" : "下架"}</option>
                  </select>
                </td>
                <td className="px-3 py-3 text-xs font-semibold text-slate-500">
                  <p>{locale === "it" ? "Fisico" : "现货"} {row.stockOnHand}</p>
                  <p>{locale === "it" ? "In arrivo" : "在途"} {row.incomingQty}</p>
                  <p className="mt-1 font-black text-slate-700">{formatMoney(row.b2bPrice, locale)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}

function EditableCell({
  name,
  value,
  onDirty,
  type = "text",
  width = "w-48",
}: Readonly<{
  name: string;
  value: string;
  onDirty: () => void;
  type?: "text" | "number";
  width?: string;
}>) {
  return (
    <td className="px-3 py-3">
      <input
        className={`${width} rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100`}
        defaultValue={value}
        name={name}
        onChange={onDirty}
        step={type === "number" ? "0.01" : undefined}
        type={type}
      />
    </td>
  );
}
