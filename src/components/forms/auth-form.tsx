"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  signInAction,
  signUpAction,
  type AuthResultCode,
} from "@/lib/auth/actions";
import type { Dictionary, Locale } from "@/types";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "../ui/toast";

type AuthFormProps = Readonly<{
  mode: "login" | "register";
  locale: Locale;
  copy: Dictionary["auth"];
}>;

type ValidationCopy = Dictionary["auth"]["validation"];

type AuthFormValues = {
  email: string;
  password: string;
  fullName?: string;
};

function createAuthFormSchema(copy: ValidationCopy) {
  return z.object({
    email: z.string().trim().email(copy.email),
    password: z.string().min(6, copy.password),
    fullName: z.string().trim().max(80, copy.fullName).optional(),
  });
}

export function AuthForm({ mode, locale, copy }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const schema = React.useMemo(
    () => createAuthFormSchema(copy.validation),
    [copy.validation],
  );
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  const variantCopy = mode === "login" ? copy.login : copy.register;

  function onSubmit(values: AuthFormValues) {
    startTransition(async () => {
      const result =
        mode === "login"
          ? await signInAction(locale, values, searchParams.get("next"))
          : await signUpAction(locale, values);

      if (!result.ok) {
        showAuthToast("error", copy, result.code);
        return;
      }

      showAuthToast("success", copy, result.code);
      router.replace(result.redirectTo);
      router.refresh();
    });
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      {mode === "register" ? (
        <FieldGroup
          error={form.formState.errors.fullName?.message}
          icon={<UserRound className="size-4" aria-hidden="true" />}
          label={copy.fields.fullName}
        >
          <Input
            autoComplete="name"
            isInvalid={Boolean(form.formState.errors.fullName)}
            placeholder={copy.fields.fullNamePlaceholder}
            {...form.register("fullName")}
          />
        </FieldGroup>
      ) : null}

      <FieldGroup
        error={form.formState.errors.email?.message}
        icon={<Mail className="size-4" aria-hidden="true" />}
        label={copy.fields.email}
      >
        <Input
          autoComplete="email"
          inputMode="email"
          isInvalid={Boolean(form.formState.errors.email)}
          placeholder={copy.fields.emailPlaceholder}
          type="email"
          {...form.register("email")}
        />
      </FieldGroup>

      <FieldGroup
        error={form.formState.errors.password?.message}
        icon={<LockKeyhole className="size-4" aria-hidden="true" />}
        label={copy.fields.password}
      >
        <div className="relative">
          <Input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="pr-10"
            isInvalid={Boolean(form.formState.errors.password)}
            placeholder={copy.fields.passwordPlaceholder}
            type={showPassword ? "text" : "password"}
            {...form.register("password")}
          />
          <Button
            aria-label={
              showPassword ? copy.fields.hidePassword : copy.fields.showPassword
            }
            className="absolute top-1 right-1"
            onClick={() => setShowPassword((current) => !current)}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            {showPassword ? (
              <EyeOff className="size-3.5" aria-hidden="true" />
            ) : (
              <Eye className="size-3.5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </FieldGroup>

      <Button className="mt-1 w-full" loading={isPending} type="submit">
        {isPending ? variantCopy.submitting : variantCopy.submit}
      </Button>
    </form>
  );
}

function FieldGroup({
  children,
  error,
  icon,
  label,
}: Readonly<{
  children: React.ReactNode;
  error?: string;
  icon: React.ReactNode;
  label: string;
}>) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span className="flex items-center gap-1.5 text-foreground">
        {icon}
        {label}
      </span>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

function showAuthToast(
  variant: "success" | "error",
  copy: Dictionary["auth"],
  code: AuthResultCode,
) {
  toast({
    variant,
    title: copy.toast[code].title,
    description: copy.toast[code].description,
  });
}
