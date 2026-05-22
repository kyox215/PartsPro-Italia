import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'

export const partsProTheme: ThemeConfig = {
  token: {
    colorPrimary: '#2563EB',
    colorInfo: '#2563EB',
    colorSuccess: '#16A34A',
    colorWarning: '#F97316',
    colorError: '#DC2626',
    colorBgLayout: '#F8FAFC',
    colorBgContainer: '#FFFFFF',
    colorText: '#111827',
    colorTextSecondary: '#6B7280',
    colorBorder: '#E5E7EB',
    borderRadius: 8,
    fontSize: 14,
    fontFamily:
      'Inter, Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Input: {
      controlHeight: 44,
    },
    Select: {
      controlHeight: 44,
    },
    Card: {
      borderRadiusLG: 12,
    },
  },
}
