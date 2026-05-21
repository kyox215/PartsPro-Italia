"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Mode = "arrived" | "missing" | "short";

export function InventoryMissingControls({
  name,
  remainingQty,
  locale,
}: Readonly<{
  name: string;
  remainingQty: number;
  locale: "it" | "zh";
}>) {
  const [mode, setMode] = useState<Mode>("arrived");
  const [shortQty, setShortQty] = useState(1);
  const missingQty =
    mode === "missing"
      ? remainingQty
      : mode === "short"
        ? Math.min(Math.max(shortQty, 0), remainingQty)
        : 0;

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={missingQty} />
      <div className="flex flex-wrap items-center gap-1.5">
        <ControlButton active={mode === "arrived"} onClick={() => setMode("arrived")}>
          {locale === "it" ? "Arrivato" : "到货"}
        </ControlButton>
        <ControlButton active={mode === "missing"} onClick={() => setMode("missing")}>
          {locale === "it" ? "Manca tutto" : "未到"}
        </ControlButton>
        <ControlButton active={mode === "short"} onClick={() => setMode("short")}>
          {locale === "it" ? "Manca parziale" : "少到"}
        </ControlButton>
      </div>
      {mode === "short" ? (
        <label className="flex max-w-48 items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-2 py-1.5">
          <span className="shrink-0 text-[11px] font-black text-amber-700">
            {locale === "it" ? "Mancano" : "缺少"}
          </span>
          <input
            className="h-8 w-20 rounded-md border border-amber-200 bg-white px-2 text-sm font-black text-stone-950 outline-none focus:border-amber-500"
            min={0}
            max={remainingQty}
            onChange={(event) => setShortQty(Number(event.target.value || 0))}
            type="number"
            value={shortQty}
          />
          <span className="text-[11px] font-semibold text-amber-700">
            / {remainingQty}
          </span>
        </label>
      ) : null}
      <p className="text-[11px] font-semibold leading-4 text-stone-500">
        {missingQty > 0
          ? locale === "it"
            ? `${remainingQty - missingQty} ricevuti, ${missingQty} mancanti`
            : `实收 ${remainingQty - missingQty}，缺货 ${missingQty}`
          : locale === "it"
            ? `${remainingQty} ricevuti`
            : `默认实收 ${remainingQty}`}
      </p>
    </div>
  );
}

function ControlButton({
  active,
  children,
  onClick,
}: Readonly<{
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}>) {
  return (
    <button
      className={cn(
        "h-8 rounded-md border px-2.5 text-xs font-black transition",
        active
          ? "border-stone-950 bg-stone-950 text-white"
          : "border-black/10 bg-white text-stone-600 hover:border-black/20 hover:text-stone-950",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
