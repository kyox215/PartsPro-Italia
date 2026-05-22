import type { ThemeConfig } from "antd";

export const ADMIN_PRIMARY_COLOR = "#1677ff";

export const adminTheme: ThemeConfig = {
  cssVar: {
    prefix: "partspro-admin",
  },
  hashed: true,
  token: {
    colorPrimary: ADMIN_PRIMARY_COLOR,
    borderRadius: 8,
    colorBgLayout: "#f5f7fb",
    colorInfo: ADMIN_PRIMARY_COLOR,
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    wireframe: false,
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      fontWeight: 700,
    },
    Card: {
      borderRadiusLG: 8,
      headerFontSize: 15,
    },
    Drawer: {
      borderRadiusLG: 8,
    },
    Form: {
      labelFontSize: 13,
      verticalLabelPadding: "0 0 6px",
    },
    Menu: {
      itemBorderRadius: 8,
      itemHeight: 42,
      itemMarginInline: 0,
      itemPaddingInline: 12,
    },
    Modal: {
      borderRadiusLG: 8,
    },
    Table: {
      borderRadius: 8,
      cellPaddingBlock: 12,
      cellPaddingInline: 14,
      headerBg: "#f8fafc",
      headerColor: "#334155",
    },
    Tag: {
      borderRadiusSM: 999,
      defaultBg: "#f8fafc",
    },
  },
};
