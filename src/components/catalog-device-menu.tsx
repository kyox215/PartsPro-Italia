"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { BrandModelGroup, CatalogSearchState } from "@/lib/catalog-page";
import { type Locale, localizePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type CatalogDeviceMenuProps = Readonly<{
  brandModelGroups: BrandModelGroup[];
  state: CatalogSearchState;
  locale: Locale;
}>;

export function CatalogDeviceMenu({
  brandModelGroups,
  state,
  locale,
}: CatalogDeviceMenuProps) {
  const initialOpenBrands = useMemo(() => {
    if (!state.brand && !state.model && brandModelGroups.length > 0) {
      return { [brandModelGroups[0].value]: true };
    }

    return Object.fromEntries(
      brandModelGroups
        .filter((group) => group.active)
        .map((group) => [group.value, true]),
    );
  }, [brandModelGroups, state.brand, state.model]);

  const [openBrands, setOpenBrands] =
    useState<Record<string, boolean>>(initialOpenBrands);

  if (brandModelGroups.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-slate-950">
          {locale === "it" ? "Dispositivi" : "品牌 / 型号"}
        </h3>
        {state.brand || state.model ? (
          <Link
            href={productsHref(
              locale,
              catalogStateToParams(state, {
                brand: "",
                model: "",
                page: 1,
              }),
            )}
            className="text-xs font-bold text-blue-700 hover:text-blue-900"
          >
            {locale === "it" ? "Tutti" : "全部"}
          </Link>
        ) : null}
      </div>

      <div className="mt-3 max-h-[calc(100dvh-220px)] space-y-1 overflow-auto pr-1 lg:max-h-[calc(100dvh-180px)]">
        {brandModelGroups.map((group) => {
          const isOpen = openBrands[group.value] ?? false;

          return (
            <div key={group.value} className="rounded-lg">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-current={group.active ? "true" : undefined}
                onClick={() =>
                  setOpenBrands((current) => ({
                    ...current,
                    [group.value]: !isOpen,
                  }))
                }
                className={cn(
                  "grid min-h-10 w-full grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-black transition",
                  group.active
                    ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200"
                    : "text-slate-700 hover:bg-slate-50 hover:text-blue-700",
                )}
              >
                <span className="truncate">{group.label}</span>
                <span className="rounded-md bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                  {group.count}
                </span>
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 text-slate-400 transition",
                    isOpen && "rotate-90 text-blue-500",
                  )}
                />
              </button>

              {isOpen ? (
                <div className="ml-3 mt-1 space-y-1 border-l border-slate-200 pl-2">
                  <Link
                    href={productsHref(
                      locale,
                      catalogStateToParams(state, {
                        brand: group.value,
                        model: "",
                        page: 1,
                      }),
                    )}
                    className={cn(
                      "grid min-h-8 grid-cols-[1fr_auto] items-center gap-2 rounded-md px-2.5 py-1 text-xs font-bold transition",
                      group.active && !state.model
                        ? "bg-slate-900 text-white"
                        : "text-blue-700 hover:bg-blue-50",
                    )}
                  >
                    <span>
                      {locale === "it"
                        ? `Tutti ${group.label}`
                        : `${group.label} 全部型号`}
                    </span>
                    <span>{group.count}</span>
                  </Link>

                  {group.models.map((model) => (
                    <Link
                      key={model.value}
                      href={productsHref(
                        locale,
                        catalogStateToParams(state, {
                          brand: group.value,
                          model: model.value,
                          page: 1,
                        }),
                      )}
                      aria-current={model.active ? "true" : undefined}
                      className={cn(
                        "grid min-h-8 grid-cols-[1fr_auto] items-center gap-2 rounded-md px-2.5 py-1 text-xs transition",
                        model.active
                          ? "bg-slate-900 font-bold text-white"
                          : "text-slate-600 hover:bg-slate-50 hover:text-blue-700",
                      )}
                    >
                      <span className="truncate">{model.label}</span>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-xs font-semibold",
                          model.active
                            ? "bg-white/15 text-white"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {model.count}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function productsHref(locale: Locale, params: URLSearchParams) {
  const query = params.toString();
  return `${localizePath(locale, "/products")}${query ? `?${query}` : ""}`;
}

function catalogStateToParams(
  state: CatalogSearchState,
  overrides: Partial<CatalogSearchState> = {},
) {
  const nextState = { ...state, ...overrides };
  const params = new URLSearchParams();
  appendParam(params, "q", nextState.q);
  appendParam(params, "brand", nextState.brand);
  appendParam(params, "model", nextState.model);
  appendParam(params, "category", nextState.category);
  appendParam(params, "quality", nextState.quality);
  appendParam(params, "availability", nextState.availability);
  appendParam(params, "minPrice", nextState.minPrice);
  appendParam(params, "maxPrice", nextState.maxPrice);
  appendParam(params, "sort", nextState.sort === "relevance" ? "" : nextState.sort);
  appendParam(params, "page", nextState.page > 1 ? String(nextState.page) : "");

  Object.entries(nextState.attrs).forEach(([key, values]) => {
    values.forEach((value) => appendParam(params, `attr_${key}`, value));
  });

  return params;
}

function appendParam(params: URLSearchParams, key: string, value: string | undefined) {
  if (value) params.append(key, value);
}
