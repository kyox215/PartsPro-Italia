# PartsPro - COMPONENTS.md

## 1. 组件原则

所有组件必须：

- 使用 TypeScript
- 使用 TailwindCSS
- 基于 shadcn/ui + Radix UI
- 支持响应式
- 支持 loading / disabled / error 状态
- 关键操作支持 Toast
- 视觉遵循 DESIGN_TOKENS.md

---

## 2. 基础组件

| Component | Path | 说明 |
|---|---|---|
| Button | `src/components/ui/button.tsx` | Primary / Secondary / Ghost / Danger / Icon |
| Input | `src/components/ui/input.tsx` | 默认输入框 |
| Textarea | `src/components/ui/textarea.tsx` | 多行输入 |
| Select | `src/components/ui/select.tsx` | 下拉选择 |
| Badge | `src/components/ui/badge.tsx` | 状态标签 |
| Card | `src/components/ui/card.tsx` | 卡片 |
| Dialog | `src/components/ui/dialog.tsx` | 弹窗 |
| Drawer | `src/components/ui/drawer.tsx` | 移动端抽屉 |
| Toast | `src/components/ui/toast.tsx` | 提示 |
| Skeleton | `src/components/ui/skeleton.tsx` | 骨架屏 |
| Tooltip | `src/components/ui/tooltip.tsx` | 提示 |
| Tabs | `src/components/ui/tabs.tsx` | Tab |
| Pagination | `src/components/ui/pagination.tsx` | 分页 |
| Progress | `src/components/ui/progress.tsx` | 进度 |

---

## 3. Layout 组件

| Component | Path | 说明 |
|---|---|---|
| SiteHeader | `src/components/layout/site-header.tsx` | 前台顶部 |
| SiteFooter | `src/components/layout/site-footer.tsx` | 前台底部 |
| MobileBottomNav | `src/components/layout/mobile-bottom-nav.tsx` | 移动端底部导航 |
| MobileDrawer | `src/components/layout/mobile-drawer.tsx` | 移动端菜单 |
| AdminSidebar | `src/components/admin/admin-sidebar.tsx` | 后台侧边栏 |
| AdminTopbar | `src/components/admin/admin-topbar.tsx` | 后台顶部 |
| PageShell | `src/components/layout/page-shell.tsx` | 页面容器 |

---

## 4. 商品组件

| Component | Path | 说明 |
|---|---|---|
| ProductCard | `src/components/product/product-card.tsx` | 桌面商品卡 |
| ProductCompactCard | `src/components/product/product-compact-card.tsx` | 移动端高密度商品卡 |
| ProductGrid | `src/components/product/product-grid.tsx` | 商品网格 |
| ProductList | `src/components/product/product-list.tsx` | 商品列表 |
| ProductGallery | `src/components/product/product-gallery.tsx` | 商品图片 |
| ProductPrice | `src/components/product/product-price.tsx` | 价格 |
| StockBadge | `src/components/product/stock-badge.tsx` | 库存标签 |
| QualityBadge | `src/components/product/quality-badge.tsx` | 质量等级 |
| QuantityStepper | `src/components/product/quantity-stepper.tsx` | 数量选择 |
| AddToCartButton | `src/components/product/add-to-cart-button.tsx` | 加购 |
| CompatibilityTable | `src/components/product/compatibility-table.tsx` | 兼容型号 |

---

## 5. 搜索与筛选组件

| Component | Path | 说明 |
|---|---|---|
| SearchBar | `src/components/search/search-bar.tsx` | 搜索框 |
| MobileSearchBar | `src/components/search/mobile-search-bar.tsx` | 移动端 sticky search |
| FilterDrawer | `src/components/search/filter-drawer.tsx` | 移动端筛选 |
| FilterSidebar | `src/components/search/filter-sidebar.tsx` | 桌面筛选 |
| SortSelect | `src/components/search/sort-select.tsx` | 排序 |
| ActiveFilters | `src/components/search/active-filters.tsx` | 已选筛选 |

---

## 6. 购物车组件

| Component | Path | 说明 |
|---|---|---|
| CartDrawer | `src/components/cart/cart-drawer.tsx` | 购物车抽屉 |
| CartItem | `src/components/cart/cart-item.tsx` | 购物车商品 |
| CartSummary | `src/components/cart/cart-summary.tsx` | 订单摘要 |
| MiniCartButton | `src/components/cart/mini-cart-button.tsx` | 顶部购物车 |
| CheckoutButton | `src/components/cart/checkout-button.tsx` | 结账按钮 |

---

## 7. B2B 组件

| Component | Path | 说明 |
|---|---|---|
| B2BRegisterForm | `src/components/b2b/b2b-register-form.tsx` | B2B 注册 |
| B2BRegisterStepper | `src/components/b2b/b2b-register-stepper.tsx` | 分步注册 |
| CompanyFields | `src/components/b2b/company-fields.tsx` | 公司信息 |
| VATFields | `src/components/b2b/vat-fields.tsx` | VAT/SDI/PEC |
| B2BBenefitsCard | `src/components/b2b/b2b-benefits-card.tsx` | B2B 优势 |

---

## 8. Admin 组件

| Component | Path | 说明 |
|---|---|---|
| DashboardMetricCard | `src/components/admin/dashboard-metric-card.tsx` | KPI |
| AdminDataTable | `src/components/admin/admin-data-table.tsx` | TanStack Table |
| ProductForm | `src/components/admin/product-form.tsx` | 商品表单 |
| SKUForm | `src/components/admin/sku-form.tsx` | SKU 表单 |
| InventoryAdjustDialog | `src/components/admin/inventory-adjust-dialog.tsx` | 库存调整 |
| OrderStatusBadge | `src/components/admin/order-status-badge.tsx` | 订单状态 |
| CustomerTypeBadge | `src/components/admin/customer-type-badge.tsx` | 客户类型 |
| BulkActionBar | `src/components/admin/bulk-action-bar.tsx` | 批量操作 |
| ConfirmDialog | `src/components/admin/confirm-dialog.tsx` | 删除确认 |

---

## 9. 图表组件

| Component | Path | 说明 |
|---|---|---|
| SalesChart | `src/components/charts/sales-chart.tsx` | 销售趋势 |
| OrderStatusChart | `src/components/charts/order-status-chart.tsx` | 订单状态 |
| InventoryChart | `src/components/charts/inventory-chart.tsx` | 库存 |
| CategoryChart | `src/components/charts/category-chart.tsx` | 分类销售 |

---

## 10. Toast 使用规则

所有以下操作必须触发 Toast：

```txt
加购成功
加购失败
登录成功
登录失败
保存成功
保存失败
删除成功
删除失败
库存调整成功
订单状态更新成功
B2B申请提交成功
```

Toast 类型：

```txt
success
error
warning
info
```

---

## 11. 组件验收标准

每个组件必须：

- 有 TypeScript Props 类型
- 支持 className
- 支持 loading 状态
- 支持 disabled 状态
- 不写死文案，文案来自 i18n
- 移动端 360px 不溢出
- 与 DESIGN_TOKENS.md 一致
