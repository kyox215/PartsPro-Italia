"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle, AlertTriangle } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";

import { motionEase, motionTimings } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

const ToastProvider = ToastPrimitive.Provider;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border bg-popover p-3 pr-9 text-popover-foreground shadow-[var(--shadow-modal)] transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full data-[swipe=move]:transition-none",
  {
    variants: {
      variant: {
        default: "border-border",
        success: "border-success/20 bg-success/10 text-foreground",
        warning: "border-warning/25 bg-warning/10 text-foreground",
        error: "border-destructive/20 bg-destructive/10 text-foreground",
        info: "border-info/20 bg-info/10 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const toastIconMap = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

function ToastViewport({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "fixed top-16 right-3 left-3 z-[80] flex max-h-screen w-auto flex-col gap-2 outline-none sm:top-auto sm:right-4 sm:bottom-4 sm:left-auto sm:w-[calc(100%-2rem)] sm:max-w-sm",
        className,
      )}
      {...props}
    />
  );
}

function ToastRoot({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Root> &
  VariantProps<typeof toastVariants>) {
  const Icon = toastIconMap[variant ?? "default"];
  const shouldReduceMotion = useReducedMotion();

  const toastBody = (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          variant === "success" && "text-success",
          variant === "warning" && "text-warning",
          variant === "error" && "text-destructive",
          variant === "info" && "text-info",
          variant === "default" && "text-primary",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">{children}</div>
    </ToastPrimitive.Root>
  );

  if (shouldReduceMotion) {
    return toastBody;
  }

  return (
    <motion.div
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.98 }}
      initial={{ opacity: 0, x: 28, scale: 0.98 }}
      layout
      transition={{ duration: motionTimings.slow, ease: motionEase }}
    >
      {toastBody}
    </motion.div>
  );
}

function ToastAction({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Action>) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      className={cn(
        "inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface px-2 text-xs font-medium shadow-[var(--shadow-xs)] transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function ToastClose({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      className={cn(
        "absolute top-3 right-3 rounded-md text-muted-foreground opacity-80 transition-opacity hover:text-foreground hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:outline-none",
        className,
      )}
      data-toast-close=""
      {...props}
    >
      <X className="size-3.5" />
    </ToastPrimitive.Close>
  );
}

function ToastTitle({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Title>) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-sm font-semibold", className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Description>) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

type ToastProps = React.ComponentProps<typeof ToastRoot>;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

type ToastInput = Omit<ToasterToast, "id">;

type State = {
  toasts: ToasterToast[];
};

type Action =
  | {
      type: "ADD_TOAST";
      toast: ToasterToast;
    }
  | {
      type: "UPDATE_TOAST";
      toast: Partial<ToasterToast>;
    }
  | {
      type: "DISMISS_TOAST";
      toastId?: string;
    }
  | {
      type: "REMOVE_TOAST";
      toastId?: string;
    };

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

let count = 0;
let memoryState: State = { toasts: [] };
const listeners: Array<(state: State) => void> = [];

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((toastItem) =>
          toastItem.id === action.toast.id
            ? { ...toastItem, ...action.toast }
            : toastItem,
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toastItem) => {
          addToRemoveQueue(toastItem.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((toastItem) =>
          toastItem.id === toastId || toastId === undefined
            ? {
                ...toastItem,
                open: false,
              }
            : toastItem,
        ),
      };
    }

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }

      return {
        ...state,
        toasts: state.toasts.filter((toastItem) => toastItem.id !== action.toastId),
      };
  }
}

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function toast({ ...props }: ToastInput) {
  const id = genId();

  const update = (nextProps: ToastInput) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...nextProps, id },
    });

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
          dismiss();
        }
        props.onOpenChange?.(open);
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider swipeDirection="right">
      <AnimatePresence initial={false}>
        {toasts.map(({ id, title, description, action, ...props }) => (
          <ToastRoot key={id} {...props}>
            <div className="grid gap-1">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? (
                <ToastDescription>{description}</ToastDescription>
              ) : null}
            </div>
            {action}
            <ToastClose />
          </ToastRoot>
        ))}
      </AnimatePresence>
      <ToastViewport />
    </ToastProvider>
  );
}

export {
  ToastAction,
  ToastClose,
  ToastDescription,
  Toaster,
  ToastProvider,
  ToastRoot as Toast,
  ToastTitle,
  ToastViewport,
  toast,
  useToast,
};
export type { ToastInput, ToastProps };
