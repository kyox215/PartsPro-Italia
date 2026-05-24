"use client";

import { Eye, Pencil, RefreshCw, Upload } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

type AdminActionLabels = Readonly<{
  cancel: string;
  confirm: string;
  confirmDescription: string;
  confirmTitle: string;
  toastDescription: string;
  toastTitle: string;
}>;

type AdminActionButtonProps = Readonly<{
  action: "view" | "edit" | "export" | "sync";
  children: React.ReactNode;
  labels: AdminActionLabels;
  confirm?: boolean;
  variant?: "default" | "outline" | "ghost" | "soft";
}>;

const actionIcon = {
  edit: Pencil,
  export: Upload,
  sync: RefreshCw,
  view: Eye,
};

export function AdminActionButton({
  action,
  children,
  confirm = false,
  labels,
  variant = "outline",
}: AdminActionButtonProps) {
  const Icon = actionIcon[action];

  function completeAction() {
    toast({
      title: labels.toastTitle,
      description: labels.toastDescription,
      variant: "success",
    });
  }

  if (!confirm) {
    return (
      <Button onClick={completeAction} size="sm" type="button" variant={variant}>
        <Icon aria-hidden="true" />
        {children}
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger
        className={buttonVariants({ size: "sm", variant })}
        type="button"
      >
        <Icon aria-hidden="true" />
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.confirmTitle}</DialogTitle>
          <DialogDescription>{labels.confirmDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            className={buttonVariants({ variant: "outline" })}
            type="button"
          >
            {labels.cancel}
          </DialogClose>
          <DialogClose
            className={buttonVariants()}
            onClick={completeAction}
            type="button"
          >
            {labels.confirm}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
