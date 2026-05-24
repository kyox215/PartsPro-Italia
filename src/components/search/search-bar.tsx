"use client";

import { useRouter } from "next/navigation";
import { Camera, Search, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

type SearchBarProps = Readonly<{
  placeholder: string;
  buttonLabel: string;
  cameraLabel: string;
  clearLabel: string;
  toastTitle: string;
  toastDescription: string;
  action: string;
}>;

export function SearchBar({
  action,
  placeholder,
  buttonLabel,
  cameraLabel,
  clearLabel,
  toastTitle,
  toastDescription,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();

    toast({
      variant: "info",
      title: toastTitle,
      description: normalizedQuery
        ? `${toastDescription}: ${normalizedQuery}`
        : toastDescription,
    });
    router.push(
      normalizedQuery ? `${action}?q=${encodeURIComponent(normalizedQuery)}` : action,
    );
  }

  return (
    <form
      className="flex w-full min-w-0 items-center gap-2 rounded-lg border border-primary-border bg-surface p-1.5 shadow-[var(--shadow-xs)]"
      onSubmit={submitSearch}
    >
      <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
      <Input
        className="h-9 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        value={query}
      />
      {query ? (
        <Button
          aria-label={clearLabel}
          onClick={() => setQuery("")}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" />
        </Button>
      ) : null}
      <Button aria-label={cameraLabel} size="icon-sm" type="button" variant="soft">
        <Camera aria-hidden="true" />
      </Button>
      <Button className="hidden sm:inline-flex" type="submit">
        {buttonLabel}
      </Button>
    </form>
  );
}
