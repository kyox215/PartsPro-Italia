export type WorkspaceIcon =
  | "activity"
  | "boxes"
  | "building"
  | "clipboard"
  | "file"
  | "home"
  | "package"
  | "rma"
  | "settings"
  | "shopping"
  | "user"
  | "users"
  | "warehouse";

export type WorkspaceNavItem = {
  href: string;
  label: string;
  description?: string;
  icon: WorkspaceIcon;
};
