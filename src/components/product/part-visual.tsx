import { Battery, Camera, Cable, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";
import type { HomeProduct } from "@/lib/home-data";

type PartVisualProps = Readonly<{
  variant: HomeProduct["visual"];
  className?: string;
}>;

export function PartVisual({ variant, className }: PartVisualProps) {
  return (
    <div
      className={cn(
        "relative flex aspect-square min-h-16 w-full items-center justify-center overflow-hidden rounded-lg border border-primary-border/70 bg-primary-soft",
        className,
      )}
    >
      <div className="absolute inset-x-3 top-3 h-px bg-white/80" />
      <div className="absolute inset-x-4 bottom-3 h-px bg-primary-border" />
      {variant === "screen" ? <ScreenVisual /> : null}
      {variant === "battery" ? <BatteryVisual /> : null}
      {variant === "port" ? <PortVisual /> : null}
      {variant === "camera" ? <CameraVisual /> : null}
    </div>
  );
}

function ScreenVisual() {
  return (
    <div className="relative h-[72%] w-[42%] rounded-md border border-slate-950 bg-slate-950 shadow-[var(--shadow-sm)]">
      <div className="absolute inset-1 rounded-sm bg-[linear-gradient(160deg,#111827_0%,#312E81_55%,#EC4899_100%)]" />
      <Smartphone
        className="absolute -right-5 bottom-1 size-7 text-primary"
        aria-hidden="true"
      />
    </div>
  );
}

function BatteryVisual() {
  return (
    <div className="relative h-[68%] w-[46%] rounded-md border border-slate-800 bg-slate-900 p-1 shadow-[var(--shadow-sm)]">
      <div className="absolute -top-1 left-1/2 h-1.5 w-5 -translate-x-1/2 rounded-t bg-slate-800" />
      <div className="h-full rounded-sm border border-slate-700 bg-slate-800 p-1">
        <div className="h-full rounded-sm bg-[linear-gradient(180deg,#22C55E_0%,#16A34A_72%,#0F172A_72%)]" />
      </div>
      <Battery
        className="absolute -right-5 bottom-1 size-7 text-success"
        aria-hidden="true"
      />
    </div>
  );
}

function PortVisual() {
  return (
    <div className="relative h-[62%] w-[62%] rounded-md border border-slate-300 bg-white p-2 shadow-[var(--shadow-sm)]">
      <div className="grid h-full grid-cols-2 gap-1">
        <span className="rounded bg-slate-800" />
        <span className="rounded bg-slate-200" />
        <span className="rounded bg-slate-200" />
        <span className="rounded bg-primary" />
      </div>
      <Cable
        className="absolute -right-4 -bottom-1 size-8 rotate-12 text-primary"
        aria-hidden="true"
      />
    </div>
  );
}

function CameraVisual() {
  return (
    <div className="relative grid size-[62%] grid-cols-2 gap-2 rounded-md border border-slate-300 bg-white p-2 shadow-[var(--shadow-sm)]">
      <span className="rounded-full border-[5px] border-slate-900 bg-cyan" />
      <span className="rounded-full border-[5px] border-slate-900 bg-primary" />
      <span className="col-span-2 rounded bg-slate-200" />
      <Camera
        className="absolute -right-4 -bottom-2 size-8 text-slate-700"
        aria-hidden="true"
      />
    </div>
  );
}
