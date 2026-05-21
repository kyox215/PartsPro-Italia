export type AdminIcon =
  | "activity"
  | "boxes"
  | "building"
  | "clipboard"
  | "file"
  | "home"
  | "package"
  | "settings"
  | "shopping"
  | "user"
  | "users"
  | "warehouse";

export type AdminNavItem = {
  href: string;
  label: string;
  description?: string;
  icon: AdminIcon;
  badge?: string | number;
  children?: AdminNavItem[];
};
