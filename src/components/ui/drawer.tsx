"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Dialog as DrawerPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const Drawer = DrawerPrimitive.Root;
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

type DrawerSide = "top" | "right" | "bottom" | "left";

const drawerSideClassName: Record<DrawerSide, string> = {
  top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
  right:
    "inset-y-0 right-0 h-full w-[min(420px,calc(100vw-1rem))] border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
  bottom:
    "inset-x-0 bottom-0 max-h-[88svh] rounded-t-lg border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
  left: "inset-y-0 left-0 h-full w-[min(360px,calc(100vw-1rem))] border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
};

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  side?: DrawerSide;
  showCloseButton?: boolean;
}) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover p-4 text-popover-foreground shadow-[var(--shadow-modal)] transition-[transform,opacity] ease-[var(--ease-out)] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:duration-[var(--motion-normal)] data-[state=open]:duration-[var(--motion-slow)]",
          drawerSideClassName[side],
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DrawerPrimitive.Close className="absolute top-4 right-4 rounded-md text-muted-foreground opacity-80 transition-opacity hover:text-foreground hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DrawerPrimitive.Close>
        ) : null}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-1.5 pr-8 text-left", className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 sm:flex-row", className)}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-base font-semibold leading-6", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
